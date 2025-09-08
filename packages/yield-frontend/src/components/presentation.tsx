import React from 'react';

import { OptimalStrategyInfo } from '@/components/optimal-strategy-info';
import { useBackend } from '@/hooks/useBackend';
import { theme } from '@/components/theme';
import { Footer } from '@/components/ui/footer';
import { Header } from '@/components/ui/header';
import { PageHeader } from '@/components/ui/page-header';
import { useTheme } from '@/components/shared/useTheme';
import { Button } from '@/components/ui/button';
import { FAQ, faqData } from '@/components/ui/faq';

export const Presentation: React.FC = () => {
  const { getJwt } = useBackend();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div
        className={`w-[calc(100%-1rem)] max-w-xl mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl relative z-10`}
      >
        <Header title="Vincent Yield" isDark={isDark} onToggleTheme={toggleTheme} />
        <div className={`px-3 sm:px-6 pt-5 pb-3 border-b ${theme.cardBorder}`}>
          <PageHeader
            title="Vincent Yield Agent"
            subtitle="EARLY ACCESS"
            description="This agent intelligently auto-rotates your stablecoins into top yield opportunities on Morpho to maximize your returns."
            size="lg"
          />

          {/* Current optimal strategy */}
          <div className="mt-4">
            <OptimalStrategyInfo />
          </div>
        </div>

        <div className="flex flex-col items-center py-4 sm:py-5 space-y-3">
          <Button
            onClick={getJwt}
            variant="primary"
            size="sm"
            style={{
              fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
              padding: 'clamp(0.375rem, 0.75vw, 0.5rem) clamp(1rem, 4vw, 2rem)',
            }}
          >
            Connect with Vincent
          </Button>
        </div>

        <FAQ items={faqData} />
        <Footer />
      </div>
    </div>
  );
};
