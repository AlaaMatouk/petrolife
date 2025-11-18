import { useState, useEffect } from "react";
import { ArrowLeft, Info, Edit, Save, X, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  RadioGroup,
  Input,
  Select,
  LoadingSpinner,
} from "../../../../components/shared";
import { CarFront, Truck } from "lucide-react";
import { Car } from "lucide-react";
import {
  fetchCarTypeById,
  updateCarType,
  fetchCarModels,
} from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";
import { useForm } from "../../../../hooks/useForm";

const VehicleDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [carTypeData, setCarTypeData] = useState<any>(null);
  const [brandOptions, setBrandOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // Helper function to get value or dash
  const getValueOrDash = (value: any): string => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    return String(value);
  };

  // Map fuel type from value to Arabic label
  const mapFuelTypeToLabel = (fuelType: string): string => {
    const fuelTypeMap: { [key: string]: string } = {
      fuel91: "بنزين 91",
      fuel95: "بنزين 95",
      diesel: "ديزل",
      "بنزين 91": "بنزين 91",
      "بنزين 95": "بنزين 95",
      "ديزل": "ديزل",
    };
    return fuelTypeMap[fuelType?.toLowerCase()] || getValueOrDash(fuelType);
  };

  // Map fuel type from Arabic label to value
  const mapFuelTypeToValue = (fuelTypeLabel: string): string => {
    const fuelTypeMap: { [key: string]: string } = {
      "بنزين 91": "fuel91",
      "بنزين 95": "fuel95",
      "ديزل": "diesel",
      fuel91: "fuel91",
      fuel95: "fuel95",
      diesel: "diesel",
    };
    return fuelTypeMap[fuelTypeLabel] || fuelTypeLabel;
  };

  // Initialize form with default values
  const form = useForm({
    logo: null as File | null,
    brand: "",
    model: "",
    year: "",
    carType: "صغيرة",
    fuelType: "بنزين 91",
  });

  // Fetch car models for brand dropdown
  useEffect(() => {
    const loadCarModels = async () => {
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
          .sort((a, b) => a.label.localeCompare(b.label));

        const uniqueBrands = Array.from(
          new Map(brands.map((brand) => [brand.value, brand])).values()
        );

        setBrandOptions([
          ...uniqueBrands,
          {
            value: "__ADD_NEW_BRAND__",
            label: "إضافة ماركة جديدة",
          },
        ]);
      } catch (error) {
        console.error("Error loading car models:", error);
      }
    };

    loadCarModels();
  }, []);

  // Fetch car-type data
  useEffect(() => {
    const loadCarType = async () => {
      if (!id) {
        setError("معرف المركبة غير متوفر");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchCarTypeById(id);
        setCarTypeData(data);

        // Populate form with fetched data
        form.setFieldValue("brand", getValueOrDash(data.carModel?.name?.ar));
        form.setFieldValue("model", getValueOrDash(data.name?.ar));
        form.setFieldValue("year", getValueOrDash(data.year));
        form.setFieldValue(
          "fuelType",
          mapFuelTypeToLabel(data.fuelType || "")
        );
        // Note: carType is not in car-types, it's derived from plan.carSize
        // We'll keep it as is for now
      } catch (err: any) {
        console.error("Error loading car type:", err);
        setError(err?.message || "فشل في تحميل بيانات المركبة");
      } finally {
        setIsLoading(false);
      }
    };

    loadCarType();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      form.setFieldValue("logo", file);
    };
    input.click();
  };

  const handleSave = async () => {
    if (!id || !carTypeData) return;

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
      await updateCarType(id, {
        name: {
          ar: form.values.model,
        },
        carModel: {
          name: {
            ar: form.values.brand,
          },
        },
        year: form.values.year,
        fuelType: mapFuelTypeToValue(form.values.fuelType),
        imageFile: form.values.logo,
      });

      addToast({
        type: "success",
        title: "تم التحديث",
        message: "تم تحديث بيانات المركبة بنجاح",
      });

      // Reload data
      const updatedData = await fetchCarTypeById(id);
      setCarTypeData(updatedData);
      setIsEditing(false);
      form.setFieldValue("logo", null);
    } catch (error: any) {
      console.error("Error updating car type:", error);
      addToast({
        type: "error",
        title: "خطأ",
        message:
          error?.message || "حدث خطأ أثناء تحديث البيانات. يرجى المحاولة مرة أخرى",
      });
    } finally {
      form.setIsSubmitting(false);
    }
  };


  const fuelTypes = [
    { id: "بنزين 91", label: "بنزين 91" },
    { id: "بنزين 95", label: "بنزين 95" },
    { id: "ديزل", label: "ديزل" },
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

  if (isLoading) {
    return (
      <div className="flex flex-col w-full items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" message="جاري تحميل بيانات المركبة..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col w-full items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500 text-lg">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          رجوع
        </button>
      </div>
    );
  }

  if (!carTypeData) {
    return null;
  }

  // Extract vehicle information for display
  const vehicleData = {
    logo: carTypeData.carModel?.carModelImageUrl || null,
    brand: getValueOrDash(carTypeData.carModel?.name?.ar),
    model: getValueOrDash(carTypeData.name?.ar),
    year: getValueOrDash(carTypeData.year),
    fuelType: mapFuelTypeToLabel(carTypeData.fuelType || ""),
    carType: "صغيرة", // Default, as it's not in car-types collection
  };

  return (
    <div className="flex flex-col w-full items-start gap-5" dir="rtl">
      {/* Vehicle Info Card */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          {/* Title on right */}
          <div className="flex items-center justify-end gap-1.5">
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              معلومات المركبة
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

        {/* Vehicle Info Fields */}
        <div className="w-full flex flex-col gap-5">
          {/* Row 1: Logo, Vehicle Type, Fuel Type */}
          <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            {/* Logo */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                لوجو المركبة
              </label>
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleFileUpload}
                  className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder bg-transparent cursor-pointer hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                >
                  <Upload className="w-4 h-4 text-gray-500" />
                  <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                    <div className="w-fit font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] tracking-[var(--body-body-2-letter-spacing)] whitespace-nowrap relative mt-[-1.00px] font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [font-style:var(--body-body-2-font-style)]">
                      {form.values.logo?.name ||
                        (vehicleData.logo ? "تغيير الصورة" : "ارفع لوجو المركبة هنا")}
                    </div>
                  </div>
                </button>
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center min-h-[46px]">
                  {vehicleData.logo ? (
                    <img
                      src={vehicleData.logo}
                      alt="Car logo"
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <Car className="w-8 h-8 text-gray-400" />
                  )}
                </div>
              )}
            </div>

            {/* Vehicle Type */}
            <div className="flex-1">
              <RadioGroup
                label="نوع السيارة"
                value={isEditing ? form.values.carType : vehicleData.carType}
                onChange={(value) =>
                  isEditing ? form.setFieldValue("carType", value) : undefined
                }
                options={carTypes}
                disabled={!isEditing}
              />
            </div>

            {/* Fuel Type */}
            <div className="flex-1">
              <RadioGroup
                label="نوع البنزين"
                value={isEditing ? form.values.fuelType : vehicleData.fuelType}
                onChange={(value) =>
                  isEditing ? form.setFieldValue("fuelType", value) : undefined
                }
                options={fuelTypes}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Row 2: Brand, Model, Year */}
          <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            {/* Brand */}
            <div className="flex-1">
              {isEditing ? (
                <Select
                  label="الماركة"
                  value={form.values.brand}
                  onChange={(value) => {
                    if (value === "__ADD_NEW_BRAND__") {
                      // Handle add new brand (could open modal)
                      form.setFieldValue("brand", "");
                    } else {
                      form.setFieldValue("brand", value);
                    }
                  }}
                  error={form.errors.brand}
                  required={true}
                  options={brandOptions}
                  placeholder="اختر الماركة"
                />
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                    الماركة
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal min-h-[46px] flex items-center">
                    {vehicleData.brand}
                  </div>
                </div>
              )}
            </div>

            {/* Model */}
            <div className="flex-1">
              {isEditing ? (
                <Input
                  label="الطراز"
                  value={form.values.model}
                  onChange={(value) => form.setFieldValue("model", value)}
                  error={form.errors.model}
                  required={true}
                  placeholder="اكتب الطراز هنا"
                />
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                    الطراز
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal min-h-[46px] flex items-center">
                    {vehicleData.model}
                  </div>
                </div>
              )}
            </div>

            {/* Year */}
            <div className="flex-1">
              {isEditing ? (
                <Select
                  label="سنة الاصدار"
                  value={form.values.year}
                  onChange={(value) => form.setFieldValue("year", value)}
                  error={form.errors.year}
                  required={true}
                  options={yearOptions}
                />
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                    سنة الاصدار
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal min-h-[46px] flex items-center">
                    {vehicleData.year}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center justify-end gap-3 mt-4">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form to original values
                    form.setFieldValue("brand", vehicleData.brand);
                    form.setFieldValue("model", vehicleData.model);
                    form.setFieldValue("year", vehicleData.year);
                    form.setFieldValue("fuelType", vehicleData.fuelType);
                    form.setFieldValue("logo", null);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  disabled={form.isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {form.isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      حفظ التغييرات
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-[#FFC107] hover:bg-[#FFB300] text-white font-medium transition-colors"
              >
                <Edit className="w-4 h-4" />
                تعديل البيانات
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default VehicleDetails;
