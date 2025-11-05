import { useState, useMemo, useEffect } from "react";
import { Table, Pagination, ExportButton } from "../../../shared";
import { MoreVertical, Eye, Copy, FileText, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

// Mock data for default accounts
const generateMockAccounts = () => {
  const accountTypes = ["أفراد", "شركات", "مزودو الخدمة", "تطبيق السائق"];
  const customerNames = [
    "هشام موسى",
    "شركة النصر",
    "شركة البترول العربية",
    "أحمد علي",
    "محمد حسن",
    "شركة الصحراء",
    "فاطمة الزهراء",
    "شركة الشرق الأوسط",
    "خالد عبدالله",
    "شركة النفط والغاز",
    "سارة أحمد",
    "شركة الطاقة",
    "يوسف محمد",
    "شركة التوزيع",
    "نور الدين",
    "شركة الخدمات",
    "علي محمود",
    "شركة النقل",
    "مريم سعيد",
    "شركة التجارة",
  ];
  const phoneNumbers = [
    "00965284358",
    "00965284359",
    "00965284360",
    "00965284361",
    "00965284362",
    "00965284363",
    "00965284364",
    "00965284365",
    "00965284366",
    "00965284367",
  ];
  const customerCodes = [
    "21A254",
    "21A255",
    "21A256",
    "21A257",
    "21A258",
    "21A259",
    "21A260",
  ];

  const accounts = [];
  for (let i = 1; i <= 100; i++) {
    const randomName =
      customerNames[Math.floor(Math.random() * customerNames.length)];
    const randomType =
      accountTypes[Math.floor(Math.random() * accountTypes.length)];
    const randomPhone =
      phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)];
    const randomCode =
      customerCodes[Math.floor(Math.random() * customerCodes.length)];

    accounts.push({
      id: i,
      customerCode: randomCode,
      customerName: randomName,
      accountType: randomType,
      phoneNumber: randomPhone,
      virtualAccount: `${randomPhone}${String(i).padStart(10, "0")}`,
    });
  }
  return accounts;
};

const mockDefaultAccounts = generateMockAccounts();

// Action Menu Component for each row
interface ActionMenuProps {
  item: any;
  navigate: any;
}

const ActionMenu = ({ item, navigate }: ActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const updateMenuPosition = () => {
    if (!buttonRef) return;
    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 200;
    let left = rect.right + 4;
    if (left + menuWidth > window.innerWidth) {
      left = rect.left - menuWidth - 4;
    }
    setMenuPosition({
      top: rect.bottom + 4,
      left: Math.max(4, left),
    });
  };

  const handleAction = (action: string) => {
    if (action === "view") {
      console.log("View account:", item.id);
    } else if (action === "copy") {
      navigator.clipboard.writeText(item.virtualAccount);
      console.log("Copied virtual account:", item.virtualAccount);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      updateMenuPosition();
      const handleScroll = () => updateMenuPosition();
      const handleResize = () => updateMenuPosition();
      window.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isOpen, buttonRef]);

  return (
    <div className="relative">
      <button
        ref={setButtonRef}
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(updateMenuPosition, 0);
        }}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="إجراءات"
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {createPortal(
            <div
              className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <div className="py-1">
                <button
                  onClick={() => handleAction("view")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>عرض التفاصيل</span>
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleAction("copy")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>نسخ رقم الحساب</span>
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
};

const DefaultAccounts = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(3);
  const itemsPerPage = 10;

  const handleCopyVirtualAccount = (accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    // TODO: Show toast notification
    console.log("Copied:", accountNumber);
  };

  const columns = useMemo(
    () => [
      {
        key: "actions",
        label: "",
        width: "w-16",
        priority: "high",
        render: (_: any, row: any) => (
          <div className="flex items-center justify-center">
            <ActionMenu item={row} navigate={navigate} />
          </div>
        ),
      },
      {
        key: "virtualAccount",
        label: "الحساب الافتراضية",
        width: "min-w-[200px]",
        priority: "high",
        render: (value: string) => (
          <div
            className="px-3 py-2 bg-yellow-100 hover:bg-yellow-200 rounded-md cursor-pointer transition-colors text-center font-mono text-sm font-medium"
            onClick={() => handleCopyVirtualAccount(value)}
            title="انقر للنسخ"
            dir="ltr"
          >
            {value}
          </div>
        ),
      },
      {
        key: "phoneNumber",
        label: "رقم الهاتف",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "accountType",
        label: "نوع الحساب",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "customerName",
        label: "اسم العميل",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "customerCode",
        label: "كود العميل",
        width: "min-w-[120px]",
        priority: "high",
      },
    ],
    [navigate]
  );

  const paginatedData = useMemo(
    () =>
      mockDefaultAccounts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [currentPage]
  );

  const handleExport = (format: string) => {
    console.log(`Exporting default accounts as ${format}`);
  };

  return (
    <div
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        {/* Title on right with icon */}
        <div className="flex items-center justify-end gap-1.5" dir="rtl">
          <CreditCard className="w-5 h-5 text-gray-500" />
          <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
            الحسابات الافتراضية ({mockDefaultAccounts.length})
          </h1>
        </div>
        {/* Export Button on left */}
        <div className="flex items-center justify-start">
          <ExportButton onExport={handleExport} buttonText="تصدير" />
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full overflow-x-auto">
        <Table columns={columns} data={paginatedData} />
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(mockDefaultAccounts.length / itemsPerPage) || 1}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default DefaultAccounts;
