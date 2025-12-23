import React, { useState } from "react";
import { CirclePlus, ArrowLeft, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { submitWalletWithdrawalRequest } from "../../../../services/firestore";
import { useToast } from "../../../../hooks/useToast";
import { useGlobalState } from "../../../../hooks/useGlobalState";
import { RefundConfirmationModal } from "./RefundConfirmationModal";

export const RequestFormSection = (): JSX.Element => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { state } = useGlobalState();
  const companyBalance = state.company?.balance || 0;

  const [formData, setFormData] = useState({
    accountNumber: "",
    companyIban: "",
    bankName: "بنك الإتحاد الدولي",
    withdrawalAmount: "0",
    withdrawalType: "custom", // "all" or "custom"
    refundReason: "",
    ibanImage: null as File | null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWithdrawalTypeChange = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      withdrawalType: type,
      withdrawalAmount: type === "all" ? String(companyBalance) : "0",
    }));
  };

  // Validate form data
  const validateForm = (): boolean => {
    const withdrawalAmount = parseFloat(formData.withdrawalAmount);

    if (!formData.companyIban || formData.companyIban.trim() === "") {
      addToast({
        type: "error",
        message: "يرجى إدخال Company IBAN",
        duration: 3000,
      });
      return false;
    }

    if (withdrawalAmount <= 0) {
      addToast({
        type: "error",
        message: "يرجى إدخال مبلغ صحيح",
        duration: 3000,
      });
      return false;
    }

    if (withdrawalAmount > companyBalance) {
      addToast({
        type: "error",
        message: `رصيد غير كافٍ. الرصيد الحالي: ${companyBalance} ر.س`,
        duration: 3000,
      });
      return false;
    }

    if (!formData.bankName || formData.bankName.trim() === "") {
      addToast({
        type: "error",
        message: "يرجى اختيار البنك",
        duration: 3000,
      });
      return false;
    }

    return true;
  };

  // Show confirmation modal
  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    setShowConfirmationModal(true);
  };

  // Actually submit the request
  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setShowConfirmationModal(false);

      const withdrawalAmount = parseFloat(formData.withdrawalAmount);

      // Submit withdrawal request
      await submitWalletWithdrawalRequest({
        accountNumber: formData.accountNumber,
        companyIban: formData.companyIban,
        bankName: formData.bankName,
        withdrawalAmount: withdrawalAmount,
        withdrawalType: formData.withdrawalType as "all" | "custom",
        refundReason: formData.refundReason,
        ibanImage: formData.ibanImage || undefined,
      });

      addToast({
        type: "success",
        message: "تم إرسال طلب السحب بنجاح. في انتظار موافقة الإدارة.",
        duration: 5000,
      });

      // Reset form
      setFormData({
        accountNumber: "",
        companyIban: "",
        bankName: "بنك الإتحاد الدولي",
        withdrawalAmount: "0",
        withdrawalType: "custom",
        refundReason: "",
        ibanImage: null,
      });

      // Refresh page to show updated request history
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("Submit error:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في إرسال طلب السحب",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel confirmation modal
  const handleCancel = () => {
    setShowConfirmationModal(false);
  };

  return (
    <div className="flex flex-col h-[522px] items-start gap-5 relative self-stretch w-full mb-6">
      <div className="flex flex-col h-[522px] items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
        <div className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
          <header className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]">
              <button
                onClick={() => navigate("/wallet")}
                className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)] hover:opacity-80 transition-opacity"
                aria-label="العودة"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex w-[134px] items-center justify-end gap-1.5 relative">
              <h1 className="relative w-[189px] h-5 mt-[-1.00px] ml-[-79.00px] font-subtitle-subtitle-2 font-[number:var(--subtitle-subtitle-2-font-weight)] text-[var(--form-section-title-color)] text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
                إضافة طلب استرداد أموال
              </h1>

              <CirclePlus className="w-[18px] h-[18px] text-gray-500" />
            </div>
          </header>
        </div>

        <form className="flex flex-col items-end gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                <label className="self-stretch font-normal text-[var(--form-active-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                  <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                    رقم الحساب{" "}
                  </span>

                  <span className="text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] font-caption-caption-1 [font-style:var(--caption-caption-1-font-style)] font-[number:var(--caption-caption-1-font-weight)]">
                    &quot;اختياري&quot;
                  </span>
                </label>

                <div className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder">
                  <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) =>
                        handleInputChange("accountNumber", e.target.value)
                      }
                      placeholder="أضف رقم الحساب هنا"
                      className="relative w-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-[length:var(--body-body-2-font-size)] text-right tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                <label className="self-stretch font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-right tracking-[var(--body-body-2-letter-spacing)] relative mt-[-1.00px] font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [font-style:var(--body-body-2-font-style)]">
                  Company IBAN
                </label>

                <div className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder">
                  <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                    <input
                      type="text"
                      value={formData.companyIban}
                      onChange={(e) =>
                        handleInputChange("companyIban", e.target.value)
                      }
                      placeholder="ضع ال IBAN الخاص بك هنا"
                      className="relative w-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-[length:var(--body-body-2-font-size)] text-right tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                <label className="relative self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                  اسم البنك المراد التحويل إليه
                </label>

                <div className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder">
                  <ChevronDown className="w-[17px] h-[17px] text-gray-500" />

                  <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                    <select
                      value={formData.bankName}
                      onChange={(e) =>
                        handleInputChange("bankName", e.target.value)
                      }
                      className="w-full font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] text-right tracking-[var(--body-body-2-letter-spacing)] [direction:rtl] relative mt-[-1.00px] font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none"
                    >
                      <option value="بنك الإتحاد الدولي">
                        بنك الإتحاد الدولي
                      </option>
                      <option value="البنك الأهلي السعودي">
                        البنك الأهلي السعودي
                      </option>
                      <option value="بنك الراجحي">بنك الراجحي</option>
                      <option value="بنك الرياض">بنك الرياض</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                <label className="relative self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                  القيمة المراد سحبها (ر.س)
                </label>

                <div className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder">
                  <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                    <input
                      type="number"
                      value={formData.withdrawalAmount}
                      onChange={(e) =>
                        handleInputChange("withdrawalAmount", e.target.value)
                      }
                      disabled={formData.withdrawalType === "all"}
                      className="w-full font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] tracking-[var(--body-body-2-letter-spacing)] relative mt-[-1.00px] font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [font-style:var(--body-body-2-font-style)] text-right [direction:rtl] bg-transparent border-none outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                <label className="relative self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                  نوع الاسترداد
                </label>

                <div className="flex items-start gap-[var(--corner-radius-medium)] relative self-stretch w-full flex-[0_0_auto]">
                  <button
                    type="button"
                    onClick={() => handleWithdrawalTypeChange("all")}
                    className={`flex h-[46px] items-center justify-center gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative flex-1 grow rounded-[var(--corner-radius-small)] border-[0.5px] border-solid transition-colors ${
                      formData.withdrawalType === "all"
                        ? "border-color-mode-text-icons-t-blue"
                        : "border-color-mode-text-icons-t-placeholder"
                    }`}
                  >
                    <div className="items-center justify-center pt-[3px] pb-0 px-0 flex-1 grow flex relative">
                      <div
                        className={`relative w-fit mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)] ${
                          formData.withdrawalType === "all"
                            ? "text-color-mode-text-icons-t-blue"
                            : "text-[var(--form-active-input-text-color)]"
                        }`}
                      >
                        كل الأموال({companyBalance} ر.س)
                      </div>
                    </div>
                    {formData.withdrawalType === "all" && (
                      <img
                        className="absolute top-0 left-0 w-3.5 h-3.5"
                        alt="Selected"
                        src="/img/rectangle-22DI.svg"
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWithdrawalTypeChange("custom")}
                    className={`flex h-[46px] items-center justify-center gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] flex-1 grow border-[0.5px] border-solid relative rounded-[var(--corner-radius-small)] transition-colors ${
                      formData.withdrawalType === "custom"
                        ? "border-color-mode-text-icons-t-blue"
                        : "border-color-mode-text-icons-t-placeholder"
                    }`}
                  >
                    <div className="items-center justify-center pt-[3px] pb-0 px-0 flex-1 grow flex relative">
                      <div
                        className={`relative w-fit mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)] ${
                          formData.withdrawalType === "custom"
                            ? "text-color-mode-text-icons-t-blue"
                            : "text-color-mode-text-icons-t-sec"
                        }`}
                      >
                        تحديد قيمة السحب
                      </div>
                    </div>
                    {formData.withdrawalType === "custom" && (
                      <img
                        className="absolute top-0 left-0 w-3.5 h-3.5"
                        alt="Selected"
                        src="/img/rectangle-22DI.svg"
                      />
                    )}
                  </button>
                </div>
              </div>

              <div className="absolute top-0 left-0 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
                رصيد المحفظة ({companyBalance} ر.س)
              </div>
            </div>

            <div className="flex h-[145px] items-start gap-5 relative self-stretch w-full">
              <div className="flex-1 self-stretch grow flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative">
                <label className="relative self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                  سبب طلب الاسترداد
                </label>

                <div className="flex items-start justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] flex-1 self-stretch w-full grow border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder relative rounded-[var(--corner-radius-small)]">
                  <div className="flex items-start justify-end pt-[3px] pb-0 px-0 relative flex-1 grow h-full">
                    <textarea
                      value={formData.refundReason}
                      onChange={(e) =>
                        handleInputChange("refundReason", e.target.value)
                      }
                      placeholder="أدخل سبب الطلب هنا"
                      className="relative w-full h-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-[length:var(--body-body-2-font-size)] text-right tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none resize-none"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between relative self-stretch w-full flex-[0_0_auto]">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 flex-[0_0_auto] bg-color-mode-surface-primary-blue relative rounded-[var(--corner-radius-small)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="items-center gap-[var(--corner-radius-small)] self-stretch w-full flex-[0_0_auto] flex relative">
                  <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-color-mode-text-icons-t-btn-negative text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
                    {isSubmitting
                      ? "جاري الإرسال..."
                      : "إضافة طلب استرداد جديد"}
                  </div>
                </div>
              </button>

              <div className="w-[512.5px] flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative">
                <label className="relative self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                  صورة ال IBAN البنكي
                </label>

                <div className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder">
                  <img
                    className="w-[17px] h-[17px] relative aspect-[1]"
                    alt="Side icons"
                    src="/img/side-icons-2.svg"
                  />

                  <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData((prev) => ({ ...prev, ibanImage: file }));
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <span className="relative w-fit mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-placeholder-color)] text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)] pointer-events-none">
                      {formData.ibanImage
                        ? formData.ibanImage.name
                        : "ضع ال IBAN الخاص بك هنا"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <RefundConfirmationModal
        open={showConfirmationModal}
        formData={formData}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};
