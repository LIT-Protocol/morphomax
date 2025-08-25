import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { theme } from '@/components/theme';

interface ApyDropdownProps {
  netApy: number;
  strategyName?: string;
}

export const ApyDropdown: React.FC<ApyDropdownProps> = ({ netApy, strategyName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // The backend provides native APY, we add 30% bonus for Lit Protocol Points
  const nativeApy = netApy; // Backend already provides native APY
  const litProtocolBonus = 0.3; // Fixed 30% bonus
  const totalApy = nativeApy + litProtocolBonus; // Native + 30% bonus

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Green APY Box */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative overflow-hidden rounded-lg border border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-3 py-1.5 transition-all duration-200 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30"
      >
        <div className="relative flex items-center justify-center gap-2">
          <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-widest">
            Current Yield:
          </span>
          <span className="text-sm font-semibold text-green-700 dark:text-green-300">
            {(totalApy * 100).toFixed(2)}%
          </span>
          <span className="text-xs text-green-600 dark:text-green-400 font-normal">APY</span>
          {isOpen ? (
            <ChevronUp className="h-3 w-3 text-green-600 dark:text-green-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-green-600 dark:text-green-400" />
          )}
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 z-50">
          {/* Arrow pointing up */}
          <div className="flex justify-center">
            <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white dark:border-b-gray-800"></div>
          </div>

          {/* Dropdown content */}
          <div
            className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
          >
            <div className="p-4 space-y-4">
              {/* Current Strategy */}
              {strategyName && (
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span
                    className={`text-xs font-medium ${theme.textMuted} uppercase tracking-wide`}
                  >
                    Current Strategy
                  </span>
                  <span className={`text-xs font-medium ${theme.text}`}>{strategyName}</span>
                </div>
              )}

              {/* Native APY */}
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${theme.text}`}>Native APY</span>
                <span className={`text-sm font-semibold ${theme.text}`}>
                  {(nativeApy * 100).toFixed(2)}%
                </span>
              </div>

              {/* Lit Protocol Points */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-auto text-orange-500"
                      width="40"
                      viewBox="0 0 311 228"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-label="Lit Protocol logo"
                    >
                      <path
                        d="M311 104.987V51.9125H256.038V29.2084L256.245 0.621826H202.816V174.264C202.816 181.242 204.193 188.153 206.866 194.599C209.54 201.045 213.459 206.9 218.398 211.83C223.337 216.76 229.2 220.667 235.652 223.328C242.103 225.989 249.016 227.352 255.994 227.338L311 227.25V175.045H269.794C267.969 175.047 266.162 174.689 264.477 173.992C262.791 173.295 261.259 172.272 259.969 170.982C258.679 169.692 257.656 168.16 256.959 166.474C256.262 164.789 255.904 162.982 255.906 161.157V140.517H256.053C256.053 128.723 256.053 116.929 256.053 104.943L311 104.987Z"
                        fill="currentColor"
                      />
                      <path
                        d="M142.841 51.9125H184.564V0.621826H131.489V227.442H184.564V93.9711C184.564 88.7506 182.208 83.8089 178.151 80.5223L142.841 51.9125Z"
                        fill="currentColor"
                      />
                      <path
                        d="M53.2347 161.157V0.621826H0.160156V174.264C0.160143 181.242 1.53637 188.153 4.21006 194.599C6.88376 201.045 10.8024 206.9 15.7418 211.83C20.6811 216.76 26.5442 220.667 32.9954 223.328C39.4466 225.989 46.3593 227.352 53.3379 227.338L113.12 227.25V175.045H67.1225C63.4392 175.045 59.9068 173.582 57.3023 170.978C54.6978 168.373 53.2347 164.841 53.2347 161.157Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className={`text-sm font-medium ${theme.text}`}>Lit Protocol Points</span>
                  </div>
                  <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    est: {(litProtocolBonus * 100).toFixed(0)}%
                  </span>
                </div>
                {/* Disclaimer directly below */}
                <div
                  className={`text-[10px] ${theme.textMuted} leading-tight mt-0.5 mb-3 text-center`}
                >
                  Bonus APY is based on an estimated $250M $LITKEY FDV. It applies to the first $20M
                  deposited into Vincent apps, with rewards capped at $20K per unique depositor and
                  distributed at a future snapshot.{' '}
                  <a
                    href="https://docs.heyvincent.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-orange-600 dark:text-orange-400"
                  >
                    Learn more
                  </a>
                </div>
              </div>

              {/* Divider */}
              <div className={`border-t ${theme.cardBorder} pt-3`}>
                {/* Net APY */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${theme.text}`}>Net APY</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {(totalApy * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
