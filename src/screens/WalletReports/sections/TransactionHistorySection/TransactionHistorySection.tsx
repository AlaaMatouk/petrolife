import { useState, useEffect } from "react";
import { Table, Pagination, ExportButton, RTLSelect, LoadingSpinner } from "../../../../components/shared";
import { walletReportsTransactionData } from "../../../../constants/data";
import { Wallet } from "lucide-react";
import { fetchCompaniesDriversTransfer, fetchWalletChargeRequests, addRefidToExistingDriverTransfers, addRefidToExistingWalletRequests } from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import { exportWalletReport, getFilteredTransactions, ExportFilters } from "../../../../services/exportService";

interface TransactionData {
  id: string;
  operationName: string;
  operationType: string;
  date: string;
  balance: string;
  debit: string;
  sourceType?: 'driver-transfer' | 'wallet-charge';
  rawDate?: any; // Store raw date for sorting
}


const filterOptions = [
  { 
    label: "الفترة الزمنية", 
    value: "الكل", 
    icon: "/img/side-icons-2.svg",
    options: [
      { value: "الكل", label: "الكل" },
      { value: "اخر اسبوع", label: "اخر اسبوع" },
      { value: "اخر 30 يوم", label: "اخر 30 يوم" },
      { value: "اخر 6 شهور", label: "اخر 6 شهور" },
      { value: "اخر 12 شهر", label: "اخر 12 شهر" }
    ]
  },
  {
    label: "اسم العملية",
    value: "الكل",
    icon: "/img/side-icons-5.svg",
    options: [
      { value: "الكل", label: "الكل" },
      { value: "تحويل بنكي", label: "تحويل بنكي" },
      { value: "وقود", label: "وقود" },
      { value: "اشتراك مركبات", label: "اشتراك مركبات" },
      { value: "استرداد", label: "استرداد" }
    ]
  },
  {
    label: "نوع العملية",
    value: "الكل",
    icon: "/img/side-icons-4.svg",
    options: [
      { value: "الكل", label: "الكل" },
      { value: "تغذية محفظة", label: "تغذية محفظة" },
      { value: "فاتورة", label: "فاتورة" },
      { value: "استرداد", label: "استرداد" }
    ]
  },
  { 
    label: "نوع التقرير", 
    value: "تحليلي", 
    icon: "/img/side-icons-5.svg",
    options: [
      { value: "تحليلي", label: "تحليلي" },
      { value: "تفصيلي", label: "تفصيلي" },
      { value: "ملخص", label: "ملخص" }
    ]
  },
];

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

// Convert driver transfer data to transaction format
const convertTransfersToTransactions = (transfers: any[]): TransactionData[] => {
  return transfers.map((transfer) => ({
    // رقم العملية = refid if available, otherwise fall back to id
    id: transfer.refid || transfer.id || '-',
    
    // اسم العملية = car.name.ar (car name in Arabic)
    operationName: transfer.car?.name?.ar || transfer.car?.name?.en || transfer.car?.name || '-',
    
    // نوع العملية = "فاتورة" for driver transfers
    operationType: 'فاتورة',
    
    // التاريخ = createdDate
    date: formatDate(transfer.createdDate),
    
    // الرصيد = car.balance
    balance: formatNumber(transfer.car?.balance),
    
    // مدين = value
    debit: formatNumber(transfer.value),
    
    // Store source type for filtering
    sourceType: 'driver-transfer' as const,
    
    // Store raw date for sorting
    rawDate: transfer.createdDate,
  }));
};

// Convert wallet charge requests to transaction format
const convertWalletChargeToTransactions = (requests: any[]): TransactionData[] => {
  // Debug: Check first request structure
  if (requests.length > 0) {
    console.log('\n📄 First Wallet Charge Request:');
    console.log('Available fields:', Object.keys(requests[0]));
    console.log('requestDate:', requests[0].requestDate);
    console.log('createdDate:', requests[0].createdDate);
    console.log('date:', requests[0].date);
    console.log('Full request:', requests[0]);
  }
  
  return requests.map((request) => {
    const rawDate = request.requestDate || request.createdDate || request.date;
    
    return {
      // رقم العملية = refid if available, otherwise fall back to id
      id: request.refid || request.id || '-',
      
      // اسم العملية = "طلب شحن محفظة" or request type
      operationName: request.type || 'طلب شحن محفظة',
      
      // نوع العملية = "تغذية محفظة" for wallet charges
      operationType: 'تغذية محفظة',
      
      // التاريخ = requestDate (try multiple date fields)
      date: formatDate(rawDate),
      
      // الرصيد = requestedUser.balance (old balance)
      balance: formatNumber(request.requestedUser?.balance || request.oldBalance),
      
      // مدين = value or amount
      debit: formatNumber(request.value || request.amount),
      
      // Store source type for filtering
      sourceType: 'wallet-charge' as const,
      
      // Store raw date for sorting
      rawDate: rawDate,
    };
  });
};

const dummyTransactionData: TransactionData[] = [
  {
    id: "21A254",
    operationName: "تحويل بنكي",
    operationType: "تغذية محفظة",
    date: "21 فبراير 2025 - 5:05 ص",
    balance: "21536",
    debit: "",
  },
  {
    id: "21A254",
    operationName: "وقود",
    operationType: "فاتورة",
    date: "21 فبراير 2025 - 5:05 ص",
    balance: "21536",
    debit: "",
  },
  {
    id: "21A254",
    operationName: "اشتراك مركبات",
    operationType: "استرداد",
    date: "21 فبراير 2025 - 5:05 ص",
    balance: "21536",
    debit: "20",
  },
  {
    id: "21A254",
    operationName: "استرداد",
    operationType: "تغذية محفظة",
    date: "21 فبراير 2025 - 5:05 ص",
    balance: "21536",
    debit: "20",
  },
  {
    id: "21A254",
    operationName: "تحويل بنكي",
    operationType: "تغذية محفظة",
    date: "21 فبراير 2025 - 5:05 ص",
    balance: "21536",
    debit: "20",
  },
  {
    id: "21A254",
    operationName: "تحويل بنكي",
    operationType: "تغذية محفظة",
    date: "21 فبراير 2025 - 5:05 ص",
    balance: "21536",
    debit: "20",
  },
  {
    id: "21A254",
    operationName: "تحويل بنكي",
    operationType: "تغذية محفظة",
    date: "21 فبراير 2025 - 5:05 ص",
    balance: "21536",
    debit: "20",
  },
  {
    id: "21A254",
    operationName: "تحويل بنكي",
    operationType: "تغذية محفظة",
    date: "21 فبراير 2025 - 5:05 ص",
    balance: "21536",
    debit: "20",
  },
  {
    id: "21A254",
    operationName: "تحويل بنكي",
    operationType: "تغذية محفظة",
    date: "21 فبراير 2025 - 5:05 ص",
    balance: "21536",
    debit: "20",
  },
  {
    id: "21A254",
    operationName: "تحويل بنكي",
    operationType: "تغذية محفظة",
    date: "21 فبراير 2025 - 5:05 ص",
    balance: "21536",
    debit: "20",
  },
];


// Define table columns for the reusable Table component
const tableColumns = [
  {
    key: "balance",
    label: "الرصيد",
    width: "w-[95px] min-w-[95px]",
  },
  {
    key: "debit",
    label: "مدين",
    width: "w-[106px] min-w-[106px]",
  },
  {
    key: "operationName",
    label: "اسم العملية",
    width: "flex-1 grow min-w-[140px]",
  },
  {
    key: "operationType",
    label: "نوع العملية",
    width: "flex-1 grow min-w-[140px]",
  },
  {
    key: "date",
    label: "التاريخ",
    width: "w-[220px] min-w-[220px]",
  },
  {
    key: "id",
    label: "رقم العملية",
    width: "w-[130px] min-w-[130px]",
  },
];

export const TransactionHistorySection = (): JSX.Element => {
  const { addToast } = useToast();
  const [filters, setFilters] = useState({
    timePeriod: "الكل",
    operationName: "الكل",
    operationType: "الكل",
    reportType: "تحليلي",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [operationNameOptions, setOperationNameOptions] = useState<{ value: string; label: string }[]>([
    { value: "الكل", label: "الكل" }
  ]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [rawTransfersData, setRawTransfersData] = useState<any[]>([]);
  const [rawWalletChargesData, setRawWalletChargesData] = useState<any[]>([]);
  const [needsMigration, setNeedsMigration] = useState(false);
  
  const ITEMS_PER_PAGE = 10;

  // Check if migration is needed
  useEffect(() => {
    const checkMigration = async () => {
      try {
        const [transfersRef, chargesRef] = [
          collection(db, "companies-drivers-transfer"),
          collection(db, "companies-wallets-requests")
        ];
        const [transfersSnapshot, chargesSnapshot] = await Promise.all([
          getDocs(transfersRef),
          getDocs(chargesRef)
        ]);
        
        const transfersData = transfersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const chargesData = chargesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setRawTransfersData(transfersData);
        setRawWalletChargesData(chargesData);
        setNeedsMigration(
          transfersData.some((t) => !t.refid) || chargesData.some((c) => !c.refid)
        );
      } catch (error) {
        console.error("Error checking migration:", error);
      }
    };
    
    checkMigration();
  }, []);

  // Handle migration: Add refid to existing records
  const handleAddRefidToExisting = async () => {
    setIsMigrating(true);
    try {
      const [transfersCount, chargesCount] = await Promise.all([
        addRefidToExistingDriverTransfers(),
        addRefidToExistingWalletRequests()
      ]);
      
      const totalCount = transfersCount + chargesCount;
      addToast({
        type: "success",
        message: `تم إضافة رقم العملية لـ ${totalCount} معاملة بنجاح`,
        duration: 5000,
      });
      
      // Reload data
      const [transfersRef, chargesRef] = [
        collection(db, "companies-drivers-transfer"),
        collection(db, "companies-wallets-requests")
      ];
      const [transfersSnapshot, chargesSnapshot] = await Promise.all([
        getDocs(transfersRef),
        getDocs(chargesRef)
      ]);
      
      const transfersData = transfersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const chargesData = chargesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setRawTransfersData(transfersData);
      setRawWalletChargesData(chargesData);
      setNeedsMigration(false);
      
      // Reload transactions
      const [transfers, walletCharges] = await Promise.all([
        fetchCompaniesDriversTransfer(),
        fetchWalletChargeRequests()
      ]);
      const transferTransactions = convertTransfersToTransactions(transfers);
      const chargeTransactions = convertWalletChargeToTransactions(walletCharges);
      const allTransactions = [...transferTransactions, ...chargeTransactions];
      allTransactions.sort((a, b) => {
        try {
          const dateA = a.rawDate?.toDate ? a.rawDate.toDate() : new Date(a.rawDate || 0);
          const dateB = b.rawDate?.toDate ? b.rawDate.toDate() : new Date(b.rawDate || 0);
          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          return 0;
        }
      });
      setTransactions(allTransactions);
    } catch (error: any) {
      console.error("Error adding refid to existing records:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في إضافة رقم العملية للمعاملات الموجودة",
        duration: 3000,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Fetch both driver transfers and wallet charge requests
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch both data sources
        const [transfers, walletCharges] = await Promise.all([
          fetchCompaniesDriversTransfer(),
          fetchWalletChargeRequests()
        ]);
        
        // Convert both to transaction format
        const transferTransactions = convertTransfersToTransactions(transfers);
        const chargeTransactions = convertWalletChargeToTransactions(walletCharges);
        
        // Combine both arrays
        const allTransactions = [...transferTransactions, ...chargeTransactions];
        
        // Sort by raw date (newest first) - descending order
        allTransactions.sort((a, b) => {
          try {
            const dateA = a.rawDate?.toDate ? a.rawDate.toDate() : new Date(a.rawDate || 0);
            const dateB = b.rawDate?.toDate ? b.rawDate.toDate() : new Date(b.rawDate || 0);
            return dateB.getTime() - dateA.getTime();
          } catch (error) {
            return 0;
          }
        });
        
        console.log('\n💰 Wallet Reports Data Loaded:');
        console.log('================================');
        console.log('Driver Transfers:', transferTransactions.length);
        console.log('Wallet Charges:', chargeTransactions.length);
        console.log('Total Transactions:', allTransactions.length);
        console.log('================================\n');
        
        setTransactions(allTransactions);
        
        // Extract unique operation names from the data
        const uniqueOperationNames = new Set<string>();
        allTransactions.forEach(transaction => {
          if (transaction.operationName && transaction.operationName !== '-') {
            uniqueOperationNames.add(transaction.operationName);
          }
        });
        
        // Convert to options array
        const dynamicOptions = [
          { value: "الكل", label: "الكل" },
          ...Array.from(uniqueOperationNames).sort().map(name => ({
            value: name,
            label: name
          }))
        ];
        
        setOperationNameOptions(dynamicOptions);
        
        console.log('📋 Operation Name Options:', dynamicOptions);
      } catch (err) {
        console.error('Error loading wallet transactions:', err);
        setError('فشل في تحميل المعاملات');
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTransactions();
  }, []);

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    // Reset to page 1 when filter changes
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle export functionality
  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setIsExporting(true);
      
      // Get filtered transactions for export
      const filteredData = getFilteredTransactions(transactions, filters);
      
      // Export the data
      await exportWalletReport(filteredData, filters, format);
      
    } catch (error) {
      console.error('Export failed:', error);
      // You could add a toast notification here
    } finally {
      setIsExporting(false);
    }
  };

  // Apply filters
  const filteredTransactions = transactions.filter(transaction => {
    // Filter by time period (الفترة الزمنية)
    if (filters.timePeriod !== 'الكل') {
      const now = new Date();
      const transactionDate = transaction.rawDate?.toDate 
        ? transaction.rawDate.toDate() 
        : new Date(transaction.rawDate || 0);
      
      let startDate = new Date();
      
      switch (filters.timePeriod) {
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
          startDate = new Date(0); // Show all
      }
      
      if (transactionDate < startDate) {
        return false;
      }
    }
    
    // Filter by operation type (نوع العملية)
    if (filters.operationType !== 'الكل') {
      if (transaction.operationType !== filters.operationType) {
        return false;
      }
    }
    
    // Filter by operation name (اسم العملية)
    if (filters.operationName !== 'الكل') {
      // Exact match for operation name
      if (transaction.operationName !== filters.operationName) {
        return false;
      }
    }
    
    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Create dynamic filter options with updated operation name options
  const dynamicFilterOptions = [
    filterOptions[0], // الفترة الزمنية
    {
      ...filterOptions[1], // اسم العملية
      options: operationNameOptions // Use dynamic options
    },
    filterOptions[2], // نوع العملية
    filterOptions[3], // نوع التقرير
  ];

  return (
    <div className="flex flex-col w-full items-start gap-5">
      {/* Migration Button */}
      {needsMigration && (
        <div className="w-full">
          <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
            <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleAddRefidToExisting}
                  disabled={isMigrating}
                  className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                    <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                      <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                        {isMigrating ? "جاري إضافة رقم العملية..." : "إضافة رقم العملية للمعاملات الموجودة"}
                      </span>
                    </div>
                    {isMigrating && (
                      <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </button>
                <p className="text-sm text-gray-600 [direction:rtl]">
                  هذا الزر يضيف رقم عملية (8 أرقام) للمعاملات التي لا تملك رقم عملية
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    <section
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
      role="region"
      aria-labelledby="transaction-history-title"
    >
      <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
        <div className="items-center justify-between self-stretch w-full flex-[0_0_auto] flex relative">
          <ExportButton 
            onExport={handleExport}
            showExcel={true}
            showPDF={true}
            showCSV={false}
            buttonText={isExporting ? "جاري التصدير..." : "تصدير"}
          />

          <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
            <h1
              id="transaction-history-title"
              className="relative w-[126px] h-5 mt-[-1.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]"
            >
              تقارير المحفظة
            </h1>

            <Wallet className="relative w-[18px] h-[18px] text-gray-500" />
          </div>
        </div>
      </header>

      <div className="flex flex-col items-start gap-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto]">
        <div
          className="flex items-center gap-[13px] relative self-stretch w-full flex-[0_0_auto]"
          role="group"
          aria-label="مرشحات البحث"
        >
          {dynamicFilterOptions.map((filter, index) => (
            <RTLSelect
              key={index}
              label={filter.label}
              value={filters[filter.label === "الفترة الزمنية" ? "timePeriod" :
                            filter.label === "اسم العملية" ? "operationName" :
                            filter.label === "نوع العملية" ? "operationType" : "reportType"]}
              onChange={(value) => handleFilterChange(
                filter.label === "الفترة الزمنية" ? "timePeriod" :
                filter.label === "اسم العملية" ? "operationName" :
                filter.label === "نوع العملية" ? "operationType" : "reportType",
                value
              )}
              options={filter.options}
              placeholder={filter.value}
            />
          ))}
        </div>

        <div className="flex flex-col items-start gap-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto]">
          {isLoading ? (
            <div className="flex items-center justify-center w-full min-h-[400px]">
              <LoadingSpinner message="جاري تحميل المعاملات..." />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center w-full min-h-[400px]">
              <p className="text-red-500 text-center [direction:rtl]">{error}</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex items-center justify-center w-full min-h-[400px]">
              <p className="text-gray-500 text-center [direction:rtl]">
                {filters.operationType !== 'الكل' 
                  ? `لا توجد معاملات من نوع "${filters.operationType}"` 
                  : 'لا توجد معاملات متاحة'}
              </p>
            </div>
          ) : (
            <>
              <Table
                columns={tableColumns}
                data={paginatedTransactions}
                className="w-full"
                headerClassName="bg-color-mode-surface-bg-icon-gray"
                rowClassName="hover:bg-gray-50"
                cellClassName="text-right [direction:rtl] whitespace-nowrap"
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className="flex items-center justify-around gap-[46px] relative self-stretch w-full flex-[0_0_auto]"
              />
            </>
          )}
        </div>
      </div>
    </section>
    </div>
  );
};
