import { DataTableSection } from "../../../sections/DataTableSection";
import { Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  fetchStationsCompanyData,
  ServiceProviderData,
  fetchPendingRequestsCount,
  addRefidToExistingServiceProviders,
  updateServiceProviderIsActive,
  fetchServiceProviderById,
} from "../../../../services/firestore";
import { useState, useEffect } from "react";
import { useToast } from "../../../../context/ToastContext";

// Define the ServiceProvider data type (compatible with existing interface)
export interface ServiceProvider {
  id: string | number; // Allow both string (Firestore ID) and number (fallback)
  clientCode: string;
  providerName: string;
  type: string;
  phone: string;
  email: string;
  stations: number;
  sales: string;
  accountStatus: { active: boolean; text: string };
  logo?: string;
}

// Sample columns configuration - you can modify this based on your needs
// Note: Columns are defined in reverse order because the Table component reverses them for RTL
const serviceProviderColumns = [
  {
    key: "actions",
    priority: "high" as const,
  },
  {
    key: "accountStatus",
    label: "حاله الحساب",
    priority: "high" as const,
  },
  {
    key: "sales",
    label: "المبيعات",
    priority: "high" as const,
  },
  {
    key: "stations",
    label: "المحطات",
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
    key: "type",
    label: "نوع المزود",
    priority: "medium" as const,
  },
  {
    key: "providerName",
    label: "اسم مزود الخدمة",
    priority: "high" as const,
  },
  {
    key: "clientCode",
    label: "كود العميل",
    priority: "high" as const,
  },
];

// Mock data - exported for use in other components
export const mockServiceProvidersData: ServiceProvider[] = [
  {
    id: 1,
    clientCode: "SP001",
    providerName: "مركز التوزيع الأول",
    type: "مزود توزيع",
    phone: "0501234567",
    email: "info@distribution1.com",
    stations: 15,
    sales: "30",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 2,
    clientCode: "SP002",
    providerName: "مركز التوزيع الثاني",
    type: "مزود توزيع",
    phone: "0507654321",
    email: "contact@distribution2.com",
    stations: 12,
    sales: "30",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 3,
    clientCode: "SP003",
    providerName: "مركز الصيانة المتقدم",
    type: "مزود صيانة",
    phone: "0503456789",
    email: "info@maintenance.com",
    stations: 8,
    sales: "30",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 4,
    clientCode: "SP004",
    providerName: "مركز النقل السريع",
    type: "مزود نقل",
    phone: "0509876543",
    email: "contact@transport.com",
    stations: 20,
    sales: "30",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 5,
    clientCode: "SP005",
    providerName: "مركز التوزيع الشرقي",
    type: "مزود توزيع",
    phone: "0556789012",
    email: "info@eastern.com",
    stations: 10,
    sales: "30",
    accountStatus: { active: false, text: "معطل" },
  },
  {
    id: 6,
    clientCode: "SP006",
    providerName: "مركز الخدمات اللوجستية",
    type: "مزود لوجستي",
    phone: "0558901234",
    email: "contact@logistics.com",
    stations: 18,
    sales: "30",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 7,
    clientCode: "SP007",
    providerName: "مركز التوزيع الغربي",
    type: "مزود توزيع",
    phone: "0502345678",
    email: "info@western.com",
    stations: 14,
    sales: "30",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 8,
    clientCode: "SP008",
    providerName: "مركز الصيانة الشاملة",
    type: "مزود صيانة",
    phone: "0554567890",
    email: "contact@fullmaintenance.com",
    stations: 6,
    sales: "30",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 9,
    clientCode: "SP009",
    providerName: "مركز التوزيع الشمالي",
    type: "مزود توزيع",
    phone: "0506789012",
    email: "info@northern.com",
    stations: 11,
    sales: "30",
    accountStatus: { active: false, text: "معطل" },
  },
  {
    id: 10,
    clientCode: "SP010",
    providerName: "مركز النقل المتخصص",
    type: "مزود نقل",
    phone: "0557890123",
    email: "contact@specialized.com",
    stations: 16,
    sales: "30",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 11,
    clientCode: "SP011",
    providerName: "مركز التوزيع المركزي",
    type: "مزود توزيع",
    phone: "0508901234",
    email: "info@central.com",
    stations: 22,
    sales: "30",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 12,
    clientCode: "SP012",
    providerName: "مركز الخدمات الصناعية",
    type: "مزود صناعي",
    phone: "0559012345",
    email: "contact@industrial.com",
    stations: 9,
    sales: "30",
    accountStatus: { active: true, text: "مفعل" },
  },
];

// Fetch service providers data from Firestore
const fetchServiceProviders = async (): Promise<ServiceProvider[]> => {
  try {
    console.log("🔄 Fetching service providers from Firestore...");

    // Fetch real data from Firestore
    const firestoreData: ServiceProviderData[] =
      await fetchStationsCompanyData();

    // Transform Firestore data to match the existing ServiceProvider interface
    const transformedData: ServiceProvider[] = firestoreData.map(
      (item, index) => {
        // Determine active status: prioritize isActive field, fallback to status
        let isActive: boolean;
        if (item.isActive !== undefined && item.isActive !== null) {
          isActive = item.isActive === true;
        } else {
          // Fallback to status field if isActive is not set
          isActive = item.status === "نشط" || item.status === "active";
        }

        return {
          id: item.id, // Use the ID from ServiceProviderData (which is doc.id from Firestore)
          clientCode: item.clientCode,
          providerName: item.providerName,
          type: item.type,
          phone: item.phoneNumber,
          email: item.email,
          stations: item.stationsCount,
          sales: item.ordersCount.toString(), // Convert to string as expected by interface
          accountStatus: {
            active: isActive,
            text: isActive ? "مفعل" : "معطل",
          },
        };
      }
    );

    console.log(
      `✅ Successfully fetched ${transformedData.length} service providers`
    );
    return transformedData;
  } catch (error) {
    console.error("❌ Error fetching service providers:", error);
    // Return empty array on error to prevent crashes
    return [];
  }
};

export const ServiceProviders = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [serviceProvidersData, setServiceProvidersData] = useState<
    ServiceProvider[]
  >([]);
  const [isMigrating, setIsMigrating] = useState(false);

  // Fetch service providers with state update
  const fetchServiceProvidersWithState = async (): Promise<
    ServiceProvider[]
  > => {
    const data = await fetchServiceProviders();
    setServiceProvidersData(data);
    return data;
  };

  // Fetch the actual count of pending requests
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await fetchPendingRequestsCount();
        setPendingCount(count);
      } catch (error) {
        console.error("Error fetching pending requests count:", error);
      }
    };

    fetchCount();

    // Refresh count every 30 seconds to show real-time updates
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleJoinRequestsClick = () => {
    navigate("/service-providers/join-requests");
  };

  const handleAddRefidToExisting = async () => {
    setIsMigrating(true);
    try {
      const updatedCount = await addRefidToExistingServiceProviders();
      addToast({
        type: "success",
        message: `تم إضافة كود العميل لـ ${updatedCount} مزود خدمة بنجاح`,
        duration: 5000,
      });
      const updatedData = await fetchServiceProviders();
      setServiceProvidersData(updatedData);
    } catch (error: any) {
      console.error("Error migrating service providers:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في إضافة كود العميل لمزودي الخدمة الموجودين",
        duration: 5000,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (id: string | number) => {
    try {
      const serviceProviderId = String(id);
      
      // Fetch current service provider data from Firestore to get the current isActive status
      const currentServiceProviderData = await fetchServiceProviderById(serviceProviderId);
      
      // Get current isActive status
      // Handle null, undefined, or missing values - treat as false/inactive
      let currentIsActive: boolean;
      if (currentServiceProviderData.isActive === null || currentServiceProviderData.isActive === undefined) {
        // If isActive is null/undefined, check status field as fallback
        if (currentServiceProviderData.status === "نشط" || currentServiceProviderData.status === "active") {
          currentIsActive = true;
        } else {
          // If both are null/undefined/false, treat as inactive
          currentIsActive = false;
        }
      } else {
        currentIsActive = currentServiceProviderData.isActive === true;
      }
      
      const newIsActive = !currentIsActive;
      await updateServiceProviderIsActive(serviceProviderId, newIsActive);
      addToast({
        type: "success",
        message: newIsActive
          ? "تم تفعيل حساب مزود الخدمة بنجاح"
          : "تم تعطيل حساب مزود الخدمة بنجاح",
        duration: 3000,
      });
      const updatedData = await fetchServiceProviders();
      setServiceProvidersData(updatedData);
    } catch (error) {
      console.error("Error toggling service provider status:", error);
      addToast({
        type: "error",
        message: "فشل في تحديث حالة الحساب",
        duration: 3000,
      });
    }
  };

  return (
    <div className="flex flex-col items-start gap-5 relative w-full">
      {serviceProvidersData.length > 0 &&
        serviceProvidersData.some(
          (sp) => !sp.clientCode || sp.clientCode === sp.id
        ) && (
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
                            ? "جاري إضافة كود العميل..."
                            : "إضافة كود العميل لمزودي الخدمة الموجودين"}
                        </span>
                      </div>
                      {isMigrating && (
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                  </button>
                  <p className="text-sm text-gray-600 [direction:rtl]">
                    هذا الزر يضيف كود عميل (8 أرقام) لمزودي الخدمة الذين لا يملكون كود
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      <DataTableSection<ServiceProvider>
        title="مزودي الخدمة"
        entityName="مزود الخدمة"
        entityNamePlural="مزودي الخدمة"
        icon={Truck}
        columns={serviceProviderColumns}
        fetchData={fetchServiceProvidersWithState}
        onToggleStatus={handleToggleStatus}
        addNewRoute="/service-providers/add"
        viewDetailsRoute={(id) => `/service-providers/${id}`}
        loadingMessage="جاري تحميل بيانات مزودي الخدمة"
        itemsPerPage={10}
        showTimeFilter={false}
        showAddButton={true}
        customFilterButton={{
          label: "سجل طلبات الانضمام",
          count: pendingCount,
          onClick: handleJoinRequestsClick,
        }}
      />
    </div>
  );
};
