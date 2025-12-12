import { Fuel, ChevronLeft } from "lucide-react";
import React from "react";

interface DataDisplaySectionProps {
  selectedCompany: string;
  selectedCity: string;
  onCompanyChange: (value: string) => void;
  onCityChange: (value: string) => void;
  companies: string[];
  cities: string[];
}

export const DataDisplaySection = ({
  selectedCompany,
  selectedCity,
  onCompanyChange,
  onCityChange,
  companies,
  cities,
}: DataDisplaySectionProps): JSX.Element => {
  // Create options for company dropdown - include "كل الشركات" as first option
  const companyOptions = [
    { value: "كل الشركات", label: "كل الشركات" },
    ...companies
      .filter((company) => company && company !== "N/A" && company.trim() !== "")
      .sort()
      .map((company) => ({ value: company, label: company })),
  ];

  // Create options for city dropdown - include "كل المدن" as first option
  const cityOptions = [
    { value: "كل المدن", label: "كل المدن" },
    ...cities
      .filter((city) => city && city !== "N/A" && city.trim() !== "")
      .sort()
      .map((city) => ({ value: city, label: city })),
  ];

  return (
    <header
      className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]"
      role="banner"
    >
      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-2.5 relative flex-1 grow">
          <div
            className="inline-flex items-start gap-2.5 relative flex-[0_0_auto]"
            role="group"
            aria-label="فلاتر البحث"
          >
            {/* Company Dropdown */}
            <div className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder w-[140px]">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <ChevronLeft className="relative w-[18px] h-[18px] text-gray-500 pointer-events-none" />
                <select
                  value={selectedCompany}
                  onChange={(e) => onCompanyChange(e.target.value)}
                  className="relative w-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none cursor-pointer appearance-none pr-1 pl-6"
                  aria-label="فلتر الشركات"
                >
                  {companyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* City Dropdown */}
            <div className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder w-[140px]">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <ChevronLeft className="relative w-[18px] h-[18px] text-gray-500 pointer-events-none" />
                <select
                  value={selectedCity}
                  onChange={(e) => onCityChange(e.target.value)}
                  className="relative w-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none cursor-pointer appearance-none pr-1 pl-6"
                  aria-label="فلتر المدن"
                >
                  {cityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
          <h1 className="w-[201px] h-5 mt-[-1.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] relative font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]">
            مواقع محطات بترولايف
          </h1>

          <Fuel className="w-5 h-5 text-gray-500" />
        </div>
      </div>
    </header>
  );
};
