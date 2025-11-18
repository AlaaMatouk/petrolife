import { DataTableSection } from "../../../sections/DataTableSection";
import { DollarSign, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type MoneyRefundRequest = {
  id: number;
  requestNumber: string;
  clientName: string;
  orderType: string;
  oldBalance: string;
  addedBalance: string;
  requestDate: string;
  status: string;
  responsible: string;
  withdrawalAmount: string;
  companyIban: string;
  bankName: string;
  ibanImage: string;
};

const columns = [
  { key: "actions", priority: "high" as const },
  { key: "responsible", label: "المسؤول", priority: "high" as const },
  { key: "status", label: "حالة الطلب", priority: "high" as const },
  { key: "requestDate", label: "تاريخ الانشاء", priority: "high" as const },
  { key: "withdrawalAmount", label: "قيمة الاسترداد", priority: "high" as const },
  { key: "companyIban", label: "Company IBAN", priority: "high" as const },
  { key: "bankName", label: "اسم البنك", priority: "high" as const },
  { key: "ibanImage", label: "صورة IBAN البنكي", priority: "high" as const },
];

const fetchMoneyRefundRequests = async (): Promise<MoneyRefundRequest[]> => {
  // Mock data for now
  return [
    {
      id: 1,
      requestNumber: "MR-1001",
      clientName: "شركة الأفق",
      orderType: "استرداد مباشر",
      oldBalance: "5,000 ر.س",
      addedBalance: "2,500 ر.س",
      requestDate: "2025-01-15",
      status: "مكتمل",
      responsible: "أحمد محمد",
      withdrawalAmount: "2,500 ر.س",
      companyIban: "SA1234567890123456789012",
      bankName: "البنك الأهلي السعودي",
      ibanImage: "-",
    },
    {
      id: 2,
      requestNumber: "MR-1002",
      clientName: "محمد أحمد",
      orderType: "استرداد بنكي",
      oldBalance: "3,200 ر.س",
      addedBalance: "800 ر.س",
      requestDate: "2025-01-14",
      status: "قيد المراجعة",
      responsible: "سارة أحمد",
      withdrawalAmount: "800 ر.س",
      companyIban: "SA9876543210987654321098",
      bankName: "مصرف الراجحي",
      ibanImage: "-",
    },
    {
      id: 3,
      requestNumber: "MR-1003",
      clientName: "مؤسسة الرواد",
      orderType: "استرداد مباشر",
      oldBalance: "8,000 ر.س",
      addedBalance: "1,200 ر.س",
      requestDate: "2025-01-13",
      status: "مرفوض",
      responsible: "خالد السعد",
      withdrawalAmount: "1,200 ر.س",
      companyIban: "SA1122334455667788990011",
      bankName: "البنك السعودي للاستثمار",
      ibanImage: "-",
    },
    {
      id: 4,
      requestNumber: "MR-1004",
      clientName: "عبدالله القحطاني",
      orderType: "استرداد بنكي",
      oldBalance: "2,000 ر.س",
      addedBalance: "500 ر.س",
      requestDate: "2025-01-12",
      status: "مكتمل",
      responsible: "نورا العتيبي",
      withdrawalAmount: "500 ر.س",
      companyIban: "SA5566778899001122334455",
      bankName: "البنك السعودي الفرنسي",
      ibanImage: "-",
    },
    {
      id: 5,
      requestNumber: "MR-1005",
      clientName: "شركة النخيل",
      orderType: "استرداد مباشر",
      oldBalance: "10,000 ر.س",
      addedBalance: "3,200 ر.س",
      requestDate: "2025-01-11",
      status: "قيد المراجعة",
      responsible: "فهد المطيري",
      withdrawalAmount: "3,200 ر.س",
      companyIban: "SA9988776655443322110099",
      bankName: "بنك الجزيرة",
      ibanImage: "-",
    },
  ];
};

export const MoneyReq = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Back Arrow */}
      <div className="mb-4">
        <button
          onClick={() => navigate("/wallet-requests")}
          aria-label="رجوع"
          className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]"
        >
          <div className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </div>
        </button>
      </div>

      <DataTableSection<MoneyRefundRequest>
        title="طلبات استرداد الأموال"
        entityName="طلب"
        entityNamePlural="طلبات"
        icon={DollarSign}
        columns={columns}
        fetchData={fetchMoneyRefundRequests}
        addNewRoute="/moneyrefundrequests"
        viewDetailsRoute={(id) => `/wallet-requests/moneyrefundrequests/${id}`}
        loadingMessage="جاري تحميل طلبات استرداد الأموال..."
        itemsPerPage={10}
        showTimeFilter={false}
        showAddButton={false}
      />
    </>
  );
};

export default MoneyReq;
