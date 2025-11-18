import { DataTableSection } from "../../../sections/DataTableSection";
import { Building2 } from "lucide-react";
import {
  fetchAllCompaniesWithCounts,
  deleteCompany,
  addRefidToExistingCompanies,
} from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";
import { useState } from "react";
import { ConfirmDialog } from "../../../shared/ConfirmDialog/ConfirmDialog";

// Define the Company data type
export interface Company {
  id: string;
  companyName: string;
  companyCode: string;
  cars: number;
  drivers: number;
  subscriptions: string;
  email: string;
  phone: string;
  city: string;
}

// Sample columns configuration - you can modify this based on your needs
// Note: Columns are defined in reverse order because the Table component reverses them for RTL
const companyColumns = [
  {
    key: "actions",
    priority: "high" as const,
  },
  {
    key: "subscriptions",
    label: "الاشتراكات",
    priority: "high" as const,
  },
  {
    key: "drivers",
    label: "السائقين",
    priority: "high" as const,
  },
  {
    key: "cars",
    label: "السيارات",
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
    key: "companyName",
    label: "اسم الشركة",
    priority: "high" as const,
  },
  {
    key: "companyCode",
    label: "كود الشركة",
    priority: "high" as const,
  },
];

// Mock data - exported for use in other components
export const mockCompaniesData: Company[] = [
  {
    id: 1,
    subscriptions: "كلاسيك",
    drivers: 14,
    cars: 14,
    city: "جدة",
    email: "contact@techcorp.com",
    phone: "0507654321",
    companyName: "شركة التقنية المتقدمة",
    companyCode: "COMP001",
  },
  {
    id: 2,
    subscriptions: "بريميوم",
    drivers: 28,
    cars: 32,
    city: "الرياض",
    email: "info@petroservices.com",
    phone: "0501234567",
    companyName: "شركة الخدمات البترولية",
    companyCode: "COMP002",
  },
  {
    id: 3,
    subscriptions: "كلاسيك",
    drivers: 18,
    cars: 20,
    city: "الدمام",
    email: "contact@logistics.com",
    phone: "0503456789",
    companyName: "شركة اللوجستيات الوطنية",
    companyCode: "COMP003",
  },
  {
    id: 4,
    subscriptions: "بريميوم بلس",
    drivers: 45,
    cars: 50,
    city: "مكة المكرمة",
    email: "info@transport.com",
    phone: "0509876543",
    companyName: "شركة النقل السريع",
    companyCode: "COMP004",
  },
  {
    id: 5,
    subscriptions: "كلاسيك",
    drivers: 12,
    cars: 15,
    city: "المدينة المنورة",
    email: "contact@energy.com",
    phone: "0556789012",
    companyName: "شركة الطاقة المتجددة",
    companyCode: "COMP005",
  },
  {
    id: 6,
    subscriptions: "بريميوم",
    drivers: 35,
    cars: 38,
    city: "الطائف",
    email: "info@industrial.com",
    phone: "0558901234",
    companyName: "شركة الصناعات الثقيلة",
    companyCode: "COMP006",
  },
  {
    id: 7,
    subscriptions: "كلاسيك",
    drivers: 22,
    cars: 25,
    city: "الخبر",
    email: "contact@trading.com",
    phone: "0502345678",
    companyName: "شركة التجارة العالمية",
    companyCode: "COMP007",
  },
  {
    id: 8,
    subscriptions: "بريميوم بلس",
    drivers: 52,
    cars: 58,
    city: "أبها",
    email: "info@construction.com",
    phone: "0554567890",
    companyName: "شركة المقاولات والإنشاءات",
    companyCode: "COMP008",
  },
  {
    id: 9,
    subscriptions: "بريميوم",
    drivers: 30,
    cars: 33,
    city: "تبوك",
    email: "contact@mining.com",
    phone: "0506789012",
    companyName: "شركة التعدين والمحاجر",
    companyCode: "COMP009",
  },
  {
    id: 10,
    subscriptions: "كلاسيك",
    drivers: 16,
    cars: 18,
    city: "بريدة",
    email: "info@agricultural.com",
    phone: "0557890123",
    companyName: "شركة الزراعة الحديثة",
    companyCode: "COMP010",
  },
  {
    id: 11,
    subscriptions: "بريميوم",
    drivers: 25,
    cars: 28,
    city: "حائل",
    email: "contact@distribution.com",
    phone: "0508901234",
    companyName: "شركة التوزيع والتسويق",
    companyCode: "COMP011",
  },
  {
    id: 12,
    subscriptions: "بريميوم بلس",
    drivers: 48,
    cars: 55,
    city: "الجبيل",
    email: "info@chemical.com",
    phone: "0559012345",
    companyName: "شركة الصناعات الكيميائية",
    companyCode: "COMP012",
  },
  {
    id: 13,
    subscriptions: "كلاسيك",
    drivers: 10,
    cars: 12,
    city: "ينبع",
    email: "contact@maritime.com",
    phone: "0501234789",
    companyName: "شركة الشحن البحري",
    companyCode: "COMP013",
  },
];

// Fetch real companies data from Firestore with counts
const fetchCompanies = async (): Promise<Company[]> => {
  return await fetchAllCompaniesWithCounts();
};

export const Companies = () => {
  const { addToast } = useToast();
  const [companiesData, setCompaniesData] = useState<Company[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    companyId: string | null;
    companyName: string;
  }>({
    isOpen: false,
    companyId: null,
    companyName: "",
  });

  // Handle status toggle
  const handleToggleStatus = (id: string | number) => {
    console.log(`Toggle status for company with id: ${id}`);
    // Add your status toggle logic here
  };

  // Handle delete company - open confirmation popup
  const handleDelete = (id: string | number) => {
    const companyId = String(id);

    // Find company name for confirmation message
    const company = companiesData.find((c) => c.id === companyId);
    const companyName = company?.companyName || "الشركة";

    // Open confirmation dialog
    setDeleteConfirm({
      isOpen: true,
      companyId,
      companyName,
    });
  };

  // Confirm and delete company
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.companyId) return;

    try {
      setDeletingId(deleteConfirm.companyId);

      // Delete from Firestore
      await deleteCompany(deleteConfirm.companyId);

      // Show success message
      addToast({
        type: "success",
        message: `تم حذف ${deleteConfirm.companyName} بنجاح`,
        duration: 3000,
      });

      // Refresh the companies list
      const updatedData = await fetchCompanies();
      setCompaniesData(updatedData);

      // Close confirmation popup
      setDeleteConfirm({
        isOpen: false,
        companyId: null,
        companyName: "",
      });

      // Reload the page to refresh the table
      window.location.reload();
    } catch (error: any) {
      console.error("Error deleting company:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في حذف الشركة",
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
      companyId: null,
      companyName: "",
    });
  };

  // Handle migration: Add refid to existing companies
  const handleAddRefidToExisting = async () => {
    setIsMigrating(true);
    try {
      const updatedCount = await addRefidToExistingCompanies();
      addToast({
        type: "success",
        message: `تم إضافة كود الشركة لـ ${updatedCount} شركة بنجاح`,
        duration: 5000,
      });
      // Refresh the companies list
      const updatedData = await fetchCompanies();
      setCompaniesData(updatedData);
    } catch (error: any) {
      console.error("Error migrating companies:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في إضافة كود الشركة للشركات الموجودة",
        duration: 5000,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Fetch companies and store in state
  const fetchCompaniesWithState = async (): Promise<Company[]> => {
    const data = await fetchCompanies();
    setCompaniesData(data);
    return data;
  };

  return (
    <>
      <div className="flex flex-col items-start gap-5 w-full">
        {/* Migration Button - Only show if there are companies without refid */}
        {companiesData.length > 0 && companiesData.some(c => !c.companyCode || c.companyCode === c.id) && (
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
                          {isMigrating ? "جاري إضافة كود الشركة..." : "إضافة كود الشركة للشركات الموجودة"}
                        </span>
                      </div>
                      {isMigrating && (
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                  </button>
                  <p className="text-sm text-gray-600 [direction:rtl]">
                    هذا الزر يضيف كود شركة (8 أرقام) للشركات التي لا تملك كود
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DataTableSection<Company>
          title="قائمة الشركات"
          entityName="شركة"
          entityNamePlural="شركات"
          icon={Building2}
          columns={companyColumns}
          fetchData={fetchCompaniesWithState}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
          addNewRoute="/companies/add"
          viewDetailsRoute={(id) => `/companies/${id}`}
          loadingMessage="جاري تحميل بيانات الشركات..."
          itemsPerPage={10}
          showTimeFilter={false}
          showAddButton={true}
        />
      </div>

      {/* Delete Confirmation Popup */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف ${deleteConfirm.companyName}؟\n\nهذه العملية لا يمكن التراجع عنها.`}
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};
