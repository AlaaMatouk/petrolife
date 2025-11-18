import { DataTableSection } from "../../components/sections/DataTableSection";
import { workersData } from "../../constants/data";
import { UserRound } from "lucide-react";
import { fetchFuelStationsWorkers } from "../../services/firestore";

// Worker interface for Station Workers
interface Worker {
  id: string | number;
  driverCode: string;
  driverName: string;
  phone: string;
  emailAddress: string;
  station: string;
  accountStatus: { active: boolean; text: string };
}

export const StationWorkers = (): JSX.Element => {
  // Define columns for workers table
  const workerColumns = [
    {
      key: "actions",
      label: "",
      width: "w-16 min-w-[60px]",
      priority: "high"
    },
    {
      key: "accountStatus",
      label: "حالة الحساب",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    },
    {
      key: "station",
      label: "المحطة",
      width: "flex-1 grow min-w-[100px]",
      priority: "low"
    },
    {
      key: "emailAddress",
      label: "البريد الإلكتروني",
      width: "flex-1 grow min-w-[150px]",
      priority: "low"
    },
    {
      key: "phone",
      label: "رقم الهاتف",
      width: "flex-1 grow min-w-[120px]",
      priority: "medium"
    },
    {
      key: "driverName",
      label: "اسم العامل",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    },
    {
      key: "driverCode",
      label: "كود العامل",
      width: "flex-1 grow min-w-[100px]",
      priority: "high"
    }
  ];

  // Fetch data function for workers
  const fetchWorkersData = async (): Promise<Worker[]> => {
    try {
      const workers = await fetchFuelStationsWorkers();
      return workers as Worker[];
    } catch (error) {
      console.error("Error fetching workers:", error);
      // Return mock data as fallback
      return workersData as Worker[];
    }
  };

  // Handle status toggle
  const handleToggleStatus = (workerId: string | number) => {
    console.log(`Toggle status for worker ${workerId}`);
    // TODO: Implement actual status toggle API call
  };
  return (
    <div className="flex flex-col w-full items-start gap-5">
      <DataTableSection<Worker>
        title="عمال المحطات"
        entityName="العامل"
        entityNamePlural="العمال"
        icon={UserRound}
        columns={workerColumns}
        fetchData={fetchWorkersData}
        onToggleStatus={handleToggleStatus}
        addNewRoute="/adddriver"
        viewDetailsRoute={(id) => `/service-distributer-station-worker/${id}`}
        loadingMessage="جاري تحميل بيانات العاملين..."
        errorMessage="فشل في تحميل بيانات العاملين. استخدام البيانات التجريبية."
        itemsPerPage={5}
      />
    </div>
  );
};

