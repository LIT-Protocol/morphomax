import React, { useEffect, useState } from 'react';

import { Box } from '@/components/ui/box';
import { Strategy, useBackend } from '@/hooks/useBackend';

export const OptimalStrategyInfo: React.FC = () => {
  const [topStrategy, setTopStrategy] = useState<Strategy>();
  const { getOptimalStrategyInfo } = useBackend();

  useEffect(() => {
    const fetchTopStrategy = async () => {
      const topStrategy = await getOptimalStrategyInfo();
      setTopStrategy(topStrategy);
    };
    fetchTopStrategy();
  }, [getOptimalStrategyInfo, setTopStrategy]);

  if (!topStrategy) {
    return (
      <Box className="gap-1 m-4 p-0 text-sm bg-transparent">
        <p className="text-gray-600">Loading...</p>
      </Box>
    );
  }

  return (
    <Box className="gap-1 p-0 text-sm bg-transparent">
      <div className="bg-blue-50 p-3 mt-4 rounded-md border border-blue-100">
        <p className="font-semibold text-gray-900">Current optimal strategy:</p>
        <div className="flex flex-row p-2">
          <p className="w-1/2 text-left">Chain: {topStrategy.chain.network}</p>
          <p className="w-1/2 text-left">Protocol: Morpho</p>
        </div>
        <div className="flex flex-row p-2">
          <p className="w-1/2 text-left">Name: {topStrategy.name}</p>
          <p className="w-1/2 text-left">Yield: {(topStrategy.state.netApy * 100).toFixed(2)}%</p>
        </div>
      </div>
    </Box>
  );
};
