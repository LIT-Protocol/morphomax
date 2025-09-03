import React, { createContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import * as jwt from '@lit-protocol/vincent-app-sdk/jwt';

const { verifyVincentAppUserJWT } = jwt;

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
  }, []);

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
          return;
        } else {
          logOut();
          return;
        }
      } catch (e) {
        console.error('Error decoding JWT:', e);
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
      } catch (error: unknown) {
        console.error(`Error verifying existing JWT. Need to relogin: ${(error as Error).message}`);
        logOut();
      }
    }
  }, [logOut, vincentWebAuthClient]);

  useEffect(() => {
    const handleConnectFailure = (e: unknown) => {
      console.error('Error logging in:', e);
      logOut();
    };
    logWithJwt().catch(handleConnectFailure);
  }, [logWithJwt, logOut]);

  return (
    <JwtContext.Provider value={{ authInfo, logWithJwt, logOut }}>{children}</JwtContext.Provider>
  );
};
