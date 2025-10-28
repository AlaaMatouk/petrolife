import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../../context/ToastContext";
import { ArrowLeft } from "lucide-react";
import {
  addServiceProvider,
  AddServiceProviderData,
} from "../../../../services/firestore";
import { db } from "../../../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export const AddServiceProvider = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    brandName: "",
    commercialRegistrationNumber: "",
    vatNumber: "",
    address: "",
    location: "",
    // Address fields
    city: "الرياض",
    country: "Saudi Arabia",
    countryCode: "SA",
    highway: "",
    postcode: "",
    road: "",
    state: "",
    stateDistrict: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);
  const [taxCertificateFile, setTaxCertificateFile] = useState<File | null>(
    null
  );
  const [commercialRegistrationFile, setCommercialRegistrationFile] =
    useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validate form data
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push("اسم مزود الخدمة مطلوب");
    }

    if (!formData.email.trim()) {
      errors.push("البريد الإلكتروني مطلوب");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("البريد الإلكتروني غير صحيح");
    }

    if (!formData.phoneNumber.trim()) {
      errors.push("رقم الهاتف مطلوب");
    }

    if (!formData.password.trim()) {
      errors.push("كلمة المرور مطلوبة");
    } else if (formData.password.length < 6) {
      errors.push("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    }

    if (!formData.brandName.trim()) {
      errors.push("اسم العلامة التجارية مطلوب");
    }

    if (!logoFile) {
      errors.push("لوجو مزود الخدمة مطلوب");
    }

    return errors;
  };

  // Check if email already exists
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const stationsCompanyRef = collection(db, "stationscompany");
      const q = query(stationsCompanyRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      addToast({
        title: "خطأ في التحقق",
        message: validationErrors.join(", "),
        type: "error",
      });
      return;
    }

    // Check if email already exists
    const emailExists = await checkEmailExists(formData.email);
    if (emailExists) {
      addToast({
        title: "خطأ في البيانات",
        message: "البريد الإلكتروني مستخدم بالفعل",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare service provider data for the service function
      const providerData: AddServiceProviderData = {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        brandName: formData.brandName,
        commercialRegistrationNumber: formData.commercialRegistrationNumber,
        vatNumber: formData.vatNumber,
        address: formData.address,
        location: formData.location,
        city: formData.city,
        country: formData.country,
        countryCode: formData.countryCode,
        highway: formData.highway,
        postcode: formData.postcode,
        road: formData.road,
        state: formData.state,
        stateDistrict: formData.stateDistrict,
        logoFile: logoFile,
        addressFile: addressFile,
        taxCertificateFile: taxCertificateFile,
        commercialRegistrationFile: commercialRegistrationFile,
      };

      // Call the addServiceProvider service function
      await addServiceProvider(providerData);

      // Success message
      addToast({
        title: "تم بنجاح",
        message: "تم إضافة مزود الخدمة بنجاح",
        type: "success",
      });

      // Clear form
      setFormData({
        name: "",
        email: "",
        phoneNumber: "",
        password: "",
        brandName: "",
        commercialRegistrationNumber: "",
        vatNumber: "",
        address: "",
        location: "",
        city: "الرياض",
        country: "Saudi Arabia",
        countryCode: "SA",
        highway: "",
        postcode: "",
        road: "",
        state: "",
        stateDistrict: "",
      });
      setLogoFile(null);
      setAddressFile(null);
      setTaxCertificateFile(null);
      setCommercialRegistrationFile(null);

      // Navigate back to service providers list
      navigate("/service-providers");
    } catch (error) {
      console.error("Error adding service provider:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "فشل في إضافة مزود الخدمة. يرجى المحاولة مرة أخرى.";
      addToast({
        title: "خطأ",
        message: errorMessage,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/service-providers");
  };

  return (
    <div className="flex flex-col items-start gap-5 relative">
      <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
        {/* Header with Back Button */}
        <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
          <nav className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <button
              onClick={handleCancel}
              className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto] hover:opacity-80 transition-opacity"
              aria-label="العودة"
            >
              <div className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </div>
            </button>

            <div className="flex items-center justify-end gap-1.5 relative">
              <h1 className="font-bold text-[var(--form-section-title-color)] text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap relative [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
                إضافة مزود خدمة جديد
              </h1>
            </div>
          </nav>
        </header>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-6 w-full" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Service Provider Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                اسم مزود الخدمة
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="اسم مزود الخدمة هنا"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                البريد الالكتروني
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="test@gmail.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                رقم الهاتف
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="رقم الهاتف هنا"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                كلمة المرور (لحساب مزود الخدمة)
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="ضع كلمة المرور هنا"
              />
            </div>

            {/* Brand Name */}
            <div>
              <label
                htmlFor="brandName"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                اسم العلامة التجارية
              </label>
              <input
                type="text"
                id="brandName"
                name="brandName"
                value={formData.brandName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="ادخل اسم العلامة هنا"
              />
            </div>

            {/* Commercial Registration Number */}
            <div>
              <label
                htmlFor="commercialRegistrationNumber"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                رقم السجل التجاري
              </label>
              <input
                type="text"
                id="commercialRegistrationNumber"
                name="commercialRegistrationNumber"
                value={formData.commercialRegistrationNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="ادخل رقم السجل التجاري هنا"
              />
            </div>

            {/* VAT Number */}
            <div>
              <label
                htmlFor="vatNumber"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                رقم ضريبة القيمة المضافة
              </label>
              <input
                type="text"
                id="vatNumber"
                name="vatNumber"
                value={formData.vatNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="ادخل رقم ضريبة القيمة المضافة هنا"
              />
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                العنوان
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="العنوان بالتفصيل هنا"
              />
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                الموقع (رابط خرائط جوجل)
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="مثال: https://www.google.com/maps?q=24.620178,46.709404"
              />
            </div>

            {/* Address Details Section Header */}
            <div className="col-span-full">
              <h3 className="text-lg font-semibold text-[#5B738B] mb-2 text-right">
                تفاصيل العنوان المنسق
              </h3>
            </div>

            {/* City */}
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                المدينة
              </label>
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 text-[#5B738B]  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              >
                <option value="الرياض">الرياض</option>
                <option value="جدة">جدة</option>
                <option value="مكة المكرمة">مكة المكرمة</option>
                <option value="المدينة المنورة">المدينة المنورة</option>
                <option value="الدمام">الدمام</option>
                <option value="الخبر">الخبر</option>
                <option value="الطائف">الطائف</option>
                <option value="أبها">أبها</option>
                <option value="تبوك">تبوك</option>
                <option value="بريدة">بريدة</option>
                <option value="حائل">حائل</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label
                htmlFor="country"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                الدولة
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="الدولة"
              />
            </div>

            {/* Country Code */}
            <div>
              <label
                htmlFor="countryCode"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                كود الدولة
              </label>
              <input
                type="text"
                id="countryCode"
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="مثال: SA"
              />
            </div>

            {/* State */}
            <div>
              <label
                htmlFor="state"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                المنطقة/الولاية
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="المنطقة/الولاية"
              />
            </div>

            {/* State District */}
            <div>
              <label
                htmlFor="stateDistrict"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                الحي/المقاطعة
              </label>
              <input
                type="text"
                id="stateDistrict"
                name="stateDistrict"
                value={formData.stateDistrict}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="الحي/المقاطعة"
              />
            </div>

            {/* Highway */}
            <div>
              <label
                htmlFor="highway"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                الطريق السريع
              </label>
              <input
                type="text"
                id="highway"
                name="highway"
                value={formData.highway}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="الطريق السريع"
              />
            </div>

            {/* Road */}
            <div>
              <label
                htmlFor="road"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                الشارع
              </label>
              <input
                type="text"
                id="road"
                name="road"
                value={formData.road}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="الشارع"
              />
            </div>

            {/* Postcode */}
            <div>
              <label
                htmlFor="postcode"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                الرمز البريدي
              </label>
              <input
                type="text"
                id="postcode"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="الرمز البريدي"
              />
            </div>

            {/* Empty cell for alignment */}
            <div></div>

            {/* Logo */}
            <div>
              <label
                htmlFor="providerLogo"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                لوجو مزود الخدمة
              </label>
              <input
                type="file"
                id="providerLogo"
                name="providerLogo"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              />
            </div>

            {/* Address File */}
            <div>
              <label
                htmlFor="addressFile"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                ملف العنوان
              </label>
              <input
                type="file"
                id="addressFile"
                name="addressFile"
                accept=".pdf,.doc,.docx,image/*"
                onChange={(e) => setAddressFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              />
            </div>

            {/* Tax Certificate File */}
            <div>
              <label
                htmlFor="taxCertificateFile"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                شهادة الضرائب
              </label>
              <input
                type="file"
                id="taxCertificateFile"
                name="taxCertificateFile"
                accept=".pdf,.doc,.docx,image/*"
                onChange={(e) =>
                  setTaxCertificateFile(e.target.files?.[0] || null)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              />
            </div>

            {/* Commercial Registration File */}
            <div>
              <label
                htmlFor="commercialRegistrationFile"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                السجل التجاري
              </label>
              <input
                type="file"
                id="commercialRegistrationFile"
                name="commercialRegistrationFile"
                accept=".pdf,.doc,.docx,image/*"
                onChange={(e) =>
                  setCommercialRegistrationFile(e.target.files?.[0] || null)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-[10px] py-3 bg-gray-500 text-white rounded-[8px] hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-[10px] py-3 bg-[#5A66C1] text-white rounded-[8px] hover:bg-[#4A56B1] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري الإضافة...
                </>
              ) : (
                "إضافة مزود الخدمة"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
