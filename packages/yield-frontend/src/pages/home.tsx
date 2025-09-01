import React from 'react';

import { Dashboard } from '@/components/dashboard';

export const Home: React.FC = () => {
  return (
    <div className={'flex flex-col items-center justify-center min-h-screen min-w-screen'}>
      <Dashboard />
    </div>
  );
};
