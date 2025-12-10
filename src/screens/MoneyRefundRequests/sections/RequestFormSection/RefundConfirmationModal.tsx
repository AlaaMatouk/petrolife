import React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, ArrowRight, Info, AlertTriangle, Lock, FileText } from "lucide-react";

interface RefundConfirmationModalProps {
  open: boolean;
  formData: {
    accountNumber: string;
    companyIban: string;
    bankName: string;
    withdrawalAmount: string;
    withdrawalType: string;
    refundReason: string;
    ibanImage: File | null;
  };
  onConfirm: () => void;
  onCancel: () => void;
}

// Helper function to format IBAN with spaces
const formatIban = (iban: string): string => {
  if (!iban) return "-";
  // Remove existing spaces and format as SA## #### #### #### #### ####
  const cleaned = iban.replace(/\s/g, "");
  if (cleaned.length < 4) return iban;
  
  const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
  return formatted;
};

export const RefundConfirmationModal: React.FC<RefundConfirmationModalProps> = ({
  open,
  formData,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const refundType = formData.withdrawalType === "all" ? "كل الأموال" : "ر.س";

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onCancel}
      />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <FileText className="w-5 h-5 text-[#1E3A8A]" />
                <CheckCircle2 className="w-2.5 h-2.5 text-[#1E3A8A] absolute -top-0.5 -right-0.5 bg-white rounded-full" />
              </div>
              <h2 className="text-lg font-bold text-[#1E3A8A]">
                تأكيد طلب الاسترداد
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="إغلاق"
            >
              <ArrowRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Confirmation Icon Section */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-[#1E3A8A]" />
            </div>
            <p className="text-xs text-gray-600 text-center">
              يرجى مراجعة تفاصيل الطلب قبل التأكيد النهائي
            </p>
          </div>

          {/* Request Details Section */}
          <div className="flex flex-col gap-3 mb-4">
            {/* Bank Name */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="text-right">
                <p className="text-xs font-medium text-gray-700 mb-0.5">
                  اسم البنك المراد التحويل إليه
                </p>
                <p className="text-sm text-gray-900">
                  {formData.bankName || "-"}
                </p>
              </div>
            </div>

            {/* IBAN */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="text-right">
                <p className="text-xs font-medium text-gray-700 mb-0.5">
                  رقم الآيبان
                </p>
                <p className="text-sm text-gray-900 font-mono">
                  {formatIban(formData.companyIban)}
                </p>
              </div>
            </div>

            {/* Refund Type */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="text-right">
                <p className="text-xs font-medium text-gray-700 mb-0.5">
                  نوع الاسترداد
                </p>
                <p className="text-sm text-gray-900">{refundType}</p>
              </div>
            </div>

            {/* Refund Reason */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="text-right w-full">
                <p className="text-xs font-medium text-gray-700 mb-0.5">
                  سبب الاسترداد
                </p>
                <p className="text-sm text-gray-900">
                  {formData.refundReason || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Alert Boxes */}
          <div className="flex flex-col gap-3 mb-4">
            {/* Blue Info Box */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-blue-700 mb-0.5">
                  رسالة تنبيه
                </p>
                <p className="text-xs text-blue-600">
                  سيتم مراجعة الطلب خلال 24 ساعة من تأكيد الطلب
                </p>
              </div>
            </div>

            {/* Yellow Warning Box */}
            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-orange-600 mb-0.5">
                  ملاحظة هامة
                </p>
                <p className="text-xs text-orange-600">
                  سيتم احتساب رسوم التحويل من المبلغ المطلوب استرداده
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              إلغاء الطلب
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1e40af] transition-colors font-medium flex items-center justify-center gap-2 text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              تأكيد الطلب
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 pt-3 border-t border-gray-200">
            <Lock className="w-3 h-3 text-gray-400" />
            <p className="text-[10px] text-gray-500 text-center">
              جميع المعاملات محمية ومؤمنة بأعلى معايير الأمان
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

