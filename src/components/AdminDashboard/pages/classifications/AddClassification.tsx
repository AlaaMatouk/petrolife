import React from "react";
import { useNavigate } from "react-router-dom";
import { MoveLeft, Upload, Cloud, Loader2 } from "lucide-react";
import { useForm } from "../../../../hooks/useForm";
import { Input, Select } from "../../../../components/shared/Form";

const initialValues = {
  arabicName: "",
  englishName: "",
  accountingSystemId: "",
  priceForIndividuals: "0",
  priceForCompanies: "0",
  productImage: null as File | null,
  unitOfMeasurement: "Liter",
};

const ClassificationHeaderSection = () => {
  const navigate = useNavigate();
  return (
    <section className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
      <header className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
        <div className="inline-flex items-center gap-2.5 relative flex-[0_0_auto]">
          <button
            onClick={() => navigate("/admin-categories")}
            className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]"
            aria-label="العودة"
            type="button"
          >
            <div className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
              <MoveLeft className="w-5 h-5 text-gray-500" />
            </div>
          </button>
        </div>

        <button className="flex items-center justify-end gap-1.5 relative hover:opacity-80 transition-opacity">
          <div className="relative font-subtitle-subtitle-2 font-[number:var(--subtitle-subtitle-2-font-weight)] text-[var(--form-section-title-color)] text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
            إضافة تصنيف جديد
          </div>
        </button>
      </header>
    </section>
  );
};

const AddClassification = () => {
  const form = useForm(initialValues);
  const navigate = useNavigate();

  const unitOptions = [
    { value: "Liter", label: "لتر" },
    { value: "Kilogram", label: "كيلوغرام" },
    { value: "Piece", label: "قطعة" },
    { value: "Box", label: "صندوق" },
  ];

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        form.setFieldValue("productImage", file);
      }
    };
    input.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Form values:", form.values);

    form.setIsSubmitting(true);

    try {
      // Prepare classification data
      const classificationData = {
        arabicName: form.values.arabicName,
        englishName: form.values.englishName,
        accountingSystemId: form.values.accountingSystemId,
        priceForIndividuals: form.values.priceForIndividuals,
        priceForCompanies: form.values.priceForCompanies,
        productImage: form.values.productImage,
        unitOfMeasurement: form.values.unitOfMeasurement,
      };

      console.log("Submitting classification data:", classificationData);

      // TODO: Add classification to Firestore or API
      // await addClassification(classificationData);

      // Reset form
      form.resetForm();

      // Navigate back to classifications list
      setTimeout(() => {
        navigate("/admin-categories");
      }, 1000);
    } catch (error: any) {
      console.error("Error adding classification:", error);
      // TODO: Show error toast
    } finally {
      form.setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex flex-col items-start gap-5 relative"
      dir="rtl"
    >
      <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
        <ClassificationHeaderSection />
        <form
          className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col items-start gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              {/* Row 1: Arabic Name, English Name */}
              <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                <Input
                  label="اسم التصنيف بالعربي"
                  value={form.values.arabicName}
                  onChange={(value) => form.setFieldValue("arabicName", value)}
                  error={form.errors.arabicName}
                  required={true}
                  placeholder="أدخل اسم التصنيف بالعربي"
                />
                <Input
                  label="اسم التصنيف بالانجليزي"
                  value={form.values.englishName}
                  onChange={(value) => form.setFieldValue("englishName", value)}
                  error={form.errors.englishName}
                  required={true}
                  placeholder="Enter classification name in English"
                />
              </div>

              {/* Row 2: Accounting System ID, Unit of Measurement */}
              <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                <Input
                  label="الرقم التعريفي للنظام المحاسبي"
                  value={form.values.accountingSystemId}
                  onChange={(value) => form.setFieldValue("accountingSystemId", value)}
                  error={form.errors.accountingSystemId}
                  type="number"
                  placeholder="أدخل الرقم التعريفي"
                />
                <Select
                  label="وحدة القياس"
                  value={form.values.unitOfMeasurement}
                  onChange={(value) => form.setFieldValue("unitOfMeasurement", value)}
                  error={form.errors.unitOfMeasurement}
                  required={true}
                  options={unitOptions}
                />
              </div>

              {/* Row 3: Price for Individuals, Price for Companies */}
              <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                  <label className="self-stretch font-normal text-[var(--form-active-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                    <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                      سعر المنتج للأفراد
                    </span>
                  </label>
                  <div className="relative w-full">
                    <div className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus-within:border-color-mode-text-icons-t-blue transition-colors">
                      <span className="text-gray-500 text-sm ml-2">SAR</span>
                      <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                        <input
                          type="number"
                          value={form.values.priceForIndividuals}
                          onChange={(e) => form.setFieldValue("priceForIndividuals", e.target.value)}
                          className="w-full text-right text-[var(--form-active-input-text-color)] bg-transparent border-none outline-none [direction:rtl]"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                  <label className="self-stretch font-normal text-[var(--form-active-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                    <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                      سعر المنتج للشركات
                    </span>
                  </label>
                  <div className="relative w-full">
                    <div className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus-within:border-color-mode-text-icons-t-blue transition-colors">
                      <span className="text-gray-500 text-sm ml-2">SAR</span>
                      <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                        <input
                          type="number"
                          value={form.values.priceForCompanies}
                          onChange={(e) => form.setFieldValue("priceForCompanies", e.target.value)}
                          className="w-full text-right text-[var(--form-active-input-text-color)] bg-transparent border-none outline-none [direction:rtl]"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Product Image Upload */}
              <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                  <label className="self-stretch font-normal text-[var(--form-active-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                    <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                      صورة المنتج
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleFileUpload}
                    className="flex h-[120px] items-center justify-center gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-dashed border-color-mode-text-icons-t-placeholder bg-transparent cursor-pointer hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                    aria-label="رفع صورة المنتج"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Cloud className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {form.values.productImage?.name || "ارفع الصورة هنا"}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 w-full mt-4">
                <button
                  type="button"
                  onClick={() => navigate("/admin-categories")}
                  className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                >
                  <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                    <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
                      رجوع
                    </div>
                  </div>
                </button>
                <button
                  type="submit"
                  disabled={form.isSubmitting}
                  className={`inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] transition-opacity ${
                    form.isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-color-mode-surface-primary-blue hover:opacity-90"
                  }`}
                >
                  <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                    {form.isSubmitting && (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    )}
                    <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-color-mode-text-icons-t-btn-negative text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
                      {form.isSubmitting ? "جاري الحفظ..." : "حفظ"}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClassification;

