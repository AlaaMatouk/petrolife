import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLayoutContext } from "../../hooks/useLayoutContext";
import {
  Table,
  Pagination,
  ExportButton,
  LoadingSpinner,
  RTLSelect,
} from "../../components/shared";
import { FileText, Eye } from "lucide-react";
import { exportDataTable } from "../../services/exportService";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../hooks/useGlobalState";
import { ROUTES } from "../../constants/routes";

// Dummy invoice data
const dummyInvoices = [
  {
    id: "INV-001",
    invoiceCode: "FAT-2024-001",
    clientName: "شركة النفط الوطنية",
    clientType: "شركات",
    date: "15 يناير 2024 - 02:30 م",
    invoiceNumber: "20240001",
    amount: 15000,
    rawDate: new Date("2024-01-15"),
  },
  {
    id: "INV-002",
    invoiceCode: "FAT-2024-002",
    clientName: "مؤسسة النقل السريع",
    clientType: "مؤسسات",
    date: "18 يناير 2024 - 10:15 ص",
    invoiceNumber: "20240002",
    amount: 8500,
    rawDate: new Date("2024-01-18"),
  },
  {
    id: "INV-003",
    invoiceCode: "FAT-2024-003",
    clientName: "شركة المواصلات الحديثة",
    clientType: "شركات",
    date: "22 يناير 2024 - 04:45 م",
    invoiceNumber: "20240003",
    amount: 22000,
    rawDate: new Date("2024-01-22"),
  },
  {
    id: "INV-004",
    invoiceCode: "FAT-2024-004",
    clientName: "مؤسسة التوصيل الذكي",
    clientType: "مؤسسات",
    date: "25 يناير 2024 - 11:20 ص",
    invoiceNumber: "20240004",
    amount: 12500,
    rawDate: new Date("2024-01-25"),
  },
  {
    id: "INV-005",
    invoiceCode: "FAT-2024-005",
    clientName: "شركة الشحن السريع",
    clientType: "شركات",
    date: "28 يناير 2024 - 03:00 م",
    invoiceNumber: "20240005",
    amount: 18750,
    rawDate: new Date("2024-01-28"),
  },
  {
    id: "INV-006",
    invoiceCode: "FAT-2024-006",
    clientName: "مؤسسة الخدمات اللوجستية",
    clientType: "مؤسسات",
    date: "01 فبراير 2024 - 09:30 ص",
    invoiceNumber: "20240006",
    amount: 9800,
    rawDate: new Date("2024-02-01"),
  },
  {
    id: "INV-007",
    invoiceCode: "FAT-2024-007",
    clientName: "شركة التوزيع المتقدم",
    clientType: "شركات",
    date: "05 فبراير 2024 - 01:15 م",
    invoiceNumber: "20240007",
    amount: 16200,
    rawDate: new Date("2024-02-05"),
  },
  {
    id: "INV-008",
    invoiceCode: "FAT-2024-008",
    clientName: "مؤسسة النقل الجوي",
    clientType: "مؤسسات",
    date: "08 فبراير 2024 - 11:45 ص",
    invoiceNumber: "20240008",
    amount: 27500,
    rawDate: new Date("2024-02-08"),
  },
  {
    id: "INV-009",
    invoiceCode: "FAT-2024-009",
    clientName: "شركة الإمداد والتموين",
    clientType: "شركات",
    date: "12 فبراير 2024 - 04:20 م",
    invoiceNumber: "20240009",
    amount: 14300,
    rawDate: new Date("2024-02-12"),
  },
  {
    id: "INV-010",
    invoiceCode: "FAT-2024-010",
    clientName: "مؤسسة الخدمات الميدانية",
    clientType: "مؤسسات",
    date: "15 فبراير 2024 - 10:00 ص",
    invoiceNumber: "20240010",
    amount: 11000,
    rawDate: new Date("2024-02-15"),
  },
  {
    id: "INV-011",
    invoiceCode: "FAT-2024-011",
    clientName: "شركة النقل البحري",
    clientType: "شركات",
    date: "18 فبراير 2024 - 02:30 م",
    invoiceNumber: "20240011",
    amount: 19800,
    rawDate: new Date("2024-02-18"),
  },
  {
    id: "INV-012",
    invoiceCode: "FAT-2024-012",
    clientName: "مؤسسة الشحن الدولي",
    clientType: "مؤسسات",
    date: "22 فبراير 2024 - 03:45 م",
    invoiceNumber: "20240012",
    amount: 23400,
    rawDate: new Date("2024-02-22"),
  },
];

// Helper function to format number with thousands separator
const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num);
};

export const Invoices = (): JSX.Element => {
  const { searchQuery } = useLayoutContext();
  const { addToast } = useToast();
  const { company } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [reportType, setReportType] = useState("تحليلي");
  const [timePeriod, setTimePeriod] = useState("الكل");
  const ITEMS_PER_PAGE = 10;

  // Load dummy data on mount
  useEffect(() => {
    // Simulate loading
    const loadData = async () => {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      setInvoices(dummyInvoices);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Filter invoices based on search query and time period
  const filteredInvoices = invoices.filter((invoice) => {
    // Search filter
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        invoice.invoiceCode?.toLowerCase().includes(query) ||
        invoice.clientName?.toLowerCase().includes(query) ||
        invoice.invoiceNumber?.toLowerCase().includes(query) ||
        invoice.clientType?.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    // Time period filter
    if (timePeriod !== "الكل" && invoice.rawDate) {
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - invoice.rawDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      switch (timePeriod) {
        case "اخر اسبوع":
          return daysDiff <= 7;
        case "اخر 30 يوم":
          return daysDiff <= 30;
        case "اخر 6 شهور":
          return daysDiff <= 180;
        case "اخر 12 شهر":
          return daysDiff <= 365;
        default:
          return true;
      }
    }

    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Handle export
  const handleExport = async (format: string) => {
    try {
      const exportColumns = [
        { key: "invoiceCode", label: "كود الفاتورة" },
        { key: "clientName", label: "اسم العميل" },
        { key: "clientType", label: "نوع العميل" },
        { key: "date", label: "التاريخ" },
        { key: "invoiceNumber", label: "رقم الفاتورة" },
        { key: "amount", label: "مبلغ الفاتورة (ر.س)" },
      ];

      await exportDataTable(
        filteredInvoices,
        exportColumns,
        "invoices-report",
        format as "excel" | "pdf",
        "تقرير الفواتير"
      );

      addToast({
        title: "نجح التصدير",
        message: `تم تصدير الفواتير بنجاح`,
        type: "success",
      });
    } catch (error) {
      console.error("Export error:", error);
      addToast({
        title: "فشل التصدير",
        message: "حدث خطأ أثناء تصدير البيانات",
        type: "error",
      });
    }
  };

  // Define table columns
  const invoiceColumns = [
    {
      key: "actions",
      label: "الإجراءات",
      width: "w-32 min-w-[120px]",
      priority: "high",
      render: (_value: any, row: any) => (
        <button
          onClick={() => navigate(`/invoices/${row.id}`)}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-color-mode-surface-primary-blue text-white rounded-[var(--corner-radius-small)] hover:opacity-90 transition-opacity font-[number:var(--subtitle-subtitle-3-font-weight)] text-[length:var(--subtitle-subtitle-3-font-size)] tracking-[var(--subtitle-subtitle-3-letter-spacing)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]"
          title="عرض تفاصيل الفاتورة"
        >
          <Eye className="w-4 h-4" />
          <span>عرض</span>
        </button>
      ),
    },
    {
      key: "amount",
      label: "مبلغ الفاتورة (ر.س)",
      width: "flex-1 grow min-w-[150px]",
      priority: "high",
      render: (value: number) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] font-body-body-2 [direction:ltr] [font-style:var(--body-body-2-font-style)]">
          {formatNumber(value)}
        </span>
      ),
    },
    {
      key: "invoiceNumber",
      label: "رقم الفاتورة",
      width: "flex-1 grow min-w-[120px]",
      priority: "high",
      render: (value: string) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          {value}
        </span>
      ),
    },
    {
      key: "date",
      label: "التاريخ",
      width: "flex-1 grow min-w-[180px]",
      priority: "medium",
      render: (value: string) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          {value}
        </span>
      ),
    },
    {
      key: "clientType",
      label: "نوع العميل",
      width: "flex-1 grow min-w-[100px]",
      priority: "medium",
      render: (value: string) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          {value}
        </span>
      ),
    },
    {
      key: "clientName",
      label: "اسم العميل",
      width: "flex-1 grow min-w-[180px]",
      priority: "high",
      render: (value: string) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          {value}
        </span>
      ),
    },
    {
      key: "invoiceCode",
      label: "كود الفاتورة",
      width: "flex-1 grow min-w-[130px]",
      priority: "high",
      render: (value: string) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          {value}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full items-start gap-5">
      {/* Loading State */}
      {isLoading ? (
        <LoadingSpinner size="lg" message="جاري تحميل الفواتير..." />
      ) : (
        <>
          {/* Client Data Section */}
          <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
            <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex items-center justify-end gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                <h2 className="relative w-fit mt-[-1.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]">
                  بيانات العميل
                </h2>
                <img src="/img/side-icons-3.svg" alt="" className="w-5 h-5" />
              </div>
            </header>

            <section className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              <form className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                {/* First Row: Phone, CR, Client Name */}
                <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                      رقم الهاتف
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
                      {company?.phoneNumber || "00966254523658"}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                      السجل التجاري
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
                      {company?.commercialRegistrationNumber ||
                        company?.cr ||
                        "GDHGD2543"}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                      اسم العميل
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
                      {company?.brandName ||
                        company?.name ||
                        "الشركة المتحدة العالمية"}
                    </div>
                  </div>
                </div>

                {/* Second Row: City, Tax Number, Client Code */}
                <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                      المدينة
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
                      {company?.formattedLocation?.address?.city ||
                        company?.location ||
                        "الرياض"}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                      الرقم الضريبي
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
                      {company?.vatNumber || company?.taxNumber || "245863564"}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                      كود العميل
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
                      {company?.id || company?.uid || "21546354"}
                    </div>
                  </div>
                </div>
              </form>
            </section>
          </div>

          {/* Main Invoices Table */}
          <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
            <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]">
                  <ExportButton onExport={handleExport} />
                </div>

                <div className="flex items-center justify-end gap-1.5 relative">
                  <h1 className="relative w-fit h-5 mt-[-1.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]">
                    الفواتير
                  </h1>
                  <FileText className="w-5 h-5 text-gray-500" />
                </div>
              </div>

              {/* Filters Section */}
              <div
                className="flex items-center gap-[13px] relative self-stretch w-full flex-[0_0_auto]"
                role="group"
                aria-label="مرشحات البحث"
              >
                <RTLSelect
                  label="الفترة الزمنية"
                  value={timePeriod}
                  onChange={setTimePeriod}
                  options={[
                    { value: "الكل", label: "الكل" },
                    { value: "اخر اسبوع", label: "آخر أسبوع" },
                    { value: "اخر 30 يوم", label: "آخر 30 يوم" },
                    { value: "اخر 6 شهور", label: "آخر 6 شهور" },
                    { value: "اخر 12 شهر", label: "آخر 12 شهر" },
                  ]}
                />

                <RTLSelect
                  label="نوع التقرير"
                  value={reportType}
                  onChange={setReportType}
                  options={[
                    { value: "تحليلي", label: "تحليلي" },
                    { value: "إجمالي", label: "إجمالي" },
                  ]}
                />
              </div>
            </header>

            <main className="flex flex-col items-start gap-7 relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex flex-col items-end gap-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto]">
                {/* Desktop Table View */}
                <div className="hidden lg:block w-full">
                  <Table
                    columns={invoiceColumns}
                    data={
                      Array.isArray(paginatedInvoices) ? paginatedInvoices : []
                    }
                    className="relative self-stretch w-full flex-[0_0_auto]"
                  />
                </div>

                {/* Tablet Responsive Table View */}
                <div className="hidden md:block lg:hidden w-full">
                  <Table
                    columns={invoiceColumns.filter(
                      (col) =>
                        col.priority === "high" || col.priority === "medium"
                    )}
                    data={
                      Array.isArray(paginatedInvoices) ? paginatedInvoices : []
                    }
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
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </main>
          </div>

          {/* No Data Message */}
          {!isLoading && filteredInvoices.length === 0 && (
            <div className="flex items-center justify-center w-full py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg [direction:rtl]">
                  {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد فواتير"}
                </p>
                <p className="text-gray-400 text-sm mt-2 [direction:rtl]">
                  {searchQuery
                    ? "جرب مصطلح بحث آخر"
                    : "قم بإضافة فاتورة جديدة للبدء"}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Invoices;
