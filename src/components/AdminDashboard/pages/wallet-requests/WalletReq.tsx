import { DataTableSection } from "../../../sections/DataTableSection";
import { Wallet } from "lucide-react";
import { fetchAllAdminWalletRequests } from "../../../../services/firestore";

type WalletRequest = {
  id: string;
  requestNumber: string;
  clientName: string;
  orderType: string;
  oldBalance: string;
  addedBalance: string;
  requestDate: string;
  status: string;
  responsible: string;
};

const columns = [
  { key: "actions", priority: "high" as const },
  { key: "responsible", label: "المسؤول", priority: "high" as const },
  { key: "status", label: "حالة الطلب", priority: "high" as const },
  { key: "requestDate", label: "تاريخ الانشاء", priority: "high" as const },
  { key: "addedBalance", label: "الرصيد المضاف", priority: "high" as const },
  { key: "oldBalance", label: "الرصيد القديم", priority: "high" as const },
  { key: "orderType", label: "نوع الشحن", priority: "high" as const },
  { key: "clientName", label: "العميل", priority: "high" as const },
  { key: "requestNumber", label: "رقم العملية", priority: "high" as const },
];

const fetchWalletRequests = async (): Promise<WalletRequest[]> => {
  return await fetchAllAdminWalletRequests();
};

export const WalletReq = () => {
  return (
    <DataTableSection<WalletRequest>
      title="طلبات المحافظ"
      entityName="الطلب"
      entityNamePlural="طلبات"
      icon={Wallet}
      columns={columns}
      fetchData={fetchWalletRequests}
      addNewRoute="/wallet-requests"
      viewDetailsRoute={(id) => `/wallet-requests/${id}`}
      loadingMessage="جاري تحميل طلبات المحافظ..."
      itemsPerPage={10}
      showTimeFilter={false}
      showMoneyRefundButton={true}
    />
  );
};

export default WalletReq;
