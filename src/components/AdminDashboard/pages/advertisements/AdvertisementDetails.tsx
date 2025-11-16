import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { ArrowLeft, Eye, Edit } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../config/firebase";

const AdvertisementDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImage: null as string | null,
    status: "معروض",
    targeting: "الكل",
  });

  // Fetch advertisement data based on id from Firestore
  useEffect(() => {
    const loadAd = async () => {
      if (!id) return;

      try {
        const adRef = doc(db, "ads", id);
        const snap = await getDoc(adRef);

        if (!snap.exists()) {
          console.warn("Advertisement not found:", id);
          return;
        }

        const data = snap.data() || {};
        const title =
          typeof data.title === "string"
            ? data.title
            : data.title?.ar ?? "";
        const description =
          typeof data.description === "string"
            ? data.description
            : data.description?.ar ?? "";

        setFormData({
          title,
          description,
          coverImage: data.adImageUrl ?? null,
          status: data.status === true || data.status === "معروض" ? "معروض" : "غير معروض",
          targeting: data.type ?? "الكل",
        });
      } catch (err) {
        console.error("Error loading advertisement:", err);
      }
    };

    loadAd();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditMode || !id) return;

    try {
      const adRef = doc(db, "ads", id);
      await updateDoc(adRef, {
        title: {
          ar: formData.title,
        },
        description: {
          ar: formData.description,
        },
        adImageUrl: formData.coverImage,
        type: formData.targeting,
        status: formData.status === "معروض",
      });
      setIsEditMode(false);
    } catch (err) {
      console.error("Error updating advertisement:", err);
    }
  };

  const statusOptions = [
    { value: "معروض", label: "معروض" },
    { value: "غير معروض", label: "غير معروض" },
  ];

  const targetingOptions = [
    { value: "الكل", label: "الكل" },
    { value: "شركات", label: "شركات" },
    { value: "أفراد", label: "أفراد" },
    { value: "مزودو الخدمة", label: "مزودو الخدمة" },
    { value: "تطبيق السائق", label: "تطبيق السائق" },
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
            <Eye className="w-5 h-5 text-gray-500" />
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              مشاهدة الاعلان
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
          {/* Advertisement Title */}
          <div className="w-full">
            <Input
              label="عنوان الاعلان"
              value={formData.title}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, title: value }))
              }
              placeholder="العنوان"
              disabled={!isEditMode}
              required
            />
          </div>

          {/* Advertisement Description */}
          <div className="w-full">
            <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative w-full">
              <label className="self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                وصف الاعلان
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full min-h-[100px] pr-4 pl-4 py-2.5 border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="الوصف"
                dir="rtl"
                disabled={!isEditMode}
                required
              />
            </div>
          </div>

          {/* Advertisement Cover */}
          <div className="w-full">
            <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative w-full">
              <label className="self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                غلاف الاعلان
              </label>
              <div className="w-full border-[0.5px] border-dashed border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] overflow-hidden">
                {formData.coverImage ? (
                  <img
                    src={formData.coverImage}
                    alt="غلاف الاعلان"
                    className="w-full h-auto object-cover"
                  />
                ) : (
                  <div className="w-full h-[200px] bg-gray-200 flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-lg">تصميم الاعلان</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status and Targeting */}
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
            <Select
              label="حالة الاعلان"
              value={formData.status}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
              options={statusOptions}
              disabled={!isEditMode}
            />
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
                className="px-6 h-10 rounded-[10px] bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                تعديل الاعلان
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

export default AdvertisementDetails;

