import { useMemo } from 'react';
import * as WebAuthModule from '@lit-protocol/vincent-app-sdk/webAuthClient';

const { getWebAuthClient } = WebAuthModule;

import { env } from '@/config/env';

const { VITE_APP_ID } = env;

export const useVincentWebAuthClient = () => {
  const vincentWebAppClient = useMemo(() => getWebAuthClient({ appId: VITE_APP_ID }), []);

  return vincentWebAppClient;
};
