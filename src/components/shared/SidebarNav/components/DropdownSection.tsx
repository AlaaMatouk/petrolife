import React from "react";
import { Link } from "react-router-dom";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

export interface DropdownSectionProps {
  title: string;
  items: Array<{
    id: string;
    label: string;
    icon: string;
    href?: string;
    onClick?: () => void;
    isActive?: boolean;
    hasBackground?: boolean;
  }>;
  isOpen: boolean;
  onToggle: () => void;
  onItemClick?: (item: any) => void;
}

export const DropdownSection: React.FC<DropdownSectionProps> = ({
  title,
  items,
  isOpen,
  onToggle,
  onItemClick,
}) => {

  const handleItemClick = (item: any) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <div className="mb-4">
      {/* Dropdown Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-end gap-3 py-3 px-4 rounded-lg transition-all duration-200 hover:bg-[var(--surface-control-muted)] border border-transparent hover:border-[color:var(--border-medium)]"
        role="button"
        aria-expanded={isOpen}
        aria-label={`Toggle ${title} dropdown`}
      >
        {/* Chevron Icon */}
        <div className="w-5 h-5 flex-shrink-0">
          {isOpen ? (
            <ChevronUpIcon className="w-5 h-5 text-[var(--form-readonly-label-color)]" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-[var(--form-readonly-label-color)]" />
          )}
        </div>
        
        {/* Title */}
        <span className="flex-1 text-xs font-semibold text-[var(--form-readonly-label-color)] uppercase tracking-wide whitespace-nowrap text-right transition-colors duration-200">
          {title}
        </span>
        
        {/* Section Icon */}
        <div className="w-3 h-3 flex-shrink-0">
          <img
            className="w-full h-full"
            alt="Section icon"
            src="/img/vector-6.svg"
          />
        </div>
      </button>

      {/* Dropdown Content */}
      <div className={`transition-all duration-200 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="space-y-1 mt-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`w-full rounded-lg transition-all duration-200 ${
                item.isActive
                  ? "border border-[color:var(--nav-tab-active-bg)] bg-[color:var(--nav-tab-active-bg)] shadow-sm"
                  : "border border-transparent hover:bg-[var(--surface-control-muted)] hover:border-[color:var(--border-medium)]"
              }`}
            >
              {item.href ? (
                <Link
                  to={item.href}
                  onClick={() => handleItemClick(item)}
                  className="flex items-center justify-end gap-3 w-full py-3 px-4 rounded-lg transition-all duration-200"
                  role="menuitem"
                  tabIndex={0}
                  aria-label={item.label}
                >
                  <span
                    className={`flex-1 text-sm font-medium text-right whitespace-nowrap transition-colors ${
                      item.isActive
                        ? "text-[color:var(--nav-tab-active-text)]"
                        : "text-[color:var(--nav-tab-text)]"
                    }`}
                  >
                    {item.label}
                  </span>
                  <img
                    className="w-5 h-5 flex-shrink-0"
                    alt={`${item.label} icon`}
                    src={item.icon}
                  />
                </Link>
              ) : (
                <button
                  onClick={() => handleItemClick(item)}
                  className="flex items-center justify-end gap-3 w-full py-3 px-4 rounded-lg transition-all duration-200"
                  role="menuitem"
                  tabIndex={0}
                  aria-label={item.label}
                >
                  <span
                    className={`flex-1 text-sm font-medium text-right whitespace-nowrap transition-colors ${
                      item.isActive
                        ? "text-[color:var(--nav-tab-active-text)]"
                        : "text-[color:var(--nav-tab-text)]"
                    }`}
                  >
                    {item.label}
                  </span>
                  <img
                    className="w-5 h-5 flex-shrink-0"
                    alt={`${item.label} icon`}
                    src={item.icon}
                  />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
