import React, { useState, useMemo } from "react";
import {
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  TrendingUp,
  Clock,
  Wallet,
  Percent,
  SlidersHorizontal,
  Paperclip,
  Upload,
} from "lucide-react";
import { SummaryCard } from "../../components/shared/SummaryCard/SummaryCard";
import { Tabs } from "../../components/shared/Tabs/Tabs";
import { DateInput } from "../../components/shared/DateInput/DateInput";
import { RTLSelect } from "../../components/shared/Form/RTLSelect";
import { FuelTypeIcon } from "../../components/shared/FuelTypeIcon/FuelTypeIcon";
import { Table } from "../../components/shared/Table/Table";
import { Pagination } from "../../components/shared/Pagination/Pagination";

// Operation interface
interface Operation {
  id: string;
  operationNumber: string;
  stationName: string;
  dateTime: string;
  fuelType: string;
  liters: string;
  totalOperation: string;
  totalCommission: string;
}

// Sales Invoice interface
interface SalesInvoice {
  id: string;
  reportNumber: string;
  reportPeriod: string;
  hasAttachment: boolean;
}

// Mock data
const mockOperations: Operation[] = [
  {
    id: "1",
    operationNumber: "2024001567",
    stationName: "محطة الشرق",
    dateTime: "2024/03/15 - 14:30",
    fuelType: "بنزين 91",
    liters: "45.5",
    totalOperation: "98.50",
    totalCommission: "2.46",
  },
  {
    id: "2",
    operationNumber: "2024001566",
    stationName: "محطة الغرب",
    dateTime: "2024/03/15 - 14:00",
    fuelType: "بنزين 95",
    liters: "38.2",
    totalOperation: "95.00",
    totalCommission: "2.39",
  },
  {
    id: "3",
    operationNumber: "2024001565",
    stationName: "محطة الشمال",
    dateTime: "2024/03/15 - 14:30",
    fuelType: "بنزين 98",
    liters: "53.8",
    totalOperation: "132.00",
    totalCommission: "3.30",
  },
  {
    id: "4",
    operationNumber: "2024001564",
    stationName: "محطة الشرق",
    dateTime: "2024/03/15 - 14:30",
    fuelType: "ديزل",
    liters: "68.5",
    totalOperation: "115.20",
    totalCommission: "2.88",
  },
  {
    id: "5",
    operationNumber: "2024001563",
    stationName: "محطة الغرب",
    dateTime: "2024/03/15 - 14:30",
    fuelType: "بنزين 91",
    liters: "41.3",
    totalOperation: "89.50",
    totalCommission: "2.24",
  },
  {
    id: "6",
    operationNumber: "2024001562",
    stationName: "محطة الشمال",
    dateTime: "2024/03/15 - 14:30",
    fuelType: "بنزين 95",
    liters: "36.7",
    totalOperation: "91.75",
    totalCommission: "2.29",
  },
  {
    id: "7",
    operationNumber: "2024001561",
    stationName: "محطة الشرق",
    dateTime: "2024/03/15 - 14:30",
    fuelType: "ديزل",
    liters: "55.2",
    totalOperation: "110.40",
    totalCommission: "2.76",
  },
  {
    id: "8",
    operationNumber: "2024001560",
    stationName: "محطة الغرب",
    dateTime: "2024/03/15 - 14:30",
    fuelType: "بنزين 91",
    liters: "48.9",
    totalOperation: "105.90",
    totalCommission: "2.65",
  },
];

const stationOptions = [
  { value: "all", label: "جميع المحطات" },
  { value: "east", label: "محطة الشرق" },
  { value: "west", label: "محطة الغرب" },
  { value: "north", label: "محطة الشمال" },
];

// Mock sales invoices data
const mockSalesInvoices: SalesInvoice[] = [
  { id: "1", reportNumber: "RPT-0825#12355545", reportPeriod: "مارس - 2025", hasAttachment: true },
  { id: "2", reportNumber: "RPT-0825#12355545", reportPeriod: "فبراير - 2025", hasAttachment: false },
  { id: "3", reportNumber: "RPT-0825#12355545", reportPeriod: "يناير - 2025", hasAttachment: true },
  { id: "4", reportNumber: "RPT-0825#12355545", reportPeriod: "ديسمبر - 2025", hasAttachment: true },
  { id: "5", reportNumber: "RPT-0825#12355545", reportPeriod: "نوفمبر - 2025", hasAttachment: false },
  { id: "6", reportNumber: "RPT-0825#12355545", reportPeriod: "أكتوبر - 2025", hasAttachment: true },
  { id: "7", reportNumber: "RPT-0825#12355545", reportPeriod: "سبتمبر - 2025", hasAttachment: true },
  { id: "8", reportNumber: "RPT-0825#12355545", reportPeriod: "أغسطس - 2025", hasAttachment: false },
  { id: "9", reportNumber: "RPT-0825#12355545", reportPeriod: "يوليو - 2025", hasAttachment: true },
  { id: "10", reportNumber: "RPT-0825#12355545", reportPeriod: "يونيو - 2025", hasAttachment: false },
  { id: "11", reportNumber: "RPT-0825#12355545", reportPeriod: "مايو - 2025", hasAttachment: true },
  { id: "12", reportNumber: "RPT-0825#12355545", reportPeriod: "أبريل - 2025", hasAttachment: true },
  { id: "13", reportNumber: "RPT-0825#12355545", reportPeriod: "مارس - 2024", hasAttachment: false },
  { id: "14", reportNumber: "RPT-0825#12355545", reportPeriod: "فبراير - 2024", hasAttachment: true },
  { id: "15", reportNumber: "RPT-0825#12355545", reportPeriod: "يناير - 2024", hasAttachment: true },
  { id: "16", reportNumber: "RPT-0825#12355545", reportPeriod: "ديسمبر - 2024", hasAttachment: false },
  { id: "17", reportNumber: "RPT-0825#12355545", reportPeriod: "نوفمبر - 2024", hasAttachment: true },
  { id: "18", reportNumber: "RPT-0825#12355545", reportPeriod: "أكتوبر - 2024", hasAttachment: true },
  { id: "19", reportNumber: "RPT-0825#12355545", reportPeriod: "سبتمبر - 2024", hasAttachment: false },
  { id: "20", reportNumber: "RPT-0825#12355545", reportPeriod: "أغسطس - 2024", hasAttachment: true },
  { id: "21", reportNumber: "RPT-0825#12355545", reportPeriod: "يوليو - 2024", hasAttachment: true },
  { id: "22", reportNumber: "RPT-0825#12355545", reportPeriod: "يونيو - 2024", hasAttachment: false },
  { id: "23", reportNumber: "RPT-0825#12355545", reportPeriod: "مايو - 2024", hasAttachment: true },
];

function ServiceDistributerFinancialReports() {
  const [activeTab, setActiveTab] = useState("operations");
  const [currentPage, setCurrentPage] = useState(1);
  const [salesInvoicePage, setSalesInvoicePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [operationNumberSearch, setOperationNumberSearch] = useState("");
  const [selectedStation, setSelectedStation] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const itemsPerPage = 8;
  const totalOperations = 156;
  const totalSalesInvoices = mockSalesInvoices.length;

  const tabs = [
    { id: "operations", label: "العمليات" },
    { id: "sales-invoices", label: "فواتير البيع" },
    { id: "purchase-invoices", label: "فواتير الشراء" },
    { id: "payments", label: "الدفعات" },
  ];

  // Filter operations
  const filteredOperations = useMemo(() => {
    let filtered = [...mockOperations];

    if (searchQuery) {
      filtered = filtered.filter(
        (op) =>
          op.stationName.includes(searchQuery) ||
          op.operationNumber.includes(searchQuery)
      );
    }

    if (operationNumberSearch) {
      filtered = filtered.filter((op) =>
        op.operationNumber.includes(operationNumberSearch)
      );
    }

    if (selectedStation !== "all") {
      const stationMap: Record<string, string> = {
        east: "محطة الشرق",
        west: "محطة الغرب",
        north: "محطة الشمال",
      };
      filtered = filtered.filter(
        (op) => op.stationName === stationMap[selectedStation]
      );
    }

    return filtered;
  }, [searchQuery, operationNumberSearch, selectedStation]);

  // Paginate operations
  const paginatedOperations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOperations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOperations, currentPage]);

  const totalPages = Math.ceil(filteredOperations.length / itemsPerPage);

  // Paginate sales invoices
  const paginatedSalesInvoices = useMemo(() => {
    const startIndex = (salesInvoicePage - 1) * itemsPerPage;
    return mockSalesInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [salesInvoicePage]);

  const totalSalesInvoicePages = Math.ceil(totalSalesInvoices / itemsPerPage);

  const handleReset = () => {
    setSearchQuery("");
    setOperationNumberSearch("");
    setSelectedStation("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const handleViewDetails = (operationId: string) => {
    console.log("View details for operation:", operationId);
    // TODO: Navigate to details page
  };

  const handleViewReport = (invoiceId: string) => {
    console.log("View report for invoice:", invoiceId);
    // TODO: Navigate to report details page
  };

  const handleViewAttachment = (invoiceId: string) => {
    console.log("View attachment for invoice:", invoiceId);
    // TODO: Open attachment viewer
  };

  const handleUploadAttachment = (invoiceId: string) => {
    console.log("Upload attachment for invoice:", invoiceId);
    // TODO: Open file upload dialog
  };

  // Sales Invoice table columns
  const salesInvoiceColumns = [
    {
      key: "attachment",
      label: "المرفق",
      width: "w-48 min-w-[180px]",
      render: (_: any, row: SalesInvoice) => (
        <div className="flex items-center justify-center">
          {row.hasAttachment ? (
            <button
              onClick={() => handleViewAttachment(row.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
              aria-label="عرض المرفق"
            >
              <Paperclip className="w-4 h-4" />
              <span>عرض المرفق</span>
            </button>
          ) : (
            <button
              onClick={() => handleUploadAttachment(row.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
              aria-label="رفع المرفق"
            >
              <Upload className="w-4 h-4" />
              <span>رفع المرفق</span>
            </button>
          )}
        </div>
      ),
    },
    {
      key: "viewReport",
      label: "عرض التقرير",
      width: "w-48 min-w-[180px]",
      headerRender: () => (
        <div className="flex items-center justify-start gap-2">
          <span>عرض التقرير</span>
          <div className="flex flex-col">
            <ChevronUp className="w-3 h-3 text-gray-600" />
            <ChevronDown className="w-3 h-3 text-gray-600 -mt-1" />
          </div>
        </div>
      ),
      render: (_: any, row: SalesInvoice) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => handleViewReport(row.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-sm font-medium transition-colors"
            aria-label="عرض التقرير"
          >
            <Eye className="w-4 h-4" />
            <span>عرض التقرير</span>
          </button>
        </div>
      ),
    },
    {
      key: "reportPeriod",
      label: "فترة التقرير",
      width: "flex-1 grow min-w-[180px]",
      headerRender: () => (
        <div className="flex items-center justify-start gap-2">
          <span>فترة التقرير</span>
          <div className="flex flex-col">
            <ChevronUp className="w-3 h-3 text-gray-600" />
            <ChevronDown className="w-3 h-3 text-gray-600 -mt-1" />
          </div>
        </div>
      ),
      render: (_: any, row: SalesInvoice) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          {row.reportPeriod}
        </span>
      ),
    },
    {
      key: "reportNumber",
      label: "رقم التقرير",
      width: "flex-1 grow min-w-[200px]",
      render: (_: any, row: SalesInvoice) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          {row.reportNumber}
        </span>
      ),
    },
  ];

  // Operations table columns
  const columns = [
    {
      key: "actions",
      label: "إجراءات",
      render: (_: any, row: Operation) => (
        <button
          onClick={() => handleViewDetails(row.id)}
          className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded transition-colors"
          aria-label="عرض التفاصيل"
        >
          <Eye className="w-4 h-4 text-color-mode-text-icons-t-sec" />
        </button>
      ),
    },
    {
      key: "totalCommission",
      label: "إجمالي العمولة",
      render: (_: any, row: Operation) => (
        <span className="text-orange-600">{row.totalCommission} ر.س</span>
      ),
    },
    {
      key: "totalOperation",
      label: "إجمالي العملية",
      render: (_: any, row: Operation) => (
        <span className="text-color-mode-text-icons-t-blue">
          {row.totalOperation} ر.س
        </span>
      ),
    },
    {
      key: "liters",
      label: "عدد اللترات",
      render: (_: any, row: Operation) => (
        <span className="text-color-mode-text-icons-t-blue">{row.liters}</span>
      ),
    },
    {
      key: "fuelType",
      label: "نوع الوقود",
      render: (_: any, row: Operation) => (
        <FuelTypeIcon fuelType={row.fuelType} />
      ),
    },
    {
      key: "dateTime",
      label: "التاريخ والوقت",
      render: (_: any, row: Operation) => (
        <span className="text-color-mode-text-icons-t-blue">
          {row.dateTime}
        </span>
      ),
    },
    {
      key: "stationName",
      label: "اسم المحطة",
      render: (_: any, row: Operation) => (
        <span className="text-color-mode-text-icons-t-blue">
          {row.stationName}
        </span>
      ),
    },
    {
      key: "operationNumber",
      label: "رقم العملية",
      render: (_: any, row: Operation) => (
        <span className="text-color-mode-text-icons-t-blue">
          {row.operationNumber}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full items-start gap-6" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <div className="p-2 rounded-xl border border-solid border-gray-200 bg-gray-50">
          <SummaryCard
            title="رصيد المحفظة الحالي"
            value="125,450"
            currency="ر.س"
            icon={
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
            }
          />
        </div>
        <div className="p-2 rounded-xl border border-solid border-gray-200 bg-gray-50">
          <SummaryCard
            title="الدفعات الجاري تحويلها"
            value="35,800"
            currency="ر.س"
            icon={
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            }
            additionalInfo="٥ دفعات قيد المعالجة"
          />
        </div>
        <div className="p-2 rounded-xl border border-solid border-gray-200 bg-gray-50">
          <SummaryCard
            title="إجمالي رصيد المحفظة"
            value="854,230"
            currency="ر.س"
            icon={
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            }
            additionalInfo="+ ١٢ % عن الشهر الماضي"
            additionalInfoIcon={
              <TrendingUp className="w-4 h-4 text-green-500" />
            }
          />
        </div>
        <div className="p-2 rounded-xl border border-solid border-gray-200 bg-gray-50">
          <SummaryCard
            title="إجمالي العمولات المخصومة"
            value="18,565"
            currency="ر.س"
            icon={
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Percent className="w-5 h-5 text-orange-600" />
              </div>
            }
          />
        </div>
      </div>

      {/* Content Section with Border Frame */}
      <div className="w-full rounded-xl border border-solid border-gray-200 bg-white overflow-hidden">
        {/* Tabs */}
        <div className="w-full">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        {/* Divider line under tabs */}
        <div className="w-full h-[1px] bg-gray-200"></div>

        {/* Filter Bar - Only show in operations tab */}
        {activeTab === "operations" && (
          <>
            <div className="w-full p-4">
              <div className="flex flex-col gap-4">
                {/* First row: All filter inputs (reversed) */}
                <div className="flex items-end gap-4 flex-wrap">
                  <div className="flex-1 min-w-[150px]">
                    <DateInput
                      label="إلى تاريخ"
                      value={toDate}
                      onChange={setToDate}
                      placeholder="mm/dd/yyyy"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <DateInput
                      label="من تاريخ"
                      value={fromDate}
                      onChange={setFromDate}
                      placeholder="mm/dd/yyyy"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <RTLSelect
                      label="اسم المحطة"
                      value={selectedStation}
                      onChange={setSelectedStation}
                      options={stationOptions}
                      placeholder="جميع المحطات"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-color-mode-text-icons-t-placeholder mb-1">
                      ابحث برقم العملية
                    </label>
                    <input
                      type="text"
                      value={operationNumberSearch}
                      onChange={(e) => setOperationNumberSearch(e.target.value)}
                      placeholder="ابحث برقم العملية..."
                      className="w-full h-[46px] px-4 rounded-lg border border-solid border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus:border-color-mode-text-icons-t-blue focus:outline-none text-sm text-color-mode-text-icons-t-blue"
                      dir="rtl"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-color-mode-text-icons-t-placeholder mb-1">
                      بحث عام
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-color-mode-text-icons-t-sec" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث..."
                        className="w-full h-[46px] pl-10 pr-4 rounded-lg border border-solid border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus:border-color-mode-text-icons-t-blue focus:outline-none text-sm text-color-mode-text-icons-t-blue"
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>

                {/* Second row: Buttons (reversed and left-aligned) */}
                <div className="flex items-center gap-2 justify-start">
                  <button className="flex items-center gap-2 h-[46px] px-4 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-sm transition-colors">
                    <span>تطبيق الفلاتر</span>
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 h-[46px] px-4 rounded-lg border border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec bg-white text-color-mode-text-icons-t-blue text-sm transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>إعادة تعيين</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="w-full h-px bg-gray-200"></div>
          </>
        )}

        {/* Data Table */}
        <div className="w-full p-4 border-b border-gray-200">
          {activeTab === "sales-invoices" ? (
            <Table
              columns={salesInvoiceColumns}
              data={paginatedSalesInvoices}
              loading={false}
              emptyMessage="لا توجد فواتير بيع"
            />
          ) : activeTab === "operations" ? (
            <Table
              columns={columns}
              data={paginatedOperations}
              loading={false}
              emptyMessage="لا توجد عمليات"
            />
          ) : (
            <div className="flex items-center justify-center p-8">
              <div className="text-color-mode-text-icons-t-sec">
                {activeTab === "purchase-invoices" && "لا توجد فواتير شراء"}
                {activeTab === "payments" && "لا توجد دفعات"}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="w-full flex items-center justify-between flex-wrap gap-4 p-4">
          {activeTab === "sales-invoices" ? (
            <>
              <div className="text-sm text-color-mode-text-icons-t-sec">
                عرض {paginatedSalesInvoices.length} من {totalSalesInvoices}
              </div>
              <Pagination
                currentPage={salesInvoicePage}
                totalPages={totalSalesInvoicePages}
                onPageChange={setSalesInvoicePage}
                previousLabel=""
                nextLabel=""
                useEasternArabic={true}
                showArrowOnly={true}
                maxVisiblePages={3}
              />
            </>
          ) : activeTab === "operations" ? (
            <>
              <div className="text-sm text-color-mode-text-icons-t-sec">
                عرض {paginatedOperations.length} من {totalOperations} عملية
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalOperations / itemsPerPage)}
                onPageChange={setCurrentPage}
                previousLabel=""
                nextLabel=""
                useEasternArabic={true}
                showArrowOnly={true}
                maxVisiblePages={3}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ServiceDistributerFinancialReports;
