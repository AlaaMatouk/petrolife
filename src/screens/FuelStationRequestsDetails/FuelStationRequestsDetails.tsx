import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Eye, Car } from 'lucide-react'
import { InfoDisplay } from '../../components/sections/InfoDisplay'
import { fetchFuelStationOrderById } from '../../services/firestore'

export function FuelStationRequestsDetails() {
  const { id } = useParams<{ id: string }>()
  const [fuelRequestData, setFuelRequestData] = useState<any>({
    transactionNumber: "-",
    stationName: "-",
    customerName: "-",
    workerName: "-",
    fuelType: "-",
    totalLiters: "-",
    totalPrice: "-",
    orderDate: "-"
  })
  const [vehicleData, setVehicleData] = useState<any>({
    vehicleNumber: "-",
    driverName: "-",
    vehicleType: "-",
    vehicleMake: "-",
    vehicleModel: "-",
    manufactureYear: "-"
  })
  const [loading, setLoading] = useState(true)

  // Fetch order data from Firestore
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!id) {
        console.error("No order ID provided")
        setLoading(false)
        return
      }

      try {
        console.log("📥 Fetching order data for ID:", id)
        
        // Fetch order using the ID
        const order = await fetchFuelStationOrderById(id)

        if (order) {
          console.log("✅ Order data fetched from Firestore:", order)

          // Format date
          const formatDate = (date: any): string => {
            if (!date) return "-";
            try {
              const dateObj = date.toDate ? date.toDate() : new Date(date);
              const day = String(dateObj.getDate()).padStart(2, "0");
              const year = dateObj.getFullYear();
              const hoursNum = dateObj.getHours();
              const minutes = String(dateObj.getMinutes()).padStart(2, "0");
              const ampm = hoursNum >= 12 ? "م" : "ص";
              const displayHours = hoursNum % 12 || 12;

              const monthNames = [
                "يناير",
                "فبراير",
                "مارس",
                "أبريل",
                "مايو",
                "يونيو",
                "يوليو",
                "أغسطس",
                "سبتمبر",
                "أكتوبر",
                "نوفمبر",
                "ديسمبر",
              ];

              return `${day} ${
                monthNames[dateObj.getMonth()]
              } ${year} - ${displayHours}:${minutes} ${ampm}`;
            } catch (error) {
              return "-";
            }
          };

          // Map fuel request data
          setFuelRequestData({
            transactionNumber: order.refId || order.id || "-",
            stationName: order.carStation?.name || "-",
            customerName: order.client?.name || "-",
            workerName: order.fuelStationsWorker?.name || "-",
            fuelType: order.selectedOption?.categoryName || order.selectedOption?.title?.ar || "-",
            totalLiters: order.totalLitre?.toString() || "-",
            totalPrice: order.totalPrice?.toString() || "-",
            orderDate: formatDate(order.orderDate)
          })

          // Map vehicle data
          setVehicleData({
            vehicleNumber: order.clientCar?.carNumber || "-",
            driverName: order.assignedDriver?.name || "-",
            vehicleType: order.assignedDriver?.car?.size || "-",
            vehicleMake: order.assignedDriver?.car?.carModel?.name || "-",
            vehicleModel: order.assignedDriver?.carType?.name || "-",
            manufactureYear: "-"
          })
        } else {
          console.log("⚠️ No order found with this ID")
        }
      } catch (error) {
        console.error("❌ Error fetching order data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderData()
  }, [id])

  // Define the fields configuration for fuel request
  // Using CSS Grid with 6 columns for flexible layouts
  // Order: Right to left as shown in the screenshot
  const fuelRequestFields = [
    // Row 1: 3 fields, each taking 2 columns (1/3 width each) - Right to left
    {
      key: 'customerName',
      label: 'اسم العميل',
      type: 'text' as const,
      span: 2 as const
    },
    {
      key: 'stationName',
      label: 'اسم المحطة',
      type: 'text' as const,
      span: 2 as const
    },
    {
      key: 'transactionNumber',
      label: 'رقم المعاملة',
      type: 'text' as const,
      span: 2 as const
    },
    // Row 2: 3 fields, each taking 2 columns (1/3 width each) - Right to left
    {
      key: 'totalLiters',
      label: 'اجمالي اللترات',
      type: 'text' as const,
      span: 2 as const
    },
    {
      key: 'fuelType',
      label: 'نوع الوقود',
      type: 'text' as const,
      span: 2 as const
    },
    {
      key: 'workerName',
      label: 'اسم العامل',
      type: 'text' as const,
      span: 2 as const
    },
    // Row 3: 2 fields, each taking 2 columns - Right to left
    {
      key: 'orderDate',
      label: 'تاريخ الطلب',
      type: 'text' as const,
      span: 2 as const
    },
    {
      key: 'totalPrice',
      label: 'السعر الكلي (ر.س)',
      type: 'text' as const,
      span: 2 as const
    }
  ];

  // Define the fields configuration for vehicle information
  // Using CSS Grid with 6 columns for flexible layouts
  // Order: Right to left as shown in the screenshot
  const vehicleFields = [
    // Row 1: 3 fields, each taking 2 columns (1/3 width each) - Right to left
    {
      key: 'vehicleType',
      label: 'نوع المركبة',
      type: 'text' as const,
      span: 2 as const
    },
    {
      key: 'driverName',
      label: 'اسم السائق',
      type: 'text' as const,
      span: 2 as const
    },
    {
      key: 'vehicleNumber',
      label: 'رقم المركبة',
      type: 'text' as const,
      span: 2 as const
    },
    // Row 2: 3 fields, each taking 2 columns (1/3 width each) - Right to left
    {
      key: 'manufactureYear',
      label: 'سنة الاصدار',
      type: 'text' as const,
      span: 2 as const
    },
    {
      key: 'vehicleModel',
      label: 'طراز المركبة',
      type: 'text' as const,
      span: 2 as const
    },
    {
      key: 'vehicleMake',
      label: 'ماركة المركبة',
      type: 'text' as const,
      span: 2 as const
    }
  ];

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log("Edit fuel request data");
  };

  const handleVehicleEdit = () => {
    // TODO: Implement edit functionality
    console.log("Edit vehicle data");
  };

  return (
    <div className="flex flex-col w-full items-start gap-5">
      <InfoDisplay
        data={fuelRequestData}
        title="معلومات الطلب"
        titleIcon={<Eye className="w-5 h-5 text-gray-500" />}
        fields={fuelRequestFields}
        onEdit={handleEdit}
        showEditButton={true}
        editButtonText="تعديل البيانات"
        showBackButton={true}
      />

      <InfoDisplay
        data={vehicleData}
        title="معلومات المركبة"
        titleIcon={<Car className="w-5 h-5 text-gray-500" />}
        fields={vehicleFields}
        onEdit={handleVehicleEdit}
        showEditButton={true}
        editButtonText="تعديل البيانات"
        showBackButton={false}
      />
    </div>
  )
}

