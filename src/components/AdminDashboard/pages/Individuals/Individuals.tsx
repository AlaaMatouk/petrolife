import { DataTableSection } from "../../../sections/DataTableSection";
import { Users } from "lucide-react";
import {
  fetchAllClients,
  addRefidToExistingClients,
  updateClientIsActive,
  fetchClientById,
  deleteClient,
} from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";
import { useState } from "react";
import { ConfirmDialog } from "../../../shared/ConfirmDialog/ConfirmDialog";

/**
 * @typedef {Object} Individual
 * @property {string} id - Client ID (uid)
 * @property {string} individualName - Client Name
 * @property {string} individualCode - Client Code (uid)
 * @property {string} email - Email address
 * @property {string} phone - Phone number
 * @property {string} city - City
 * @property {{active: boolean, text: string}} accountStatus - Account status (isActive)
 *
 */

// Columns configuration for clients table
// Note: Columns are defined in reverse order because the Table component reverses them for RTL
const individualColumns = [
  {
    key: "actions",
    priority: "high",
  },
  {
    key: "accountStatus",
    label: "حالة الحساب",
    priority: "high",
  },
  {
    key: "city",
    label: "المدينة",
    priority: "high",
  },
  {
    key: "email",
    label: "البريد الإلكتروني",
    priority: "medium",
  },
  {
    key: "phone",
    label: "رقم الهاتف",
    priority: "medium",
  },
  {
    key: "individualName",
    label: "اسم العميل",
    priority: "high",
  },
  {
    key: "individualCode",
    label: "كود العميل",
    priority: "high",
  },
];

// Fetch clients data from Firestore and map to table format
const fetchIndividuals = async () => {
  try {
    const clientsData = await fetchAllClients();

    // Map the Firebase data to match the table structure
    return clientsData.map((client) => {
      // Helper function to safely extract string values
      const safeStringValue = (value: any): string => {
        if (!value) return "-";
        if (typeof value === "string") return value;
        if (typeof value === "object") {
          // Handle localized objects like {ar: "text", en: "text"}
          if (value.ar) return value.ar;
          if (value.en) return value.en;
          // If it's an object but no ar/en, convert to string
          return JSON.stringify(value);
        }
        return String(value);
      };

      return {
        id: client.id, // Document ID
        individualCode: client.refid || client.uid || client.id, // كود العميل (refid or fallback to uid/id)
        individualName: safeStringValue(client.name), // اسم العميل
        phone: safeStringValue(client.phoneNumber), // رقم الهاتف
        email: safeStringValue(client.email), // البريد الإلكتروني
        city: safeStringValue(client.city), // المدينة
        accountStatus: {
          active: client.isActive !== undefined ? client.isActive : true, // حالة الحساب
          text:
            client.isActive !== undefined
              ? client.isActive
                ? "مفعل"
                : "معطل"
              : "مفعل",
        },
      };
    });
  } catch (error) {
    console.error("Error fetching individuals:", error);
    return [];
  }
};

export const Individuals = () => {
  const { addToast } = useToast();
  const [individualsData, setIndividualsData] = useState<any[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    clientId: string | null;
    clientName: string;
  }>({
    isOpen: false,
    clientId: null,
    clientName: "",
  });

  // Fetch individuals and store in state
  const fetchIndividualsWithState = async () => {
    const data = await fetchIndividuals();
    setIndividualsData(data);
    return data;
  };

  // Handle status toggle
  const handleToggleStatus = async (id: string | number) => {
    try {
      const clientId = String(id);
      
      // Fetch current client data from Firestore to get the current isActive status
      const currentClientData = await fetchClientById(clientId);
      
      // Get current isActive status
      // Handle null, undefined, or missing values - treat as false/inactive
      let currentIsActive: boolean;
      if (currentClientData.isActive === null || currentClientData.isActive === undefined) {
        // If isActive is null/undefined, check accountStatus
        if (currentClientData.accountStatus?.active === true) {
          currentIsActive = true;
        } else {
          // If both are null/undefined/false, treat as inactive
          currentIsActive = false;
        }
      } else {
        currentIsActive = currentClientData.isActive === true;
      }
      
      // Calculate the new isActive value (opposite of current)
      // When toggle is turned OFF, set isActive to false
      // When toggle is turned ON, set isActive to true
      const newIsActive = !currentIsActive;

      // Update in Firestore
      await updateClientIsActive(clientId, newIsActive);

      // Show success message
      addToast({
        type: "success",
        message: newIsActive
          ? "تم تفعيل حساب العميل بنجاح"
          : "تم تعطيل حساب العميل بنجاح",
        duration: 3000,
      });

      // Refresh the individuals list
      const updatedData = await fetchIndividuals();
      setIndividualsData(updatedData);
    } catch (error) {
      console.error("Error toggling client status:", error);
      addToast({
        type: "error",
        message: "فشل في تحديث حالة الحساب",
        duration: 3000,
      });
    }
  };

  // Handle delete client - open confirmation popup
  const handleDelete = (id: string | number) => {
    const clientId = String(id);

    // Find client name for confirmation message
    const client = individualsData.find((c) => c.id === clientId);
    const clientName = client?.individualName || "العميل";

    // Open confirmation dialog
    setDeleteConfirm({
      isOpen: true,
      clientId,
      clientName,
    });
  };

  // Confirm and delete client
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.clientId) return;

    try {
      setDeletingId(deleteConfirm.clientId);

      // Delete from Firestore
      await deleteClient(deleteConfirm.clientId);

      // Show success message
      addToast({
        type: "success",
        message: `تم حذف ${deleteConfirm.clientName} بنجاح`,
        duration: 3000,
      });

      // Refresh the individuals list
      const updatedData = await fetchIndividuals();
      setIndividualsData(updatedData);

      // Close confirmation popup
      setDeleteConfirm({
        isOpen: false,
        clientId: null,
        clientName: "",
      });

      // Data already refreshed above, no need to reload
    } catch (error: any) {
      console.error("Error deleting client:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في حذف العميل",
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
      clientId: null,
      clientName: "",
    });
  };

  // Handle migration: Add refid to existing clients
  const handleAddRefidToExisting = async () => {
    setIsMigrating(true);
    try {
      const updatedCount = await addRefidToExistingClients();
      addToast({
        type: "success",
        message: `تم إضافة كود العميل لـ ${updatedCount} عميل بنجاح`,
        duration: 5000,
      });
      // Refresh the individuals list
      const updatedData = await fetchIndividuals();
      setIndividualsData(updatedData);
    } catch (error: any) {
      console.error("Error migrating clients:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في إضافة كود العميل للعملاء الموجودين",
        duration: 5000,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-start gap-5 w-full">
        {/* Migration Button - Only show if there are clients without refid */}
        {individualsData.length > 0 && individualsData.some(i => !i.individualCode || i.individualCode === i.id) && (
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
                          {isMigrating ? "جاري إضافة كود العميل..." : "إضافة كود العميل للعملاء الموجودين"}
                        </span>
                      </div>
                      {isMigrating && (
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                  </button>
                  <p className="text-sm text-gray-600 [direction:rtl]">
                    هذا الزر يضيف كود عميل (8 أرقام) للعملاء الذين لا يملكون كود
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DataTableSection
          title="قائمة الأفراد"
          entityName="فرد"
          entityNamePlural="أفراد"
          icon={Users}
          columns={individualColumns}
          fetchData={fetchIndividualsWithState}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
          addNewRoute="/individuals/add"
          viewDetailsRoute={(id) => `/individuals/${id}`}
          loadingMessage="جاري تحميل بيانات الأفراد..."
          itemsPerPage={10}
          showTimeFilter={false}
          showAddButton={true}
        />
      </div>

      {/* Delete Confirmation Popup */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف ${deleteConfirm.clientName}؟\n\nهذه العملية لا يمكن التراجع عنها.`}
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};
