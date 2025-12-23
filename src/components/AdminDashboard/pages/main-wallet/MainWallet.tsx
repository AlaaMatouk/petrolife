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
  Clock
} from "lucide-react";
import { LegendHighlightBarChart } from "../../../shared/charts";
import { Table } from "../../../shared/Table/Table";
import { Pagination } from "../../../shared/Pagination/Pagination";
import { SearchBar } from "../../../shared/SearchBar/SearchBar";
import { ExportButton } from "../../../shared/ExportButton/ExportButton";
import { LoadingSpinner } from "../../../shared/Spinner/LoadingSpinner";

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

export const MainWallet: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<"يومي" | "أسبوعي" | "شهري">("شهري");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 5;

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
    console.log("Opening financial transfers log");
    // Navigate to transfers log page
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
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <Wallet className="w-4 h-4" />
            سجل التحويلات المالية
          </button>
          <ExportButton onExport={handleExport} buttonText="تصدير التقرير" />
        </div>
      </div>

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
    </div>
  );
};

export default MainWallet;

