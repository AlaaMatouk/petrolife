import { DataTableSection } from "../../../sections/DataTableSection";
import { Truck } from "lucide-react";
import { fetchAdminReceivedDeliveryRequests } from "../../../../services/firestore";

type ReceivedDeliveryRequest = {
  id: string;
  requestNumber: string;
  driverType: string;
  fuelType: string;
  quantity: string;
  deliveryAddress: string;
  requestDate: string;
};

const columns = [
  { key: "actions", priority: "high" as const },
  { key: "requestDate", label: "تاريخ الطلب", priority: "high" as const },
  {
    key: "deliveryAddress",
    label: "عنوان التوصيل",
    priority: "medium" as const,
  },
  {
    key: "quantity",
    label: "الكمية المطلوبة (لتر)",
    priority: "high" as const,
  },
  { key: "driverType", label: "نوع الموقع", priority: "high" as const },
  { key: "fuelType", label: "نوع الوقود", priority: "high" as const },
  { key: "requestNumber", label: "رقم الطلب", priority: "high" as const },
];

const fetchReceivedDeliveryRequests = async (): Promise<
  ReceivedDeliveryRequest[]
> => {
  return await fetchAdminReceivedDeliveryRequests();
};

export const ReceivedDeliveryReq = () => {
  return (
    <DataTableSection<ReceivedDeliveryRequest>
      title="طلبات التوصيل المستلمة"
      entityName="طلب التوصيل المستلم"
      entityNamePlural="طلبات التوصيل المستلمة"
      icon={Truck}
      columns={columns}
      fetchData={fetchReceivedDeliveryRequests}
      addNewRoute="/fuel-delivery-requests/received-delivery-requests"
      viewDetailsRoute={(id) =>
        `/fuel-delivery-requests/received-delivery-requests/${id}`
      }
      loadingMessage="جاري تحميل طلبات التوصيل المعلقة..."
      itemsPerPage={10}
      showTimeFilter={false}
      showAddButton={false}
    />
  );
};

export default ReceivedDeliveryReq;
