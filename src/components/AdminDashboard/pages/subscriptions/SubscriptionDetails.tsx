import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { ArrowLeft, Edit, Plus, Trash2 } from "lucide-react";
import { fetchSubscriptionById, updateSubscription } from "../../../../services/firestore";
import { LoadingSpinner } from "../../../shared";
import { useToast } from "../../../../context/ToastContext";

const SubscriptionDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    badge: "",
    features: [] as string[],
    minCarNumber: "",
    maxCarNumber: "",
  });

  // Fetch subscription data based on id
  useEffect(() => {
    const loadSubscription = async () => {
      if (!id) {
        setError("معرف الاشتراك غير موجود");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchSubscriptionById(id);
        
        if (!data) {
          setError("الاشتراك غير موجود");
          setIsLoading(false);
          return;
        }

        setSubscription(data);

        // Build features array from options
        const features: string[] = [];
        if (data.options && Array.isArray(data.options)) {
          data.options.forEach((option: any) => {
            if (option && typeof option === "object") {
              const optionValue = option.ar || option.en || "";
              if (optionValue) features.push(optionValue);
            } else if (typeof option === "string") {
              features.push(option);
            }
          });
        }

        // Update form data with real subscription data
        setFormData({
          name: data.title?.ar || data.title?.en || data.title || "",
          description: data.description?.ar || data.description?.en || data.description || "",
          price: data.price?.toString() || "",
          badge: data.status?.ar || data.status?.en || data.status || "",
          features: features,
          minCarNumber: data.description?.minCarNumber?.toString() || "",
          maxCarNumber: data.description?.maxCarNumber?.toString() || "",
        });
      } catch (err: any) {
        console.error("Error loading subscription:", err);
        setError(err.message || "فشل تحميل بيانات الاشتراك");
        addToast("فشل تحميل بيانات الاشتراك", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscription();
  }, [id, addToast]);

  const handleAddFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, ""],
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((feature, i) => (i === index ? value : feature)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditMode || !id) return;

    try {
      setIsSaving(true);

      // Prepare update data - maintain the structure with .ar fields
      const updateData: any = {
        title: { ar: formData.name },
        description: {
          ar: formData.description,
        },
        status: { ar: formData.badge },
        price: parseFloat(formData.price) || 0,
        options: formData.features
          .filter((f) => f.trim() !== "")
          .map((feature) => ({ ar: feature, en: feature })),
      };

      // Add minCarNumber and maxCarNumber only if they have values
      if (formData.minCarNumber && formData.minCarNumber.trim() !== "") {
        updateData.description.minCarNumber = parseInt(formData.minCarNumber);
      }
      if (formData.maxCarNumber && formData.maxCarNumber.trim() !== "") {
        updateData.description.maxCarNumber = parseInt(formData.maxCarNumber);
      }

      // Preserve existing .en values if they exist
      if (subscription?.title?.en) {
        updateData.title.en = subscription.title.en;
      }
      if (subscription?.description?.en) {
        updateData.description.en = subscription.description.en;
      }
      if (subscription?.status?.en) {
        updateData.status.en = subscription.status.en;
      }

      await updateSubscription(id, updateData);
      
      addToast("تم تحديث الباقة بنجاح", "success");
      
      // Navigate back to admin-subscriptions screen
      navigate("/admin-subscriptions");
    } catch (err: any) {
      console.error("Error updating subscription:", err);
      addToast("فشل تحديث الباقة: " + (err.message || "خطأ غير معروف"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const badgeOptions = [
    { value: "", label: "بدون شارة" },
    { value: "موصى به", label: "موصى به" },
    { value: "الأنسب", label: "الأنسب" },
    { value: "الأرخص", label: "الأرخص" },
    { value: "مناسب", label: "مناسب" },
  ];

  // Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col w-full items-center justify-center py-20" dir="rtl">
        <LoadingSpinner message="جاري تحميل بيانات الاشتراك..." />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col w-full items-center justify-center py-20" dir="rtl">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-[10px] border-[1.5px] border-solid border-[#5A66C1] text-[#5A66C1] bg-white hover:bg-blue-50 font-medium transition-colors"
        >
          رجوع
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full items-start gap-5" dir="rtl">
      {/* Form Card */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center justify-end gap-1.5" dir="rtl">
            <Edit className="w-5 h-5 text-gray-500" />
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              تعديل الباقة
            </h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            aria-label="رجوع"
            className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)]"
          >
            <div className="flex w-10 h-10 items-center justify-center bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          {/* Package Name and Badge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <div className="w-full">
              <Input
                label="اسم الباقة"
                value={formData.name}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, name: value }))
                }
                placeholder="اسم الباقة"
                disabled={!isEditMode}
                required
              />
            </div>
            <div className="w-full">
              <Select
                label="شارة الباقة"
                value={formData.badge}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, badge: value }))
                }
                options={badgeOptions}
                disabled={!isEditMode}
              />
            </div>
          </div>

          {/* Description */}
          <div className="w-full">
            <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative w-full">
              <label className="self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                وصف الباقة
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full min-h-[100px] pr-4 pl-4 py-2.5 border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="وصف الباقة"
                dir="rtl"
                disabled={!isEditMode}
                required
              />
            </div>
          </div>

          {/* Price and Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <div className="w-full">
              <Input
                label="سعر الباقة"
                type="number"
                value={formData.price}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, price: value }))
                }
                placeholder="5"
                disabled={!isEditMode}
                required
              />
            </div>
            <div className="w-full">
              <Input
                label="نوع الفترة"
                value={subscription?.periodName?.ar || subscription?.periodName?.en || subscription?.periodName || ""}
                onChange={() => {}}
                placeholder="شهري/سنوي"
                disabled={true}
              />
            </div>
          </div>

          {/* Car Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <div className="w-full">
              <Input
                label="الحد الأدنى لعدد السيارات"
                type="number"
                value={formData.minCarNumber}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, minCarNumber: value }))
                }
                placeholder="1"
                disabled={!isEditMode}
              />
            </div>
            <div className="w-full">
              <Input
                label="الحد الأقصى لعدد السيارات"
                type="number"
                value={formData.maxCarNumber}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, maxCarNumber: value }))
                }
                placeholder="99"
                disabled={!isEditMode}
              />
            </div>
          </div>

          {/* Package Features */}
          <div className="w-full">
            <label className="self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] mb-2 block">
              خصائص الباقة
            </label>
            <div className="flex flex-col gap-3">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={feature}
                    onChange={(value) => handleFeatureChange(index, value)}
                    placeholder="اكتب الخاصية هنا"
                    className="flex-1"
                    disabled={!isEditMode}
                  />
                  {isEditMode && formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="حذف الخاصية"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  إضافة خاصية جديدة
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-[10px] border-[1.5px] border-solid border-[#5A66C1] text-[#5A66C1] bg-white hover:bg-blue-50 font-medium transition-colors"
            >
              رجوع
            </button>
            {!isEditMode ? (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="px-6 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                تعديل الباقة
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  "حفظ التغييرات"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionDetails;

