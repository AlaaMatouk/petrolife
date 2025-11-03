import { useState, useEffect, useMemo, useCallback } from "react";
import { Table, Pagination } from "../../../shared";
import { Tag, CirclePlus, MoreVertical, Download, FileSpreadsheet, FileText, Trash2, Edit, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { StatusToggle } from "../../../shared/StatusToggle";

const columns = [
  { key: "actions", label: "الإجراءات", width: "w-16", priority: "high" },
  {
    key: "accountStatus",
    label: "حالة الكوبون",
    width: "min-w-[120px]",
    priority: "high",
  },
  {
    key: "usage",
    label: "استخدام",
    width: "min-w-[100px]",
    priority: "high",
  },
  {
    key: "numberOfUsers",
    label: "عدد المستخدمين",
    width: "min-w-[120px]",
    priority: "medium",
  },
  {
    key: "specificCategories",
    label: "التصنيفات الخصصة",
    width: "min-w-[150px]",
    priority: "high",
  },
  {
    key: "expirationDate",
    label: "تاريخ الانتهاء",
    width: "min-w-[120px]",
    priority: "high",
  },
  {
    key: "maxDiscount",
    label: "الحد الأقصى للخصم (ر.س)",
    width: "min-w-[150px]",
    priority: "high",
  },
  {
    key: "discountPercentage",
    label: "نسبة الخصم (%)",
    width: "min-w-[120px]",
    priority: "high",
  },
  {
    key: "discountCode",
    label: "كود الخصم",
    width: "min-w-[120px]",
    priority: "high",
  },
];

// Mock data for Individuals tab
const individualsData = Array.from({ length: 72 }).map((_, i) => ({
  id: i + 1,
  discountCode: `IND${(i + 1).toString().padStart(3, "0")}`,
  discountPercentage: i % 3 === 0 ? "10" : i % 3 === 1 ? "15" : "20",
  maxDiscount: i % 2 === 0 ? "5000" : "3000",
  expirationDate: "21 فبراير 2025",
  specificCategories: i % 4 === 0 ? "زيوت" : i % 4 === 1 ? "فلاتر" : i % 4 === 2 ? "غسيل" : "منتجات",
  numberOfUsers: i % 5 === 0 ? "10" : i % 5 === 1 ? "15" : i % 5 === 2 ? "20" : i % 5 === 3 ? "25" : "30",
  usage: i % 3 === 0 ? "150" : i % 3 === 1 ? "200" : "250",
  accountStatus:
    i % 3 === 0
      ? { active: true, text: "جاري" }
      : i % 3 === 1
      ? { active: false, text: "معلق" }
      : { active: false, text: "منتهي" },
}));

// Mock data for Companies tab
const companiesData = Array.from({ length: 72 }).map((_, i) => ({
  id: i + 73,
  discountCode: `COMP${(i + 1).toString().padStart(3, "0")}`,
  discountPercentage: i % 3 === 0 ? "15" : i % 3 === 1 ? "20" : "25",
  maxDiscount: i % 2 === 0 ? "8000" : "6000",
  expirationDate: "21 فبراير 2025",
  specificCategories: i % 4 === 0 ? "زيوت" : i % 4 === 1 ? "إطارات" : i % 4 === 2 ? "اكسسوارات" : "غسيل",
  numberOfUsers: i % 5 === 0 ? "20" : i % 5 === 1 ? "25" : i % 5 === 2 ? "30" : i % 5 === 3 ? "35" : "40",
  usage: i % 3 === 0 ? "300" : i % 3 === 1 ? "350" : "400",
  accountStatus:
    i % 2 === 0
      ? { active: true, text: "جاري" }
      : i % 4 === 1
      ? { active: false, text: "معلق" }
      : { active: false, text: "منتهي" },
}));

const ExportMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const updateMenuPosition = () => {
    if (!buttonRef) return;
    const rect = buttonRef.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.right - 192,
    });
  };

  const menuOptions = [
    { icon: FileSpreadsheet, label: "تصدير Excel", action: () => console.log("Export to Excel") },
    { icon: FileText, label: "تصدير PDF", action: () => console.log("Export to PDF") },
  ];

  return (
    <>
      <button
        ref={setButtonRef}
        onClick={() => {
          setIsOpen((v) => !v);
          setTimeout(updateMenuPosition, 0);
        }}
        className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
      >
        <Download className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen &&
        createPortal(
          <div
            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 w-48"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {menuOptions.map((option) => (
              <button
                key={option.label}
                onClick={() => {
                  option.action();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 [direction:rtl]"
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};

// Action Menu Component for each row
interface ActionMenuProps {
  item: any;
  viewDetailsRoute: (id: string | number) => string;
}

const ActionMenu = ({ item, viewDetailsRoute }: ActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();

  const updateMenuPosition = () => {
    if (!buttonRef) return;
    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 192;
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
      navigate(viewDetailsRoute(item.id));
    } else if (action === "delete") {
      console.log("Delete coupon:", item.id);
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
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="إجراءات"
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
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
                  <span>عرض بيانات الكوبون</span>
                  <User className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleAction("delete")}
                  className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>حذف الكوبون نهائيا</span>
                  <Trash2 className="w-4 h-4" />
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

const PetrolifeCoupons = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"individuals" | "companies">("individuals");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const itemsPerPage = 10;

  useEffect(() => {
    setData(activeTab === "individuals" ? individualsData : companiesData);
    setCurrentPage(1);
  }, [activeTab]);

  const handleToggleStatus = useCallback((id: number | string) => {
    console.log("Toggle status for coupon:", id);
    setData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.accountStatus) {
            return {
              ...item,
              accountStatus: {
                active: !item.accountStatus.active,
                text: !item.accountStatus.active ? "جاري" : "معطل",
              },
            };
          }
        }
        return item;
      })
    );
  }, []);

  const viewDetailsRoute = useCallback((id: string | number) => `/petrolife-coupons/${id}`, []);

  const enhancedColumns = useMemo(
    () =>
      columns.map((col) => {
        if (col.key === "actions") {
          return {
            ...col,
            render: (_: any, row: any) => (
              <div className="flex items-center justify-center">
                <ActionMenu item={row} viewDetailsRoute={viewDetailsRoute} />
              </div>
            ),
          };
        }
        if (col.key === "accountStatus") {
          return {
            ...col,
            render: (value: any, row: any) => (
              <StatusToggle
                isActive={value.active}
                onToggle={() => handleToggleStatus(row.id)}
                statusText={value.text}
              />
            ),
          };
        }
        return col;
      }),
    [handleToggleStatus, viewDetailsRoute]
  );

  const paginatedData = useMemo(
    () => data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [data, currentPage]
  );

  return (
    <div
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
      dir="rtl"
    >
      <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
          {/* Title on right side (RTL) */}
          <div className="flex items-center justify-end gap-1.5 relative">
            <h1 className="relative mt-[-1.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]">
              الكوبونات ({activeTab === "individuals" ? individualsData.length : companiesData.length})
            </h1>
            <Tag className="w-5 h-5 text-gray-500" />
          </div>

          {/* Buttons on left side (RTL) */}
          <div className="inline-flex items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]">
            <button
              onClick={() => navigate("/petrolife-coupons/add")}
              className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
            >
              <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                  <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                    إضافة كوبون جديد
                  </span>
                </div>
                <CirclePlus className="w-4 h-4 text-gray-500" />
              </div>
            </button>
            <ExportMenu />
          </div>
        </div>

        {/* Tabs inside the header section */}
        <div className="flex gap-2 w-full">
          <button
            onClick={() => setActiveTab("individuals")}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              activeTab === "individuals"
                ? "bg-[#5A66C1] text-white"
                : "bg-white text-[#6B7280] border-2 border-[#9CA3AF] hover:border-[#5A66C1]"
            }`}
          >
            الأفراد
          </button>
          <button
            onClick={() => setActiveTab("companies")}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              activeTab === "companies"
                ? "bg-[#5A66C1] text-white"
                : "bg-white text-[#6B7280] border-2 border-[#9CA3AF] hover:border-[#5A66C1]"
            }`}
          >
            الشركات
          </button>
        </div>
      </header>

      <main className="flex flex-col items-start gap-7 relative self-stretch w-full flex-[0_0_auto]">
        {/* Table Content */}
        <div className="flex flex-col items-end gap-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto]">
          {/* Desktop Table View */}
          <div className="hidden lg:block w-full overflow-x-auto">
            <Table
              columns={enhancedColumns}
              data={paginatedData}
              className="relative self-stretch w-full flex-[0_0_auto]"
            />
          </div>

          {/* Tablet Responsive Table View */}
          <div className="hidden md:block lg:hidden w-full overflow-x-auto">
            <Table
              columns={(enhancedColumns as any).filter((col: any) => col.priority !== "low")}
              data={paginatedData}
              className="relative self-stretch w-full flex-[0_0_auto]"
            />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 w-full">
            <div className="text-center text-gray-500 py-8">
              عرض الجوال غير متوفر حالياً
            </div>
          </div>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(data.length / itemsPerPage) || 1}
          onPageChange={setCurrentPage}
        />
      </main>
    </div>
  );
};

export default PetrolifeCoupons;
