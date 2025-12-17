import React, { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";

export interface DateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "mm/dd/yyyy",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleDateSelect = (date: Date) => {
    onChange(formatDate(date));
    setIsOpen(false);
  };

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const renderCalendar = () => {
    const today = new Date();

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<number | null> = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    const weekdays = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
    const monthNames = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];

    const selectedDay = value
      ? (() => {
          const [m, d, y] = value.split("/").map(Number);
          if (y === year && m === month + 1) return d;
          return null;
        })()
      : null;

    return (
      <div className="w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
              )
            }
            className="p-1 hover:bg-gray-100 rounded"
          >
            <span className="text-sm">‹</span>
          </button>
          <span className="text-sm font-medium">
            {monthNames[month]} {year}
          </span>
          <button
            type="button"
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
              )
            }
            className="p-1 hover:bg-gray-100 rounded"
          >
            <span className="text-sm">›</span>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-600 mb-2">
          {weekdays.map((day) => (
            <div key={day} className="font-medium py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="py-2" />;
            }
            const isSelected = day === selectedDay;
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();

            return (
              <button
                key={day}
                type="button"
                onClick={() =>
                  handleDateSelect(new Date(year, month, day))
                }
                className={`py-2 rounded transition-colors ${
                  isSelected
                    ? "bg-[#5A66C1] text-white"
                    : isToday
                    ? "bg-gray-100 text-gray-900"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col items-start gap-1 relative ${className}`} dir="rtl">
      <label className="text-xs text-color-mode-text-icons-t-placeholder">
        {label}
      </label>
      <div className="relative w-full" ref={calendarRef}>
        <div
          className="flex h-[46px] items-center justify-between gap-2 px-4 rounded-lg border border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus-within:border-color-mode-text-icons-t-blue transition-colors bg-transparent cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Calendar className="w-4 h-4 text-color-mode-text-icons-t-sec" />
          <input
            type="text"
            value={value}
            readOnly
            placeholder={placeholder}
            className="flex-1 text-left text-sm text-color-mode-text-icons-t-blue bg-transparent border-none outline-none cursor-pointer"
          />
        </div>
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 z-50">
            {renderCalendar()}
          </div>
        )}
      </div>
    </div>
  );
};

