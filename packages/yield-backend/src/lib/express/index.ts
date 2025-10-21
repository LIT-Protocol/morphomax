import * as Sentry from '@sentry/node';
import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

import { createVincentUserMiddleware } from '@lit-protocol/vincent-app-sdk/expressMiddleware';
import { getAppInfo, getPKPInfo, isAppUser } from '@lit-protocol/vincent-app-sdk/jwt';

import { handleGetMetricsRoute } from './metrics';
import { handleUpdateProfileRoute, handleGetProfileRoute } from './profile';
import {
  handleCreateScheduleRoute,
  handleGetScheduleBalancesRoute,
  handleGetScheduleBalancesRouteForGalxe,
  handleDeleteScheduleRoute,
  handleListSchedulesRoute,
  handleListScheduleSwapsRoute,
} from './schedules';
import { handleGetTopStrategyRoute } from './strategies';
import { handleListSwapsRoute } from './swaps';
import { userKey, VincentAuthenticatedRequest } from './types';
import { env } from '../env';
import { serviceLogger } from '../logger';

const { ALLOWED_AUDIENCE, CORS_ALLOWED_DOMAINS, IS_DEVELOPMENT, VINCENT_APP_ID } = env;

const { handler, middleware } = createVincentUserMiddleware({
  userKey,
  allowedAudience: ALLOWED_AUDIENCE,
  requiredAppId: VINCENT_APP_ID,
});

const VERCEL_DOMAINS = /^https:\/\/.*-lit-protocol\.vercel\.app$/;
const GALXE_DOMAIN = 'https://dashboard.galxe.com';
const corsConfig = {
  maxAge: 86400,
  optionsSuccessStatus: 204,
  origin: IS_DEVELOPMENT ? true : [VERCEL_DOMAINS, GALXE_DOMAIN, ...CORS_ALLOWED_DOMAINS],
};

const setSentryUserMiddleware = handler(
  (req: VincentAuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!isAppUser(req.user.decodedJWT)) {
      throw new Error('Vincent JWT is not an app user');
    }

    Sentry.setUser({
      app: getAppInfo(req.user.decodedJWT),
      ethAddress: getPKPInfo(req.user.decodedJWT).ethAddress,
    });
    next();
  }
);

export const registerRoutes = (app: Express) => {
  app.use(helmet());
  app.use(express.json());

  if (IS_DEVELOPMENT) {
    serviceLogger.info(`CORS is disabled for development`);
  } else {
    serviceLogger.info(`Configuring CORS with allowed domains: ${CORS_ALLOWED_DOMAINS}`);
  }
  app.use(cors(corsConfig));

  // Strategies
  app.get('/strategy/top', handleGetTopStrategyRoute);

  // Schedules
  app.get(
    '/schedule/balances',
    middleware,
    setSentryUserMiddleware,
    handler(handleGetScheduleBalancesRoute)
  );
  app.get('/schedule', middleware, setSentryUserMiddleware, handler(handleListSchedulesRoute));
  app.post('/schedule', middleware, setSentryUserMiddleware, handler(handleCreateScheduleRoute));
  app.get(
    '/schedule/:scheduleId/swaps',
    middleware,
    setSentryUserMiddleware,
    handler(handleListScheduleSwapsRoute)
  );
  app.delete(
    '/schedule/:scheduleId',
    middleware,
    setSentryUserMiddleware,
    handler(handleDeleteScheduleRoute)
  );
  app.get('/metrics', handleGetMetricsRoute);

  // Swaps
  app.get('/swap', middleware, setSentryUserMiddleware, handler(handleListSwapsRoute));

  // Profile
  app.post('/profile', middleware, setSentryUserMiddleware, handler(handleUpdateProfileRoute));
  app.get('/profile', middleware, setSentryUserMiddleware, handler(handleGetProfileRoute));

  // Galxe
  app.get(
    '/galxe/balances',
    (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2) {
        res.status(401).json({ error: `Invalid authorization header - expected "Bearer <token>"` });
        return;
      }

      const [scheme, token] = parts;
      if (!/^Bearer$/i.test(scheme)) {
        res.status(401).json({ error: `Expected "Bearer" scheme, got "${scheme}"` });
        return;
      }

      if (token !== env.GALXE_API_KEY) {
        res.status(401).json({ error: `Invalid authorization header - Authentication failed` });
        return;
      }

      next();
    },
    handleGetScheduleBalancesRouteForGalxe
  );

  // Errors
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    serviceLogger.error(err);
    Sentry.captureException(err);
    res.status(500).json({ error: (err as Error).message });
    next();
  });

  serviceLogger.info(`Routes registered`);
};
