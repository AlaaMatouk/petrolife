import React, { useState } from "react";
import { Camera, Building2 } from "lucide-react";

export const GeneralInformationSection = (): JSX.Element => {
  const [formData, setFormData] = useState({
    companyName: "الشركة المتحدة العالمية",
    tradeName: "اورماك - ORMAK",
    email: "hesham@gmail.com",
    phone: "21546354",
    commercialRegister: "1009092520",
    vatNumber: "3105968400003",
    city: "الرياض",
    address: "Riyadh 13245, Saudi Arabia الصائن، 7453، حي قرطبة",
  });

  const [logo, setLogo] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogo(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSave = () => {
    console.log("Saving general information:", formData);
    // TODO: Implement save functionality
  };

  return (
    <div className="flex flex-col gap-6 bg-white rounded-lg border border-[color:var(--border-subtle)] p-6" dir="rtl">
      <div className="relative mb-4">
        <div className="absolute right-0 top-0 w-0 h-0 border-t-[24px] border-t-blue-500 border-l-[24px] border-l-transparent rounded-tl-lg" />
        <h2 className="text-xl font-bold text-[var(--text-primary)] relative z-10 flex items-center gap-2 pr-2">
          <span>المعلومات العامة</span>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo Section */}
        <div className="md:col-span-2 flex items-end gap-4">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
            {logo ? (
              <img src={logo} alt="Company Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <button
            onClick={handleLogoChange}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
          >
            <Camera className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">تغيير اللوجو</span>
          </button>
        </div>

        {/* Company Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--form-active-label-color)]">اسم الشركة</label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => handleInputChange("companyName", e.target.value)}
            className="px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="rtl"
          />
        </div>

        {/* Trade Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--form-active-label-color)]">اسم العلامة التجارية</label>
          <input
            type="text"
            value={formData.tradeName}
            onChange={(e) => handleInputChange("tradeName", e.target.value)}
            className="px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="rtl"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--form-active-label-color)]">البريد الالكتروني</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="rtl"
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--form-active-label-color)]">رقم الهاتف</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className="px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="rtl"
          />
        </div>

        {/* Commercial Register */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--form-active-label-color)]">رقم السجل التجاري</label>
          <input
            type="text"
            value={formData.commercialRegister}
            onChange={(e) => handleInputChange("commercialRegister", e.target.value)}
            className="px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="rtl"
          />
        </div>

        {/* VAT Number */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--form-active-label-color)]">رقم ضريبة القيمة المضافة</label>
          <input
            type="text"
            value={formData.vatNumber}
            onChange={(e) => handleInputChange("vatNumber", e.target.value)}
            className="px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="rtl"
          />
        </div>

        {/* City */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--form-active-label-color)]">المدينة</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
            className="px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="rtl"
          />
        </div>

        {/* Address */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--form-active-label-color)]">العنوان</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            className="px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="rtl"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-4">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          حفظ التغييرات
        </button>
      </div>
    </div>
  );
};
