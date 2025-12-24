import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useLayoutContext } from "../../hooks/useLayoutContext";
import {
  Table,
  Pagination,
  ExportButton,
  LoadingSpinner,
  RTLSelect,
} from "../../components/shared";
import { FileText, Eye, MoreVertical, Download } from "lucide-react";
import { exportDataTable } from "../../services/exportService";
import { exportInvoiceToPDF } from "../../services/invoiceExportService";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../hooks/useGlobalState";
import { ROUTES } from "../../constants/routes";
import { fetchInvoices } from "../../services/invoiceService";
import { fetchAllSubscriptionPayments } from "../../services/firestore";
import { Invoice } from "../../types/invoice";

// Helper function to format number with thousands separator
const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num);
};

export const Invoices = (): JSX.Element => {
  const { searchQuery } = useLayoutContext();
  const { addToast } = useToast();
  const { company } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [reportType, setReportType] = useState("تحليلي");
  const [timePeriod, setTimePeriod] = useState("الكل");
  const ITEMS_PER_PAGE = 10;

  // Load invoices from Firestore - only for the current company
  useEffect(() => {
    const loadData = async () => {
      if (!company) {
        setIsLoading(false);
        setInvoices([]);
        return;
      }

      setIsLoading(true);
      try {
        // Get company identifier (prefer uid, then email, then id)
        const companyIdentifier = company.uid || company.email || company.id;
        
        if (!companyIdentifier) {
          console.warn("No company identifier found");
          setInvoices([]);
          setIsLoading(false);
          return;
        }

        // Fetch both invoices and subscription payments for this company
        const [fetchedInvoices, subscriptionPayments] = await Promise.all([
          fetchInvoices({
            companyUid: companyIdentifier,
          }),
          fetchAllSubscriptionPayments()
        ]);
        
        console.log("📄 Invoices - Fetched invoices:", fetchedInvoices.length);
        console.log("📄 Invoices - Fetched subscription payments:", subscriptionPayments.length);
        
        // Filter subscription payments by company
        const companyEmail = company.email?.toLowerCase();
        const companyUid = company.uid;
        
        const filteredSubscriptionPayments = subscriptionPayments.filter((payment) => {
          const paymentCompanyEmail = payment.companyEmail?.toLowerCase() || payment.company?.email?.toLowerCase();
          const paymentCompanyUid = payment.companyUid || payment.company?.uid;
          
          return (
            (companyEmail && paymentCompanyEmail && paymentCompanyEmail === companyEmail) ||
            (companyUid && paymentCompanyUid && paymentCompanyUid === companyUid) ||
            (companyIdentifier && (paymentCompanyEmail === companyIdentifier.toLowerCase() || paymentCompanyUid === companyIdentifier))
          );
        });
        
        console.log("📄 Invoices - Filtered subscription payments for company:", filteredSubscriptionPayments.length);
        
        // Get subscription payment IDs that already have invoices in the invoices collection
        const subscriptionPaymentIdsWithInvoices = new Set(
          fetchedInvoices
            .filter(inv => inv.type === "Subscription" && inv.subscriptionPaymentId)
            .map(inv => inv.subscriptionPaymentId)
        );
        
        // Helper function to extract text from language objects
        const extractText = (value: any): string => {
          if (!value) return "-";
          if (typeof value === "string") return value;
          if (typeof value === "object") {
            if (value.ar && value.ar.trim() !== "") return value.ar;
            if (value.en && value.en.trim() !== "") return value.en;
            if (value.name) {
              if (typeof value.name === "string" && value.name.trim() !== "") return value.name;
              if (value.name.ar && value.name.ar.trim() !== "") return value.name.ar;
              if (value.name.en && value.name.en.trim() !== "") return value.name.en;
            }
            return "-";
          }
          return String(value);
        };
        
        // Transform subscription payments to invoice format (only those without existing invoices)
        const subscriptionInvoices: Invoice[] = filteredSubscriptionPayments
          .filter(payment => !subscriptionPaymentIdsWithInvoices.has(payment.id))
          .map((payment) => {
            const createdAt = payment.createdDate?.toDate 
              ? payment.createdDate.toDate() 
              : payment.createdDate instanceof Date 
              ? payment.createdDate 
              : new Date();
            
            return {
              id: payment.id,
              type: "Subscription",
              createdAt,
              companyData: payment.company || {},
              clientData: null,
              items: [{
                product: extractText(payment.selectedSubscription?.title) || "اشتراك",
                packageName: extractText(payment.selectedSubscription?.title) || "اشتراك",
                period: extractText(payment.selectedSubscription?.periodName) || "شهري",
                periodValueInDays: payment.selectedSubscription?.periodValueInDays || 30,
                startDate: payment.subscriptionStartDate?.toDate 
                  ? payment.subscriptionStartDate.toDate().toLocaleDateString('ar-SA')
                  : payment.subscriptionStartDate instanceof Date
                  ? payment.subscriptionStartDate.toLocaleDateString('ar-SA')
                  : "",
                endDate: payment.subscriptionEndDate?.toDate 
                  ? payment.subscriptionEndDate.toDate().toLocaleDateString('ar-SA')
                  : payment.subscriptionEndDate instanceof Date
                  ? payment.subscriptionEndDate.toLocaleDateString('ar-SA')
                  : "",
                description: extractText(payment.selectedSubscription?.description) || "اشتراك نظام إدارة الأسطول",
              }],
              subtotal: (payment.totalPrice || 0) - (payment.vat || 0),
              vatAmount: payment.vat || 0,
              total: payment.totalPrice || 0,
              subscriptionPaymentId: payment.id,
              invoiceNumber: `SUB-${payment.id.substring(0, 8)}`,
              refId: payment.id,
            } as Invoice;
          });
        
        // Combine invoices and subscription invoices
        const allInvoices = [...fetchedInvoices, ...subscriptionInvoices];
        
        // Sort by date (descending - newest first)
        allInvoices.sort((a, b) => {
          const dateA = a.createdAt instanceof Date 
            ? a.createdAt.getTime() 
            : a.createdAt?.toDate 
            ? a.createdAt.toDate().getTime() 
            : typeof a.createdAt === "string" 
            ? new Date(a.createdAt).getTime() 
            : 0;
          const dateB = b.createdAt instanceof Date 
            ? b.createdAt.getTime() 
            : b.createdAt?.toDate 
            ? b.createdAt.toDate().getTime() 
            : typeof b.createdAt === "string" 
            ? new Date(b.createdAt).getTime() 
            : 0;
          return dateB - dateA; // Descending order (newest first)
        });
        
        console.log("📄 Total invoices (including subscriptions, sorted by date desc):", allInvoices.length);
        console.log("📄 Subscription invoices added:", subscriptionInvoices.length);
        
        setInvoices(allInvoices);
      } catch (error) {
        console.error("Error loading invoices:", error);
        addToast({
          title: "خطأ في التحميل",
          message: "فشل في تحميل الفواتير",
          type: "error",
        });
        setInvoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [addToast, company]);

  // Map invoices to table format
  const mappedInvoices = invoices.map((invoice) => {
    const clientName =
      invoice.clientData?.name ||
      invoice.clientData?.brandName ||
      invoice.companyData?.name ||
      invoice.companyData?.brandName ||
      "غير محدد";

    const clientType =
      invoice.type === "Client"
        ? "أفراد"
        : invoice.type === "Company Monthly Invoice"
        ? "شركات"
        : "اشتراك";

    const invoiceDate =
      invoice.createdAt instanceof Date
        ? invoice.createdAt
        : invoice.createdAt?.toDate
        ? invoice.createdAt.toDate()
        : new Date();

    // Format date in Gregorian calendar (not Hijri)
    const formattedDate = invoiceDate.toLocaleDateString("ar-SA-u-ca-gregory", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Get refId for invoice code
    let invoiceCode = invoice.invoiceNumber; // Fallback to invoice number
    if (invoice.type === "Client") {
      // For client invoices, get refId from clientData or invoice
      invoiceCode = 
        invoice.refId || 
        invoice.clientData?.refId || 
        invoice.clientData?.refid || 
        invoice.clientData?.clientRefId ||
        invoice.invoiceNumber;
    } else if (invoice.type === "Company Monthly Invoice") {
      // For company monthly invoices, get refId from first order
      invoiceCode = 
        invoice.orders?.[0]?.refId || 
        invoice.orders?.[0]?.refid || 
        invoice.refId ||
        invoice.invoiceNumber;
    } else {
      // For subscription invoices, use refId if available
      invoiceCode = invoice.refId || invoice.invoiceNumber;
    }

    return {
      id: invoice.id,
      invoiceCode,
      clientName,
      clientType,
      date: formattedDate,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.total,
      rawDate: invoiceDate,
      invoice, // Store full invoice object for detail view
    };
  });

  // Filter invoices based on search query and time period
  const filteredInvoices = mappedInvoices.filter((invoice) => {
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
        filteredInvoices.map((inv) => ({
          ...inv,
          amount: formatNumber(inv.amount),
        })),
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

  // Handle single invoice export
  const handleExportInvoice = async (invoice: Invoice) => {
    try {
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
  };

  // Action Dropdown Component
  const ActionDropdown = ({ invoice }: { invoice: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    const updateMenuPosition = () => {
      if (!buttonRef) return;
      const rect = buttonRef.getBoundingClientRect();
      const menuWidth = 192; // w-48 = 192px
      let left = rect.right + 4;
      if (left + menuWidth > window.innerWidth) {
        left = rect.left - menuWidth - 4;
      }
      setMenuPosition({
        top: rect.bottom + 4,
        left: Math.max(4, left),
      });
    };

    useEffect(() => {
      if (isOpen && buttonRef) {
        updateMenuPosition();
        // Update position on scroll or resize
        window.addEventListener("scroll", updateMenuPosition, true);
        window.addEventListener("resize", updateMenuPosition);
        return () => {
          window.removeEventListener("scroll", updateMenuPosition, true);
          window.removeEventListener("resize", updateMenuPosition);
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
          className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--corner-radius-small)] hover:bg-color-mode-surface-secondary-gray transition-colors"
          title="الإجراءات"
          aria-label="الإجراءات"
        >
          <MoreVertical className="w-4 h-4 text-color-mode-text-icons-t-primary-gray" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            {createPortal(
              <div
                className="fixed w-48 bg-white border border-color-mode-text-icons-t-placeholder rounded-lg shadow-xl z-50 overflow-hidden"
                style={{ top: menuPosition.top, left: menuPosition.left }}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      // Determine route based on invoice type
                      if (invoice.type === "Subscription") {
                        navigate(`/subscription-invoice/${invoice.id}`, { 
                          state: { from: "/invoices" } 
                        });
                      } else {
                        navigate(`/fuel-invoice/${invoice.id}`, { 
                          state: { from: "/invoices" } 
                        });
                      }
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2 text-right text-sm text-color-mode-text-icons-t-primary-gray hover:bg-color-mode-surface-secondary-gray transition-colors flex items-center justify-end gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>عرض الفاتورة</span>
                  </button>
                  <button
                    onClick={() => {
                      handleExportInvoice(invoice);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2 text-right text-sm text-color-mode-text-icons-t-primary-gray hover:bg-color-mode-surface-secondary-gray transition-colors flex items-center justify-end gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير الفاتورة</span>
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

  // Define table columns
  const invoiceColumns = [
    {
      key: "actions",
      label: "الإجراءات",
      width: "w-32 min-w-[120px]",
      priority: "high",
      render: (_value: any, row: any) => (
        <ActionDropdown invoice={row.invoice || row} />
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
