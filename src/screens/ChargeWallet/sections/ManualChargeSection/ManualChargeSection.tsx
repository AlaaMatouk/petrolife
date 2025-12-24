import React, { useState, useEffect } from "react";
import {
  Wallet,
  Copy,
  ChevronUp,
  ChevronDown,
  Upload,
  CircleAlert,
  ArrowLeft,
} from "lucide-react";
import { Input, Select } from "../../../../components/shared/Form";
import { useNavigate } from "react-router-dom";
import {
  submitWalletChargeRequest,
  fetchBanksFromFirestore,
} from "../../../../services/firestore";
import { useToast } from "../../../../hooks/useToast";
import { BankAccountsSection } from "../BankAccountsSection";

interface ManualChargeSectionProps {
  onTabChange: (tab: "automatic" | "manual") => void;
}

export const ManualChargeSection = ({
  onTabChange,
}: ManualChargeSectionProps): JSX.Element => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    accountNumber: "2145 2586 2456 3594",
    bankName: "",
    transferAmount: "",
    transferImage: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banks, setBanks] = useState<
    Array<{ id: string; arabic: string; english: string }>
  >([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [bankOptions, setBankOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  // Fetch banks from Firestore on component mount
  useEffect(() => {
    const loadBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const banksData = await fetchBanksFromFirestore();
        setBanks(banksData);
        // Create options for Select dropdown (display Arabic name)
        setBankOptions(
          banksData.map((bank) => ({
            value: bank.arabic,
            label: bank.arabic,
          }))
        );
      } catch (error: any) {
        console.error("Error loading banks:", error);
        addToast({
          type: "error",
          message: "فشل في تحميل قائمة البنوك",
          duration: 3000,
        });
      } finally {
        setIsLoadingBanks(false);
      }
    };

    loadBanks();
  }, [addToast]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(formData.accountNumber);
    addToast({
      type: "success",
      message: "تم نسخ رقم الحساب",
      duration: 2000,
    });
  };

  const handleAmountChange = (increment: boolean) => {
    setFormData((prev) => {
      const currentValue = parseFloat(prev.transferAmount.toString()) || 0;
      const newValue = Math.max(0, currentValue + (increment ? 1 : -1));
      return {
        ...prev,
        transferAmount: newValue > 0 ? newValue.toString() : "",
      };
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        addToast({
          type: "error",
          message: "يرجى اختيار صورة فقط",
          duration: 3000,
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          type: "error",
          message: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
          duration: 3000,
        });
        return;
      }

      setFormData((prev) => ({ ...prev, transferImage: file }));
    }
  };

  const handleSubmit = async () => {
    // Validation
    const transferAmount = parseFloat(formData.transferAmount.toString()) || 0;
    if (transferAmount <= 0) {
      addToast({
        type: "error",
        message: "يرجى إدخال قيمة تحويل صحيحة",
        duration: 3000,
      });
      return;
    }

    if (!formData.bankName.trim()) {
      addToast({
        type: "error",
        message: "يرجى إدخال اسم البنك",
        duration: 3000,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const requestId = await submitWalletChargeRequest({
        transferAmount: transferAmount,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        transferImage: formData.transferImage || undefined,
      });

      addToast({
        type: "success",
        message: "تم إرسال طلب الشحن بنجاح. سيتم مراجعته من قبل الإدارة.",
        duration: 5000,
      });

      // Reset form
      setFormData({
        accountNumber: "2145 2586 2456 3594",
        bankName: "",
        transferAmount: "",
        transferImage: null,
      });

      // Navigate to requests page after a short delay
      setTimeout(() => {
        navigate("/walletchargerequests");
      }, 1500);
    } catch (error: any) {
      console.error("Submit error:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في إرسال طلب الشحن",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-6 w-full">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]"
            aria-label="العودة"
          >
            <div className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </div>
          </button>
          <button
            onClick={() => onTabChange("manual")}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: "#F9F3FF",
              color: "#5A66C1",
              border: "1px solid #5A66C1",
            }}
          >
            الشحن يدويا
          </button>
        </div>

        <div className="flex w-[134px] items-center justify-end gap-1.5 relative">
          <h1 className="relative w-[117px] h-5 mt-[-1.00px] ml-[-7.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-[var(--form-section-title-color)] text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]">
            شحن المحفظة
          </h1>
          <Wallet className="w-5 h-5 text-gray-500" />
        </div>
      </div>

      {/* Description */}
      <div
        className="w-full p-4 rounded-lg"
        style={{ backgroundColor: "#F9F3FF" }}
      >
        <div className="flex items-center justify-between gap-4">
          <p
            className="text-right leading-relaxed flex-1"
            style={{ color: "#5A66C1" }}
          >
            قم بتحويل الأموال على أحد حسابات الإدارة المرتبطة بالمنصة ، ما عليك
            سوى نسخ أحد أرقام الحسابات المتوفرة وتحويل الأموال وارفاق صورة
            التحويل ، وسيتم التحقق من خلال الإدارة وإيداع الأموال في محفظتك
            بأسرع وقت ممكن.
          </p>
          <div
            className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
            style={{ backgroundColor: "#5A66C1" }}
          >
            <CircleAlert className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Bank Accounts Section */}
      <BankAccountsSection />

      {/* Form */}
      <form className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-end gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            {/* First Row: Account Number and Second Account */}
            <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <Input
                label="رقم الحساب المراد التحويل إليه"
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, accountNumber: value }))
                }
                icon={
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                }
              />
              <Input
                label="رقم الحساب المحول منه"
                type="text"
                name="secondAccount"
                value="2145 2586 2456 3595"
                onChange={(value) => console.log("Second account:", value)}
                icon={
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText("2145 2586 2456 3595")
                    }
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                }
              />
            </div>

            {/* Second Row: Bank Name, Transfer Amount, and Image Upload */}
            <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <Select
                label="اسم البنك المحول منه"
                value={formData.bankName}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, bankName: value }))
                }
                options={bankOptions}
                placeholder={
                  isLoadingBanks ? "جاري التحميل..." : "اختر البنك"
                }
                disabled={isLoadingBanks}
                required
              />

              <Input
                label="قيمة التحويل"
                type="number"
                name="transferAmount"
                value={formData.transferAmount}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    transferAmount: value,
                  }))
                }
              />

              <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                <label className="self-stretch font-normal text-[var(--form-active-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                  <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                    صورة التحويل
                  </span>
                </label>
                <div className="relative w-full">
                  <input
                    type="file"
                    id="transfer-image"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="transfer-image"
                    className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder bg-transparent cursor-pointer hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                  >
                    <Upload className="w-4 h-4 text-gray-500" />
                    <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                      <span className="text-right relative w-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] text-[var(--form-active-placeholder-color)]">
                        ارفق صورة التحويل
                      </span>
                    </div>
                  </label>
                  {formData.transferImage && (
                    <div className="mt-1 text-xs text-green-600 text-right [direction:rtl]">
                      {formData.transferImage.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-start gap-4 w-full mt-4">
          <button
            type="button"
            onClick={() => navigate("/wallet")}
            disabled={isSubmitting}
            className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
              <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
                رجوع
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#5A66C1" }}
          >
            <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
              <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-white text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
                {isSubmitting ? "جاري الإرسال..." : "ارسال تفاصيل الشحن"}
              </div>
            </div>
          </button>
        </div>
      </form>
    </div>
  );
};
