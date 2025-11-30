import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Table, Pagination, ExportButton, LoadingSpinner } from "../../../shared";
import { FileText, MoreVertical, Trash2, Eye, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Input, Select } from "../../../shared/Form";
import { exportDataTable } from "../../../../services/exportService";
import { exportInvoiceToPDF } from "../../../../services/invoiceExportService";
import { useToast } from "../../../../context/ToastContext";
import { fetchInvoices } from "../../../../services/invoiceService";
import { Invoice } from "../../../../types/invoice";

// Action Menu Component for each row
interface ActionMenuProps {
  item: any;
}

const ActionMenu = ({ item }: ActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();
  const { addToast } = useToast();

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

  const handleAction = async (action: string) => {
    if (action === "view") {
      // Determine route based on invoice type
      if (item.type === "Subscription") {
        navigate(`/subscription-invoice/${item.id}`);
      } else {
        navigate(`/fuel-invoice/${item.id}`);
      }
    } else if (action === "download") {
      try {
        // Get the full invoice object (it's stored in the item)
        const invoice = item.invoice || item;
        // Export the actual invoice UI as PDF
        await exportInvoiceToPDF(invoice);
        addToast({
          title: "نجح التصدير",
          message: `تم تصدير الفاتورة بنجاح`,
          type: "success",
        });
      } catch (error) {
        console.error("Export error:", error);
        addToast({
          title: "فشل التصدير",
          message: "حدث خطأ أثناء تصدير الفاتورة",
          type: "error",
        });
      }
    } else if (action === "delete") {
      // Handle delete - can be implemented later
      console.log("Delete invoice:", item.id);
    }
    setIsOpen(false);
  };

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
                  <span>عرض التفاصيل</span>
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleAction("download")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>تحميل الفاتورة</span>
                  <Download className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleAction("delete")}
                  className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>حذف الفاتورة</span>
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

const InvoiceReports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    reportType: "تحليلي",
    operationType: "",
    operationCode: "",
  });
  const itemsPerPage = 10;
  const STORAGE_KEY = "admin_invoice_reports_cache";

  // Initialize state from cache if available
  const getCachedInvoices = (): Invoice[] => {
    try {
      const cachedData = sessionStorage.getItem(STORAGE_KEY);
      if (cachedData) {
        const parsedInvoices = JSON.parse(cachedData);
        // Restore dates from strings
        return parsedInvoices.map((inv: any) => ({
          ...inv,
          createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
        }));
      }
    } catch (error) {
      console.error("Error parsing cached invoices:", error);
      sessionStorage.removeItem(STORAGE_KEY);
    }
    return [];
  };

  // Initialize with cached data if available
  const cachedInvoices = getCachedInvoices();
  const [invoices, setInvoices] = useState<Invoice[]>(cachedInvoices);
  const [isLoading, setIsLoading] = useState(cachedInvoices.length === 0);

  // Load invoices from Firestore
  useEffect(() => {
    let isMounted = true;

    // If we already have cached data, don't show loading
    if (invoices.length > 0) {
      setIsLoading(false);
    }

    const loadData = async () => {
      // Only show loading if we don't have cached data
      if (invoices.length === 0) {
        setIsLoading(true);
      }
      try {
        const fetchedInvoices = await fetchInvoices();
        // Only update state if component is still mounted
        if (isMounted) {
          setInvoices(fetchedInvoices);
          // Cache the data (convert dates to strings for storage)
          const dataToCache = fetchedInvoices.map((inv) => ({
            ...inv,
            createdAt: inv.createdAt instanceof Date 
              ? inv.createdAt.toISOString() 
              : inv.createdAt?.toDate 
              ? inv.createdAt.toDate().toISOString()
              : new Date().toISOString(),
          }));
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToCache));
        }
      } catch (error) {
        console.error("Error loading invoices:", error);
        if (isMounted) {
          addToast({
            title: "خطأ في التحميل",
            message: "فشل في تحميل الفواتير",
            type: "error",
          });
          // Only clear if we don't have cached data
          if (invoices.length === 0) {
            setInvoices([]);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Always fetch fresh data, but show cached data immediately
    loadData();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Map invoices to table format
  const mappedInvoices = useMemo(() => {
    return invoices.map((invoice) => {
      const clientName =
        invoice.clientData?.name ||
        invoice.clientData?.brandName ||
        invoice.companyData?.name ||
        invoice.companyData?.brandName ||
        "غير محدد";

      const invoiceDate =
        invoice.createdAt instanceof Date
          ? invoice.createdAt
          : typeof invoice.createdAt === "string"
          ? new Date(invoice.createdAt)
          : invoice.createdAt?.toDate
          ? invoice.createdAt.toDate()
          : new Date();

      // Format date in Gregorian calendar
      const formattedDate = invoiceDate.toLocaleDateString(
        "ar-SA-u-ca-gregory",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      // Get invoice code (refId)
      let invoiceCode = invoice.invoiceNumber; // Fallback to invoice number
      if (invoice.type === "Client") {
        invoiceCode =
          invoice.refId ||
          invoice.clientData?.refId ||
          invoice.clientData?.refid ||
          invoice.clientData?.clientRefId ||
          invoice.invoiceNumber;
      } else if (invoice.type === "Company Monthly Invoice") {
        invoiceCode =
          invoice.orders?.[0]?.refId ||
          invoice.orders?.[0]?.refid ||
          invoice.refId ||
          invoice.invoiceNumber;
      } else {
        invoiceCode = invoice.refId || invoice.invoiceNumber;
      }

      // Determine invoice status (all invoices are considered paid/active for now)
      const invoiceStatus = {
        text: "مدفوعة",
        className: "bg-green-100 text-green-800 border-green-200",
      };

      return {
        id: invoice.id,
        invoiceId: invoice.id,
        referenceNumber: invoiceCode,
        clientName,
        invoiceValue: `${invoice.total.toLocaleString("en-US")} ر.س`,
        creationDate: formattedDate,
        invoiceStatus,
        type: invoice.type,
        invoice, // Store full invoice object for actions
      };
    });
  }, [invoices]);

  // Filter invoices based on filter state
  const filteredInvoices = useMemo(() => {
    let filtered = mappedInvoices;

    // Filter by operation code (invoice code/reference number)
    if (filters.operationCode && filters.operationCode.trim()) {
      filtered = filtered.filter((inv) =>
        inv.referenceNumber
          .toLowerCase()
          .includes(filters.operationCode.toLowerCase())
      );
    }

    // Filter by operation type (invoice type)
    if (filters.operationType && filters.operationType.trim()) {
      filtered = filtered.filter((inv) => {
        const invoiceType =
          inv.type === "Client"
            ? "عميل"
            : inv.type === "Company Monthly Invoice"
            ? "شركة"
            : inv.type === "Subscription"
            ? "اشتراك"
            : "";
        return invoiceType
          .toLowerCase()
          .includes(filters.operationType.toLowerCase());
      });
    }

    return filtered;
  }, [filters]);

  const columns = useMemo(
    () => [
      {
        key: "actions",
        label: "الإجراءات",
        width: "w-16",
        priority: "high",
        render: (_: any, row: any) => (
          <div className="flex items-center justify-center">
            <ActionMenu item={row} />
          </div>
        ),
      },
      {
        key: "invoiceStatus",
        label: "حالة الفاتورة",
        width: "min-w-[120px]",
        priority: "high",
        render: (value: any) => (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium border ${value.className}`}
          >
            {value.text}
          </span>
        ),
      },
      {
        key: "creationDate",
        label: "تاريخ الانشاء",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "invoiceValue",
        label: "قيمة الفاتورة",
        width: "min-w-[130px]",
        priority: "high",
      },
      {
        key: "clientName",
        label: "اسم العميل",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "referenceNumber",
        label: "الرقم المرجعي",
        width: "min-w-[120px]",
        priority: "high",
      },
    ],
    []
  );

  const paginatedData = useMemo(
    () =>
      filteredInvoices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filteredInvoices, currentPage]
  );

  const handleExport = async (format: string) => {
    try {
      const exportColumns = [
        { key: "referenceNumber", label: "الرقم المرجعي" },
        { key: "clientName", label: "اسم العميل" },
        { key: "invoiceValue", label: "قيمة الفاتورة" },
        { key: "creationDate", label: "تاريخ الانشاء" },
        { key: "invoiceStatus", label: "حالة الفاتورة" },
      ];

      const exportData = filteredInvoices.map((item) => ({
        referenceNumber: item.referenceNumber,
        clientName: item.clientName,
        invoiceValue: item.invoiceValue,
        creationDate: item.creationDate,
        invoiceStatus: item.invoiceStatus?.text || "-",
      }));

      await exportDataTable(
        exportData,
        exportColumns,
        "invoice-reports",
        format as "excel" | "pdf",
        "تقرير الفواتير"
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
    }
  };

  // Show loading only on initial load when we have no data
  if (isLoading && invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" message="جاري تحميل الفواتير..." />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        {/* Title on right */}
        <div className="flex items-center justify-end gap-1.5">
          <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
            تقارير الفواتير ({filteredInvoices.length})
          </h1>
          <FileText className="w-5 h-5 text-gray-500" />
        </div>
        {/* Export button on left */}
        <div className="flex items-center">
          <ExportButton onExport={handleExport} buttonText="تصدير التقرير" />
        </div>
      </div>

      {/* Filter Inputs */}
      <div className="w-full flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
          <Select
            label="نوع التقرير"
            value={filters.reportType}
            onChange={(value) => setFilters((prev) => ({ ...prev, reportType: value }))}
            options={[
              { value: "تحليلي", label: "تحليلي" },
              { value: "تفصيلي", label: "تفصيلي" },
            ]}
          />
          <Input
            label="نوع العملية"
            value={filters.operationType}
            onChange={(value) => setFilters((prev) => ({ ...prev, operationType: value }))}
            placeholder="أدخل نوع العملية"
          />
          <Input
            label="كود العملية"
            value={filters.operationCode}
            onChange={(value) => setFilters((prev) => ({ ...prev, operationCode: value }))}
            placeholder="أدخل كود العملية"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full flex flex-col gap-[var(--corner-radius-large)]">
        {/* Table Title */}
        <div className="flex items-center justify-between w-full">
          <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
            الفواتير ({filteredInvoices.length})
          </h2>
        </div>

        {/* Table Content */}
        <div className="w-full overflow-x-auto">
          <Table columns={columns} data={paginatedData} />
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredInvoices.length / itemsPerPage) || 1}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default InvoiceReports;
