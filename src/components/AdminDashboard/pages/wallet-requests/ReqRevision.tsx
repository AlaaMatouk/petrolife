import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Eye, X, ArrowLeft } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../../config/firebase";
import {
  approveWalletChargeRequest,
  rejectWalletChargeRequest,
} from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";

interface RequestData {
  id: string;
  requestNumber: string;
  clientName: string;
  requestDate: string;
  status: string;
  responsible: string;
  bankName: string;
  accountNumber: string;
  transferAmount: string | number;
  transferImage: string;
  oldBalance: string | number;
}

export const ReqRevision = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestData, setRequestData] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Fetch wallet request data from Firestore
  useEffect(() => {
    const fetchWalletRequest = async () => {
      if (!id) {
        addToast({
          type: "error",
          message: "معرف الطلب غير موجود",
          duration: 3000,
        });
        navigate("/wallet-requests");
        return;
      }

      try {
        setLoading(true);
        
        // Try companies-wallets-requests first
        let requestRef = doc(db, "companies-wallets-requests", id);
        let requestSnap = await getDoc(requestRef);

        // If not found, try wallets-requests
        if (!requestSnap.exists()) {
          requestRef = doc(db, "wallets-requests", id);
          requestSnap = await getDoc(requestRef);
        }

        if (!requestSnap.exists()) {
          addToast({
            type: "error",
            message: "الطلب غير موجود",
            duration: 3000,
          });
          navigate("/wallet-requests");
          return;
        }

        const data = requestSnap.data();

        // Format date
        const formatDate = (timestamp: any): string => {
          if (!timestamp) return "-";
          try {
            if (timestamp.toDate && typeof timestamp.toDate === "function") {
              return new Date(timestamp.toDate()).toLocaleString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
            }
            if (timestamp instanceof Date) {
              return timestamp.toLocaleString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
            }
            return new Date(timestamp).toLocaleString("ar-EG", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          } catch (error) {
            return String(timestamp);
          }
        };

        const dateToUse = data.createdDate || data.actionDate || data.requestDate;
        const status = data.status || "pending";
        const responsible =
          data.processedBy?.name || data.actionUser?.name || "-";

        // Get transfer amount (value or amount field)
        const transferAmount = data.value || data.amount || 0;

        setRequestData({
          id: requestSnap.id,
          requestNumber: data.refid || data.refId || requestSnap.id,
          clientName: data.requestedUser?.name || data.companyName || "-",
          requestDate: formatDate(dateToUse),
          status: status,
          responsible: responsible,
          bankName: data.bankName || "-",
          accountNumber: data.accountNumber || "-",
          transferAmount: transferAmount,
          transferImage: data.transferImageUrl || data.transferImage || "-",
          oldBalance: data.requestedUser?.balance || data.oldBalance || "-",
        });
      } catch (error: any) {
        console.error("Error fetching wallet request:", error);
        addToast({
          type: "error",
          message: "فشل في تحميل بيانات الطلب",
          duration: 3000,
        });
        navigate("/wallet-requests");
      } finally {
        setLoading(false);
      }
    };

    fetchWalletRequest();
  }, [id, navigate, addToast]);

  const handleAccept = async () => {
    if (!id) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      addToast({
        type: "error",
        message: "يجب تسجيل الدخول كمسؤول",
        duration: 3000,
      });
      return;
    }

    if (!requestData) {
      addToast({
        type: "error",
        message: "بيانات الطلب غير متوفرة",
        duration: 3000,
      });
      return;
    }

    if (requestData.status !== "pending") {
      addToast({
        type: "error",
        message: `لا يمكن الموافقة على طلب ${requestData.status}`,
        duration: 3000,
      });
      return;
    }

    try {
      setProcessing(true);

      await approveWalletChargeRequest(id, {
        uid: currentUser.uid,
        email: currentUser.email!,
        name: currentUser.displayName || currentUser.email!,
      });

      addToast({
        type: "success",
        message: "تمت الموافقة على الطلب بنجاح وتم تحديث الرصيد",
        duration: 4000,
      });

      // Navigate back with refresh state
      navigate("/wallet-requests", { state: { refresh: true } });
    } catch (error: any) {
      console.error("Error approving request:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في الموافقة على الطلب",
        duration: 3000,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = () => {
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!id) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      addToast({
        type: "error",
        message: "يجب تسجيل الدخول كمسؤول",
        duration: 3000,
      });
      return;
    }

    if (!requestData) {
      addToast({
        type: "error",
        message: "بيانات الطلب غير متوفرة",
        duration: 3000,
      });
      return;
    }

    if (requestData.status !== "pending") {
      addToast({
        type: "error",
        message: `لا يمكن رفض طلب ${requestData.status}`,
        duration: 3000,
      });
      return;
    }

    try {
      setProcessing(true);

      await rejectWalletChargeRequest(
        id,
        {
          uid: currentUser.uid,
          email: currentUser.email!,
          name: currentUser.displayName || currentUser.email!,
        },
        rejectionReason || undefined
      );

      addToast({
        type: "success",
        message: `تم رفض الطلب رقم ${requestData.requestNumber} بنجاح`,
        duration: 3000,
      });

      setIsRejectModalOpen(false);
      setRejectionReason("");
      
      // Navigate back with refresh state
      navigate("/wallet-requests", { state: { refresh: true } });
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في رفض الطلب",
        duration: 3000,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectCancel = () => {
    setIsRejectModalOpen(false);
    setRejectionReason("");
  };

  const handleBack = () => {
    navigate("/wallet-requests");
  };

  // Format amount for display
  const formatAmount = (amount: string | number): string => {
    if (amount === "-" || !amount) return "-";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return String(amount);
    return `${new Intl.NumberFormat("ar-SA").format(numAmount)} ر.س`;
  };

  // Format status for display
  const formatStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      pending: "قيد المراجعة",
      approved: "موافق عليه",
      rejected: "مرفوض",
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="max-w-[582px] ml-auto" dir="rtl">
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-600">جاري تحميل بيانات الطلب...</div>
        </div>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="max-w-[582px] ml-auto" dir="rtl">
        <div className="flex items-center justify-center p-8">
          <div className="text-red-600">لم يتم العثور على بيانات الطلب</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[582px] ml-auto" dir="rtl">
      {/* Back Arrow */}
      <div className="mb-4">
        <button
          onClick={handleBack}
          aria-label="رجوع"
          className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]"
        >
          <div className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </div>
        </button>
      </div>

      {/* Request Details Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-7">
          <Eye className="w-[14px] h-[14px] text-[#5A66C1]" />
          <h1 className="text-[14px] font-medium text-[#223548]">
            مراجعة الطلب
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Responsible */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              المسؤول
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {requestData.responsible}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              حالة الطلب
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {formatStatus(requestData.status)}
              </span>
            </div>
          </div>

          {/* Request Date */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              تاريخ الانشاء
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {requestData.requestDate}
              </span>
            </div>
          </div>

          {/* Transfer Amount */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              قيمة التحويل (ر.س)
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {formatAmount(requestData.transferAmount)}
              </span>
            </div>
          </div>

          {/* Bank Name */}
          <div className="space-y-2 col-span-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              اسم البنك المحول منه
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {requestData.bankName}
              </span>
            </div>
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              الحساب المحول إليه
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {requestData.accountNumber}
              </span>
            </div>
          </div>

          {/* Client Name */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              اسم العميل
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {requestData.clientName}
              </span>
            </div>
          </div>
        </div>

        {/* Transfer Image Section */}
        <h3 className="text-sm font-normal text-[#5B738B] mb-4 mt-4">
          صورة التحويل
        </h3>
        <div className="border border-dashed border-[#A9B4BE] rounded-[8px] p-4">
          <div className="flex justify-center">
            {requestData.transferImage && requestData.transferImage !== "-" ? (
              <img
                src={requestData.transferImage}
                alt="Transfer receipt"
                className="max-w-full h-auto rounded-[8px] shadow-sm flex-1 object-cover"
                style={{ maxHeight: "158px" }}
              />
            ) : (
              <div className="text-gray-400">لا توجد صورة متوفرة</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-5 justify-end">
          <div className="flex flex-col sm:flex-row gap-[10px] justify-between">
            {requestData.status === "pending" && (
              <>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="px-[10px] py-3 bg-white text-[#5B738B] border-[0.8px] border-[#5B738B] font-normal rounded-[8px] w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ border: "0.8px solid #5B738B" }}
                >
                  {processing ? "جاري المعالجة..." : "رفض"}
                </button>

                <button
                  onClick={handleAccept}
                  disabled={processing}
                  className="px-[10px] py-3 bg-[#5A66C1] text-white font-normal rounded-[8px] w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "جاري المعالجة..." : "موافقة"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#EE3939]">رفض طلب الشحن</h2>
              <button
                onClick={handleRejectCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                سبب الرفض (اختياري)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="أدخل سبب الرفض..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleRejectCancel}
                disabled={processing}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={processing}
                className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
              >
                {processing ? "جاري المعالجة..." : "رفض"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReqRevision;
