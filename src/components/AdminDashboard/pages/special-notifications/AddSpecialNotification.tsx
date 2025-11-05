import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { ArrowLeft, CirclePlus } from "lucide-react";

const AddSpecialNotification = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targeting: "الكل",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Add special notification:", formData);
    // TODO: Handle form submission
    // navigate("/special-notifications");
  };

  const handleSaveAndSend = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Save and send special notification:", formData);
    // TODO: Handle save and send logic
    // navigate("/special-notifications");
  };

  const targetingOptions = [
    { value: "الكل", label: "الكل" },
    { value: "شركات", label: "شركات" },
    { value: "أفراد", label: "أفراد" },
    { value: "مزودو الخدمة", label: "مزودو الخدمة" },
    { value: "تطبيق السائق", label: "تطبيق السائق" },
    { value: "مخصص", label: "مخصص" },
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
              اضافة اشعار مخصص
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
          {/* Notification Title */}
          <div className="w-full">
            <Input
              label="عنوان الاشعار"
              value={formData.title}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, title: value }))
              }
              placeholder="اكتب العنوان هنا"
              required
            />
          </div>

          {/* Notification Description */}
          <div className="w-full">
            <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative w-full">
              <label className="self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                وصف الاشعار
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full min-h-[100px] pr-4 pl-4 py-2.5 border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="اكتب الوصف هنا"
                dir="rtl"
                required
              />
            </div>
          </div>

          {/* Targeting */}
          <div className="w-full">
            <Select
              label="التوجيه"
              value={formData.targeting}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, targeting: value }))
              }
              options={targetingOptions}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-[10px] border-[1.5px] border-solid border-[#5A66C1] text-[#5A66C1] bg-white hover:bg-blue-50 font-medium transition-colors"
            >
              رجوع
            </button>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-[10px] border-[1.5px] border-solid border-[#5A66C1] text-[#5A66C1] bg-white hover:bg-blue-50 font-medium transition-colors"
              >
                حفظ الاشعار
              </button>
              <button
                type="button"
                onClick={handleSaveAndSend}
                className="px-6 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors"
              >
                حفظ & ارسال الاشعار
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSpecialNotification;

