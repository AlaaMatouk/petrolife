import React from "react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  className?: string;
  previousLabel?: string;
  nextLabel?: string;
  disabled?: boolean;
  useEasternArabic?: boolean;
  showArrowOnly?: boolean;
}

// Convert number to Eastern Arabic numerals
const toEasternArabic = (num: number): string => {
  const easternArabic = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .split("")
    .map((digit) => easternArabic[parseInt(digit)])
    .join("");
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisiblePages = 7,
  className = "",
  previousLabel = "السابق",
  nextLabel = "التالي",
  disabled = false,
  useEasternArabic = false,
  showArrowOnly = false,
}) => {
  const generatePageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (maxVisiblePages === 3) {
      // Show only 3 pages: current page and 2 adjacent pages
      if (totalPages <= 3) {
        // Show all pages if total is 3 or less
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show current page and pages around it
        const start = Math.max(1, currentPage - 1);
        const end = Math.min(totalPages, currentPage + 1);
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      }
    } else if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    // Reverse for RTL display (highest number first)
    return pages.reverse();
  };

  const pageNumbers = generatePageNumbers();
  // Keep numbers in natural order (right to left in RTL)

  const handlePrevious = () => {
    if (currentPage > 1 && !disabled) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !disabled) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === "number" && !disabled) {
      onPageChange(page);
    }
  };

  return (
    <nav
      className={`flex items-center justify-center gap-2 flex-wrap ${className}`}
      role="navigation"
      aria-label="تنقل الصفحات"
    >
      <div className="flex items-center justify-center gap-2">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage <= 1 || disabled}
          className={`flex h-9 items-center justify-center rounded-md border border-[color:var(--border-subtle)] bg-[var(--surface-control)] hover:bg-[var(--surface-control-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            showArrowOnly ? "w-9 px-0" : "gap-2 px-3"
          }`}
          aria-label="الصفحة السابقة"
        >
          {showArrowOnly ? (
            <span className="text-[var(--text-secondary)] text-lg font-medium">&lt;</span>
          ) : (
            <>
              <img
                className="relative w-4 h-4"
                alt="سهم يسار"
                src="/img/icon-16-arrow-left.svg"
              />
              <div className="relative font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--text-secondary)] text-sm leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                {previousLabel}
              </div>
            </>
          )}
        </button>

        {/* Page Numbers - Natural order (right to left) */}
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <div
                key={`ellipsis-${index}`}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--border-subtle)] bg-[var(--surface-control)] text-[var(--text-secondary)]"
              >
                ...
              </div>
            );
          }

          const isActive = page === currentPage;
          const pageNum = page as number;
          const displayNum = useEasternArabic ? toEasternArabic(pageNum) : pageNum.toString();

          return (
            <button
              key={pageNum}
              onClick={() => handlePageClick(pageNum)}
              disabled={disabled}
              className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed ${
                isActive
                  ? "bg-blue-900 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              aria-label={`الصفحة ${pageNum}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-sm font-medium">
                {displayNum}
              </span>
            </button>
          );
        })}

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage >= totalPages || disabled}
          className={`flex h-9 items-center justify-center rounded-md border border-[color:var(--border-subtle)] bg-[var(--surface-control)] hover:bg-[var(--surface-control-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            showArrowOnly ? "w-9 px-0" : "gap-2 px-3"
          }`}
          aria-label="الصفحة التالية"
        >
          {showArrowOnly ? (
            <span className="text-[var(--text-secondary)] text-lg font-medium">&gt;</span>
          ) : (
            <>
              <div className="relative font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--text-secondary)] text-sm leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                {nextLabel}
              </div>
              <img
                className="relative w-4 h-4"
                alt="سهم يمين"
                src="/img/icon-16-arrow-right.svg"
              />
            </>
          )}
        </button>
      </div>
    </nav>
  );
};
