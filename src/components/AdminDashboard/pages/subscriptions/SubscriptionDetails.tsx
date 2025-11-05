import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { ArrowLeft, Edit, Plus, Trash2 } from "lucide-react";

const SubscriptionDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "بترولايف بيسيك",
    description: "أنسب للشركات المتوسطة التي تحتاج تقارير وتنبيهات تساعدها في مراقبة وتقليل مصاريف الوقود.",
    price: "5",
    badge: "موصى به",
    features: [
      "عدد السيارات من 3 إلى 499",
      "QR Code",
      "اكتشاف تلقائي لعدد المركبات",
    ],
  });

  // Fetch subscription data based on id
  useEffect(() => {
    // TODO: Fetch subscription data from API
    console.log("Loading subscription:", id);
  }, [id]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) {
      console.log("Update subscription:", formData);
      // TODO: Handle update
      setIsEditMode(false);
    }
  };

  const badgeOptions = [
    { value: "", label: "بدون شارة" },
    { value: "موصى به", label: "موصى به" },
    { value: "الأنسب", label: "الأنسب" },
    { value: "الأرخص", label: "الأرخص" },
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

          {/* Price */}
          <div className="w-full">
            <Input
              label="سعر الباقة/شهر"
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
                className="px-6 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors"
              >
                حفظ التغييرات
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionDetails;

