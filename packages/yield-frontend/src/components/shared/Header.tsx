import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { theme } from '@/components/theme';

interface HeaderProps {
  title: string;
  isDark: boolean;
  onToggleTheme: () => void;
  rightButton?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, isDark, onToggleTheme, rightButton }) => {
  return (
    <div className={`px-3 sm:px-6 py-3 border-b ${theme.cardBorder}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            src={isDark ? '/vincent-logos/logo-white.svg' : '/vincent-logos/logo.svg'}
            alt="Vincent by Lit Protocol"
            className="h-4 w-4 flex-shrink-0"
          />
          <span className={`text-sm font-medium ${theme.text} truncate mt-0.5`}>{title}</span>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {rightButton}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className={`${theme.text} hover:bg-white/10 px-2 sm:px-3`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
