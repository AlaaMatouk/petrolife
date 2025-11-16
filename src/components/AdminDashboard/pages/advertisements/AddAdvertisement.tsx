import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { ArrowLeft, CirclePlus, Upload, Cloud } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, storage, auth } from "../../../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { generateRefId } from "../../../../services/firestore";

const AddAdvertisement = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImage: null as File | null,
    status: "معروض",
    targeting: "الكل",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setFormData((prev) => ({ ...prev, coverImage: file }));
    };
    input.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const currentUser = auth.currentUser;
      const createdUserId = currentUser?.email ?? currentUser?.uid ?? "unknown";

      let adImageUrl: string | null = null;

      if (formData.coverImage) {
        const storageRef = ref(
          storage,
          `ads/${Date.now()}-${formData.coverImage.name}`
        );
        await uploadBytes(storageRef, formData.coverImage);
        adImageUrl = await getDownloadURL(storageRef);
      }

      const refid = generateRefId();

      await addDoc(collection(db, "ads"), {
        refid,
        adImageUrl,
        title: {
          ar: formData.title,
        },
        description: {
          ar: formData.description,
        },
        createdUserId,
        type: formData.targeting,
        status: formData.status === "معروض",
        createdAt: serverTimestamp(),
      });

      navigate("/advertisements");
    } catch (err) {
      console.error("Error adding advertisement:", err);
      // You may want to show a toast here using existing toast context
    } finally {
      setIsSubmitting(false);
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
            <CirclePlus className="w-5 h-5 text-gray-500" />
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              اضافة اعلان
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
              placeholder="اكتب العنوان هنا"
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
                className="w-full min-h-[100px] pr-4 pl-4 py-2.5 border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="اكتب الوصف هنا"
                dir="rtl"
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
              <button
                type="button"
                onClick={handleFileUpload}
                className="flex h-[120px] items-center justify-center gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-dashed border-color-mode-text-icons-t-placeholder bg-transparent cursor-pointer hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                aria-label="رفع غلاف الاعلان"
              >
                <div className="flex flex-col items-center gap-2">
                  <Cloud className="w-8 h-8 text-gray-400" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm text-gray-500">
                      {formData.coverImage
                        ? formData.coverImage.name
                        : "ارفع الغلاف الخاص بالاعلان هنا"}
                    </span>
                    <span className="text-xs text-gray-400">
                      حجم الصورة لا تزيد عن 5 Mp
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Status and Targeting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <Select
              label="حالة الاعلان"
              value={formData.status}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
              options={statusOptions}
              required
            />
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
          <div className="w-full flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-[10px] border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors"
            >
              رجوع
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ الاعلان"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAdvertisement;

