import { DataTableSection } from "../../../sections/DataTableSection";
import { Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  fetchStationsCompanyData,
  ServiceProviderData,
  fetchPendingRequestsCount,
} from "../../../../services/firestore";
import { useState, useEffect } from "react";

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
      (item, index) => ({
        id: item.id || item.uId || `sp-${index + 1}`, // Use actual Firestore ID or fallback
        clientCode: item.clientCode,
        providerName: item.providerName,
        type: item.type,
        phone: item.phoneNumber,
        email: item.email,
        stations: item.stationsCount,
        sales: item.ordersCount.toString(), // Convert to string as expected by interface
        accountStatus: {
          active: item.status === "نشط" || item.status === "active",
          text:
            item.status === "نشط" || item.status === "active" ? "مفعل" : "معطل",
        },
      })
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

// Handle status toggle
const handleToggleStatus = (id: string | number) => {
  console.log(`Toggle status for service provider with id: ${id}`);
  // Add your status toggle logic here
};

export const ServiceProviders = () => {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState<number>(0);

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
    navigate("/service-providers/add");
  };

  return (
    <DataTableSection<ServiceProvider>
      title="مزودي الخدمة"
      entityName="مزود الخدمة"
      entityNamePlural="مزودي الخدمة"
      icon={Truck}
      columns={serviceProviderColumns}
      fetchData={fetchServiceProviders}
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
  );
};
