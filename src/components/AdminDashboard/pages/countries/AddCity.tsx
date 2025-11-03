import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../../shared/Form";
import { ArrowLeft, CirclePlus } from "lucide-react";

const AddCity = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cityNameAr: "",
    cityNameEn: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Add city:", formData);
    // Handle form submission
    navigate(-1);
  };

  return (
    <div className="flex flex-col w-full items-start gap-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center justify-end gap-1.5">
          <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
            إضافة مدينة جديدة
          </h1>
          <CirclePlus className="w-5 h-5 text-gray-500" />
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

      {/* Form Card */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          {/* City Name Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <Input
              label="اسم المدينة بالعربي"
              value={formData.cityNameAr}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, cityNameAr: value }))
              }
              placeholder="المدينة بالعربي هنا"
              required
            />
            <Input
              label="اسم المدينة بالانجليزي"
              value={formData.cityNameEn}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, cityNameEn: value }))
              }
              placeholder="المدينة بالانجليزي هنا"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 h-10 rounded-[10px] border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              رجوع
            </button>
            <button
              type="submit"
              className="px-6 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors"
            >
              إضافة المدينة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCity;

