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
}

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
}) => {
  const generatePageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisiblePages) {
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

    return pages;
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
      className={`flex items-center justify-center gap-3 flex-wrap w-full ${className}`}
      role="navigation"
      aria-label="تنقل الصفحات"
    >
      <div className="flex items-center justify-center gap-2">
        {/* Previous Button - السابق on the RIGHT with left arrow on left side */}
        <button
          onClick={handlePrevious}
          disabled={currentPage <= 1 || disabled}
          className="flex h-9 items-center justify-center gap-2 px-3 rounded-md border border-[color:var(--border-subtle)] bg-[var(--surface-control)] hover:bg-[var(--surface-control-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="الصفحة السابقة"
        >
          <img
            className="relative w-4 h-4"
            alt="سهم يسار"
            src="/img/icon-16-arrow-left.svg"
          />
          <div className="relative font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--text-secondary)] text-sm leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
            {previousLabel}
          </div>
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

          return (
            <button
              key={pageNum}
              onClick={() => handlePageClick(pageNum)}
              disabled={disabled}
              className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed ${
                isActive
                  ? "bg-color-mode-surface-primary-blue text-white"
                  : "bg-[var(--surface-control)] border border-[color:var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-control-hover)]"
              }`}
              aria-label={`الصفحة ${pageNum}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={`text-sm font-medium ${
                  isActive
                    ? "font-subtitle-subtitle-3 text-color-mode-text-icons-t-btn-negative"
                    : "font-body-body-2 text-current"
                }`}
              >
                {pageNum}
              </span>
            </button>
          );
        })}

        {/* Next Button - التالي on the LEFT with right arrow on right side */}
        <button
          onClick={handleNext}
          disabled={currentPage >= totalPages || disabled}
          className="flex h-9 items-center justify-center gap-2 px-3 rounded-md border border-[color:var(--border-subtle)] bg-[var(--surface-control)] hover:bg-[var(--surface-control-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="الصفحة التالية"
        >
          <div className="relative font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--text-secondary)] text-sm leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
            {nextLabel}
          </div>
          <img
            className="relative w-4 h-4"
            alt="سهم يمين"
            src="/img/icon-16-arrow-right.svg"
          />
        </button>
      </div>
    </nav>
  );
};
