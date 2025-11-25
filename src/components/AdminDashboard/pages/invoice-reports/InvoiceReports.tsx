import { useState, useMemo } from "react";
import { Table, Pagination, ExportButton } from "../../../shared";
import { FileText, MoreVertical, Trash2, Eye, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Input, Select } from "../../../shared/Form";
import { exportDataTable } from "../../../../services/exportService";
import { useToast } from "../../../../context/ToastContext";

// Mock data for 48 invoices
const mockInvoices = Array.from({ length: 48 }).map((_, i) => {
  const statusTypes = ["مدفوعة", "معلقة", "ملغاة"];
  const statusColors = {
    مدفوعة: "bg-green-100 text-green-800 border-green-200",
    معلقة: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ملغاة: "bg-red-100 text-red-800 border-red-200",
  };
  const status = statusTypes[i % 3];
  
  return {
    id: i + 1,
    referenceNumber: `INV${(i + 1).toString().padStart(3, "0")}`,
    clientName: i % 5 === 0 ? "محمد علي" : i % 5 === 1 ? "أحمد خالد" : i % 5 === 2 ? "سارة أحمد" : i % 5 === 3 ? "خالد مالك" : "فاطمة إبراهيم",
    invoiceValue: `${(i + 1) * 1000} ر.س`,
    creationDate: "21 فبراير 2024 - 10:30 ص",
    invoiceStatus: {
      text: status,
      className: statusColors[status as keyof typeof statusColors],
    },
  };
});

// Action Menu Component for each row
interface ActionMenuProps {
  item: any;
}

const ActionMenu = ({ item }: ActionMenuProps) => {
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
      console.log("View invoice details:", item.id);
      // Navigate to invoice details page
      // navigate(`/invoices/${item.id}`);
    } else if (action === "download") {
      console.log("Download invoice:", item.id);
    } else if (action === "delete") {
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
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    reportType: "تحليلي",
    operationType: "",
    operationCode: "",
  });
  const itemsPerPage = 10;

  // Filter invoices based on filter state
  const filteredInvoices = useMemo(() => {
    let filtered = mockInvoices;

    // Filter by operation code
    if (filters.operationCode && filters.operationCode.trim()) {
      filtered = filtered.filter((inv) =>
        inv.referenceNumber.includes(filters.operationCode)
      );
    }

    // Filter by operation type
    if (filters.operationType && filters.operationType.trim()) {
      filtered = filtered.filter((inv) => {
        // Check if operationType field exists and matches
        if (inv.operationType) {
          return inv.operationType.toLowerCase().includes(filters.operationType.toLowerCase());
        }
        // If field doesn't exist, include it (don't filter out)
        return true;
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
        ...item,
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
