import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  onBlur,
  options,
  error,
  required = false,
  className = '',
  disabled = false,
  placeholder,
}) => {
  return (
    <div className={`flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow ${className}`}>
      <label className="self-stretch mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] tracking-[var(--body-body-2-letter-spacing)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>

      <div className="relative w-full">
        <div className={`flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid transition-colors ${
          error 
            ? 'border-red-500 bg-red-50' 
            : disabled
            ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
            : 'border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus-within:border-color-mode-text-icons-t-blue'
        }`}>
          {/* Left-positioned chevron icon */}
          <ChevronLeft className={`w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />

          <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              disabled={disabled}
              className={`text-right relative pr-2 pl-7 w-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none ${
                error 
                  ? 'text-red-500' 
                  : disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-[var(--form-active-input-text-color)]'
              }`}
            >
              {placeholder && !value && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="absolute top-full left-0 right-0 mt-1 px-2">
            <p className="text-red-500 text-xs font-medium [direction:rtl] text-right">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
