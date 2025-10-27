import { DataTableSection } from "../../../sections/DataTableSection";
import { Truck } from "lucide-react";
import { Map } from "../../../../screens/PerolifeStationLocations/sections/map/Map";
import { fetchAdminFuelDeliveryRequests } from "../../../../services/firestore";

type FuelDeliveryRequest = {
  id: string;
  requestNumber: string;
  driverName: string;
  driverType: string;
  fuelType: string;
  quantity: string;
  deliveryAddress: string;
  requestDate: string;
  status: string;
};

const columns = [
  { key: "actions", priority: "high" as const },
  { key: "status", label: "حالة الطلب", priority: "high" as const },
  { key: "requestDate", label: "تاريخ الطلب", priority: "high" as const },
  {
    key: "deliveryAddress",
    label: "عنوان التوصيل",
    priority: "medium" as const,
  },
  { key: "quantity", label: "الكمية (لتر)", priority: "high" as const },
  { key: "fuelType", label: "نوع الوقود", priority: "high" as const },
  { key: "driverType", label: "نوع السائق", priority: "high" as const },
  { key: "driverName", label: "السائق الحالي", priority: "high" as const },
  { key: "requestNumber", label: "رقم العملية", priority: "high" as const },
];

const fetchFuelDeliveryRequests = async (): Promise<FuelDeliveryRequest[]> => {
  return await fetchAdminFuelDeliveryRequests();
};

export const FuelDelivery = () => {
  return (
    <div className="flex flex-col gap-6">
      {/* Map Section */}
      <div
        dir="rtl"
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-white rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder mb-6"
      >
        <header className="text-right inline-flex justify-end h-5 relative items-center gap-1.5">
          <h1 className="relative text-right h-5 mt-[-1.00px] font-subtitle-subtitle-2 font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
            اماكن السائقين
          </h1>
        </header>
        <div className="px-6 pb-6" style={{ height: "300px" }}>
          map
        </div>
      </div>

      {/* Data Table Section */}
      <DataTableSection<FuelDeliveryRequest>
        title="رحلات توصيل الوقود"
        entityName="طلب التوصيل"
        entityNamePlural="طلبات التوصيل"
        icon={Truck}
        columns={columns}
        fetchData={fetchFuelDeliveryRequests}
        addNewRoute="/fuel-delivery-requests"
        viewDetailsRoute={(id) => `/fuel-delivery-requests/${id}`}
        loadingMessage="جاري تحميل طلبات توصيل الوقود..."
        itemsPerPage={10}
        showTimeFilter={false}
        showAddButton={false}
        showFuelDeliveryButton={true}
      />
    </div>
  );
};

export default FuelDelivery;
