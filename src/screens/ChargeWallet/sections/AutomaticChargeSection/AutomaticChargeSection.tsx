import React from 'react';
import { Wallet, Copy, Wifi, CircleAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AutomaticChargeSectionProps {
  onTabChange: (tab: 'automatic' | 'manual') => void;
}

export const AutomaticChargeSection = ({ onTabChange }: AutomaticChargeSectionProps): JSX.Element => {
  const navigate = useNavigate();
  
  const virtualAccounts = [
    {
      id: 1,
      companyName: "International United Company",
      accountHolder: "OLIVIA RHYE",
      expiryDate: "06/24",
      accountNumber: "1234 1234 1234 1234",
      gradient: "from-red-500 to-pink-500"
    },
    {
      id: 2,
      companyName: "International United Company", 
      accountHolder: "OLIVIA RHYE",
      expiryDate: "06/24",
      accountNumber: "1234 1234 1234 1234",
      gradient: "from-orange-500 to-yellow-500"
    },
    {
      id: 3,
      companyName: "International United Company",
      accountHolder: "OLIVIA RHYE", 
      expiryDate: "06/24",
      accountNumber: "1234 1234 1234 1234",
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  const handleCopyAccount = (accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    // You could add a toast notification here
    console.log('Account number copied:', accountNumber);
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
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
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
            قم بتحويل الأموال على أحد حساباتك الافتراضية المرتبط بالمنصة، واستمتع بارسال الأموال إلى محفظتك بشكل مباشر بدون الحاجة لانتظار المراجعة من خلال إدارة المنصة ، قم فقط بنسخ رقم حسابك الافتراضي والتحويل عليه من خلال حسابك البنكي.
          </p>
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
            style={{ backgroundColor: '#5A66C1' }}
          >
            <CircleAlert className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Virtual Account Cards */}
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        {virtualAccounts.map((account) => (
          <div
            key={account.id}
            className={`flex-1 bg-gradient-to-br ${account.gradient} rounded-xl p-6 text-white relative min-h-[200px] flex flex-col`}
          >
            {/* Top Row: Company Name and WiFi Icon */}
            <div className="flex justify-between items-center mb-8">
              <div className="text-left">
                <p className="text-sm opacity-80">Company</p>
                <p className="font-semibold text-lg">{account.companyName}</p>
              </div>
              <Wifi className="w-6 h-6 opacity-80" />
            </div>

            {/* Bottom Row: Account Details */}
            <div className="flex-1 flex flex-col justify-end">
              {/* First Sub-row: Name and Date */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-left">
                  <p className="text-sm opacity-80">Account Holder</p>
                  <p className="font-semibold">{account.accountHolder}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Expires</p>
                  <p className="font-semibold">{account.expiryDate}</p>
                </div>
              </div>

              {/* Second Sub-row: Card Number and Copy Icon */}
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <p className="text-sm opacity-80">Card Number</p>
                  <p className="font-mono text-sm">{account.accountNumber}</p>
                </div>
                <button
                  onClick={() => handleCopyAccount(account.accountNumber)}
                  className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div className="flex justify-start w-full">
        <button className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-8 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] hover:opacity-90 transition-opacity" style={{ backgroundColor: '#5A66C1' }}>
          <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
            <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-white text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
              حسنا
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
