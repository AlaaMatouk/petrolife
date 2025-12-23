import { DataTableSection } from "../../../sections/DataTableSection";
import { DollarSign, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import {
  fetchAllAdminWithdrawalRequests,
  approveWalletWithdrawalRequest,
  rejectWalletWithdrawalRequest,
} from "../../../../services/firestore";
import { auth } from "../../../../config/firebase";
import { useToast } from "../../../../hooks/useToast";

type MoneyRefundRequest = {
  id: string;
  requestNumber: string;
  clientName: string;
  oldBalance: string;
  withdrawalAmount: string | number;
  companyIban: string;
  bankName: string;
  ibanImage: string;
  requestDate: string;
  status: string;
  responsible: string;
};

const columns = [
  { key: "actions", priority: "high" as const },
  { key: "responsible", label: "المسؤول", priority: "high" as const },
  { key: "status", label: "حالة الطلب", priority: "high" as const },
  { key: "requestDate", label: "تاريخ الانشاء", priority: "high" as const },
  {
    key: "withdrawalAmount",
    label: "قيمة الاسترداد",
    priority: "high" as const,
  },
  { key: "oldBalance", label: "الرصيد القديم", priority: "medium" as const },
  { key: "clientName", label: "اسم العميل", priority: "medium" as const },
  { key: "companyIban", label: "Company IBAN", priority: "medium" as const },
  { key: "bankName", label: "اسم البنك", priority: "medium" as const },
  { key: "ibanImage", label: "صورة IBAN البنكي", priority: "low" as const },
];

export const MoneyReq = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [rawWithdrawalRequestsData, setRawWithdrawalRequestsData] = useState<
    any[]
  >([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch data
  const fetchDataWithState = useCallback(async () => {
    const data = await fetchAllAdminWithdrawalRequests();

    // Transform data to make IBAN image more user-friendly
    const transformedData = data.map((item: any) => ({
      ...item,
      ibanImage:
        item.ibanImage && item.ibanImage !== "-"
          ? {
              url: item.ibanImage,
              display: "عرض الصورة",
            }
          : "-",
    }));

    setRawWithdrawalRequestsData(data); // Keep original for processing
    return transformedData; // Return transformed for display
  }, []);

  useEffect(() => {
    fetchDataWithState();
  }, [fetchDataWithState]);

  // Handle approve
  const handleApprove = async (id: string | number) => {
    const requestId = String(id);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      addToast({
        type: "error",
        message: "يجب تسجيل الدخول كمسؤول",
        duration: 3000,
      });
      return;
    }

    // Find the request to check its status
    const request = rawWithdrawalRequestsData.find((r) => r.id === requestId);
    if (!request) {
      addToast({
        type: "error",
        message: "الطلب غير موجود",
        duration: 3000,
      });
      return;
    }

    // Get status from correct location and normalize to lowercase
    const currentStatus = String(request.status || "pending").toLowerCase();
    if (currentStatus !== "pending") {
      addToast({
        type: "error",
        message: `لا يمكن الموافقة على طلب ${currentStatus}`,
        duration: 3000,
      });
      return;
    }

    try {
      setProcessingId(requestId);

      await approveWalletWithdrawalRequest(requestId, {
        uid: currentUser.uid,
        email: currentUser.email!,
        name: currentUser.displayName || currentUser.email!,
      });

      addToast({
        type: "success",
        message: "تمت الموافقة على طلب السحب بنجاح وتم خصم المبلغ من الرصيد",
        duration: 4000,
      });

      // Refresh data and trigger table refresh
      await fetchDataWithState();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      console.error("Error approving withdrawal request:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في الموافقة على الطلب",
        duration: 3000,
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject
  const handleReject = async (id: string | number) => {
    const requestId = String(id);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      addToast({
        type: "error",
        message: "يجب تسجيل الدخول كمسؤول",
        duration: 3000,
      });
      return;
    }

    // Find the request
    const request = rawWithdrawalRequestsData.find((r) => r.id === requestId);
    if (!request) {
      addToast({
        type: "error",
        message: "الطلب غير موجود",
        duration: 3000,
      });
      return;
    }

    // Normalize status to lowercase for consistent comparison
    const currentStatus = String(request.status || "pending").toLowerCase();
    if (currentStatus !== "pending") {
      addToast({
        type: "error",
        message: `لا يمكن رفض طلب ${currentStatus}`,
        duration: 3000,
      });
      return;
    }

    try {
      setProcessingId(requestId);

      // Optional: Prompt for rejection reason
      const reason = prompt("سبب الرفض (اختياري):");

      await rejectWalletWithdrawalRequest(
        requestId,
        {
          uid: currentUser.uid,
          email: currentUser.email!,
          name: currentUser.displayName || currentUser.email!,
        },
        reason || undefined
      );

      addToast({
        type: "success",
        message: `تم رفض طلب السحب رقم ${request.requestNumber} بنجاح`,
        duration: 3000,
      });

      // Refresh data and trigger table refresh
      await fetchDataWithState();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      console.error("Error rejecting withdrawal request:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في رفض الطلب",
        duration: 3000,
      });
    } finally {
      setProcessingId(null);
    }
  };

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
        fetchData={fetchDataWithState}
        addNewRoute="/moneyrefundrequests"
        viewDetailsRoute={(id) => `/wallet-requests/moneyrefundrequests/${id}`}
        loadingMessage="جاري تحميل طلبات استرداد الأموال..."
        itemsPerPage={10}
        showTimeFilter={false}
        showAddButton={false}
        onApprove={handleApprove}
        onReject={handleReject}
        processingId={processingId}
        refreshTrigger={refreshTrigger}
      />
    </>
  );
};

export default MoneyReq;
