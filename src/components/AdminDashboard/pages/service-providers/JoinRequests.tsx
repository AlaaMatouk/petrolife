import { FileText } from "lucide-react";
import { useState } from "react";
import { DataTableSection } from "../../../sections/DataTableSection/DataTableSection";
import { ROUTES } from "../../../../constants/routes";
import {
  fetchStationsCompanyRequests,
  StationsCompanyRequestData,
} from "../../../../services/firestore";

interface RegistrationRequest {
  id: string;
  providerName: string;
  type: string;
  address: string;
  phoneNumber: string;
  email: string;
  stations: number;
  status: string;
}

// Table columns definition - updated to match requirements
const columns = [
  {
    key: "actions",
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
    key: "phoneNumber",
    label: "رقم الهاتف",
    priority: "medium" as const,
  },
  {
    key: "address",
    label: "العنوان",
    priority: "medium" as const,
  },
  {
    key: "type",
    label: "نوع المزود",
    priority: "high" as const,
  },
  {
    key: "providerName",
    label: "اسم مزود الخدمة",
    priority: "high" as const,
  },
];

// Fetch function - now uses real Firestore data
const fetchRegistrationRequests = async (): Promise<RegistrationRequest[]> => {
  try {
    console.log("🔄 Fetching stations company join requests from Firestore...");

    // Fetch real data from Firestore
    const firestoreData: StationsCompanyRequestData[] =
      await fetchStationsCompanyRequests();

    // Transform Firestore data to match the RegistrationRequest interface
    const transformedData: RegistrationRequest[] = firestoreData.map(
      (item) => ({
        id: item.id,
        providerName: item.providerName,
        type: item.type,
        address: item.address,
        phoneNumber: item.phoneNumber,
        email: item.email,
        stations: item.stations,
        status: item.status,
      })
    );

    console.log(
      `✅ Successfully fetched ${transformedData.length} join requests`
    );
    return transformedData;
  } catch (error) {
    console.error("❌ Error fetching join requests:", error);
    // Return empty array on error to prevent crashes
    return [];
  }
};

export const JoinRequests = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="w-full">
      <DataTableSection<RegistrationRequest>
        title="سجل طلبات الانضمام"
        entityName="مزود"
        entityNamePlural="مزودين"
        icon={FileText}
        columns={columns}
        fetchData={fetchRegistrationRequests}
        addNewRoute={ROUTES.ADD_SERVICE_PROVIDER}
        viewDetailsRoute={(id) => `/service-providers/${id}`}
        loadingMessage="جاري تحميل مزودي الخدمة..."
        errorMessage="فشل في تحميل مزودي الخدمة"
        itemsPerPage={10}
        showAddButton={true}
        customActionButtons={true}
        refreshTrigger={refreshTrigger}
        onRefresh={handleRefresh}
      />
    </div>
  );
};
