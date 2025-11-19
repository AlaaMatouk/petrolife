import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Pagination, TimeFilter, ExportButton, LoadingSpinner } from "../../../../components/shared";
import { CirclePlus, WalletMinimal } from "lucide-react";
import { useAuth } from "../../../../hooks/useGlobalState";
import { fetchOrders, calculateFuelStatistics } from "../../../../services/firestore";
import { exportDataTable } from "../../../../services/exportService";
import { useToast } from "../../../../context/ToastContext";

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

// Helper function to get service title
const getServiceTitle = (order: any): string => {
  if (order.service?.title?.ar) return order.service.title.ar;
  if (order.service?.title?.en) return order.service.title.en;
  if (order.selectedOption?.title?.ar) return order.selectedOption.title.ar;
  if (order.selectedOption?.title?.en) return order.selectedOption.title.en;
  return 'وقود';
};

// Convert orders to transactions format
const convertOrdersToTransactions = (orders: any[]): any[] => {
  // Sort by date descending (newest first)
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = a.orderDate?.toDate ? a.orderDate.toDate() : new Date(a.orderDate || 0);
    const dateB = b.orderDate?.toDate ? b.orderDate.toDate() : new Date(b.orderDate || 0);
    return dateB - dateA;
  });
  
  // Calculate cumulative totals
  let cumulative = 0;
  return sortedOrders.map((order) => {
    cumulative += order.totalPrice || 0;
    
    return {
      id: order.refId || order.id || '-',
      type: getServiceTitle(order),
      driver: order.enrichedDriverName || order.assignedDriver?.name || '-',
      date: formatDate(order.orderDate || order.createdDate),
      amount: order.totalPrice || 0,
      cumulative: cumulative,
      rawDate: order.orderDate || order.createdDate, // Store raw date for filtering
    };
  });
};

export const TransactionListSection = (): JSX.Element => {
  const navigate = useNavigate();
  const { company } = useAuth();
  const { addToast } = useToast();
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("اخر 12 شهر");
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fuelStats, setFuelStats] = useState<{
    fuelTypes: Array<{ type: string; totalLitres: number; totalCost: number; color: string }>;
    totalLitres: number;
    totalCost: number;
  }>({ fuelTypes: [], totalLitres: 0, totalCost: 0 });
  
  // Get balance from company data, fallback to 0 if not available
  const walletBalance = company?.balance || 0;
  
  // Format number with thousands separator (English)
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };
  
  // Fetch orders, convert to transactions, and calculate fuel statistics
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const orders = await fetchOrders();
        const transactionsList = convertOrdersToTransactions(orders);
        setTransactions(transactionsList);
        
        // Calculate fuel statistics
        const stats = calculateFuelStatistics(orders);
        setFuelStats(stats);
      } catch (err) {
        console.error('Error loading data:', err);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Handle export all transactions
  const handleExport = async (format: string) => {
    try {
      // Define columns for export
      const exportColumns = [
        { key: 'id', label: 'رقم العملية' },
        { key: 'type', label: 'نوع العملية' },
        { key: 'driver', label: 'اسم السائق' },
        { key: 'date', label: 'تاريخ العملية' },
        { key: 'amount', label: 'قيمة العملية' },
        { key: 'cumulative', label: 'تراكمي العمليات (ر.س)' },
      ];

      await exportDataTable(
        filteredTransactions,
        exportColumns,
        'wallet-transactions',
        format as 'excel' | 'pdf',
        'تقرير المعاملات المالية'
      );

      addToast({
        title: 'نجح التصدير',
        message: `تم تصدير المعاملات المالية بنجاح`,
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

  // Handle export single row
  const handleExportRow = async (row: any) => {
    try {
      // Define columns for export
      const exportColumns = [
        { key: 'id', label: 'رقم العملية' },
        { key: 'type', label: 'نوع العملية' },
        { key: 'driver', label: 'اسم السائق' },
        { key: 'date', label: 'تاريخ العملية' },
        { key: 'amount', label: 'قيمة العملية' },
        { key: 'cumulative', label: 'تراكمي العمليات (ر.س)' },
      ];

      // Export single row as an array with one item
      await exportDataTable(
        [row],
        exportColumns,
        `wallet-transaction-${row.id}`,
        'excel',
        'تقرير المعاملة المالية'
      );

      addToast({
        title: 'نجح التصدير',
        message: `تم تصدير المعاملة رقم ${row.id} بنجاح`,
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

  // Apply time filter to transactions
  const filteredTransactions = transactions.filter(transaction => {
    if (selectedTimeFilter === 'الكل') {
      return true;
    }
    
    const now = new Date();
    const transactionDate = transaction.rawDate?.toDate 
      ? transaction.rawDate.toDate() 
      : new Date(transaction.rawDate || 0);
    
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
    
    return transactionDate >= startDate;
  });

  // Define table columns for transactions
  const transactionColumns = [
    {
      key: "export",
      label: "تصدير",
      width: "min-w-[100px]",
      render: (_value: any, row: any) => (
        <ExportButton
          onExport={() => handleExportRow(row)}
          buttonText="تصدير"
          showExcel={true}
          showPDF={false}
          showCSV={false}
          className="!border-0 !p-0"
        />
      ),
    },
    {
      key: "cumulative",
      label: "تراكمي العمليات (ر.س)",
      width: "min-w-[160px]",
    },
    { key: "amount", label: "قيمة العملية", width: "min-w-[120px]" },
    { key: "date", label: "تاريخ العملية", width: "min-w-[180px]" },
    { key: "driver", label: "اسم السائق", width: "min-w-[140px]" },
    { key: "type", label: "نوع العملية", width: "min-w-[120px]" },
    { key: "id", label: "رقم العملية", width: "min-w-[120px]" },
  ];

  return (
    <section className="flex flex-col w-full items-stretch gap-6 mt-6 px-4">
      {/* Top cards row */}
      <div className="flex flex-col lg:flex-row w-full gap-6">
        {/* Cards column */}
        <div className="flex flex-col flex-1 gap-6">
          {/* Fuel total cost card */}
          <div className="relative w-full h-[95px] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder p-4 flex flex-col justify-between">
            {/* Upper row - title */}
            <div className="flex justify-end">
              <span className="text-base text-color-mode-text-icons-t-sec">
                التكلفة الإجمالية للوقود
              </span>
            </div>
            {/* Lower row - value and icon */}
            <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-color-mode-surface-purple-bg rounded-full flex items-center justify-center">
              <img
                src="/img/side-icons-14.svg"
                alt="icon"
                className="w-5 h-5"
              />
              </div>
              <p className="text-2xl text-color-mode-text-icons-t-blue font-bold">
                {formatNumber(Math.round(fuelStats.totalCost))} <span className="text-base">ر.س</span>
              </p>
            </div>
          </div>

          {/* Fuel consumption card */}
          <div className="relative w-full h-[95px] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder p-4 flex flex-col justify-between">
            {/* Upper row - title */}
            <div className="flex justify-end">
              <span className="text-base text-color-mode-text-icons-t-sec pb-1">
                اجمالي اللترات المستهلكة
              </span>
            </div>
            {/* Lower row - values and icon */}
            <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-color-mode-surface-purple-bg rounded-full flex items-center justify-center">
              <img
                src="/img/side-icons-15.svg"
                alt="icon"
                className="w-5 h-5"
              />
              </div>
              <div className="flex items-center gap-4">
                {(fuelStats.fuelTypes.length > 0 ? fuelStats.fuelTypes : [
                  { type: "ديزل", totalLitres: 185, color: "text-color-mode-text-icons-t-orange" },
                  { type: "بنزين 95", totalLitres: 548, color: "text-color-mode-text-icons-t-red" },
                  { type: "بنزين 91", totalLitres: 845, color: "text-color-mode-text-icons-t-green" },
                ]).map((fuel, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-color-mode-text-icons-t-blue">
                        {Math.round(fuel.totalLitres)} .L
                      </span>
                      <span className={`${fuel.color} text-xs`}>{fuel.type}</span>
                    </div>
                    {index < (fuelStats.fuelTypes.length > 0 ? fuelStats.fuelTypes.length : 3) - 1 && (
                      <div className="w-px h-8 bg-gray-300"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Wallet card */}
        <div className="flex-1 bg-color-mode-surface-primary-blue rounded-xl border border-color-mode-text-icons-t-placeholder p-6 relative overflow-hidden text-white" style={{
          background: 'linear-gradient(135deg, #4F5BB3 0%, #5A66C1 100%)',
          position: 'relative'
        }}>
          {/* Background pattern overlay */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20,20 Q30,10 40,20 T60,20 T80,20' stroke='white' stroke-width='0.5' fill='none' opacity='0.3'/%3E%3Cpath d='M10,40 Q20,30 30,40 T50,40 T70,40 T90,40' stroke='white' stroke-width='0.3' fill='none' opacity='0.2'/%3E%3Cpath d='M0,60 Q10,50 20,60 T40,60 T60,60 T80,60 T100,60' stroke='white' stroke-width='0.4' fill='none' opacity='0.25'/%3E%3Cpath d='M15,80 Q25,70 35,80 T55,80 T75,80 T95,80' stroke='white' stroke-width='0.3' fill='none' opacity='0.2'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
            backgroundPosition: 'bottom left',
            backgroundRepeat: 'repeat'
          }}></div>
          
          {/* Paper money illustration */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <img 
              src="/img/paper-money-or-dollar-bills-and-blue-credit-card-3d-illustration.png" 
              alt="Paper money and credit card illustration"
              className="w-64 h-64 object-contain opacity-90"
            />
          </div>
          
          <div className="flex flex-col items-end text-right relative z-10">
          <h3 className="text-lg mb-2">رصيــــــــد محفظتي</h3>
          <p className="text-4xl font-bold mb-4">
               <span className="text-base">ر.س</span> {formatNumber(walletBalance)}
          </p>
          <div className="flex gap-4">
               <button 
                onClick={() => navigate('/walletchargerequests')}
                className="border border-white text-white rounded-full py-2 px-4 hover:bg-white hover:bg-opacity-10 transition" 
                style={{ border: '1px solid white' }}
              >
              طلبات شحن المحفظة
            </button>
            <button 
              onClick={() => navigate('/chargewallet')}
              className="flex-1 bg-white text-color-mode-text-icons-t-blue rounded-full py-2 px-4 hover:bg-gray-50 transition"
            >
              شحن المحفظة
            </button>
             </div>
          </div>
        </div>
      </div>

      {/* Main Transactions Table Section */}
      <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
        <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="inline-flex items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]">
              <button 
                onClick={() => navigate('/moneyrefundrequests')}
                className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
              >
                <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                  <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                    <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                      إضافة طلب استرداد الأموال
                    </span>
                  </div>
                  <CirclePlus className="w-4 h-4 text-gray-500" />
                </div>
              </button>

               <ExportButton onExport={handleExport} />

              <TimeFilter
                selectedFilter={selectedTimeFilter}
                onFilterChange={setSelectedTimeFilter}
              />
        </div>

             <div className="flex w-[200px] items-center justify-end gap-1.5 relative">
               <h1 className="relative w-[180px] h-5 mt-[-1.00px] ml-[-7.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]">
                 المعاملات المالية
               </h1>
               <WalletMinimal className="w-5 h-5 text-gray-500" />
             </div>
          </div>
        </header>

        <main className="flex flex-col items-start gap-7 relative self-stretch w-full flex-[0_0_auto]">
          {isLoading ? (
            <LoadingSpinner size="lg" message="جاري التحميل..." />
          ) : filteredTransactions.length === 0 ? (
            <div className="w-full text-center text-gray-500 py-12">
              <p className="text-lg [direction:rtl]">لا توجد معاملات مالية</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-end gap-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto]">
                <Table
                  columns={transactionColumns}
                  data={filteredTransactions.slice((currentPage - 1) * 10, currentPage * 10)}
                  className="relative self-stretch w-full flex-[0_0_auto]"
                />
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredTransactions.length / 10) || 1}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </main>
      </div>
    </section>
  );
};
