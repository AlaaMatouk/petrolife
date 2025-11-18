import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TimeFilterProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  filters?: string[];
  className?: string;
  onDateRangeChange?: (startDate: Date | null, endDate: Date | null) => void;
  showCalendar?: boolean; // Option to show/hide calendar
}

interface CalendarPickerProps {
  onDateSelect: (date: Date) => void;
  startDate: Date | null;
  endDate: Date | null;
  isDateInRange: (date: Date) => boolean;
  isDateStart: (date: Date) => boolean;
  isDateEnd: (date: Date) => boolean;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  onDateSelect,
  startDate,
  endDate,
  isDateInRange,
  isDateStart,
  isDateEnd,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();

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

  const weekDays = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="الشهر التالي"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="text-center">
          <div className="font-semibold text-gray-900 [direction:rtl]">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
        </div>

        <button
          type="button"
          onClick={previousMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="الشهر السابق"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2 [direction:rtl]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const inRange = isDateInRange(day);
          const isStart = isDateStart(day);
          const isEnd = isDateEnd(day);
          const isToday = day.toDateString() === today.toDateString();

          return (
            <button
              key={index}
              type="button"
              onClick={() => onDateSelect(day)}
              className={`aspect-square flex items-center justify-center text-sm rounded transition-all ${
                isStart || isEnd
                  ? "bg-blue-600 text-white font-bold"
                  : inRange
                  ? "bg-blue-100 text-blue-900"
                  : isToday
                  ? "bg-gray-200 text-gray-900 font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      {/* Selected Range Display */}
      {startDate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-600 text-center [direction:rtl]">
            {endDate ? (
              <>
                من {startDate.toLocaleDateString("ar-EG")} إلى{" "}
                {endDate.toLocaleDateString("ar-EG")}
              </>
            ) : (
              <>اختر تاريخ النهاية</>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const TimeFilter: React.FC<TimeFilterProps> = ({
  selectedFilter,
  onFilterChange,
  filters = ["اخر اسبوع", "اخر 30 يوم", "اخر 6 شهور", "اخر 12 شهر"],
  className = "",
  onDateRangeChange,
  showCalendar = true,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  const handleDateSelect = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(date);
      setEndDate(null);
    } else {
      // Complete selection
      if (date < startDate) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }

      // Notify parent component
      if (onDateRangeChange) {
        if (date < startDate) {
          onDateRangeChange(date, startDate);
        } else {
          onDateRangeChange(startDate, date);
        }
      }

      // Close calendar after selection
      setTimeout(() => setIsCalendarOpen(false), 300);
    }
  };

  const isDateInRange = (date: Date) => {
    if (!startDate) return false;
    if (!endDate) return date.toDateString() === startDate.toDateString();
    return date >= startDate && date <= endDate;
  };

  const isDateStart = (date: Date) => {
    return startDate && date.toDateString() === startDate.toDateString();
  };

  const isDateEnd = (date: Date) => {
    return endDate && date.toDateString() === endDate.toDateString();
  };

  // New default style (matching المبيعات section)
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Calendar icon button */}
      {showCalendar && (
        <div className="relative" ref={calendarRef}>
          <button
            type="button"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-[8px] border transition-all duration-200"
            aria-label="عرض التقويم"
            style={{
              borderColor: "var(--time-filter-border)",
              backgroundColor: isCalendarOpen
                ? "var(--time-filter-active-bg)"
                : "var(--time-filter-default-bg)",
            }}
          >
            <img
              src="/src/assets/imgs/icons/calendar.svg"
              alt="Calendar"
              className="w-5 h-5"
              style={{
                filter: "invert(80%)",
                opacity: isCalendarOpen ? 1 : 0.85,
              }}
            />
          </button>

          {/* Calendar Dropdown */}
          {isCalendarOpen && (
            <div
              className="absolute top-full left-0 mt-2 rounded-lg shadow-xl border p-4 z-50 min-w-[280px]"
              style={{
                backgroundColor: "var(--surface-card)",
                borderColor: "var(--border-strong)",
                boxShadow: "0px 12px 32px rgba(0,0,0,0.45)",
              }}
            >
              <CalendarPicker
                onDateSelect={handleDateSelect}
                startDate={startDate}
                endDate={endDate}
                isDateInRange={isDateInRange}
                isDateStart={isDateStart}
                isDateEnd={isDateEnd}
              />
            </div>
          )}
        </div>
      )}

      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className="px-4 py-2 text-sm rounded-lg transition-all border"
          style={{
            backgroundColor:
              selectedFilter === filter
                ? "var(--time-filter-active-bg)"
                : "var(--time-filter-default-bg)",
            color:
              selectedFilter === filter
                ? "var(--time-filter-active-text)"
                : "var(--time-filter-default-text)",
            borderColor:
              selectedFilter === filter
                ? "var(--time-filter-active-bg)"
                : "var(--time-filter-border)",
            boxShadow:
              selectedFilter === filter
                ? "0 0 0 1px rgba(48,22,75,0.35)"
                : "none",
          }}
          type="button"
          aria-pressed={selectedFilter === filter}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};
