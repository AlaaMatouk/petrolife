import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Wallet, ArrowRight, Plus } from "lucide-react";
import { useNavigation } from "../../hooks/useNavigation";
import { ROUTES } from "../../constants/routes";

export const TestInsufficientBalance = (): JSX.Element => {
  const [showModal, setShowModal] = useState(true);
  const { goTo } = useNavigation();

  // Test data
  const walletBalance = 500;
  const requiredAmount = 862.5;

  // Handle recharge wallet
  const handleRechargeWallet = () => {
    setShowModal(false);
    goTo(ROUTES.CHARGE_WALLET);
  };

  // Handle go back
  const handleGoBack = () => {
    setShowModal(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4" dir="rtl">
      <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          اختبار نافذة الرصيد غير الكافي
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          اضغط على الزر أدناه لعرض النافذة
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          عرض النافذة
        </button>
      </div>

      {/* Insufficient Balance Modal */}
      {showModal && createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleGoBack}
          />
          
          {/* Modal */}
          <div
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 lg:p-8">
              {/* Red Warning Header */}
              <div className="flex flex-col items-center gap-4 mb-6">
                {/* Warning Icon */}
                <div className="w-16 h-16 rounded-full bg-white border-4 border-red-500 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                
                {/* Warning Title */}
                <h2 className="text-2xl font-bold text-red-500">
                  تنبيه
                </h2>
                
                {/* Warning Message */}
                <p className="text-sm text-red-500 text-center">
                  العملية إتمام يمكن لا عذرا.
                </p>
              </div>

              {/* Main Content - Insufficient Balance Message */}
              <div className="flex flex-col gap-3 mb-6">
                <h3 className="text-xl font-bold text-gray-900 text-center">
                  رصيدك غير كافي
                </h3>
                <p className="text-sm text-gray-700 text-center">
                  الرصيد غير كافي لإجراء هذه العملية
                </p>
                <p className="text-sm text-gray-700 text-center">
                  الرجاء شحن المحفظة وإعادة المحاولة مجدداً
                </p>
              </div>

              {/* Balance Details Section */}
              <div className="flex flex-col gap-4 p-4 bg-pink-50 rounded-lg border border-pink-200 mb-6">
                <h4 className="text-sm font-bold text-red-500 mb-2">
                  تفاصيل الرصيد
                </h4>
                
                {/* Current Balance */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-gray-700">الرصيد الحالي</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">
                    {walletBalance.toFixed(2)} ر.س
                  </span>
                </div>

                {/* Required Amount */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-gray-700">المبلغ المطلوب</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">
                    {requiredAmount.toFixed(2)} ر.س
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {/* Recharge Wallet Button */}
                <button
                  onClick={handleRechargeWallet}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  <span>شحن المحفظة الآن</span>
                </button>

                {/* Go Back Button */}
                <button
                  onClick={handleGoBack}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>العودة للخلف</span>
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

