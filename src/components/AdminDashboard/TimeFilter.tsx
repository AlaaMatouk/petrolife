import React from "react";
import { Calendar } from "lucide-react";

interface TimeFilterProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  filters?: string[];
  className?: string;
}

export const TimeFilter: React.FC<TimeFilterProps> = ({
  selectedFilter,
  onFilterChange,
  filters = ["اخر اسبوع", "اخر 30 يوم", "اخر 6 شهور"],
  className = "",
}) => {
  return (
    <div
      className={`flex justify-between w-full items-center gap-2 relative flex-[0_0_auto] ${className}`}
    >
      <button
        className="w-[35px] h-[30px] flex items-center justify-center rounded-[5px] border transition-all duration-200"
        style={{
          borderColor: "var(--time-filter-border)",
          backgroundColor: "var(--time-filter-default-bg)",
        }}
        aria-label="عرض الخيارات"
      >
        <Calendar
          className="w-4 h-4"
          style={{ color: "var(--time-filter-default-text)" }}
        />
      </button>

      <div className="flex justify-end w-full gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`flex flex-col h-[30px] items-center justify-end gap-2.5 p-4 relative rounded-[5px] border transition-all focus:outline-none focus:ring-2 focus:ring-[var(--time-filter-active-bg)] focus:ring-opacity-40 ${
              selectedFilter === filter ? "" : "hover:bg-[var(--surface-control-hover)]"
            }`}
            style={{
              borderColor: "var(--time-filter-border)",
              backgroundColor:
                selectedFilter === filter
                  ? "var(--time-filter-active-bg)"
                  : "var(--time-filter-default-bg)",
            }}
            aria-pressed={selectedFilter === filter}
            type="button"
          >
            <div className="flex w-[105px] items-center justify-center gap-[15px] relative flex-[0_0_auto] mt-[-9.00px] mb-[-9.00px] ml-[-28.51px] mr-[-28.51px]">
              <span
                className={`flex items-center justify-center h-4 mt-[-1.00px] text-sm tracking-[0.40px] leading-[19.2px] whitespace-nowrap [font-family:'Tajawal',Helvetica] [direction:rtl] transition-colors ${
                  selectedFilter === filter
                    ? "font-bold"
                    : "font-normal"
                }`}
                style={{
                  color:
                    selectedFilter === filter
                      ? "var(--time-filter-active-text)"
                      : "var(--time-filter-default-text)",
                }}
              >
                {filter}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
