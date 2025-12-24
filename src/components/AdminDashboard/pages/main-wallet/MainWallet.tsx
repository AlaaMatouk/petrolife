import React, { useState, useMemo } from "react";
import { 
  Wallet, 
  TrendingUp, 
  Fuel, 
  Search, 
  Filter, 
  Upload, 
  Eye, 
  MoreVertical,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  FileText,
  RotateCcw,
  List,
  ChevronDown
} from "lucide-react";
import { LegendHighlightBarChart } from "../../../shared/charts";
import { Table } from "../../../shared/Table/Table";
import { Pagination } from "../../../shared/Pagination/Pagination";
import { SearchBar } from "../../../shared/SearchBar/SearchBar";
import { ExportButton } from "../../../shared/ExportButton/ExportButton";
import { LoadingSpinner } from "../../../shared/Spinner/LoadingSpinner";
import { DateInput } from "../../../shared/DateInput/DateInput";
import { Select } from "../../../shared/Form/Select";

// Data interfaces
interface ServiceProviderWallet {
  id: string;
  providerName: string;
  providerId: string;
  profilePicture?: string;
  walletNumber: string;
  availableBalance: number;
  transferStatus: 'in-progress' | 'completed';
  transferProof?: string;
  transferMechanism?: string;
}

interface RevenueData {
  totalRevenues: number;
  subscriptionRevenues: number;
  fuelServiceCommissions: number;
  monthlyData: {
    labels: string[];
    subscriptions: number[];
    commissions: number[];
  };
}

interface FinancialTransaction {
  id: string;
  transactionNumber: string;
  serviceProvider: {
    name: string;
    id: string;
    profilePicture?: string;
  };
  walletNumber: string;
  dateTime: Date;
  amount: number;
  receiptUrl?: string;
  imageUrl?: string;
  hasImage: boolean;
}

// Mock data - replace with actual API calls
const mockRevenueData: RevenueData = {
  totalRevenues: 524850,
  subscriptionRevenues: 328450,
  fuelServiceCommissions: 196400,
  monthlyData: {
    labels: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
    subscriptions: [25000, 28000, 32000, 35000, 38000, 42000, 45000, 48000, 52000, 55000, 58000, 61000],
    commissions: [15000, 17000, 20000, 22000, 25000, 27000, 29000, 31000, 33000, 35000, 36000, 37000],
  },
};

const mockServiceProviderWallets: ServiceProviderWallet[] = [
  {
    id: "1",
    providerName: "شركة البترول الوطنية",
    providerId: "NPC-2024-001",
    walletNumber: "SA-4532-8976-1234",
    availableBalance: 85450,
    transferStatus: "in-progress",
    transferMechanism: "تحويل بنكي",
  },
  {
    id: "2",
    providerName: "مجموعة الطاقة المتحدة",
    providerId: "UEG-2024-002",
    walletNumber: "SA-7821-3456-9087",
    availableBalance: 124800,
    transferStatus: "completed",
    transferProof: "/proofs/ueg-proof.jpg",
    transferMechanism: "تحويل بنكي",
  },
  {
    id: "3",
    providerName: "شركة الوقود السريع",
    providerId: "QFC-2024-003",
    walletNumber: "SA-9234-5678-4321",
    availableBalance: 67230,
    transferStatus: "in-progress",
    transferMechanism: "تحويل بنكي",
  },
  {
    id: "4",
    providerName: "محطات الخليج للطاقة",
    providerId: "GPS-2024-004",
    walletNumber: "SA-1122-3344-5566",
    availableBalance: 92150,
    transferStatus: "completed",
    transferProof: "/proofs/gps-proof.jpg",
    transferMechanism: "تحويل بنكي",
  },
  {
    id: "5",
    providerName: "شركة النفط المتقدمة",
    providerId: "AOC-2024-005",
    walletNumber: "SA-5566-7788-9900",
    availableBalance: 156780,
    transferStatus: "completed",
    transferProof: "/proofs/aoc-proof.jpg",
    transferMechanism: "تحويل بنكي",
  },
];

// Mock financial transactions data
const mockFinancialTransactions: FinancialTransaction[] = [
  {
    id: "1",
    transactionNumber: "#TRX-2024-001",
    serviceProvider: {
      name: "مجموعة الطاقة المتحدة",
      id: "UEG-2024-002",
    },
    walletNumber: "SA-7821-3456-9087",
    dateTime: new Date(2024, 0, 15, 10, 30),
    amount: 124800,
    receiptUrl: "/receipts/trx-001.pdf",
    imageUrl: "/images/trx-001.jpg",
    hasImage: true,
  },
  {
    id: "2",
    transactionNumber: "#TRX-2024-002",
    serviceProvider: {
      name: "شركة البترول الوطنية",
      id: "NPC-2024-001",
    },
    walletNumber: "SA-4532-8976-1234",
    dateTime: new Date(2024, 0, 14, 14, 15),
    amount: 92300,
    receiptUrl: "/receipts/trx-002.pdf",
    hasImage: false,
  },
  {
    id: "3",
    transactionNumber: "#TRX-2024-003",
    serviceProvider: {
      name: "شركة الوقود السريع",
      id: "QFC-2024-003",
    },
    walletNumber: "SA-6789-4532-7890",
    dateTime: new Date(2024, 0, 13, 16, 45),
    amount: 156500,
    receiptUrl: "/receipts/trx-003.pdf",
    imageUrl: "/images/trx-003.jpg",
    hasImage: true,
  },
  {
    id: "4",
    transactionNumber: "#TRX-2024-004",
    serviceProvider: {
      name: "شركة النقل البترولي",
      id: "PTC-2024-004",
    },
    walletNumber: "SA-2341-7654-3210",
    dateTime: new Date(2024, 0, 12, 11, 20),
    amount: 78450,
    receiptUrl: "/receipts/trx-004.pdf",
    imageUrl: "/images/trx-004.jpg",
    hasImage: true,
  },
  {
    id: "5",
    transactionNumber: "#TRX-2024-005",
    serviceProvider: {
      name: "مؤسسة الطاقة الخضراء",
      id: "GEF-2024-005",
    },
    walletNumber: "SA-5678-1234-5678",
    dateTime: new Date(2024, 0, 11, 8, 40),
    amount: 65200,
    receiptUrl: "/receipts/trx-005.pdf",
    hasImage: false,
  },
  {
    id: "6",
    transactionNumber: "#TRX-2024-006",
    serviceProvider: {
      name: "شركة المحروقات الذهبية",
      id: "GFC-2024-006",
    },
    walletNumber: "SA-9876-5432-1098",
    dateTime: new Date(2024, 0, 10, 5, 15),
    amount: 189700,
    receiptUrl: "/receipts/trx-006.pdf",
    imageUrl: "/images/trx-006.jpg",
    hasImage: true,
  },
  {
    id: "7",
    transactionNumber: "#TRX-2024-007",
    serviceProvider: {
      name: "مجموعة الخليج للوقود",
      id: "GFG-2024-007",
    },
    walletNumber: "SA-3456-7890-2345",
    dateTime: new Date(2024, 0, 9, 13, 50),
    amount: 143900,
    receiptUrl: "/receipts/trx-007.pdf",
    imageUrl: "/images/trx-007.jpg",
    hasImage: true,
  },
  {
    id: "8",
    transactionNumber: "#TRX-2024-008",
    serviceProvider: {
      name: "شركة الوقود المطور",
      id: "AFC-2024-008",
    },
    walletNumber: "SA-8765-4321-6789",
    dateTime: new Date(2024, 0, 8, 17, 25),
    amount: 54600,
    receiptUrl: "/receipts/trx-008.pdf",
    hasImage: false,
  },
];

export const MainWallet: React.FC = () => {
  // View mode state
  const [viewMode, setViewMode] = useState<"default" | "transactions-log">("default");
  
  // Default view states
  const [selectedPeriod, setSelectedPeriod] = useState<"يومي" | "أسبوعي" | "شهري">("شهري");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 5;

  // Transactions log view states
  const [transactionsSearchQuery, setTransactionsSearchQuery] = useState("");
  const [transactionsCurrentPage, setTransactionsCurrentPage] = useState(1);
  const [transactionsItemsPerPage] = useState(8);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  
  // Filter states
  const [selectedServiceProvider, setSelectedServiceProvider] = useState<string>("جميع المزودين");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  
  // Service provider options for filter
  const serviceProviderOptions = useMemo(() => {
    const providers = mockServiceProviderWallets.map(wallet => ({
      value: wallet.providerName,
      label: wallet.providerName,
    }));
    return [
      { value: "جميع المزودين", label: "جميع المزودين" },
      ...providers,
    ];
  }, []);

  // Format number with thousands separator
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ar-SA").format(num);
  };

  // Filter service provider wallets based on search
  const filteredWallets = useMemo(() => {
    if (!searchQuery) return mockServiceProviderWallets;
    
    const query = searchQuery.toLowerCase();
    return mockServiceProviderWallets.filter(
      (wallet) =>
        wallet.providerName.toLowerCase().includes(query) ||
        wallet.providerId.toLowerCase().includes(query) ||
        wallet.walletNumber.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Paginate wallets
  const paginatedWallets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredWallets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWallets, currentPage]);

  const totalPages = Math.ceil(filteredWallets.length / itemsPerPage);

  // Chart data based on selected period
  const chartData = useMemo(() => {
    if (selectedPeriod === "شهري") {
      return {
        labels: mockRevenueData.monthlyData.labels,
        datasets: [
          {
            label: "الاشتراكات",
            color: "rgb(34, 197, 94)", // green
            data: mockRevenueData.monthlyData.subscriptions,
          },
          {
            label: "العمولات",
            color: "rgb(168, 85, 247)", // purple
            data: mockRevenueData.monthlyData.commissions,
          },
        ],
      };
    }
    // For daily/weekly, return empty or sample data
    return {
      labels: [],
      datasets: [
        {
          label: "الاشتراكات",
          color: "rgb(34, 197, 94)",
          data: [],
        },
        {
          label: "العمولات",
          color: "rgb(168, 85, 247)",
          data: [],
        },
      ],
    };
  }, [selectedPeriod]);

  // Table columns
  const tableColumns = [
    {
      key: "actions",
      label: "الإجراءات",
      render: (_: any, row: ServiceProviderWallet) => (
        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="المزيد"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
          {row.transferStatus === "in-progress" && (
            <button
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              aria-label="تحويل مستحقات"
            >
              <ArrowRightLeft className="w-4 h-4" />
              تحويل مستحقات
            </button>
          )}
          {row.transferStatus === "completed" && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              مكتمل
            </div>
          )}
        </div>
      ),
    },
    {
      key: "transferProof",
      label: "إثبات التحويل",
      render: (_: any, row: ServiceProviderWallet) => (
        <div>
          {row.transferStatus === "completed" && row.transferProof ? (
            <button
              className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
              aria-label="عرض الصورة"
            >
              <Eye className="w-4 h-4" />
              عرض الصورة
            </button>
          ) : (
            <button
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              aria-label="رفع الصورة"
            >
              <Upload className="w-4 h-4" />
              رفع الصورة
            </button>
          )}
        </div>
      ),
    },
    {
      key: "transferStatus",
      label: "حالة التحويل",
      render: (_: any, row: ServiceProviderWallet) => {
        if (row.transferStatus === "completed") {
          return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              مكتمل
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            جاري التحويل
          </div>
        );
      },
    },
    {
      key: "availableBalance",
      label: "الرصيد المتاح",
      render: (_: any, row: ServiceProviderWallet) => (
        <span className="text-green-600 font-semibold">
          {formatNumber(row.availableBalance)} ر.س
        </span>
      ),
    },
    {
      key: "walletNumber",
      label: "رقم المحفظة",
      render: (_: any, row: ServiceProviderWallet) => (
        <span className="text-gray-700 font-medium">{row.walletNumber}</span>
      ),
    },
    {
      key: "provider",
      label: "مزود الخدمة",
      render: (_: any, row: ServiceProviderWallet) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
            {row.providerName.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 font-medium">{row.providerName}</span>
            <span className="text-gray-500 text-sm">{row.providerId}</span>
          </div>
        </div>
      ),
    },
  ];

  const handleExport = (format: string) => {
    console.log(`Exporting main wallet data as ${format}`);
    // Implement export logic here
  };

  const handleFinancialTransfersLog = () => {
    setViewMode(viewMode === "default" ? "transactions-log" : "default");
    // Reset to first page when switching views
    setTransactionsCurrentPage(1);
    setTransactionsSearchQuery("");
  };

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...mockFinancialTransactions];

    // Filter by service provider
    if (selectedServiceProvider !== "جميع المزودين") {
      filtered = filtered.filter(
        (transaction) => transaction.serviceProvider.name === selectedServiceProvider
      );
    }

    // Filter by date range
    if (fromDate) {
      // Parse mm/dd/yyyy format
      const [month, day, year] = fromDate.split("/").map(Number);
      const from = new Date(year, month - 1, day);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter((transaction) => {
        const txDate = new Date(transaction.dateTime);
        txDate.setHours(0, 0, 0, 0);
        return txDate >= from;
      });
    }

    if (toDate) {
      // Parse mm/dd/yyyy format
      const [month, day, year] = toDate.split("/").map(Number);
      const to = new Date(year, month - 1, day);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((transaction) => {
        const txDate = new Date(transaction.dateTime);
        return txDate <= to;
      });
    }

    // Filter by search query
    if (transactionsSearchQuery) {
      const query = transactionsSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (transaction) =>
          transaction.transactionNumber.toLowerCase().includes(query) ||
          transaction.serviceProvider.name.toLowerCase().includes(query) ||
          transaction.serviceProvider.id.toLowerCase().includes(query) ||
          transaction.walletNumber.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());

    return filtered;
  }, [selectedServiceProvider, fromDate, toDate, transactionsSearchQuery]);

  // Paginate transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (transactionsCurrentPage - 1) * transactionsItemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + transactionsItemsPerPage);
  }, [filteredTransactions, transactionsCurrentPage, transactionsItemsPerPage]);

  const transactionsTotalPages = Math.ceil(filteredTransactions.length / transactionsItemsPerPage);

  // Handle filter reset
  const handleResetFilters = () => {
    setSelectedServiceProvider("جميع المزودين");
    setFromDate("");
    setToDate("");
    setTransactionsCurrentPage(1);
  };

  // Format date and time in Arabic
  const formatDateTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "مساءً" : "صباحاً";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const formattedDate = date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return `${formattedDate} ${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  // Transactions table columns
  const transactionsTableColumns = [
    {
      key: "actions",
      label: "الإجراءات",
      render: (_: any, row: FinancialTransaction) => (
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            aria-label="الإيصال"
          >
            <FileText className="w-4 h-4" />
            الإيصال
          </button>
          {row.hasImage ? (
            <button
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              aria-label="عرض الصورة"
            >
              <Eye className="w-4 h-4" />
              عرض الصورة
            </button>
          ) : (
            <button
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
              aria-label="رفع الصورة"
            >
              <Upload className="w-4 h-4" />
              رفع الصورة
            </button>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      label: "المبلغ المحول",
      render: (_: any, row: FinancialTransaction) => (
        <span className="text-green-600 font-semibold">
          {formatNumber(row.amount)} ر.س
        </span>
      ),
    },
    {
      key: "dateTime",
      label: "التاريخ والوقت",
      render: (_: any, row: FinancialTransaction) => (
        <span className="text-gray-700">{formatDateTime(row.dateTime)}</span>
      ),
    },
    {
      key: "walletNumber",
      label: "رقم المحفظة",
      render: (_: any, row: FinancialTransaction) => (
        <span className="text-gray-700 font-medium">{row.walletNumber}</span>
      ),
    },
    {
      key: "serviceProvider",
      label: "مزود الخدمة",
      render: (_: any, row: FinancialTransaction) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
            {row.serviceProvider.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 font-medium">{row.serviceProvider.name}</span>
            <span className="text-gray-500 text-sm">{row.serviceProvider.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: "transactionNumber",
      label: "رقم العملية",
      render: (_: any, row: FinancialTransaction) => (
        <span className="text-gray-700 font-medium">{row.transactionNumber}</span>
      ),
    },
  ];

  // Handle transactions export
  const handleTransactionsExport = (format: string) => {
    console.log(`Exporting transactions as ${format}`);
    // Implement export logic here
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner message="جاري تحميل بيانات المحفظة الرئيسية..." />
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المحفظة الرئيسية</h1>
          <p className="text-gray-600 mt-1">إدارة ومراقبة الإيرادات والتحويلات</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleFinancialTransfersLog}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              viewMode === "transactions-log"
                ? "bg-[#5A66C1] text-white hover:bg-[#4a56b1]"
                : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <List className="w-4 h-4" />
            سجل التحويلات المالية
          </button>
          {viewMode === "default" && (
            <ExportButton onExport={handleExport} buttonText="تصدير التقرير" />
          )}
        </div>
      </div>

      {viewMode === "transactions-log" ? (
        /* Financial Transactions Log View */
        <div className="space-y-6">
          {/* Filters Section */}
          <div className="bg-white rounded-xl" style={{ border: '1px solid #e5e7eb' }}>
            <div className="flex items-center justify-between p-4">
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="flex items-center gap-2 hover:bg-gray-50 transition-colors -m-2 p-2 rounded"
              >
                <span className="text-lg font-semibold text-gray-900">فلاتر البحث والتصفية</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    isFiltersOpen ? "transform rotate-180" : ""
                  }`}
                />
              </button>
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                إعادة تعيين
              </button>
            </div>
            {isFiltersOpen && (
              <div className="px-4 pb-4 border-t border-gray-200">
                <div className="flex items-end justify-between gap-4 pt-4">
                  {/* Filters - Left side */}
                  <div className="flex items-end gap-4 flex-1 justify-start">
                    {/* Service Provider Filter */}
                    <div className="w-64">
                      <Select
                        label="مزود الخدمة"
                        value={selectedServiceProvider}
                        onChange={setSelectedServiceProvider}
                        options={serviceProviderOptions}
                      />
                    </div>

                    {/* From Date */}
                    <div className="w-48">
                      <DateInput
                        label="من تاريخ"
                        value={fromDate}
                        onChange={setFromDate}
                        placeholder="mm/dd/yyyy"
                      />
                    </div>

                    {/* To Date */}
                    <div className="w-48">
                      <DateInput
                        label="إلى تاريخ"
                        value={toDate}
                        onChange={setToDate}
                        placeholder="mm/dd/yyyy"
                      />
                    </div>
                  </div>

                  {/* Filter Actions - Right side */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setTransactionsCurrentPage(1)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#5A66C1] text-white rounded-lg hover:bg-[#4a56b1] transition-colors text-sm font-medium"
                    >
                      <Search className="w-4 h-4" />
                      بحث
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transactions Table Section */}
          <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #e5e7eb' }}>
            {/* Table Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">جميع التحويلات المالية</h2>
                <p className="text-gray-600 text-sm mt-1">عرض تفصيلي لجميع عمليات التحويل</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-64">
                  <SearchBar
                    placeholder="البحث في الجدول..."
                    onSearch={setTransactionsSearchQuery}
                    className="w-full"
                  />
                </div>
                <ExportButton
                  onExport={handleTransactionsExport}
                  buttonText="تصدير Excel"
                  showExcel={true}
                  showPDF={false}
                  showCSV={false}
                />
              </div>
            </div>
            
            <div className="mb-6">
              <Table
                columns={transactionsTableColumns}
                data={paginatedTransactions}
                className="w-full"
                headerClassName="bg-gray-50"
                rowClassName="hover:bg-gray-50"
                cellClassName="text-right"
              />
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                عرض {paginatedTransactions.length > 0 ? (transactionsCurrentPage - 1) * transactionsItemsPerPage + 1 : 0} إلى{" "}
                {(transactionsCurrentPage - 1) * transactionsItemsPerPage + paginatedTransactions.length} من{" "}
                {filteredTransactions.length} نتيجة
              </div>
              <Pagination
                currentPage={transactionsCurrentPage}
                totalPages={transactionsTotalPages}
                onPageChange={setTransactionsCurrentPage}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Default View */
        <>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Revenues Card */}
        <div className="bg-[#1e3a8a] rounded-xl p-6 text-white relative overflow-hidden" style={{ border: '1px solid #d1d5db' }}>
          <div className="absolute top-4 left-4 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div className="mt-8">
            <p className="text-white/80 text-sm mb-2">إجمالي الإيرادات</p>
            <p className="text-3xl font-bold text-white">
              {formatNumber(mockRevenueData.totalRevenues)} ر.س
            </p>
          </div>
        </div>

        {/* Subscription Revenues Card */}
        <div className="bg-white rounded-xl p-6 relative overflow-hidden" style={{ border: '1px solid #d1d5db' }}>
          <div className="absolute top-4 left-4 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="mt-8">
            <p className="text-gray-600 text-sm mb-2">إيرادات الاشتراكات</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatNumber(mockRevenueData.subscriptionRevenues)} ر.س
            </p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: "75%" }}
              />
            </div>
          </div>
        </div>

        {/* Fuel and Service Commissions Card */}
        <div className="bg-white rounded-xl p-6 relative overflow-hidden" style={{ border: '1px solid #d1d5db' }}>
          <div className="absolute top-4 left-4 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Fuel className="w-6 h-6 text-purple-600" />
          </div>
          <div className="mt-8">
            <p className="text-gray-600 text-sm mb-2">عمولات الوقود والخدمات</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatNumber(mockRevenueData.fuelServiceCommissions)} ر.س
            </p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: "45%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Analysis Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">تحليل الإيرادات الشهرية</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPeriod("يومي")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === "يومي"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              يومي
            </button>
            <button
              onClick={() => setSelectedPeriod("أسبوعي")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === "أسبوعي"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              أسبوعي
            </button>
            <button
              onClick={() => setSelectedPeriod("شهري")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === "شهري"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              شهري
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-sm text-gray-700">الاشتراكات</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500" />
            <span className="text-sm text-gray-700">العمولات</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px]">
          <LegendHighlightBarChart
            labels={chartData.labels}
            datasets={chartData.datasets}
            height={300}
            showLegend={false}
            chartOptions={{
              scales: {
                x: {
                  ticks: {
                    color: "var(--text-secondary)",
                    font: {
                      family: "Tajawal, Helvetica, Arial, sans-serif",
                      size: 12,
                    },
                  },
                  grid: {
                    display: false,
                  },
                },
                y: {
                  grid: {
                    color: "rgba(148, 163, 184, 0.15)",
                    drawBorder: false,
                  },
                  ticks: {
                    color: "var(--text-secondary)",
                    font: {
                      family: "Tajawal, Helvetica, Arial, sans-serif",
                      size: 12,
                    },
                    callback: (value) =>
                      typeof value === "number"
                        ? value.toLocaleString("ar-SA", {
                            maximumFractionDigits: 0,
                          })
                        : value?.toString() ?? "",
                  },
                },
              },
            }}
            tooltipFormatter={(datasetLabel, value) =>
              `${datasetLabel}: ${value.toLocaleString("ar-SA")} ر.س`
            }
          />
        </div>
      </div>

      {/* Service Provider Wallets Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">محافظ مزودي الخدمة</h2>
          <p className="text-gray-600 text-sm">إدارة وتصدير المبالغ</p>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <SearchBar
              placeholder="البحث عن مزود خدمة..."
              onSearch={setSearchQuery}
              className="w-full"
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            aria-label="تصفية"
          >
            <Filter className="w-4 h-4" />
            تصفية
          </button>
        </div>

        {/* Table */}
        <div className="mb-6">
          <Table
            columns={tableColumns}
            data={paginatedWallets}
            className="w-full"
            headerClassName="bg-gray-50"
            rowClassName="hover:bg-gray-50"
            cellClassName="text-right"
          />
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            عرض {paginatedWallets.length} من {filteredWallets.length} مزود
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default MainWallet;

