import React, { useState, useEffect } from "react";
import { Star, FileText } from "lucide-react";
import { Table, Pagination, ExportButton } from "../../../../components/shared";
import { fetchUserSubscriptions } from "../../../../services/firestore";
import { LoadingSpinner } from "../../../../components/shared/Spinner/LoadingSpinner";
import { useAuth } from "../../../../hooks/useGlobalState";
import { useNavigation } from "../../../../hooks/useNavigation";
import { ROUTES } from "../../../../constants/routes";

const historyTableData = [
  {
    id: 1,
    packageCode: "21A254",
    packageName: "بنزين 91",
    subscriptionDate: "21 فبراير 2025 - 5:05 ص",
    expiryDate: "21 فبراير 2025 - 5:05 ص",
    operationType: "20",
    subscriptionCost: "20"
  },
  {
    id: 2,
    packageCode: "21A254",
    packageName: "بنزين 91",
    subscriptionDate: "21 فبراير 2025 - 5:05 ص",
    expiryDate: "21 فبراير 2025 - 5:05 ص",
    operationType: "20",
    subscriptionCost: "20"
  },
  {
    id: 3,
    packageCode: "21A254",
    packageName: "بنزين 91",
    subscriptionDate: "21 فبراير 2025 - 5:05 ص",
    expiryDate: "21 فبراير 2025 - 5:05 ص",
    operationType: "20",
    subscriptionCost: "20"
  },
  {
    id: 4,
    packageCode: "21A254",
    packageName: "بنزين 91",
    subscriptionDate: "21 فبراير 2025 - 5:05 ص",
    expiryDate: "21 فبراير 2025 - 5:05 ص",
    operationType: "20",
    subscriptionCost: "20"
  },
  {
    id: 5,
    packageCode: "21A254",
    packageName: "بنزين 91",
    subscriptionDate: "21 فبراير 2025 - 5:05 ص",
    expiryDate: "21 فبراير 2025 - 5:05 ص",
    operationType: "20",
    subscriptionCost: "20"
  },
  {
    id: 6,
    packageCode: "21A254",
    packageName: "بنزين 91",
    subscriptionDate: "21 فبراير 2025 - 5:05 ص",
    expiryDate: "21 فبراير 2025 - 5:05 ص",
    operationType: "20",
    subscriptionCost: "20"
  },
  {
    id: 7,
    packageCode: "21A254",
    packageName: "بنزين 91",
    subscriptionDate: "21 فبراير 2025 - 5:05 ص",
    expiryDate: "21 فبراير 2025 - 5:05 ص",
    operationType: "20",
    subscriptionCost: "20"
  },
  {
    id: 8,
    packageCode: "21A254",
    packageName: "بنزين 91",
    subscriptionDate: "21 فبراير 2025 - 5:05 ص",
    expiryDate: "21 فبراير 2025 - 5:05 ص",
    operationType: "20",
    subscriptionCost: "20"
  },
  {
    id: 9,
    packageCode: "21A254",
    packageName: "بنزين 91",
    subscriptionDate: "21 فبراير 2025 - 5:05 ص",
    expiryDate: "21 فبراير 2025 - 5:05 ص",
    operationType: "20",
    subscriptionCost: "20"
  },
  {
    id: 10,
    packageCode: "21A254",
    packageName: "بنزين 91",
    subscriptionDate: "21 فبراير 2025 - 5:05 ص",
    expiryDate: "21 فبراير 2025 - 5:05 ص",
    operationType: "20",
    subscriptionCost: "20"
  }
];

const paginationData = [
  { page: 1, active: false },
  { page: 2, active: false },
  { page: 3, active: true },
  { page: 4, active: false },
  { page: 5, active: false },
  { page: 6, active: false },
  { page: 7, active: false },
  { page: "...", active: false },
  { page: 20, active: false }
];

export const SubscriptionListSection = (): JSX.Element => {
  const { company } = useAuth();
  const { goTo } = useNavigation();
  const [currentPage, setCurrentPage] = useState(1);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const ITEMS_PER_PAGE = 10;

  // Extract current subscription from company data
  const currentSubscription = company?.selectedSubscription;
  
  // Format dates for current subscription
  const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'N/A';
    }
  };

  // Calculate expiry date from createdDate + periodValueInDays
  const calculateExpiryDate = (): string => {
    const createdDate = currentSubscription?.createdDate;
    const periodValueInDays = currentSubscription?.periodValueInDays;
    
    if (!createdDate || !periodValueInDays) return '-';
    
    try {
      const startDate = createdDate.toDate ? createdDate.toDate() : new Date(createdDate);
      const expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + periodValueInDays);
      return formatDate(expiryDate);
    } catch (error) {
      return '-';
    }
  };

  // Check if subscription is expired
  const isSubscriptionExpired = (): boolean => {
    if (!currentSubscription) return false;

    const createdDate = currentSubscription?.createdDate;
    const periodValueInDays = currentSubscription?.periodValueInDays;
    
    if (!createdDate || !periodValueInDays) return false;
    
    try {
      const startDate = createdDate.toDate ? createdDate.toDate() : new Date(createdDate);
      const expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + periodValueInDays);
      
      const now = new Date();
      return expiryDate.getTime() < now.getTime();
    } catch (error) {
      return false;
    }
  };

  // Check if we should show current subscription (only if not expired)
  const hasActiveSubscription = currentSubscription && !isSubscriptionExpired();

  const currentSubscriptionData = {
    packageName: currentSubscription?.title?.ar || currentSubscription?.title?.en || '-',
    packageType: currentSubscription?.periodName?.ar || 
                currentSubscription?.periodName?.en || 
                (typeof currentSubscription?.periodName === 'string' ? currentSubscription?.periodName : '-'),
    price: currentSubscription?.price ? String(currentSubscription.price) : '-',
    vehicleCount: currentSubscription ? String(company?.maxCarNumber || 
                        company?.numberOfVehicles || 
                        company?.vehicleCount || 
                        company?.carsLimit || 
                        currentSubscription?.maxCarNumber || 
                        0) : '-',
    subscriptionDate: currentSubscription?.createdDate ? formatDate(currentSubscription.createdDate) : '-',
    expiryDate: currentSubscription ? calculateExpiryDate() : '-',
    paymentMethod: currentSubscription ? (company?.paymentMethod || 'محفظة') : '-',
  };

  console.log('\n📋 Current Subscription Data (Subscriptions Screen):');
  console.log('===================================================');
  console.log('Company:', company?.name);
  console.log('Company Data - Checking all possible vehicle count fields:');
  console.log('  maxCarNumber:', company?.maxCarNumber);
  console.log('  numberOfVehicles:', company?.numberOfVehicles);
  console.log('  vehicleCount:', company?.vehicleCount);
  console.log('  carsLimit:', company?.carsLimit);
  console.log('  selectedSubscription.maxCarNumber:', currentSubscription?.maxCarNumber);
  console.log('Period Name:', currentSubscription?.periodName);
  console.log('Created Date:', currentSubscription?.createdDate);
  console.log('Period Value in Days:', currentSubscription?.periodValueInDays);
  console.log('Current Subscription:', currentSubscriptionData);
  console.log('===================================================\n');

  // Fetch subscriptions on mount
  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchUserSubscriptions();
        setSubscriptions(data);
      } catch (err) {
        console.error('Error loading subscriptions:', err);
        setError('فشل في تحميل بيانات الاشتراكات');
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptions();
  }, []);

  const tableColumns = [
    {
      key: "export",
      label: "",
      width: "w-[100px] min-w-[100px]",
      render: () => <div className="flex justify-end"><ExportButton className="!border-0 inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors" /></div>,
    },
    {
      key: "operationType",
      label: "الحالة",
      width: "w-[150px] min-w-[150px]",
    },
    {
      key: "expiryDate",
      label: "تاريخ الانتهاء",
      width: "w-[200px] min-w-[200px]",
    },
    {
      key: "subscriptionDate",
      label: "تاريخ الاشتراك",
      width: "w-[200px] min-w-[200px]",
    },
    {
      key: "packageName",
      label: "اسم الباقة",
      width: "w-[200px] min-w-[200px]",
    },
    {
      key: "packageCode",
      label: "كود الباقة",
      width: "w-[120px] min-w-[120px]",
    },
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    console.log(`Navigate to page ${page}`);
  };

  // Transform subscriptions for table display
  let transformedTableData = subscriptions.map(sub => ({
    id: sub.id,
    packageCode: sub.id.substring(0, 6).toUpperCase(),
    packageName: sub.planName,
    subscriptionDate: sub.createdDate,
    expiryDate: sub.expiryDate,
    operationType: 'منتهي', // Expired status for history
    subscriptionCost: String(sub.price),
  }));

  // If current subscription is expired, add it to history table (only if not already in the list)
  if (currentSubscription && isSubscriptionExpired()) {
    const currentSubscriptionId = currentSubscription.id || '';
    // Check if current subscription is already in the subscriptions list
    const alreadyInList = subscriptions.some(sub => sub.id === currentSubscriptionId);
    
    if (!alreadyInList) {
      const expiredSubscriptionData = {
        id: currentSubscriptionId || 'current-expired',
        packageCode: (currentSubscriptionId || 'CURRENT').substring(0, 6).toUpperCase(),
        packageName: currentSubscription?.title?.ar || currentSubscription?.title?.en || 'N/A',
        subscriptionDate: formatDate(currentSubscription?.createdDate),
        expiryDate: calculateExpiryDate(),
        operationType: 'منتهي',
        subscriptionCost: String(currentSubscription?.price || 0),
      };
      // Add expired current subscription to the beginning of the list
      transformedTableData = [expiredSubscriptionData, ...transformedTableData];
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(transformedTableData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = transformedTableData.slice(startIndex, endIndex);

  return (
    <section className="flex flex-col w-full max-w-[1200px] mx-auto gap-5 px-4" role="main" aria-label="قسم قائمة الاشتراكات">
      {/* Show current subscription section (always show, even if no subscription) */}
      <article className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
<div className="flex flex-col items-end gap-7 relative self-stretch w-full flex-[0_0_auto]">
<header className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
<h2 className="relative w-[103px] h-5 mt-[-1.00px] font-subtitle-subtitle-2 font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
الباقة الحالية
            </h2>
            <Star className="relative w-[18px] h-[18px] text-gray-500" />
</header>
<div className="flex items-center gap-[13px] relative self-stretch w-full flex-[0_0_auto]">
<div className="flex flex-col items-start justify-center gap-[var(--corner-radius-medium)] relative flex-1 grow">
<div className="flex items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
<div className="flex-col items-end gap-[var(--corner-radius-extra-small)] flex-1 grow flex relative">
<label className="relative self-stretch mt-[-1.00px] font-caption-caption-1 font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] [direction:rtl] [font-style:var(--caption-caption-1-font-style)]">
السعر (ر.س)
                  </label>
<div className="flex flex-col items-end justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
<div className="flex items-center justify-end relative self-stretch w-full flex-[0_0_auto]">
<span className="mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec tracking-[var(--body-body-2-letter-spacing)] relative w-fit font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
{currentSubscriptionData.price}
                      </span>
</div>
</div>
</div>
<div className="flex-col items-end gap-[var(--corner-radius-extra-small)] flex-1 grow flex relative">
<label className="relative self-stretch mt-[-1.00px] font-caption-caption-1 font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] [direction:rtl] [font-style:var(--caption-caption-1-font-style)]">
طريقة الدفع
                  </label>
<div className="flex flex-col items-end justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
<div className="flex items-center justify-end relative self-stretch w-full flex-[0_0_auto]">
<span className="relative w-fit mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
{currentSubscriptionData.paymentMethod}
                      </span>
</div>
</div>
</div>
</div>
<div className="flex-col items-end gap-[var(--corner-radius-extra-small)] self-stretch w-full flex-[0_0_auto] flex relative">
<label className="relative self-stretch mt-[-1.00px] font-caption-caption-1 font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] [direction:rtl] [font-style:var(--caption-caption-1-font-style)]">
عدد المركبات
                </label>
<div className="justify-center gap-2.5 pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)] flex flex-col items-end relative">
<div className="flex items-center justify-end relative self-stretch w-full flex-[0_0_auto]">
<span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
{currentSubscriptionData.vehicleCount}
                    </span>
</div>
</div>
</div>
</div>
<div className="flex flex-col items-start justify-center gap-[var(--corner-radius-medium)] relative flex-1 grow">
<div className="flex-col items-end gap-[var(--corner-radius-extra-small)] self-stretch w-full flex-[0_0_auto] flex relative">
<label className="relative self-stretch mt-[-1.00px] font-caption-caption-1 font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] [direction:rtl] [font-style:var(--caption-caption-1-font-style)]">
نوع الباقة
                </label>
<div className="flex flex-col items-end justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
<div className="flex items-center justify-end relative self-stretch w-full flex-[0_0_auto]">
<span className="relative w-fit mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
{currentSubscriptionData.packageType}
                    </span>
</div>
</div>
</div>
<div className="flex-col items-end gap-[var(--corner-radius-extra-small)] self-stretch w-full flex-[0_0_auto] flex relative">
<label className="relative self-stretch mt-[-1.00px] font-caption-caption-1 font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] [direction:rtl] [font-style:var(--caption-caption-1-font-style)]">
تاريخ الانتهاء
                </label>
<div className="justify-center gap-2.5 pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)] flex flex-col items-end relative">
<div className="flex items-center justify-end relative self-stretch w-full flex-[0_0_auto]">
<span className="relative w-fit mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
{currentSubscriptionData.expiryDate}
                    </span>
</div>
</div>
</div>
</div>
<div className="flex flex-col items-start justify-center gap-[var(--corner-radius-medium)] relative flex-1 grow">
<div className="flex-col items-end gap-[var(--corner-radius-extra-small)] self-stretch w-full flex-[0_0_auto] flex relative">
<label className="relative self-stretch mt-[-1.00px] font-caption-caption-1 font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] [direction:rtl] [font-style:var(--caption-caption-1-font-style)]">
اسم الباقة
                </label>
<div className="flex flex-col items-end justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
<div className="flex items-center justify-end relative self-stretch w-full flex-[0_0_auto]">
<span className="relative w-fit mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
{currentSubscriptionData.packageName}
                    </span>
</div>
</div>
</div>
<div className="flex-col items-end gap-[var(--corner-radius-extra-small)] self-stretch w-full flex-[0_0_auto] flex relative">
<label className="relative self-stretch mt-[-1.00px] font-caption-caption-1 font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] [direction:rtl] [font-style:var(--caption-caption-1-font-style)]">
تاريخ الاشتراك
                </label>
<div className="justify-center gap-2.5 pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)] flex flex-col items-end relative">
<div className="flex items-center justify-end relative self-stretch w-full flex-[0_0_auto]">
<span className="relative w-fit mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
{currentSubscriptionData.subscriptionDate}
                    </span>
</div>
</div>
</div>
</div>
</div>
</div>
<button
  onClick={() => goTo(ROUTES.SUBSCRIPTION_PLANS)}
  className="flex flex-col w-[138px] items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] bg-orange-100 rounded-[var(--corner-radius-small)] hover:bg-orange-200 transition-colors cursor-pointer"
>
<div className="items-center justify-center gap-[var(--corner-radius-small)] self-stretch w-full flex-[0_0_auto] flex relative">
<div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
<span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-orange text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
باقاتنا المميزة
              </span>
</div>
            <Star className="relative w-[18px] h-[18px] text-orange-500" />
</div>
</button>
</article>
<article className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
<div className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
<div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <ExportButton />
<header className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
<h2 className="relative w-[156px] h-5 mt-[-1.00px] font-subtitle-subtitle-2 font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
سجل الباقات السابقة
              </h2>
            <FileText className="relative w-[18px] h-[18px] text-gray-500" />
</header>
</div>
</div>
<div className="flex flex-col items-start gap-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto]">
{isLoading ? (
  <div className="flex items-center justify-center w-full min-h-[400px]">
    <LoadingSpinner message="جاري تحميل الاشتراكات..." />
  </div>
) : error ? (
  <div className="flex items-center justify-center w-full min-h-[400px]">
    <p className="text-red-500 text-center [direction:rtl]">{error}</p>
  </div>
) : transformedTableData.length === 0 ? (
  <div className="flex items-center justify-center w-full min-h-[400px]">
    <p className="text-gray-500 text-center [direction:rtl]">لا توجد اشتراكات سابقة</p>
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
      onPageChange={handlePageChange}
      className="flex items-center justify-around gap-[46px] relative self-stretch w-full flex-[0_0_auto]"
    />
  </>
)}
</div>
</article>
</section>
);
};