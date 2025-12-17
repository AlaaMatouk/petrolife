import React from "react";

export interface Tab {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-2 px-6 py-4 ${className}`}
      dir="rtl"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              isActive
                ? "text-color-mode-text-icons-t-sec"
                : "text-color-mode-text-icons-t-sec hover:text-color-mode-text-icons-t-blue"
            }`}
            style={isActive ? { borderBottom: "3px solid #374151" } : {}}
            aria-selected={isActive}
            role="tab"
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

