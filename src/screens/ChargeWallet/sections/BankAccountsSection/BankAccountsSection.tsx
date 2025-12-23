import { useState, useEffect } from "react";
import { Copy, CircleAlert } from "lucide-react";
import { useToast } from "../../../../hooks/useToast";
import { fetchBankAccountsFromFirestore } from "../../../../services/firestore";

interface BankAccount {
  id: string;
  bankName: { ar: string; en?: string };
  accountNumber: string;
  ibanNumber: string;
  logoUrl: string;
  order: number;
  isActive: boolean;
}

// Fallback hardcoded data matching the image
const defaultBankAccounts: BankAccount[] = [
  {
    id: "1",
    bankName: { ar: "الأهلي NCB", en: "AlAhli NCB" },
    accountNumber: "26600000846607",
    ibanNumber: "SA6510000026600000846607",
    logoUrl: "/img/ncb.jpeg",
    order: 1,
    isActive: true,
  },
  {
    id: "2",
    bankName: { ar: "مصرف الراجحي alrajhi bank", en: "Al Rajhi Bank" },
    accountNumber: "528000001006081555888",
    ibanNumber: "SA3480000528608011555888",
    logoUrl: "/img/rajhi.jpeg",
    order: 2,
    isActive: true,
  },
  {
    id: "3",
    bankName: { ar: "الأول SAB", en: "Alawwal SAB" },
    accountNumber: "611159195001",
    ibanNumber: "SA2645000000611159195001",
    logoUrl: "/img/sab.jpeg",
    order: 3,
    isActive: true,
  },
];

export const BankAccountsSection = (): JSX.Element => {
  const { addToast } = useToast();
  const [bankAccounts, setBankAccounts] =
    useState<BankAccount[]>(defaultBankAccounts);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBankAccounts = async () => {
      setIsLoading(true);
      try {
        const accounts = await fetchBankAccountsFromFirestore();
        if (accounts && accounts.length > 0) {
          // Filter only active accounts and sort by order
          const activeAccounts = accounts
            .filter((acc) => acc.isActive)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          setBankAccounts(activeAccounts);
        }
      } catch (error) {
        console.error("Error loading bank accounts from Firestore:", error);
        // Use default hardcoded data on error
        setBankAccounts(defaultBankAccounts);
      } finally {
        setIsLoading(false);
      }
    };

    loadBankAccounts();
  }, []);

  const handleCopyAccount = (accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    addToast({
      type: "success",
      title: "نجح",
      message: "تم نسخ رقم الحساب",
    });
  };

  const handleCopyIban = (ibanNumber: string) => {
    navigator.clipboard.writeText(ibanNumber);
    addToast({
      type: "success",
      title: "نجح",
      message: "تم نسخ رقم الايبان",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-start gap-6 w-full">
        <div className="w-full p-4 rounded-lg bg-gray-100 animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-6 w-full">
      {/* Instructional Banner */}
      <div
        className="w-full p-4 rounded-lg flex items-center gap-3"
        style={{ backgroundColor: "#F9F3FF" }}
      >
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
          style={{ backgroundColor: "#5A66C1" }}
        >
          <CircleAlert className="w-6 h-6 text-white" />
        </div>
        <p
          className="text-right leading-relaxed flex-1"
          style={{ color: "#5A66C1" }}
        >
          اختر البنك المراد التحويل اليه . ثم قم بعمليه التحويل . ثم قم بادخال
          بيانات التحويل
        </p>
      </div>

      {/* Bank Accounts Section with Frame */}
      <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
        {/* Bank Accounts Cards */}
        <div className="flex flex-col gap-4 w-full [direction:rtl]">
          {bankAccounts.map((bank) => (
            <div
              key={bank.id}
              className="flex items-center justify-between w-full p-5 rounded-lg border-[0.3px] border-solid border-gray-200 bg-white"
            >
              {/* Bank Logo - Right Side */}
              <div className="flex-shrink-0 flex items-center justify-center mr-6 ml-20">
                <img
                  src={bank.logoUrl}
                  alt={bank.bankName.ar}
                  className="w-32 h-32 object-contain"
                  onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>

              {/* Account Number - Middle */}
              <div className="flex-1 flex flex-col items-center gap-2 px-4">
                <span className="text-sm text-color-mode-text-icons-t-sec text-center">
                  رقم الحساب
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-semibold text-color-mode-text-icons-t-primary text-center">
                    {bank.accountNumber}
                  </span>
                  <button
                    onClick={() => handleCopyAccount(bank.accountNumber)}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    aria-label="نسخ رقم الحساب"
                  >
                    <Copy className="w-4 h-4 text-color-mode-text-icons-t-sec" />
                  </button>
                </div>
              </div>

              {/* IBAN Number - Left Side */}
              <div className="flex-1 flex flex-col items-center gap-2 px-4">
                <span className="text-sm text-color-mode-text-icons-t-sec text-center">
                  رقم الايبان
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-semibold text-color-mode-text-icons-t-primary text-center">
                    {bank.ibanNumber}
                  </span>
                  <button
                    onClick={() => handleCopyIban(bank.ibanNumber)}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    aria-label="نسخ رقم الايبان"
                  >
                    <Copy className="w-4 h-4 text-color-mode-text-icons-t-sec" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
