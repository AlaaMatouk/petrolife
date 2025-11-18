import React from "react";
import { ToggleButton } from "../ToggleButton";

export interface StatusToggleProps {
  /**
   * Whether the status is active
   */
  isActive: boolean;
  /**
   * Callback when status changes
   */
  onToggle: () => void;
  /**
   * Optional label text to display next to the toggle
   */
  statusText?: string;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * StatusToggle - A reusable component for status toggles in tables
 * Uses the ToggleButton component with predefined settings:
 * - Color: Green (for active status)
 * - Size: Medium
 * - Displays status text alongside the toggle
 */
export const StatusToggle: React.FC<StatusToggleProps> = ({
  isActive,
  onToggle,
  statusText,
  disabled = false,
  className = "",
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center gap-2" dir="ltr">
        {statusText && (
          <span
            className={`text-sm font-medium ${
              isActive ? "text-green-700" : "text-gray-500"
            }`}
          >
            {statusText}
          </span>
        )}
        <ToggleButton
          isOn={isActive}
          onToggle={onToggle}
          color="green"
          size="md"
          disabled={disabled}
        />
      </div>
    </div>
  );
};
