import { Eye, UserRound } from 'lucide-react'
import { InfoDisplay } from '../../components/sections/InfoDisplay'
import { DataTableSection } from '../../components/sections/DataTableSection'
import ConsumptionSection from '../../components/sections/ConsumptionSection'
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { fetchFuelStationById, fetchFuelStationWorkersByStationEmail } from '../../services/firestore'

// Station Worker interface
interface StationWorker {
  id: string | number;
  workerCode: string;
  workerName: string;
  phone: string;
  email: string;
  accountStatus: { active: boolean; text: string };
}

export const StationsDetails = () => {
  const { id } = useParams<{ id: string }>()
  const [stationData, setStationData] = useState<any>({
    name: "جاري التحميل...",
    email: "-",
    phone: "-",
    address: "-",
    location: "-",
    secretNumber: "-",
    products: "-"
  })
  const [stationEmail, setStationEmail] = useState<string>("")
  const [loading, setLoading] = useState(true)

  // Fetch station data from Firestore
  useEffect(() => {
    const fetchStationData = async () => {
      if (!id) {
        console.error("No station ID provided")
        setLoading(false)
        return
      }

      try {
        console.log("📥 Fetching station data for ID:", id)
        
        // Fetch station using the ID
        const station = await fetchFuelStationById(id)

        if (station) {
          console.log("✅ Station data fetched from Firestore:", station)

          // Extract products from options
          const productsList: string[] = []
          if (station.options && Array.isArray(station.options)) {
            station.options.forEach((option: any) => {
              const fuelName = option.title?.ar || option.title?.en || ""
              const fuelPrice = option.price || 0
              if (fuelName) {
                productsList.push(`${fuelName} (${fuelPrice} ر.س / لتر)`)
              }
            })
          }
          const products = productsList.length > 0 ? productsList.join(" - ") : "-"

                                // Map the data to match our stationData structure
            const stationEmailValue = station.email || ""
            setStationData({
              name: station.stationName || station.name || "-",
              email: stationEmailValue,
              phone: station.phoneNumber || "-",
              address: station.address || station.formattedLocation?.address?.city || "-",
              location: station.formattedLocation?.name || station.cityName || "-",
              secretNumber: "-",
              products: products
            })
            
            // Store station email to fetch workers later
            setStationEmail(stationEmailValue)
        } else {
          console.log("⚠️ No station found with this ID")
          setStationData({
            name: "غير موجود",
            email: "-",
            phone: "-",
            address: "-",
            location: "-",
            secretNumber: "-",
            products: "-"
          })
        }
      } catch (error) {
        console.error("❌ Error fetching station data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStationData()
  }, [id])

  // Define the fields configuration for station
  // Using CSS Grid with 6 columns for flexible layouts
  // Order: Right to left as shown in the screenshot
  const stationFields = [
    // Row 1: 3 fields, each taking 2 columns (1/3 width each) - Right to left
    {
      key: 'phone',
      label: 'رقم الهاتف',
      type: 'phone' as const,
      span: 2 as const
    },
    {
      key: 'email',
      label: 'البريد الالكتروني',
      type: 'email' as const,
      span: 2 as const
    },
    {
      key: 'name',
      label: 'اسم المحطة',
      type: 'text' as const,
      span: 2 as const
    },
    // Row 2: Full width (6 columns)
    {
      key: 'address',
      label: 'العنوان',
      type: 'address' as const,
      span: 6 as const
    },
    // Row 3: Full width (6 columns)
    {
      key: 'location',
      label: 'الموقع',
      type: 'text' as const,
      span: 6 as const
    },
    // Row 4: 2 fields, each taking 3 columns (1/2 width each) - Right to left
    {
      key: 'products',
      label: 'منتجات المحطة',
      type: 'text' as const,
      span: 3 as const
    },
    {
      key: 'secretNumber',
      label: 'الرقم السري',
      type: 'text' as const,
      span: 3 as const
    }
  ];


  // Define columns for station workers table
  const stationWorkerColumns = [
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
      key: "email",
      label: "البريد الألكتروني",
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
      key: "workerName",
      label: "اسم العامل",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    },
    {
      key: "workerCode",
      label: "كود العامل",
      width: "flex-1 grow min-w-[100px]",
      priority: "high"
    }
  ];

  // Fetch data function for station workers
  const fetchStationWorkersData = async (): Promise<StationWorker[]> => {
    try {
      if (!stationEmail) {
        console.log("⚠️ No station email available yet")
        return []
      }
      
      console.log("📥 Fetching workers for station:", stationEmail)
      const workers = await fetchFuelStationWorkersByStationEmail(stationEmail)
      console.log("✅ Workers fetched:", workers.length)
      
      return workers
    } catch (error) {
      console.error("❌ Error fetching station workers:", error)
      return []
    }
  };

  // Handle status toggle
  const handleToggleStatus = (workerId: string | number) => {
    console.log(`Toggle status for worker ${workerId}`);
    // TODO: Implement actual status toggle API call
  };

  return (
    <div className="flex flex-col w-full items-start gap-5">
      <InfoDisplay
        data={stationData}
        title="معلومات المحطة"
        titleIcon={<Eye className="w-5 h-5 text-gray-500" />}
        fields={stationFields}
        showEditButton={true}
        editButtonText="تعديل البيانات"
        showBackButton={true}
        editRoute="/service-distributer-stations/add"
        entityId={id}
      />
      <ConsumptionSection />
      
      <DataTableSection<StationWorker>
        title="عمال المحطة"
        entityName="عامل المحطة"
        entityNamePlural="عمال المحطة"
        icon={UserRound}
        columns={stationWorkerColumns}
        fetchData={fetchStationWorkersData}
        onToggleStatus={handleToggleStatus}
        addNewRoute="/add-station-worker"
        viewDetailsRoute={(id) => `/service-distributer-station-worker/${id}`}
        loadingMessage="جاري تحميل بيانات عمال المحطة..."
        errorMessage="فشل في تحميل بيانات عمال المحطة. استخدام البيانات التجريبية."
        itemsPerPage={5}
        showTimeFilter={false}
      />
    </div>
  )
}