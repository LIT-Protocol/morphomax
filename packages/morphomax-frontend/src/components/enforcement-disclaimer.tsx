import React, { useContext } from 'react';

import { Box } from '@/components/ui/box';
import { JwtContext } from '@/contexts/jwt';

export const EnforcementDisclaimer: React.FC = () => {
  const { authInfo } = useContext(JwtContext);

  return (
    <Box className="gap-1 m-4 p-0 text-sm bg-transparent">
      <p className="text-gray-600">
        This agent can ONLY use Morpho with every action cryptographically enforced by Lit Protocol
        via your{' '}
        {authInfo?.pkp.ethAddress ? (
          <a
            href={`https://basescan.org/address/${authInfo.pkp.ethAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Agent Wallet.
          </a>
        ) : (
          'Vincent Wallet.'
        )}
      </p>

      <div className="bg-blue-50 p-3 mt-4 rounded-md border border-blue-100">
        <p className="text-gray-700">
          By using Vincent Yield Maximizer, you're eligible to earn up up to $5000 in $LITKEY tokens
          at TGE.
        </p>
      </div>
    </Box>
  );
};
