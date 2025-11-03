import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Table, Pagination, ExportButton } from "../../../shared";
import { ArrowLeft, MapPin, Building2, MoreVertical, Download, Eye } from "lucide-react";
import { createPortal } from "react-dom";

// Mock country info
const countryInfo = {
  countryNameAr: "مصر",
  countryNameEn: "Egypt",
  numberOfRegions: "52",
  creator: "محمد طارق",
  creationDate: "21 فبراير 2025",
};

// Mock cities data
const cities = Array.from({ length: 145 }).map((_, i) => ({
  id: i + 1,
  cityNameAr: "القاهرة",
  cityNameEn: "Cairo",
  additionDate: "21 فبراير 2025 - 5:05 ص",
}));

// Mock regions data
const regions = Array.from({ length: 145 }).map((_, i) => ({
  id: i + 1,
  regionNameAr: "منطقة الشروق",
  regionNameEn: "Al-Shorouk Region",
  cityName: "بورسعيد",
  additionDate: "21 فبراير 2025 - 5:05 ص",
}));

// Export Menu Component
const ExportMenu = ({ items }: { items: any[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const updateMenuPosition = () => {
    if (!buttonRef) return;
    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 150;
    const viewportWidth = window.innerWidth;
    let left = rect.right + 4;
    if (left + menuWidth > viewportWidth) left = rect.left - menuWidth - 4;
    setMenuPosition({ top: rect.bottom + 4, left: Math.max(4, left) });
  };

  const handleExport = (format: "excel" | "pdf") => {
    console.log("Export items as", format);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={setButtonRef}
        onClick={() => {
          setIsOpen((v) => !v);
          setTimeout(updateMenuPosition, 0);
        }}
        className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray"
      >
        <div className="flex items-center gap-[var(--corner-radius-small)]">
          <span className="font-body-body-2 text-[length:var(--body-body-2-font-size)] text-color-mode-text-icons-t-sec [direction:rtl]">
            تصدير
          </span>
          <Download className="w-4 h-4 text-gray-500" />
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          {createPortal(
            <div
              className="fixed w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <div className="py-1">
                <button
                  onClick={() => handleExport("excel")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>ملف Excel</span>
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>ملف PDF</span>
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
};

const CountryDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [citiesPage, setCitiesPage] = useState(1);
  const [regionsPage, setRegionsPage] = useState(2);
  const itemsPerPage = 10;

  const citiesColumns = useMemo(
    () => [
      {
        key: "additionDate",
        label: "تاريخ الاضافة",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "cityNameEn",
        label: "اسم المدينة بالانجليزي",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "cityNameAr",
        label: "اسم المدينة بالعربي",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "id",
        label: "الرقم",
        width: "min-w-[80px]",
        priority: "high",
      },
    ],
    []
  );

  const regionsColumns = useMemo(
    () => [
      {
        key: "additionDate",
        label: "تاريخ الاضافة",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "cityName",
        label: "اسم المدينة",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "regionNameEn",
        label: "اسم المنطقة بالانجليزي",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "regionNameAr",
        label: "اسم المنطقة بالعربي",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "id",
        label: "الرقم",
        width: "min-w-[80px]",
        priority: "high",
      },
    ],
    []
  );

  const paginatedCities = useMemo(
    () =>
      cities.slice((citiesPage - 1) * itemsPerPage, citiesPage * itemsPerPage),
    [citiesPage]
  );

  const paginatedRegions = useMemo(
    () =>
      regions.slice((regionsPage - 1) * itemsPerPage, regionsPage * itemsPerPage),
    [regionsPage]
  );

  return (
    <div className="flex flex-col w-full items-start gap-5">
      {/* Country Info Card */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center justify-end gap-1.5">
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              معلومات الدولة
            </h1>
            <Building2 className="w-5 h-5 text-gray-500" />
          </div>
          <button
            onClick={() => navigate(-1)}
            aria-label="رجوع"
            className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)]"
          >
            <div className="flex w-10 h-10 items-center justify-center bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </div>
          </button>
        </div>

        {/* Country Info Fields */}
        <div className="w-full flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-normal text-[var(--form-readonly-label-color)] text-right [direction:rtl]">
                اسم الدولة بالعربي
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-[10px] border border-color-mode-text-icons-t-placeholder text-[var(--form-readonly-input-text-color)] text-right [direction:rtl]">
                {countryInfo.countryNameAr}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-normal text-[var(--form-readonly-label-color)] text-right [direction:rtl]">
                اسم الدولة بالانجليزي
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-[10px] border border-color-mode-text-icons-t-placeholder text-[var(--form-readonly-input-text-color)] text-right [direction:rtl]">
                {countryInfo.countryNameEn}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-normal text-[var(--form-readonly-label-color)] text-right [direction:rtl]">
                عدد المناطق
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-[10px] border border-color-mode-text-icons-t-placeholder text-[var(--form-readonly-input-text-color)] text-right [direction:rtl]">
                {countryInfo.numberOfRegions}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-normal text-[var(--form-readonly-label-color)] text-right [direction:rtl]">
                المنشئ
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-[10px] border border-color-mode-text-icons-t-placeholder text-[var(--form-readonly-input-text-color)] text-right [direction:rtl]">
                {countryInfo.creator}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-normal text-[var(--form-readonly-label-color)] text-right [direction:rtl]">
              تاريخ الانشاء
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-[10px] border border-color-mode-text-icons-t-placeholder text-[var(--form-readonly-input-text-color)] text-right [direction:rtl]">
              {countryInfo.creationDate}
            </div>
          </div>
        </div>
      </div>

      {/* Cities Table Section */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <header className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center justify-end gap-1.5">
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              المدن المضافة ({cities.length})
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/admin-countries/${id}/add-city`)}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-[10px] border-2 border-[#5A66C1] text-[#5A66C1] font-medium hover:bg-blue-50 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              إضافة مدينة جديدة
            </button>
            <ExportMenu items={cities} />
          </div>
        </header>

        <div className="w-full overflow-x-auto">
          <Table columns={citiesColumns} data={paginatedCities} />
        </div>

        <Pagination
          currentPage={citiesPage}
          totalPages={Math.ceil(cities.length / itemsPerPage) || 1}
          onPageChange={setCitiesPage}
        />
      </div>

      {/* Regions Table Section */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <header className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center justify-end gap-1.5">
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              المناطق المضافة ({regions.length})
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/admin-countries/${id}/add-region`)}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-[10px] border-2 border-[#5A66C1] text-[#5A66C1] font-medium hover:bg-blue-50 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              إضافة منطقة جديدة
            </button>
            <ExportMenu items={regions} />
          </div>
        </header>

        <div className="w-full overflow-x-auto">
          <Table columns={regionsColumns} data={paginatedRegions} />
        </div>

        <Pagination
          currentPage={regionsPage}
          totalPages={Math.ceil(regions.length / itemsPerPage) || 1}
          onPageChange={setRegionsPage}
        />
      </div>
    </div>
  );
};

export default CountryDetails;

