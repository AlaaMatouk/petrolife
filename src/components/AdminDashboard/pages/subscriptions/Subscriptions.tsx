import { useState, useEffect } from "react";
import { Rocket, Edit, CirclePlus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import {
  fetchSubscriptions,
  deleteSubscription,
} from "../../../../services/firestore";
import { LoadingSpinner, ToggleButton } from "../../../shared";
import { useToast } from "../../../../context/ToastContext";

const Subscriptions = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [subscriptionType, setSubscriptionType] = useState<
    "monthly" | "annual"
  >("monthly");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    subscriptionId: string | null;
    subscriptionName: string;
  }>({
    isOpen: false,
    subscriptionId: null,
    subscriptionName: "",
  });

  // Fetch subscriptions on component mount
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

  useEffect(() => {
    loadSubscriptions();
  }, []);

  // Handle delete subscription - open confirmation popup
  const handleDeleteClick = (
    subscriptionId: string,
    subscriptionName: string
  ) => {
    setDeleteConfirm({
      isOpen: true,
      subscriptionId,
      subscriptionName,
    });
  };

  // Confirm and delete subscription
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.subscriptionId) return;

    try {
      setDeletingId(deleteConfirm.subscriptionId);
      await deleteSubscription(deleteConfirm.subscriptionId);
      addToast({
        title: "نجح",
        message: "تم حذف الباقة بنجاح",
        type: "success",
      });

      // Reload subscriptions list
      await loadSubscriptions();

      // Clear selection if deleted subscription was selected
      if (selectedCardId === deleteConfirm.subscriptionId) {
        setSelectedCardId(null);
      }

      // Close confirmation popup
      setDeleteConfirm({
        isOpen: false,
        subscriptionId: null,
        subscriptionName: "",
      });
    } catch (err: any) {
      console.error("Error deleting subscription:", err);
      addToast({
        title: "خطأ",
        message: "فشل حذف الباقة: " + (err.message || "خطأ غير معروف"),
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Cancel delete
  const handleDeleteCancel = () => {
    setDeleteConfirm({
      isOpen: false,
      subscriptionId: null,
      subscriptionName: "",
    });
  };

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
        <ToggleButton
          isOn={subscriptionType === "monthly"}
          onToggle={(isOn) =>
            handleSubscriptionTypeChange(isOn ? "monthly" : "annual")
          }
          color="green"
          size="md"
        />
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

                {/* Edit and Delete Icons - Bottom Left */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin-subscriptions/${subscription.id}`);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="تعديل الباقة"
                  >
                    <Edit className="w-5 h-5 text-[#5A66C1]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const subscriptionName =
                        subscription.title?.ar ||
                        subscription.title?.en ||
                        subscription.title ||
                        "هذه الباقة";
                      handleDeleteClick(subscription.id, subscriptionName);
                    }}
                    disabled={deletingId === subscription.id}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="حذف الباقة"
                  >
                    {deletingId === subscription.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="w-5 h-5 text-red-600" />
                    )}
                  </button>
                </div>
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

      {/* Delete Confirmation Popup */}
      {deleteConfirm.isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          dir="rtl"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              تأكيد الحذف
            </h3>
            <p className="text-gray-700 mb-6">
              هل أنت متأكد من حذف الباقة{" "}
              <span className="font-semibold">
                "{deleteConfirm.subscriptionName}"
              </span>
              ؟
              <br />
              <span className="text-red-600 text-sm mt-2 block">
                هذه العملية لا يمكن التراجع عنها.
              </span>
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deletingId === deleteConfirm.subscriptionId}
                className="px-4 py-2 rounded-[10px] border-[1.5px] border-solid border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingId === deleteConfirm.subscriptionId}
                className="px-4 py-2 rounded-[10px] bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deletingId === deleteConfirm.subscriptionId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الحذف...
                  </>
                ) : (
                  "حذف"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
