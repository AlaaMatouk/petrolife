import React, { useState, useRef } from "react";
import { ContentSection } from "./sections/ContentSection/ContentSection";
import { HeaderSection } from "./sections/HeaderSection/HeaderSection";
import { PaginationSection } from "./sections/PaginationSection/PaginationSection";

export const WalletChargeRequests = (): JSX.Element => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("اخر 12 شهر");
  const exportHandlerRef = useRef<((format: string) => void) | null>(null);

  return (
    <div className="flex flex-col items-start gap-6 pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
      <HeaderSection 
        selectedTimeFilter={selectedTimeFilter} 
        onFilterChange={setSelectedTimeFilter}
        onExport={(format) => exportHandlerRef.current?.(format)}
      />
      <ContentSection 
        currentPage={currentPage} 
        setTotalPages={setTotalPages} 
        selectedTimeFilter={selectedTimeFilter}
        onExportHandlerReady={(handler) => { exportHandlerRef.current = handler; }}
      />
      <PaginationSection currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
};
