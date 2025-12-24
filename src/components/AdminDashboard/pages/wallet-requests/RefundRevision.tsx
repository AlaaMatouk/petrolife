import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Eye, X, ArrowLeft } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../../config/firebase";
import {
  approveWalletWithdrawalRequest,
  rejectWalletWithdrawalRequest,
} from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";

interface RefundRequestData {
  id: string;
  requestNumber: string;
  clientName: string;
  requestDate: string;
  status: string;
  responsible: string;
  withdrawalAmount: string | number;
  companyIban: string;
  bankName: string;
  ibanImage: string;
  oldBalance: string | number;
}

export const RefundRevision = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [refundRequestData, setRefundRequestData] = useState<RefundRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Fetch refund request data from Firestore
  useEffect(() => {
    const fetchRefundRequest = async () => {
      if (!id) {
        addToast({
          type: "error",
          message: "معرف الطلب غير موجود",
          duration: 3000,
        });
        navigate("/wallet-requests/moneyrefundrequests");
        return;
      }

      try {
        setLoading(true);
        const requestRef = doc(db, "companies-wallets-withdrawals", id);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
          addToast({
            type: "error",
            message: "الطلب غير موجود",
            duration: 3000,
          });
          navigate("/wallet-requests/moneyrefundrequests");
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

        // Handle both withdrawaAmount (typo) and withdrawalAmount field names
        const withdrawalAmount = data.withdrawalAmount || data.withdrawaAmount || "-";

        setRefundRequestData({
          id: requestSnap.id,
          requestNumber: data.refid || data.refId || requestSnap.id,
          clientName: data.requestedUser?.name || "-",
          requestDate: formatDate(dateToUse),
          status: status,
          responsible: responsible,
          withdrawalAmount: withdrawalAmount,
          companyIban: data.companyIban || "-",
          bankName: data.bankName || "-",
          ibanImage: data.ibanImageUrl || "-",
          oldBalance: data.requestedUser?.balance || "-",
        });
      } catch (error: any) {
        console.error("Error fetching refund request:", error);
        addToast({
          type: "error",
          message: "فشل في تحميل بيانات الطلب",
          duration: 3000,
        });
        navigate("/wallet-requests/moneyrefundrequests");
      } finally {
        setLoading(false);
      }
    };

    fetchRefundRequest();
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

    if (!refundRequestData) {
      addToast({
        type: "error",
        message: "بيانات الطلب غير متوفرة",
        duration: 3000,
      });
      return;
    }

    if (refundRequestData.status !== "pending") {
      addToast({
        type: "error",
        message: `لا يمكن الموافقة على طلب ${refundRequestData.status}`,
        duration: 3000,
      });
      return;
    }

    try {
      setProcessing(true);

      await approveWalletWithdrawalRequest(id, {
        uid: currentUser.uid,
        email: currentUser.email!,
        name: currentUser.displayName || currentUser.email!,
      });

      addToast({
        type: "success",
        message: "تمت الموافقة على طلب الاسترداد بنجاح وتم خصم المبلغ من الرصيد",
        duration: 4000,
      });

      // Refresh data and navigate back
      navigate("/wallet-requests/moneyrefundrequests");
    } catch (error: any) {
      console.error("Error approving refund request:", error);
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

    if (!refundRequestData) {
      addToast({
        type: "error",
        message: "بيانات الطلب غير متوفرة",
        duration: 3000,
      });
      return;
    }

    if (refundRequestData.status !== "pending") {
      addToast({
        type: "error",
        message: `لا يمكن رفض طلب ${refundRequestData.status}`,
        duration: 3000,
      });
      return;
    }

    try {
      setProcessing(true);

      await rejectWalletWithdrawalRequest(
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
        message: `تم رفض طلب الاسترداد رقم ${refundRequestData.requestNumber} بنجاح`,
        duration: 3000,
      });

      setIsRejectModalOpen(false);
      setRejectionReason("");
      navigate("/wallet-requests/moneyrefundrequests");
    } catch (error: any) {
      console.error("Error rejecting refund request:", error);
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
    navigate("/wallet-requests/moneyrefundrequests");
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

  if (!refundRequestData) {
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

      {/* Refund Request Details Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-7">
          <Eye className="w-[14px] h-[14px] text-[#5A66C1]" />
          <h1 className="text-[14px] font-medium text-[#223548]">
            مراجعة طلب الاسترداد
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
                {refundRequestData.responsible}
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
                {formatStatus(refundRequestData.status)}
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
                {refundRequestData.requestDate}
              </span>
            </div>
          </div>

          {/* Withdrawal Amount */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              قيمة الاسترداد
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {formatAmount(refundRequestData.withdrawalAmount)}
              </span>
            </div>
          </div>

          {/* Company IBAN */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              Company IBAN
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {refundRequestData.companyIban}
              </span>
            </div>
          </div>

          {/* Bank Name */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              اسم البنك
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {refundRequestData.bankName}
              </span>
            </div>
          </div>
        </div>

        {/* IBAN Image Section */}
        <h3 className="text-sm font-normal text-[#5B738B] mb-4 mt-4">
          صورة IBAN البنكي
        </h3>
        <div className="border border-dashed border-[#A9B4BE] rounded-[8px] p-4">
          <div className="flex justify-center">
            {refundRequestData.ibanImage && refundRequestData.ibanImage !== "-" ? (
              <img
                src={refundRequestData.ibanImage}
                alt="IBAN receipt"
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
            {refundRequestData.status === "pending" && (
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
            <h2 className="text-lg font-semibold mb-4">رفض طلب الاسترداد</h2>
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

export default RefundRevision;
