import { DataTableSection } from "../../../sections/DataTableSection/DataTableSection";
import { Car } from "lucide-react";
import {
  fetchVehicles,
  fetchDrivers,
  deletePetrolifeCar,
} from "../../../../services/firestore";
import { useState } from "react";
import { useToast } from "../../../../context/ToastContext";
import { ConfirmDialog } from "../../../shared/ConfirmDialog/ConfirmDialog";

interface PetrolifeVehicleRow {
  id: string;
  plateNumber: string;
  name: string;
  brand: string;
  model: string;
  releaseYear: string;
  fuelType: string;
  category: string;
  city: string;
  drivers: string[];
}

const formatValue = (value: any, defaultValue = "-"): string => {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  const stringValue = String(value).trim();
  return stringValue.length === 0 ? defaultValue : stringValue;
};

const columns = [
  { key: "actions", label: "الإجراءات", width: "w-16", priority: "high" },
  {
    key: "drivers",
    label: "السائقون",
    width: "min-w-[150px]",
    priority: "high",
    render: (value: string[]) => {
      if (!Array.isArray(value) || value.length === 0) {
        return <span className="text-gray-400 text-sm">-</span>;
      }

      const visibleDrivers = value.slice(0, 3);
      const remaining = value.length - visibleDrivers.length;

      return (
        <div className="flex items-center gap-2 flex-wrap">
          {visibleDrivers.map((driverId, idx) => (
            <span
              key={`${driverId}-${idx}`}
              className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
            >
              {driverId}
            </span>
          ))}
          {remaining > 0 && (
            <span className="text-xs text-gray-500">+{remaining}</span>
          )}
        </div>
      );
    },
  },
  {
    key: "city",
    label: "المدينة",
    width: "min-w-[100px]",
    priority: "low",
  },
  {
    key: "category",
    label: "تصنيف السيارة",
    width: "min-w-[120px]",
    priority: "high",
    render: (value: string | null) => (
      <div className="flex items-center gap-2">
        <Car className="w-4 h-4 text-gray-500" />
        <span className="font-medium">{value ?? "غير محدد"}</span>
      </div>
    ),
  },
  {
    key: "fuelType",
    label: "نوع الوقود",
    width: "min-w-[100px]",
    priority: "medium",
  },
  {
    key: "releaseYear",
    label: "سنة الاصدار",
    width: "min-w-[100px]",
    priority: "medium",
  },
  {
    key: "model",
    label: "الطراز",
    width: "min-w-[100px]",
    priority: "high",
  },
  {
    key: "brand",
    label: "الماركة",
    width: "min-w-[100px]",
    priority: "high",
  },
  {
    key: "name",
    label: "اسم السيارة",
    width: "min-w-[150px]",
    priority: "high",
  },
  {
    key: "plateNumber",
    label: "رقم السيارة",
    width: "min-w-[120px]",
    priority: "high",
  },
];

const mapVehicleToRow = (
  vehicle: any,
  fallbackId: number,
  driverNameMap: Map<string, string>
): PetrolifeVehicleRow => {
  const driversArray = Array.isArray(vehicle?.driverIds)
    ? vehicle.driverIds
        .filter((driverId: any) => driverId !== null && driverId !== undefined && String(driverId).trim() !== "")
        .map((driverId: any) => {
          const idString = String(driverId);
          const driverName =
            driverNameMap.get(idString) ||
            driverNameMap.get(String(driverId?.id)) ||
            driverNameMap.get(String(driverId?.docId));

          return formatValue(driverName ?? idString);
        })
    : [];

  return {
    id: String(vehicle?.docId ?? vehicle?.id ?? fallbackId),
    plateNumber: formatValue(
      vehicle?.plateNumber?.ar ?? vehicle?.plateNumber?.en
    ),
    name: formatValue(vehicle?.name),
    brand: formatValue(vehicle?.car?.carBrand?.name?.en),
    model: formatValue(vehicle?.carModel?.name?.en),
    releaseYear: formatValue(vehicle?.carModel?.year),
    fuelType: formatValue(vehicle?.fuelType),
    category: formatValue(
      vehicle?.plan?.carSize ?? vehicle?.size
    ),
    city: formatValue(vehicle?.city?.name?.en),
    drivers: driversArray.length > 0 ? driversArray : ["-"],
  };
};

const fetchData = async (): Promise<PetrolifeVehicleRow[]> => {
  try {
    const [vehicles, drivers] = await Promise.all([
      fetchVehicles(),
      fetchDrivers(),
    ]);

    if (!Array.isArray(vehicles)) {
      return [];
    }

    const driverNameMap = new Map<string, string>();

    if (Array.isArray(drivers)) {
      drivers.forEach((driver: any) => {
        const driverName = formatValue(
          driver?.name ?? driver?.driverName ?? driver?.fullName
        );

        const potentialIds = [
          driver?.docId,
          driver?.id,
          driver?.driverId,
          driver?.uId,
        ]
          .filter((identifier) => identifier !== null && identifier !== undefined)
          .map((identifier) => String(identifier));

        potentialIds.forEach((identifier) => {
          if (!driverNameMap.has(identifier)) {
            driverNameMap.set(identifier, driverName);
          }
        });
      });
    }

    const sortedVehicles = [...vehicles].sort((a, b) => {
      const dateA = a?.createdDate?.seconds
        ? a.createdDate.seconds * 1000
        : a?.createdDate
        ? new Date(a.createdDate).getTime()
        : 0;

      const dateB = b?.createdDate?.seconds
        ? b.createdDate.seconds * 1000
        : b?.createdDate
        ? new Date(b.createdDate).getTime()
        : 0;

      return dateB - dateA;
    });

    return sortedVehicles.map((vehicle, index) =>
      mapVehicleToRow(vehicle, index + 1, driverNameMap)
    );
  } catch (error) {
    console.error("Error fetching Petrolife vehicles:", error);
    return [];
  }
};

const PetrolifeCars = () => {
  const { addToast } = useToast();
  const [vehiclesData, setVehiclesData] = useState<PetrolifeVehicleRow[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    vehicleId: string | null;
    vehicleName: string;
  }>({
    isOpen: false,
    vehicleId: null,
    vehicleName: "",
  });

  // Fetch vehicles with state update
  const fetchDataWithState = async (): Promise<PetrolifeVehicleRow[]> => {
    const data = await fetchData();
    setVehiclesData(data);
    return data;
  };

  // Handle delete
  const handleDelete = (id: string | number) => {
    const vehicleId = String(id);

    // Find vehicle name for confirmation message
    const vehicle = vehiclesData.find((v) => v.id === vehicleId);
    const vehicleName = vehicle?.name || vehicle?.plateNumber || "المركبة";

    // Open confirmation dialog
    setDeleteConfirm({
      isOpen: true,
      vehicleId,
      vehicleName,
    });
  };

  // Confirm and delete vehicle
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.vehicleId) return;

    try {
      setDeletingId(deleteConfirm.vehicleId);

      // Delete from Firestore
      await deletePetrolifeCar(deleteConfirm.vehicleId);

      // Show success message
      addToast({
        type: "success",
        message: `تم حذف ${deleteConfirm.vehicleName} بنجاح`,
        duration: 3000,
      });

      // Close confirmation popup
      setDeleteConfirm({
        isOpen: false,
        vehicleId: null,
        vehicleName: "",
      });

      // Reload the page to refresh the table
      window.location.reload();
    } catch (error: any) {
      console.error("Error deleting vehicle:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في حذف المركبة",
        duration: 3000,
      });
      setDeletingId(null);
    }
  };

  // Cancel delete
  const handleDeleteCancel = () => {
    setDeleteConfirm({
      isOpen: false,
      vehicleId: null,
      vehicleName: "",
    });
  };

  return (
    <>
      <DataTableSection
        title="مركبات بترولايف"
        entityName="مركبة"
        entityNamePlural="مركبات"
        icon={Car}
        columns={columns}
        fetchData={fetchDataWithState}
        onDelete={handleDelete}
        addNewRoute="/petrolife-cars/add"
        viewDetailsRoute={(id) => `/petrolife-cars/${id}`}
        itemsPerPage={10}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف ${deleteConfirm.vehicleName}؟\n\nهذه العملية لا يمكن التراجع عنها.`}
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default PetrolifeCars;

