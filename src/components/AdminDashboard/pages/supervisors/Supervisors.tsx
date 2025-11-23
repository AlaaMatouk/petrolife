import { DataTableSection } from "../../../sections/DataTableSection";
import { Users, CirclePlus, Upload, Download, FileSpreadsheet } from "lucide-react";
import {
  fetchSupervisorsFromUsers,
  updateSupervisorIsActive,
  fetchSupervisorById,
  deleteSupervisor,
  addRefidToExistingSupervisors,
} from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { ConfirmDialog } from "../../../shared/ConfirmDialog/ConfirmDialog";

// Define the Supervisor data type
export interface Supervisor {
  id: string;
  supervisorName: string;
  supervisorCode: string;
  email: string;
  phone: string;
  city: string;
  accountStatus: {
    active: boolean;
    text: string;
  };
}

// Sample columns configuration - you can modify this based on your needs
// Note: Columns are defined in reverse order because the Table component reverses them for RTL
const supervisorColumns = [
  {
    key: "actions",
    priority: "high" as const,
  },
  {
    key: "accountStatus",
    label: "حالة الحساب",
    priority: "high" as const,
  },
  {
    key: "city",
    label: "المدينة",
    priority: "high" as const,
  },
  {
    key: "email",
    label: "البريد الإلكتروني",
    priority: "medium" as const,
  },
  {
    key: "phone",
    label: "رقم الهاتف",
    priority: "medium" as const,
  },
  {
    key: "supervisorName",
    label: "اسم المشرف",
    priority: "high" as const,
  },
  {
    key: "supervisorCode",
    label: "كود المشرف",
    priority: "high" as const,
  },
];

// Mock data - exported for use in other components
export const mockSupervisorsData: Supervisor[] = [
  {
    id: 1,
    accountStatus: { active: true, text: "مفعل" },
    city: "جدة",
    email: "fatima.ali@petrolife.com",
    phone: "0507654321",
    supervisorName: "فاطمة علي",
    supervisorCode: "SUP001",
  },
  {
    id: 2,
    accountStatus: { active: true, text: "مفعل" },
    city: "الرياض",
    email: "mohammed.ahmed@petrolife.com",
    phone: "0501234567",
    supervisorName: "محمد أحمد",
    supervisorCode: "SUP002",
  },
  {
    id: 3,
    accountStatus: { active: false, text: "معطل" },
    city: "الدمام",
    email: "sara.hassan@petrolife.com",
    phone: "0503456789",
    supervisorName: "سارة حسن",
    supervisorCode: "SUP003",
  },
  {
    id: 4,
    accountStatus: { active: true, text: "مفعل" },
    city: "مكة المكرمة",
    email: "khalid.omar@petrolife.com",
    phone: "0509876543",
    supervisorName: "خالد عمر",
    supervisorCode: "SUP004",
  },
  {
    id: 5,
    accountStatus: { active: true, text: "مفعل" },
    city: "المدينة المنورة",
    email: "noura.salem@petrolife.com",
    phone: "0556789012",
    supervisorName: "نورة سالم",
    supervisorCode: "SUP005",
  },
  {
    id: 6,
    accountStatus: { active: true, text: "مفعل" },
    city: "الطائف",
    email: "abdullah.fahad@petrolife.com",
    phone: "0558901234",
    supervisorName: "عبدالله فهد",
    supervisorCode: "SUP006",
  },
  {
    id: 7,
    accountStatus: { active: false, text: "معطل" },
    city: "الخبر",
    email: "maha.nasser@petrolife.com",
    phone: "0502345678",
    supervisorName: "مها ناصر",
    supervisorCode: "SUP007",
  },
  {
    id: 8,
    accountStatus: { active: true, text: "مفعل" },
    city: "أبها",
    email: "yousef.zaid@petrolife.com",
    phone: "0554567890",
    supervisorName: "يوسف زيد",
    supervisorCode: "SUP008",
  },
  {
    id: 9,
    accountStatus: { active: true, text: "مفعل" },
    city: "تبوك",
    email: "layla.khalid@petrolife.com",
    phone: "0506789012",
    supervisorName: "ليلى خالد",
    supervisorCode: "SUP009",
  },
  {
    id: 10,
    accountStatus: { active: true, text: "مفعل" },
    city: "بريدة",
    email: "ibrahim.saeed@petrolife.com",
    phone: "0557890123",
    supervisorName: "إبراهيم سعيد",
    supervisorCode: "SUP010",
  },
  {
    id: 11,
    accountStatus: { active: false, text: "معطل" },
    city: "حائل",
    email: "amal.abdullah@petrolife.com",
    phone: "0508901234",
    supervisorName: "أمل عبدالله",
    supervisorCode: "SUP011",
  },
];

// Fetch real supervisors data from Firestore
const fetchSupervisors = async (): Promise<Supervisor[]> => {
  return await fetchSupervisorsFromUsers();
};

export const Supervisors = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [supervisorsData, setSupervisorsData] = useState<Supervisor[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    supervisorId: string | null;
    supervisorName: string;
  }>({
    isOpen: false,
    supervisorId: null,
    supervisorName: "",
  });
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Handle status toggle
  const handleToggleStatus = async (id: string | number) => {
    try {
      const supervisorId = String(id);
      
      // Fetch current supervisor data from Firestore to get the current isActive status
      const currentSupervisorData = await fetchSupervisorById(supervisorId);
      
      // Get current isActive status (default to true if not set)
      const currentIsActive = currentSupervisorData.isActive ?? 
                               currentSupervisorData.accountStatus?.active ?? 
                               true;
      
      // Calculate the new isActive value (opposite of current)
      // When toggle is turned OFF, set isActive to false
      // When toggle is turned ON, set isActive to true
      const newIsActive = !currentIsActive;

      // Update in Firestore
      await updateSupervisorIsActive(supervisorId, newIsActive);

      // Show success message
      addToast({
        type: "success",
        message: newIsActive
          ? "تم تفعيل حساب المشرف بنجاح"
          : "تم تعطيل حساب المشرف بنجاح",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error toggling supervisor status:", error);
      addToast({
        type: "error",
        message: "فشل في تحديث حالة الحساب",
        duration: 3000,
      });
    }
  };

  // Handle delete supervisor - open confirmation popup
  const handleDelete = (id: string | number) => {
    const supervisorId = String(id);
    
    // Find supervisor name for confirmation message
    const supervisor = supervisorsData.find((s) => s.id === supervisorId);
    const supervisorName = supervisor?.supervisorName || "المشرف";
    
    // Open confirmation dialog
    setDeleteConfirm({
      isOpen: true,
      supervisorId,
      supervisorName,
    });
  };

  // Confirm and delete supervisor
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.supervisorId) return;

    try {
      setDeletingId(deleteConfirm.supervisorId);
      
      // Delete from Firestore
      await deleteSupervisor(deleteConfirm.supervisorId);
      
      // Show success message
      addToast({
        type: "success",
        message: `تم حذف ${deleteConfirm.supervisorName} بنجاح`,
        duration: 3000,
      });
      
      // Close confirmation popup first
      setDeleteConfirm({
        isOpen: false,
        supervisorId: null,
        supervisorName: "",
      });
      
      // Trigger table refresh by incrementing refreshTrigger
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error("Error deleting supervisor:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في حذف المشرف",
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
      supervisorId: null,
      supervisorName: "",
    });
  };

  // Handle migration: Add refid to existing supervisors
  const handleAddRefidToExisting = async () => {
    setIsMigrating(true);
    try {
      const updatedCount = await addRefidToExistingSupervisors();
      addToast({
        type: "success",
        message: `تم إضافة كود المشرف لـ ${updatedCount} مشرف بنجاح`,
        duration: 5000,
      });
      // Refresh the supervisors list
      const updatedData = await fetchSupervisors();
      setSupervisorsData(updatedData);
    } catch (error: any) {
      console.error("Error migrating supervisors:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في إضافة كود المشرف للمشرفين الموجودين",
        duration: 5000,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Handle add menu toggle
  const handleAddMenuToggle = () => {
    if (addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
    setIsAddMenuOpen(!isAddMenuOpen);
  };

  // Handle menu options
  const handleAddOneSupervisor = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("handleAddOneSupervisor called");
    // Close menu immediately
    setIsAddMenuOpen(false);
    // Navigate immediately
    console.log("About to navigate to /supervisors/add");
    navigate("/supervisors/add", { replace: false });
  };

  const handleUploadExcel = () => {
    setIsAddMenuOpen(false);
    // TODO: Implement Excel upload
    addToast({
      type: "info",
      message: "سيتم تنفيذ رفع ملف Excel قريباً",
      duration: 3000,
    });
  };

  const handleDownloadTemplate = () => {
    setIsAddMenuOpen(false);
    // TODO: Implement template download
    addToast({
      type: "info",
      message: "سيتم تنفيذ تنزيل النموذج قريباً",
      duration: 3000,
    });
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addButtonRef.current &&
        !addButtonRef.current.contains(event.target as Node)
      ) {
        setIsAddMenuOpen(false);
      }
    };

    if (isAddMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAddMenuOpen]);

  // Fetch supervisors and store in state - memoized to prevent unnecessary rerenders
  const fetchSupervisorsWithState = useCallback(async (): Promise<Supervisor[]> => {
    const data = await fetchSupervisors();
    setSupervisorsData(data);
    return data;
  }, []); // Empty deps - function doesn't depend on any props/state

  return (
    <>
      <div className="flex flex-col items-start gap-5 w-full">
        {/* Migration Button - Only show if there are supervisors without refid */}
        {supervisorsData.length > 0 && supervisorsData.some(s => !s.supervisorCode || s.supervisorCode === s.id) && (
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
                          {isMigrating ? "جاري إضافة كود المشرف..." : "إضافة كود المشرف للمشرفين الموجودين"}
                        </span>
                      </div>
                      {isMigrating && (
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                  </button>
                  <p className="text-sm text-gray-600 [direction:rtl]">
                    هذا الزر يضيف كود مشرف (8 أرقام) للمشرفين الذين لا يملكون كود
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DataTableSection<Supervisor>
          title="قائمة المشرفين"
          entityName="مشرف"
          entityNamePlural="مشرفين"
          icon={Users}
          columns={supervisorColumns}
          fetchData={fetchSupervisorsWithState}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
          addNewRoute="/supervisors/add"
          onAddClick={handleAddMenuToggle}
          viewDetailsRoute={(id) => `/supervisors/${id}`}
          loadingMessage="جاري تحميل بيانات المشرفين..."
          itemsPerPage={10}
          showTimeFilter={false}
          showAddButton={true}
          customAddButtonRef={addButtonRef}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Add Menu Popup */}
      {isAddMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              // Only close if clicking directly on backdrop, not on menu
              if (e.target === e.currentTarget) {
                setIsAddMenuOpen(false);
              }
            }}
          />
          {createPortal(
            <div
              className="fixed w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddOneSupervisor(e);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="w-full px-4 py-3 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-3 transition-colors"
                >
                  <span className="[direction:rtl]">إضافة مشرف واحد</span>
                  <CirclePlus className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUploadExcel();
                  }}
                  className="w-full px-4 py-3 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-3 transition-colors"
                >
                  <span className="[direction:rtl]">رفع ملف Excel لمجموعة مشرفين</span>
                  <Upload className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadTemplate();
                  }}
                  className="w-full px-4 py-3 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-3 transition-colors"
                >
                  <span className="[direction:rtl]">تنزيل نموذج للتعبئة</span>
                  <Download className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>,
            document.body
          )}
        </>
      )}

      {/* Delete Confirmation Popup */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف ${deleteConfirm.supervisorName}؟\n\nهذه العملية لا يمكن التراجع عنها.`}
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};
