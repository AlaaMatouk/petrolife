import { ArrowLeft, Info } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

// Mock classification data
const mockClassificationDetails = {
  id: "1",
  arabicName: "وقود",
  englishName: "Fuels",
  subClassifications: [
    { id: "1", name: "ديزل", nameEn: "Diesel" },
    { id: "2", name: "بنزين 91", nameEn: "Benzene 91" },
    { id: "3", name: "بنزين 95", nameEn: "Benzene 95" },
  ],
};

const ClassificationDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Helper function to get value or dash
  const getValueOrDash = (value: any): string => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    return String(value);
  };

  // Extract classification information
  const classificationData = {
    arabicName: getValueOrDash(mockClassificationDetails.arabicName),
    englishName: getValueOrDash(mockClassificationDetails.englishName),
    subClassifications: mockClassificationDetails.subClassifications,
  };

  return (
    <div className="flex flex-col w-full items-start gap-5" dir="rtl">
      {/* Classification Info Card */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          {/* Title on right */}
          <div className="flex items-center justify-end gap-1.5">
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              معلومات التصنيف
            </h1>
            <Info className="w-5 h-5 text-gray-500" />
          </div>
          {/* Back button on left */}
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

        {/* Classification Info Fields */}
        <div className="w-full flex flex-col gap-5">
          {/* Row 1: Arabic Name, English Name */}
          <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            {/* Arabic Name */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                اسم التصنيف بالعربي
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
                {classificationData.arabicName}
              </div>
            </div>

            {/* English Name */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                اسم التصنيف بالانجليزي
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
                {classificationData.englishName}
              </div>
            </div>
          </div>

          {/* Row 2: Sub-classifications */}
          <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                التصنيفات الفرعية
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {classificationData.subClassifications.length > 0 ? (
                  classificationData.subClassifications.map((sub) => (
                    <span
                      key={sub.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                    >
                      {sub.name}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">لا توجد تصنيفات فرعية</span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <div className="w-full flex items-center justify-end mt-4">
            <button
              onClick={() => {
                // Navigate to edit page or enable edit mode
                console.log("Edit classification:", id);
                // navigate(`/admin-categories/${id}/edit`);
              }}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-[#FFC107] hover:bg-[#FFB300] text-white font-medium transition-colors"
            >
              تعديل البيانات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassificationDetails;

