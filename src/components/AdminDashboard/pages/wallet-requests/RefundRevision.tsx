import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, X, ArrowLeft } from "lucide-react";

interface RefundRequestData {
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
}

const mockRefundRequestData: RefundRequestData = {
  id: 1,
  requestNumber: "MR-1001",
  clientName: "شركة الأفق",
  orderType: "استرداد مباشر",
  oldBalance: "5,000 ر.س",
  addedBalance: "2,500 ر.س",
  requestDate: "2025-01-15",
  status: "قيد المراجعة",
  responsible: "أحمد محمد",
  withdrawalAmount: "2,500 ر.س",
  companyIban: "SA1234567890123456789012",
  bankName: "البنك الأهلي السعودي",
  ibanImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
};

export const RefundRevision = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // In a real app, you would fetch the refund request data based on the ID
  const refundRequestData = mockRefundRequestData;

  const handleAccept = () => {
    // Handle accept logic here
    console.log("Accepting refund request:", id);
    // Navigate back or show success message
    navigate("/wallet-requests/moneyrefundrequests");
  };

  const handleReject = () => {
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = () => {
    // Handle reject logic here with reason
    console.log("Rejecting refund request:", id, "Reason:", rejectionReason);
    // Navigate back or show success message
    setIsRejectModalOpen(false);
    setRejectionReason("");
    navigate("/wallet-requests/moneyrefundrequests");
  };

  const handleRejectCancel = () => {
    setIsRejectModalOpen(false);
    setRejectionReason("");
  };

  const handleBack = () => {
    navigate("/wallet-requests");
  };

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
                {refundRequestData.status}
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
                {refundRequestData.withdrawalAmount}
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
            <img
              src={refundRequestData.ibanImage}
              alt="IBAN receipt"
              className="max-w-full h-auto rounded-[8px] shadow-sm flex-1 object-cover"
              style={{ maxHeight: "158px" }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-5 justify-end">


          <div className="flex flex-col sm:flex-row gap-[10px] justify-between">
            <button
              onClick={handleReject}
              className="px-[10px] py-3 bg-white text-[#5B738B] border-[0.8px] border-[#5B738B] font-normal rounded-[8px] w-[120px]"
              style={{ border: "0.8px solid #5B738B" }}
            >
              تصدير الطلب
            </button>

            <button
              onClick={handleAccept}
              className="px-[10px] py-3 bg-[#5A66C1] text-white font-normal rounded-[8px] w-[120px]"
            >
              حسنا
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default RefundRevision;
