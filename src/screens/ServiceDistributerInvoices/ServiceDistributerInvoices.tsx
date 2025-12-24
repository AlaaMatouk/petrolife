import { useState } from 'react'
import { FileText, Download } from 'lucide-react'
import { DataTableSection } from '../../components/sections/DataTableSection'
import { fetchInvoices } from '../../services/invoiceService'
import { fetchCurrentStationsCompany } from '../../services/firestore'
import { exportInvoiceToPDF } from '../../services/invoiceExportService'
import { useToast } from '../../context/ToastContext'
import { Invoice } from '../../types/invoice'

// Invoice interface for table display
interface InvoiceTableRow {
  id: string;
  invoiceCode: string;
  invoiceType: string;
  creationDate: string;
  vat: string;
  totalWithVat: string;
  originalInvoice: Invoice; // Store original invoice for export
}

function ServiceDistributerInvoices() {
  const { addToast } = useToast();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Handle invoice export
  const handleExportInvoice = async (invoice: Invoice) => {
    try {
      setIsExporting(invoice.id);
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
    } finally {
      setIsExporting(null);
    }
  };

  const columns = [
    {
      key: "export",
      label: "تصدير الفاتورة",
      width: "w-24 min-w-[90px]",
      priority: "high",
      render: (_: any, row: InvoiceTableRow) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => handleExportInvoice(row.originalInvoice)}
            disabled={isExporting === row.id}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="تحميل الفاتورة"
          >
            <Download className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )
    },
    {
      key: "totalWithVat",
      label: "المجموع + الضريبة المضافة",
      width: "flex-1 grow min-w-[150px]",
      priority: "medium"
    },
    {
      key: "vat",
      label: "ضريبة القيمة المضافة (15%)",
      width: "flex-1 grow min-w-[150px]",
      priority: "medium"
    },
    {
      key: "creationDate",
      label: "تاريخ الانشاء",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    },
    {
      key: "invoiceType",
      label: "نوع الفاتورة",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    },
    {
      key: "invoiceCode",
      label: "كود الفاتورة",
      width: "flex-1 grow min-w-[100px]",
      priority: "high"
    }
  ]

  const fetchInvoicesData = async (): Promise<InvoiceTableRow[]> => {
    try {
      // Get current service distributer
      const serviceDistributer = await fetchCurrentStationsCompany();
      if (!serviceDistributer || !serviceDistributer.email) {
        console.warn("No service distributer found");
        return [];
      }

      // Fetch invoices for this service distributer
      const invoices = await fetchInvoices({
        serviceDistributerEmail: serviceDistributer.email,
      });

      // Transform invoices to table format
      return invoices.map((invoice: Invoice) => {
        // Format date
        const invoiceDate = invoice.createdAt instanceof Date
          ? invoice.createdAt
          : invoice.createdAt?.toDate
          ? invoice.createdAt.toDate()
          : new Date(invoice.createdAt || Date.now());
        
        const formattedDate = invoiceDate.toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Get invoice type
        const invoiceType = invoice.type === "Service Distributer Monthly Invoice"
          ? "فاتورة شهرية"
          : invoice.type === "Service Distributer Commission Invoice"
          ? "فاتورة عمولة"
          : invoice.type || "فاتورة";

        // Get invoice code/number
        const invoiceCode = invoice.invoiceNumber || invoice.refId || invoice.id.substring(0, 8);

        // Format amounts
        const vat = invoice.vatAmount 
          ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(invoice.vatAmount)
          : "0.00";
        
        const totalWithVat = invoice.total
          ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(invoice.total)
          : "0.00";

        return {
          id: invoice.id,
          invoiceCode,
          invoiceType,
          creationDate: formattedDate,
          vat,
          totalWithVat,
          originalInvoice: invoice, // Store original for export
        };
      });
    } catch (error) {
      console.error('Error fetching service distributer invoices:', error);
      return [];
    }
  }

  return (
    <div className="flex flex-col w-full items-start gap-5">
      <DataTableSection<InvoiceTableRow>
        title="الفواتير"
        entityName="الفاتورة"
        entityNamePlural="الفواتير"
        icon={FileText}
        columns={columns}
        fetchData={fetchInvoicesData}
        addNewRoute="/add-invoice"
        viewDetailsRoute={(id) => `/invoice/${id}`}
        loadingMessage="جاري تحميل الفواتير..."
        errorMessage="فشل في تحميل الفواتير. استخدام البيانات التجريبية."
        itemsPerPage={5}
        showAddButton={false}
      />
    </div>
  );
};

export default ServiceDistributerInvoices;