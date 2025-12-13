import { Car, CarFront, Truck, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useForm } from "../../../../hooks/useForm";
import { useToast } from "../../../../context/ToastContext";
import { useCars } from "../../../../hooks/useGlobalState";
import { Input, Select, RadioGroup, CarNumberInput } from "../../../../components/shared/Form";
import { addCompanyCar, fetchCarModels, fetchCarTypes } from "../../../../services/firestore";
import { useNavigate } from "react-router-dom";

const initialValues = {
  carName: "",
    fuelType: "بنزين 91",
    carType: "صغيرة",
    city: "الرياض",
    year: "2020",
    model: "",
    brand: "",
  plateLetters: "",
  plateNumbers: "",
    carCondition: "دبلوماسية",
};

export const VehicleFormSection = (): JSX.Element => {
  const form = useForm(initialValues);
  const { addToast } = useToast();
  const { addCar } = useCars();
  const navigate = useNavigate();

  // State for brands and models
  const [brandOptions, setBrandOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [modelOptions, setModelOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [allCarTypes, setAllCarTypes] = useState<any[]>([]);


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

  const cityOptions = [
    { value: "الرياض", label: "الرياض" },
    { value: "جدة", label: "جدة" },
    { value: "الدمام", label: "الدمام" },
    { value: "مكة المكرمة", label: "مكة المكرمة" },
    { value: "المدينة المنورة", label: "المدينة المنورة" },
  ];

  const yearOptions = Array.from({ length: 25 }, (_, i) => {
    const year = new Date().getFullYear() - 10 + i;
    return { value: year.toString(), label: year.toString() };
  });

  // Load brands from Firestore on component mount
  useEffect(() => {
    const loadBrands = async () => {
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
          .sort((a, b) => a.label.localeCompare(b.label));

        // Remove duplicates
        const uniqueBrands = Array.from(
          new Map(brands.map((brand) => [brand.value, brand])).values()
        );

        setBrandOptions(uniqueBrands);
      } catch (error) {
        console.error("Error loading car brands:", error);
        addToast({
          type: "error",
          title: "خطأ",
          message: "فشل في تحميل قائمة الماركات",
        });
      } finally {
        setIsLoadingBrands(false);
      }
    };

    loadBrands();
  }, [addToast]);

  // Load all car types once on mount
  useEffect(() => {
    const loadCarTypes = async () => {
      try {
        const carTypes = await fetchCarTypes();
        setAllCarTypes(carTypes);
      } catch (error) {
        console.error("Error loading car types:", error);
      }
    };

    loadCarTypes();
  }, []);

  // Load models when brand changes
  useEffect(() => {
    if (!form.values.brand || !allCarTypes.length) {
      setModelOptions([]);
      if (form.values.brand) {
        form.setFieldValue("model", "");
      }
      return;
    }

    setIsLoadingModels(true);
    try {
      // Filter car types by selected brand
      const filteredTypes = allCarTypes.filter((carType) => {
        const brandNameAr = carType.carModel?.name?.ar?.trim();
        return brandNameAr === form.values.brand;
      });

      // Extract model names
      const models = filteredTypes
        .map((carType) => {
          const nameAr = carType.name?.ar;
          if (nameAr && typeof nameAr === "string" && nameAr.trim()) {
            return {
              value: nameAr.trim(),
              label: nameAr.trim(),
            };
          }
          return null;
        })
        .filter(
          (model): model is { value: string; label: string } => model !== null
        )
        .sort((a, b) => a.label.localeCompare(b.label));

      // Remove duplicates
      const uniqueModels = Array.from(
        new Map(models.map((model) => [model.value, model])).values()
      );

      setModelOptions(uniqueModels);

      // Reset model selection when brand changes
      if (form.values.model) {
        const currentModelExists = uniqueModels.some(
          (m) => m.value === form.values.model
        );
        if (!currentModelExists) {
          form.setFieldValue("model", "");
        }
      }
    } catch (error) {
      console.error("Error filtering models:", error);
    } finally {
      setIsLoadingModels(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.brand, allCarTypes]);

  const carConditionOptions = [
    { value: "دبلوماسية", label: "دبلوماسية" },
    { value: "خاصة", label: "خاصة" },
    { value: "تجارية", label: "تجارية" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // VALIDATION TEMPORARILY DISABLED FOR TESTING
    console.log('Form values:', form.values);
    
    // if (!form.validateForm()) {
    //   addToast({
    //     title: "خطأ في التحقق",
    //     message: "يرجى تصحيح الأخطاء في النموذج",
    //     type: "error",
    //   });
    //   return;
    // }

    form.setIsSubmitting(true);

    try {
      // Prepare car data for Firestore
      const carData = {
        carName: form.values.carName,
        fuelType: form.values.fuelType,
        carType: form.values.carType,
        city: form.values.city,
        year: form.values.year,
        model: form.values.model,
        brand: form.values.brand,
        plateLetters: form.values.plateLetters,
        plateNumbers: form.values.plateNumbers,
        carCondition: form.values.carCondition,
      };

      console.log('Submitting car data to Firestore:', carData);

      // Add car to Firestore
      const result = await addCompanyCar(carData);

      console.log('Car added to Firestore:', result);

      // Also add to local state for immediate UI update
      const newCar = {
        id: result.id,
        carNumber: form.values.plateLetters + form.values.plateNumbers,
        carName: form.values.carName,
        brand: form.values.brand,
        model: form.values.model,
        year: form.values.year,
        fuelType: form.values.fuelType,
        category: {
          name: form.values.carType,
          icon: getCategoryIcon(form.values.carType),
        },
        drivers: [],
      };

      addCar(newCar);

      // Show success message
      addToast({
        title: "تم إضافة السيارة بنجاح",
        message: `تم إضافة السيارة ${form.values.carName} إلى Firestore بنجاح`,
        type: "success",
      });

      // Reset form
      form.resetForm();

      // Navigate back to cars list
      setTimeout(() => {
        navigate('/cars');
      }, 1000);

    } catch (error: any) {
      console.error('Error adding car:', error);
      addToast({
        title: "خطأ في إضافة السيارة",
        message: error.message || "حدث خطأ أثناء إضافة السيارة. يرجى المحاولة مرة أخرى.",
        type: "error",
      });
    } finally {
      form.setIsSubmitting(false);
    }
  };

  return (
    <form
      className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col items-start gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
          {/* Car Name Field */}
          <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            <Input
              label="اسم السيارة"
              value={form.values.carName}
              onChange={(value) => form.setFieldValue('carName', value)}
              error={form.errors.carName}
              required={true}
                    placeholder="اسم السيارة هنا"
                  />
          </div>

          {/* Fuel Type, Car Type, and City Row */}
          <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            <RadioGroup
              label="نوع البنزين"
              value={form.values.fuelType}
              onChange={(value) => form.setFieldValue('fuelType', value)}
              error={form.errors.fuelType}
              required={true}
              options={fuelTypes}
            />

            <RadioGroup
              label="نوع السيارة"
              value={form.values.carType}
              onChange={(value) => form.setFieldValue('carType', value)}
              error={form.errors.carType}
              required={true}
              options={carTypes}
            />

            <Select
              label="مدينة السيارة"
              value={form.values.city}
              onChange={(value) => form.setFieldValue('city', value)}
              error={form.errors.city}
              required={true}
              options={cityOptions}
            />
            </div>

          {/* Year, Model, and Brand Row */}
          <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            <Select
              label="سنة الإصدار"
              value={form.values.year}
              onChange={(value) => form.setFieldValue('year', value)}
              error={form.errors.year}
              required={true}
              options={yearOptions}
            />

            <Select
              label="الطراز"
              value={form.values.model}
              onChange={(value) => form.setFieldValue('model', value)}
              error={form.errors.model}
              required={true}
              options={modelOptions}
              disabled={!form.values.brand || isLoadingModels}
              placeholder={
                isLoadingModels
                  ? "جاري التحميل..."
                  : !form.values.brand
                  ? "اختر الماركة أولاً"
                  : modelOptions.length === 0
                  ? "لا توجد طرازات متاحة"
                  : "اختر الطراز"
              }
            />

            <Select
              label="الماركة"
              value={form.values.brand}
              onChange={(value) => {
                form.setFieldValue('brand', value);
                // Reset model when brand changes
                form.setFieldValue('model', '');
              }}
              error={form.errors.brand}
              required={true}
              options={brandOptions}
              disabled={isLoadingBrands}
              placeholder={
                isLoadingBrands
                  ? "جاري التحميل..."
                  : brandOptions.length === 0
                  ? "لا توجد ماركات متاحة"
                  : "اختر الماركة"
              }
            />
            </div>

          {/* Car Number and Car Condition Row */}
          <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
          <div className="w-[33%]"></div>

            <CarNumberInput
              label="رقم السيارة"
              lettersValue={form.values.plateLetters}
              numbersValue={form.values.plateNumbers}
              onLettersChange={(value) => form.setFieldValue('plateLetters', value)}
              onNumbersChange={(value) => form.setFieldValue('plateNumbers', value)}
              lettersError={form.errors.plateLetters}
              numbersError={form.errors.plateNumbers}
              required={true}
              lettersPlaceholder="الحروف"
              numbersPlaceholder="الأرقام"
            />

            <Select
              label="حالة السيارة"
              value={form.values.carCondition}
              onChange={(value) => form.setFieldValue('carCondition', value)}
              error={form.errors.carCondition}
              required={true}
              options={carConditionOptions}
            />
          </div>

          <button
            type="submit"
            disabled={form.isSubmitting}
            className={`inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] transition-opacity ${
              form.isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-color-mode-surface-primary-blue hover:opacity-90'
            }`}
          >
            <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
              {form.isSubmitting && (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              )}
              <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-color-mode-text-icons-t-btn-negative text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
                {form.isSubmitting ? 'جاري الإضافة...' : 'إضافة السيارة'}
              </div>
            </div>
          </button>
        </div>
      </div>
    </form>
  );
};

// Helper function to get category icon
const getCategoryIcon = (carType: string): string => {
  const iconMap: Record<string, string> = {
    'صغيرة': '/img/small-car.svg',
    'متوسطة': '/img/medium-car.svg',
    'كبيرة': '/img/large-car.svg',
    'Vip': '/img/vip-car.svg',
  };
  return iconMap[carType] || '/img/default-car.svg';
};