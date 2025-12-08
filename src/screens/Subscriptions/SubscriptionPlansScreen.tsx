import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Car, Check, FileText, Tag, Receipt, Percent, Wallet, ArrowRight } from "lucide-react";
import { fetchSubscriptions } from "../../services/firestore";
import { LoadingSpinner } from "../../components/shared";

export const SubscriptionPlansScreen = (): JSX.Element => {
  const [subscriptionType, setSubscriptionType] = useState<"annual" | "monthly">("annual");
  const [vehicleCount, setVehicleCount] = useState<number>(150);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Fetch subscriptions on mount
  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchSubscriptions();
        setSubscriptions(data);
      } catch (err) {
        console.error("Error loading subscriptions:", err);
        setError("فشل تحميل الباقات");
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptions();
  }, []);

  // Filter subscriptions by type (annual/monthly)
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      let periodNameValue = "";

      if (sub.periodName) {
        if (typeof sub.periodName === "object") {
          periodNameValue = (sub.periodName.ar || sub.periodName.en || "")
            .toLowerCase()
            .trim();
        } else {
          periodNameValue = String(sub.periodName).toLowerCase().trim();
        }
      }

      if (subscriptionType === "monthly") {
        return (
          periodNameValue === "monthly" ||
          periodNameValue === "شهري" ||
          periodNameValue === "شهريا" ||
          periodNameValue.includes("شهري") ||
          periodNameValue.includes("monthly")
        );
      } else {
        return (
          periodNameValue === "annual" ||
          periodNameValue === "yearly" ||
          periodNameValue === "سنوي" ||
          periodNameValue === "سنوية" ||
          periodNameValue.includes("سنوي") ||
          periodNameValue.includes("annual") ||
          periodNameValue.includes("yearly")
        );
      }
    });
  }, [subscriptions, subscriptionType]);

  // Reset selection when subscription type changes
  useEffect(() => {
    setSelectedPlanId(null);
  }, [subscriptionType]);

  // Build features array from subscription data
  const getFeatures = (subscription: any): string[] => {
    const features: string[] = [];

    // Add options array items
    if (subscription.options && Array.isArray(subscription.options)) {
      subscription.options.forEach((option: any) => {
        if (option && typeof option === "object") {
          const optionValue = option.ar || option.en || "";
          if (optionValue) features.push(optionValue);
        } else if (typeof option === "string") {
          features.push(option);
        }
      });
    }

    // Add automatic vehicle detection
    if (subscription.autoDetectVehicles !== false) {
      features.push("اكتشاف تلقائي لعدد المركبات");
    }

    // Add vehicle count range
    const maxCar = subscription.maxCarNumber;
    const minCar = subscription.minCarNumber || 1;
    if (maxCar || minCar) {
      if (minCar && maxCar) {
        features.push(`عدد السيارات من ${minCar} إلى ${maxCar}`);
      } else if (maxCar) {
        features.push(`عدد السيارات: ${maxCar}`);
      }
    }

    return features;
  };

  // Get selected subscription details
  const selectedSubscription = useMemo(() => {
    return subscriptions.find((sub) => sub.id === selectedPlanId);
  }, [subscriptions, selectedPlanId]);

  // Calculate subscription summary
  const subscriptionSummary = useMemo(() => {
    if (!selectedSubscription) {
      return {
        vehicleCount: vehicleCount,
        subscriptionPrice: 0,
        totalWithoutVAT: 0,
        vat: 0,
        totalWithVAT: 0,
      };
    }

    const subscriptionPrice = selectedSubscription.price || 0;
    const vatRate = 0.15; // 15% VAT
    const vat = subscriptionPrice * vatRate;
    const totalWithVAT = subscriptionPrice + vat;

    return {
      vehicleCount: vehicleCount,
      subscriptionPrice: subscriptionPrice,
      totalWithoutVAT: subscriptionPrice,
      vat: vat,
      totalWithVAT: totalWithVAT,
    };
  }, [selectedSubscription, vehicleCount]);

  // Handle Next button click
  const handleNext = () => {
    if (selectedPlanId) {
      setShowSummaryModal(true);
    }
  };

  // Handle confirm subscription
  const handleConfirmSubscription = () => {
    // TODO: Implement subscription confirmation logic
    console.log("Confirming subscription:", {
      planId: selectedPlanId,
      vehicleCount: vehicleCount,
      summary: subscriptionSummary,
    });
    setShowSummaryModal(false);
    // Navigate or show success message
  };

  // Handle go back
  const handleGoBack = () => {
    setShowSummaryModal(false);
  };

  const getBadgeColorClass = (status: string) => {
    const statusLower = status.toLowerCase().trim();
    if (statusLower.includes("أنسب") || statusLower.includes("best")) {
      return "bg-pink-100 text-pink-600";
    }
    return "bg-pink-100 text-pink-600";
  };

  return (
    <div className="flex flex-col w-full items-start gap-6" dir="rtl">
      {/* Header Section with Title */}
      <div className="w-full flex flex-col gap-2 items-center">
        <h1 className="text-4xl font-bold text-[#5A66C1]">الباقات</h1>
        <p className="text-base text-gray-600">قم بإدارة وتجديد اشتراكاتك بكل سهولة</p>
      </div>

      {/* Vehicle Count Input and Subscription Type Toggle Section - Framed */}
      <div className="w-full bg-white rounded-xl shadow-sm border-2 border-gray-300 p-6 lg:p-8 mb-8">
        <div className="w-full flex items-start justify-between gap-8">
          {/* Vehicle Count Input - Left Side */}
          <div className="flex flex-col gap-3 flex-1">
            <label className="text-sm font-medium text-gray-700">أدخل عدد المركبات</label>
            <div className="relative w-full">
              <Car className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="number"
                value={vehicleCount}
                onChange={(e) => setVehicleCount(parseInt(e.target.value) || 0)}
                min="1"
                className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A66C1] focus:border-transparent text-gray-700"
                placeholder="150"
              />
            </div>
          </div>

          {/* Subscription Type Toggle - Right Side */}
          <div className="flex flex-col gap-3 flex-1">
            <label className="text-sm font-medium text-gray-700">نوع الاشتراك</label>
            <div className="flex items-center gap-0 bg-gray-100 rounded-lg p-1 w-full">
              <button
                type="button"
                onClick={() => setSubscriptionType("monthly")}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex-1 ${
                  subscriptionType === "monthly"
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-transparent text-gray-700 hover:bg-gray-200"
                }`}
              >
                الاشتراكات الشهرية
              </button>
              <button
                type="button"
                onClick={() => setSubscriptionType("annual")}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex-1 ${
                  subscriptionType === "annual"
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-transparent text-gray-700 hover:bg-gray-200"
                }`}
              >
                الاشتراكات السنوية
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card for Plans */}
      <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">

        {/* Loading State */}
        {isLoading && (
          <div className="w-full flex justify-center items-center py-12">
            <LoadingSpinner message="جاري تحميل الباقات..." />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="w-full flex justify-center items-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Subscription Plans Cards */}
        {!isLoading && !error && (
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {filteredSubscriptions.map((subscription) => {
              const features = getFeatures(subscription);
              const isSelected = selectedPlanId === subscription.id;
              // Handle status - could be object or string, ensure it's always a string
              let statusString = "";
              if (subscription.status) {
                if (typeof subscription.status === "object" && subscription.status !== null) {
                  statusString = String(subscription.status.ar || subscription.status.en || "");
                } else {
                  statusString = String(subscription.status || "");
                }
              }
              // Check if recommended - ensure statusString is a valid string before using includes
              const isRecommended = statusString 
                ? (statusString.includes("أنسب") || statusString.toLowerCase().includes("most suitable") || statusString.toLowerCase().includes("best"))
                : false;

              return (
                <div
                  key={subscription.id}
                  onClick={() => setSelectedPlanId(subscription.id)}
                  className={`relative flex flex-col p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer ${
                    isSelected
                      ? "border-2 border-[#5A66C1]"
                      : "border border-gray-200"
                  }`}
                >
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-medium z-10">
                      الأنسب
                    </div>
                  )}

                  {/* Package Name */}
                  <h2 className="text-xl font-bold text-gray-900 mt-2 mb-3">
                    {subscription.title?.ar || subscription.title?.en || subscription.title || "بدون عنوان"}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    {subscription.description?.ar || subscription.description?.en || subscription.description || ""}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-[#5A66C1]">
                      {subscription.price || 0}
                    </span>
                    <span className="text-lg text-gray-600 mr-2"> ر.س / شهر</span>
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <div className="flex flex-col gap-3 mb-6">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-gray-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Package Indicator */}
                  {isSelected && (
                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-200">
                      <div className="w-5 h-5 bg-[#5A66C1] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-[#5A66C1]">الباقة المختارة</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredSubscriptions.length === 0 && (
          <div className="w-full flex justify-center items-center py-12">
            <p className="text-gray-500">لا توجد باقات متاحة</p>
          </div>
        )}

        {/* Auto-renewal Message and Next Button */}
        {!isLoading && !error && filteredSubscriptions.length > 0 && (
          <div className="w-full flex flex-col items-center gap-6 mt-8">
            <p className="text-sm text-gray-600">سيتم تجديد الإشتراك بالباقه تلقائياً</p>
            <button
              onClick={handleNext}
              disabled={!selectedPlanId}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-all ${
                selectedPlanId
                  ? "bg-[#5A66C1] hover:bg-[#4f5ab0] shadow-md"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              التالي
            </button>
          </div>
        )}
      </div>

      {/* Subscription Summary Modal */}
      {showSummaryModal && createPortal(
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
              {/* Header Section */}
              <div className="flex flex-col items-center gap-4 mb-8">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-[#5A66C1]" />
                </div>
                
                {/* Title */}
                <h2 className="text-2xl font-bold text-[#5A66C1]">
                  ملخص الإشتراك
                </h2>
                
                {/* Subtitle */}
                <p className="text-sm text-gray-600 text-center">
                  مراجعة تفاصيل اشتراكك قبل التأكيد
                </p>
              </div>

              {/* Information Display Section */}
              <div className="flex flex-col gap-4 mb-6">
                {/* Number of Vehicles */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700">عدد المركبات</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {subscriptionSummary.vehicleCount}
                  </span>
                </div>

                {/* Subscription Price */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700">سعر الإشتراك</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {subscriptionSummary.subscriptionPrice.toFixed(2)} ر.س
                  </span>
                </div>

                {/* Total without VAT */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700">الإجمالي بدون ضريبة القيمة المضافة</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {subscriptionSummary.totalWithoutVAT.toFixed(2)} ر.س
                  </span>
                </div>

                {/* VAT (15%) */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700">الضريبة ( 15 %)</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {subscriptionSummary.vat.toFixed(2)} ر.س
                  </span>
                </div>

                {/* Total including VAT - Highlighted */}
                <div className="flex items-center justify-between py-4 px-4 bg-white rounded-lg border-2 border-solid border-gray-500">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-gray-700" />
                    <span className="text-sm font-medium text-gray-700">إجمالي شامل الضريبة</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    {subscriptionSummary.totalWithVAT.toFixed(2)} ر.س
                  </span>
                </div>
              </div>

              {/* Wallet Deduction Message */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg mb-6 shadow-[0_0_20px_rgba(90,102,193,0.3)]">
                <Wallet className="w-5 h-5 text-[#5A66C1] flex-shrink-0" />
                <p className="text-sm font-medium text-[#5A66C1]">
                  سيتم خصم مبلغ الإشتراك من رصيد المحفظة
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4">
                {/* Go Back Button */}
                <button
                  onClick={handleGoBack}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>العودة للخلف</span>
                </button>

                {/* Confirm Subscription Button */}
                <button
                  onClick={handleConfirmSubscription}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1e3a8a] text-white rounded-lg font-medium hover:bg-[#1e40af] transition-colors shadow-md"
                >
                  <Check className="w-5 h-5" />
                  <span>تأكيد الإشتراك</span>
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

