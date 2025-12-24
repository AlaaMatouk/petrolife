import React from "react";

export interface RTLSelectOption {
  value: string;
  label: string;
  icon?: string;
}

export interface RTLSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: RTLSelectOption[];
  className?: string;
  placeholder?: string;
}

export const RTLSelect: React.FC<RTLSelectProps> = ({
  label,
  value,
  onChange,
  options,
  className = "",
  placeholder = "اختر...",
}) => {
  return (
    <div
      className={`flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow ${className}`}
    >
      <label className="relative self-stretch mt-[-1.00px] font-caption-caption-1 font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] [direction:rtl] [font-style:var(--caption-caption-1-font-style)]">
        {label}
      </label>

      <div className="relative w-full">
        <div className="flex h-[46px] items-center justify-between gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus-within:border-color-mode-text-icons-t-blue transition-colors bg-transparent">
          {/* Icon on the right (if provided) */}
          {options.find((opt) => opt.value === value)?.icon && (
            <div className="flex items-center justify-center">
              <img
                className="w-[18px] h-[18px] aspect-[1]"
                alt={`أيقونة ${label}`}
                src={options.find((opt) => opt.value === value)?.icon}
              />
            </div>
          )}

          {/* Select content */}
          <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="text-right relative pr-2 w-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none text-[var(--form-active-input-text-color)] appearance-none cursor-pointer"
            >
              <option value="" disabled>
                {placeholder}
              </option>
              {options.map((option, index) => (
                <option key={`${option.value}-${index}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown arrow on the right */}
          <div className="flex items-center justify-center">
            <img
              src="/src/assets/imgs/icons/angle-left.svg"
              alt=""
              className="w-4 h-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
