import * as Sentry from '@sentry/react';
import React, { createContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import * as jwt from '@lit-protocol/vincent-app-sdk/jwt';

const { getAppInfo, getPKPInfo, verifyVincentAppUserJWT } = jwt;

import { env } from '@/config/env';
import { useVincentWebAuthClient } from '@/hooks/useVincentWebAuthClient';

const { VITE_APP_ID, VITE_EXPECTED_AUDIENCE } = env;
const APP_JWT_KEY = `${VITE_APP_ID}-jwt`;

export interface AuthInfo {
  jwt: string;
  pkp: IRelayPKP;
}

interface JwtContextType {
  authInfo: AuthInfo | null | undefined;
  logWithJwt: (token: string | null) => void;
  logOut: () => void;
}

export const JwtContext = createContext<JwtContextType>({
  authInfo: undefined,
  logWithJwt: () => {},
  logOut: () => {},
});

interface JwtProviderProps {
  children: ReactNode;
}

export const JwtProvider: React.FC<JwtProviderProps> = ({ children }) => {
  const vincentWebAuthClient = useVincentWebAuthClient();
  const [authInfo, setAuthInfo] = useState<AuthInfo | null | undefined>(undefined);

  const logOut = useCallback(() => {
    setAuthInfo(null);
    localStorage.removeItem(APP_JWT_KEY);
    vincentWebAuthClient.removeVincentJWTFromURI();
    Sentry.setUser({ app: null, ethAddress: null });
  }, [vincentWebAuthClient]);

  const logWithJwt = useCallback(async () => {
    const existingJwtStr = localStorage.getItem(APP_JWT_KEY);
    const didJustLogin = vincentWebAuthClient.uriContainsVincentJWT();

    if (didJustLogin) {
      try {
        const jwtResult =
          await vincentWebAuthClient.decodeVincentJWTFromUri(VITE_EXPECTED_AUDIENCE);

        if (jwtResult) {
          const { decodedJWT, jwtStr } = jwtResult;

          localStorage.setItem(APP_JWT_KEY, jwtStr);
          vincentWebAuthClient.removeVincentJWTFromURI();
          setAuthInfo({
            jwt: jwtStr,
            pkp: decodedJWT.payload.pkpInfo,
          });
          Sentry.setUser({
            app: getAppInfo(decodedJWT),
            ethAddress: getPKPInfo(decodedJWT).ethAddress,
          });
          return;
        } else {
          logOut();
          return;
        }
      } catch (error: unknown) {
        Sentry.captureException(error);
        logOut();
        return;
      }
    }

    if (existingJwtStr) {
      try {
        const decodedJWT = await verifyVincentAppUserJWT({
          expectedAudience: VITE_EXPECTED_AUDIENCE,
          jwt: existingJwtStr,
          requiredAppId: VITE_APP_ID,
        });

        setAuthInfo({
          jwt: existingJwtStr,
          pkp: decodedJWT.payload.pkpInfo,
        });
        Sentry.setUser({
          app: getAppInfo(decodedJWT),
          ethAddress: getPKPInfo(decodedJWT).ethAddress,
        });
      } catch (error: unknown) {
        Sentry.captureException(error);
        logOut();
      }
    }
  }, [logOut, vincentWebAuthClient]);

  useEffect(() => {
    const handleConnectFailure = (error: unknown) => {
      Sentry.captureException(error);
      logOut();
    };
    if (!authInfo) {
      // Schedule asynchronously to avoid any synchronous setState within the effect body,
      queueMicrotask(() => {
        logWithJwt().catch(handleConnectFailure);
      });
    }
  }, [authInfo, logWithJwt, logOut]);

  return (
    <JwtContext.Provider value={{ authInfo, logWithJwt, logOut }}>{children}</JwtContext.Provider>
  );
};
