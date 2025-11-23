import React, { useState } from "react";
import {
  Upload,
  MapPin,
  User,
  FileText,
  Loader2,
} from "lucide-react";
import { Input, Select } from "../../../../components/shared/Form";
import { useForm } from "../../../../hooks/useForm";
import { useDrivers } from "../../../../hooks/useGlobalState";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../../context/ToastContext";
import { validateDriverForm } from "../../../../utils/validation";
import { addCompanyDriver } from "../../../../services/firestore";
import { registerUserWithPhoneNumber } from "../../../../services/auth";

const initialValues = {
  phone: "",
  email: "",
  driverName: "",
  driverImage: null as File | null,
  address: "",
  city: "الرياض",
  driverAmount: "",
  driverLicense: null as File | null,
};

export const VehicleInformationSection = (): JSX.Element => {
  const navigate = useNavigate();
  const { addDriver } = useDrivers();
  const { addToast } = useToast();
  const [selectedDays, setSelectedDays] = useState(["السبت"]);

  const form = useForm(initialValues);

  const weekDays = [
    "الجمعة",
    "الخميس",
    "الأربعاء",
    "الثلاثاء",
    "الإثنين",
    "الأحد",
    "السبت",
  ];

  const cityOptions = [
    { value: "الرياض", label: "الرياض" },
    { value: "جدة", label: "جدة" },
    { value: "مكة المكرمة", label: "مكة المكرمة" },
    { value: "المدينة المنورة", label: "المدينة المنورة" },
    { value: "الدمام", label: "الدمام" },
    { value: "الخبر", label: "الخبر" },
    { value: "الظهران", label: "الظهران" },
    { value: "الطائف", label: "الطائف" },
    { value: "بريدة", label: "بريدة" },
    { value: "تبوك", label: "تبوك" },
  ];

  const handleChange = (field: string, value: any) => {
    form.setFieldValue(field, value);
    // Clear field error when user starts typing
    if (form.errors[field]) {
      form.clearFieldError(field);
    }
  };

  const handleFieldBlur = (field: string) => {
    // VALIDATION TEMPORARILY DISABLED FOR TESTING
    // Only validate the specific field that was blurred
    // const fieldErrors = validateDriverForm({ [field]: form.values[field] });
    // if (fieldErrors[field]) {
    //   form.setFieldError(field, fieldErrors[field]);
    // } else {
    //   form.clearFieldError(field);
    // }
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleFileUpload = (field: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      field === "driverLicense" ? "image/*,application/pdf" : "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Store the actual File object
        handleChange(field, file);
      }
    };
    input.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDATION TEMPORARILY DISABLED FOR TESTING
    console.log("Form values:", form.values);
    console.log("Selected days:", selectedDays);

    // const isValid = form.validateForm();
    // console.log('Form validation result:', isValid);
    // console.log('Form errors:', form.errors);

    // if (!isValid) {
    //   addToast({
    //     title: "خطأ في التحقق",
    //     message: "يرجى تصحيح الأخطاء في النموذج",
    //     type: "error",
    //   });
    //   return;
    // }

    form.setIsSubmitting(true);

    try {
      // Prepare driver data for Firestore
      const driverData = {
        phone: form.values.phone,
        email: form.values.email,
        driverName: form.values.driverName,
        driverImage: form.values.driverImage,
        address: form.values.address,
        city: form.values.city,
        selectedDays: selectedDays,
        driverAmount: form.values.driverAmount,
        driverLicense: form.values.driverLicense,
      };

      console.log("Submitting driver data to Firestore:", driverData);

      // Add driver to Firestore
      const result = await addCompanyDriver(driverData);

      console.log("Driver added to Firestore:", result);

      // Register user in Firebase Auth via Cloud Function
      console.log(
        "Registering user in Firebase Auth with phone:",
        form.values.phone
      );
      const authResult = await registerUserWithPhoneNumber(form.values.phone);

      if (authResult.success) {
        console.log(
          "✅ Firebase Auth registration successful:",
          authResult.message
        );
        if (authResult.uid) {
          console.log("Firebase Auth UID:", authResult.uid);
        }
      } else {
        console.error(
          "⚠️ Firebase Auth registration failed:",
          authResult.message
        );
        // Show warning but don't stop the process
        addToast({
          title: "تحذير",
          message: `تمت إضافة السائق إلى Firestore، لكن حدث خطأ في إنشاء حساب المصادقة: ${authResult.message}`,
          type: "warning",
        });
      }

      // Also add to local state for immediate UI update
      const newDriver = {
        id: result.id,
        driverCode: result.id,
        driverName: form.values.driverName,
        phone: form.values.phone,
        address: form.values.address,
        fuelType: "بنزين 95", // Default value
        financialValue: `${form.values.driverAmount} / ${form.values.driverAmount}`,
        carNumber: "",
        carCategory: { text: "", icon: null },
        accountStatus: { active: true, text: "مفعل" },
      };

      addDriver(newDriver);

      // Show success message only if Auth was also successful
      if (authResult.success) {
        addToast({
          title: "تم إضافة السائق بنجاح",
          message: `تم إضافة السائق ${form.values.driverName} وإنشاء حساب المصادقة بنجاح`,
          type: "success",
        });
      } else {
        // If Auth failed, we already showed a warning above
      }

      // Reset form
      form.resetForm();
      setSelectedDays(["السبت"]); // Reset selected days

      // Navigate back to drivers list
      setTimeout(() => {
        navigate("/drivers");
      }, 1000);
    } catch (error: any) {
      console.error("Error adding driver:", error);
      addToast({
        title: "خطأ في إضافة السائق",
        message:
          error.message ||
          "حدث خطأ أثناء إضافة السائق. يرجى المحاولة مرة أخرى.",
        type: "error",
      });
    } finally {
      form.setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]"
      role="form"
      aria-label="معلومات السيارة والسائق"
    >
      <div className="flex flex-col items-end gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex-1 grow">
              <Input
                label="رقم الهاتف"
                type="tel"
                name="phone"
                value={form.values.phone}
                onChange={(value) => handleChange("phone", value)}
                onBlur={() => handleFieldBlur("phone")}
                placeholder="رقم الهاتف هنا"
                error={form.errors.phone}
                required
              />
            </div>
            <div className="flex-1 grow">
              <Input
                label="البريد الالكتروني"
                type="email"
                name="email"
                value={form.values.email}
                onChange={(value) => handleChange("email", value)}
                onBlur={() => handleFieldBlur("email")}
                error={form.errors.email}
                required
              />
            </div>
            <div className="flex-1 grow">
              <Input
                label="اسم السائق"
                type="text"
                name="driverName"
                value={form.values.driverName}
                onChange={(value) => handleChange("driverName", value)}
                onBlur={() => handleFieldBlur("driverName")}
                placeholder="اسم السائق هنا"
                error={form.errors.driverName}
                required
              />
            </div>
          </div>
          <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
              <div className="relative w-[43px] h-[42px]">
                <div className="absolute top-1 left-[5px] w-[38px] h-[38px] rounded-[var(--corner-radius-small)] bg-gray-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
                <div className="absolute top-0 left-0 w-3 h-3">
                  <div className="absolute -top-px -left-px w-3.5 h-3.5 bg-white rounded-[7px] border border-solid border-gray-200" />
                  <Upload className="absolute top-0.5 left-0.5 w-2 h-2 text-gray-400" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                <label className="relative self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                  صورة السائق
                </label>
                <button
                  type="button"
                  onClick={() => handleFileUpload("driverImage")}
                  className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder bg-transparent cursor-pointer hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                  aria-label="رفع صورة السائق"
                >
                  <Upload className="w-4 h-4 text-gray-500" />
                  <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                    <div className="w-fit font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] tracking-[var(--body-body-2-letter-spacing)] whitespace-nowrap relative mt-[-1.00px] font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [font-style:var(--body-body-2-font-style)]">
                      {form.values.driverImage?.name || "ارفع صورة السائق هنا"}
                    </div>
                  </div>
                </button>
              </div>
            </div>
            <div className="flex-1 grow">
              <Input
                label="العنوان"
                type="text"
                name="address"
                value={form.values.address}
                onChange={(value) => handleChange("address", value)}
                onBlur={() => handleFieldBlur("address")}
                placeholder="العنوان بالتفصيل هنا"
                error={form.errors.address}
                required
              />
            </div>
            <div className="flex-1 grow">
              <Select
                label="المدينة"
                name="city"
                value={form.values.city}
                onChange={(value) => handleChange("city", value)}
                onBlur={() => handleFieldBlur("city")}
                options={cityOptions}
                error={form.errors.city}
                icon={<MapPin className="w-4 h-4 text-gray-500" />}
                required
              />
            </div>
          </div>
          <div className="flex flex-col items-end gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
            <p className="relative self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
              أيام الأجازات "الغير مسموح بشحن الوقود"
            </p>
            <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
              {weekDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`flex items-center justify-center gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-large)] relative flex-1 self-stretch grow rounded-[var(--corner-radius-small)] border-[0.5px] border-solid transition-colors ${
                    selectedDays.includes(day)
                      ? "border-[0.7px] border-color-mode-text-icons-t-blue"
                      : "border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec cursor-pointer"
                  }`}
                  aria-pressed={selectedDays.includes(day)}
                >
                  <span
                    className={`relative w-fit text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] ${
                      selectedDays.includes(day)
                        ? "font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-blue [font-style:var(--body-body-2-font-style)]"
                        : "font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec [font-style:var(--body-body-2-font-style)]"
                    }`}
                  >
                    {day}
                  </span>

                  {selectedDays.includes(day) && (
                    <img
                      className="absolute top-0 left-0 w-3.5 h-3.5"
                      alt="Selected"
                      src="/img/rectangle-22DI.svg"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex-1 grow">
              <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex items-center justify-between w-full">
                  <span className="text-blue-500 text-sm font-medium">
                    غير محددة
                  </span>
                  <label className="self-stretch font-normal text-[var(--form-active-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                    <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                      القيمة المالية المحددة للسائق (ر.س)
                    </span>
                  </label>
                </div>
                <div className="relative w-full">
                  <div
                    className={`flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid transition-colors ${
                      form.errors.driverAmount
                        ? "border-red-500 bg-red-50"
                        : "border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus-within:border-color-mode-text-icons-t-blue"
                    }`}
                  >
                    <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                      <input
                        type="number"
                        value={form.values.driverAmount}
                        onChange={(e) =>
                          handleChange("driverAmount", e.target.value)
                        }
                        onBlur={() => handleFieldBlur("driverAmount")}
                        className={`text-right relative w-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none ${
                          form.errors.driverAmount
                            ? "text-red-500 placeholder-red-300"
                            : "text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)]"
                        }`}
                      />
                    </div>
                  </div>
                  {form.errors.driverAmount && (
                    <div className="absolute top-full left-0 right-0 mt-1 px-2">
                      <p className="text-red-500 text-xs font-medium [direction:rtl] text-right">
                        {form.errors.driverAmount}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 grow">
              <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative self-stretch w-full flex-[0_0_auto]">
                <label className="self-stretch font-normal text-[var(--form-active-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                  <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                    صورة ترخيص السائق "اختياري"
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => handleFileUpload("driverLicense")}
                  className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder bg-transparent cursor-pointer hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                  aria-label="رفع صورة ترخيص السائق"
                >
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                    <p className="w-fit font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-placeholder text-left tracking-[var(--body-body-2-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [font-style:var(--body-body-2-font-style)]">
                      {form.values.driverLicense?.name ||
                        "ارفع صورة ترخيص السائق هنا"}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-[276px] left-0 w-[43px] h-[43px]" />
      </div>
      <div className="inline-flex items-start gap-5 relative flex-[0_0_auto]">
        <button
          type="submit"
          disabled={form.isSubmitting}
          className={`inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] transition-opacity ${
            form.isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-color-mode-surface-primary-blue hover:opacity-90"
          }`}
          aria-label="إضافة السائق"
        >
          <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
            {form.isSubmitting && (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            )}
            <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-color-mode-text-icons-t-btn-negative text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
              {form.isSubmitting ? "جاري الإضافة..." : "إضافة السائق"}
            </div>
          </div>
        </button>
      </div>
    </form>
  );
};
