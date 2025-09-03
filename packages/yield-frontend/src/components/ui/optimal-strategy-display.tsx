import React from 'react';
import { ApyDropdown } from '@/components/ApyDropdown';
import { Box } from '@/components/ui/box';

interface OptimalStrategyDisplayProps {
  /** The net APY percentage */
  netApy?: number;
  /** The strategy name */
  strategyName?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string;
}

export const OptimalStrategyDisplay: React.FC<OptimalStrategyDisplayProps> = ({
  netApy,
  strategyName,
  isLoading = false,
  error,
}) => {
  if (isLoading) {
    return (
      <Box className="gap-1 m-4 p-0 text-sm bg-transparent flex justify-center">
        <p className="text-gray-600 text-center">Loading optimal strategy...</p>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="gap-1 m-4 p-0 text-sm bg-transparent flex justify-center">
        <p className="text-red-500 text-center">{error}</p>
      </Box>
    );
  }

  if (!netApy || !strategyName) {
    return (
      <Box className="gap-1 m-4 p-0 text-sm bg-transparent flex justify-center">
        <p className="text-gray-500 text-center">No strategy data available</p>
      </Box>
    );
  }

  return (
    <div className="text-center">
      <ApyDropdown netApy={netApy} strategyName={strategyName} />
    </div>
  );
};
