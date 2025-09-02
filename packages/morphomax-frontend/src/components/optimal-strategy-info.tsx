import React, { useEffect, useState } from 'react';
import { Box } from '@/components/ui/box';
import { Strategy, useBackend } from '@/hooks/useBackend';
import { ApyDropdown } from '@/components/ApyDropdown';

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
      <Box className="gap-1 m-4 p-0 text-sm bg-transparent flex justify-center">
        <p className="text-gray-600 text-center">Loading...</p>
      </Box>
    );
  }

  return (
    <div className="text-center">
      <ApyDropdown netApy={topStrategy.state.netApy} strategyName={topStrategy.name} />
    </div>
  );
};
