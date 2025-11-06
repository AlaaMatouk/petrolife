import React, { useState } from "react";
import { useForm } from "../../../../hooks/useForm";
import { Settings, Camera, Lock, Eye, EyeOff, Loader2, User } from "lucide-react";

const initialGeneralInfo = {
  adminName: "محمد احمد",
  phoneNumber: "21546354",
  city: "الرياض",
  address: "الصائن، 7453، حي قرطبة, Riyadh 13245, Saudi Arabia",
  employeeId: "2153652648",
  email: "hesham@gmail.com",
  accountCreationDate: "12 فبراير 2025, 10:15 ص",
  jobTitle: "رئيس مجلس الإدارة",
};

const initialPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

// Custom Input Field Component
interface CustomInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "tel" | "email";
  disabled?: boolean;
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}) => {
  return (
    <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
      <label className="self-stretch font-normal text-[var(--form-active-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
        <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
          {label}
        </span>
      </label>
      <div className="relative w-full">
        <div
          className={`flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid transition-colors ${
            disabled
              ? "border-color-mode-text-icons-t-placeholder bg-gray-50"
              : "border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus-within:border-color-mode-text-icons-t-blue"
          }`}
        >
          <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
            <input
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="text-right relative w-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const generalForm = useForm(initialGeneralInfo);
  const passwordForm = useForm(initialPasswordForm);

  const handleEditData = async (e: React.FormEvent) => {
    e.preventDefault();
    generalForm.setIsSubmitting(true);
    try {
      // TODO: Save general info
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsEditing(false);
      generalForm.setIsSubmitting(false);
    } catch (error) {
      generalForm.setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    passwordForm.setIsSubmitting(true);
    try {
      // TODO: Change password
      await new Promise((resolve) => setTimeout(resolve, 1000));
      passwordForm.resetForm();
      passwordForm.setIsSubmitting(false);
    } catch (error) {
      passwordForm.setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto]"
      dir="rtl"
    >
      {/* General Information Section */}
      <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-color-mode-text-icons-t-blue" />
          <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
            المعلومات العامة
          </h2>
        </div>

        {/* Profile Picture Section */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Camera className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">تغيير اللوجو</span>
          </button>
        </div>

        {/* Form Fields - Two Columns */}
        <form onSubmit={handleEditData} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Left Column */}
            <div className="flex flex-col gap-5">
              <CustomInput
                label="اسم الأدمن"
                value={generalForm.values.adminName}
                onChange={(value) => generalForm.setFieldValue("adminName", value)}
                disabled={!isEditing}
              />
              <CustomInput
                label="المدينة"
                value={generalForm.values.city}
                onChange={(value) => generalForm.setFieldValue("city", value)}
                disabled={!isEditing}
              />
              <CustomInput
                label="الرقم الوظيفي"
                value={generalForm.values.employeeId}
                onChange={(value) => generalForm.setFieldValue("employeeId", value)}
                disabled={!isEditing}
              />
              <CustomInput
                label="البريد الالكتروني"
                value={generalForm.values.email}
                onChange={(value) => generalForm.setFieldValue("email", value)}
                type="email"
                disabled={!isEditing}
              />
              <CustomInput
                label="تاريخ انشاء الحساب"
                value={generalForm.values.accountCreationDate}
                onChange={(value) => generalForm.setFieldValue("accountCreationDate", value)}
                disabled={!isEditing}
              />
              <CustomInput
                label="المسمى الوظيفي"
                value={generalForm.values.jobTitle}
                onChange={(value) => generalForm.setFieldValue("jobTitle", value)}
                disabled={!isEditing}
              />
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-5">
              <CustomInput
                label="رقم الهاتف"
                value={generalForm.values.phoneNumber}
                onChange={(value) => generalForm.setFieldValue("phoneNumber", value)}
                type="tel"
                disabled={!isEditing}
              />
              <CustomInput
                label="العنوان"
                value={generalForm.values.address}
                onChange={(value) => generalForm.setFieldValue("address", value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Edit Button */}
          <div className="flex items-center justify-end">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-8 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                تعديل البيانات
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    generalForm.resetForm();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={generalForm.isSubmitting}
                  className={`px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    generalForm.isSubmitting
                      ? "bg-gray-200 cursor-not-allowed text-gray-400"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  }`}
                >
                  {generalForm.isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  حفظ التعديلات
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-color-mode-text-icons-t-blue" />
          <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
            تغيير كلمة المرور
          </h2>
        </div>

        {/* Password Form */}
        <form onSubmit={handleChangePassword} className="w-full">
          <div className="flex flex-col gap-5 mb-6">
            {/* Current Password */}
            <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
              <label className="self-stretch font-normal text-[var(--form-active-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                  كلمة المرور الحالية
                </span>
              </label>
              <div className="relative w-full">
                <div className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus-within:border-color-mode-text-icons-t-blue transition-colors">
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.values.currentPassword}
                      onChange={(e) =>
                        passwordForm.setFieldValue("currentPassword", e.target.value)
                      }
                      placeholder="اكتب كلمة المرور الحالية هنا"
                      className="text-right relative w-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* New Password */}
            <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
              <label className="self-stretch font-normal text-[var(--form-active-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                  كلمة المرور الجديدة
                </span>
              </label>
              <div className="relative w-full">
                <div className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus-within:border-color-mode-text-icons-t-blue transition-colors">
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.values.newPassword}
                      onChange={(e) =>
                        passwordForm.setFieldValue("newPassword", e.target.value)
                      }
                      placeholder="اكتب كلمة المرور الجديدة هنا"
                      className="text-right relative w-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
              <label className="self-stretch font-normal text-[var(--form-active-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                  تأكيد كلمة المرور الجديدة
                </span>
              </label>
              <div className="relative w-full">
                <div className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus-within:border-color-mode-text-icons-t-blue transition-colors">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.values.confirmPassword}
                      onChange={(e) =>
                        passwordForm.setFieldValue("confirmPassword", e.target.value)
                      }
                      placeholder="تأكيد كلمة المرور الجديدة هنا"
                      className="text-right relative w-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Password Button */}
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={passwordForm.isSubmitting}
              className={`px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                passwordForm.isSubmitting
                  ? "bg-gray-200 cursor-not-allowed text-gray-400"
                  : "bg-gray-100 text-color-mode-text-icons-t-blue hover:bg-gray-200"
              }`}
            >
              {passwordForm.isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              حفظ كلمة المرور الجديدة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
