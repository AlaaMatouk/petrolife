import { useState, useEffect, useMemo, useCallback } from "react";
import { Table, Pagination, LoadingSpinner } from "../../../shared";
import { Tag, CirclePlus, MoreVertical, Download, FileSpreadsheet, FileText, Trash2, Edit, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { StatusToggle } from "../../../shared/StatusToggle";
import { fetchCoupons } from "../../../../services/firestore";
import { exportDataTable } from "../../../../services/exportService";
import { useToast } from "../../../../context/ToastContext";

const formatValue = (value: any, fallback = "-") => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toString() : fallback;
  }

  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : fallback;
};

const formatCategories = (value: any) => {
  if (!value) return "-";
  if (Array.isArray(value)) {
    const filtered = value
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") return item.trim();
        if (item?.name) return item.name;
        return JSON.stringify(item);
      })
      .filter(Boolean);

    return filtered.length ? filtered.join("، ") : "-";
  }

  return formatValue(value);
};

const parseExpireDate = (value: any): Date | null => {
  if (!value) return null;

  try {
    if (typeof value === "string") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    if (value?.seconds) {
      return new Date(value.seconds * 1000);
    }
  } catch (error) {
    console.warn("Failed to parse expire date", error);
  }

  return null;
};

const formatDateValue = (value: any) => {
  if (!value) return "-";

  const parsed = parseExpireDate(value);
  if (!parsed) return formatValue(value);

  try {
    return parsed.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    console.warn("Failed to format expire date", error);
    return formatValue(value);
  }
};

const calculateCouponStatus = (expireDateRaw: any): { active: boolean; text: string } | null => {
  const expireDate = parseExpireDate(expireDateRaw);
  
  if (!expireDate) {
    // No expire date - consider as pending
    return {
      active: false,
      text: "معلق",
    };
  }

  const now = new Date();
  // Reset time to start of day for accurate comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiry = new Date(expireDate.getFullYear(), expireDate.getMonth(), expireDate.getDate());
  
  // Calculate difference in days
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Expired
    return {
      active: false,
      text: "منتهي",
    };
  } else if (diffDays <= 7) {
    // Expiring within 7 days - Pending
    return {
      active: false,
      text: "معلق",
    };
  } else {
    // Active (more than 7 days remaining)
    return {
      active: true,
      text: "جاري",
    };
  }
};

const mapCouponDocument = (coupon: Record<string, any>) => {
  const discountPercentageRaw = coupon?.percentage ?? coupon?.precentage;
  const maxDiscountRaw = coupon?.minmumValueToApplyCoupon ?? coupon?.minimumValueToApplyCoupon;
  const categoriesRaw = coupon?.categories ?? coupon?.specificCategories ?? coupon?.category ?? null;
  const numberOfUsersRaw =
    coupon?.numberOfUsers ?? coupon?.usersCount ?? coupon?.userCount ?? coupon?.maxUsers ?? coupon?.usageLimit;
  const usageRaw = coupon?.usage ?? coupon?.usageCount ?? coupon?.usedCount ?? coupon?.usageTimes;
  const expireDateRaw = coupon?.expireDate ?? coupon?.expiryDate ?? coupon?.expireAt ?? coupon?.expirationDate;

  // Calculate status based on expireDate
  const accountStatus = calculateCouponStatus(expireDateRaw);

  return {
    id: coupon?.id ?? coupon?.code ?? `temp-${Date.now()}-${Math.random()}`,
    discountCode: formatValue(coupon?.code),
    discountPercentage: formatValue(discountPercentageRaw),
    maxDiscount: formatValue(maxDiscountRaw),
    expirationDate: formatDateValue(expireDateRaw),
    specificCategories: formatCategories(categoriesRaw),
    numberOfUsers: formatValue(numberOfUsersRaw),
    usage: formatValue(usageRaw),
    accountStatus,
    isCompany: Boolean(coupon?.isCompany),
  };
};

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

interface ExportMenuProps {
  data: any[];
  columns: any[];
}

const ExportMenu = ({ data, columns }: ExportMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const { addToast } = useToast();

  const updateMenuPosition = () => {
    if (!buttonRef) return;
    const rect = buttonRef.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.right - 192,
    });
  };

  const handleExport = async (format: string) => {
    try {
      // Transform columns to export format (exclude actions column)
      const exportColumns = columns
        .filter(col => col.key !== "actions")
        .map(col => ({
          key: col.key,
          label: col.label || col.key,
        }));
      
      // Transform data for export (flatten nested objects)
      const exportData = data.map((item: any) => {
        const flattened: any = {};
        exportColumns.forEach(col => {
          const value = item[col.key];
          if (value && typeof value === "object" && !Array.isArray(value)) {
            if (value.text !== undefined) {
              flattened[col.key] = value.text;
            } else if (value.name !== undefined) {
              flattened[col.key] = value.name;
            } else if (value.active !== undefined) {
              flattened[col.key] = value.active ? "جاري" : "معطل";
            } else {
              flattened[col.key] = JSON.stringify(value);
            }
          } else if (Array.isArray(value)) {
            flattened[col.key] = value.join(", ");
          } else {
            flattened[col.key] = value || "-";
          }
        });
        return flattened;
      });

      await exportDataTable(
        exportData,
        exportColumns,
        "petrolife-coupons",
        format as "excel" | "pdf",
        "تقرير كوبونات بترولايف"
      );

      addToast({
        type: "success",
        title: "نجح التصدير",
        message: `تم تصدير البيانات بنجاح كـ ${format === "excel" ? "Excel" : "PDF"}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      addToast({
        type: "error",
        title: "فشل التصدير",
        message: "حدث خطأ أثناء تصدير البيانات",
      });
    } finally {
      setIsOpen(false);
    }
  };

  const menuOptions = [
    { icon: FileSpreadsheet, label: "تصدير Excel", action: () => handleExport("excel") },
    { icon: FileText, label: "تصدير PDF", action: () => handleExport("pdf") },
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
  const [individualCoupons, setIndividualCoupons] = useState<any[]>([]);
  const [companyCoupons, setCompanyCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    const loadCoupons = async () => {
      setLoading(true);
      setError(null);

      try {
        const coupons = await fetchCoupons();
        const individuals: any[] = [];
        const companies: any[] = [];

        coupons.forEach((coupon) => {
          const mapped = mapCouponDocument(coupon);
          if (mapped.isCompany) {
            companies.push(mapped);
          } else {
            individuals.push(mapped);
          }
        });

        setIndividualCoupons(individuals);
        setCompanyCoupons(companies);
      } catch (err: any) {
        console.error("Failed to fetch coupons:", err);
        setError("تعذر تحميل بيانات الكوبونات.");
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
  }, []);

  const activeData = useMemo(
    () => (activeTab === "individuals" ? individualCoupons : companyCoupons),
    [activeTab, individualCoupons, companyCoupons]
  );

  const handleToggleStatus = useCallback((id: number | string) => {
    const toggleStatus = (list: any[]) =>
      list.map((item) => {
        if (item.id !== id) return item;
        if (!item.accountStatus) return item;
        const isActive = !item.accountStatus.active;
        return {
          ...item,
          accountStatus: {
            active: isActive,
            text: isActive ? "جاري" : "معطل",
          },
        };
      });

    setIndividualCoupons((prev) => toggleStatus(prev));
    setCompanyCoupons((prev) => toggleStatus(prev));
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
            render: (value: any, row: any) => {
              if (!value) {
                return <span className="text-gray-400">-</span>;
              }

              const statusText = value.text ?? "-";
              const statusLower = statusText.toLowerCase();

              // Determine colors based on status
              let bgColor = "bg-gray-100";
              let textColor = "text-gray-700";
              let indicatorColor = "bg-gray-400";

              if (statusLower.includes("منتهي") || statusLower.includes("expired")) {
                // Expired - grey
                bgColor = "bg-gray-100";
                textColor = "text-gray-700";
                indicatorColor = "bg-gray-400";
              } else if (statusLower.includes("معلق") || statusLower.includes("pending")) {
                // Pending - orange/yellow
                bgColor = "bg-yellow-100";
                textColor = "text-orange-700";
                indicatorColor = "bg-orange-400";
              } else if (statusLower.includes("جاري") || statusLower.includes("active")) {
                // Active - purple/blue
                bgColor = "bg-blue-100";
                textColor = "text-purple-700";
                indicatorColor = "bg-purple-400";
              }

              return (
                <div className="flex items-center justify-center gap-2">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bgColor}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${indicatorColor}`}></span>
                    <span className={`text-sm font-medium ${textColor}`}>
                      {statusText}
                    </span>
                  </div>
                </div>
              );
            },
          };
        }
        return col;
      }),
    [handleToggleStatus, viewDetailsRoute]
  );

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return activeData.slice(start, start + itemsPerPage);
  }, [activeData, currentPage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(activeData.length / itemsPerPage));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [activeData, currentPage]);

  const renderTableContent = useCallback(
    (visibleColumns: any[], className?: string) => {
      if (loading) {
        return (
          <div className="flex w-full justify-center py-16">
            <LoadingSpinner message="جاري تحميل بيانات الكوبونات..." />
          </div>
        );
      }

      if (error) {
        return (
          <div className="flex w-full justify-center py-16 text-red-600 text-base">
            {error}
          </div>
        );
      }

      if (!activeData.length) {
        return (
          <div className="flex w-full justify-center py-16 text-gray-500 text-base">
            لا توجد كوبونات متاحة للعرض.
          </div>
        );
      }

      return <Table columns={visibleColumns} data={paginatedData} className={className} />;
    },
    [activeData, error, loading, paginatedData]
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
              الكوبونات ({activeTab === "individuals" ? individualCoupons.length : companyCoupons.length})
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
            <ExportMenu data={activeData} columns={columns} />
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
            {renderTableContent(enhancedColumns, "relative self-stretch w-full flex-[0_0_auto]")}
          </div>

          {/* Tablet Responsive Table View */}
          <div className="hidden md:block lg:hidden w-full overflow-x-auto">
            {renderTableContent(
              (enhancedColumns as any).filter((col: any) => col.priority !== "low"),
              "relative self-stretch w-full flex-[0_0_auto]"
            )}
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
          totalPages={Math.ceil(activeData.length / itemsPerPage) || 1}
          onPageChange={setCurrentPage}
        />
      </main>
    </div>
  );
};

export default PetrolifeCoupons;
