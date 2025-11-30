import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const SecuritySection = (): JSX.Element => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    if (formData.newPassword !== formData.confirmPassword) {
      alert("كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقتين");
      return;
    }
    console.log("Saving password:", formData);
    // TODO: Implement save functionality
  };

  return (
    <div className="flex flex-col gap-6 bg-white rounded-lg border border-[color:var(--border-subtle)] p-6" dir="rtl">
      <div className="relative flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)] relative z-10 flex items-center gap-2">
          <span>الحماية والأمان</span>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </h2>
      </div>

      <div className="flex flex-col gap-6 max-w-2xl">
        {/* Current Password */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--form-active-label-color)]">كلمة المرور الحالية</label>
          <div className="relative">
            <input
              type={showPasswords.current ? "text" : "password"}
              value={formData.currentPassword}
              onChange={(e) => handleInputChange("currentPassword", e.target.value)}
              placeholder="اكتب كلمة المرور الحالية"
              className="w-full px-4 py-2 pl-12 border border-[color:var(--border-subtle)] rounded-lg bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="rtl"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("current")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPasswords.current ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--form-active-label-color)]">كلمة المرور الجديدة</label>
          <div className="relative">
            <input
              type={showPasswords.new ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
              placeholder="اكتب كلمة المرور الجديدة"
              className="w-full px-4 py-2 pl-12 border border-[color:var(--border-subtle)] rounded-lg bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="rtl"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("new")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPasswords.new ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--form-active-label-color)]">تأكيد كلمة المرور الجديدة</label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              placeholder="تأكيد كلمة المرور الجديدة"
              className="w-full px-4 py-2 pl-12 border border-[color:var(--border-subtle)] rounded-lg bg-white text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="rtl"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirm")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPasswords.confirm ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            حفظ كلمة المرور الجديدة
          </button>
        </div>
      </div>
    </div>
  );
};
