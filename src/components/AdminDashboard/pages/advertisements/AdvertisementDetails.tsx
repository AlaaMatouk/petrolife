import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "../../../shared/Form";
import { ArrowLeft, Eye } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../config/firebase";

const AdvertisementDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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

        <div className="w-full flex flex-col gap-6">
          {/* Advertisement Title */}
          <div className="w-full">
            <Input
              label="عنوان الاعلان"
              value={formData.title}
              onChange={() => {}}
              placeholder="العنوان"
              disabled={true}
              required={false}
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
                onChange={() => {}}
                className="w-full min-h-[100px] pr-4 pl-4 py-2.5 border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] resize-none disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="الوصف"
                dir="rtl"
                disabled={true}
                readOnly
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
            <Input
              label="التوجيه"
              value={formData.targeting}
              onChange={() => {}}
              placeholder="التوجيه"
              disabled={true}
              required={false}
            />
            <Input
              label="حالة الاعلان"
              value={formData.status}
              onChange={() => {}}
              placeholder="حالة الاعلان"
              disabled={true}
              required={false}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertisementDetails;

