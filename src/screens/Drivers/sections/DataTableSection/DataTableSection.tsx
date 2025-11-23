import React, { useEffect, useState } from "react";
import { Table } from "../../../../components/shared/Table/Table";
import { Pagination } from "../../../../components/shared/Pagination/Pagination";
import { LoadingSpinner } from "../../../../components/shared/Spinner";
import { StatusToggle } from "../../../../components/shared/StatusToggle";
import { useDrivers } from "../../../../hooks/useGlobalState";
import { driversData as mockDriversData } from "../../../../constants/data";
import { useNavigate } from "react-router-dom";
import { fetchCompaniesDrivers, addRefidToExistingCompanyDrivers } from "../../../../services/firestore";
import { exportDataTable } from "../../../../services/exportService";
import { useToast } from "../../../../context/ToastContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import {
  UserRound,
  CirclePlus,
  Download,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Car,
  Truck,
  CarFront,
  FileSpreadsheet,
  FileText,
  Download as DownloadIcon,
  Trash2,
  User,
  SlidersHorizontal,
} from "lucide-react";
import { createPortal } from "react-dom";

// Driver interface
interface Driver {
  id: number | string;
  firestoreId?: string; // Firestore document ID
  driverCode: string;
  driverName: string;
  phone: string;
  address: string;
  fuelType: string;
  financialValue: string;
  carNumber: string;
  carCategory: { text: string; icon: string | null };
  accountStatus: { active: boolean; text: string };
}

// Helper function to calculate driver stats by category
const calculateDriverStats = (drivers: Driver[]) => {
  const stats = {
    vip: 0,
    large: 0,
    medium: 0,
    small: 0,
  };

  drivers.forEach((driver) => {
    const category = driver.carCategory?.text;
    if (!category) return;

    // Handle VIP (case-insensitive)
    if (category.toUpperCase() === "VIP") {
      stats.vip++;
    }
    // Handle كبيرة (big/large)
    else if (category === "كبيرة") {
      stats.large++;
    }
    // Handle متوسطة (middle/medium)
    else if (category === "متوسطة") {
      stats.medium++;
    }
    // Handle صغيرة (small)
    else if (category === "صغيرة") {
      stats.small++;
    }
  });

  return [
    {
      title: "سائقي السيارات ال VIP",
      count: stats.vip.toString(),
      icon: <Car className="w-6 h-6 text-purple-600" />,
      iconBgColor: "bg-purple-100",
      iconBorderColor: "border-purple-300",
    },
    {
      title: "سائقي السيارات الكبيرة",
      count: stats.large.toString(),
      icon: <Truck className="w-6 h-6 text-blue-600" />,
      iconBgColor: "bg-blue-100",
      iconBorderColor: "border-blue-300",
    },
    {
      title: "سائقي السيارات المتوسطة",
      count: stats.medium.toString(),
      icon: <CarFront className="w-6 h-6 text-orange-600" />,
      iconBgColor: "bg-orange-100",
      iconBorderColor: "border-orange-300",
    },
    {
      title: "سائقي السيارات الصغيرة",
      count: stats.small.toString(),
      icon: <Car className="w-6 h-6 text-green-600" />,
      iconBgColor: "bg-green-100",
      iconBorderColor: "border-green-300",
    },
  ];
};

// Helper function to safely get value or return "-"
const getValueOrDash = (value: any): string => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
};

// Helper function to get car size text in Arabic
const getCarSizeText = (size: string): string => {
  const sizeMap: { [key: string]: string } = {
    small: "صغيرة",
    medium: "متوسطة",
    middle: "متوسطة",
    large: "كبيرة",
    big: "كبيرة",
    vip: "VIP",
  };
  return sizeMap[size?.toLowerCase()] || getValueOrDash(size);
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

// Convert Firestore companies-drivers data to match our Driver interface
const convertFirestoreToDrivers = (firestoreData: any[]): Driver[] => {
  return firestoreData.map((driver, index) => {
    // Extract car size from plan.carSize or size
    const carSize = driver.plan?.carSize || driver.size || driver.car?.size;

    // Extract plate number (prefer Arabic)
    const plateNumber =
      driver.plateNumber?.ar ||
      driver.plateNumber?.en ||
      driver.car?.plateNumber?.ar ||
      driver.car?.plateNumber?.en;

    // Extract city/address (prefer Arabic)
    const cityName =
      driver.city?.name?.ar || driver.city?.name?.en || driver.location;

    // Extract fuel type
    const fuelType = driver.fuelType || driver.car?.fuelType;

    // Extract financial values
    const balance = driver.balance;
    const dailyLimit = driver.plan?.dailyTrans;
    const financialValue =
      balance && dailyLimit
        ? `${balance} / ${dailyLimit}`
        : balance
        ? String(balance)
        : dailyLimit
        ? String(dailyLimit)
        : "-";

    const firestoreId = driver.id; // Firestore document ID
    const isActive = driver.isActive ?? driver.accountStatus?.active ?? driver.status === "active" ?? true;
    
    return {
      id: firestoreId || index + 1,
      firestoreId: firestoreId, // Store Firestore document ID separately
      driverCode: getValueOrDash(driver.refid || firestoreId || driver.code), // Use refid if available, otherwise fall back to firestoreId or driver.code
      driverName: getValueOrDash(
        driver.name || driver.driverName || driver.fullName
      ),
      phone: getValueOrDash(
        driver.phone || driver.phoneNumber || driver.mobile || driver.email
      ),
      address: getValueOrDash(cityName),
      fuelType: getFuelTypeText(fuelType),
      financialValue: financialValue,
      carNumber: getValueOrDash(plateNumber),
      carCategory: {
        text: getCarSizeText(carSize),
        icon: null,
      },
      accountStatus: {
        active: isActive,
        text: isActive ? "مفعل" : "معطل",
      },
    };
  });
};

// Convert mock data to match our Driver interface (fallback)
const convertMockDataToDrivers = (mockData: any[]): Driver[] => {
  return mockData.map((driver, index) => ({
    id: driver.id || index + 1,
    firestoreId: driver.firestoreId || driver.id,
    driverCode: driver.driverCode || "21A254",
    driverName: driver.driverName || "أحمد محمد",
    phone: driver.phone || "00965284358",
    address: driver.address || "12 ش المنيل ، مصر",
    fuelType: driver.fuelType || "بنزين 91",
    financialValue: driver.financialValue || "1600 / 1400",
    carNumber: driver.carNumber || "2145224",
    carCategory: driver.carCategory || {
      text: "صغيرة",
      icon: "/img/component-4-11.svg",
    },
    accountStatus: driver.accountStatus || { active: true, text: "مفعل" },
  }));
};

// Action Menu Component
const ActionMenu = ({ driver }: { driver: Driver }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    console.log(`${action} clicked for driver:`, driver.driverCode);
    if (action === "view") {
      navigate(`/driver/${driver.id}`);
    }
    setIsOpen(false);
  };

  const updateMenuPosition = () => {
    if (!buttonRef) return;

    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 192; // 48 * 4 (w-48 = 12rem = 192px)
    const viewportWidth = window.innerWidth;

    // Calculate position to the right of the icon
    let left = rect.right + 4;

    // If menu would go off-screen to the right, position it to the left of the icon
    if (left + menuWidth > viewportWidth) {
      left = rect.left - menuWidth - 4;
    }

    const newPosition = {
      top: rect.bottom + 4, // Position below the button
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
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

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
                  <span>معلومات السائق</span>
                  <User className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleAction("export")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>تصدير البيانات</span>
                  <DownloadIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleAction("delete")}
                  className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>حذف السائق</span>
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

// Account Status Toggle Component
const AccountStatusToggle = ({ driver }: { driver: Driver }) => {
  const { updateDriver } = useDrivers();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(driver.accountStatus.active);

  // Sync local state when driver prop changes
  useEffect(() => {
    setIsActive(driver.accountStatus.active);
  }, [driver.accountStatus.active]);

  const handleToggle = async () => {
    if (!driver.firestoreId) {
      addToast({
        title: "خطأ",
        message: "معرف السائق غير موجود",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    const newValue = !isActive;
    
    try {
      // Update in Firestore
      const driverDocRef = doc(db, "companies-drivers", driver.firestoreId);
      await updateDoc(driverDocRef, {
        isActive: newValue,
      });

      // Update local state
      setIsActive(newValue);
      
      // Update in global state
      const driverId = typeof driver.id === 'string' ? parseInt(driver.id) || 0 : driver.id;
      updateDriver(driverId, {
        accountStatus: {
          active: newValue,
          text: newValue ? "مفعل" : "معطل",
        },
      });

      addToast({
        title: "تم التحديث",
        message: `تم ${newValue ? "تفعيل" : "تعطيل"} حساب السائق بنجاح`,
        type: "success",
      });
    } catch (error: any) {
      console.error("Error updating driver status:", error);
      addToast({
        title: "خطأ",
        message: "فشل تحديث حالة الحساب. يرجى المحاولة مرة أخرى.",
        type: "error",
      });
      // Revert the toggle on error
      setIsActive(!newValue);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StatusToggle
      isActive={isActive}
      onToggle={handleToggle}
      statusText={driver.accountStatus.text}
      disabled={isLoading}
    />
  );
};

// Export Menu Component
const ExportMenu = ({ drivers }: { drivers: Driver[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const { addToast } = useToast();

  const handleExport = async (format: "excel" | "pdf") => {
    setIsOpen(false);

    try {
      // Define columns for export (excluding actions column)
      const exportColumns = [
        { key: "driverCode", label: "كود السائق" },
        { key: "driverName", label: "اسم السائق" },
        { key: "phone", label: "رقم الهاتف" },
        { key: "address", label: "العنوان" },
        { key: "fuelType", label: "نوع الوقود" },
        { key: "financialValue", label: "القيمة المالية" },
        { key: "carNumber", label: "رقم السيارة" },
        { key: "carCategory", label: "تصنيف السيارة" },
        { key: "accountStatus", label: "حالة الحساب" },
      ];

      await exportDataTable(
        drivers,
        exportColumns,
        "drivers-report",
        format,
        "تقرير السائقين"
      );

      addToast({
        title: "نجح التصدير",
        message: `تم تصدير بيانات السائقين بنجاح`,
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

  const updateMenuPosition = () => {
    if (!buttonRef) return;

    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 150;
    const viewportWidth = window.innerWidth;

    // Calculate position to the right of the button
    let left = rect.right + 4;

    // If menu would go off-screen to the right, position it to the left of the button
    if (left + menuWidth > viewportWidth) {
      left = rect.left - menuWidth - 4;
    }

    const newPosition = {
      top: rect.bottom + 4, // Position below the button
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
        className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
      >
        <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
          <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
            <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
              تصدير
            </span>
          </div>
          <Download className="w-4 h-4 text-gray-500" />
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {createPortal(
            <div
              className="fixed w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
            >
              <div className="py-1">
                <button
                  onClick={() => handleExport("excel")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>ملف Excel</span>
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>ملف PDF</span>
                  <FileText className="w-4 h-4" />
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

interface DataTableSectionProps {
  searchQuery?: string;
}

export const DataTableSection = ({
  searchQuery = "",
}: DataTableSectionProps): JSX.Element => {
  const { drivers, pagination, setDrivers, setCurrentPage, updateDriver } =
    useDrivers();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [rawDriversData, setRawDriversData] = useState<any[]>([]);

  // Fetch companies-drivers data from Firestore on component mount
  useEffect(() => {
    const loadDriversData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // console.log('Loading companies-drivers data from Firestore...');
        const firestoreDrivers = await fetchCompaniesDrivers();
        
        // Store raw data for migration check
        setRawDriversData(firestoreDrivers);

        if (firestoreDrivers && firestoreDrivers.length > 0) {
          // console.log('Converting Firestore data to Driver format...');
          const convertedDrivers = convertFirestoreToDrivers(firestoreDrivers);
          // console.log('Converted drivers:', convertedDrivers);
          setDrivers(convertedDrivers);
        } else {
          // console.log('No drivers found in Firestore.');
          // Don't use mock data, just set empty array
          setDrivers([]);
        }
      } catch (err) {
        console.error("Error loading drivers from Firestore:", err);
        setError("فشل في تحميل بيانات السائقين.");
        setDrivers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDriversData();
  }, [setDrivers]);

  // Handle migration: Add refid to existing drivers
  const handleAddRefidToExisting = async () => {
    setIsMigrating(true);
    try {
      const updatedCount = await addRefidToExistingCompanyDrivers();
      addToast({
        type: "success",
        message: `تم إضافة كود السائق لـ ${updatedCount} سائق بنجاح`,
        duration: 5000,
      });
      // Reload drivers data
      const firestoreDrivers = await fetchCompaniesDrivers();
      setRawDriversData(firestoreDrivers);
      if (firestoreDrivers && firestoreDrivers.length > 0) {
        const convertedDrivers = convertFirestoreToDrivers(firestoreDrivers);
        setDrivers(convertedDrivers);
      }
    } catch (error: any) {
      console.error("Error adding refid to existing drivers:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في إضافة كود السائق للسائقين الموجودة",
        duration: 3000,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Check if migration is needed
  const needsMigration = rawDriversData.some((driver) => !driver.refid);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filter drivers based on search query
  const filteredDrivers = drivers.filter((driver) => {
    if (!searchQuery || searchQuery.trim() === "") {
      return true;
    }

    const query = searchQuery.toLowerCase().trim();

    // Search across multiple fields
    return (
      driver.driverName?.toLowerCase().includes(query) ||
      driver.phone?.toLowerCase().includes(query) ||
      driver.driverCode?.toLowerCase().includes(query) ||
      driver.carNumber?.toLowerCase().includes(query) ||
      driver.address?.toLowerCase().includes(query) ||
      driver.fuelType?.toLowerCase().includes(query)
    );
  });

  // Calculate driver statistics based on actual data
  const driverStats = calculateDriverStats(filteredDrivers);

  // Define table columns for drivers
  const driverColumns = [
    {
      key: "actions",
      label: "الإجراءات",
      width: "w-16 min-w-[60px]",
      priority: "high",
      render: (_: any, row: Driver) => <ActionMenu driver={row} />,
    },
    {
      key: "accountStatus",
      label: "حالة الحساب",
      width: "flex-1 grow min-w-[120px]",
      priority: "high",
      render: (value: any, row: Driver) => (
        <AccountStatusToggle driver={row} />
      ),
    },
    {
      key: "carCategory",
      label: (
        <div className="flex items-center justify-center gap-2">
          <span>تصنيف السيارة</span>
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
        </div>
      ),
      width: "flex-1 grow min-w-[130px]",
      priority: "high",
      render: (value: any) => {
        // Map car category text to appropriate icons
        const getCarIcon = (categoryText: string) => {
          switch (categoryText) {
            case "VIP":
              return <Car className="w-4 h-4 text-purple-600" />;
            case "كبيرة":
              return <Truck className="w-4 h-4 text-blue-600" />;
            case "متوسطة":
              return <CarFront className="w-4 h-4 text-orange-600" />;
            case "صغيرة":
              return <Car className="w-4 h-4 text-green-600" />;
            default:
              return <Car className="w-4 h-4 text-gray-500" />;
          }
        };

        return (
          <div className="flex items-center justify-center gap-1">
            <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
              {value.text}
            </span>
            {getCarIcon(value.text)}
          </div>
        );
      },
    },
    {
      key: "carNumber",
      label: "رقم السيارة",
      width: "flex-1 grow min-w-[100px]",
      priority: "medium",
    },
    {
      key: "financialValue",
      label: (
        <div className="text-center [direction:rtl]">
          <div className="text-sm font-medium">القيمة المالية (ر.س)</div>
          <div className="text-xs text-gray-500 mt-1">
            المستخدمة / المحددة يوميا
          </div>
        </div>
      ),
      width: "flex-1 grow min-w-[200px]",
      priority: "medium",
    },
    {
      key: "fuelType",
      label: "نوع الوقود",
      width: "flex-1 grow min-w-[100px]",
      priority: "low",
    },
    {
      key: "address",
      label: "العنوان",
      width: "flex-1 grow min-w-[150px]",
      priority: "low",
    },
    {
      key: "phone",
      label: "رقم الهاتف",
      width: "flex-1 grow min-w-[120px]",
      priority: "medium",
    },
    {
      key: "driverName",
      label: "اسم السائق",
      width: "flex-1 grow min-w-[120px]",
      priority: "high",
    },
    {
      key: "driverCode",
      label: "كود السائق",
      width: "flex-1 grow min-w-[100px]",
      priority: "high",
    },
  ];

  return (
    <section className="flex flex-col items-start gap-5 w-full">
      {/* Migration Button */}
      {needsMigration && (
        <div className="w-full">
          <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
            <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleAddRefidToExisting}
                  disabled={isMigrating}
                  className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                    <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                      <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                        {isMigrating ? "جاري إضافة كود السائق..." : "إضافة كود السائق للسائقين الموجودة"}
                      </span>
                    </div>
                    {isMigrating && (
                      <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </button>
                <p className="text-sm text-gray-600 [direction:rtl]">
                  هذا الزر يضيف كود سائق (8 أرقام) للسائقين الذين لا يملكون كود
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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

          {/* Driver Stats Cards */}
          <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
            <div className="flex items-center justify-end gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
              <h2 className="relative w-[229px] h-5 mt-[-1.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]">
                توزيع السائقين على السيارات
              </h2>
              <UserRound className="w-5 h-5 text-gray-500" />
            </div>

            <div className="flex h-[119px] items-center gap-5 relative w-full">
              {driverStats.map((stat, index) => (
                <div
                  key={index}
                  className="flex-1 h-full bg-white rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder p-4 relative"
                >
                  {/* Title - Top Right */}
                  <div className="absolute top-4 right-4 text-sm font-medium text-gray-700 [direction:rtl] text-right">
                    {stat.title}
                  </div>

                  {/* Number - Bottom Right */}
                  <div className="absolute bottom-4 right-4 text-3xl font-bold text-purple-600 [direction:rtl] text-right">
                    {stat.count}
                  </div>

                  {/* Icon - Bottom Left with colored circle background */}
                  <div
                    className={`absolute bottom-4 left-4 w-12 h-12 ${stat.iconBgColor} ${stat.iconBorderColor} border-2 rounded-full flex items-center justify-center`}
                  >
                    {stat.icon}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Data Table Section */}
          <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
            <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]">
                  <button
                    onClick={() => navigate("/adddriver")}
                    className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                  >
                    <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                        <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                          إضافة سائق جديد
                        </span>
                      </div>
                      <CirclePlus className="w-4 h-4 text-gray-500" />
                    </div>
                  </button>

                  <ExportMenu drivers={filteredDrivers} />
                </div>

                <div className="flex w-[134px] items-center justify-end gap-1.5 relative">
                  <h1 className="relative w-[117px] h-5 mt-[-1.00px] ml-[-7.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]">
                    عدد السائقين ({filteredDrivers.length})
                  </h1>
                  <UserRound className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            </header>

            <main className="flex flex-col items-start gap-7 relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex flex-col items-end gap-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto]">
                {/* Desktop Table View */}
                <div className="hidden lg:block w-full">
                  <Table
                    columns={driverColumns}
                    data={Array.isArray(filteredDrivers) ? filteredDrivers : []}
                    className="relative self-stretch w-full flex-[0_0_auto]"
                  />
                </div>

                {/* Tablet Responsive Table View */}
                <div className="hidden md:block lg:hidden w-full">
                  <Table
                    columns={driverColumns.filter(
                      (col) =>
                        col.priority === "high" || col.priority === "medium"
                    )}
                    data={Array.isArray(filteredDrivers) ? filteredDrivers : []}
                    className="relative self-stretch w-full flex-[0_0_auto]"
                  />
                </div>

                {/* Mobile Card View - You can implement this later if needed */}
                <div className="md:hidden space-y-4 w-full">
                  <div className="text-center text-gray-500 py-8">
                    عرض الجوال غير متوفر حالياً
                  </div>
                </div>
              </div>

              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </main>
          </div>

          {/* No Data Message */}
          {!isLoading && !error && filteredDrivers.length === 0 && (
            <div className="flex items-center justify-center w-full py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-center">
                <UserRound className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg [direction:rtl]">
                  {searchQuery
                    ? "لا توجد نتائج للبحث"
                    : "لا توجد بيانات سائقين"}
                </p>
                <p className="text-gray-400 text-sm mt-2 [direction:rtl]">
                  {searchQuery
                    ? "جرب مصطلح بحث آخر"
                    : "قم بإضافة سائق جديد للبدء"}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};
