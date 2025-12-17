import React, { useState, useEffect } from "react";
import { ControlPanelSection } from "./sections/ControlPanelSection/ControlPanelSection";
import { DataDisplaySection } from "./sections/DataDisplaySection";
import { PaginationSection } from "./sections/PaginationSection/PaginationSection";
import { Map } from "./sections/map/Map";

export const PerolifeStationLocations = (): JSX.Element => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState("كل الشركات");
  const [selectedCity, setSelectedCity] = useState("كل المدن");
  const [companies, setCompanies] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCompany, selectedCity]);

  return (
    <>
      <Map />
      <div
        className="flex flex-col  items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
        data-model-id="1:13337"
      >
        <DataDisplaySection
          selectedCompany={selectedCompany}
          selectedCity={selectedCity}
          onCompanyChange={setSelectedCompany}
          onCityChange={setSelectedCity}
          companies={companies}
          cities={cities}
        />
        <ControlPanelSection
          currentPage={currentPage}
          setTotalPages={setTotalPages}
          selectedCompany={selectedCompany}
          selectedCity={selectedCity}
          onCompaniesExtracted={setCompanies}
          onCitiesExtracted={setCities}
        />
        <PaginationSection currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </>
  );
};
