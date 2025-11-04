import { ArrowLeft, Info } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { RadioGroup } from "../../../../components/shared/Form";
import { CarFront, Truck } from "lucide-react";
import { Car } from "lucide-react";

// Mock vehicle data
const mockVehicleDetails = {
  id: "1",
  logo: "gdhhjdjdmdhjkkdjd.jpg",
  fuelType: "بنزين 91",
  vehicleType: "صغيرة",
  year: "2020",
  brand: "تيوتا",
  model: "كرولا",
};

const VehicleDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Helper function to get value or dash
  const getValueOrDash = (value: any): string => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    return String(value);
  };

  // Extract vehicle information
  const vehicleData = {
    carType: getValueOrDash(mockVehicleDetails.vehicleType),
    year: getValueOrDash(mockVehicleDetails.year),
    brand: getValueOrDash(mockVehicleDetails.brand),
    model: getValueOrDash(mockVehicleDetails.model),
    fuelType: getValueOrDash(mockVehicleDetails.fuelType),
    logo: getValueOrDash(mockVehicleDetails.logo),
  };

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
          {/* Row 1: Logo filename, Brand, Model */}
          <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            {/* Logo Filename */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                لوجو المركبة
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
                {vehicleData.logo}
              </div>
            </div>

            {/* Brand */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                الماركة
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
                {vehicleData.brand}
              </div>
            </div>

            {/* Model */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                الطراز
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
                {vehicleData.model}
              </div>
            </div>
          </div>

          {/* Row 2: Year, Vehicle Type, Fuel Type */}
          <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            {/* Year */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm font-medium text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                سنة الاصدار
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
                {vehicleData.year}
              </div>
            </div>

            {/* Vehicle Type */}
            <div className="flex-1">
              <RadioGroup
                label="نوع السيارة"
                value={vehicleData.carType}
                onChange={() => {}} // Read-only
                options={carTypes}
                disabled={true}
              />
            </div>

            {/* Fuel Type */}
            <div className="flex-1">
              <RadioGroup
                label="نوع البنزين"
                value={vehicleData.fuelType}
                onChange={() => {}} // Read-only
                options={fuelTypes}
                disabled={true}
              />
            </div>
          </div>

          {/* Edit Button */}
          <div className="w-full flex items-center justify-end mt-4">
            <button
              onClick={() => {
                // Navigate to edit page or enable edit mode
                console.log("Edit vehicle:", id);
              }}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-[#FFC107] hover:bg-[#FFB300] text-white font-medium transition-colors"
            >
              تعديل البيانات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;
