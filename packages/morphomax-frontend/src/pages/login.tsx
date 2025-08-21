import React from 'react';

import { Presentation } from '@/components/presentation';

export const Login: React.FC = () => {
  return (
    <div
      className={'flex flex-col items-center justify-center min-h-screen min-w-screen bg-gray-100 dark:bg-gray-950'}
    >
      <Presentation />
    </div>
  );
};
