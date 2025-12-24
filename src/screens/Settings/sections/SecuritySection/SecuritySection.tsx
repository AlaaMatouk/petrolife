import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { auth } from "../../../../config/firebase";
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from "firebase/auth";
import { useToast } from "../../../../context/ToastContext";

export const SecuritySection = (): JSX.Element => {
  const { addToast } = useToast();
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

  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      addToast({
        title: "خطأ",
        message: "يرجى ملء جميع الحقول",
        type: "error",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      addToast({
        title: "خطأ",
        message: "كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقتين",
        type: "error",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      addToast({
        title: "خطأ",
        message: "كلمة المرور يجب أن تكون على الأقل 6 أحرف",
        type: "error",
      });
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      addToast({
        title: "خطأ",
        message: "كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية",
        type: "error",
      });
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      addToast({
        title: "خطأ",
        message: "المستخدم غير مسجل الدخول",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        user.email,
        formData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, formData.newPassword);

      // Reset form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      addToast({
        title: "نجح",
        message: "تم تغيير كلمة المرور بنجاح",
        type: "success",
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      
      let errorMessage = "حدث خطأ أثناء تغيير كلمة المرور";
      
      if (error.code === "auth/wrong-password") {
        errorMessage = "كلمة المرور الحالية غير صحيحة";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "كلمة المرور الجديدة ضعيفة جداً";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "يرجى تسجيل الخروج والدخول مرة أخرى قبل تغيير كلمة المرور";
      } else if (error.message) {
        errorMessage = error.message;
      }

      addToast({
        title: "خطأ",
        message: errorMessage,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-white rounded-lg border-2 border-gray-400 w-fit h-fit p-6" dir="rtl">
      <div className="relative flex items-center gap-2 mb-4">
        <h2 className="text-lg font-normal text-blue-600 relative z-10 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>الحماية والأمان</span>
        </h2>
      </div>

      <div className="flex flex-col gap-6 max-w-2xl">
        {/* First Row - Current Password (half width) */}
        <div className="flex flex-col gap-2 w-1/2">
          <label className="text-sm font-medium text-[var(--form-active-label-color)]">كلمة المرور الحالية</label>
          <div className="relative">
            <input
              type={showPasswords.current ? "text" : "password"}
              value={formData.currentPassword}
              onChange={(e) => handleInputChange("currentPassword", e.target.value)}
              placeholder="اكتب كلمة المرور الحالية"
              className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 text-right focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              dir="rtl"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("current")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPasswords.current ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Second Row - New Password and Confirm Password */}
        <div className="flex gap-6">
          {/* New Password */}
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-medium text-[var(--form-active-label-color)]">كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                placeholder="اكتب كلمة المرور الجديدة"
                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 text-right focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                dir="rtl"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-medium text-[var(--form-active-label-color)]">تأكيد كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="أكيد كلمة المرور الجديدة"
                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 text-right focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                dir="rtl"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
          </button>
        </div>
      </div>
    </div>
  );
};
