import { Table } from "../../../../components/shared/Table/Table";
import { Pagination } from "../../../../components/shared/Pagination/Pagination";
import { ExportButton, LoadingSpinner } from "../../../../components/shared";
import { carData } from "../../../../constants/data";
import { useNavigate } from "react-router-dom";
import {
  Car,
  CirclePlus,
  Settings,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  fetchCompaniesCars,
  normalizeCarSize,
} from "../../../../services/firestore";
import { exportDataTable } from "../../../../services/exportService";
import { useToast } from "../../../../context/ToastContext";

// Define table columns for cars - original order with responsive design
const carColumns = [
  {
    key: "actions",
    label: "الإجراءات",
    width: "w-16 min-w-[60px]",
    priority: "high",
    render: (_: any, row: any) => <ActionMenu car={row} />,
  },
  {
    key: "drivers",
    label: "السائقون",
    width: "flex-1 grow min-w-[150px]",
    priority: "high",
    render: (value: any) => (
      <div className="flex items-center justify-center gap-1.5">
        <span className="font-[number:var(--body-body-2-font-weight)] text-black text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
          {value[0].name}
        </span>
        <div
          className={`relative ${
            value[0].avatar3
              ? "w-[46px] h-[24.6px]"
              : value[0].avatar2
              ? "w-10 h-[24.59px]"
              : "w-6 h-6"
          }`}
        >
          {value[0].avatar3 ? (
            <>
              <img
                className="absolute top-0 left-[22px] w-6 h-6 aspect-[1] object-cover"
                alt="سائق"
                src={value[0].avatar1}
              />
              <img
                className="-top-0.5 left-[9px] w-7 h-7 absolute aspect-[1] object-cover"
                alt="سائق"
                src={value[0].avatar2}
              />
              <img
                className="-top-0.5 -left-0.5 w-7 h-7 absolute aspect-[1] object-cover"
                alt="سائق"
                src={value[0].avatar3}
              />
            </>
          ) : value[0].avatar2 ? (
            <>
              <img
                className="top-0 left-4 w-6 h-6 absolute aspect-[1] object-cover"
                alt="سائق"
                src={value[0].avatar1}
              />
              <img
                className="-top-0.5 -left-0.5 w-7 h-7 absolute aspect-[1] object-cover"
                alt="سائق"
                src={value[0].avatar2}
              />
            </>
          ) : (
            <div
              className="relative w-6 h-6 bg-cover bg-[50%_50%]"
              style={{
                backgroundImage: `url(${value[0].avatar1})`,
              }}
            />
          )}
        </div>
      </div>
    ),
  },
  {
    key: "fuelType",
    label: "نوع الوقود",
    width: "flex-1 grow min-w-[120px]",
    priority: "medium",
  },
  {
    key: "category",
    label: "تصنيف السيارة",
    width: "flex-1 grow min-w-[140px]",
    priority: "medium",
    render: (value: any) => (
      <div className="flex items-center justify-center gap-1">
        {value ? (
          <>
            <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
              {value.name}
            </span>
            <img
              className="w-4 h-4 aspect-[1]"
              alt={value.name}
              src={value.icon}
            />
          </>
        ) : (
          <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] font-body-body-2 whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
            --
          </span>
        )}
      </div>
    ),
  },
  {
    key: "year",
    label: "سنة الاصدار",
    width: "flex-1 grow min-w-[100px]",
    priority: "low",
  },
  {
    key: "model",
    label: "الطراز",
    width: "flex-1 grow min-w-[100px]",
    priority: "low",
  },
  {
    key: "brand",
    label: "الماركة",
    width: "flex-1 grow min-w-[100px]",
    priority: "low",
  },
  {
    key: "carName",
    label: "اسم السيارة",
    width: "flex-1 grow min-w-[130px]",
    priority: "high",
  },
  {
    key: "carNumber",
    label: "رقم السيارة",
    width: "flex-1 grow min-w-[100px]",
    priority: "high",
  },
];

// Action Menu Component
const ActionMenu = ({ car }: { car: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    console.log(`${action} clicked for car:`, car.carNumber);
    if (action === "view") {
      navigate(`/car/${car.id}`);
    }
    setIsOpen(false);
  };

  const updateMenuPosition = () => {
    if (!buttonRef) return;

    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 192; // 48 * 4 (w-48 = 12rem = 192px)
    const viewportWidth = window.innerWidth;

    // Calculate position to the right of the icon
    let left = rect.right + window.scrollX + 4;

    // If menu would go off-screen to the right, position it to the left of the icon
    if (left + menuWidth > viewportWidth) {
      left = rect.left + window.scrollX - menuWidth - 4;
    }

    const newPosition = {
      top: rect.top + window.scrollY,
      left: Math.max(4, left), // Ensure it doesn't go off-screen to the left
    };

    setMenuPosition(newPosition);
  };

  useEffect(() => {
    if (isOpen) {
      updateMenuPosition();

      const handleScroll = () => updateMenuPosition();
      const handleResize = () => updateMenuPosition();

      window.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isOpen, buttonRef]);

  return (
    <div className="relative">
      <button
        ref={setButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="إجراءات"
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu - Using portal to render outside table container */}
          {createPortal(
            <div
              className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
            >
              <div className="py-1">
                <button
                  onClick={() => handleAction("view")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>عرض التفاصيل</span>
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleAction("edit")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>تعديل</span>
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleAction("delete")}
                  className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>حذف</span>
                  <Trash2 className="w-4 h-4" />
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

// Mobile Card Component
const CarCard = ({
  car,
  onToggleDetails,
  isExpanded,
}: {
  car: any;
  onToggleDetails: () => void;
  isExpanded: boolean;
}) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
      {/* Main Info - Always Visible */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/car/${car.id}`)}
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Car className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {car.carName}
            </h3>
            <p className="text-gray-500 text-xs">{car.carNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ActionMenu car={car} />
          <button
            onClick={onToggleDetails}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Drivers */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-500">السائقون:</span>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{car.drivers[0].name}</span>
          <div className="flex -space-x-1">
            {car.drivers[0].avatar1 && (
              <img
                className="w-6 h-6 rounded-full border-2 border-white"
                alt="سائق"
                src={car.drivers[0].avatar1}
              />
            )}
            {car.drivers[0].avatar2 && (
              <img
                className="w-6 h-6 rounded-full border-2 border-white"
                alt="سائق"
                src={car.drivers[0].avatar2}
              />
            )}
            {car.drivers[0].avatar3 && (
              <img
                className="w-6 h-6 rounded-full border-2 border-white"
                alt="سائق"
                src={car.drivers[0].avatar3}
              />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t pt-3 space-y-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 text-xs">الماركة:</span>
              <p className="font-medium">{car.brand}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">الطراز:</span>
              <p className="font-medium">{car.model}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">سنة الاصدار:</span>
              <p className="font-medium">{car.year}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">نوع الوقود:</span>
              <p className="font-medium">{car.fuelType}</p>
            </div>
          </div>
          {car.category && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-gray-500 text-xs">التصنيف:</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{car.category.name}</span>
                <img
                  className="w-4 h-4"
                  alt={car.category.name}
                  src={car.category.icon}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to safely get value or return "-"
const getValueOrDash = (value: any): string => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
};

// Helper function to get car size text in Arabic (using normalized function)
const getCarSizeText = (size: string): string => {
  const normalized = normalizeCarSize(size);
  return normalized === "-" ? getValueOrDash(size) : normalized;
};

// Helper function to get fuel type text in Arabic
const getFuelTypeText = (fuelType: string): string => {
  const fuelMap: { [key: string]: string } = {
    fuel91: "بنزين 91",
    fuel95: "بنزين 95",
    diesel: "ديزل",
  };
  return fuelMap[fuelType?.toLowerCase()] || getValueOrDash(fuelType);
};

// Convert Firestore companies-cars data to match table format
const convertFirestoreToCars = (firestoreData: any[]): any[] => {
  return firestoreData.map((car, index) => ({
    id: car.id || index + 1,
    carNumber: getValueOrDash(car.plateNumber?.ar || car.plateNumber?.en),
    carName: getValueOrDash(car.name),
    brand: getValueOrDash(car.carModel?.name?.ar || car.carModel?.name?.en),
    model: getValueOrDash(car.carType?.name?.ar || car.carType?.name?.en),
    year: getValueOrDash(car.carType?.year),
    fuelType: getFuelTypeText(car.fuelType),
    category: {
      name: getCarSizeText(car.plan?.carSize || car.size),
      icon: "/img/component-4-8.svg",
    },
    drivers:
      car.driverIds && car.driverIds.length > 0
        ? [
            {
              name: `${car.driverIds.length} سائق`,
              avatar1: "/img/ellipse-17.svg",
              avatar2: car.driverIds.length > 1 ? "/img/ellipse-18.svg" : null,
              avatar3: car.driverIds.length > 2 ? "/img/ellipse-17.svg" : null,
            },
          ]
        : [
            {
              name: "لا يوجد سائقين",
              avatar1: "/img/ellipse-17.svg",
              avatar2: null,
              avatar3: null,
            },
          ],
  }));
};

interface CarListSectionProps {
  searchQuery?: string;
}

export const CarListSection = ({
  searchQuery = "",
}: CarListSectionProps): JSX.Element => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [cars, setCars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  // Fetch cars data from Firestore on component mount
  useEffect(() => {
    const loadCarsData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // console.log('Loading companies-cars data from Firestore...');
        const firestoreCars = await fetchCompaniesCars();

        if (firestoreCars && firestoreCars.length > 0) {
          // console.log('Converting Firestore data to Cars format...');
          const convertedCars = convertFirestoreToCars(firestoreCars);
          // console.log('Converted cars:', convertedCars);
          setCars(convertedCars);
        } else {
          // console.log('No cars found in Firestore.');
          setCars([]);
        }
      } catch (err) {
        console.error("Error loading cars from Firestore:", err);
        setError("فشل في تحميل بيانات السيارات.");
        setCars([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCarsData();
  }, []);

  const toggleCardExpansion = (carId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(carId)) {
      newExpanded.delete(carId);
    } else {
      newExpanded.add(carId);
    }
    setExpandedCards(newExpanded);
  };

  // Handle export
  const handleExport = async (format: string) => {
    try {
      // Define columns for export
      const exportColumns = [
        { key: "carNumber", label: "رقم السيارة" },
        { key: "carName", label: "اسم السيارة" },
        { key: "brand", label: "الماركة" },
        { key: "model", label: "الطراز" },
        { key: "year", label: "سنة الاصدار" },
        { key: "fuelType", label: "نوع الوقود" },
        { key: "category", label: "تصنيف السيارة" },
        { key: "drivers", label: "السائقون" },
      ];

      await exportDataTable(
        filteredCars,
        exportColumns,
        "cars-report",
        format as "excel" | "pdf",
        "تقرير السيارات"
      );

      addToast({
        title: "نجح التصدير",
        message: `تم تصدير بيانات السيارات بنجاح`,
        type: "success",
      });
    } catch (error) {
      console.error("Export error:", error);
      addToast({
        title: "فشل التصدير",
        message: "حدث خطأ أثناء تصدير البيانات",
        type: "error",
      });
    }
  };

  // Filter cars based on search query
  const filteredCars = cars.filter((car) => {
    if (!searchQuery || searchQuery.trim() === "") {
      return true;
    }

    const query = searchQuery.toLowerCase().trim();

    // Search across multiple fields
    return (
      car.carName?.toLowerCase().includes(query) ||
      car.carNumber?.toLowerCase().includes(query) ||
      car.brand?.toLowerCase().includes(query) ||
      car.model?.toLowerCase().includes(query) ||
      car.year?.toLowerCase().includes(query) ||
      car.fuelType?.toLowerCase().includes(query) ||
      car.category?.name?.toLowerCase().includes(query)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredCars.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCars = filteredCars.slice(startIndex, endIndex);

  return (
    <section className="flex flex-col items-start gap-5 w-full">
      {/* Loading State - Full page spinner */}
      {isLoading ? (
        <LoadingSpinner size="lg" message="جاري التحميل..." />
      ) : (
        <>
          {/* Error Message */}
          {error && (
            <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-center [direction:rtl]">
                {error}
              </p>
            </div>
          )}

          {/* Data Display Section - Always show header */}
          <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
            <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]">
                  <button
                    onClick={() => navigate("/addcar")}
                    className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                  >
                    <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                        <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                          إضافة سيارة جديدة
                        </span>
                      </div>
                      <CirclePlus className="w-4 h-4 text-gray-500" />
                    </div>
                  </button>

                  <button className="flex flex-col w-[150px] items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors">
                    <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                        <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                          اعدادات السيارات
                        </span>
                      </div>
                      <Settings className="w-4 h-4 text-gray-500" />
                    </div>
                  </button>

                  <ExportButton onExport={handleExport} />
                </div>

                <div className="flex w-[134px] items-center justify-end gap-1.5 relative">
                  <h1 className="relative w-[117px] h-5 mt-[-1.00px] ml-[-7.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]">
                    السيــــــــــــــارت ({filteredCars.length})
                  </h1>
                  <Car className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            </header>

            {/* No Data Message */}
            {!isLoading && !error && filteredCars.length === 0 && (
              <div className="flex items-center justify-center w-full py-12">
                <div className="text-center">
                  <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg [direction:rtl]">
                    {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد سيارات"}
                  </p>
                  <p className="text-gray-400 text-sm mt-2 [direction:rtl]">
                    {searchQuery
                      ? "جرب مصطلح بحث آخر"
                      : "قم بإضافة سيارة جديدة للبدء"}
                  </p>
                </div>
              </div>
            )}

            <main className="flex flex-col items-start gap-7 relative self-stretch w-full flex-[0_0_auto]">
              {/* Only show table/data if we have cars */}
              {filteredCars.length > 0 && (
                <>
                  <div className="flex flex-col items-end gap-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto]">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block w-full">
                      <Table
                        columns={carColumns}
                        data={Array.isArray(paginatedCars) ? paginatedCars : []}
                        className="relative self-stretch w-full flex-[0_0_auto]"
                      />
                    </div>

                    {/* Tablet Responsive Table View */}
                    <div className="hidden md:block lg:hidden w-full">
                      <Table
                        columns={carColumns.filter(
                          (col) =>
                            col.priority === "high" || col.priority === "medium"
                        )}
                        data={Array.isArray(paginatedCars) ? paginatedCars : []}
                        className="relative self-stretch w-full flex-[0_0_auto]"
                      />
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4 w-full">
                      {paginatedCars.map((car) => (
                        <CarCard
                          key={car.id}
                          car={car}
                          onToggleDetails={() => toggleCardExpansion(car.id)}
                          isExpanded={expandedCards.has(car.id)}
                        />
                      ))}
                    </div>
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </main>
          </div>
        </>
      )}
    </section>
  );
};
