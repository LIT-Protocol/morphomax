import React from 'react';

interface PageHeaderProps {
  /** The main title text */
  title: string;
  /** Optional subtitle displayed above the title in uppercase */
  subtitle?: string;
  /** Optional description text displayed below the title */
  description?: string | React.ReactNode;
  /** Size variant for the component */
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: {
    titleSize: '20px',
    subtitleSize: '10px',
    description: 'text-xs',
  },
  md: {
    titleSize: '24px',
    subtitleSize: '12px',
    description: 'text-sm',
  },
  lg: {
    titleSize: '30px',
    subtitleSize: '15px',
    description: 'text-sm',
  },
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  description,
  size = 'lg',
}) => {
  const styles = sizeStyles[size];

  return (
    <div className="text-center px-4 sm:px-6">
      <h1
        className="leading-tight text-center"
        style={{
          fontSize: styles.titleSize,
          fontFamily: '"ITC Avant Garde Gothic", "Century Gothic", "Avantgarde", sans-serif',
          fontWeight: size === 'sm' ? 400 : 500,
          color: 'var(--footer-text-color, #121212)',
        }}
      >
        {title}
      </h1>

      {subtitle && (
        <div
          className="uppercase tracking-widest text-center mt-1"
          style={{
            fontSize: styles.subtitleSize,
            fontFamily: '"ITC Avant Garde Gothic", "Century Gothic", "Avantgarde", sans-serif',
            fontWeight: size === 'sm' ? 400 : 500,
            color: '#FF4205',
          }}
        >
          {subtitle}
        </div>
      )}

      {description && (
        <div
          className={`${styles.description} text-center mt-2 text-gray-600 dark:text-[#9C9C9C]`}
          style={{
            fontFamily: '"Encode Sans Semi Expanded", system-ui, sans-serif',
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
};
