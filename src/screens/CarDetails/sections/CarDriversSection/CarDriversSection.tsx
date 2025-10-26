import React, { useState, useEffect } from "react";
import {
  User,
  CirclePlus,
  MoreVertical,
  Info,
  X,
  Search,
  Upload,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Table, TableColumn } from "../../../../components/shared/Table/Table";
import { Input, Select } from "../../../../components/shared/Form";
import {
  fetchDriversByIds,
  fetchCompaniesDrivers,
  addDriverToCar,
  addCompanyDriver,
} from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";
import { createPortal } from "react-dom";

interface Driver {
  id: string;
  driverCode: string;
  driverName: string;
  phoneNumber: string;
  address: string;
  financialValue: string;
  limit: string;
  accountStatus: "active" | "inactive";
}

interface CarDriversSectionProps {
  carData: any;
}

export const CarDriversSection = ({
  carData,
}: CarDriversSectionProps): JSX.Element => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [modalMode, setModalMode] = useState<"select" | "create">("select"); // select existing or create new
  const [newDriverForm, setNewDriverForm] = useState({
    driverName: "",
    email: "",
    phone: "",
    address: "",
    city: carData?.city?.name?.ar || "الرياض",
    driverAmount: "",
    driverImage: null as File | null,
    driverLicense: null as File | null,
  });
  const [selectedDays, setSelectedDays] = useState(["السبت"]);

  const cityOptions = [
    { value: "الرياض", label: "الرياض" },
    { value: "جدة", label: "جدة" },
    { value: "مكة المكرمة", label: "مكة المكرمة" },
    { value: "المدينة المنورة", label: "المدينة المنورة" },
    { value: "الدمام", label: "الدمام" },
    { value: "الخبر", label: "الخبر" },
    { value: "الظهران", label: "الظهران" },
    { value: "الطائف", label: "الطائف" },
    { value: "بريدة", label: "بريدة" },
    { value: "تبوك", label: "تبوك" },
  ];

  const weekDays = [
    "الجمعة",
    "الخميس",
    "الأربعاء",
    "الثلاثاء",
    "الإثنين",
    "الأحد",
    "السبت",
  ];

  // Helper function to safely get value or return "-"
  const getValueOrDash = (value: any): string => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    return String(value);
  };

  // Fetch drivers assigned to this car
  useEffect(() => {
    const loadCarDrivers = async () => {
      console.log("=== LOADING CAR DRIVERS (CORRECT APPROACH) ===");
      console.log("Car Data:", carData);
      console.log(
        "Car Data Keys:",
        carData ? Object.keys(carData) : "No car data"
      );

      if (!carData) {
        console.log("No car data available");
        setDrivers([]);
        return;
      }

      // Check for different possible driver ID field names
      const rawDriverIds =
        carData.driverIds || carData.drivers || carData.driverList || [];
      console.log("Raw Driver IDs found:", rawDriverIds);
      console.log("Driver IDs type:", typeof rawDriverIds);
      console.log(
        "Driver IDs length:",
        Array.isArray(rawDriverIds) ? rawDriverIds.length : "Not an array"
      );

      // Filter out null, undefined, and invalid IDs
      const driverIds = Array.isArray(rawDriverIds)
        ? rawDriverIds.filter(
            (id) => id && typeof id === "string" && id.trim() !== ""
          )
        : [];

      console.log("Valid Driver IDs after filtering:", driverIds);

      if (!driverIds || driverIds.length === 0) {
        console.log("No valid drivers assigned to this car");
        setDrivers([]);
        return;
      }

      try {
        setIsLoading(true);
        console.log(
          "=== FETCHING DRIVERS FROM COMPANIES-DRIVERS COLLECTION ==="
        );
        console.log("Car ID:", carData.id);
        console.log("Driver IDs to fetch:", driverIds);

        const fetchedDrivers = await fetchDriversByIds(driverIds);
        console.log("Raw fetched drivers:", fetchedDrivers);

        // Convert Firestore driver data to table format
        const convertedDrivers: Driver[] = fetchedDrivers.map((driver: any) => {
          console.log("Converting driver:", driver);
          return {
            id: driver.id,
            driverCode: getValueOrDash(driver.id),
            driverName: getValueOrDash(driver.name || driver.driverName),
            phoneNumber: getValueOrDash(driver.phone || driver.email),
            address: getValueOrDash(
              driver.city?.name?.ar || driver.location || driver.address
            ),
            financialValue: getValueOrDash(
              driver.balance || driver.financialValue
            ),
            limit: getValueOrDash(driver.plan?.dailyTrans || driver.limit),
            accountStatus: driver.isActive ? "active" : "inactive",
          };
        });

        console.log("Converted car drivers:", convertedDrivers);
        setDrivers(convertedDrivers);
      } catch (error) {
        console.error("Error fetching car drivers:", error);
        setDrivers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCarDrivers();
  }, [carData]);

  const handleContextMenu = (e: React.MouseEvent, driverId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(driverId);
  };

  const handleCloseContextMenu = () => {
    setShowContextMenu(null);
  };

  const handleDriverInfo = (driverId: string) => {
    console.log("Driver info clicked for:", driverId);
    navigate(`/driver/${driverId}`);
    handleCloseContextMenu();
  };

  const handleRemoveDriver = (driverId: string) => {
    console.log("Remove driver clicked for:", driverId);
    // TODO: Implement remove driver from car functionality
    handleCloseContextMenu();
  };

  // Load available drivers for selection
  const loadAvailableDrivers = async () => {
    try {
      console.log("=== LOADING AVAILABLE DRIVERS ===");
      console.log("Loading available drivers...");
      const allDrivers = await fetchCompaniesDrivers();
      console.log("All company drivers fetched:", allDrivers);
      console.log("Number of drivers fetched:", allDrivers.length);

      // Filter out drivers already assigned to this car
      const rawCurrentDriverIds =
        carData.driverIds || carData.drivers || carData.driverList || [];
      console.log("Raw current driver IDs for this car:", rawCurrentDriverIds);

      // Filter out null, undefined, and invalid IDs
      const currentDriverIds = Array.isArray(rawCurrentDriverIds)
        ? rawCurrentDriverIds.filter(
            (id) => id && typeof id === "string" && id.trim() !== ""
          )
        : [];

      console.log(
        "Valid current driver IDs after filtering:",
        currentDriverIds
      );

      const unassignedDrivers = allDrivers.filter(
        (driver: any) => !currentDriverIds.includes(driver.id)
      );

      console.log("Available unassigned drivers:", unassignedDrivers);
      console.log("Number of unassigned drivers:", unassignedDrivers.length);
      setAvailableDrivers(unassignedDrivers);
    } catch (error) {
      console.error("Error loading available drivers:", error);
      addToast({
        title: "خطأ",
        message: "فشل في تحميل قائمة السائقين",
        type: "error",
      });
    }
  };

  const handleOpenAddDriverModal = () => {
    setShowAddDriverModal(true);
    setModalMode("select");
    loadAvailableDrivers();
  };

  const handleCloseAddDriverModal = () => {
    setShowAddDriverModal(false);
    setSearchQuery("");
    setModalMode("select");
    setNewDriverForm({
      driverName: "",
      email: "",
      phone: "",
      address: "",
      city: carData?.city?.name?.ar || "الرياض",
      driverAmount: "",
      driverImage: null,
      driverLicense: null,
    });
  };

  const handleSwitchToCreateMode = () => {
    setModalMode("create");
  };

  const handleSwitchToSelectMode = () => {
    setModalMode("select");
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleFileUpload = (field: "driverImage" | "driverLicense") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      field === "driverLicense" ? "image/*,application/pdf" : "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setNewDriverForm((prev) => ({ ...prev, [field]: file }));
      }
    };
    input.click();
  };

  const handleCreateNewDriver = async () => {
    try {
      setIsAddingDriver(true);
      console.log("Creating new driver with car data...");

      const driverData = {
        phone: newDriverForm.phone,
        email: newDriverForm.email,
        driverName: newDriverForm.driverName,
        driverImage: newDriverForm.driverImage || undefined,
        address: newDriverForm.address,
        city: newDriverForm.city,
        selectedDays: selectedDays,
        vehicleStatus: carData.vehicleStatus || "عادية",
        driverAmount: newDriverForm.driverAmount,
        driverLicense: newDriverForm.driverLicense || undefined,
        plateLetters:
          carData.plateNumber?.ar?.split(" ").slice(1).join(" ") || "",
        plateNumber: carData.plateNumber?.ar?.split(" ")[0] || "",
        vehicleCategory: carData.plan?.carSize || carData.size || "صغيرة",
      };

      const result = await addCompanyDriver(driverData);

      console.log("New driver created:", result.id);

      // Now link the new driver to the car
      await addDriverToCar(result.id, carData.id, carData);

      addToast({
        title: "تم إضافة السائق بنجاح",
        message: "تم إنشاء السائق وربطه بالسيارة بنجاح",
        type: "success",
      });

      // Reload drivers for this car
      const rawCurrentDriverIds =
        carData.driverIds || carData.drivers || carData.driverList || [];
      const currentDriverIds = Array.isArray(rawCurrentDriverIds)
        ? rawCurrentDriverIds.filter(
            (id) => id && typeof id === "string" && id.trim() !== ""
          )
        : [];
      const updatedDriverIds = [...currentDriverIds, result.id];
      console.log(
        "Updated driver IDs after creating new driver:",
        updatedDriverIds
      );

      const fetchedDrivers = await fetchDriversByIds(updatedDriverIds);
      console.log("Fetched drivers after creating new driver:", fetchedDrivers);

      const convertedDrivers: Driver[] = fetchedDrivers.map((driver: any) => ({
        id: driver.id,
        driverCode: getValueOrDash(driver.id),
        driverName: getValueOrDash(driver.name || driver.driverName),
        phoneNumber: getValueOrDash(driver.phone || driver.email),
        address: getValueOrDash(
          driver.city?.name?.ar || driver.location || driver.address
        ),
        financialValue: getValueOrDash(driver.balance || driver.financialValue),
        limit: getValueOrDash(driver.plan?.dailyTrans || driver.limit),
        accountStatus: driver.isActive ? "active" : "inactive",
      }));

      console.log(
        "Converted drivers after creating new driver:",
        convertedDrivers
      );
      setDrivers(convertedDrivers);

      handleCloseAddDriverModal();
    } catch (error: any) {
      console.error("Error creating new driver:", error);
      addToast({
        title: "خطأ في إضافة السائق",
        message: error.message || "حدث خطأ أثناء إنشاء السائق",
        type: "error",
      });
    } finally {
      setIsAddingDriver(false);
    }
  };

  const handleAddDriverToCar = async (driverId: string) => {
    try {
      setIsAddingDriver(true);
      console.log("=== ADDING DRIVER TO CAR ===");
      console.log("Driver ID:", driverId);
      console.log("Car ID:", carData.id);
      console.log("Car Data:", carData);

      await addDriverToCar(driverId, carData.id, carData);

      addToast({
        title: "تم إضافة السائق بنجاح",
        message: "تم ربط السائق بالسيارة بنجاح",
        type: "success",
      });

      // Reload drivers for this car
      const rawCurrentDriverIds =
        carData.driverIds || carData.drivers || carData.driverList || [];
      const currentDriverIds = Array.isArray(rawCurrentDriverIds)
        ? rawCurrentDriverIds.filter(
            (id) => id && typeof id === "string" && id.trim() !== ""
          )
        : [];
      const updatedDriverIds = [...currentDriverIds, driverId];
      console.log("Updated driver IDs:", updatedDriverIds);

      const fetchedDrivers = await fetchDriversByIds(updatedDriverIds);
      console.log("Fetched drivers after adding:", fetchedDrivers);

      const convertedDrivers: Driver[] = fetchedDrivers.map((driver: any) => ({
        id: driver.id,
        driverCode: getValueOrDash(driver.id),
        driverName: getValueOrDash(driver.name || driver.driverName),
        phoneNumber: getValueOrDash(driver.phone || driver.email),
        address: getValueOrDash(
          driver.city?.name?.ar || driver.location || driver.address
        ),
        financialValue: getValueOrDash(driver.balance || driver.financialValue),
        limit: getValueOrDash(driver.plan?.dailyTrans || driver.limit),
        accountStatus: driver.isActive ? "active" : "inactive",
      }));

      console.log("Converted drivers after adding:", convertedDrivers);
      setDrivers(convertedDrivers);

      handleCloseAddDriverModal();
    } catch (error: any) {
      console.error("Error adding driver to car:", error);
      addToast({
        title: "خطأ في إضافة السائق",
        message: error.message || "حدث خطأ أثناء إضافة السائق للسيارة",
        type: "error",
      });
    } finally {
      setIsAddingDriver(false);
    }
  };

  // Filter available drivers by search query
  const filteredAvailableDrivers = availableDrivers.filter((driver: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      driver.name?.toLowerCase().includes(query) ||
      driver.email?.toLowerCase().includes(query) ||
      driver.phone?.toLowerCase().includes(query) ||
      driver.id?.toLowerCase().includes(query)
    );
  });

  const columns: TableColumn<Driver>[] = [
    {
      key: "actions",
      label: "",
      width: "50px",
      render: (_, row) => (
        <button
          onClick={(e) => handleContextMenu(e, row.id)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
      ),
    },
    {
      key: "accountStatus",
      label: "حالة الحساب",
      width: "120px",
      render: (_, row) => (
        <div className="flex items-center justify-center">
          <span
            className={`text-sm font-medium ${
              row.accountStatus === "active"
                ? "text-green-700"
                : "text-gray-500"
            }`}
          >
            {row.accountStatus === "active" ? "مفعل" : "غير مفعل"}
          </span>
        </div>
      ),
    },
    {
      key: "financialValue",
      label: "القيمة المالية (ر.س) (المستخدمة / المحددة) يوميا",
      width: "250px",
      render: (_, row) => (
        <span className="text-gray-700">
          {row.financialValue} / {row.limit}
        </span>
      ),
    },
    {
      key: "address",
      label: "العنوان",
      width: "200px",
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: "phoneNumber",
      label: "رقم الهاتف",
      width: "150px",
      render: (value) => <span className="text-gray-700">{value}</span>,
    },
    {
      key: "driverName",
      label: "اسم السائق",
      width: "150px",
      render: (value) => <span className="text-gray-900">{value}</span>,
    },
    {
      key: "driverCode",
      label: "كود السائق",
      width: "120px",
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <button
          onClick={handleOpenAddDriverModal}
          className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
        >
          <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
            <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
              <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                إضافة سائق للسيارة
              </span>
            </div>
            <CirclePlus className="w-4 h-4 text-gray-500" />
          </div>
        </button>
        <div className="flex w-[134px] items-center justify-end gap-1.5 relative">
          <h2 className="relative w-[117px] h-5 mt-[-1.00px] ml-[-7.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]">
            سائقي السيارة ({drivers.length})
          </h2>
          <User className="w-5 h-5 text-gray-500" />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center w-full py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">جاري تحميل السائقين...</p>
          </div>
        </div>
      )}

      {/* No Drivers Message */}
      {!isLoading && drivers.length === 0 && (
        <div className="w-full p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-600 text-center [direction:rtl]">
            لا يوجد سائقين مسجلين لهذه السيارة
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && drivers.length > 0 && (
        <div className="w-full overflow-hidden rounded-lg border border-gray-200">
          <Table
            columns={columns}
            data={drivers}
            className="w-full"
            headerClassName="bg-gray-50 text-gray-700 font-medium"
            rowClassName="hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
            cellClassName="py-4"
          />
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={handleCloseContextMenu}
          />
          <div
            className="fixed z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[155px]"
            style={{
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
            }}
          >
            <button
              onClick={() => handleDriverInfo(showContextMenu || "")}
              className="flex items-center justify-between w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>معلومات السائق</span>
              <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center">
                <Info className="w-3 h-3 text-blue-500" />
              </div>
            </button>
            <button
              onClick={() => handleRemoveDriver(showContextMenu || "")}
              className="flex items-center justify-between w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>إزالة السائق</span>
              <div className="w-6 h-6 rounded-full border-2 border-red-500 flex items-center justify-center">
                <X className="w-3 h-3 text-red-500" />
              </div>
            </button>
          </div>
        </>
      )}

      {/* Add Driver Modal */}
      {showAddDriverModal &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40 bg-black bg-opacity-50"
              onClick={handleCloseAddDriverModal}
            />
            <div className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] shadow-xl w-[90%] max-w-4xl max-h-[90vh] overflow-hidden border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-[var(--corner-radius-large)] border-b-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
                <button
                  onClick={handleCloseAddDriverModal}
                  className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)] hover:opacity-80 transition-opacity"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
                <h2 className="font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] font-subtitle-subtitle-2 [font-style:var(--subtitle-subtitle-2-font-style)]">
                  {modalMode === "select"
                    ? "اختر سائق لإضافته للسيارة"
                    : "إضافة سائق جديد"}
                </h2>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex gap-[var(--corner-radius-medium)] p-[var(--corner-radius-medium)] border-b-[0.3px] border-solid border-color-mode-text-icons-t-placeholder justify-end">
                <button
                  onClick={handleSwitchToSelectMode}
                  className={`inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 rounded-[var(--corner-radius-small)] border-[0.5px] border-solid transition-colors ${
                    modalMode === "select"
                      ? "bg-color-mode-surface-primary-blue border-color-mode-text-icons-t-blue"
                      : "bg-color-mode-surface-bg-icon-gray border-color-mode-text-icons-t-placeholder hover:bg-gray-200"
                  }`}
                >
                  <span
                    className={`font-[number:var(--body-body-2-font-weight)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)] ${
                      modalMode === "select"
                        ? "text-color-mode-text-icons-t-btn-negative"
                        : "text-color-mode-text-icons-t-sec"
                    }`}
                  >
                    اختيار سائق موجود
                  </span>
                </button>
                <button
                  onClick={handleSwitchToCreateMode}
                  className={`inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 rounded-[var(--corner-radius-small)] border-[0.5px] border-solid transition-colors ${
                    modalMode === "create"
                      ? "bg-color-mode-surface-primary-blue border-color-mode-text-icons-t-blue"
                      : "bg-color-mode-surface-bg-icon-gray border-color-mode-text-icons-t-placeholder hover:bg-gray-200"
                  }`}
                >
                  <span
                    className={`font-[number:var(--body-body-2-font-weight)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)] ${
                      modalMode === "create"
                        ? "text-color-mode-text-icons-t-btn-negative"
                        : "text-color-mode-text-icons-t-sec"
                    }`}
                  >
                    إضافة سائق جديد
                  </span>
                </button>
              </div>

              {/* Create New Driver Mode */}
              {modalMode === "create" && (
                <div className="p-[var(--corner-radius-large)] overflow-y-auto max-h-[calc(90vh-200px)]">
                  {/* Car Info Display */}
                  <div className="mb-[var(--corner-radius-extra-large)] p-[var(--corner-radius-medium)] bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-medium)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder">
                    <h3 className="font-[number:var(--subtitle-subtitle-3-font-weight)] text-color-mode-text-icons-t-blue text-[length:var(--subtitle-subtitle-3-font-size)] mb-[var(--corner-radius-medium)] [direction:rtl]">
                      معلومات السيارة المحددة:
                    </h3>
                    <div className="grid grid-cols-3 gap-[var(--corner-radius-medium)] text-[length:var(--body-body-2-font-size)] [direction:rtl]">
                      <div>
                        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec">
                          اسم السيارة:{" "}
                        </span>
                        <span className="text-color-mode-text-icons-t-primary-gray">
                          {carData.name || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec">
                          رقم اللوحة:{" "}
                        </span>
                        <span className="text-color-mode-text-icons-t-primary-gray">
                          {carData.plateNumber?.ar || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec">
                          نوع الوقود:{" "}
                        </span>
                        <span className="text-color-mode-text-icons-t-primary-gray">
                          {carData.fuelType === "fuel91"
                            ? "بنزين 91"
                            : carData.fuelType === "fuel95"
                            ? "بنزين 95"
                            : "ديزل"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* New Driver Form */}
                  <div className="flex flex-col gap-5">
                    {/* Row 1: Name, Email, Phone */}
                    <div className="flex items-start gap-5">
                      <div className="flex-1">
                        <Input
                          label="رقم الهاتف"
                          type="tel"
                          value={newDriverForm.phone}
                          onChange={(value) =>
                            setNewDriverForm((prev) => ({
                              ...prev,
                              phone: value,
                            }))
                          }
                          placeholder="رقم الهاتف هنا"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          label="البريد الالكتروني"
                          type="email"
                          value={newDriverForm.email}
                          onChange={(value) =>
                            setNewDriverForm((prev) => ({
                              ...prev,
                              email: value,
                            }))
                          }
                          placeholder="البريد الإلكتروني"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          label="اسم السائق"
                          type="text"
                          value={newDriverForm.driverName}
                          onChange={(value) =>
                            setNewDriverForm((prev) => ({
                              ...prev,
                              driverName: value,
                            }))
                          }
                          placeholder="اسم السائق هنا"
                        />
                      </div>
                    </div>

                    {/* Row 2: Image, Address, City */}
                    <div className="flex items-end gap-[var(--corner-radius-extra-small)]">
                      <div className="flex items-end gap-[var(--corner-radius-extra-small)] flex-1">
                        <div className="relative w-[43px] h-[42px]">
                          <div className="absolute top-1 left-[5px] w-[38px] h-[38px] rounded-[var(--corner-radius-small)] bg-gray-100 flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-500" />
                          </div>
                          <div className="absolute top-0 left-0 w-3 h-3">
                            <div className="absolute -top-px -left-px w-3.5 h-3.5 bg-white rounded-[7px] border border-solid border-gray-200" />
                            <Upload className="absolute top-0.5 left-0.5 w-2 h-2 text-gray-400" />
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] flex-1">
                          <label className="relative self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                            صورة السائق
                          </label>
                          <button
                            type="button"
                            onClick={() => handleFileUpload("driverImage")}
                            className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder bg-transparent cursor-pointer hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                          >
                            <Upload className="w-4 h-4 text-gray-500" />
                            <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                              <div className="w-fit font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] tracking-[var(--body-body-2-letter-spacing)] whitespace-nowrap relative mt-[-1.00px] font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [font-style:var(--body-body-2-font-style)]">
                                {newDriverForm.driverImage?.name ||
                                  "ارفع صورة السائق هنا"}
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                      <div className="flex-1">
                        <Input
                          label="العنوان"
                          type="text"
                          value={newDriverForm.address}
                          onChange={(value) =>
                            setNewDriverForm((prev) => ({
                              ...prev,
                              address: value,
                            }))
                          }
                          placeholder="العنوان بالتفصيل هنا"
                        />
                      </div>
                      <div className="flex-1">
                        <Select
                          label="المدينة"
                          value={newDriverForm.city}
                          onChange={(value) =>
                            setNewDriverForm((prev) => ({
                              ...prev,
                              city: value,
                            }))
                          }
                          options={cityOptions}
                        />
                      </div>
                    </div>

                    {/* Days Selection */}
                    <div className="flex flex-col items-end gap-[var(--corner-radius-small)]">
                      <p className="relative self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                        أيام الأجازات "الغير مسموح بشحن الوقود"
                      </p>
                      <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                        {weekDays.map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleDayToggle(day)}
                            className={`flex items-center justify-center gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-large)] relative flex-1 self-stretch grow rounded-[var(--corner-radius-small)] border-[0.5px] border-solid transition-colors ${
                              selectedDays.includes(day)
                                ? "border-[0.7px] border-color-mode-text-icons-t-blue"
                                : "border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec cursor-pointer"
                            }`}
                          >
                            <span
                              className={`relative w-fit text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] ${
                                selectedDays.includes(day)
                                  ? "font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-blue [font-style:var(--body-body-2-font-style)]"
                                  : "font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec [font-style:var(--body-body-2-font-style)]"
                              }`}
                            >
                              {day}
                            </span>
                            {selectedDays.includes(day) && (
                              <img
                                className="absolute top-0 left-0 w-3.5 h-3.5"
                                alt="Selected"
                                src="/img/rectangle-22DI.svg"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Row 3: Driver Amount and License */}
                    <div className="flex items-start gap-5">
                      <div className="flex-1">
                        <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)]">
                          <div className="flex items-center justify-between w-full">
                            <span className="text-color-mode-text-icons-t-blue text-[length:var(--body-body-2-font-size)] font-[number:var(--body-body-2-font-weight)]">
                              غير محددة
                            </span>
                            <label className="self-stretch font-normal text-[var(--form-active-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                              <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                                القيمة المالية المحددة للسائق (ر.س)
                              </span>
                            </label>
                          </div>
                          <div className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus-within:border-color-mode-text-icons-t-blue">
                            <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                              <input
                                type="number"
                                value={newDriverForm.driverAmount}
                                onChange={(e) =>
                                  setNewDriverForm((prev) => ({
                                    ...prev,
                                    driverAmount: e.target.value,
                                  }))
                                }
                                className="relative w-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-right"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)]">
                          <label className="self-stretch font-normal text-[var(--form-active-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                            <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                              صورة ترخيص السائق "اختياري"
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleFileUpload("driverLicense")}
                            className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder bg-transparent cursor-pointer hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                          >
                            <FileText className="w-4 h-4 text-gray-500" />
                            <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                              <p className="w-fit font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-placeholder text-left tracking-[var(--body-body-2-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [font-style:var(--body-body-2-font-style)]">
                                {newDriverForm.driverLicense?.name ||
                                  "ارفع صورة ترخيص السائق هنا"}
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="inline-flex items-start gap-5">
                      <button
                        type="button"
                        onClick={handleCreateNewDriver}
                        disabled={isAddingDriver}
                        className={`inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] transition-opacity ${
                          isAddingDriver
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-color-mode-surface-primary-blue hover:opacity-90"
                        }`}
                      >
                        <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                          {isAddingDriver && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          )}
                          <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-color-mode-text-icons-t-btn-negative text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
                            {isAddingDriver
                              ? "جاري الإضافة..."
                              : "إضافة السائق"}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Select Existing Driver Mode */}
              {modalMode === "select" && (
                <>
                  {/* Search Bar */}
                  <div className="p-[var(--corner-radius-large)] border-b-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث بالاسم، البريد الإلكتروني، أو رقم الهاتف"
                        className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-10 pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder bg-transparent hover:border-color-mode-text-icons-t-sec focus:border-color-mode-text-icons-t-blue outline-none text-right font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] text-[length:var(--body-body-2-font-size)] [direction:rtl] placeholder-[var(--form-active-placeholder-color)]"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                  </div>

                  {/* Drivers List */}
                  <div className="p-[var(--corner-radius-large)] overflow-y-auto max-h-96">
                    {filteredAvailableDrivers.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-color-mode-text-icons-t-sec font-body-body-2 text-[length:var(--body-body-2-font-size)] [direction:rtl]">
                          {searchQuery
                            ? "لا توجد نتائج للبحث"
                            : "لا يوجد سائقين متاحين"}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-[var(--corner-radius-medium)]">
                        {filteredAvailableDrivers.map((driver: any) => (
                          <div
                            key={driver.id}
                            className="flex items-center justify-between p-[var(--corner-radius-medium)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-medium)] hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                          >
                            <button
                              onClick={() => handleAddDriverToCar(driver.id)}
                              disabled={isAddingDriver}
                              className={`inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 rounded-[var(--corner-radius-small)] transition-opacity ${
                                isAddingDriver
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-color-mode-surface-primary-blue hover:opacity-90"
                              }`}
                            >
                              <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-btn-negative text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                                {isAddingDriver ? "جاري الإضافة..." : "إضافة"}
                              </span>
                            </button>
                            <div className="flex-1 text-right [direction:rtl] mr-[var(--corner-radius-medium)]">
                              <p className="font-[number:var(--subtitle-subtitle-3-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--subtitle-subtitle-3-font-size)]">
                                {driver.name || "-"}
                              </p>
                              <p className="font-body-body-2 text-[length:var(--body-body-2-font-size)] text-color-mode-text-icons-t-sec">
                                {driver.email || driver.phone || "-"}
                              </p>
                              <p className="font-body-body-2 text-[length:var(--body-body-2-font-size)] text-color-mode-text-icons-t-placeholder">
                                {driver.city?.name?.ar ||
                                  driver.location ||
                                  "-"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
