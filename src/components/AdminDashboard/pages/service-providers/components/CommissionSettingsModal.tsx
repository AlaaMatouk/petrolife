import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, DollarSign, Fuel, Save, Loader2 } from "lucide-react";
import {
  fetchCommissionSettings,
  updateCommissionSettings,
  CommissionSettings,
} from "../../../../../services/firestore";
import { useToast } from "../../../../../context/ToastContext";

interface CommissionSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const CommissionSettingsModal: React.FC<CommissionSettingsModalProps> = ({
  open,
  onClose,
}) => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState<CommissionSettings>({
    petrol: 0,
    diesel: 0,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ petrol?: string; diesel?: string }>({});

  // Fetch commission settings when modal opens
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchCommissionSettings();
      setSettings(data);
      setErrors({});
    } catch (error) {
      console.error("Error loading commission settings:", error);
      addToast({
        type: "error",
        title: "خطأ",
        message: "فشل في تحميل إعدادات العمولة",
      });
    } finally {
      setLoading(false);
    }
  };

  // Convert halala to riyals (1 riyal = 100 halala)
  const halalaToRiyals = (halala: number): number => {
    return halala / 100;
  };

  // Handle quick halala option selection
  const handleHalalaOption = (field: "petrol" | "diesel", halala: number) => {
    const riyals = halalaToRiyals(halala);
    setSettings((prev) => ({ ...prev, [field]: riyals }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // Handle direct riyal input
  const handleChange = (field: "petrol" | "diesel", value: string) => {

    const numValue = parseFloat(value);
    
    // Validate input
    if (value === "" || value === "-" || value === ".") {
      setSettings((prev) => ({ ...prev, [field]: 0 }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return;
    }

    if (isNaN(numValue)) {
      setErrors((prev) => ({ ...prev, [field]: "يجب إدخال رقم صحيح" }));
      return;
    }

    if (numValue < 0) {
      setErrors((prev) => ({ ...prev, [field]: "يجب أن تكون القيمة أكبر من أو تساوي صفر" }));
      return;
    }

    if (numValue > 1000) {
      setErrors((prev) => ({ ...prev, [field]: "القيمة كبيرة جداً (الحد الأقصى 1000)" }));
      return;
    }

    setSettings((prev) => ({ ...prev, [field]: numValue }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleSave = async () => {
    // Validate before saving
    const newErrors: { petrol?: string; diesel?: string } = {};
    
    if (settings.petrol < 0) {
      newErrors.petrol = "يجب أن تكون القيمة أكبر من أو تساوي صفر";
    }
    if (settings.diesel < 0) {
      newErrors.diesel = "يجب أن تكون القيمة أكبر من أو تساوي صفر";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      await updateCommissionSettings(settings.petrol, settings.diesel);
      addToast({
        type: "success",
        title: "نجح",
        message: "تم حفظ إعدادات العمولة بنجاح",
      });
      onClose();
    } catch (error) {
      console.error("Error saving commission settings:", error);
      addToast({
        type: "error",
        title: "خطأ",
        message: "فشل في حفظ إعدادات العمولة",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div
        dir="rtl"
        className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              إعدادات العمولة
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="mr-2 text-gray-600">جاري التحميل...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  أدخل قيمة العمولة لكل لتر بالريال السعودي (ر.س). سيتم تطبيق هذه القيم على الطلبات الجديدة.
                </p>
              </div>

              {/* Petrol Commission */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-green-600" />
                    <span>عمولة بنزين (ر.س لكل لتر)</span>
                  </div>
                </label>
                
                {/* Quick Halala Options */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-600">خيارات سريعة (هللة):</span>
                  <button
                    type="button"
                    onClick={() => handleHalalaOption("petrol", 0.5)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      settings.petrol === halalaToRiyals(0.5)
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    0.5 هللة
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHalalaOption("petrol", 1)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      settings.petrol === halalaToRiyals(1)
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    1 هللة
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHalalaOption("petrol", 1.5)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      settings.petrol === halalaToRiyals(1.5)
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    1.5 هللة
                  </button>
                </div>

                {/* Direct Riyal Input */}
                <div className="relative">
                  <label className="block text-xs text-gray-600 mb-1">
                    أو أدخل القيمة مباشرة (ر.س):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="0.005"
                    value={settings.petrol || ""}
                    onChange={(e) => handleChange("petrol", e.target.value)}
                    className={`w-full h-12 px-4 rounded-lg border ${
                      errors.petrol
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300 focus:border-blue-500"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 [direction:ltr] text-right`}
                    placeholder="0.00"
                  />
                  <span className="absolute left-4 top-8 text-gray-500 text-sm">
                    ر.س
                  </span>
                </div>
                {errors.petrol && (
                  <p className="mt-1 text-sm text-red-600">{errors.petrol}</p>
                )}
              </div>

              {/* Diesel Commission */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-orange-600" />
                    <span>عمولة ديزيل (ر.س لكل لتر)</span>
                  </div>
                </label>
                
                {/* Quick Halala Options */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-600">خيارات سريعة (هللة):</span>
                  <button
                    type="button"
                    onClick={() => handleHalalaOption("diesel", 0.5)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      settings.diesel === halalaToRiyals(0.5)
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    0.5 هللة
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHalalaOption("diesel", 1)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      settings.diesel === halalaToRiyals(1)
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    1 هللة
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHalalaOption("diesel", 1.5)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      settings.diesel === halalaToRiyals(1.5)
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    1.5 هللة
                  </button>
                </div>

                {/* Direct Riyal Input */}
                <div className="relative">
                  <label className="block text-xs text-gray-600 mb-1">
                    أو أدخل القيمة مباشرة (ر.س):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="0.005"
                    value={settings.diesel || ""}
                    onChange={(e) => handleChange("diesel", e.target.value)}
                    className={`w-full h-12 px-4 rounded-lg border ${
                      errors.diesel
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300 focus:border-blue-500"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 [direction:ltr] text-right`}
                    placeholder="0.00"
                  />
                  <span className="absolute left-4 top-8 text-gray-500 text-sm">
                    ر.س
                  </span>
                </div>
                {errors.diesel && (
                  <p className="mt-1 text-sm text-red-600">{errors.diesel}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || (errors.petrol !== undefined && errors.petrol !== "") || (errors.diesel !== undefined && errors.diesel !== "")}
            className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

