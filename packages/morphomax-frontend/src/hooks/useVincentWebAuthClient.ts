import { useMemo } from 'react';
import * as WebAuthModule from '@lit-protocol/vincent-app-sdk/webAuthClient';

const { getWebAuthClient } = WebAuthModule;

import { APP_ID } from '@/config';

export const useVincentWebAuthClient = () => {
  const vincentWebAppClient = useMemo(() => getWebAuthClient({ appId: APP_ID }), []);

  return vincentWebAppClient;
};
