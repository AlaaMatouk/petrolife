import { DataTableSection } from "../../../sections/DataTableSection/DataTableSection";
import { UserRound } from "lucide-react";
import {
  fetchDrivers,
  addRefidToExistingPetrolifeDrivers,
  updatePetrolifeDriverIsActive,
  fetchPetrolifeDriverById,
  deletePetrolifeDriver,
} from "../../../../services/firestore";
import { useState } from "react";
import { useToast } from "../../../../context/ToastContext";
import { ConfirmDialog } from "../../../shared/ConfirmDialog/ConfirmDialog";

interface PetrolifeDriverRow {
  id: string;
  driverCode: string;
  driverName: string;
  phone: string;
  email: string;
  city: string;
  carNumber: string;
  accountStatus: { active: boolean; text: string };
}

const columns = [
  { key: "actions", label: "الإجراءات", width: "w-16", priority: "high" },
  {
    key: "accountStatus",
    label: "حالة الحساب",
    width: "min-w-[120px]",
    priority: "high",
  },
  { key: "carNumber", label: "رقم السيارة", priority: "medium" },
  { key: "city", label: "المدينة", priority: "medium" },
  { key: "email", label: "البريد الإلكتروني", priority: "low" },
  { key: "phone", label: "رقم الهاتف", priority: "medium" },
  { key: "driverName", label: "اسم السائق", priority: "high" },
  { key: "driverCode", label: "كود السائق", priority: "high" },
];

const mapDriverToRow = (driver: any): PetrolifeDriverRow => {
  // Use refid as primary source for driverCode, with fallbacks
  const driverCodeValue =
    driver?.refid ?? driver?.id ?? driver?.uId ?? (driver?.docId ? String(driver.docId) : "-");

  const fallbackId =
    driver?.docId ??
    driver?.id ??
    driver?.uId ??
    `driver-${Math.random().toString(36).slice(2, 11)}`;

  const cityValue =
    driver?.city && typeof driver.city === "object"
      ? driver.city?.name?.ar || driver.city?.name?.en
      : undefined;

  const carNumberValue =
    driver?.car?.plateNumber?.en ||
    driver?.car?.plateNumber?.ar ||
    driver?.car?.plateNumber ||
    "-";

  return {
    id: String(fallbackId),
    driverCode: driverCodeValue ? String(driverCodeValue) : "-",
    driverName: driver?.name ? String(driver.name) : "-",
    phone: driver?.phoneNumber ? String(driver.phoneNumber) : "-",
    email: driver?.email ? String(driver.email) : "-",
    city: cityValue ? String(cityValue) : "غير محدد",
    carNumber: carNumberValue ? String(carNumberValue) : "-",
    accountStatus: {
      active: driver?.isActive === true,
      text: driver?.isActive === true ? "مفعل" : "معطل",
    },
  };
};

const fetchData = async (): Promise<PetrolifeDriverRow[]> => {
  try {
    const drivers = await fetchDrivers();
    return drivers.map(mapDriverToRow);
  } catch (error) {
    console.error("Error fetching Petrolife drivers:", error);
    return [];
  }
};

const PetrolifeDrivers = () => {
  const { addToast } = useToast();
  const [driversData, setDriversData] = useState<PetrolifeDriverRow[]>([]);
  const [rawDriversData, setRawDriversData] = useState<any[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    driverId: string | null;
    driverName: string;
  }>({
    isOpen: false,
    driverId: null,
    driverName: "",
  });

  // Fetch drivers with state update
  const fetchDataWithState = async (): Promise<PetrolifeDriverRow[]> => {
    const rawDrivers = await fetchDrivers();
    setRawDriversData(rawDrivers || []);
    const data = rawDrivers.map(mapDriverToRow);
    setDriversData(data);
    return data;
  };

  const handleAddRefidToExisting = async () => {
    setIsMigrating(true);
    try {
      const updatedCount = await addRefidToExistingPetrolifeDrivers();
      addToast({
        type: "success",
        message: `تم إضافة كود السائق لـ ${updatedCount} سائق بنجاح`,
        duration: 5000,
      });
      // Reload drivers data
      const rawDrivers = await fetchDrivers();
      setRawDriversData(rawDrivers || []);
      const updatedData = rawDrivers.map(mapDriverToRow);
      setDriversData(updatedData);
    } catch (error: any) {
      console.error("Error migrating drivers:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في إضافة كود السائق للسائقين الموجودين",
        duration: 5000,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (id: string | number) => {
    try {
      const driverId = String(id);
      
      // Fetch current driver data from Firestore to get the current isActive status
      const currentDriverData = await fetchPetrolifeDriverById(driverId);
      
      // Get current isActive status
      // Handle null, undefined, or missing values - treat as false/inactive
      let currentIsActive: boolean;
      if (currentDriverData.isActive === null || currentDriverData.isActive === undefined) {
        // If isActive is null/undefined, treat as inactive
        currentIsActive = false;
      } else {
        currentIsActive = currentDriverData.isActive === true;
      }
      
      const newIsActive = !currentIsActive;
      await updatePetrolifeDriverIsActive(driverId, newIsActive);
      addToast({
        type: "success",
        message: newIsActive
          ? "تم تفعيل حساب السائق بنجاح"
          : "تم تعطيل حساب السائق بنجاح",
        duration: 3000,
      });
      
      // Reload drivers data
      const rawDrivers = await fetchDrivers();
      setRawDriversData(rawDrivers || []);
      const updatedData = rawDrivers.map(mapDriverToRow);
      setDriversData(updatedData);
    } catch (error) {
      console.error("Error toggling driver status:", error);
      addToast({
        type: "error",
        message: "فشل في تحديث حالة الحساب",
        duration: 3000,
      });
    }
  };

  // Handle delete
  const handleDelete = (id: string | number) => {
    const driverId = String(id);
    
    // Find driver name for confirmation message
    const driver = driversData.find((d) => d.id === driverId);
    const driverName = driver?.driverName || "السائق";
    
    // Open confirmation dialog
    setDeleteConfirm({
      isOpen: true,
      driverId,
      driverName,
    });
  };

  // Confirm and delete driver
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.driverId) return;

    try {
      setDeletingId(deleteConfirm.driverId);
      
      // Delete from Firestore
      await deletePetrolifeDriver(deleteConfirm.driverId);
      
      // Show success message
      addToast({
        type: "success",
        message: `تم حذف ${deleteConfirm.driverName} بنجاح`,
        duration: 3000,
      });
      
      // Refresh the drivers list
      const rawDrivers = await fetchDrivers();
      setRawDriversData(rawDrivers || []);
      const updatedData = rawDrivers.map(mapDriverToRow);
      setDriversData(updatedData);
      
      // Close confirmation popup
      setDeleteConfirm({
        isOpen: false,
        driverId: null,
        driverName: "",
      });
    } catch (error: any) {
      console.error("Error deleting driver:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في حذف السائق",
        duration: 3000,
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Cancel delete
  const handleDeleteCancel = () => {
    setDeleteConfirm({
      isOpen: false,
      driverId: null,
      driverName: "",
    });
  };

  return (
    <div className="flex flex-col items-start gap-5 relative w-full">
      {/* Migration Button */}
      {rawDriversData.length > 0 &&
        rawDriversData.some((driver) => !driver.refid) && (
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
                          {isMigrating
                            ? "جاري إضافة كود السائق..."
                            : "إضافة كود السائق للسائقين الموجودين"}
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
      <DataTableSection
        title="سائقي بترولايف"
        entityName="سائق"
        entityNamePlural="سائقين"
        icon={UserRound}
        columns={columns}
        fetchData={fetchDataWithState}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
        addNewRoute="/petrolife-drivers/add"
        viewDetailsRoute={(id) => `/petrolife-drivers/${id}`}
        itemsPerPage={10}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف ${deleteConfirm.driverName}؟\n\nهذه العملية لا يمكن التراجع عنها.`}
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

export default PetrolifeDrivers;
