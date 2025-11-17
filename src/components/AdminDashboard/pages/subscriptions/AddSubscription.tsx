import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { ArrowLeft, CirclePlus, Plus, Trash2 } from "lucide-react";
import { createSubscription } from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";

const AddSubscription = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    badge: "",
    periodName: "monthly", // monthly or annual
    periodValueInDays: 30, // 30 for monthly, 365 for annual
    features: [""],
    minCarNumber: "",
    maxCarNumber: "",
  });

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

    try {
      setIsSaving(true);

      // Validate required fields
      if (!formData.name.trim()) {
        addToast("يرجى إدخال اسم الباقة", "error");
        return;
      }
      if (!formData.description.trim()) {
        addToast("يرجى إدخال وصف الباقة", "error");
        return;
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        addToast("يرجى إدخال سعر صحيح", "error");
        return;
      }
      if (formData.features.length === 0 || formData.features.every(f => !f.trim())) {
        addToast("يرجى إدخال خاصية واحدة على الأقل", "error");
        return;
      }

      // Determine periodName and periodValueInDays based on selection
      const periodName = formData.periodName === "monthly" 
        ? { ar: "شهريا", en: "Monthly" }
        : { ar: "سنويا", en: "Annual" };
      const periodValueInDays = formData.periodName === "monthly" ? 30 : 365;

      // Prepare subscription data with proper structure
      const subscriptionData = {
        title: {
          ar: formData.name,
          en: formData.name, // Can be updated later
        },
        description: {
          ar: formData.description,
          en: formData.description, // Can be updated later
          ...(formData.minCarNumber && formData.minCarNumber.trim() !== "" 
            ? { minCarNumber: parseInt(formData.minCarNumber) } 
            : {}),
          ...(formData.maxCarNumber && formData.maxCarNumber.trim() !== "" 
            ? { maxCarNumber: parseInt(formData.maxCarNumber) } 
            : {}),
        },
        status: {
          ar: formData.badge || "",
          en: formData.badge || "", // Can be updated later
        },
        price: parseFloat(formData.price),
        options: formData.features
          .filter((f) => f.trim() !== "")
          .map((feature) => ({
            ar: feature,
            en: feature, // Can be updated later
          })),
        periodName: periodName,
        periodValueInDays: periodValueInDays,
      };

      await createSubscription(subscriptionData);
      
      addToast("تم إضافة الباقة بنجاح", "success");
      navigate("/admin-subscriptions");
    } catch (err: any) {
      console.error("Error creating subscription:", err);
      addToast("فشل إضافة الباقة: " + (err.message || "خطأ غير معروف"), "error");
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

  const periodOptions = [
    { value: "monthly", label: "شهري" },
    { value: "annual", label: "سنوي" },
  ];

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
            <CirclePlus className="w-5 h-5 text-gray-500" />
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              اضافة باقة جديدة
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
          {/* Package Name and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <div className="w-full">
              <Input
                label="اسم الباقة"
                value={formData.name}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, name: value }))
                }
                placeholder="اسم الباقة"
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
                className="w-full min-h-[100px] pr-4 pl-4 py-2.5 border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="اكتب وصف الباقة هنا"
                dir="rtl"
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
                required
              />
            </div>
            <div className="w-full">
              <Select
                label="نوع الفترة"
                value={formData.periodName}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    periodName: value,
                    periodValueInDays: value === "monthly" ? 30 : 365,
                  }));
                }}
                options={periodOptions}
                required
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
                  />
                  {formData.features.length > 1 && (
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
              <button
                type="button"
                onClick={handleAddFeature}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-5 h-5" />
                إضافة خاصية جديدة
              </button>
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
                "إضافة الباقة"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubscription;

