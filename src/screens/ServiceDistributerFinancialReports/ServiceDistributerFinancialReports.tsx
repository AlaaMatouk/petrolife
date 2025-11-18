import { serviceDistributerFinancialReportsData, serviceDistributerFinancialReportsFilterOptions } from '../../constants/data'
import { FileText } from 'lucide-react'
import { DataTableSection } from '../../components/sections/DataTableSection'
import { fetchServiceDistributerFinancialReports } from '../../services/firestore'

// Financial Report interface
interface FinancialReport {
  id: number;
  productType: string;
  productNumber: string;
  productName: string;
  quantity: string;
  value: string;
  unit: string;
  operationNumber: string;
}

function ServiceDistributerFinancialReports() {
  // Define columns for financial reports table
  const financialReportColumns = [
    {
      key: "actions",
      label: "",
      width: "w-16 min-w-[60px]",
      priority: "high"
    },
    {
      key: "operationNumber",
      label: "رقم العملية",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    },
    {
      key: "unit",
      label: "الوحدة",
      width: "flex-1 grow min-w-[100px]",
      priority: "medium"
    },
    {
      key: "value",
      label: "القيمة (ر.س)",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    },
    {
      key: "quantity",
      label: "الكمية",
      width: "flex-1 grow min-w-[100px]",
      priority: "high"
    },
    {
      key: "productName",
      label: "اسم المنتج",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    },
    {
      key: "productNumber",
      label: "رقم المنتج",
      width: "flex-1 grow min-w-[120px]",
      priority: "medium"
    },
    {
      key: "productType",
      label: "نوع المنتج",
      width: "flex-1 grow min-w-[120px]",
      priority: "high"
    }
  ];

  // Fetch data function for financial reports
  const fetchFinancialReportsData = async (): Promise<FinancialReport[]> => {
    try {
      const reports = await fetchServiceDistributerFinancialReports();
      // Map the API data to the expected format
      return reports.map(report => ({
        id: parseInt(report.id) || Date.now(),
        productType: report.productType,
        productNumber: report.productNumber,
        productName: report.productName,
        quantity: report.quantity,
        value: report.value,
        unit: report.unit,
        operationNumber: report.operationNumber,
      }));
    } catch (error) {
      console.error("Error fetching financial reports:", error);
      // Return mock data as fallback
      return serviceDistributerFinancialReportsData as FinancialReport[];
    }
  };

  // Handle status toggle (if needed)
  const handleToggleStatus = (reportId: number) => {
    console.log(`Toggle status for financial report ${reportId}`);
    // TODO: Implement actual status toggle API call
  };

  return (
    <div className="flex flex-col w-full items-start gap-5">
      <DataTableSection<FinancialReport>
        title="التقارير المالية"
        entityName="التقرير المالي"
        entityNamePlural="التقارير المالية"
        icon={FileText}
        columns={financialReportColumns}
        fetchData={fetchFinancialReportsData}
        onToggleStatus={handleToggleStatus}
        addNewRoute="/add-financial-report"
        viewDetailsRoute={(id) => `/financial-report/${id}`}
        loadingMessage="جاري تحميل بيانات التقارير المالية..."
        errorMessage="فشل في تحميل بيانات التقارير المالية. استخدام البيانات التجريبية."
        itemsPerPage={5}
        showAddButton={false}
        filterOptions={serviceDistributerFinancialReportsFilterOptions}
      />
    </div>
  )
}

export default ServiceDistributerFinancialReports