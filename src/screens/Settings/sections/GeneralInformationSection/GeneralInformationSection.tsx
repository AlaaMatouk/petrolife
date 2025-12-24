import React, { useState, useEffect } from "react";
import { Camera, Building2 } from "lucide-react";
import { useAuth } from "../../../../hooks/useGlobalState";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import { useToast } from "../../../../context/ToastContext";

export const GeneralInformationSection = (): JSX.Element => {
  const { company, setCompany } = useAuth();
  const { addToast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    tradeName: "",
    email: "",
    phone: "",
    commercialRegister: "",
    vatNumber: "",
    city: "",
    address: "",
  });

  const [logo, setLogo] = useState<string | null>(null);
  const [originalFormData, setOriginalFormData] = useState(formData);

  // Initialize form data from company data
  useEffect(() => {
    if (company) {
      const initialData = {
        companyName: company.name || "",
        tradeName: company.brandName || company.name || "",
        email: company.email || "",
        phone: company.phoneNumber || "",
        commercialRegister: company.commercialRegistrationNumber || "",
        vatNumber: company.vatNumber || "",
        city: company.formattedLocation?.address?.city || company.city || "",
        address: company.address || "",
      };
      setFormData(initialData);
      setOriginalFormData(initialData);
      
      // Set logo if available
      if (company.logo) {
        setLogo(company.logo);
      }
    }
  }, [company]);

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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(originalFormData);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!company) {
      addToast({
        title: "خطأ",
        message: "لا يمكن حفظ البيانات",
        type: "error",
      });
      return;
    }

    // Company document ID can be either company.id or company.email
    const companyDocId = company.id || company.email;
    if (!companyDocId) {
      addToast({
        title: "خطأ",
        message: "لا يمكن حفظ البيانات - معرف الشركة غير موجود",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      const companyDocRef = doc(db, "companies", companyDocId);
      
      // Prepare update data
      const updateData: any = {
        name: formData.companyName,
        brandName: formData.tradeName,
        email: formData.email,
        phoneNumber: formData.phone,
        commercialRegistrationNumber: formData.commercialRegister,
        vatNumber: formData.vatNumber,
        address: formData.address,
      };

      // Update city in formattedLocation if it exists
      if (company.formattedLocation) {
        updateData.formattedLocation = {
          ...company.formattedLocation,
          address: {
            ...(company.formattedLocation.address || {}),
            city: formData.city,
          },
        };
      } else if (formData.city) {
        updateData.formattedLocation = {
          address: {
            city: formData.city,
            country: "Saudi Arabia",
            countryCode: "SA",
          },
        };
      }

      // Update logo if changed
      if (logo && logo !== company.logo) {
        updateData.logo = logo;
      }

      await updateDoc(companyDocRef, updateData);

      // Update local company state
      const updatedCompany = {
        ...company,
        ...updateData,
      };
      setCompany(updatedCompany);
      setOriginalFormData(formData);
      setIsEditing(false);

      addToast({
        title: "نجح",
        message: "تم حفظ التغييرات بنجاح",
        type: "success",
      });
    } catch (error) {
      console.error("Error saving company data:", error);
      addToast({
        title: "خطأ",
        message: "حدث خطأ أثناء حفظ البيانات",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-white rounded-lg border border-[color:var(--border-subtle)] p-6" dir="rtl">
      <div className="relative mb-4">
        <div className="absolute right-0 top-0 w-0 h-0 border-t-[24px] border-t-blue-500 border-l-[24px] border-l-transparent rounded-tl-lg" />
        <h2 className="text-xl font-normal text-blue-600 relative z-10 flex items-center gap-2 pr-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>المعلومات العامة</span>
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
            disabled={!isEditing}
            className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg transition-colors ${
              isEditing
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-gray-50 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span className="text-sm font-medium">تغيير اللوجو</span>
          </button>
        </div>

        {/* Company Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--form-active-label-color)]">اسم الشركة</label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => handleInputChange("companyName", e.target.value)}
            readOnly={!isEditing}
            className={`px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isEditing
                ? "bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)]"
                : "bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
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
            readOnly={!isEditing}
            className={`px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isEditing
                ? "bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)]"
                : "bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
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
            readOnly={!isEditing}
            className={`px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isEditing
                ? "bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)]"
                : "bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
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
            readOnly={!isEditing}
            className={`px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isEditing
                ? "bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)]"
                : "bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
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
            readOnly={!isEditing}
            className={`px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isEditing
                ? "bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)]"
                : "bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
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
            readOnly={!isEditing}
            className={`px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isEditing
                ? "bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)]"
                : "bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
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
            readOnly={!isEditing}
            className={`px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isEditing
                ? "bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)]"
                : "bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
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
            readOnly={!isEditing}
            className={`px-4 py-2 border border-[color:var(--border-subtle)] rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isEditing
                ? "bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)]"
                : "bg-gray-50 text-gray-600 cursor-not-allowed"
            }`}
            dir="rtl"
          />
        </div>
      </div>

      {/* Edit/Save Button */}
      <div className="flex justify-end gap-3 mt-4">
        {isEditing ? (
          <>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </>
        ) : (
          <button
            onClick={handleEdit}
            className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors"
          >
            تعديل
          </button>
        )}
      </div>
    </div>
  );
};
