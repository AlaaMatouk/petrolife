import { DataTableSection } from "../../../sections/DataTableSection";
import { Wallet } from "lucide-react";
import {
  fetchAllAdminWalletRequests,
  addRefidToExistingWalletRequests,
  deleteWalletRequest,
  approveWalletChargeRequest,
  rejectWalletChargeRequest,
} from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";
import { useState, useCallback, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "../../../../config/firebase";
import { ConfirmDialog } from "../../../shared/ConfirmDialog/ConfirmDialog";

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
  const { addToast } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);
  const [rawWalletRequestsData, setRawWalletRequestsData] = useState<any[]>([]);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    requestId: string | null;
    requestNumber: string;
  }>({
    isOpen: false,
    requestId: null,
    requestNumber: "",
  });
  const [rejectConfirm, setRejectConfirm] = useState<{
    isOpen: boolean;
    requestId: string | null;
    requestNumber: string;
  }>({
    isOpen: false,
    requestId: null,
    requestNumber: "",
  });

  // Fetch raw data to check if migration is needed
  const fetchDataWithState = useCallback(async () => {
    const data = await fetchAllAdminWalletRequests();

    // Fetch raw Firestore data to check for refid
    try {
      const requestsRef = collection(db, "companies-wallets-requests");
      const querySnapshot = await getDocs(requestsRef);
      const rawData: any[] = [];
      querySnapshot.forEach((doc) => {
        rawData.push({ id: doc.id, ...doc.data() });
      });

      // Sort manually by date (support both old and new structures)
      rawData.sort((a, b) => {
        const dateA = a.createdDate || a.actionDate || a.requestDate;
        const dateB = b.createdDate || b.actionDate || b.requestDate;

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        // Convert Firestore Timestamps to milliseconds for comparison
        const timeA = dateA?.toMillis
          ? dateA.toMillis()
          : new Date(dateA).getTime();
        const timeB = dateB?.toMillis
          ? dateB.toMillis()
          : new Date(dateB).getTime();

        return timeB - timeA; // Most recent first
      });

      setRawWalletRequestsData(rawData);
      setNeedsMigration(rawData.some((request) => !request.refid));
    } catch (error) {
      console.error("Error fetching raw wallet requests data:", error);
    }

    return data;
  }, []);

  // Check migration status on mount
  useEffect(() => {
    fetchDataWithState();
  }, [fetchDataWithState]);

  const handleAddRefidToExisting = async () => {
    try {
      setIsMigrating(true);
      const updatedCount = await addRefidToExistingWalletRequests();

      addToast({
        type: "success",
        message: `تم إضافة refid لـ ${updatedCount} طلب محفظة`,
        duration: 3000,
      });

      // Refresh the data
      await fetchDataWithState();
    } catch (error: any) {
      console.error("Error adding refid to existing wallet requests:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في إضافة refid للطلبات الموجودة",
        duration: 3000,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Handle delete wallet request - open confirmation popup
  const handleDelete = (id: string | number) => {
    const requestId = String(id);
    // Find the request to get its details
    const request = rawWalletRequestsData.find((r) => r.id === requestId);
    const requestNumber = request?.refid || requestId;

    setDeleteConfirm({
      isOpen: true,
      requestId: requestId,
      requestNumber: requestNumber,
    });
  };

  // Confirm and delete wallet request
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.requestId) return;

    try {
      setDeletingId(deleteConfirm.requestId);

      // Delete from Firestore
      await deleteWalletRequest(deleteConfirm.requestId);

      // Show success message
      addToast({
        type: "success",
        message: `تم حذف طلب المحفظة رقم ${deleteConfirm.requestNumber} بنجاح`,
        duration: 3000,
      });

      // Close confirmation popup
      setDeleteConfirm({
        isOpen: false,
        requestId: null,
        requestNumber: "",
      });

      // Refresh the data
      await fetchDataWithState();
    } catch (error: any) {
      console.error("Error deleting wallet request:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في حذف طلب المحفظة",
        duration: 3000,
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Cancel delete
  const handleDeleteCancel = () => {
    setDeleteConfirm({
      isOpen: false,
      requestId: null,
      requestNumber: "",
    });
  };

  // Handle approve wallet request
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
    const request = rawWalletRequestsData.find((r) => r.id === requestId);
    if (!request) {
      addToast({
        type: "error",
        message: "الطلب غير موجود",
        duration: 3000,
      });
      return;
    }

    // Get status from correct location (support both old and new structures)
    const currentStatus =
      request.status || request.requestedUser?.status || "pending";
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

      await approveWalletChargeRequest(requestId, {
        uid: currentUser.uid,
        email: currentUser.email!,
        name: currentUser.displayName || currentUser.email!,
      });

      addToast({
        type: "success",
        message: "تمت الموافقة على الطلب بنجاح وتم تحديث الرصيد",
        duration: 4000,
      });

      // Refresh data
      await fetchDataWithState();
    } catch (error: any) {
      console.error("Error approving request:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في الموافقة على الطلب",
        duration: 3000,
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject wallet request - open confirmation
  const handleReject = (id: string | number) => {
    const requestId = String(id);
    const request = rawWalletRequestsData.find((r) => r.id === requestId);

    if (!request) {
      addToast({
        type: "error",
        message: "الطلب غير موجود",
        duration: 3000,
      });
      return;
    }

    if (request.status !== "pending") {
      addToast({
        type: "error",
        message: `لا يمكن رفض طلب ${request.status}`,
        duration: 3000,
      });
      return;
    }

    const requestNumber = request?.refid || requestId;

    setRejectConfirm({
      isOpen: true,
      requestId: requestId,
      requestNumber: requestNumber,
    });
  };

  // Confirm and reject wallet request
  const handleRejectConfirm = async () => {
    if (!rejectConfirm.requestId) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      addToast({
        type: "error",
        message: "يجب تسجيل الدخول كمسؤول",
        duration: 3000,
      });
      return;
    }

    try {
      setProcessingId(rejectConfirm.requestId);

      // Optional: Prompt for rejection reason
      const reason = prompt("سبب الرفض (اختياري):");

      await rejectWalletChargeRequest(
        rejectConfirm.requestId,
        {
          uid: currentUser.uid,
          email: currentUser.email!,
          name: currentUser.displayName || currentUser.email!,
        },
        reason || undefined
      );

      addToast({
        type: "success",
        message: `تم رفض الطلب رقم ${rejectConfirm.requestNumber} بنجاح`,
        duration: 3000,
      });

      // Close confirmation popup
      setRejectConfirm({
        isOpen: false,
        requestId: null,
        requestNumber: "",
      });

      // Refresh data
      await fetchDataWithState();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في رفض الطلب",
        duration: 3000,
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Cancel reject
  const handleRejectCancel = () => {
    setRejectConfirm({
      isOpen: false,
      requestId: null,
      requestNumber: "",
    });
  };

  return (
    <>
      {needsMigration && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleAddRefidToExisting}
            disabled={isMigrating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isMigrating ? "جاري المعالجة..." : "إضافة refid للطلبات الموجودة"}
          </button>
        </div>
      )}
      <DataTableSection<WalletRequest>
        title="طلبات المحافظ"
        entityName="الطلب"
        entityNamePlural="طلبات"
        icon={Wallet}
        columns={columns}
        fetchData={fetchDataWithState}
        onDelete={handleDelete}
        onApprove={handleApprove}
        onReject={handleReject}
        processingId={processingId}
        addNewRoute="/wallet-requests"
        viewDetailsRoute={(id) => `/wallet-requests/${id}`}
        loadingMessage="جاري تحميل طلبات المحافظ..."
        itemsPerPage={10}
        showTimeFilter={false}
        showMoneyRefundButton={true}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف طلب المحفظة رقم ${deleteConfirm.requestNumber}؟`}
        confirmText="حذف"
        cancelText="إلغاء"
      />

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        open={rejectConfirm.isOpen}
        onCancel={handleRejectCancel}
        onConfirm={handleRejectConfirm}
        title="تأكيد الرفض"
        message={`هل أنت متأكد من رفض طلب المحفظة رقم ${rejectConfirm.requestNumber}؟`}
        confirmText="رفض"
        cancelText="إلغاء"
      />
    </>
  );
};

export default WalletReq;
