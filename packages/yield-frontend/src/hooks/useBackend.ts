import { useCallback, useContext } from 'react';

import { env } from '@/config/env';
import { JwtContext } from '@/contexts/jwt';
import { useVincentWebAuthClient } from '@/hooks/useVincentWebAuthClient';

const { VITE_BACKEND_URL, VITE_REDIRECT_URI } = env;

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type Schedule = {
  lastRunAt: string;
  nextRunAt: string;
  lastFinishedAt: string;
  failedAt: string;
  _id: string;
  disabled: boolean;
  failReason: string;
  data: {
    name: string;
    walletAddress: string;
    updatedAt: string;
  };
  investedAmountUsdc: string;
  uninvestedAmountUsdc: string;
};

export type Swap = {
  _id: string;
  createdAt: string;
  deposits: {
    approval: {
      approvalTxHash?: string;
      approvedAmount: string;
      spenderAddress: string;
      tokenAddress: string;
      tokenDecimals: number;
    };
    deposit: {
      amount: string;
      operation: string;
      timestamp: number;
      txHash: string;
      vaultAddress: string;
    };
  }[];
  redeems: {
    amount: string;
    operation: string;
    timestamp: number;
    txHash: string;
    vaultAddress: string;
  }[];
  scheduleId: string;
  success: boolean;
  topVault: {
    address: string;
    asset: {
      address: string;
      decimals: number;
      name: string;
      symbol: string;
    };
    chain: {
      id: number;
      network: string;
    };
    id: string;
    name: string;
    symbol: string;
    whitelisted: boolean;
  };
  updatedAt: string;
  userPositions: {
    id: string;
    user: {
      vaultPositions: {
        state: {
          assets: string;
          assetsUsd: number;
          id: number;
          pnl: string;
          pnlUsd: number;
          roe: number;
          roeUsd: number;
          shares: number;
          timestamp: number;
        };
        vault: {
          address: string;
          asset: {
            address: string;
            decimals: number;
            name: string;
            symbol: string;
          };
          id: string;
          name: string;
          state: {
            apy: number;
            avgApy: number;
            avgNetApy: number;
            netApy: number;
          };
          symbol: string;
          whitelisted: boolean;
        };
      }[];
    };
  }[];
  userTokenBalance: {
    address: string;
    balance: string;
    decimals: number;
  }[];
  walletAddress: string;
};

export type Balances = {
  investedAmountUsdc: string;
  uninvestedAmountUsdc: string;
};

export type Strategy = {
  address: string;
  asset: {
    address: string;
    decimals: number;
    name: string;
    symbol: string;
  };
  chain: {
    id: number;
    network: string;
  };
  id: string;
  name: string;
  state: {
    apy: number;
    avgApy: number;
    avgNetApy: number;
    netApy: number;
  };
  symbol: string;
  whitelisted: boolean;
};

export type ProfileData = {
  pkpAddress: string;
  email?: string;
  referralSource?: string;
  referralOtherDetails?: string;
};

export type ProfileUpdateData = {
  email?: string;
  referralSource?: string;
  referralOtherDetails?: string;
};

export const useBackend = () => {
  const { authInfo } = useContext(JwtContext);
  const vincentWebAppClient = useVincentWebAuthClient();

  const getJwt = useCallback(() => {
    // Redirect to Vincent Auth consent page with appId and version
    vincentWebAppClient.redirectToConnectPage({
      // delegationAuthPageUrl: `http://localhost:3000/`,
      redirectUri: VITE_REDIRECT_URI,
    });
  }, [vincentWebAppClient]);

  const sendUnAuthenticatedRequest = useCallback(
    async <T>(endpoint: string, method: HTTPMethod, body?: unknown): Promise<T> => {
      const headers: HeadersInit = {};
      if (body != null && method !== 'GET') {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${VITE_BACKEND_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'omit',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = (await response.json()) as { data: T; success: boolean };

      if (!json.success) {
        throw new Error(`Backend error: ${json.data}`);
      }

      return json.data;
    },
    []
  );

  const sendRequest = useCallback(
    async <T>(endpoint: string, method: HTTPMethod, body?: unknown): Promise<T> => {
      if (!authInfo?.jwt) {
        throw new Error('No JWT to query backend');
      }

      const headers: HeadersInit = {
        Authorization: `Bearer ${authInfo.jwt}`,
      };
      if (body != null) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${VITE_BACKEND_URL}${endpoint}`, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = (await response.json()) as { data: T; success: boolean };

      if (!json.success) {
        throw new Error(`Backend error: ${json.data}`);
      }

      return json.data;
    },
    [authInfo]
  );

  const createSchedule = useCallback(async () => {
    return sendRequest<Schedule>('/schedule', 'POST');
  }, [sendRequest]);

  const getSchedules = useCallback(async () => {
    return sendRequest<Schedule[]>('/schedule', 'GET');
  }, [sendRequest]);

  const getScheduleBalances = useCallback(async () => {
    return sendRequest<Balances>('/schedule/balances', 'GET');
  }, [sendRequest]);

  const getScheduleSwaps = useCallback(
    async (
      scheduleId: string,
      { limit = 10, skip = 0 }: { limit?: number; skip?: number } = {}
    ) => {
      return sendRequest<Swap[]>(
        `/schedule/${scheduleId}/swaps?limit=${limit}&skip=${skip}`,
        'GET'
      );
    },
    [sendRequest]
  );

  const deleteSchedule = useCallback(
    async (scheduleId: string) => {
      return sendRequest<Schedule>(`/schedule/${scheduleId}`, 'DELETE');
    },
    [sendRequest]
  );

  const getOptimalStrategyInfo = useCallback(async () => {
    return sendUnAuthenticatedRequest<Strategy>('/strategy/top', 'GET');
  }, [sendUnAuthenticatedRequest]);

  const updateProfile = useCallback(
    async (data: ProfileUpdateData) => {
      return sendRequest<ProfileData>('/profile', 'POST', data);
    },
    [sendRequest]
  );

  const getProfile = useCallback(async () => {
    return sendRequest<ProfileData>('/profile', 'GET');
  }, [sendRequest]);

  return {
    createSchedule,
    deleteSchedule,
    getOptimalStrategyInfo,
    getSchedules,
    getScheduleBalances,
    getScheduleSwaps,
    getJwt,
    updateProfile,
    getProfile,
  };
};
