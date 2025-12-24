import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Building2, Wallet as WalletIcon, Banknote, Calendar, Clock, Hash, Eye, Download, FileText } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import { ServiceDistributerTransferRequest, ServiceProviderData, fetchStationsCompanyData } from "../../../../services/firestore";

interface ReceiptModalProps {
  open: boolean;
  transactionId: string;
  transfer: ServiceDistributerTransferRequest | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  open,
  transactionId,
  transfer,
  onClose,
}) => {
  const [transferData, setTransferData] = useState<ServiceDistributerTransferRequest | null>(transfer);
  const [providerData, setProviderData] = useState<ServiceProviderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadReceiptData = async () => {
      if (!open || !transactionId) return;

      try {
        setIsLoading(true);
        
        // If transfer is not provided, fetch it
        if (!transferData) {
          const transferRef = doc(db, "service-distributer-transfers", transactionId);
          const transferSnap = await getDoc(transferRef);
          if (transferSnap.exists()) {
            setTransferData({
              id: transferSnap.id,
              ...transferSnap.data(),
            } as ServiceDistributerTransferRequest);
          }
        }

        // Fetch provider data
        if (transferData || transfer) {
          const currentTransfer = transferData || transfer;
          const providers = await fetchStationsCompanyData();
          const provider = providers.find(
            p => p.email?.toLowerCase() === currentTransfer?.stationsCompanyEmail?.toLowerCase()
          );
          setProviderData(provider || null);
        }
      } catch (error) {
        console.error("Error loading receipt data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReceiptData();
  }, [open, transactionId, transfer]);

  if (!open) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (date: any): string => {
    if (!date) return "غير محدد";
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: any): string => {
    if (!date) return "غير محدد";
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const period = hours >= 12 ? "مساءً" : "صباحاً";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const currentTransfer = transferData || transfer;
  if (!currentTransfer) return null;

  const receiptNumber = currentTransfer.transferNumber?.replace('TRF-', 'TRX-') || `TRX-${transactionId.slice(0, 12)}`;
  const bankReceiptImageUrl = (currentTransfer as any).bankReceiptImageUrl;
  const receiptNotes = (currentTransfer as any).notes || "تم تحويل المبلغ بنجاح إلى الحساب البنكي الخاص بمزود الخدمة. يرجى الاحتفاظ بهذا الإيصال كإثبات للعملية، في حالة وجود أي استفسار يرجى التواصل مع خدمة العملاء.";

  const handleDownload = () => {
    if (bankReceiptImageUrl) {
      const link = document.createElement("a");
      link.href = bankReceiptImageUrl;
      link.download = `transfer_receipt_${receiptNumber}.jpg`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleView = () => {
    if (bankReceiptImageUrl) {
      window.open(bankReceiptImageUrl, "_blank");
    }
  };

  const walletNumber = providerData?.id 
    ? `SA-${providerData.id.slice(0, 4)}-${providerData.id.slice(4, 8)}-${providerData.id.slice(8, 12)}`
    : providerData?.email?.slice(0, 12) || "غير محدد";

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div
        dir="rtl"
        className="fixed top-1/2 left-1/2 z-50 w-full max-w-3xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1e3a8a] text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">إيصال تحويل مالي</h2>
              <p className="text-sm text-white/80 mt-1">رقم العملية: {receiptNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
            </div>
          ) : (
            <>
              {/* Service Provider Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">بيانات مزود الخدمة</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">اسم مزود الخدمة</p>
                      <p className="font-medium text-gray-900">{providerData?.providerName || currentTransfer.stationsCompanyEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <WalletIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">رقم المحفظة</p>
                      <p className="font-medium text-gray-900">{walletNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">المبلغ المحول</p>
                      <p className="font-medium text-gray-900">{formatNumber(currentTransfer.transferAmount)} ر.س</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل العملية</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">تاريخ التحويل</p>
                      <p className="font-medium text-gray-900">{formatDate(currentTransfer.transferredAt || currentTransfer.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">وقت التحويل</p>
                      <p className="font-medium text-gray-900">{formatTime(currentTransfer.transferredAt || currentTransfer.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Hash className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">رقم المرجع</p>
                      <p className="font-medium text-gray-900">{currentTransfer.transferNumber || receiptNumber}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ملاحظات</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{receiptNotes}</p>
                </div>
              </div>

              {/* Proof of Transfer */}
              {bankReceiptImageUrl && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">إثبات التحويل</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-700">لقطة شاشة التحويل</span>
                      <span className="text-sm text-gray-500">transfer_receipt_{receiptNumber}.jpg</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleView}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#1e3a8a]/90 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        عرض
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        تحميل
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Total Amount */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">إجمالي المبلغ :</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatNumber(currentTransfer.transferAmount)} ر.س
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

