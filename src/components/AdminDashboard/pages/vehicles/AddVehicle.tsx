import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoveLeft, CirclePlus, Sheet, Upload, X, ChevronLeft } from "lucide-react";
import { useForm } from "../../../../hooks/useForm";
import { Select, RadioGroup, Input } from "../../../../components/shared/Form";
import { Car, CarFront, Truck } from "lucide-react";
import { Loader2 } from "lucide-react";
import { createCarType, fetchCarModels, createCarModel } from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";
import { createPortal } from "react-dom";

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
  const { addToast } = useToast();
  const [brandOptions, setBrandOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [newBrandForm, setNewBrandForm] = useState({
    nameAr: "",
    nameEn: "",
  });
  const [isSubmittingBrand, setIsSubmittingBrand] = useState(false);

  // Function to load car models
  const loadCarModels = async () => {
    setIsLoadingBrands(true);
    try {
      const carModels = await fetchCarModels();
      const brands = carModels
        .map((carModel) => {
          const nameAr = carModel.name?.ar;
          if (nameAr && typeof nameAr === "string" && nameAr.trim()) {
            return {
              value: nameAr.trim(),
              label: nameAr.trim(),
            };
          }
          return null;
        })
        .filter(
          (brand): brand is { value: string; label: string } => brand !== null
        )
        .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically

      // Remove duplicates
      const uniqueBrands = Array.from(
        new Map(brands.map((brand) => [brand.value, brand])).values()
      );

      // Add "Add new brand" option at the end
      const brandsWithAddOption = [
        ...uniqueBrands,
        {
          value: "__ADD_NEW_BRAND__",
          label: "إضافة ماركة جديدة",
        },
      ];

      setBrandOptions(brandsWithAddOption);
    } catch (error) {
      console.error("Error loading car models:", error);
      addToast({
        type: "error",
        title: "خطأ",
        message: "فشل في تحميل قائمة الماركات",
      });
    } finally {
      setIsLoadingBrands(false);
    }
  };

  // Fetch car-models on component mount
  useEffect(() => {
    loadCarModels();
  }, [addToast]);

  // Handle add new brand
  const handleAddBrand = async () => {
    if (!newBrandForm.nameAr.trim()) {
      addToast({
        type: "error",
        title: "بيانات ناقصة",
        message: "يرجى إدخال اسم الماركة بالعربي",
      });
      return;
    }

    setIsSubmittingBrand(true);
    try {
      await createCarModel({
        name: {
          ar: newBrandForm.nameAr.trim(),
          en: newBrandForm.nameEn.trim() || newBrandForm.nameAr.trim(),
        },
      });

      const newBrandName = newBrandForm.nameAr.trim();

      addToast({
        type: "success",
        title: "تم الإضافة",
        message: "تم إضافة الماركة بنجاح",
      });

      // Reset form and close modal
      setNewBrandForm({ nameAr: "", nameEn: "" });
      setShowAddBrandModal(false);

      // Reload brands list
      await loadCarModels();

      // Set the newly added brand as selected
      form.setFieldValue("brand", newBrandName);
    } catch (error: any) {
      console.error("Error adding brand:", error);
      addToast({
        type: "error",
        title: "خطأ",
        message:
          error?.message || "حدث خطأ أثناء إضافة الماركة. يرجى المحاولة مرة أخرى",
      });
    } finally {
      setIsSubmittingBrand(false);
    }
  };

  const fuelTypes = [
    { id: "ديزل", label: "ديزل" },
    { id: "بنزين 95", label: "بنزين 95" },
    { id: "بنزين 91", label: "بنزين 91" },
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

  // Map fuel type from Arabic label to value
  const mapFuelType = (fuelTypeLabel: string): string => {
    const fuelTypeMap: { [key: string]: string } = {
      "بنزين 91": "fuel91",
      "بنزين 95": "fuel95",
      "ديزل": "diesel",
      petrol91: "fuel91",
      petrol95: "fuel95",
      diesel: "diesel",
    };
    return fuelTypeMap[fuelTypeLabel] || fuelTypeLabel;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!form.values.brand || !form.values.model || !form.values.year) {
      addToast({
        type: "error",
        title: "بيانات ناقصة",
        message: "يرجى إدخال الماركة والطراز وسنة الاصدار",
      });
      return;
    }

    form.setIsSubmitting(true);

    try {
      // Prepare car-type data
      const carTypeData = {
        name: {
          ar: form.values.model,
        },
        carModel: {
          name: {
            ar: form.values.brand,
          },
        },
        year: form.values.year,
        fuelType: mapFuelType(form.values.fuelType),
        imageFile: form.values.logo,
      };

      // Create car-type in Firestore
      await createCarType(carTypeData);

      addToast({
        type: "success",
        title: "تم الإضافة",
        message: "تم إضافة المركبة بنجاح",
      });

      // Reset form
      form.resetForm();

      // Navigate back to cars list
      setTimeout(() => {
        navigate("/admin-cars");
      }, 1000);
    } catch (error: any) {
      console.error("Error adding car:", error);
      addToast({
        type: "error",
        title: "خطأ",
        message:
          error?.message || "حدث خطأ أثناء إضافة المركبة. يرجى المحاولة مرة أخرى",
      });
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
              {/* Row 1: Logo, Vehicle Type, Fuel Type (right to left) */}
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

              {/* Row 2: Brand, Model, Year (right to left) */}
              <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                  <label className="self-stretch mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] tracking-[var(--body-body-2-letter-spacing)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                    الماركة
                    <span className="text-red-500 mr-1">*</span>
                  </label>
                  <div className="relative w-full">
                    <div
                      className={`flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid transition-colors ${
                        form.errors.brand
                          ? "border-red-500 bg-red-50"
                          : "border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus-within:border-color-mode-text-icons-t-blue"
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
                      <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                        <select
                          value={
                            form.values.brand === "__ADD_NEW_BRAND__"
                              ? ""
                              : form.values.brand
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "__ADD_NEW_BRAND__") {
                              setShowAddBrandModal(true);
                              form.setFieldValue("brand", "");
                            } else {
                              form.setFieldValue("brand", value);
                            }
                          }}
                          disabled={isLoadingBrands}
                          className={`text-right relative pr-2 pl-7 w-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none ${
                            form.errors.brand
                              ? "text-red-500"
                              : "text-[var(--form-active-input-text-color)]"
                          }`}
                        >
                          <option value="" disabled>
                            {isLoadingBrands ? "جاري التحميل..." : "اختر الماركة"}
                          </option>
                          {brandOptions.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                              className={
                                option.value === "__ADD_NEW_BRAND__"
                                  ? "text-[#5A66C1] font-medium"
                                  : ""
                              }
                            >
                              {option.value === "__ADD_NEW_BRAND__"
                                ? `+ ${option.label}`
                                : option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {form.errors.brand && (
                      <div className="absolute top-full left-0 right-0 mt-1 px-2">
                        <p className="text-red-500 text-xs font-medium [direction:rtl] text-right">
                          {form.errors.brand}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Input
                  label="الطراز"
                  value={form.values.model}
                  onChange={(value) => form.setFieldValue("model", value)}
                  error={form.errors.model}
                  required={true}
                  placeholder="اكتب الطراز هنا"
                />

                <Select
                  label="سنة الاصدار"
                  value={form.values.year}
                  onChange={(value) => form.setFieldValue("year", value)}
                  error={form.errors.year}
                  required={true}
                  options={yearOptions}
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

      {/* Add Brand Modal */}
      {showAddBrandModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
            <div className="bg-white rounded-[var(--corner-radius-large)] w-full max-w-md shadow-2xl border border-gray-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <CirclePlus className="w-5 h-5 text-[#5A66C1]" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    إضافة ماركة جديدة
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowAddBrandModal(false);
                    setNewBrandForm({ nameAr: "", nameEn: "" });
                  }}
                  className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-5 py-4 space-y-4" dir="rtl">
                <Input
                  label="اسم الماركة بالعربي"
                  value={newBrandForm.nameAr}
                  onChange={(value) =>
                    setNewBrandForm((prev) => ({ ...prev, nameAr: value }))
                  }
                  placeholder="الماركة بالعربي هنا"
                  required={true}
                />

                <Input
                  label="اسم الماركة بالانجليزي"
                  value={newBrandForm.nameEn}
                  onChange={(value) =>
                    setNewBrandForm((prev) => ({ ...prev, nameEn: value }))
                  }
                  placeholder="الماركة بالانجليزي هنا"
                />
              </div>

              {/* Modal Footer */}
              <div
                className="flex items-center justify-between px-5 py-4 border-t border-gray-100 gap-3"
                dir="rtl"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBrandModal(false);
                    setNewBrandForm({ nameAr: "", nameEn: "" });
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  رجوع
                </button>
                <button
                  type="button"
                  onClick={handleAddBrand}
                  disabled={isSubmittingBrand}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2 ${
                    isSubmittingBrand
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#5A66C1] hover:bg-[#4A5AB1]"
                  }`}
                >
                  {isSubmittingBrand && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  إضافة الماركة
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AddVehicle;
