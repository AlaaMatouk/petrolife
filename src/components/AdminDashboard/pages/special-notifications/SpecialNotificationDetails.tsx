import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { ArrowLeft, Bell, Edit } from "lucide-react";

const SpecialNotificationDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: "وقود بالقرب منك",
    description: "نصلك في أسرع وقت لتزويدك ب...",
    targeting: "الكل",
    lastSendDate: "21 فبراير 2025 - 5:05 ص",
  });

  // Fetch notification data based on id
  useEffect(() => {
    // TODO: Fetch notification data from API
    console.log("Loading special notification:", id);
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) {
      console.log("Update special notification:", formData);
      // TODO: Handle update
      setIsEditMode(false);
    }
  };

  const targetingOptions = [
    { value: "الكل", label: "الكل" },
    { value: "شركات", label: "شركات" },
    { value: "أفراد", label: "أفراد" },
    { value: "مزودو الخدمة", label: "مزودو الخدمة" },
    { value: "تطبيق السائق", label: "تطبيق السائق" },
    { value: "مخصص", label: "مخصص" },
    { value: "عام", label: "عام" },
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
            <Bell className="w-5 h-5 text-gray-500" />
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              مشاهدة الاشعار المخصص
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
              placeholder="عنوان الاشعار"
              disabled={!isEditMode}
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
                className="w-full min-h-[100px] pr-4 pl-4 py-2.5 border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="وصف الاشعار"
                dir="rtl"
                disabled={!isEditMode}
                required
              />
            </div>
          </div>

          {/* Targeting and Last Send Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <Select
              label="التوجيه"
              value={formData.targeting}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, targeting: value }))
              }
              options={targetingOptions}
              disabled={!isEditMode}
            />
            <div className="w-full">
              <Input
                label="اخر تاريخ للارسال"
                value={formData.lastSendDate}
                onChange={() => {}}
                placeholder="--"
                disabled={true}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-[10px] border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors"
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
                تعديل الاشعار
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

export default SpecialNotificationDetails;

