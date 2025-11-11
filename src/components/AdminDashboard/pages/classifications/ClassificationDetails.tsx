import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner } from "../../../shared";
import {
  fetchAllCategories,
  fetchCategoryById,
  fetchSubcategoriesByParentId,
} from "../../../../services/firestore";

const extractLocalizedText = (value: any): string => {
  if (!value) return "-";

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : "-";
  }

  if (typeof value === "number") {
    return value.toString();
  }

  if (typeof value === "object") {
    if (typeof value.ar === "string" && value.ar.trim().length) {
      return value.ar.trim();
    }
    if (typeof value.en === "string" && value.en.trim().length) {
      return value.en.trim();
    }
    if (value.name) {
      return extractLocalizedText(value.name);
    }
    if (value.label) {
      return extractLocalizedText(value.label);
    }
  }

  return "-";
};

const normalizeReferenceId = (value: any): string | null => {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  if (typeof value === "number") {
    return value.toString();
  }

  if (typeof value === "object") {
    if (typeof value.id === "string" && value.id.trim().length) {
      return value.id.trim();
    }

    if (typeof value.id === "number") {
      return value.id.toString();
    }

    if (typeof value.path === "string" && value.path.trim().length) {
      const segments = value.path.split("/");
      return segments[segments.length - 1] || null;
    }

    if (typeof value._keyPath === "string" && value._keyPath.trim().length) {
      const segments = value._keyPath.split("/");
      return segments[segments.length - 1] || null;
    }
  }

  return null;
};

const ClassificationDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const locationState = (location.state as any) || {};
  const [category, setCategory] = useState<any | null>(null);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get value or dash
  const getValueOrDash = (value: any): string => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    return String(value);
  };

  useEffect(() => {
    const loadClassification = async () => {
      if (!id) {
        setError("معرف التصنيف غير متوفر.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let categoryData =
          locationState?.category ??
          (await fetchCategoryById(id));

        if (!categoryData) {
          setError("لم يتم العثور على بيانات لهذا التصنيف.");
          setCategory(null);
          setSubcategories([]);
          return;
        }

        setCategory(categoryData);

        let subcategoryDocs: any[] = [];
        if (Array.isArray(locationState?.subcategories)) {
          subcategoryDocs = locationState.subcategories;
        } else {
          subcategoryDocs = await fetchSubcategoriesByParentId(id);

          if (!subcategoryDocs.length) {
            const allCategories = await fetchAllCategories();
            subcategoryDocs = allCategories.filter((doc) => {
              const normalizedParent = normalizeReferenceId(doc.parentId);
              return normalizedParent === id;
            });
          }
        }

        setSubcategories(subcategoryDocs);
      } catch (err) {
        console.error("Failed to load classification details:", err);
        setError("فشل في تحميل بيانات التصنيف.");
        setCategory(null);
        setSubcategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadClassification();
  }, [id]);

  const classificationData = useMemo(() => {
    const arabicName =
      extractLocalizedText(category?.name?.ar ?? category?.name ?? category?.label) ??
      "-";
    const englishName =
      extractLocalizedText(category?.name?.en ?? category?.name) ?? "-";

    const subClassificationList = subcategories.map((sub) => ({
      id: sub.id ?? "",
      name:
        extractLocalizedText(
          sub?.name?.ar ?? sub?.name ?? sub?.label ?? sub?.categoryName
        ) ?? "-",
      nameEn:
        extractLocalizedText(
          sub?.name?.en ?? sub?.englishName ?? sub?.label ?? sub?.name
        ) ?? "-",
    }));

    return {
      arabicName: getValueOrDash(arabicName),
      englishName: getValueOrDash(englishName),
      subClassifications: subClassificationList,
    };
  }, [category, subcategories]);

  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-16">
        <LoadingSpinner message="جاري تحميل بيانات التصنيف..." />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-20 gap-4">
        <div className="text-red-600 text-lg [direction:rtl]">
          {error || "لا توجد بيانات لهذا التصنيف."}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white"
        >
          الرجوع
        </button>
      </div>
    );
  }

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
            <Info className="w-5 h-5 text-gray-500" />
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              معلومات التصنيف
            </h1>
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

