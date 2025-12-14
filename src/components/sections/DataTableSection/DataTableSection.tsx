import { useEffect, useState, useRef, useMemo } from "react";
import { Table } from "../../shared/Table/Table";
import { Pagination } from "../../shared/Pagination/Pagination";
import { useNavigate } from "react-router-dom";
import {
  CirclePlus,
  Download,
  MoreVertical,
  FileSpreadsheet,
  FileText,
  Trash2,
  User,
  LucideIcon,
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";
import { createPortal } from "react-dom";
import { TimeFilter } from "../../shared/TimeFilter/TimeFilter";
import { RTLSelect } from "../../shared/Form/RTLSelect";
import { StatusToggle } from "../../shared/StatusToggle";
import {
  acceptStationsCompanyRequest,
  declineStationsCompanyRequest,
} from "../../../services/firestore";
import { useToast } from "../../../context/ToastContext";
import { exportDataTable } from "../../../services/exportService";

// Generic props interface for DataTableSection
export interface DataTableSectionProps<T> {
  title: string;
  entityName: string; // e.g., "عامل" or "محطة"
  entityNamePlural: string; // e.g., "عمال" or "محطات"
  icon: LucideIcon;
  columns: any[];
  fetchData: () => Promise<T[]>;
  onToggleStatus?: (id: number | string) => void;
  onDelete?: (id: number | string) => void;
  onApprove?: (id: number | string) => void; // New: For wallet request approval
  onReject?: (id: number | string) => void; // New: For wallet request rejection
  processingId?: string | null; // New: For showing loading state on specific row
  addNewRoute: string;
  onAddClick?: () => void; // Custom handler for add button click
  customAddButtonRef?: React.RefObject<HTMLButtonElement>; // Ref for custom add button
  viewDetailsRoute: (id: string | number | string) => string;
  loadingMessage?: string;
  errorMessage?: string;
  itemsPerPage?: number;
  showTimeFilter?: boolean; // New prop to control TimeFilter visibility
  showAddButton?: boolean; // New prop to control Add button visibility
  filterOptions?: any[]; // New prop for RTLSelect filters
  customFilterButton?: {
    label: string;
    count: number;
    onClick: () => void;
  }; // New prop for custom filter button with count
  customActionButtons?: boolean; // New prop to show Accept/Reject buttons instead of View/Delete
  showMoneyRefundButton?: boolean; // New prop to show money refund requests button
  showFuelDeliveryButton?: boolean; // New prop to show fuel delivery requests button
  showModifyButton?: boolean; // New prop to show Modify button instead of action menu
  refreshTrigger?: number; // New prop to trigger data refresh when changed
  customExportHandler?: (
    data: any[],
    filters: Record<string, string>,
    format: "excel" | "pdf"
  ) => Promise<void>; // Custom export handler for specialized reports
}

// Generic Action Menu Component
interface ActionMenuProps<
  T extends { id: number | string; driverCode?: string; stationCode?: string }
> {
  item: T;
  entityName: string;
  viewDetailsRoute: (id: string | number | string) => string;
  customActionButtons?: boolean;
  showModifyButton?: boolean;
  onDelete?: (id: number | string) => void;
  onApprove?: (id: number | string) => void; // New: For wallet request approval
  onReject?: (id: number | string) => void; // New: For wallet request rejection
  processingId?: string | null; // New: For showing loading state
}

const ActionMenu = <
  T extends {
    id: string | number | string;
    driverCode?: string;
    stationCode?: string;
  }
>({
  item,
  entityName,
  viewDetailsRoute,
  customActionButtons = false,
  showModifyButton = false,
  onDelete,
  onApprove,
  onReject,
  processingId,
}: ActionMenuProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Check if this item is being processed
  const isThisItemProcessing = processingId === String(item.id);

  const handleAction = async (action: string) => {
    console.log(
      `${action} clicked for item:`,
      item.driverCode || item.stationCode
    );
    if (action === "view") {
      navigate(viewDetailsRoute(item.id));
      setIsOpen(false);
    } else if (action === "delete" && onDelete) {
      // Close the action menu first
      setIsOpen(false);
      // Use setTimeout to ensure menu closes before opening dialog
      // This prevents any race conditions with rerenders
      setTimeout(() => {
        // Call onDelete which should open the confirmation dialog
        // Don't await it or reload - let the parent component handle the actual deletion
        onDelete(item.id);
      }, 0);
    } else {
      setIsOpen(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      console.log("Accepting request for:", item);

      const success = await acceptStationsCompanyRequest(String(item.id));

      if (success) {
        addToast({
          type: "success",
          message: "تم قبول طلب الانضمام بنجاح",
          duration: 3000,
        });
        // Refresh the page to update the data
        window.location.reload();
      } else {
        addToast({
          type: "error",
          message: "فشل في قبول طلب الانضمام",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      addToast({
        type: "error",
        message: "حدث خطأ أثناء قبول طلب الانضمام",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
      setIsOpen(false);
    }
  };

  const handleRejectRequest = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      console.log("Rejecting request for:", item);

      const success = await declineStationsCompanyRequest(String(item.id));

      if (success) {
        addToast({
          type: "success",
          message: "تم رفض طلب الانضمام",
          duration: 3000,
        });
        // Refresh the page to update the data
        window.location.reload();
      } else {
        addToast({
          type: "error",
          message: "فشل في رفض طلب الانضمام",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      addToast({
        type: "error",
        message: "حدث خطأ أثناء رفض طلب الانضمام",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
      setIsOpen(false);
    }
  };

  const handleModifyService = () => {
    console.log("Modifying service:", item);
    // TODO: Implement modify service logic
    // alert(`تعديل الخدمة: ${item.id}`);
    navigate(`/application-services/${item.id}`);
  };

  // New: Handle wallet request approval
  const handleApproveWalletRequest = async () => {
    if (isProcessing || !onApprove) return;

    setIsOpen(false);
    // Call parent handler which handles confirmation and processing
    onApprove(item.id);
  };

  // New: Handle wallet request rejection
  const handleRejectWalletRequest = async () => {
    if (isProcessing || !onReject) return;

    setIsOpen(false);
    // Call parent handler which handles confirmation and processing
    onReject(item.id);
  };

  const updateMenuPosition = () => {
    if (!buttonRef) return;

    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 192; // 48 * 4 (w-48 = 12rem = 192px)
    const viewportWidth = window.innerWidth;

    // Calculate position to the right of the icon
    let left = rect.right + 4;

    // If menu would go off-screen to the right, position it to the left of the icon
    if (left + menuWidth > viewportWidth) {
      left = rect.left - menuWidth - 4;
    }

    const newPosition = {
      top: rect.bottom + 4, // Position below the button
      left: Math.max(4, left), // Ensure it doesn't go off-screen to the left
    };

    setMenuPosition(newPosition);
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
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              // Only close if clicking directly on backdrop
              if (e.target === e.currentTarget) {
                setIsOpen(false);
              }
            }}
            onMouseDown={(e) => {
              // Prevent any mouse events from interfering
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          />

          {createPortal(
            <div
              className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                {customActionButtons ? (
                  <>
                    <button
                      onClick={handleAcceptRequest}
                      disabled={isProcessing}
                      className={`w-full px-4 py-2 text-right text-sm flex items-center justify-end gap-2 transition-colors ${
                        isProcessing
                          ? "text-gray-400 cursor-not-allowed bg-gray-50"
                          : "text-green-600 hover:bg-green-50"
                      }`}
                    >
                      <span>
                        {isProcessing
                          ? "جاري المعالجة..."
                          : "قبول طلب الانضمام"}
                      </span>
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRejectRequest}
                      disabled={isProcessing}
                      className={`w-full px-4 py-2 text-right text-sm flex items-center justify-end gap-2 transition-colors ${
                        isProcessing
                          ? "text-gray-400 cursor-not-allowed bg-gray-50"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <span>
                        {isProcessing ? "جاري المعالجة..." : "رفض طلب الانضمام"}
                      </span>
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                ) : onApprove && onReject ? (
                  // Wallet request approve/reject buttons
                  <>
                    <button
                      onClick={handleApproveWalletRequest}
                      disabled={isThisItemProcessing}
                      className={`w-full px-4 py-2 text-right text-sm flex items-center justify-end gap-2 transition-colors ${
                        isThisItemProcessing
                          ? "text-gray-400 cursor-not-allowed bg-gray-50"
                          : "text-green-600 hover:bg-green-50"
                      }`}
                    >
                      <span>
                        {isThisItemProcessing ? "جاري المعالجة..." : "الموافقة"}
                      </span>
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRejectWalletRequest}
                      disabled={isThisItemProcessing}
                      className={`w-full px-4 py-2 text-right text-sm flex items-center justify-end gap-2 transition-colors ${
                        isThisItemProcessing
                          ? "text-gray-400 cursor-not-allowed bg-gray-50"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <span>
                        {isThisItemProcessing ? "جاري المعالجة..." : "الرفض"}
                      </span>
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                ) : showModifyButton ? (
                  <>
                    <button
                      onClick={handleModifyService}
                      className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                    >
                      <span>تعديل الخدمة</span>
                      <Edit className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleAction("view")}
                      className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                    >
                      <span>عرض بيانات {entityName}</span>
                      <User className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAction("delete");
                      }}
                      disabled={isProcessing || !onDelete}
                      type="button"
                      className={`w-full px-4 py-2 text-right text-sm flex items-center justify-end gap-2 transition-colors ${
                        isProcessing || !onDelete
                          ? "text-gray-400 cursor-not-allowed bg-gray-50"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <span>
                        {isProcessing ? "جاري الحذف..." : `حذف ${entityName}`}
                      </span>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
};

// Export Menu Component
interface ExportMenuProps {
  data: any[];
  columns: any[];
  title: string;
  entityNamePlural: string;
  filters?: Record<string, string>;
  customExportHandler?: (
    data: any[],
    filters: Record<string, string>,
    format: "excel" | "pdf"
  ) => Promise<void>;
}

const ExportMenu = ({
  data,
  columns,
  title,
  entityNamePlural,
  filters = {},
  customExportHandler,
}: ExportMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const { addToast } = useToast();

  const handleExport = async (format: string) => {
    try {
      // If custom export handler is provided, use it
      if (customExportHandler) {
        await customExportHandler(data, filters, format as "excel" | "pdf");
        addToast({
          type: "success",
          title: "نجح التصدير",
          message: `تم تصدير التقرير ${
            filters.reportType === "تحليلي"
              ? "التفصيلي"
              : filters.reportType === "تفصيلي" || filters.reportType === "ملخص"
              ? "الإجمالي"
              : ""
          } بنجاح كـ ${format === "excel" ? "Excel" : "PDF"}`,
        });
        setIsOpen(false);
        return;
      }

      // Default export logic
      // Transform columns to export format (exclude actions column)
      const exportColumns = columns
        .filter((col) => col.key !== "actions")
        .map((col) => ({
          key: col.key,
          label: col.label || col.key,
        }));

      // Transform data for export (flatten nested objects)
      const exportData = data.map((item: any) => {
        const flattened: any = {};
        exportColumns.forEach((col) => {
          const value = item[col.key];
          if (value && typeof value === "object" && !Array.isArray(value)) {
            // Handle accountStatus, stationStatus, etc.
            if (value.text !== undefined) {
              flattened[col.key] = value.text;
            } else if (value.name !== undefined) {
              flattened[col.key] = value.name;
            } else if (value.active !== undefined) {
              flattened[col.key] = value.active ? "مفعل" : "معطل";
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
        entityNamePlural.toLowerCase().replace(/\s+/g, "-"),
        format as "excel" | "pdf",
        `تقرير ${title}`
      );

      addToast({
        type: "success",
        title: "نجح التصدير",
        message: `تم تصدير البيانات بنجاح كـ ${
          format === "excel" ? "Excel" : "PDF"
        }`,
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

  const updateMenuPosition = () => {
    if (!buttonRef) return;

    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 150;
    const viewportWidth = window.innerWidth;

    // Calculate position to the right of the button
    let left = rect.right + 4;

    // If menu would go off-screen to the right, position it to the left of the button
    if (left + menuWidth > viewportWidth) {
      left = rect.left - menuWidth - 4;
    }

    const newPosition = {
      top: rect.bottom + 4, // Position below the button
      left: Math.max(4, left), // Ensure it doesn't go off-screen to the left
    };

    setMenuPosition(newPosition);
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
        className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
      >
        <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
          <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
            <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
              تصدير
            </span>
          </div>
          <Download className="w-4 h-4 text-gray-500" />
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {createPortal(
            <div
              className="fixed w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
            >
              <div className="py-1">
                <button
                  onClick={() => handleExport("excel")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>ملف Excel</span>
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>ملف PDF</span>
                  <FileText className="w-4 h-4" />
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

// Generic DataTableSection Component
export const DataTableSection = <
  T extends {
    id: string | number | string;
    driverCode?: string;
    stationCode?: string;
    accountStatus?: { active: boolean; text: string };
    stationStatus?: { active: boolean; text: string };
  }
>({
  title,
  entityName,
  entityNamePlural,
  icon: Icon,
  columns,
  fetchData,
  onToggleStatus,
  addNewRoute,
  onAddClick,
  customAddButtonRef,
  viewDetailsRoute,
  errorMessage,
  itemsPerPage = 10,
  showTimeFilter = false,
  showAddButton = true,
  filterOptions = [],
  customFilterButton,
  customActionButtons = false,
  showMoneyRefundButton = false,
  showFuelDeliveryButton = false,
  showModifyButton = false,
  onDelete,
  onApprove,
  onReject,
  processingId,
  refreshTrigger = 0,
  customExportHandler,
}: DataTableSectionProps<T>): JSX.Element => {
  const navigate = useNavigate();
  const [data, setData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("الكل");
  // Use ref to store fetchData to prevent unnecessary rerenders
  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  // Initialize filters state based on filterOptions
  const initialFilters = filterOptions.reduce((acc, filter) => {
    const key =
      filter.label === "نوع التقرير"
        ? "reportType"
        : filter.label === "اسم المنتج"
        ? "productName"
        : filter.label === "قائمة المحطات"
        ? "stationList"
        : filter.label === "المدينة"
        ? "city"
        : filter.label === "رقم العملية"
        ? "operationNumber"
        : filter.label === "كود العميل"
        ? "clientCode"
        : filter.label === "نوع العميل"
        ? "clientType"
        : filter.label === "نوع المركبة"
        ? "vehicleType"
        : filter.label === "كود المندوب"
        ? "agentCode"
        : filter.label === "اسم المندوب"
        ? "agentName"
        : filter.label === "نوع المنتج"
        ? "productType"
        : filter.label === "اسم العميل"
        ? "clientName"
        : filter.label === "نوع العملية"
        ? "operationType"
        : filter.label === "رسوم الخدمة"
        ? "serviceFees"
        : filter.label === "اسم مزود الخدمة"
        ? "serviceProviderName"
        : filter.label === "رقم المنتج"
        ? "productNumber"
        : filter.label === "كود السائق"
        ? "driverCode"
        : filter.label === "رقم المركبة"
        ? "carNumber"
        : filter.label === "كود"
        ? "refId"
        : filter.label.toLowerCase().replace(/\s+/g, "");
    acc[key] = filter.value;
    return acc;
  }, {} as Record<string, string>);

  const [filters, setFilters] =
    useState<Record<string, string>>(initialFilters);

  // Handle filter changes
  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  // Fetch data on component mount or when refreshTrigger changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`Loading ${entityNamePlural} data...`);
        const fetchedData = await fetchDataRef.current();
        setData(fetchedData);
      } catch (err) {
        console.error(`Error loading ${entityNamePlural}:`, err);
        setError(errorMessage || `فشل في تحميل بيانات ${entityNamePlural}`);
        // Try to load data anyway as fallback
        try {
          const fallbackData = await fetchDataRef.current();
          setData(fallbackData);
        } catch {
          // If fallback also fails, keep empty data
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // Refresh when refreshTrigger changes or on initial mount
  }, [refreshTrigger, entityNamePlural, errorMessage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleToggleStatus = (itemId: number | string) => {
    if (onToggleStatus) {
      onToggleStatus(itemId);
      // Update local state
      setData((prevData) =>
        prevData.map((item) => {
          if (item.id === itemId) {
            if (item.accountStatus) {
              return {
                ...item,
                accountStatus: {
                  active: !item.accountStatus.active,
                  text: !item.accountStatus.active ? "مفعل" : "معطل",
                },
              };
            }
            if ((item as any).stationStatus) {
              return {
                ...item,
                stationStatus: {
                  active: !(item as any).stationStatus.active,
                  text: !(item as any).stationStatus.active ? "مفعل" : "معطل",
                },
              };
            }
          }
          return item;
        })
      );
    }
  };

  // Apply all filters to data
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    let filtered = [...data];

    // Apply each filter
    Object.keys(filters).forEach((filterKey) => {
      const filterValue = filters[filterKey];

      // Skip reportType - it's for export only, not data filtering
      if (filterKey === "reportType") {
        return;
      }

      // Skip if filter is "الكل" or empty
      if (!filterValue || filterValue === "الكل" || filterValue.trim() === "") {
        return;
      }

      // Map filter keys to data field names
      const fieldMap: Record<string, string> = {
        productName: "productName",
        stationList: "stationList",
        city: "city",
        operationNumber: "operationNumber",
        clientCode: "clientCode",
        clientType: "clientType",
        vehicleType: "vehicleType",
        agentCode: "agentCode",
        agentName: "agentName",
        productType: "productType",
        operationType: "operationType",
        clientName: "clientName",
        serviceFees: "serviceFees",
        serviceProviderName: "serviceProviderName",
        productNumber: "productNumber",
        driverCode: "driverCode",
        carNumber: "carNumber",
        refId: "refId",
        // Additional mappings for service provider reports
        service: "service",
        // Additional mappings for financial reports
        carType: "carType",
        driverName: "driverName",
      };

      const fieldName = fieldMap[filterKey] || filterKey;

      // Apply filter based on field type
      filtered = filtered.filter((item: any) => {
        const itemValue = item[fieldName];

        // Handle nested objects
        let actualValue: any = itemValue;
        if (
          itemValue &&
          typeof itemValue === "object" &&
          !Array.isArray(itemValue)
        ) {
          if (itemValue.text !== undefined) {
            actualValue = itemValue.text;
          } else if (itemValue.name !== undefined) {
            actualValue = itemValue.name;
          } else if (itemValue.ar !== undefined) {
            actualValue = itemValue.ar;
          } else if (itemValue.en !== undefined) {
            actualValue = itemValue.en;
          } else {
            actualValue = String(itemValue);
          }
        }

        // Handle arrays
        if (Array.isArray(itemValue)) {
          actualValue = itemValue.join(", ");
        }

        // Convert to string for comparison
        const itemStr = String(actualValue || "")
          .toLowerCase()
          .trim();
        const filterStr = String(filterValue).toLowerCase().trim();

        // Skip if filter is empty or "الكل"
        if (!filterStr || filterStr === "الكل") {
          return true;
        }

        // Special handling for clientType: map "افؤاد" to "فرد"
        if (fieldName === "clientType") {
          const normalizedItemValue =
            itemStr === "افؤاد" || itemStr === "فرد" ? "فرد" : itemStr;
          const normalizedFilterValue =
            filterStr === "افؤاد" || filterStr === "فرد" ? "فرد" : filterStr;
          return normalizedItemValue === normalizedFilterValue;
        }

        // For code fields (agentCode, clientCode, etc.), use exact match
        if (
          fieldName.includes("Code") ||
          fieldName.includes("Number") ||
          fieldName === "refId" ||
          fieldName === "operationNumber"
        ) {
          return (
            itemStr === filterStr || String(actualValue) === String(filterValue)
          );
        }

        // For text fields, use partial match (includes)
        return itemStr.includes(filterStr) || itemStr === filterStr;
      });
    });

    return filtered;
  }, [data, filters]);

  // Calculate paginated data from filtered data
  const paginatedData = useMemo(() => {
    return filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredData, currentPage, itemsPerPage]);

  // Enhance columns with ActionMenu - memoized to prevent unnecessary rerenders
  const enhancedColumns = useMemo(() => {
    return columns.map((col) => {
      if (col.key === "actions") {
        return {
          ...col,
          render: (_: any, row: T) => (
            <ActionMenu
              item={row}
              entityName={entityName}
              viewDetailsRoute={viewDetailsRoute}
              customActionButtons={customActionButtons}
              showModifyButton={showModifyButton}
              onDelete={onDelete}
              onApprove={onApprove}
              onReject={onReject}
              processingId={processingId}
            />
          ),
        };
      }
      if (
        (col.key === "accountStatus" || col.key === "stationStatus") &&
        onToggleStatus
      ) {
        return {
          ...col,
          render: (value: any, row: T) => (
            <StatusToggle
              isActive={value.active}
              onToggle={() => handleToggleStatus(row.id)}
              statusText={value.text}
            />
          ),
        };
      }
      // Custom render for ibanImage column
      if (col.key === "ibanImage") {
        return {
          ...col,
          render: (value: any) => {
            if (!value || value === "-") {
              return <span className="text-gray-400">-</span>;
            }
            if (typeof value === "object" && value.url) {
              return (
                <a
                  href={value.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {value.display || "عرض الصورة"}
                </a>
              );
            }
            // Fallback for string URLs
            return (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-xs break-all"
                onClick={(e) => e.stopPropagation()}
              >
                عرض الصورة
              </a>
            );
          },
        };
      }
      return col;
    });
  }, [
    columns,
    entityName,
    viewDetailsRoute,
    customActionButtons,
    showModifyButton,
    onDelete,
    onToggleStatus,
    onApprove,
    onReject,
    processingId,
  ]);

  return (
    <section className="flex flex-col items-start gap-5 w-full">
      {/* Error Message */}
      {error && (
        <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-center [direction:rtl]">{error}</p>
        </div>
      )}

      {/* Main Data Table Section */}
      <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
        <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            {showTimeFilter ? (
              // Show TimeFilter on the left side
              <div className="flex items-center">
                <TimeFilter
                  selectedFilter={selectedFilter}
                  onFilterChange={setSelectedFilter}
                />
              </div>
            ) : (
              // Show buttons for other entities
              <div className="inline-flex items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]">
                {showAddButton &&
                  !showMoneyRefundButton &&
                  !showFuelDeliveryButton && (
                    <button
                      ref={customAddButtonRef}
                      onClick={onAddClick || (() => navigate(addNewRoute))}
                      className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                    >
                      <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                        <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                          <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                            إضافة {entityName} جديد
                          </span>
                        </div>
                        <CirclePlus className="w-4 h-4 text-gray-500" />
                      </div>
                    </button>
                  )}

                {customFilterButton && (
                  <button
                    onClick={customFilterButton.onClick}
                    className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                  >
                    <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                        <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                          {customFilterButton.label} ({customFilterButton.count}
                          )
                        </span>
                      </div>
                    </div>
                  </button>
                )}

                {showMoneyRefundButton && (
                  <button
                    onClick={() =>
                      navigate("/wallet-requests/moneyrefundrequests")
                    }
                    className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                  >
                    <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                        <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                          طلبات استرداد الاموال
                        </span>
                      </div>
                    </div>
                  </button>
                )}

                {showFuelDeliveryButton && (
                  <button
                    onClick={() =>
                      navigate(
                        "/fuel-delivery-requests/received-delivery-requests"
                      )
                    }
                    className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                  >
                    <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                        <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                          طلبات التوصيل المستلمة
                        </span>
                      </div>
                    </div>
                  </button>
                )}

                <ExportMenu
                  data={filteredData}
                  columns={columns}
                  title={title}
                  entityNamePlural={entityNamePlural}
                  filters={filters}
                  customExportHandler={customExportHandler}
                />
              </div>
            )}

            {/* Always show title on the right side */}
            <div className="flex items-center justify-end gap-1.5 relative">
              <h1 className="relative mt-[-1.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]">
                {title}
              </h1>
              <Icon className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </header>

        {/* RTLSelect Filters Section */}
        {filterOptions.length > 0 && (
          <div className="flex flex-col gap-4 relative self-stretch w-full flex-[0_0_auto]">
            {Array.from(
              { length: Math.ceil(filterOptions.length / 5) },
              (_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex items-center gap-[13px] relative self-stretch w-full flex-[0_0_auto]"
                >
                  {filterOptions
                    .slice(rowIndex * 5, (rowIndex + 1) * 5)
                    .map((filter, index) => (
                      <div
                        key={rowIndex * 5 + index}
                        className="flex-1 min-w-0"
                      >
                        <RTLSelect
                          label={filter.label}
                          value={
                            filters[
                              filter.label === "نوع التقرير"
                                ? "reportType"
                                : filter.label === "اسم المنتج"
                                ? "productName"
                                : filter.label === "قائمة المحطات"
                                ? "stationList"
                                : filter.label === "المدينة"
                                ? "city"
                                : filter.label === "رقم العملية"
                                ? "operationNumber"
                                : filter.label === "كود العميل"
                                ? "clientCode"
                                : filter.label === "نوع العميل"
                                ? "clientType"
                                : filter.label === "نوع المركبة"
                                ? "vehicleType"
                                : filter.label === "كود المندوب"
                                ? "agentCode"
                                : filter.label === "اسم المندوب"
                                ? "agentName"
                                : filter.label === "نوع المنتج"
                                ? "productType"
                                : filter.label === "اسم العميل"
                                ? "clientName"
                                : filter.label === "نوع العملية"
                                ? "operationType"
                                : filter.label === "رسوم الخدمة"
                                ? "serviceFees"
                                : filter.label === "اسم مزود الخدمة"
                                ? "serviceProviderName"
                                : filter.label === "رقم المنتج"
                                ? "productNumber"
                                : filter.label === "كود السائق"
                                ? "driverCode"
                                : filter.label === "رقم المركبة"
                                ? "carNumber"
                                : filter.label === "كود"
                                ? "refId"
                                : filter.label.toLowerCase().replace(/\s+/g, "")
                            ]
                          }
                          onChange={(value) =>
                            handleFilterChange(
                              filter.label === "نوع التقرير"
                                ? "reportType"
                                : filter.label === "اسم المنتج"
                                ? "productName"
                                : filter.label === "قائمة المحطات"
                                ? "stationList"
                                : filter.label === "المدينة"
                                ? "city"
                                : filter.label === "رقم العملية"
                                ? "operationNumber"
                                : filter.label === "كود العميل"
                                ? "clientCode"
                                : filter.label === "نوع العميل"
                                ? "clientType"
                                : filter.label === "نوع المركبة"
                                ? "vehicleType"
                                : filter.label === "كود المندوب"
                                ? "agentCode"
                                : filter.label === "اسم المندوب"
                                ? "agentName"
                                : filter.label === "نوع المنتج"
                                ? "productType"
                                : filter.label === "اسم العميل"
                                ? "clientName"
                                : filter.label === "نوع العملية"
                                ? "operationType"
                                : filter.label === "رسوم الخدمة"
                                ? "serviceFees"
                                : filter.label === "اسم مزود الخدمة"
                                ? "serviceProviderName"
                                : filter.label === "رقم المنتج"
                                ? "productNumber"
                                : filter.label === "كود السائق"
                                ? "driverCode"
                                : filter.label === "رقم المركبة"
                                ? "carNumber"
                                : filter.label === "كود"
                                ? "refId"
                                : filter.label
                                    .toLowerCase()
                                    .replace(/\s+/g, ""),
                              value
                            )
                          }
                          options={filter.options}
                          placeholder={filter.value}
                        />
                      </div>
                    ))}
                </div>
              )
            )}
          </div>
        )}

        <main className="flex flex-col items-start gap-7 relative self-stretch w-full flex-[0_0_auto]">
          {/* Error Message */}
          {error && !isLoading && (
            <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-center [direction:rtl]">
                {error}
              </p>
            </div>
          )}

          {/* Table Content */}
          <div className="flex flex-col items-end gap-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto]">
            {/* Desktop Table View */}
            <div className="hidden lg:block w-full overflow-x-auto">
              <Table
                columns={enhancedColumns}
                data={paginatedData}
                loading={isLoading}
                emptyMessage="لا توجد بيانات"
                className="relative self-stretch w-full flex-[0_0_auto]"
              />
            </div>

            {/* Tablet Responsive Table View */}
            <div className="hidden md:block lg:hidden w-full overflow-x-auto">
              <Table
                columns={enhancedColumns.filter(
                  (col) => col.priority === "high" || col.priority === "medium"
                )}
                data={paginatedData}
                loading={isLoading}
                emptyMessage="لا توجد بيانات"
                className="relative self-stretch w-full flex-[0_0_auto]"
              />
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 w-full">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-color-mode-text-icons-t-sec">
                    جاري التحميل...
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  عرض الجوال غير متوفر حالياً
                </div>
              )}
            </div>
          </div>

          {!isLoading && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredData.length / itemsPerPage) || 1}
              onPageChange={handlePageChange}
            />
          )}
        </main>
      </div>
    </section>
  );
};
