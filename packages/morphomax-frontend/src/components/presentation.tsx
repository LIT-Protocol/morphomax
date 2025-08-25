import React from 'react';

import { OptimalStrategyInfo } from '@/components/optimal-strategy-info';
import { useBackend } from '@/hooks/useBackend';
import { theme } from '@/components/theme';
import { Footer } from '@/components/shared/Footer';
import { Header } from '@/components/shared/Header';
import { useTheme } from '@/components/shared/useTheme';

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
      
      <div className={`w-[calc(100%-1rem)] max-w-xl mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl relative z-10`}>
        <Header title="Vincent Yield" isDark={isDark} onToggleTheme={toggleTheme} />
        <div className={`px-3 sm:px-6 pt-5 pb-3 border-b ${theme.cardBorder}`}>
          <h1 className={`font-medium ${theme.text} text-center leading-tight`} style={{fontSize: '30px'}}>
            Vincent Yield Maximizer
          </h1>
          <div className="text-xs uppercase tracking-widest font-normal text-orange-500 text-center mt-1">
            EARLY ACCESS
          </div>
          <p className={`${theme.textMuted} text-sm text-center mt-2`}>
            This agent intelligently auto-rotates your stablecoins into top yield opportunities to maximize your returns
          </p>
          <p className={`${theme.textMuted} text-sm text-center`}>
            Please connect to continue.
          </p>
          
          {/* Current optimal strategy */}
          <div className="mt-4">
            <OptimalStrategyInfo />
          </div>
        </div>

        <div className="flex flex-col items-center py-4 sm:py-5 space-y-3">
          <button
            onClick={getJwt}
            className="font-semibold tracking-wide transition-all duration-200 border text-white hover:opacity-90"
            style={{
              borderRadius: '0.5rem',
              fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
              padding: 'clamp(0.375rem, 0.75vw, 0.5rem) clamp(1rem, 4vw, 2rem)',
              backgroundColor: '#f97316',
              borderColor: '#f97316',
            }}
          >
            Connect with Vincent
          </button>
        </div>

        <Footer />
      </div>
    </div>
  );
};