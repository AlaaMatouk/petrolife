import { useState } from "react";
import { Rocket, Edit, CirclePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

// Mock data for subscription plans
const mockMonthlyPlans = [
  {
    id: 1,
    name: "بترولايف بيسيك",
    description: "أنسب للشركات المتوسطة التي تحتاج تقارير وتنبيهات تساعدها في مراقبة وتقليل مصاريف الوقود.",
    price: 5,
    badge: "موصى به",
    badgeColor: "orange",
    features: [
      "عدد السيارات من 3 إلى 499",
      "QR Code",
      "اكتشاف تلقائي لعدد المركبات",
    ],
  },
  {
    id: 2,
    name: "بترولايف كلاسيك",
    description: "مصممة للشركات الكبيرة التي تريد نظام شامل يتحكم بكل تفاصيل عمليات الوقود بذكاء وسهولة.",
    price: 4,
    badge: "الأنسب",
    badgeColor: "purple",
    features: [
      "عدد السيارات من 500 إلى 10000",
      "QR Code",
      "اكتشاف تلقائي لعدد المركبات",
    ],
  },
  {
    id: 3,
    name: "بترولايف بريميوم",
    description: "مصممة للشركات الصغيرة اللي تبغي تتابع تعبئة الوقود وتنظمها بشكل بسيط وفعال.",
    price: 6,
    badge: "الأرخص",
    badgeColor: "green",
    features: [
      "عدد السيارات من 1 إلى 2",
      "بدون شريحة.",
      "اكتشاف تلقائي لعدد المركبات",
    ],
  },
];

const mockAnnualPlans = mockMonthlyPlans.map((plan) => ({
  ...plan,
  price: Math.round(plan.price * 12 * 0.9), // 10% discount for annual
}));

const Subscriptions = () => {
  const navigate = useNavigate();
  const [subscriptionType, setSubscriptionType] = useState<"monthly" | "annual">("monthly");
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  const currentPlans = subscriptionType === "monthly" ? mockMonthlyPlans : mockAnnualPlans;
  const periodText = subscriptionType === "monthly" ? "شهر" : "سنة";

  // Reset selection when subscription type changes
  const handleSubscriptionTypeChange = (type: "monthly" | "annual") => {
    setSubscriptionType(type);
    setSelectedCardId(null);
  };

  const getBadgeColorClass = (color: string) => {
    switch (color) {
      case "orange":
        return "bg-orange-100 text-orange-700";
      case "purple":
        return "bg-purple-100 text-purple-700";
      case "green":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
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
          onClick={() => handleSubscriptionTypeChange(subscriptionType === "monthly" ? "annual" : "monthly")}
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
              subscriptionType === "monthly" ? "translate-x-[-18px]" : "translate-x-[18px]"
            }`}
          />
        </button>
        <span className="text-gray-700 font-medium">الاشتراكات السنوية</span>
      </div>

      {/* Subscription Plans Cards */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {currentPlans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedCardId(plan.id)}
            className={`relative flex flex-col p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer ${
              selectedCardId === plan.id
                ? "border-2 border-solid border-[#5A66C1]"
                : "border border-solid border-gray-200"
            }`}
            style={
              selectedCardId === plan.id
                ? { borderColor: "#5A66C1", borderWidth: "2px" }
                : undefined
            }
          >
            {/* Badge */}
            {plan.badge && (
              <div
                className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getBadgeColorClass(
                  plan.badgeColor
                )}`}
              >
                {plan.badge}
              </div>
            )}

            {/* Package Name */}
            <h2 className="text-xl font-bold text-gray-900 mt-12 mb-3">{plan.name}</h2>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{plan.description}</p>

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-[#5A66C1]">{plan.price}</span>
              <span className="text-lg text-gray-600 mr-2"> ر.س / {periodText}</span>
            </div>

            {/* Features */}
            <div className="flex flex-col gap-3 mb-6">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#5A66C1] flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Edit Icon - Bottom Left */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin-subscriptions/${plan.id}`);
              }}
              className="absolute bottom-4 left-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="تعديل الباقة"
            >
              <Edit className="w-5 h-5 text-[#5A66C1]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscriptions;

