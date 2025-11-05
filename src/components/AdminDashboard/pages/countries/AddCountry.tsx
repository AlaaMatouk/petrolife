import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../../shared/Form";
import { ArrowLeft, CirclePlus } from "lucide-react";

const AddCountry = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    countryNameAr: "",
    countryNameEn: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Add country:", formData);
    // Handle form submission
  };

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
              إضافة بلد جديدة
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
          {/* Country Name Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <Input
              label="اسم الدولة بالعربي"
              value={formData.countryNameAr}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, countryNameAr: value }))
              }
              placeholder="اسم الدولة هنا بالعربي"
              required
            />
            <Input
              label="اسم الدولة بالانجليزي"
              value={formData.countryNameEn}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, countryNameEn: value }))
              }
              placeholder="اسم الدولة هنا بالانجليزي"
              required
            />
          </div>

          {/* Add Country Button */}
          <div className="w-full flex items-center justify-end">
            <button
              type="submit"
              className="px-6 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors"
            >
              إضافة الدولة
            </button>
          </div>
        </form>

        {/* Cities Section */}
        <div className="w-full flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              المدن المضافة (0)
            </h2>
            <button
              onClick={() => navigate("/admin-countries/add/add-city")}
              disabled
              className="px-4 h-10 rounded-[10px] border-2 border-gray-300 text-gray-400 font-medium cursor-not-allowed"
            >
              إضافة مدينة جديدة
            </button>
          </div>
          <div className="w-full py-8 text-center text-gray-400 border border-dashed border-gray-300 rounded-lg">
            لا توجد مدن مضافة حتى الآن
          </div>
        </div>

        {/* Regions Section */}
        <div className="w-full flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              المناطق المضافة (0)
            </h2>
            <button
              onClick={() => navigate("/admin-countries/add/add-region")}
              disabled
              className="px-4 h-10 rounded-[10px] border-2 border-gray-300 text-gray-400 font-medium cursor-not-allowed"
            >
              إضافة منطقة جديدة
            </button>
          </div>
          <div className="w-full py-8 text-center text-gray-400 border border-dashed border-gray-300 rounded-lg">
            لا توجد مناطق مضافة حتى الآن
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCountry;

