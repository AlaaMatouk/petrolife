import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  fullPage?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  fullPage = false,
  className = '',
}) => {
  // Size mappings for the circle
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  const borderWidthClasses = {
    sm: 'border-2',
    md: 'border-3',
    lg: 'border-4',
    xl: 'border-[5px]',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const containerPaddingClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-20',
  };

  const spinnerContent = (
    <div className="text-center">
      {/* Circular spinner */}
      <div className="relative inline-flex items-center justify-center mb-4">
        <div
          className={`animate-spin rounded-full border-solid border-t-color-mode-surface-primary-blue border-r-color-mode-surface-primary-blue border-b-transparent border-l-transparent ${sizeClasses[size]} ${borderWidthClasses[size]} ${className}`}
          role="status"
          aria-label="Loading"
          style={{ 
            animation: 'spin 0.8s linear infinite'
          }}
        />
      </div>
      {message && (
        <p className={`text-[var(--text-secondary)] font-medium ${textSizeClasses[size]} [direction:rtl] transition-colors duration-300`}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-[var(--surface-page)] transition-colors duration-300">
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center w-full ${containerPaddingClasses[size]}`}>
      {spinnerContent}
    </div>
  );
};

