import React from "react";
import { useNavigate } from "react-router-dom";
import { MoveLeft, CirclePlus, Sheet, Upload } from "lucide-react";
import { useForm } from "../../../../hooks/useForm";
import { Select, RadioGroup } from "../../../../components/shared/Form";
import { Car, CarFront, Truck } from "lucide-react";
import { Loader2 } from "lucide-react";

const initialValues = {
  fuelType: "بنزين 91",
  carType: "صغيرة",
  year: "2020",
  model: "كرولا",
  brand: "تيوتا",
  logo: null as File | null,
};

const VehicleDetailsSection = () => {
  const navigate = useNavigate();
  return (
    <section className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
      <header className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
        <div className="inline-flex items-center gap-2.5 relative flex-[0_0_auto]">
          <button
            onClick={() => navigate("/admin-cars")}
            className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]"
            aria-label="العودة"
            type="button"
          >
            <div className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
              <MoveLeft className="w-5 h-5 text-gray-500" />
            </div>
          </button>

          <button className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec transition-colors">
            <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                <p className="relative w-fit mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                  إضافة سيارات من ملف Excel
                </p>
              </div>
              <Sheet className="w-4 h-4 text-gray-500" />
            </div>
          </button>
        </div>

        <button className="flex w-[134px] items-center justify-end gap-1.5 relative hover:opacity-80 transition-opacity">
          <div className="relative w-[145px] h-5 mt-[-1.00px] ml-[-35.00px] font-subtitle-subtitle-2 font-[number:var(--subtitle-subtitle-2-font-weight)] text-[var(--form-section-title-color)] text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
            إضافة سيارة جديدة
          </div>
          <CirclePlus className="w-4 h-4 text-gray-500" />
        </button>
      </header>
    </section>
  );
};

const AddVehicle = () => {
  const form = useForm(initialValues);
  const navigate = useNavigate();

  const fuelTypes = [
    { id: "diesel", label: "ديزل" },
    { id: "petrol95", label: "بنزين 95" },
    { id: "petrol91", label: "بنزين 91" },
  ];

  const carTypes = [
    {
      id: "vip",
      label: "Vip",
      icon: <CarFront className="w-4 h-4 text-gray-500" />,
    },
    {
      id: "large",
      label: "كبيرة",
      icon: <Truck className="w-4 h-4 text-purple-500" />,
    },
    {
      id: "medium",
      label: "متوسطة",
      icon: <Car className="w-4 h-4 text-orange-500" />,
    },
    {
      id: "small",
      label: "صغيرة",
      icon: <CarFront className="w-4 h-4 text-green-500" />,
    },
  ];

  const yearOptions = Array.from({ length: 25 }, (_, i) => {
    const year = new Date().getFullYear() - 10 + i;
    return { value: year.toString(), label: year.toString() };
  });

  const modelOptions = [
    { value: "كرولا", label: "كرولا" },
    { value: "كامري", label: "كامري" },
    { value: "أكورد", label: "أكورد" },
    { value: "سيفيك", label: "سيفيك" },
    { value: "سوناتا", label: "سوناتا" },
  ];

  const brandOptions = [
    { value: "تيوتا", label: "تيوتا" },
    { value: "هوندا", label: "هوندا" },
    { value: "نيسان", label: "نيسان" },
    { value: "هيونداي", label: "هيونداي" },
    { value: "كيا", label: "كيا" },
  ];

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        form.setFieldValue("logo", file);
      }
    };
    input.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Form values:", form.values);

    form.setIsSubmitting(true);

    try {
      // Prepare car data
      const carData = {
        fuelType: form.values.fuelType,
        carType: form.values.carType,
        year: form.values.year,
        model: form.values.model,
        brand: form.values.brand,
        logo: form.values.logo,
      };

      console.log("Submitting car data:", carData);

      // TODO: Add car to Firestore or API
      // await addAdminCar(carData);

      // Reset form
      form.resetForm();

      // Navigate back to cars list
      setTimeout(() => {
        navigate("/admin-cars");
      }, 1000);
    } catch (error: any) {
      console.error("Error adding car:", error);
      // TODO: Show error toast
    } finally {
      form.setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex flex-col items-start gap-5 relative"
      data-model-id="1:14955"
    >
      <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
        <VehicleDetailsSection />
        <form
          className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col items-start gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              {/* Row 1: Logo upload, Brand, Model */}
              <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                {/* Logo Upload */}
                <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                  <label className="self-stretch font-normal text-[var(--form-active-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                    <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                      لوجو المركبة
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleFileUpload}
                    className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder bg-transparent cursor-pointer hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                    aria-label="رفع لوجو المركبة"
                  >
                    <Upload className="w-4 h-4 text-gray-500" />
                    <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                      <div className="w-fit font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] tracking-[var(--body-body-2-letter-spacing)] whitespace-nowrap relative mt-[-1.00px] font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [font-style:var(--body-body-2-font-style)]">
                        {form.values.logo?.name || "ارفع لوجو المركبة هنا"}
                      </div>
                    </div>
                  </button>
                </div>

                <Select
                  label="الماركة"
                  value={form.values.brand}
                  onChange={(value) => form.setFieldValue("brand", value)}
                  error={form.errors.brand}
                  required={true}
                  options={brandOptions}
                />

                <Select
                  label="الطراز"
                  value={form.values.model}
                  onChange={(value) => form.setFieldValue("model", value)}
                  error={form.errors.model}
                  required={true}
                  options={modelOptions}
                />
              </div>

              {/* Row 2: Year, Vehicle Type, Fuel Type */}
              <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                <Select
                  label="سنة الاصدار"
                  value={form.values.year}
                  onChange={(value) => form.setFieldValue("year", value)}
                  error={form.errors.year}
                  required={true}
                  options={yearOptions}
                />

                <RadioGroup
                  label="نوع السيارة"
                  value={form.values.carType}
                  onChange={(value) => form.setFieldValue("carType", value)}
                  error={form.errors.carType}
                  required={true}
                  options={carTypes}
                />

                <RadioGroup
                  label="نوع البنزين"
                  value={form.values.fuelType}
                  onChange={(value) => form.setFieldValue("fuelType", value)}
                  error={form.errors.fuelType}
                  required={true}
                  options={fuelTypes}
                />
              </div>

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
                    {form.isSubmitting ? "جاري الإضافة..." : "إضافة السيارة"}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;
