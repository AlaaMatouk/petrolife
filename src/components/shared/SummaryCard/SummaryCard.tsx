import React, { ReactNode } from "react";

export interface SummaryCardProps {
  title: string;
  value: string;
  currency?: string;
  icon?: ReactNode;
  additionalInfo?: string;
  additionalInfoIcon?: ReactNode;
  className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  currency = "ر.س",
  icon,
  additionalInfo,
  additionalInfoIcon,
  className = "",
}) => {
  return (
    <div
      className={`bg-white rounded-xl border-1 border-gray-100 p-6 relative overflow-hidden ${className}`}
      dir="rtl"
    >
      {/* Row 1: Icon - Left aligned */}
      <div className="flex items-center justify-start mb-4">
        {icon && <div className="flex items-center justify-center">{icon}</div>}
      </div>

      {/* Row 2: Price - Centered */}
      <div className="flex items-center justify-center gap-1 mb-4">
        <span className="text-2xl font-bold text-color-mode-text-icons-t-blue">
          {value}
        </span>
        {currency && (
          <span className="text-sm text-color-mode-text-icons-t-sec">
            {currency}
          </span>
        )}
      </div>

      {/* Row 3: Additional Info - Centered */}
      {additionalInfo && (
        <div className="flex items-center justify-center gap-1 mb-4">
          {additionalInfoIcon && (
            <div className="w-4 h-4 flex items-center justify-center">
              {additionalInfoIcon}
            </div>
          )}
          <span className="text-xs text-color-mode-text-icons-t-sec">
            {additionalInfo}
          </span>
        </div>
      )}

      {/* Row 4: Title - Centered */}
      <div className="flex items-center justify-center">
        <p className="text-sm text-color-mode-text-icons-t-sec text-center">
          {title}
        </p>
      </div>
    </div>
  );
};
