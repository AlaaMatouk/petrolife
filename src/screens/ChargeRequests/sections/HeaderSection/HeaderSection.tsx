import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TimeFilter, ExportButton } from "../../../../components/shared";

interface HeaderSectionProps {
  selectedTimeFilter: string;
  onFilterChange: (filter: string) => void;
  onExport?: (format: string) => void;
}

export const HeaderSection = ({ selectedTimeFilter, onFilterChange, onExport }: HeaderSectionProps): JSX.Element => {
  const navigate = useNavigate();

  return (
    <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
        <div className="inline-flex items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]">
          <button
            onClick={() => navigate('/wallet')}
            className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)] hover:opacity-80 transition-opacity"
            aria-label="العودة"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <ExportButton onExport={onExport} />
          
          <TimeFilter
            selectedFilter={selectedTimeFilter}
            onFilterChange={onFilterChange}
          />
        </div>

        <div className="inline-flex items-center justify-end gap-[var(--corner-radius-extra-large)] relative flex-[0_0_auto]">

          <div className="inline-flex flex-col items-end justify-center gap-2.5 relative flex-[0_0_auto]">
            <div className="flex w-[188px] items-center justify-end gap-1.5 relative flex-[0_0_auto]">
              <h1 className="w-[190px] h-5 mt-[-1.00px] ml-[-26.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] relative font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]">
                طلبات شحن المحفظة
              </h1>

              <img
                className="relative w-[18px] h-[18px] aspect-[1]"
                alt="أيقونة جانبية"
                src="/img/side-icons.svg"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
