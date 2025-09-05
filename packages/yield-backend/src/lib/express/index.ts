import * as Sentry from '@sentry/node';
import cors from 'cors';
import express, { Express, NextFunction, Response } from 'express';

import { createVincentUserMiddleware } from '@lit-protocol/vincent-app-sdk/expressMiddleware';
import { getAppInfo, getPKPInfo, isAppUser } from '@lit-protocol/vincent-app-sdk/jwt';

import {
  handleCreateScheduleRoute,
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
const corsConfig = {
  maxAge: 86400,
  optionsSuccessStatus: 204,
  origin: IS_DEVELOPMENT ? true : [VERCEL_DOMAINS, ...CORS_ALLOWED_DOMAINS],
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
  app.use(express.json());

  if (IS_DEVELOPMENT) {
    serviceLogger.info(`CORS is disabled for development`);
  } else {
    serviceLogger.info(`Configuring CORS with allowed domains: ${CORS_ALLOWED_DOMAINS}`);
  }
  app.use(cors(corsConfig));

  app.get('/strategy/top', handleGetTopStrategyRoute);
  app.get('/swap', middleware, setSentryUserMiddleware, handler(handleListSwapsRoute));
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

  serviceLogger.info(`Routes registered`);
};
