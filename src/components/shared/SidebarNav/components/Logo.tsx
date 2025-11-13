import React from 'react';

interface LogoProps {
  primary: string;
  secondary: string;
}

export const Logo: React.FC<LogoProps> = ({ primary, secondary }) => {
  return (
    <header className="flex items-center justify-end gap-2 p-4 border-b border-[color:var(--border-subtle)] transition-colors duration-300">
      <img
        className="h-8 w-auto"
        alt="Company logo part 1"
        src={primary}
      />
      <img
        className="h-8 w-auto"
        alt="Company logo part 2"
        src={secondary}
      />
    </header>
  );
};
