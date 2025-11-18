import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, X, ArrowLeft } from "lucide-react";

interface RequestData {
  id: number;
  bankName: string;
  accountNumber: string;
  transferAmount: string;
  transferImage: string;
}

const mockRequestData: RequestData = {
  id: 1,
  bankName: "بنك الإتحاد الدولي",
  accountNumber: "21453658725632548236",
  transferAmount: "500",
  transferImage:
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
};

export const ReqRevision = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // In a real app, you would fetch the request data based on the ID
  const requestData = mockRequestData;

  const handleAccept = () => {
    // Handle accept logic here
    console.log("Accepting request:", id);
    // Navigate back or show success message
    navigate("/wallet-requests");
  };

  const handleReject = () => {
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = () => {
    // Handle reject logic here with reason
    console.log("Rejecting request:", id, "Reason:", rejectionReason);
    // Navigate back or show success message
    setIsRejectModalOpen(false);
    setRejectionReason("");
    navigate("/wallet-requests");
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
          onClick={() => navigate("/wallet-requests")}
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
            <div className="p-3 bg-[#F5F6F766]rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {" "}
                {requestData.accountNumber}
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
                {" "}
                {requestData.transferAmount}
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
            <img
              src={requestData.transferImage}
              alt="Transfer receipt"
              className="max-w-full h-auto rounded-[8px] shadow-sm flex-1 object-cover"
              style={{ maxHeight: "158px" }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-5 justify-between">
          <button
            onClick={handleBack}
            className="px-[10px] py-3 bg-white text-[##5B738B] border-[0.8px] border-[##5B738B] font-normal rounded-[8px] w-[120px] "
            style={{ border: "0.8px solid #5B738B" }}
          >
            رجوع
          </button>

          <div className="flex flex-col sm:flex-row gap-[10px] justify-between">
            <button
              onClick={handleReject}
              className="px-[10px] py-3 bg-white text-[#EE3939] border-[0.8px] border-[#EE3939] font-normal rounded-[8px] w-[120px] "
              style={{ border: "0.8px solid #EE3939" }}
            >
              رفض الطلب
            </button>

            <button
              onClick={handleAccept}
              className="px-[10px] py-3 bg-[#5A66C1] text-white font-normal rounded-[8px] w-[120px] "
            >
              قبول الطلب
            </button>
          </div>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {isRejectModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          dir="rtl"
        >
          <div className="bg-white rounded-lg shadow-lg p-6 w-[400px] max-w-[90vw]">
            {/* Modal Header */}
            <div className="flex items-center gap-2 mb-6">
              <button>
                <X className="w-5 h-5 mt-1 bg-white border border-[#EE3939] rounded-full text-[#EE3939] p-1" />
              </button>
              <h2 className="text-lg font-medium text-[#EE3939]">سبب الرفض</h2>
            </div>

            {/* Modal Content */}
            <div className="mb-6">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="أدخل سبب الرفض هنا"
                className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-[#EE3939] focus:border-transparent"
                dir="rtl"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 flex-1 bg-[#EE3939] text-white rounded-md hover:bg-red-600 transition-colors"
                disabled={!rejectionReason.trim()}
              >
                ارسال
              </button>
              <button
                onClick={handleRejectCancel}
                className="px-4 py-2 bg-white flex-1 text-[#5B738B] border border-[#5B738B] rounded-md hover:bg-gray-50 transition-colors"
                style={{ border: "0.8px solid #5B738B" }}
              >
                رجوع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReqRevision;
