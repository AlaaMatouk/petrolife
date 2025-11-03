import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { ArrowLeft, CirclePlus } from "lucide-react";

const AddRegion = () => {
  const navigate = useNavigate();
  const { countryId } = useParams();
  const [formData, setFormData] = useState({
    regionNameAr: "",
    regionNameEn: "",
    cityId: "",
  });

  // Mock cities for the current country
  const cities = [
    { value: "1", label: "القاهرة" },
    { value: "2", label: "الإسكندرية" },
    { value: "3", label: "الجيزة" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Add region:", formData);
    // Handle form submission
    navigate(-1);
  };

  return (
    <div className="flex flex-col w-full items-start gap-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center justify-end gap-1.5">
          <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
            إضافة منطقة جديدة
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
          {/* Region Name Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <Input
              label="اسم المنطقة بالعربي"
              value={formData.regionNameAr}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, regionNameAr: value }))
              }
              placeholder="المنطقة بالعربي هنا"
              required
            />
            <Input
              label="اسم المنطقة بالانجليزي"
              value={formData.regionNameEn}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, regionNameEn: value }))
              }
              placeholder="المنطقة بالانجليزي هنا"
              required
            />
          </div>

          {/* City Dropdown */}
          <div className="w-full">
            <Select
              label="المدينة التابع إليها هذه المنطقة"
              value={formData.cityId}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, cityId: value }))
              }
              options={cities}
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
              إضافة المنطقة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRegion;

