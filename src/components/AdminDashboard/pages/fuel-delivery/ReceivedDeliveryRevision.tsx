import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Eye, X } from "lucide-react";
import {
  fetchOrderById,
  updateOrderStatus,
} from "../../../../services/firestore";
import { LoadingSpinner } from "../../../shared";
import { useToast } from "../../../../context/ToastContext";

interface ReceivedDeliveryRequestData {
  id: string;
  recipientName: string;
  recipientPhone: string;
  fuelType: string;
  licenseNumber: string;
  siteType: string;
  orderDate: string;
  quantityRequired: string;
  expectedMonthlyQuantity: string;
  deliveryAddress: string;
  status: string;
  transferImage: string;
}

// Helper function to format Firestore timestamp
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

// Helper function to extract fuel type from selectedOption
const extractFuelType = (order: any): string => {
  if (order.selectedOption?.title?.ar) {
    return order.selectedOption.title.ar;
  } else if (order.selectedOption?.title?.en) {
    return order.selectedOption.title.en;
  } else if (order.selectedOption?.name?.ar) {
    return order.selectedOption.name.ar;
  } else if (order.selectedOption?.name?.en) {
    return order.selectedOption.name.en;
  }
  return "-";
};

export const ReceivedDeliveryRevision = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [deliveryRequestData, setDeliveryRequestData] =
    useState<ReceivedDeliveryRequestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!id) {
        setError("No order ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const orderData = await fetchOrderById(id);

        // Map order data to display format
        const mappedData: ReceivedDeliveryRequestData = {
          id: orderData.id,
          recipientName: orderData.client?.name || "-",
          recipientPhone: orderData.client?.phoneNumber || "-",
          fuelType: extractFuelType(orderData),
          licenseNumber: "-",
          siteType: "-",
          orderDate: formatDate(orderData.orderDate),
          quantityRequired: orderData.totalLitre?.toString() || "0",
          expectedMonthlyQuantity: "-",
          deliveryAddress:
            orderData.location?.address || orderData.address || "-",
          status: orderData.status || "-",
          transferImage: "-",
        };

        setDeliveryRequestData(mappedData);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("فشل في تحميل بيانات الطلب");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderData();
  }, [id]);

  const handleAccept = async () => {
    if (!id) {
      addToast({
        type: "error",
        message: "لا يوجد معرف للطلب",
        duration: 3000,
      });
      return;
    }

    setIsProcessing(true);
    try {
      await updateOrderStatus(id, "done");
      addToast({
        type: "success",
        message: "تم قبول الطلب بنجاح",
        duration: 3000,
      });
      navigate("/fuel-delivery-requests/received-delivery-requests");
    } catch (error) {
      console.error("Error accepting order:", error);
      addToast({
        type: "error",
        message: "فشل في قبول الطلب",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!id) {
      addToast({
        type: "error",
        message: "لا يوجد معرف للطلب",
        duration: 3000,
      });
      return;
    }

    setIsProcessing(true);
    try {
      await updateOrderStatus(id, "cancelled");
      addToast({
        type: "success",
        message: "تم رفض الطلب بنجاح",
        duration: 3000,
      });
      setIsRejectModalOpen(false);
      setRejectionReason("");
      navigate("/fuel-delivery-requests/received-delivery-requests");
    } catch (error) {
      console.error("Error rejecting order:", error);
      addToast({
        type: "error",
        message: "فشل في رفض الطلب",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectCancel = () => {
    setIsRejectModalOpen(false);
    setRejectionReason("");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-[582px] ml-auto" dir="rtl">
        <LoadingSpinner message="جاري تحميل بيانات الطلب..." />
      </div>
    );
  }

  // Show error state
  if (error || !deliveryRequestData) {
    return (
      <div className="max-w-[582px] ml-auto" dir="rtl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="text-center py-8">
            <p className="text-red-600">{error || "لم يتم العثور على الطلب"}</p>
            <button
              onClick={() =>
                navigate("/fuel-delivery-requests/received-delivery-requests")
              }
              className="mt-4 px-4 py-2 bg-[#5A66C1] text-white rounded-md"
            >
              العودة إلى القائمة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[582px] ml-auto" dir="rtl">
      {/* Delivery Request Details Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-7">
          <Eye className="w-[14px] h-[14px] text-[#5A66C1]" />
          <h1 className="text-[14px] font-medium text-[#223548]">
            معاينة طلب التوصيل
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recipient Name */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              اسم المستلم
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {deliveryRequestData.recipientName}
              </span>
            </div>
          </div>

          {/* Recipient Phone */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              رقم هاتف المستلم
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {deliveryRequestData.recipientPhone}
              </span>
            </div>
          </div>

          {/* Fuel Type */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              نوع الوقود
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {deliveryRequestData.fuelType}
              </span>
            </div>
          </div>

          {/* Site Type */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              نوع الموقع
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {deliveryRequestData.siteType}
              </span>
            </div>
          </div>

          {/* License Number */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              رقم الترخيص
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {deliveryRequestData.licenseNumber}
              </span>
            </div>
          </div>

          {/* Order Date */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              تاريخ الطلب
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {deliveryRequestData.orderDate}
              </span>
            </div>
          </div>

          {/* Quantity Required */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              الكمية المطلوبة باللتر
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {deliveryRequestData.quantityRequired}
              </span>
            </div>
          </div>

          {/* Expected Monthly Quantity */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-[#A9B4BE]">
              الكمية المتوقعة شهريا باللتر
            </label>
            <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
              <span className="text-[#5B738B] font-normal text-sm">
                {deliveryRequestData.expectedMonthlyQuantity}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Address Section */}
        <div className="mt-6">
          <label className="block text-xs font-normal text-[#A9B4BE] mb-2">
            عنوان التوصيل
          </label>
          <div className="p-3 bg-[#F5F6F766] rounded-md border border-gray-200">
            <span className="text-[#5B738B] font-normal text-sm">
              {deliveryRequestData.deliveryAddress}
            </span>
          </div>
        </div>

        {/* Transfer Image Section */}
        <h3 className="text-sm font-normal text-[#5B738B] mb-4 mt-4">
          ترخيص الموقع
        </h3>
        <div className="border border-dashed border-[#A9B4BE] rounded-[8px] p-4">
          <div className="flex justify-center">
            <img
              src={deliveryRequestData.transferImage}
              alt="Transfer receipt"
              className="max-w-full h-auto rounded-[8px] shadow-sm flex-1 object-cover"
              style={{ maxHeight: "158px" }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-5 justify-between">
          <button
            onClick={() =>
              navigate("/fuel-delivery-requests/received-delivery-requests")
            }
            className="px-[10px] py-3 bg-white text-[#5B738B] border-[0.8px] border-[#5B738B] font-normal rounded-[8px] w-[104px]"
            style={{ border: "0.8px solid #5B738B" }}
            disabled={isProcessing}
          >
            رجوع
          </button>
          <div className="flex flex-col sm:flex-row gap-[10px] justify-between">
            <button
              onClick={handleReject}
              className="px-[10px] py-3 bg-[#EE3939] text-white font-normal rounded-[8px] w-[104px] disabled:opacity-50"
              disabled={isProcessing}
            >
              {isProcessing ? "جاري المعالجة..." : "رفض الطلب"}
            </button>
            <button
              onClick={handleAccept}
              className="px-[10px] py-3 bg-[#5A66C1] text-white font-normal rounded-[8px] w-[104px] disabled:opacity-50"
              disabled={isProcessing}
            >
              {isProcessing ? "جاري المعالجة..." : "قبول الطلب"}
            </button>
          </div>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {isRejectModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100000000]"
          dir="rtl"
        >
          <div className="bg-white rounded-lg shadow-lg p-6 w-[400px] max-w-[90vw]">
            {/* Modal Header */}
            <div className="flex items-center gap-2 mb-6">
              <button onClick={handleRejectCancel}>
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
                className="px-4 py-2 flex-1 bg-[#EE3939] text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                disabled={!rejectionReason.trim() || isProcessing}
              >
                {isProcessing ? "جاري المعالجة..." : "ارسال"}
              </button>
              <button
                onClick={handleRejectCancel}
                className="px-4 py-2 bg-white flex-1 text-[#5B738B] border border-[#5B738B] rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                style={{ border: "0.8px solid #5B738B" }}
                disabled={isProcessing}
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

export default ReceivedDeliveryRevision;
