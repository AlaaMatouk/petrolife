import { invoicesData } from '../../constants/data'
import { FileText, Download } from 'lucide-react'
import { DataTableSection } from '../../components/sections/DataTableSection'

// Invoice interface
interface Invoice {
  id: number;
  invoiceCode: string;
  invoiceType: string;
  creationDate: string;
  vat: string;
  totalWithVat: string;
}

function ServiceDistributerInvoices() {
  const columns = [
    {
      key: "export",
      label: "تصدير الفاتورة",
      width: "w-24 min-w-[90px]",
      priority: "high",
      render: (_: any, row: Invoice) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => console.log(`Downloading invoice ${row.id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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

  const fetchInvoicesData = async (): Promise<Invoice[]> => {
    // TODO: Replace with actual API call when ready
    return Promise.resolve(invoicesData as Invoice[]);
  }

  return (
    <div className="flex flex-col w-full items-start gap-5">
      <DataTableSection<Invoice>
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