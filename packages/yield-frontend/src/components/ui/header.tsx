import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { theme } from '@/components/theme';

interface HeaderProps {
  /** The title text to display in the header */
  title: string;
  /** Whether the theme is currently dark mode */
  isDark: boolean;
  /** Callback function to toggle between light/dark theme */
  onToggleTheme: () => void;
  /** Optional additional buttons or content to display on the right side */
  rightButton?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, isDark, onToggleTheme, rightButton }) => {
  return (
    <div
      className={`px-3 sm:px-6 py-3 border-b ${theme.cardBorder}`}
      style={{ fontFamily: '"ITC Avant Garde Gothic", "Century Gothic", "Avantgarde", sans-serif' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
          <img
            src={isDark ? '/vincent-logos/logo-white.svg' : '/vincent-logos/logo.svg'}
            alt="Vincent by Lit Protocol"
            className="h-4 w-4 flex-shrink-0"
          />
          <span className={`text-sm font-medium ${theme.text} truncate mt-0.5 min-w-0`}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {rightButton}
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={() => window.open('https://dashboard.heyvincent.ai/user/apps', '_blank')}
            className="px-2 sm:px-3"
            title="Open Vincent Dashboard"
          >
            Dashboard
          </Button>
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={onToggleTheme}
            className="px-2 sm:px-3"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
