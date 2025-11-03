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
        className="group relative overflow-hidden rounded-lg border transition-all duration-200 bg-[#E8F5E8] dark:bg-[#0A1F0A] hover:bg-[#D4EDD4] dark:hover:bg-[#0F2A0F]"
        style={{
          fontFamily: '"Poppins", sans-serif',
          borderColor: '#228B22',
          padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.5rem, 2vw, 0.75rem)',
        }}
      >
        <div className="relative flex items-center justify-center gap-1 sm:gap-2">
          <span
            className="text-xs font-medium uppercase tracking-widest hidden sm:inline"
            style={{
              color: '#228B22',
              fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
            }}
          >
            Current Yield:
          </span>
          <span
            className="text-xs font-medium uppercase tracking-widest sm:hidden"
            style={{
              color: '#228B22',
              fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
            }}
          >
            Yield:
          </span>
          <span
            className="font-semibold"
            style={{
              color: '#228B22',
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
            }}
          >
            {(netApy * 100).toFixed(2)}%
          </span>
          <span
            className="text-xs font-normal"
            style={{
              color: '#228B22',
              fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
            }}
          >
            APY
          </span>
          {isOpen ? (
            <ChevronUp className="h-3 w-3 flex-shrink-0" style={{ color: '#228B22' }} />
          ) : (
            <ChevronDown className="h-3 w-3 flex-shrink-0" style={{ color: '#228B22' }} />
          )}
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 sm:w-80 z-50">
          {/* Arrow pointing up */}
          <div className="flex justify-center">
            <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white dark:border-b-gray-800"></div>
          </div>

          {/* Dropdown content */}
          <div
            className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
            style={{
              fontFamily: '"Poppins", sans-serif',
            }}
          >
            <div className="p-4 space-y-4">
              {/* Current Strategy */}
              {strategyName && (
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className={`text-xs font-medium ${theme.text} uppercase tracking-wide`}>
                    Current Strategy
                  </span>
                  <span className={`text-xs font-medium ${theme.textMuted}`}>{strategyName}</span>
                </div>
              )}

              {/* Native APY */}
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${theme.text}`}>Native APY</span>
                <span className={`text-sm font-semibold ${theme.text}`}>
                  {(netApy * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
