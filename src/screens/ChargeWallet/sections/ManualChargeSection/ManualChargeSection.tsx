import React, { useState } from 'react';
import { Wallet, Copy, ChevronUp, ChevronDown, Upload, CircleAlert, ArrowLeft } from 'lucide-react';
import { Input, Select } from '../../../../components/shared/Form';
import { useNavigate } from 'react-router-dom';

interface ManualChargeSectionProps {
  onTabChange: (tab: 'automatic' | 'manual') => void;
}

export const ManualChargeSection = ({ onTabChange }: ManualChargeSectionProps): JSX.Element => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    accountNumber: '2145 2586 2456 3594',
    secondAccount: '2145 2586 2456 3595',
    bankName: 'بنك الإتحاد الدولي',
    transferAmount: 0,
    transferImage: null as File | null
  });

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(formData.accountNumber);
    console.log('Account number copied:', formData.accountNumber);
  };

  const handleAmountChange = (increment: boolean) => {
    setFormData(prev => ({
      ...prev,
      transferAmount: Math.max(0, prev.transferAmount + (increment ? 1 : -1))
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, transferImage: file }));
    }
  };

  const handleSubmit = () => {
    console.log('Submitting charge details:', formData);
    // Handle form submission here
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
            onClick={() => onTabChange('manual')}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ 
              backgroundColor: '#F9F3FF', 
              color: '#5A66C1',
              border: '1px solid #5A66C1'
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
      <div className="w-full p-4 rounded-lg" style={{ backgroundColor: '#F9F3FF' }}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-right leading-relaxed flex-1" style={{ color: '#5A66C1' }}>
            قم بتحويل الأموال على أحد حسابات الإدارة المرتبطة بالمنصة ، ما عليك سوى نسخ أحد أرقام الحسابات المتوفرة وتحويل الأموال وارفاق صورة التحويل ، وسيتم التحقق من خلال الإدارة وإيداع الأموال في محفظتك بأسرع وقت ممكن.
          </p>
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
            style={{ backgroundColor: '#5A66C1' }}
          >
            <CircleAlert className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

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
                onChange={(value) => setFormData(prev => ({ ...prev, accountNumber: value }))}
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
                label="رقم الحساب الثاني"
                type="text"
                name="secondAccount"
                value={formData.secondAccount}
                onChange={(value) => setFormData(prev => ({ ...prev, secondAccount: value }))}
                icon={
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(formData.secondAccount)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                }
              />
            </div>

            {/* Second Row: Bank Name, Transfer Amount, and Image Upload */}
            <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <Input
                label="اسم البنك المحول منه"
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={(value) => setFormData(prev => ({ ...prev, bankName: value }))}
              />
              
              <Input
                label="قيمة التحويل"
                type="number"
                name="transferAmount"
                value={formData.transferAmount}
                onChange={(value) => setFormData(prev => ({ ...prev, transferAmount: parseInt(value) || 0 }))}
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
            onClick={() => navigate('/wallet')}
            className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
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
            className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#5A66C1' }}
          >
            <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
              <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-white text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
                ارسال تفاصيل الشحن
              </div>
            </div>
          </button>
        </div>
      </form>
    </div>
  );
};
