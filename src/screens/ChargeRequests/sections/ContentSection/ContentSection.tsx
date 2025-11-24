import { useState, useEffect, useCallback } from "react";
import { Wallet } from "lucide-react";
import { Table, ExportButton, LoadingSpinner } from "../../../../components/shared";
import { fetchWalletChargeRequests } from "../../../../services/firestore";
import { exportDataTable } from "../../../../services/exportService";
import { useToast } from "../../../../context/ToastContext";

interface TableRow {
  id: string;
  status: "completed" | "rejected" | "pending";
  date: string;
  shippingValue: string;
  oldBalance: string;
  orderType: string;
  orderNumber: string;
  rawDate?: any; // Raw date for filtering
}

// Helper function to format date
const formatDate = (date: any): string => {
  if (!date) return '-';
  
  try {
    if (date.toDate && typeof date.toDate === 'function') {
      return new Date(date.toDate()).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (date instanceof Date) {
      return date.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return new Date(date).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return String(date);
  }
};

// Helper function to format number
const formatNumber = (num: any): string => {
  if (!num && num !== 0) return '-';
  return new Intl.NumberFormat('en-US').format(Number(num));
};

// Helper function to get status
const getStatus = (status: string): "completed" | "rejected" | "pending" => {
  const statusLower = status?.toLowerCase();
  if (statusLower === 'accepted' || statusLower === 'approved' || statusLower === 'completed' || statusLower === 'done') {
    return 'completed';
  }
  if (statusLower === 'rejected' || statusLower === 'cancelled') {
    return 'rejected';
  }
  return 'pending';
};

// Helper function to get request type
const getRequestType = (request: any): string => {
  if (request.type) return request.type;
  if (request.requestType) return request.requestType;
  if (request.isAutomatic) return 'آلي';
  return 'يدوي';
};

// Convert Firestore data to table format
const convertRequestsToTableData = (requests: any[]): TableRow[] => {
  // Sort by date descending (newest first)
  const sortedRequests = [...requests].sort((a, b) => {
    const dateA = a.requestDate?.toDate ? a.requestDate.toDate() : new Date(a.requestDate || a.createdDate || 0);
    const dateB = b.requestDate?.toDate ? b.requestDate.toDate() : new Date(b.requestDate || b.createdDate || 0);
    return dateB.getTime() - dateA.getTime();
  });
  
  return sortedRequests.map((request) => ({
    orderNumber: request.requestId || request.id || '-',
    orderType: getRequestType(request),
    oldBalance: formatNumber(request.oldBalance),
    shippingValue: formatNumber(request.value || request.amount),
    date: formatDate(request.requestDate || request.createdDate),
    status: getStatus(request.status),
    id: request.id,
    rawDate: request.requestDate || request.createdDate, // Store raw date for filtering
  }));
};

interface ContentSectionProps {
  currentPage: number;
  setTotalPages: (pages: number) => void;
  selectedTimeFilter: string;
  onExportHandlerReady?: (handler: (format: string) => void) => void;
}

export const ContentSection = ({ currentPage, setTotalPages, selectedTimeFilter, onExportHandlerReady }: ContentSectionProps): JSX.Element => {
  const [requests, setRequests] = useState<TableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  
  const ITEMS_PER_PAGE = 10;
  
  // Handle export single row
  const handleExportRow = async (format: string, row: TableRow) => {
    try {
      // Define columns for export
      const exportColumns = [
        { key: "orderNumber", label: "رقم الطلب" },
        { key: "orderType", label: "نوع الطلب" },
        { key: "oldBalance", label: "الرصيد القديم (ر.س)" },
        { key: "shippingValue", label: "قيمة طلب الشحن (ر.س)" },
        { key: "date", label: "تاريخ الطلب" },
        { key: "status", label: "حالة الطلب" },
      ];

      // Transform status for export
      const exportRow = {
        ...row,
        status: row.status === "rejected" ? "مرفوض" : row.status === "pending" ? "قيد المراجعة" : "مكتمل",
      };

      await exportDataTable(
        [exportRow],
        exportColumns,
        `wallet-charge-request-${row.orderNumber}`,
        format as 'excel' | 'pdf',
        `تقرير طلب الشحن - ${row.orderNumber}`
      );

      addToast({
        title: 'نجح التصدير',
        message: `تم تصدير بيانات الطلب بنجاح`,
        type: 'success',
      });
    } catch (error) {
      console.error('Export error:', error);
      addToast({
        title: 'فشل التصدير',
        message: 'حدث خطأ أثناء تصدير البيانات',
        type: 'error',
      });
    }
  };

  // Fetch wallet charge requests on mount
  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const firestoreRequests = await fetchWalletChargeRequests();
        const convertedRequests = convertRequestsToTableData(firestoreRequests);
        setRequests(convertedRequests);
      } catch (err) {
        console.error('Error loading wallet charge requests:', err);
        setError('فشل في تحميل طلبات الشحن');
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRequests();
  }, []);

  // Apply time filter
  const filteredRequests = requests.filter(request => {
    if (selectedTimeFilter === 'الكل') {
      return true;
    }
    
    const now = new Date();
    const requestDate = request.rawDate?.toDate 
      ? request.rawDate.toDate() 
      : new Date(request.rawDate || 0);
    
    let startDate = new Date();
    
    switch (selectedTimeFilter) {
      case 'اخر اسبوع':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'اخر 30 يوم':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'اخر 6 شهور':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'اخر 12 شهر':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return true;
    }
    
    return requestDate >= startDate;
  });
  
  // Handle export all filtered requests (defined after filteredRequests)
  const handleExportAll = useCallback(async (format: string) => {
    try {
      // Define columns for export
      const exportColumns = [
        { key: "orderNumber", label: "رقم الطلب" },
        { key: "orderType", label: "نوع الطلب" },
        { key: "oldBalance", label: "الرصيد القديم (ر.س)" },
        { key: "shippingValue", label: "قيمة طلب الشحن (ر.س)" },
        { key: "date", label: "تاريخ الطلب" },
        { key: "status", label: "حالة الطلب" },
      ];

      // Transform status for export
      const exportData = filteredRequests.map(request => ({
        ...request,
        status: request.status === "rejected" ? "مرفوض" : request.status === "pending" ? "قيد المراجعة" : "مكتمل",
      }));

      await exportDataTable(
        exportData,
        exportColumns,
        'wallet-charge-requests',
        format as 'excel' | 'pdf',
        'تقرير طلبات شحن المحفظة'
      );

      addToast({
        title: 'نجح التصدير',
        message: `تم تصدير طلبات الشحن بنجاح`,
        type: 'success',
      });
    } catch (error) {
      console.error('Export error:', error);
      addToast({
        title: 'فشل التصدير',
        message: 'حدث خطأ أثناء تصدير البيانات',
        type: 'error',
      });
    }
  }, [filteredRequests, addToast]);
  
  // Expose handleExportAll to parent component
  useEffect(() => {
    if (onExportHandlerReady) {
      onExportHandlerReady(handleExportAll);
    }
  }, [handleExportAll, onExportHandlerReady]);

  // Update total pages when filtered requests change
  useEffect(() => {
    const pages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
    setTotalPages(pages || 1);
  }, [filteredRequests.length, setTotalPages]);

  const tableColumns = [
    {
      key: "export",
      label: "",
      width: "min-w-[100px]",
      render: (_value: any, row: TableRow) => (
        <ExportButton 
          onExport={(format) => handleExportRow(format, row)}
          className="!border-0 flex items-center gap-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors p-2"
          buttonText="تصدير"
        />
      ),
    },
    {
      key: "status",
      label: "حالة الطلب",
      width: "min-w-[149px]",
      sortable: false,
      render: (_value: any, row: TableRow) => (
        <div
          className={`inline-flex items-center justify-center gap-[var(--corner-radius-extra-small)] pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] ${
            row.status === "rejected" 
              ? "bg-[#FFF3F9]" 
              : row.status === "pending"
              ? "bg-orange-50"
              : "bg-color-mode-surface-bg-icon-gray"
          } rounded-[var(--corner-radius-small)]`}
        >
          <div
            className={`w-fit mt-[-1.00px] font-[number:var(--subtitle-subtitle-3-font-weight)] ${
              row.status === "rejected" 
                ? "text-color-mode-text-icons-t-red" 
                : row.status === "pending"
                ? "text-orange-600"
                : "text-color-mode-text-icons-t-sec"
            } text-[length:var(--subtitle-subtitle-3-font-size)] tracking-[var(--subtitle-subtitle-3-letter-spacing)] leading-[var(--subtitle-subtitle-3-line-height)] [direction:rtl] relative font-subtitle-subtitle-3 whitespace-nowrap [font-style:var(--subtitle-subtitle-3-font-style)]`}
          >
            {row.status === "rejected" ? "مرفوض" : row.status === "pending" ? "قيد المراجعة" : "مكتمل"}
          </div>
          <div
            className={`relative w-1.5 h-1.5 ${
              row.status === "rejected" 
                ? "bg-color-mode-text-icons-t-red" 
                : row.status === "pending"
                ? "bg-orange-500"
                : "bg-color-mode-text-icons-t-sec"
            } rounded-[3px]`}
          />
        </div>
      ),
    },
    {
      key: "date",
      label: "تاريخ الطلب",
      width: "min-w-[217px]",
      sortable: false,
      render: (value: string) => (
        <time className="relative w-fit mt-[-0.20px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-black text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
          {value}
        </time>
      ),
    },
    {
      key: "shippingValue",
      label: "قيمة طلب الشحن (ر.س)",
      width: "min-w-[170px]",
      sortable: false,
      render: (value: string) => (
        <div className="mt-[-0.20px] font-[number:var(--body-body-2-font-weight)] text-black tracking-[var(--body-body-2-letter-spacing)] relative w-fit font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
          {value}
        </div>
      ),
    },
    {
      key: "oldBalance",
      label: "الرصيد القديم (ر.س)",
      width: "min-w-[168px]",
      sortable: false,
      render: (value: string) => (
        <div className="mt-[-0.20px] font-[number:var(--body-body-2-font-weight)] text-black tracking-[var(--body-body-2-letter-spacing)] relative w-fit font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
          {value}
        </div>
      ),
    },
    {
      key: "orderType",
      label: "نوع الطلب",
      width: "min-w-[102px]",
      sortable: false,
      render: (value: string) => (
        <div className="w-fit mt-[-0.20px] font-[number:var(--body-body-2-font-weight)] text-black text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] relative font-body-body-2 whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
          {value}
        </div>
      ),
    },
    {
      key: "orderNumber",
      label: "رقم الطلب",
      width: "min-w-[120px]",
      sortable: false,
      render: (value: string) => (
        <div className="relative w-fit mt-[-0.20px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-black text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
          {value}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="w-full py-12">
        <LoadingSpinner size="lg" message="جاري التحميل..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 text-center text-lg [direction:rtl]">{error}</p>
      </div>
    );
  }

  if (filteredRequests.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center text-gray-500">
          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl font-semibold [direction:rtl]">لا توجد طلبات شحن</p>
          <p className="text-sm mt-2 [direction:rtl]">لم يتم العثور على أي طلبات شحن المحفظة</p>
        </div>
      </div>
    );
  }

  // Calculate pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  return (
    <Table
      columns={tableColumns}
      data={paginatedRequests}
      className="w-full"
    />
  );
};
