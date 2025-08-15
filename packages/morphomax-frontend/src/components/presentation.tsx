import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { EnforcementDisclaimer } from '@/components/enforcement-disclaimer';
import { Footer } from '@/components/footer';
import { OptimalStrategyInfo } from '@/components/optimal-strategy-info';
import { useBackend } from '@/hooks/useBackend';

export const Presentation: React.FC = () => {
  const { getJwt } = useBackend();

  return (
    <Card className="w-full max-w-3xl bg-white p-8 shadow-sm rounded-lg">
      <CardHeader className="space-y-3 text-center">
        <CardTitle className="text-3xl font-bold text-gray-900">Vincent Yield Maximizer</CardTitle>
        <CardDescription className="space-y-2">
          <p className="text-gray-800 font-medium">
            This agent helps you earn more yield on your USDC.
          </p>
          <p className="text-gray-600">
            It automatically moves your funds into the highest-yielding Morpho vault.
          </p>
        </CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-6 text-center">
        <div className="space-y-3">
          <p className="font-semibold text-gray-900">How it works:</p>
          <div>
            <p className="text-gray-700">1. Connect with Vincent</p>
            <p className="text-gray-700">2. Deposit USDC (minimum 50 USDC)</p>
            <p className="text-gray-700">3. Active your Agent</p>
          </div>
        </div>

        <OptimalStrategyInfo />

        <div className="space-y-4">
          <Button
            onClick={getJwt}
            className="w-full bg-purple-600 text-white hover:bg-purple-700 py-2 px-4 rounded-md transition-colors"
          >
            Connect with Vincent
          </Button>

          <EnforcementDisclaimer />
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-col items-center">
        <Footer />
      </CardFooter>
    </Card>
  );
};
