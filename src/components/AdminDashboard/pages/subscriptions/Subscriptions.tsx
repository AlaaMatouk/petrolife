import { useState, useEffect } from "react";
import { Rocket, Edit, CirclePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { fetchSubscriptions } from "../../../../services/firestore";
import { LoadingSpinner } from "../../../shared";

const Subscriptions = () => {
  const navigate = useNavigate();
  const [subscriptionType, setSubscriptionType] = useState<
    "monthly" | "annual"
  >("monthly");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscriptions on component mount
  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchSubscriptions();
        console.log("📦 Loaded subscriptions:", data);
        console.log("📦 Total subscriptions:", data.length);
        setSubscriptions(data);
      } catch (err: any) {
        console.error("Error loading subscriptions:", err);
        setError(err.message || "فشل تحميل الاشتراكات");
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptions();
  }, []);

  // Filter subscriptions by periodName (periodName.ar or periodName.en)
  const filteredSubscriptions = subscriptions.filter((sub) => {
    // Get periodName value from .ar or .en
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
      // Match: "monthly", "شهري", "شهريا"
      return (
        periodNameValue === "monthly" ||
        periodNameValue === "شهري" ||
        periodNameValue === "شهريا" ||
        periodNameValue.includes("شهري") ||
        periodNameValue.includes("monthly")
      );
    } else {
      // Match: "annual", "yearly", "سنوي", "سنوية"
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

  const periodText = subscriptionType === "monthly" ? "شهر" : "سنة";

  // Reset selection when subscription type changes
  const handleSubscriptionTypeChange = (type: "monthly" | "annual") => {
    setSubscriptionType(type);
    setSelectedCardId(null);
  };

  const getBadgeColorClass = (status: string) => {
    const statusLower = status.toLowerCase().trim();

    // موصى به → برتقالي
    if (statusLower.includes("موصى") || statusLower.includes("recommended")) {
      return "bg-orange-100 text-orange-700";
    }
    // مناسب → بنفسجي
    if (statusLower.includes("مناسب") || statusLower.includes("suitable")) {
      return "bg-purple-100 text-purple-700";
    }
    // الأنسب → أزرق
    if (statusLower.includes("أنسب") || statusLower.includes("best")) {
      return "bg-blue-100 text-blue-700";
    }
    // الأرخص → أخضر
    if (statusLower.includes("أرخص") || statusLower.includes("cheapest")) {
      return "bg-green-100 text-green-700";
    }
    // بريميوم → ذهبي/أصفر
    if (statusLower.includes("بريم") || statusLower.includes("premium")) {
      return "bg-yellow-100 text-yellow-700";
    }
    // بيسك → سماوي
    if (statusLower.includes("بيسك") || statusLower.includes("basic")) {
      return "bg-cyan-100 text-cyan-700";
    }
    // كلاسيك → نيلي
    if (statusLower.includes("كلاسيك") || statusLower.includes("classic")) {
      return "bg-indigo-100 text-indigo-700";
    }
    // افتراضي → وردي
    return "bg-pink-100 text-pink-700";
  };

  return (
    <div
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        {/* Title on right with icon */}
        <div className="flex items-center justify-end gap-1.5" dir="rtl">
          <Rocket className="w-5 h-5 text-gray-500" />
          <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
            الاشتراكات
          </h1>
        </div>
        {/* Add Button */}
        <button
          onClick={() => navigate("/admin-subscriptions/add")}
          className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
        >
          <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
            <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
              <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                إضافة باقة جديدة
              </span>
            </div>
            <CirclePlus className="w-4 h-4 text-gray-500" />
          </div>
        </button>
      </div>

      {/* Subscription Type Toggle */}
      <div className="w-full flex items-center justify-center gap-4" dir="rtl">
        <span className="text-gray-700 font-medium">الاشتراكات الشهرية</span>
        <button
          onClick={() =>
            handleSubscriptionTypeChange(
              subscriptionType === "monthly" ? "annual" : "monthly"
            )
          }
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 bg-white ${
            subscriptionType === "monthly"
              ? "border-2 border-green-500"
              : "border-2 border-gray-300"
          }`}
          role="switch"
          aria-checked={subscriptionType === "monthly"}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-green-500 shadow-sm transition-transform duration-200 ${
              subscriptionType === "monthly"
                ? "translate-x-[-18px]"
                : "translate-x-[18px]"
            }`}
          />
        </button>
        <span className="text-gray-700 font-medium">الاشتراكات السنوية</span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="w-full flex justify-center items-center py-12">
          <LoadingSpinner message="جاري تحميل الاشتراكات..." />
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
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredSubscriptions.map((subscription) => {
            // Build features array from options and maxCarNumber
            const features: string[] = [];

            // Add options array items (each option has .ar and .en)
            if (subscription.options && Array.isArray(subscription.options)) {
              subscription.options.forEach((option: any) => {
                if (option && typeof option === "object") {
                  // Get Arabic value first, fallback to English
                  const optionValue = option.ar || option.en || "";
                  if (optionValue) features.push(optionValue);
                } else if (typeof option === "string") {
                  features.push(option);
                }
              });
            }

            // Add maxCarNumber as a feature item (same display style as options with checkmark)
            if (
              subscription.description &&
              typeof subscription.description === "object"
            ) {
              const maxCar = subscription.maxCarNumber;
              const minCar = subscription.minCarNumber;
              if (maxCar || minCar) {
                if (minCar && maxCar) {
                  features.push(`عدد السيارات من ${minCar} إلى ${maxCar}`);
                } else if (maxCar) {
                  features.push(`عدد السيارات: ${maxCar}`);
                } else if (minCar) {
                  features.push(`عدد السيارات: ${minCar}`);
                }
              }
            }

            return (
              <div
                key={subscription.id}
                onClick={() => setSelectedCardId(subscription.id)}
                className={`relative flex flex-col p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  selectedCardId === subscription.id
                    ? "border-2 border-solid border-[#5A66C1]"
                    : "border border-solid border-gray-200"
                }`}
                style={
                  selectedCardId === subscription.id
                    ? { borderColor: "#5A66C1", borderWidth: "2px" }
                    : undefined
                }
              >
                {/* Badge */}
                {subscription.status && (
                  <div
                    className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getBadgeColorClass(
                      subscription.status.ar ||
                        subscription.status.en ||
                        subscription.status ||
                        ""
                    )}`}
                  >
                    {subscription.status.ar ||
                      subscription.status.en ||
                      subscription.status ||
                      ""}
                  </div>
                )}

                {/* Package Name */}
                <h2 className="text-xl font-bold text-gray-900 mt-12 mb-3">
                  {subscription.title?.ar ||
                    subscription.title?.en ||
                    subscription.title ||
                    "بدون عنوان"}
                </h2>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  {subscription.description?.ar ||
                    subscription.description?.en ||
                    subscription.description ||
                    ""}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-3xl font-bold text-[#5A66C1]">
                    {subscription.price || 0}
                  </span>
                  <span className="text-lg text-gray-600 mr-2">
                    {" "}
                    ر.س / {periodText}
                  </span>
                </div>

                {/* Features */}
                {features.length > 0 && (
                  <div className="flex flex-col gap-3 mb-6">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-[#5A66C1] flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit Icon - Bottom Left */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin-subscriptions/${subscription.id}`);
                  }}
                  className="absolute bottom-4 left-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="تعديل الباقة"
                >
                  <Edit className="w-5 h-5 text-[#5A66C1]" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredSubscriptions.length === 0 && (
        <div className="w-full flex justify-center items-center py-12">
          <p className="text-gray-500">لا توجد اشتراكات متاحة</p>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
