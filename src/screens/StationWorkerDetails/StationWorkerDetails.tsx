import { UserRound, Calendar } from 'lucide-react'
import { InfoDisplay } from '../../components/sections/InfoDisplay'
import { DataTableSection } from '../../components/sections/DataTableSection'
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { fetchFuelStationWorkerByEmail, fetchWorkerTransactions } from '../../services/firestore'

// Worker Record interface
interface WorkerRecord {
  id: string | number;
  transactionNumber: string;
  stationName: string;
  clientName: string;
  fuelType: string;
  totalLiters: string;
  totalPrice: string;
  creationDate: string;
}

function StationWorkerDetails() {
  const { id } = useParams<{ id: string }>()
  const [workerData, setWorkerData] = useState<any>({
    name: "جاري التحميل...",
    email: "-",
    phone: "-",
    city: "-",
    address: "-",
    image: "",
    employeeId: "-"
  })
  const [workerEmail, setWorkerEmail] = useState<string>("")

  // Fetch worker data from Firestore
  useEffect(() => {
    const fetchWorkerData = async () => {
      if (!id) {
        console.error("No worker UID provided")
        return
      }

      try {
        console.log("📥 Fetching worker data for UID:", id)
        
        // Fetch worker using the UID
        const workerData = await fetchFuelStationWorkerByEmail(id)

        if (workerData) {
          console.log("✅ Worker data fetched from Firestore:", workerData)
          console.log("📋 Worker Data Structure:", {
            name: workerData.name,
            email: workerData.email,
            phoneNumber: workerData.phoneNumber,
            carStation: workerData.carStation,
            stationsCompany: workerData.stationsCompany,
            uId: workerData.uId,
            image: workerData.image
          })

                     // Store worker email for fetching transactions
           setWorkerEmail(workerData.email || id);

                     // Map the data to match our workerData structure
           setWorkerData({
             name: workerData.name || "-",
             email: workerData.email || id,
             phone: workerData.phoneNumber || "-",
             city: workerData.carStation?.name || workerData.stationsCompany?.name || "-",
             address: workerData.carStation?.address || "-",
             image: workerData.image || "",
             employeeId: "-"
           })
        } else {
          console.log("⚠️ No worker found with this email")
          setWorkerData({
            name: "غير موجود",
            email: "-",
            phone: "-",
            city: "-",
            address: "-",
            image: "",
            employeeId: "-"
          })
        }
      } catch (error) {
        console.error("❌ Error fetching worker data:", error)
      }
    }

    fetchWorkerData()
  }, [id])

  // Define the fields configuration for station worker
  // Order: Right to left as shown in the screenshot
  const workerFields = [
    // Row 1: Right to left
    {
      key: 'name',
      label: 'اسم العامل',
      type: 'text' as const,
      span: 2 as const

    },
    {
      key: 'email',
      label: 'البريد الالكتروني',
      type: 'email' as const,
      span: 2 as const

    },
    {
      key: 'phone',
      label: 'رقم الهاتف',
      type: 'phone' as const,
      span: 2 as const

    },
    // Row 2: Right to left
    {
      key: 'city',
      label: 'المدينة',
      type: 'text' as const,
      span: 2 as const

    },
    {
      key: 'address',
      label: 'العنوان',
      type: 'address' as const,
      span: 2 as const

    },
    {
      key: 'image',
      label: 'صورة العامل',
      type: 'image' as const,
      span: 2 as const

    },
    // Row 3: Right to left (الرقم الوظيفي should be on the right)
    {
      key: 'employeeId',
      label: 'الرقم الوظيفي',
      type: 'text' as const,
      span: 2 as const

    }
  ];

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log("Edit worker data");
  };


  // Define columns for worker records table
  const workerRecordColumns = [
    {
      key: "actions",
      label: "",
      width: "w-16 min-w-[60px]",
      priority: "high"
    },
    {
      key: "creationDate",
      label: "تاريخ الانشاء",
      width: "flex-1 grow min-w-[120px]",
      priority: "medium"
    },
    {
      key: "totalPrice",
      label: "السعر الكلي (رس)",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    },
    {
      key: "totalLiters",
      label: "اجمالي اللترات",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    },
    {
      key: "fuelType",
      label: "نوع الوقود",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    },
    {
      key: "clientName",
      label: "اسم العميل",
      width: "flex-1 grow min-w-[120px]",
      priority: "medium"
    },
    {
      key: "stationName",
      label: "اسم المحطة",
      width: "flex-1 grow min-w-[150px]",
      priority: "high"
    },
    {
      key: "transactionNumber",
      label: "رقم المعاملة",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    }
  ];

  // Fetch data function for worker records
  const fetchWorkerRecordsData = async (): Promise<WorkerRecord[]> => {
    if (!workerEmail) {
      console.log("⚠️ No worker email available for fetching transactions");
      return [];
    }
    try {
      const transactions = await fetchWorkerTransactions(workerEmail);
      return transactions;
    } catch (error) {
      console.error("❌ Error fetching worker records:", error);
      return [];
    }
  };

  // Handle status toggle (if needed)
  const handleToggleStatus = (recordId: string | number) => {
    console.log(`Toggle status for worker record ${recordId}`);
    // TODO: Implement actual status toggle API call
  };

  return (
    <div className="flex flex-col w-full items-start gap-5">
      <InfoDisplay
        data={workerData}
        title="معلومات العامل"
        titleIcon={<UserRound className="w-5 h-5 text-gray-500" />}
        fields={workerFields}
        onEdit={handleEdit}
        showEditButton={true}
        editButtonText="تعديل البيانات"
        showBackButton={true}
      />
      
      <DataTableSection<WorkerRecord>
        title="سجل العامل"
        entityName="سجل العامل"
        entityNamePlural="سجلات العامل"
        icon={Calendar}
        columns={workerRecordColumns}
        fetchData={fetchWorkerRecordsData}
        onToggleStatus={handleToggleStatus}
        addNewRoute="/add-worker-record"
        viewDetailsRoute={(id) => `/worker-record/${id}`}
        loadingMessage="جاري تحميل بيانات سجل العامل..."
        errorMessage="فشل في تحميل بيانات سجل العامل."
        itemsPerPage={5}
        showTimeFilter={true}
        showAddButton={false}
      />
    </div>
  )
}

export default StationWorkerDetails