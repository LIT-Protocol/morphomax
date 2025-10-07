import React from 'react';
import { env } from '@/config/env';
import { theme } from '@/components/theme';

export const TotalDeposits: React.FC = () => {
  return (
    <div className={`px-3 sm:px-6 py-3 border-b ${theme.cardBorder}`}>
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
          Total Deposits:
        </span>
        <span className="text-xs font-medium text-white">{env.VITE_TOTAL_DEPOSITS}</span>
      </div>
    </div>
  );
};
