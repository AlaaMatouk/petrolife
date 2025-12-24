import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { Upload, ArrowLeft } from "lucide-react";
import { addPetrolifeAgent, checkAgentPhoneExists } from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";

const AddPetrolifeAgent = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "الرياض",
    address: "",
    agentCode: "",
    commissionValue: "",
    imageFile: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setForm((prev) => ({ ...prev, imageFile: file }));
    };
    input.click();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = "اسم المندوب مطلوب";
    }

    if (!form.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "البريد الإلكتروني غير صحيح";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "رقم الهاتف مطلوب";
    }

    if (!form.address.trim()) {
      newErrors.address = "العنوان مطلوب";
    }

    if (!form.commissionValue.trim()) {
      newErrors.commissionValue = "قيمة العمولة مطلوبة";
    } else if (isNaN(parseFloat(form.commissionValue)) || parseFloat(form.commissionValue) < 0) {
      newErrors.commissionValue = "قيمة العمولة يجب أن تكون رقماً صحيحاً";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneBlur = async () => {
    if (!form.phone.trim()) return;

    setIsCheckingPhone(true);
    try {
      const exists = await checkAgentPhoneExists(form.phone.trim());
      if (exists) {
        setErrors((prev) => ({
          ...prev,
          phone: "رقم الهاتف مستخدم بالفعل. يرجى استخدام رقم آخر.",
        }));
      } else {
        setErrors((prev => {
          const newErrors = { ...prev };
          delete newErrors.phone;
          return newErrors;
        }));
      }
    } catch (error) {
      console.error("Error checking phone:", error);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast({
        title: "خطأ في التحقق",
        message: "يرجى إكمال جميع الحقول المطلوبة بشكل صحيح",
        type: "error",
      });
      return;
    }

    // Check phone uniqueness one more time
    if (form.phone.trim()) {
      try {
        const phoneExists = await checkAgentPhoneExists(form.phone.trim());
        if (phoneExists) {
          setErrors((prev) => ({
            ...prev,
            phone: "رقم الهاتف مستخدم بالفعل. يرجى استخدام رقم آخر.",
          }));
          addToast({
            title: "خطأ",
            message: "رقم الهاتف مستخدم بالفعل",
            type: "error",
          });
          return;
        }
      } catch (error) {
        console.error("Error checking phone:", error);
        addToast({
          title: "خطأ",
          message: "حدث خطأ أثناء التحقق من رقم الهاتف",
          type: "error",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await addPetrolifeAgent({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city,
        address: form.address.trim(),
        agentCode: form.agentCode.trim() || undefined,
        commissionValue: form.commissionValue.trim(),
        imageFile: form.imageFile,
      });

      addToast({
        title: "نجح",
        message: "تم إضافة المندوب بنجاح",
        type: "success",
      });

      // Navigate to agents list
      navigate("/petrolife-agents");
    } catch (error: any) {
      console.error("Error adding agent:", error);
      addToast({
        title: "خطأ",
        message: error.message || "حدث خطأ أثناء إضافة المندوب",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fileName = form.imageFile ? form.imageFile.name : "hsgndkmmcjhpd.jpg";

  const cityOptions = [
    { value: "الرياض", label: "الرياض" },
    { value: "جدة", label: "جدة" },
    { value: "مكة", label: "مكة" },
    { value: "الدمام", label: "الدمام" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full items-start gap-5"
    >
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
        dir="rtl"
      >
        {/* Top bar with title on right and back on left */}
        <div className="flex items-center justify-between w-full">
          {/* Title on the right */}
          <h1 className="text-[length:var(--subtitle-subtitle-2-font-size)] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec">
            إضافة مندوب جديد
          </h1>

          {/* Back button on the left using project icon style */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="رجوع"
            className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]"
          >
            <div className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </div>
          </button>
        </div>

        {/* Form fields - three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          <div>
            <Input
              label="اسم المندوب"
              value={form.name}
              onChange={(value) => setForm((p) => ({ ...p, name: value }))}
              placeholder="اكتب اسم المندوب هنا"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Input
              label="البريد الإلكتروني"
              type="email"
              value={form.email}
              onChange={(value) => setForm((p) => ({ ...p, email: value }))}
              placeholder="hesham@gmail.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div className="relative">
            <Input
              label="رقم الهاتف"
              type="tel"
              value={form.phone}
              onChange={(value) => {
                setForm((p) => ({ ...p, phone: value }));
                // Clear error when user types
                if (errors.phone) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.phone;
                    return newErrors;
                  });
                }
              }}
              onBlur={handlePhoneBlur}
              placeholder="رقم الهاتف هنا"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
            {isCheckingPhone && (
              <p className="text-gray-500 text-sm mt-1">جاري التحقق...</p>
            )}
          </div>

          <Select
            label="المدينة"
            value={form.city}
            onChange={(value) => setForm((p) => ({ ...p, city: value }))}
            options={cityOptions}
          />

          {/* Profile Image - supervisor style */}
          <div className="flex items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
            <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
              <label className="relative self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                الصورة الشخصية
              </label>
              <button
                type="button"
                onClick={handleFileUpload}
                className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder bg-transparent cursor-pointer hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                aria-label="رفع الصورة الشخصية"
              >
                <Upload className="w-4 h-4 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
                <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                  <div className="w-full pr-2 text-right font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] tracking-[var(--body-body-2-letter-spacing)] whitespace-nowrap relative mt-[-1.00px] font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [font-style:var(--body-body-2-font-style)]">
                    {fileName || "ارفع الصورة الشخصية هنا"}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <Input
              label="العنوان"
              value={form.address}
              onChange={(value) => setForm((p) => ({ ...p, address: value }))}
              placeholder="الصائن، 7453، حي قرطبة، Riyadh 13245, Saudi Arabia"
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          <Input
            label="كود المندوب"
            value={form.agentCode}
            onChange={(value) => setForm((p) => ({ ...p, agentCode: value }))}
            placeholder="قم بانشاء قيمة للمندوب هنا"
          />

          <div>
            <Input
              label="قيمة العمولة (%)"
              type="number"
              value={form.commissionValue}
              onChange={(value) => setForm((p) => ({ ...p, commissionValue: value }))}
              placeholder="0"
            />
            {errors.commissionValue && (
              <p className="text-red-500 text-sm mt-1">{errors.commissionValue}</p>
            )}
          </div>
        </div>

        {/* Submit - aligned left */}
        <div className="w-full flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || isCheckingPhone || !!errors.phone}
            className="px-5 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "جاري الإضافة..." : "إضافة المندوب"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddPetrolifeAgent;

