import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Car, Check, FileText, Tag, Receipt, Percent, Wallet, ArrowRight, AlertCircle, Plus, Gift, Star, Settings, X } from "lucide-react";
import { fetchSubscriptions, processSubscriptionPayment, fetchCurrentCompany, checkIsFirstTimeSubscription, fetchCouponByCode } from "../../services/firestore";
import { LoadingSpinner } from "../../components/shared";
import { useAuth } from "../../hooks/useGlobalState";
import { useNavigation } from "../../hooks/useNavigation";
import { ROUTES } from "../../constants/routes";
import { useToast } from "../../hooks/useToast";
import { generateRoute } from "../../constants/routes";

export const SubscriptionPlansScreen = (): JSX.Element => {
  const [subscriptionType, setSubscriptionType] = useState<"annual" | "monthly">("monthly");
  const [vehicleCount, setVehicleCount] = useState<number>(150);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);
  const [showAlreadySubscribedModal, setShowAlreadySubscribedModal] = useState(false);
  const [showCouponConfirmationModal, setShowCouponConfirmationModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const { company, setCompany } = useAuth();
  const { goTo } = useNavigation();
  const { addToast } = useToast();

  // Get current subscription
  const currentSubscription = company?.selectedSubscription;

  // Check first-time subscription status on mount
  useEffect(() => {
    const checkFirstTime = async () => {
      try {
        const isFirst = await checkIsFirstTimeSubscription();
        setIsFirstTime(isFirst);
        if (isFirst) {
          setCouponCode("LIFE1");
        }
      } catch (err) {
        console.error("Error checking first-time subscription:", err);
      }
    };

    checkFirstTime();
  }, []);

  // Fetch subscriptions on mount
  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchSubscriptions();
        setSubscriptions(data);
      } catch (err) {
        console.error("Error loading subscriptions:", err);
        setError("فشل تحميل الباقات");
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptions();
  }, []);

  // Filter subscriptions by type (annual/monthly)
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      let periodNameValue = "";

      if (sub.periodName) {
        if (typeof sub.periodName === "object") {
          periodNameValue = (sub.periodName.ar || sub.periodName.en || "")
            .toLowerCase()
            .trim();
        } else {
          periodNameValue = String(sub.periodName).toLowerCase().trim();
        }
      }

      if (subscriptionType === "monthly") {
        return (
          periodNameValue === "monthly" ||
          periodNameValue === "شهري" ||
          periodNameValue === "شهريا" ||
          periodNameValue.includes("شهري") ||
          periodNameValue.includes("monthly")
        );
      } else {
        return (
          periodNameValue === "annual" ||
          periodNameValue === "yearly" ||
          periodNameValue === "سنوي" ||
          periodNameValue === "سنوية" ||
          periodNameValue.includes("سنوي") ||
          periodNameValue.includes("annual") ||
          periodNameValue.includes("yearly")
        );
      }
    });
  }, [subscriptions, subscriptionType]);

  // Reset selection when subscription type changes
  useEffect(() => {
    setSelectedPlanId(null);
  }, [subscriptionType]);

  // Build features array from subscription data
  const getFeatures = (subscription: any): string[] => {
    const features: string[] = [];

    // Add options array items
    if (subscription.options && Array.isArray(subscription.options)) {
      subscription.options.forEach((option: any) => {
        if (option && typeof option === "object") {
          const optionValue = option.ar || option.en || "";
          if (optionValue) features.push(optionValue);
        } else if (typeof option === "string") {
          features.push(option);
        }
      });
    }

    // Add automatic vehicle detection
    if (subscription.autoDetectVehicles !== false) {
      features.push("اكتشاف تلقائي لعدد المركبات");
    }

    // Add vehicle count range
    const maxCar = subscription.maxCarNumber;
    const minCar = subscription.minCarNumber || 1;
    if (maxCar || minCar) {
      if (minCar && maxCar) {
        features.push(`عدد السيارات من ${minCar} إلى ${maxCar}`);
      } else if (maxCar) {
        features.push(`عدد السيارات: ${maxCar}`);
      }
    }

    return features;
  };

  // Get selected subscription details
  const selectedSubscription = useMemo(() => {
    return subscriptions.find((sub) => sub.id === selectedPlanId);
  }, [subscriptions, selectedPlanId]);

  // Calculate subscription summary
  const subscriptionSummary = useMemo(() => {
    if (!selectedSubscription) {
      return {
        vehicleCount: vehicleCount,
        subscriptionPrice: 0,
        monthlyPrice: 0,
        totalWithoutVAT: 0,
        vat: 0,
        totalWithVAT: 0,
        couponDiscount: 0,
        couponPercentage: 0,
        isAnnual: false,
      };
    }

    // Determine if subscription is annual or monthly
    let periodNameStr = "";
    if (selectedSubscription.periodName) {
      if (typeof selectedSubscription.periodName === "object") {
        periodNameStr = (selectedSubscription.periodName.ar || selectedSubscription.periodName.en || "")
          .toLowerCase()
          .trim();
      } else {
        periodNameStr = String(selectedSubscription.periodName).toLowerCase().trim();
      }
    }
    
    const isAnnual = 
      periodNameStr === "annual" ||
      periodNameStr === "yearly" ||
      periodNameStr === "سنوي" ||
      periodNameStr === "سنوية" ||
      periodNameStr.includes("سنوي") ||
      periodNameStr.includes("annual") ||
      periodNameStr.includes("yearly") ||
      selectedSubscription.periodValueInDays === 365 ||
      selectedSubscription.periodValueInDays === 360;

    const monthlyPrice = selectedSubscription.price || 0;
    // For annual subscriptions, calculate full year price (12 months)
    // For monthly subscriptions, if coupon is applied and it's LIFE1 (100% discount), treat as 1 year
    const subscriptionPrice = isAnnual || (appliedCoupon && (couponCode.trim().toUpperCase() === "LIFE1" || (appliedCoupon.percentage === 100 || appliedCoupon.precentage === 100)))
      ? monthlyPrice * 12
      : monthlyPrice;
    
    const vatRate = 0.15; // 15% VAT
    const vat = subscriptionPrice * vatRate;
    let totalWithoutVAT = subscriptionPrice;
    let totalWithVAT = subscriptionPrice + vat;
    let couponDiscount = 0;
    let couponPercentage = 0;

    // Apply coupon discount if coupon is applied
    if (appliedCoupon) {
      couponPercentage = appliedCoupon.percentage || appliedCoupon.precentage || 0;
      // Calculate discount on total (price + VAT)
      couponDiscount = totalWithVAT * (couponPercentage / 100);
      totalWithVAT = Math.max(0, totalWithVAT - couponDiscount);
      totalWithoutVAT = totalWithVAT / (1 + vatRate);
    }

    return {
      vehicleCount: vehicleCount,
      subscriptionPrice: subscriptionPrice,
      monthlyPrice: monthlyPrice,
      totalWithoutVAT: totalWithoutVAT,
      vat: vat,
      totalWithVAT: totalWithVAT,
      couponDiscount: couponDiscount,
      couponPercentage: couponPercentage,
      isAnnual: isAnnual,
    };
  }, [selectedSubscription, vehicleCount, appliedCoupon, couponCode]);

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
    
    if (!createdDate || !periodValueInDays) return 'N/A';
    
    try {
      const startDate = createdDate.toDate ? createdDate.toDate() : new Date(createdDate);
      const expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + periodValueInDays);
      return formatDate(expiryDate);
    } catch (error) {
      return 'N/A';
    }
  };

  // Check if subscription is expired
  const isSubscriptionExpired = useMemo(() => {
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
  }, [currentSubscription]);

  // Get current subscription details
  const currentSubscriptionDetails = useMemo(() => {
    if (!currentSubscription) return null;

    return {
      packageName: currentSubscription?.title?.ar || currentSubscription?.title?.en || 'N/A',
      packageType: currentSubscription?.periodName?.ar || 
                  currentSubscription?.periodName?.en || 
                  (typeof currentSubscription?.periodName === 'string' ? currentSubscription?.periodName : 'N/A'),
      price: String(currentSubscription?.price || 0),
      vehicleCount: String(company?.maxCarNumber || 
                          company?.numberOfVehicles || 
                          company?.vehicleCount || 
                          company?.carsLimit || 
                          currentSubscription?.maxCarNumber || 
                          0),
      subscriptionDate: formatDate(currentSubscription?.createdDate),
      expiryDate: calculateExpiryDate(),
    };
  }, [currentSubscription, company]);

  // Handle Next button click
  const handleNext = () => {
    if (selectedPlanId) {
      // Check if user already has an active (non-expired) subscription
      if (currentSubscription && !isSubscriptionExpired) {
        setShowAlreadySubscribedModal(true);
        return;
      }
      setShowSummaryModal(true);
    }
  };

  // Get wallet balance
  const walletBalance = useMemo(() => {
    return company?.balance || company?.walletBalance || 0;
  }, [company]);

  // Handle confirm subscription
  const handleConfirmSubscription = async () => {
    // Check if wallet has sufficient balance (skip if total is 0 due to 100% discount)
    if (subscriptionSummary.totalWithVAT > 0 && walletBalance < subscriptionSummary.totalWithVAT) {
      // Show insufficient balance modal
      setShowSummaryModal(false);
      setShowInsufficientBalanceModal(true);
      return;
    }

    if (!selectedPlanId || !selectedSubscription || !company) {
      addToast({
        title: 'خطأ',
        message: 'البيانات غير مكتملة',
        type: 'error'
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Ensure we have company ID (might be id, email, or doc ID)
      const companyIdToUse = company.id || company.email || "";
      
      if (!companyIdToUse) {
        addToast({
          title: 'خطأ',
          message: 'بيانات الشركة غير مكتملة. يرجى تسجيل الخروج والدخول مرة أخرى.',
          type: 'error'
        });
        return;
      }

      // If coupon is applied (LIFE1), override subscription to 1 year
      let subscriptionToUse = selectedSubscription;
      
      if (appliedCoupon && (couponCode.trim().toUpperCase() === "LIFE1" || (appliedCoupon.percentage === 100 || appliedCoupon.precentage === 100))) {
        // Override to 1 year (365 days) for free year coupon
        subscriptionToUse = {
          ...selectedSubscription,
          periodValueInDays: 365,
          periodName: typeof selectedSubscription.periodName === 'object' 
            ? { ...selectedSubscription.periodName, ar: 'سنوي', en: 'Annual' }
            : 'سنوي'
        };
      }

      // Process subscription payment
      const result = await processSubscriptionPayment({
        subscriptionId: selectedPlanId,
        subscription: subscriptionToUse,
        vehicleCount: vehicleCount,
        totalWithVAT: subscriptionSummary.totalWithVAT,
        totalWithoutVAT: subscriptionSummary.totalWithoutVAT,
        vat: subscriptionSummary.vat,
        companyId: companyIdToUse,
        company: company,
        couponCode: appliedCoupon ? couponCode.trim().toUpperCase() : undefined,
        couponData: appliedCoupon || undefined,
      });

      // Refresh company data
      const updatedCompany = await fetchCurrentCompany();
      if (updatedCompany && setCompany) {
        setCompany(updatedCompany);
      }

      // Show success message
      addToast({
        title: 'نجح',
        message: 'تم الاشتراك بنجاح',
        type: 'success'
      });

      // Close summary modal
      setShowSummaryModal(false);

      // Navigate to invoice detail page
      goTo(generateRoute(ROUTES.SUBSCRIPTION_INVOICE_DETAIL, { id: result.invoiceId }));
    } catch (error: any) {
      console.error("Error processing subscription payment:", error);
      addToast({
        title: 'خطأ',
        message: error.message || 'فشل في معالجة الاشتراك',
        type: 'error'
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle recharge wallet
  const handleRechargeWallet = () => {
    setShowInsufficientBalanceModal(false);
    goTo(ROUTES.CHARGE_WALLET);
  };

  // Handle go back from insufficient balance modal
  const handleInsufficientBalanceGoBack = () => {
    setShowInsufficientBalanceModal(false);
  };

  // Handle close already subscribed modal
  const handleAlreadySubscribedClose = () => {
    setShowAlreadySubscribedModal(false);
  };

  // Handle go back
  const handleGoBack = () => {
    setShowSummaryModal(false);
  };

  // Handle apply coupon
  const handleApplyCoupon = async () => {
    console.log("🔵 handleApplyCoupon called with couponCode:", couponCode);
    
    if (!couponCode.trim()) {
      addToast({
        title: 'خطأ',
        message: 'يرجى إدخال كود الكوبون',
        type: 'error'
      });
      return;
    }

    setIsValidatingCoupon(true);
    try {
      console.log("🔵 Fetching coupon with code:", couponCode.trim().toUpperCase());
      const coupon = await fetchCouponByCode(couponCode.trim().toUpperCase());
      console.log("🔵 Coupon fetched:", coupon);
      
      if (!coupon) {
        console.log("🔴 Coupon not found in database");
        // For LIFE1, if it doesn't exist, create a temporary coupon object for first-time users
        if (couponCode.trim().toUpperCase() === "LIFE1" && isFirstTime) {
          console.log("🟡 Creating temporary LIFE1 coupon for first-time user");
          const tempCoupon = {
            id: 'temp-life1',
            code: 'LIFE1',
            percentage: 100,
            precentage: 100,
            isCompany: true,
          };
          setAppliedCoupon(tempCoupon);
          setShowCouponConfirmationModal(true);
          console.log("✅ Temporary coupon applied, modal shown");
          setIsValidatingCoupon(false);
          return;
        }
        
        addToast({
          title: 'خطأ',
          message: 'كود الكوبون غير صحيح',
          type: 'error'
        });
        setIsValidatingCoupon(false);
        return;
      }

      // Check if coupon is expired
      const expireDate = coupon.expireDate || coupon.expiryDate || coupon.expireAt || coupon.expirationDate;
      if (expireDate) {
        let expiryDate: Date;
        if (expireDate.toDate) {
          expiryDate = expireDate.toDate();
        } else if (expireDate.seconds) {
          expiryDate = new Date(expireDate.seconds * 1000);
        } else {
          expiryDate = new Date(expireDate);
        }
        
        if (expiryDate < new Date()) {
          console.log("🔴 Coupon expired");
          addToast({
            title: 'خطأ',
            message: 'كود الكوبون منتهي الصلاحية',
            type: 'error'
          });
          setIsValidatingCoupon(false);
          return;
        }
      }

      // For LIFE1 specifically, verify it's 100% discount
      if (couponCode.trim().toUpperCase() === "LIFE1") {
        const percentage = coupon.percentage || coupon.precentage || 0;
        console.log("🔵 LIFE1 coupon percentage:", percentage);
        if (percentage !== 100) {
          addToast({
            title: 'تنبيه',
            message: 'كود LIFE1 يجب أن يكون خصم 100%',
            type: 'warning'
          });
        }
      }

      // Check if coupon is for companies (if specified)
      if (coupon.isCompany !== undefined && coupon.isCompany !== true) {
        console.log("🔴 Coupon not for companies");
        addToast({
          title: 'خطأ',
          message: 'هذا الكوبون غير صالح للشركات',
          type: 'error'
        });
        setIsValidatingCoupon(false);
        return;
      }

      console.log("✅ Coupon validated successfully, setting appliedCoupon and showing modal");
      setAppliedCoupon(coupon);
      // Show confirmation popup
      setShowCouponConfirmationModal(true);
      console.log("✅ Modal state set to true");
    } catch (error: any) {
      console.error("🔴 Error validating coupon:", error);
      addToast({
        title: 'خطأ',
        message: error.message || 'حدث خطأ أثناء التحقق من الكوبون',
        type: 'error'
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Handle remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    if (isFirstTime) {
      setCouponCode("LIFE1");
    } else {
      setCouponCode("");
    }
  };

  const getBadgeColorClass = (status: string) => {
    const statusLower = status.toLowerCase().trim();
    if (statusLower.includes("أنسب") || statusLower.includes("best")) {
      return "bg-pink-100 text-pink-600";
    }
    return "bg-pink-100 text-pink-600";
  };

  return (
    <div className="flex flex-col w-full items-start gap-6" dir="rtl">
      {/* Header Section with Title */}
      <div className="w-full flex flex-col gap-2 items-center">
        <h1 className="text-4xl font-bold text-[#5A66C1]">الباقات</h1>
        <p className="text-base text-gray-600">قم بإدارة وتجديد اشتراكاتك بكل سهولة</p>
      </div>

      {/* Special Offer Banner */}
      {isFirstTime && (
        <div className="w-full bg-[#1e3a8a] rounded-xl shadow-lg p-6 lg:p-8 relative overflow-hidden">
          {/* Decorative Icons */}
          <Star className="absolute top-4 right-4 w-8 h-8 text-yellow-400 opacity-60" />
          <Gift className="absolute top-4 left-4 w-8 h-8 text-yellow-400 opacity-60" />
          <AlertCircle className="absolute bottom-4 right-4 w-8 h-8 text-yellow-400 opacity-60" />
          <Settings className="absolute bottom-4 left-4 w-8 h-8 text-yellow-400 opacity-60" />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <h2 className="text-2xl lg:text-3xl font-bold text-white">
                عرض خاص - اشتراك لمدة سنة مجاناً!
              </h2>
            </div>
            <p className="text-lg text-white/90">
              استخدم كود الكوبون <span className="bg-white text-[#1e3a8a] px-2 py-1 rounded font-bold">LIFE1</span> واحصل على سنة كاملة مجاناً
            </p>
          </div>
        </div>
      )}

      {/* Vehicle Count Input and Subscription Type Toggle Section - Framed */}
      <div className="w-full bg-white rounded-xl shadow-sm border-2 border-gray-300 p-6 lg:p-8 mb-8">
        <div className="w-full flex items-end justify-between gap-8">
          {/* Vehicle Count Input */}
          <div className="flex flex-col gap-3 flex-1">
            <label className="text-sm font-medium text-gray-700">أدخل عدد المركبات</label>
            <div className="relative w-full">
              <Car className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="number"
                value={vehicleCount}
                onChange={(e) => setVehicleCount(parseInt(e.target.value) || 0)}
                min="1"
                className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A66C1] focus:border-transparent text-gray-700"
                placeholder="150"
              />
            </div>
          </div>

          {/* Subscription Type Toggle */}
          <div className="flex flex-col gap-3 flex-1">
            <label className="text-sm font-medium text-gray-700 text-center">نوع الاشتراك</label>
            <div className="flex items-center gap-0 bg-gray-100 rounded-xl p-1 w-full">
              <button
                type="button"
                onClick={() => setSubscriptionType("annual")}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex-1 ${
                  subscriptionType === "annual"
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-transparent text-gray-700 hover:bg-gray-200"
                }`}
              >
                الاشتراكات السنوية
              </button>
              <button
                type="button"
                onClick={() => setSubscriptionType("monthly")}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex-1 ${
                  subscriptionType === "monthly"
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-transparent text-gray-700 hover:bg-gray-200"
                }`}
              >
                الاشتراكات الشهرية
              </button>
            </div>
          </div>

          {/* Coupon Code Input - Only show if company has never subscribed */}
          {isFirstTime && (
            <div className="flex flex-col gap-3 flex-1">
              <label className="text-sm font-medium text-gray-700">كود الكوبون (اختياري)</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Gift className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A66C1] focus:border-transparent text-gray-700"
                    placeholder="أدخل كود الكوبون"
                    disabled={isValidatingCoupon}
                  />
                </div>
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors shadow-md flex items-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    <span>إلغاء</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponCode.trim()}
                    className={`px-6 py-3 rounded-lg font-medium transition-all shadow-md flex items-center gap-2 ${
                      isValidatingCoupon || !couponCode.trim()
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-[#1e3a8a] text-white hover:bg-[#1e40af]"
                    }`}
                  >
                    {isValidatingCoupon ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>جاري التحقق...</span>
                      </>
                    ) : (
                      <span>تطبيق</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Card for Plans */}
      <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">

        {/* Loading State */}
        {isLoading && (
          <div className="w-full flex justify-center items-center py-12">
            <LoadingSpinner message="جاري تحميل الباقات..." />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="w-full flex justify-center items-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Subscription Plans Cards */}
        {!isLoading && !error && (
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {filteredSubscriptions.map((subscription) => {
              const features = getFeatures(subscription);
              const isSelected = selectedPlanId === subscription.id;
              // Handle status - could be object or string, ensure it's always a string
              let statusString = "";
              if (subscription.status) {
                if (typeof subscription.status === "object" && subscription.status !== null) {
                  statusString = String(subscription.status.ar || subscription.status.en || "");
                } else {
                  statusString = String(subscription.status || "");
                }
              }
              // Check if recommended - ensure statusString is a valid string before using includes
              const isRecommended = statusString 
                ? (statusString.includes("أنسب") || statusString.toLowerCase().includes("most suitable") || statusString.toLowerCase().includes("best"))
                : false;

              return (
                <div
                  key={subscription.id}
                  onClick={() => setSelectedPlanId(subscription.id)}
                  className={`relative flex flex-col p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer ${
                    isSelected
                      ? "border-2 border-[#5A66C1]"
                      : "border border-gray-200"
                  }`}
                >
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-medium z-10">
                      الأنسب
                    </div>
                  )}

                  {/* Package Name */}
                  <h2 className="text-xl font-bold text-gray-900 mt-2 mb-3">
                    {subscription.title?.ar || subscription.title?.en || subscription.title || "بدون عنوان"}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    {subscription.description?.ar || subscription.description?.en || subscription.description || ""}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-[#5A66C1]">
                      {subscription.price || 0}
                    </span>
                    <span className="text-lg text-gray-600 mr-2"> ر.س / شهر</span>
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <div className="flex flex-col gap-3 mb-6">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-gray-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Package Indicator */}
                  {isSelected && (
                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-200">
                      <div className="w-5 h-5 bg-[#5A66C1] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-[#5A66C1]">الباقة المختارة</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredSubscriptions.length === 0 && (
          <div className="w-full flex justify-center items-center py-12">
            <p className="text-gray-500">لا توجد باقات متاحة</p>
          </div>
        )}

        {/* Auto-renewal Message and Next Button */}
        {!isLoading && !error && filteredSubscriptions.length > 0 && (
          <div className="w-full flex flex-col items-center gap-6 mt-8">
            <p className="text-sm text-gray-600">سيتم تجديد الإشتراك بالباقه تلقائياً</p>
            <button
              onClick={handleNext}
              disabled={!selectedPlanId}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-all ${
                selectedPlanId
                  ? "bg-[#5A66C1] hover:bg-[#4f5ab0] shadow-md"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              التالي
            </button>
          </div>
        )}
      </div>

      {/* Subscription Summary Modal */}
      {showSummaryModal && createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleGoBack}
          />
          
          {/* Modal */}
          <div
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 lg:p-8">
              {/* Header Section */}
              <div className="flex flex-col items-center gap-4 mb-8">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-[#5A66C1]" />
                </div>
                
                {/* Title */}
                <h2 className="text-2xl font-bold text-[#5A66C1]">
                  ملخص الإشتراك
                </h2>
                
                {/* Subtitle */}
                <p className="text-sm text-gray-600 text-center">
                  مراجعة تفاصيل اشتراكك قبل التأكيد
                </p>
              </div>

              {/* Coupon Success Message */}
              {appliedCoupon && (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg mb-6 border border-green-200">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-green-700">
                      تم تطبيق كود الكوبون بنجاح!
                    </p>
                    {appliedCoupon.percentage === 100 || appliedCoupon.precentage === 100 ? (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <span>⭐</span>
                        <span>اشتراك مجاني لمدة سنة كاملة</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Information Display Section */}
              <div className="flex flex-col gap-4 mb-6">
                {/* Number of Vehicles */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700">عدد المركبات</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {subscriptionSummary.vehicleCount}
                  </span>
                </div>

                {/* Subscription Price */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {subscriptionSummary.isAnnual || (appliedCoupon && (appliedCoupon.percentage === 100 || appliedCoupon.precentage === 100))
                        ? "سعر الإشتراك (سنة كاملة)"
                        : "سعر الإشتراك"}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {subscriptionSummary.subscriptionPrice.toFixed(2)} ر.س
                    {subscriptionSummary.isAnnual && subscriptionSummary.monthlyPrice > 0 && (
                      <span className="text-xs text-gray-500 mr-2">
                        ({subscriptionSummary.monthlyPrice.toFixed(2)} × 12 شهر)
                      </span>
                    )}
                  </span>
                </div>

                {/* Total without VAT */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700">الإجمالي بدون ضريبة القيمة المضافة</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {subscriptionSummary.totalWithoutVAT.toFixed(2)} ر.س
                  </span>
                </div>

                {/* VAT (15%) */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700">الضريبة ( 15 %)</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {subscriptionSummary.vat.toFixed(2)} ر.س
                  </span>
                </div>

                {/* Coupon Discount */}
                {appliedCoupon && subscriptionSummary.couponDiscount > 0 && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-700">
                        خصم الكوبون ( {subscriptionSummary.couponPercentage.toFixed(0)} %)
                      </span>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      - {subscriptionSummary.couponDiscount.toFixed(2)} ر.س
                    </span>
                  </div>
                )}

                {/* Total including VAT - Highlighted */}
                <div className={`flex items-center justify-between py-4 px-4 rounded-lg border-2 border-solid ${
                  subscriptionSummary.totalWithVAT === 0 
                    ? "bg-green-50 border-green-200" 
                    : "bg-white border-gray-500"
                }`}>
                  <div className="flex items-center gap-2">
                    <Receipt className={`w-5 h-5 ${
                      subscriptionSummary.totalWithVAT === 0 ? "text-green-700" : "text-gray-700"
                    }`} />
                    <span className={`text-sm font-medium ${
                      subscriptionSummary.totalWithVAT === 0 ? "text-green-700" : "text-gray-700"
                    }`}>
                      إجمالي شامل الضريبة
                    </span>
                  </div>
                  <span className={`text-xl font-bold ${
                    subscriptionSummary.totalWithVAT === 0 ? "text-green-700" : "text-gray-900"
                  }`}>
                    {subscriptionSummary.totalWithVAT.toFixed(2)} ر.س
                  </span>
                </div>
              </div>

              {/* Wallet Deduction Message - Only show if total > 0 */}
              {subscriptionSummary.totalWithVAT > 0 && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg mb-6 shadow-[0_0_20px_rgba(90,102,193,0.3)]">
                  <Wallet className="w-5 h-5 text-[#5A66C1] flex-shrink-0" />
                  <p className="text-sm font-medium text-[#5A66C1]">
                    سيتم خصم مبلغ الإشتراك من رصيد المحفظة
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4">
                {/* Go Back Button */}
                <button
                  onClick={handleGoBack}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>العودة للخلف</span>
                </button>

                {/* Confirm Subscription Button */}
                <button
                  onClick={handleConfirmSubscription}
                  disabled={isProcessingPayment}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1e3a8a] text-white rounded-lg font-medium hover:bg-[#1e40af] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingPayment ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>جاري المعالجة...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>تأكيد الإشتراك</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Insufficient Balance Modal */}
      {showInsufficientBalanceModal && createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleInsufficientBalanceGoBack}
          />
          
          {/* Modal */}
          <div
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 lg:p-8">
              {/* Red Warning Header */}
              <div className="flex flex-col items-center gap-4 mb-6">
                {/* Warning Icon */}
                <div className="w-16 h-16 rounded-full bg-white border-4 border-red-500 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                
                {/* Warning Title */}
                <h2 className="text-2xl font-bold text-red-500">
                  تنبيه
                </h2>
                
                {/* Warning Message */}
                <p className="text-sm text-red-500 text-center">
                  العملية إتمام يمكن لا عذرا.
                </p>
              </div>

              {/* Main Content - Insufficient Balance Message */}
              <div className="flex flex-col gap-3 mb-6">
                <h3 className="text-xl font-bold text-gray-900 text-center">
                  رصيدك غير كافي
                </h3>
                <p className="text-sm text-gray-700 text-center">
                  الرصيد غير كافي لإجراء هذه العملية
                </p>
                <p className="text-sm text-gray-700 text-center">
                  الرجاء شحن المحفظة وإعادة المحاولة مجدداً
                </p>
              </div>

              {/* Balance Details Section */}
              <div className="flex flex-col gap-4 p-4 bg-pink-50 rounded-lg border border-pink-200 mb-6">
                <h4 className="text-sm font-bold text-red-500 mb-2">
                  تفاصيل الرصيد
                </h4>
                
                {/* Current Balance */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-gray-700">الرصيد الحالي</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">
                    {walletBalance.toFixed(2)} ر.س
                  </span>
                </div>

                {/* Required Amount */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-gray-700">المبلغ المطلوب</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">
                    {subscriptionSummary.totalWithVAT.toFixed(2)} ر.س
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {/* Recharge Wallet Button */}
                <button
                  onClick={handleRechargeWallet}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  <span>شحن المحفظة الآن</span>
                </button>

                {/* Go Back Button */}
                <button
                  onClick={handleInsufficientBalanceGoBack}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>العودة للخلف</span>
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Coupon Confirmation Modal */}
      {showCouponConfirmationModal && createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowCouponConfirmationModal(false)}
          />
          
          {/* Modal */}
          <div
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 lg:p-8">
              {/* Header Section */}
              <div className="flex flex-col items-center gap-4 mb-6">
                {/* Success Icon */}
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                
                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900">
                  تم تطبيق الكوبون بنجاح!
                </h2>
                
                {/* Subtitle */}
                <p className="text-sm text-gray-600 text-center">
                  الكوبون جاهز للاستخدام. يرجى اختيار الباقة المطلوبة للمتابعة.
                </p>
              </div>

              {/* Coupon Details */}
              {appliedCoupon && (
                <div className="flex items-center justify-center gap-3 p-4 bg-green-50 rounded-lg mb-6 border border-green-200">
                  <Gift className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-green-700">
                      كود الكوبون: <span className="font-bold">{couponCode}</span>
                    </p>
                    {appliedCoupon.percentage === 100 || appliedCoupon.precentage === 100 ? (
                      <p className="text-xs text-green-600">
                        خصم 100% - اشتراك مجاني لمدة سنة كاملة
                      </p>
                    ) : (
                      <p className="text-xs text-green-600">
                        خصم {appliedCoupon.percentage || appliedCoupon.precentage}%
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex items-center justify-center">
                <button
                  onClick={() => setShowCouponConfirmationModal(false)}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-[#1e3a8a] text-white rounded-lg font-medium hover:bg-[#1e40af] transition-colors shadow-md"
                >
                  <Check className="w-5 h-5" />
                  <span>حسناً، سأختار الباقة الآن</span>
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Already Subscribed Modal */}
      {showAlreadySubscribedModal && currentSubscriptionDetails && createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleAlreadySubscribedClose}
          />
          
          {/* Modal */}
          <div
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 lg:p-8">
              {/* Header Section */}
              <div className="flex flex-col items-center gap-4 mb-6">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-[#5A66C1]" />
                </div>
                
                {/* Title */}
                <h2 className="text-2xl font-bold text-[#5A66C1]">
                  لديك اشتراك نشط بالفعل
                </h2>
                
                {/* Subtitle */}
                <p className="text-sm text-gray-600 text-center">
                  أنت مشترك حالياً في إحدى الباقات. يمكنك مراجعة تفاصيل اشتراكك الحالي أدناه.
                </p>
              </div>

              {/* Current Subscription Details */}
              <div className="flex flex-col gap-4 mb-6">
                {/* Package Name */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-700">اسم الباقة</span>
                  <span className="text-sm font-medium text-gray-900">
                    {currentSubscriptionDetails.packageName}
                  </span>
                </div>

                {/* Package Type */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-700">نوع الباقة</span>
                  <span className="text-sm font-medium text-gray-900">
                    {currentSubscriptionDetails.packageType}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-700">السعر</span>
                  <span className="text-sm font-medium text-gray-900">
                    {currentSubscriptionDetails.price} ر.س
                  </span>
                </div>

                {/* Vehicle Count */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-700">عدد المركبات</span>
                  <span className="text-sm font-medium text-gray-900">
                    {currentSubscriptionDetails.vehicleCount}
                  </span>
                </div>

                {/* Subscription Date */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-700">تاريخ الاشتراك</span>
                  <span className="text-sm font-medium text-gray-900">
                    {currentSubscriptionDetails.subscriptionDate}
                  </span>
                </div>

                {/* Expiry Date */}
                <div className="flex items-center justify-between py-4 px-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <span className="text-sm font-medium text-[#5A66C1]">تاريخ الانتهاء</span>
                  <span className="text-lg font-bold text-[#5A66C1]">
                    {currentSubscriptionDetails.expiryDate}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-center">
                <button
                  onClick={handleAlreadySubscribedClose}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-[#5A66C1] text-white rounded-lg font-medium hover:bg-[#4f5ab0] transition-colors shadow-md"
                >
                  <span>حسناً</span>
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

