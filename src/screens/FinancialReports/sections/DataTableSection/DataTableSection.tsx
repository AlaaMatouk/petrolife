import { useState, useEffect } from "react";
import { Table, Pagination, ExportButton, RTLSelect } from "../../../../components/shared";
import { UserRound, ChartNoAxesCombined } from "lucide-react";
import { fetchFinancialReportData, fetchServices, fetchCompaniesDrivers } from "../../../../services/firestore";
import { LoadingSpinner } from "../../../../components/shared/Spinner/LoadingSpinner";
import { useAuth } from "../../../../hooks/useGlobalState";
import { exportFinancialReport, getFilteredFinancialData, FinancialReportData, FinancialReportFilters } from "../../../../services/exportService";
import { useToast } from "../../../../context/ToastContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../config/firebase";

const clientData = {
  phone: "00966254523658",
  commercialRecord: "GDHGD2543",
  clientName: "الشركة المتحدة العالمية",
  city: "الرياض",
  taxNumber: "245863564",
  clientCode: "21546354",
};

const filterOptions = [
  { 
    label: "الفترة الزمنية", 
    value: "الكل", 
    icon: "/img/side-icons-16.svg",
    options: [
      { value: "الكل", label: "الكل" },
      { value: "اخر اسبوع", label: "اخر اسبوع" },
      { value: "اخر 30 يوم", label: "اخر 30 يوم" },
      { value: "اخر 6 شهور", label: "اخر 6 شهور" },
      { value: "اخر 12 شهر", label: "اخر 12 شهر" }
    ]
  },
  {
    label: "كود الســـــــــائق",
    value: "الكل",
    icon: "/img/side-icons-17.svg",
    options: [
      { value: "الكل", label: "الكل" },
      { value: "21A254", label: "21A254" },
      { value: "21A255", label: "21A255" },
      { value: "21A256", label: "21A256" }
    ]
  },
  {
    label: "المديــــــــــــنة",
    value: "الكل",
    icon: "/img/side-icons-18.svg",
    options: [
      { value: "الكل", label: "الكل" },
      { value: "الرياض", label: "الرياض" },
      { value: "جدة", label: "جدة" },
      { value: "الدمام", label: "الدمام" }
    ]
  },
  { 
    label: "نوع المنتج", 
    value: "الكل", 
    icon: "/img/side-icons-19.svg",
    options: [
      { value: "الكل", label: "الكل" },
      { value: "وقود", label: "وقود" },
      { value: "بنزين 91", label: "بنزين 91" },
      { value: "بنزين 95", label: "بنزين 95" }
    ]
  },
  { 
    label: "نوع التقرير", 
    value: "تحليلي", 
    icon: "/img/side-icons-20.svg",
    options: [
      { value: "تحليلي", label: "تحليلي" },
      { value: "تفصيلي", label: "تفصيلي" },
      { value: "ملخص", label: "ملخص" }
    ]
  },
];

const tableData = [
  {
    city: "الرياض",
    stationName: "محطة الصالح",
    date: "21 فبراير 2025 - 5:05 ص",
    operationNumber: "21536",
    quantity: "20",
    productName: "بنزين 91",
    productNumber: "21536",
    productType: "وقود",
    driverName: "أحمد محمد",
    driverCode: "21A254",
  },
  {
    city: "الرياض",
    stationName: "محطة الصالح",
    date: "21 فبراير 2025 - 5:05 ص",
    operationNumber: "21536",
    quantity: "20",
    productName: "بنزين 91",
    productNumber: "21536",
    productType: "وقود",
    driverName: "أحمد محمد",
    driverCode: "21A254",
  },
  {
    city: "الرياض",
    stationName: "محطة الصالح",
    date: "21 فبراير 2025 - 5:05 ص",
    operationNumber: "21536",
    quantity: "20",
    productName: "بنزين 91",
    productNumber: "21536",
    productType: "وقود",
    driverName: "أحمد محمد",
    driverCode: "21A254",
  },
  {
    city: "الرياض",
    stationName: "محطة الصالح",
    date: "21 فبراير 2025 - 5:05 ص",
    operationNumber: "21536",
    quantity: "20",
    productName: "بنزين 91",
    productNumber: "21536",
    productType: "وقود",
    driverName: "أحمد محمد",
    driverCode: "21A254",
  },
  {
    city: "الرياض",
    stationName: "محطة الصالح",
    date: "21 فبراير 2025 - 5:05 ص",
    operationNumber: "21536",
    quantity: "20",
    productName: "بنزين 91",
    productNumber: "21536",
    productType: "وقود",
    driverName: "أحمد محمد",
    driverCode: "21A254",
  },
  {
    city: "الرياض",
    stationName: "محطة الصالح",
    date: "21 فبراير 2025 - 5:05 ص",
    operationNumber: "21536",
    quantity: "20",
    productName: "بنزين 91",
    productNumber: "21536",
    productType: "وقود",
    driverName: "أحمد محمد",
    driverCode: "21A254",
  },
  {
    city: "الرياض",
    stationName: "محطة الصالح",
    date: "21 فبراير 2025 - 5:05 ص",
    operationNumber: "21536",
    quantity: "20",
    productName: "بنزين 91",
    productNumber: "21536",
    productType: "وقود",
    driverName: "أحمد محمد",
    driverCode: "21A254",
  },
  {
    city: "الرياض",
    stationName: "محطة الصالح",
    date: "21 فبراير 2025 - 5:05 ص",
    operationNumber: "21536",
    quantity: "20",
    productName: "بنزين 91",
    productNumber: "21536",
    productType: "وقود",
    driverName: "أحمد محمد",
    driverCode: "21A254",
  },
  {
    city: "الرياض",
    stationName: "محطة الصالح",
    date: "21 فبراير 2025 - 5:05 ص",
    operationNumber: "21536",
    quantity: "20",
    productName: "بنزين 91",
    productNumber: "21536",
    productType: "وقود",
    driverName: "أحمد محمد",
    driverCode: "21A254",
  },
  {
    city: "الرياض",
    stationName: "محطة الصالح",
    date: "21 فبراير 2025 - 5:05 ص",
    operationNumber: "21536",
    quantity: "20",
    productName: "بنزين 91",
    productNumber: "21536",
    productType: "وقود",
    driverName: "أحمد محمد",
    driverCode: "21A254",
  },
];

// Removed paginationNumbers - using reusable Pagination component

// Define table columns for the reusable Table component
const tableColumns = [
  {
    key: "city",
    label: "المدينة",
    width: "flex-1 grow min-w-[120px]",
  },
  {
    key: "stationName",
    label: "اسم المحطة",
    width: "w-[150px] min-w-[150px]",
  },
  {
    key: "date",
    label: "التاريخ",
    width: "w-[220px] min-w-[220px]",
  },
  {
    key: "operationNumber",
    label: "رقم العملية",
    width: "w-[140px] min-w-[140px]",
  },
  {
    key: "quantity",
    label: "الكمية",
    width: "w-[100px] min-w-[100px]",
  },
  {
    key: "productName",
    label: "اسم المنتج",
    width: "flex-1 grow min-w-[140px]",
  },
  {
    key: "productNumber",
    label: "رقم المنتج",
    width: "w-[140px] min-w-[140px]",
  },
  {
    key: "productType",
    label: "نوع المنتج",
    width: "w-[120px] min-w-[120px]",
  },
  {
    key: "driverName",
    label: "اسم السائق",
    width: "flex-1 grow min-w-[140px]",
  },
  {
    key: "driverCode",
    label: "كود السائق",
    width: "w-[140px] min-w-[140px]",
  },
];

export const DataTableSection = (): JSX.Element => {
  const { company } = useAuth();
  const { addToast } = useToast();
  const [reportData, setReportData] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [carStations, setCarStations] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 10;
  
  const [filters, setFilters] = useState({
    timePeriod: "الكل",
    driverCode: "الكل",
    city: "الكل",
    productType: "الكل",
    reportType: "تحليلي",
  });

  // Handle export with detailed/summary report logic
  const handleExport = async (format: string) => {
    try {
      // Get filtered data for export
      const filteredData = getFilteredFinancialData(
        transformedTableData as FinancialReportData[],
        filters as FinancialReportFilters
      );

      // Export using the new financial report export function
      await exportFinancialReport(
        filteredData,
        filters as FinancialReportFilters,
        format as 'excel' | 'pdf'
      );

      addToast({
        title: 'نجح التصدير',
        message: `تم تصدير التقرير المالي ${filters.reportType === 'تحليلي' ? 'التفصيلي' : 'الإجمالي'} بنجاح`,
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

  // Fetch financial report data, services, car stations, and drivers
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch report data, services, and drivers
        const [reportDataResult, servicesResult, driversResult] = await Promise.all([
          fetchFinancialReportData(),
          fetchServices(),
          fetchCompaniesDrivers()
        ]);
        
        // Fetch car stations separately
        const carStationsRef = collection(db, 'carstations');
        const carStationsSnapshot = await getDocs(carStationsRef);
        const carStationsData = carStationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setReportData(reportDataResult);
        setServices(servicesResult);
        setCarStations(carStationsData);
        setDrivers(driversResult);
      } catch (err) {
        console.error('Error loading financial report data:', err);
        setError('فشل في تحميل بيانات التقارير المالية');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  // Format date for display
  const formatDate = (date: any): string => {
    if (!date) return '-';
    
    try {
      let dateObj: Date;
      
      if (date.toDate && typeof date.toDate === 'function') {
        // Firestore Timestamp
        dateObj = date.toDate();
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return '-';
      }
      
      // Format in Arabic
      return dateObj.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '-';
    }
  };

  // Sort report data by date descending (newest first)
  const sortedReportData = [...reportData].sort((a, b) => {
    try {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
      return dateB.getTime() - dateA.getTime();
    } catch (error) {
      return 0;
    }
  });

  // Transform report data to table format
  const transformedTableData = sortedReportData.map(item => ({
    city: item.city,
    stationName: item.stationName,
    date: formatDate(item.date),
    operationNumber: item.operationNumber,
    quantity: String(item.quantity),
    productName: item.productName,
    productNumber: item.productNumber,
    productType: item.productType,
    driverName: item.driverName,
    driverCode: item.driverCode,
    rawDate: item.date, // Store raw date for filtering
  }));

  // Extract unique values for filter options
  // Get product types from services collection (title.ar)
  const uniqueProductTypes = [
    'الكل', 
    ...services
      .map(service => service.title?.ar)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
  ];
  
  // Get driver codes from companies-drivers collection (filtered by current company)
  // Use refid instead of id for driver code (field is lowercase: refid)
  const uniqueDriverCodes = [
    'الكل',
    ...Array.from(new Set(
      drivers
        .map(driver => driver.refid || driver.refId) // Get the refid field (support both lowercase and camelCase)
        .filter(Boolean) // Remove null/undefined values
    )) // Remove duplicates using Set
  ];
  
  // Get cities from carstations collection (address field)
  const uniqueCities = [
    'الكل',
    ...Array.from(new Set(
      carStations
        .map(station => {
          // Extract address from different possible locations
          return station.formattedLocation?.address?.city || 
                 station.address?.city || 
                 station.city || 
                 station.address;
        })
        .filter(Boolean) // Remove null/undefined values
    ))
  ];

  // Apply filters to data
  const filteredTableData = transformedTableData.filter(item => {
    // Filter by time period
    if (filters.timePeriod !== 'الكل') {
      const now = new Date();
      const itemDate = item.rawDate?.toDate ? item.rawDate.toDate() : new Date(item.rawDate || 0);
      
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
          startDate = new Date(0);
      }
      
      if (itemDate < startDate) {
        return false;
      }
    }

    // Filter by driver code
    if (filters.driverCode !== 'الكل' && item.driverCode !== filters.driverCode) {
      return false;
    }

    // Filter by city
    if (filters.city !== 'الكل' && item.city !== filters.city) {
      return false;
    }

    // Filter by product type
    if (filters.productType !== 'الكل' && item.productType !== filters.productType) {
      return false;
    }

    return true;
  });

  // Extract client info from company data (Step 2)
  const clientInfo = {
    // المدينة = formattedLocation.address.city
    city: company?.formattedLocation?.address?.city || clientData.city,
    
    // الرقم الضريبي = vatNumber
    taxNumber: company?.vatNumber || clientData.taxNumber,
    
    // كود العميل = uId
    clientCode: company?.uId || clientData.clientCode,
    
    // رقم الهاتف = phoneNumber
    phone: company?.phoneNumber || clientData.phone,
    
    // السجل التجاري = commercialRegistrationNumber
    commercialRecord: company?.commercialRegistrationNumber || clientData.commercialRecord,
    
    // اسم العميل = name (or brandName)
    clientName: company?.name || company?.brandName || clientData.clientName,
  };

  // Update filter options with dynamic values
  const dynamicFilterOptions = [
    { 
      label: "الفترة الزمنية", 
      value: filters.timePeriod, 
      icon: "/img/side-icons-16.svg",
      options: [
        { value: "الكل", label: "الكل" },
        { value: "اخر اسبوع", label: "اخر اسبوع" },
        { value: "اخر 30 يوم", label: "اخر 30 يوم" },
        { value: "اخر 6 شهور", label: "اخر 6 شهور" },
        { value: "اخر 12 شهر", label: "اخر 12 شهر" }
      ]
    },
    {
      label: "كود الســـــــــائق",
      value: filters.driverCode,
      icon: "/img/side-icons-17.svg",
      options: uniqueDriverCodes.map(code => ({ value: code, label: code }))
    },
    {
      label: "المديــــــــــــنة",
      value: filters.city,
      icon: "/img/side-icons-18.svg",
      options: uniqueCities.map(city => ({ value: city, label: city }))
    },
    { 
      label: "نوع المنتج", 
      value: filters.productType, 
      icon: "/img/side-icons-19.svg",
      options: uniqueProductTypes.map(type => ({ value: type, label: type }))
    },
    { 
      label: "نوع التقرير", 
      value: filters.reportType, 
      icon: "/img/side-icons-20.svg",
      options: [
        { value: "تحليلي", label: "تحليلي" },
        { value: "تفصيلي", label: "تفصيلي" },
        { value: "ملخص", label: "ملخص" }
      ]
    },
  ];

  // Calculate pagination
  const totalPages = Math.ceil(filteredTableData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = filteredTableData.slice(startIndex, endIndex);

  return (
    <section
      className="flex flex-col w-full max-w-[1200px] mx-auto gap-5 px-4"
      role="main"
      aria-label="قسم جدول البيانات"
    >
      <article className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
        <div className="flex flex-col items-end gap-[var(--corner-radius-medium)] relative self-stretch w-full flex-[0_0_auto]">
          <header className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
            <h2 className="relative w-[103px] h-5 mt-[-1.00px] font-subtitle-subtitle-2 font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
              بيانات العميل
            </h2>
            <UserRound className="relative w-[18px] h-[18px] text-gray-500" />
          </header>

          <div className="flex items-center gap-[13px] relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start justify-center gap-[var(--corner-radius-medium)] relative flex-1 grow">
              <div className="flex-col items-end gap-[var(--corner-radius-extra-small)] self-stretch w-full flex-[0_0_auto] flex relative">
                <label className="relative self-stretch mt-[-1.00px] font-caption-caption-1 font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] [direction:rtl] [font-style:var(--caption-caption-1-font-style)]">
                  رقم الهاتف
                </label>
                <div className="flex flex-col items-end justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
                  <div className="flex items-center justify-end relative self-stretch w-full flex-[0_0_auto]">
                    <span className="mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec tracking-[var(--body-body-2-letter-spacing)] relative w-fit font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
                      {clientInfo.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-col items-end gap-[var(--corner-radius-extra-small)] self-stretch w-full flex-[0_0_auto] flex relative">
                <label className="relative self-stretch mt-[-1.00px] font-caption-caption-1 font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] [direction:rtl] [font-style:var(--caption-caption-1-font-style)]">
                  المدينة
                </label>
                <div className="items-end justify-center pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] bg-color-mode-surface-bg-icon-gray flex flex-col gap-2.5 relative self-stretch w-full flex-[0_0_auto] rounded-[var(--corner-radius-small)]">
                  <div className="flex items-center justify-end relative self-stretch w-full flex-[0_0_auto]">
                    <span className="relative w-fit mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                      {clientInfo.city}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-[var(--corner-radius-medium)] relative flex-1 grow">
              <div className="flex-col items-end gap-[var(--corner-radius-extra-small)] self-stretch w-full flex-[0_0_auto] flex relative">
                <label className="relative self-stretch mt-[-1.00px] font-caption-caption-1 font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] [direction:rtl] [font-style:var(--caption-caption-1-font-style)]">
                  السجل التجاري
                </label>
                <div className="flex flex-col items-end justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
                  <div className="flex items-center justify-end relative self-stretch w-full flex-[0_0_auto]">
                    <span className="relative w-fit mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
                      {clientInfo.commercialRecord}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-col items-end gap-[var(--corner-radius-extra-small)] self-stretch w-full flex-[0_0_auto] flex relative">
                <label className="relative self-stretch mt-[-1.00px] font-caption-caption-1 font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] [direction:rtl] [font-style:var(--caption-caption-1-font-style)]">
                  الرقم الضريبي
                </label>
                <div className="items-end justify-center pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] bg-color-mode-surface-bg-icon-gray flex flex-col gap-2.5 relative self-stretch w-full flex-[0_0_auto] rounded-[var(--corner-radius-small)]">
                  <div className="flex items-center justify-end relative self-stretch w-full flex-[0_0_auto]">
                    <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
                      {clientInfo.taxNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-[var(--corner-radius-medium)] relative flex-1 grow">
              <div className="flex-col items-end gap-[var(--corner-radius-extra-small)] self-stretch w-full flex-[0_0_auto] flex relative">
                <label className="relative self-stretch mt-[-1.00px] font-caption-caption-1 font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] [direction:rtl] [font-style:var(--caption-caption-1-font-style)]">
                  اسم العميل
                </label>
                <div className="flex flex-col items-end justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
                  <div className="flex items-center justify-end relative self-stretch w-full flex-[0_0_auto]">
                    <span className="relative w-fit mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                      {clientInfo.clientName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-col items-end gap-[var(--corner-radius-extra-small)] self-stretch w-full flex-[0_0_auto] flex relative">
                <label className="relative self-stretch mt-[-1.00px] font-caption-caption-1 font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] [direction:rtl] [font-style:var(--caption-caption-1-font-style)]">
                  كود العميل
                </label>
                <div className="items-end justify-center pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] bg-color-mode-surface-bg-icon-gray flex flex-col gap-2.5 relative self-stretch w-full flex-[0_0_auto] rounded-[var(--corner-radius-small)]">
                  <div className="flex items-center justify-end relative self-stretch w-full flex-[0_0_auto]">
                    <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
                      {clientInfo.clientCode}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      <article className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
        <div className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
          <header className="items-center justify-between self-stretch w-full flex-[0_0_auto] flex relative">
            <ExportButton onExport={handleExport} />

            <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
              <h2 className="relative w-[103px] h-5 mt-[-1.00px] font-subtitle-subtitle-2 font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
                التقارير المالية
              </h2>
              <ChartNoAxesCombined className="relative w-[18px] h-[18px] text-gray-500" />
            </div>
          </header>
        </div>

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
                              filter.label === "كود الســـــــــائق" ? "driverCode" :
                              filter.label === "المديــــــــــــنة" ? "city" :
                              filter.label === "نوع المنتج" ? "productType" : "reportType"]}
                onChange={(value) => {
                  handleFilterChange(
                    filter.label === "الفترة الزمنية" ? "timePeriod" : 
                    filter.label === "كود الســـــــــائق" ? "driverCode" :
                    filter.label === "المديــــــــــــنة" ? "city" :
                    filter.label === "نوع المنتج" ? "productType" : "reportType", 
                    value
                  );
                  setCurrentPage(1); // Reset to first page when filter changes
                }}
                options={filter.options}
                placeholder={filter.value}
              />
            ))}
          </div>

          <div className="flex flex-col items-start gap-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto]">
            {isLoading ? (
              <div className="flex items-center justify-center w-full min-h-[400px]">
                <LoadingSpinner message="جاري تحميل التقارير المالية..." />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center w-full min-h-[400px]">
                <p className="text-red-500 text-center [direction:rtl]">{error}</p>
              </div>
            ) : filteredTableData.length === 0 ? (
              <div className="flex items-center justify-center w-full min-h-[400px]">
                <p className="text-gray-500 text-center [direction:rtl]">
                  {transformedTableData.length === 0 
                    ? 'لا توجد بيانات متاحة' 
                    : 'لا توجد نتائج تطابق المرشحات المحددة'}
                </p>
              </div>
            ) : (
              <>
                <Table
                  columns={tableColumns}
                  data={paginatedData}
                  className="w-full"
                  headerClassName="bg-color-mode-surface-bg-icon-gray"
                  rowClassName="hover:bg-gray-50"
                  cellClassName="text-right [direction:rtl] whitespace-nowrap"
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  className="flex items-center justify-around gap-[46px] relative self-stretch w-full flex-[0_0_auto]"
                />
              </>
            )}
          </div>
        </div>
      </article>
    </section>
  );
};
