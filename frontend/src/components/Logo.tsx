import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  variant?: 'light' | 'dark' | 'auto';
}

/**
 * Logo component that automatically switches between S.svg (dark blue) 
 * and S-light.svg (white) based on the system color scheme, 
 * or can be forced to a specific variant.
 */
export const Logo: React.FC<LogoProps> = ({ className = "w-7 h-7", size, variant = 'auto' }) => {
  const style = size ? { width: size, height: size } : {};

  if (variant === 'light') {
    return <img src="/S-light.svg" alt="Stella" className={className} style={style} />;
  }

  if (variant === 'dark') {
    return <img src="/S.svg" alt="Stella" className={className} style={style} />;
  }

  return (
    <picture className={className} style={style}>
      <source media="(prefers-color-scheme: dark)" srcSet="/S-light.svg" />
      <source media="(prefers-color-scheme: light)" srcSet="/S.svg" />
      <img 
        src="/S.svg" 
        alt="Stella" 
        className="w-full h-full object-contain"
        style={style}
      />
    </picture>
  );
};
