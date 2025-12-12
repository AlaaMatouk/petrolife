import React from "react";

export interface FuelTypeIconProps {
  fuelType: string;
  className?: string;
}

const getFuelTypeConfig = (fuelType: string) => {
  const normalized = fuelType.toLowerCase().trim();
  
  if (normalized.includes("91") || normalized.includes("بنزين 91")) {
    return {
      color: "bg-green-500",
      text: "بنزين 91",
    };
  }
  if (normalized.includes("95") || normalized.includes("بنزين 95")) {
    return {
      color: "bg-red-500",
      text: "بنزين 95",
    };
  }
  if (normalized.includes("98") || normalized.includes("بنزين 98")) {
    return {
      color: "bg-blue-500",
      text: "بنزين 98",
    };
  }
  if (normalized.includes("ديزل") || normalized.includes("diesel")) {
    return {
      color: "bg-orange-500",
      text: "ديزل",
    };
  }
  
  // Default
  return {
    color: "bg-gray-500",
    text: fuelType,
  };
};

export const FuelTypeIcon: React.FC<FuelTypeIconProps> = ({
  fuelType,
  className = "",
}) => {
  const config = getFuelTypeConfig(fuelType);

  return (
    <div className={`flex items-center gap-2 ${className}`} dir="rtl">
      <div
        className={`w-6 h-6 rounded-full ${config.color} flex-shrink-0 flex items-center justify-center`}
        aria-label={config.text}
      >
        <svg
          className="w-3 h-3 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
        </svg>
      </div>
      <span className="text-sm text-color-mode-text-icons-t-blue">
        {config.text}
      </span>
    </div>
  );
};

