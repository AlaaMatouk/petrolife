import { useState, useEffect, useMemo } from "react";
import { LegendHighlightLineChart, Spinner, Table, TimeFilter } from "../../components/shared";
import {
  BarChart3,
  MapPin,
  Fuel,
  Wallet,
  Car,
  Users,
  Droplets,
  Battery,
  FileText,
  Download,
} from "lucide-react";
import { useAuth } from "../../hooks/useGlobalState";
import {
  fetchOrders,
  calculateFuelStatistics,
  calculateCarWashStatistics,
  calculateOilChangeStatistics,
  calculateBatteryChangeStatistics,
  calculateTireChangeStatistics,
  calculateBatteryReplacementStatistics,
  calculateDriverStatistics,
  calculateCarStatistics,
  calculateOrderStatistics,
  calculateFuelConsumptionByCities,
  getCompanyEssentialCategorySalesTrends,
  EssentialCategorySalesTrends,
  EssentialCategoryTimeseries,
  EssentialCategoryKey,
} from "../../services/firestore";
import { exportDataTable } from "../../services/exportService";
import { useToast } from "../../context/ToastContext";
import { useNavigation } from "../../hooks/useNavigation";
import { ROUTES } from "../../constants/routes";
import { Map } from "../PerolifeStationLocations/sections/map/Map";

// Banner Section Component
const BannerSection = () => {
  return (
    <section className="w-full mb-8">
      <div
        className="relative w-full h-48 rounded-2xl overflow-hidden"
        style={{ backgroundColor: "#311159" }}
      >
        {/* Content */}
        <div className="relative z-10 flex items-center h-full pl-0 pr-8">
          {/* Left Side - Image */}
          <div className="flex-shrink-0 mr-8 h-full flex items-center">
            <img
              src="/img/123.png"
              alt="Dashboard illustration"
              className="h-48 w-auto object-contain"
            />
          </div>

          {/* Right Side - Text Content */}
          <div className="flex-1 text-white">
            <p className="text-xl font-normal leading-relaxed text-right [direction:rtl] max-w-2xl">
              كل ما تحتاجه في مكان واحد. قم بإدارة كافة أعمال الوقود الخاص
              بنشاطك التجاري من مكان واحد. ما عليك إلا شحن المحفظة وتسجيل
              السائقين والسيارات واستمتع بإحصائيات كاملة حول وقودك المستهلك.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Stats Cards Section
const StatsCardsSection = () => {
  const { company } = useAuth();
  const [fuelStats, setFuelStats] = useState<{
    fuelTypes: Array<{
      type: string;
      totalLitres: number;
      totalCost: number;
      color: string;
    }>;
    totalLitres: number;
    totalCost: number;
  }>({ fuelTypes: [], totalLitres: 0, totalCost: 0 });

  const [carWashStats, setCarWashStats] = useState<{
    sizes: Array<{ name: string; count: number; totalCost: number }>;
    totalOrders: number;
    totalCost: number;
  }>({ sizes: [], totalOrders: 0, totalCost: 0 });

  const [oilStats, setOilStats] = useState<{
    totalLitres: number;
  }>({ totalLitres: 0 });

  const [batteryStats, setBatteryStats] = useState<{
    sizes: Array<{ name: string; count: number }>;
    totalOrders: number;
  }>({ sizes: [], totalOrders: 0 });

  const [tireStats, setTireStats] = useState<{
    sizes: Array<{ name: string; count: number }>;
    totalOrders: number;
  }>({ sizes: [], totalOrders: 0 });

  const [batteryReplacementStats, setBatteryReplacementStats] = useState<{
    totalCost: number;
    replacedCount: number;
    requestedCount: number;
  }>({ totalCost: 0, replacedCount: 0, requestedCount: 0 });

  const [driverStats, setDriverStats] = useState<{
    active: number;
    inactive: number;
    total: number;
  }>({ active: 0, inactive: 0, total: 0 });

  const [carStats, setCarStats] = useState<{
    sizes: Array<{ name: string; count: number }>;
    total: number;
  }>({ sizes: [], total: 0 });

  const [orderStats, setOrderStats] = useState<{
    completed: number;
    cancelled: number;
    total: number;
  }>({ completed: 0, cancelled: 0, total: 0 });

  // Get balance from company data
  // If company is null, we're still loading
  // If company.balance is undefined, default to 0
  const walletBalance = company ? company.balance ?? 0 : null;
  const isLoadingBalance = walletBalance === null;

  // Format number with thousands separator (English)
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  // Fetch orders and calculate fuel, car wash, oil, battery, driver, car, and order statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const orders = await fetchOrders();
        const fuelData = calculateFuelStatistics(orders);
        setFuelStats(fuelData);

        const carWashData = calculateCarWashStatistics(orders);
        setCarWashStats(carWashData);

        const oilData = calculateOilChangeStatistics(orders);
        setOilStats(oilData);

        const batteryData = calculateBatteryChangeStatistics(orders);
        setBatteryStats(batteryData);

        const tireData = calculateTireChangeStatistics(orders);
        setTireStats(tireData);

        const batteryReplacementData =
          calculateBatteryReplacementStatistics(orders);
        setBatteryReplacementStats(batteryReplacementData);

        const orderData = calculateOrderStatistics(orders);
        setOrderStats(orderData);

        const driverData = await calculateDriverStatistics();
        setDriverStats(driverData);

        const carData = await calculateCarStatistics();
        setCarStats(carData);
      } catch (error) {
        console.error("Error loading statistics:", error);
      }
    };
    loadStats();
  }, []);

  // Format fuel data for display
  const fuelData =
    fuelStats.fuelTypes.length > 0
      ? fuelStats.fuelTypes.map((fuel) => ({
          type: fuel.type,
          amount: `${Math.round(fuel.totalLitres)} .L`,
          color: fuel.color,
        }))
      : [
          {
            type: "ديزل",
            amount: "185 .L",
            color: "text-color-mode-text-icons-t-orange",
          },
          {
            type: "بنزين 95",
            amount: "548 .L",
            color: "text-color-mode-text-icons-t-red",
          },
          {
            type: "بنزين 91",
            amount: "845 .L",
            color: "text-color-mode-text-icons-t-green",
          },
        ];

  const statsData = [
    {
      title: "اجمالي اللترات المستهلكة",
      content: fuelData,
      icon: <Fuel className="w-5 h-5" style={{ color: "#E76500" }} />,
      type: "fuel",
    },
    {
      title: "التكلفة الإجمالية للوقود",
      amount: formatNumber(Math.round(fuelStats.totalCost)),
      currency: "ر.س",
      icon: <Fuel className="w-5 h-5" style={{ color: "#E76500" }} />,
      type: "cost",
    },
    {
      title: "رصيد محفظتي",
      amount: isLoadingBalance ? null : formatNumber(walletBalance ?? 0),
      currency: "ر.س",
      icon: <Wallet className="w-5 h-5" style={{ color: "#E76500" }} />,
      type: "wallet",
      isLoading: isLoadingBalance,
    },
    {
      title: "تغييرات الزيوت",
      amount: formatNumber(Math.round(oilStats.totalLitres)),
      unit: "لتر",
      icon: <Droplets className="w-5 h-5" style={{ color: "#E76500" }} />,
      type: "oil",
    },
    {
      title: "عمليات تغيير الإطارات",
      categories:
        tireStats.sizes.length > 0
          ? tireStats.sizes.map((size) => ({
              name: size.name,
              count: size.count,
            }))
          : [
              { name: "صغيرة", count: 0 },
              { name: "متوسطة", count: 0 },
              { name: "كبيرة", count: 0 },
              { name: "VIP", count: 0 },
            ],
      icon: <Car className="w-5 h-5" style={{ color: "#E76500" }} />,
    },
    {
      title: "عمليات غسيل السيارات",
      categories:
        carWashStats.sizes.length > 0
          ? carWashStats.sizes.map((size) => ({
              name: size.name,
              count: size.count,
            }))
          : [
              { name: "صغيرة", count: 0 },
              { name: "متوسطة", count: 0 },
              { name: "كبيرة", count: 0 },
              { name: "VIP", count: 0 },
            ],
      icon: <Droplets className="w-5 h-5" style={{ color: "#E76500" }} />,
    },
    {
      title: "استبدال البطاريات",
      cost: formatNumber(Math.round(batteryReplacementStats.totalCost)),
      currency: "ر.س",
      replaced: formatNumber(batteryReplacementStats.replacedCount),
      requested: formatNumber(batteryReplacementStats.requestedCount),
      icon: <Battery className="w-5 h-5" style={{ color: "#E76500" }} />,
    },
    {
      title: "عمليات تغيير البطاريات",
      categories:
        batteryStats.sizes.length > 0
          ? batteryStats.sizes.map((size) => ({
              name: size.name,
              count: size.count,
            }))
          : [
              { name: "صغيرة", count: 0 },
              { name: "متوسطة", count: 0 },
              { name: "كبيرة", count: 0 },
              { name: "VIP", count: 0 },
            ],
      icon: <Battery className="w-5 h-5" style={{ color: "#E76500" }} />,
    },
    {
      title: "اجمالي تكلفة الوقود",
      total: `الاجمالي ${formatNumber(Math.round(fuelStats.totalCost))}`,
      breakdown:
        fuelStats.fuelTypes.length > 0
          ? fuelStats.fuelTypes.map((fuel) => ({
              type: fuel.type,
              amount: formatNumber(Math.round(fuel.totalCost)),
              color: fuel.color,
            }))
          : [
              {
                type: "ديزل",
                amount: "0",
                color: "text-color-mode-text-icons-t-orange",
              },
              {
                type: "بنزين 95",
                amount: "0",
                color: "text-color-mode-text-icons-t-red",
              },
              {
                type: "بنزين 91",
                amount: "0",
                color: "text-color-mode-text-icons-t-green",
              },
            ],
      icon: <Fuel className="w-5 h-5" style={{ color: "#E76500" }} />,
    },
    {
      title: "الطلبات المكتملة / الملغية",
      completed: orderStats.completed,
      cancelled: orderStats.cancelled,
      icon: <FileText className="w-5 h-5" style={{ color: "#E76500" }} />,
    },
    {
      title: "السيارات",
      total: carStats.total,
      categories:
        carStats.sizes.length > 0
          ? carStats.sizes.map((size) => ({
              name: size.name,
              count: size.count,
            }))
          : [
              { name: "صغيرة", count: 0 },
              { name: "متوسطة", count: 0 },
              { name: "كبيرة", count: 0 },
              { name: "VIP", count: 0 },
            ],
      icon: <Car className="w-5 h-5" style={{ color: "#E76500" }} />,
    },
    {
      title: "السائقين النشطين / المعطلين",
      active: driverStats.active,
      inactive: driverStats.inactive,
      icon: <Users className="w-5 h-5" style={{ color: "#E76500" }} />,
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <div
          key={index}
          className="relative w-full h-[120px] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder p-6 flex flex-col justify-between"
        >
          {/* Upper row - title */}
          <div className="flex justify-end mb-4">
            <span className="text-base text-color-mode-text-icons-t-sec">
              {stat.title}
            </span>
          </div>

          {/* Lower row - value and icon */}
          <div className="flex items-center justify-between">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#FFF3F9" }}
            >
              {stat.icon}
            </div>

            {stat.type === "fuel" ? (
              <div className="flex items-center gap-4">
                {stat.content?.map((fuel, fuelIndex) => (
                  <div key={fuelIndex} className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-color-mode-text-icons-t-blue">
                        {fuel.amount}
                      </span>
                      <span className={`${fuel.color} text-xs`}>
                        {fuel.type}
                      </span>
                    </div>
                    {fuelIndex < (stat.content?.length || 0) - 1 && (
                      <div className="w-px h-8 bg-gray-300"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : stat.categories ? (
              <div className="flex items-center gap-4">
                {stat.categories.map((category, catIndex) => (
                  <div key={catIndex} className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-color-mode-text-icons-t-blue">
                        {category.count}
                      </span>
                      <span className="text-xs text-color-mode-text-icons-t-sec">
                        {category.name}
                      </span>
                    </div>
                    {catIndex < stat.categories.length - 1 && (
                      <div className="w-px h-8 bg-gray-300"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : stat.breakdown ? (
              <div className="flex items-center gap-4">
                {stat.breakdown.map((fuel, fuelIndex) => (
                  <div key={fuelIndex} className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-color-mode-text-icons-t-blue">
                        {fuel.amount}
                      </span>
                      <span className={`${fuel.color} text-xs`}>
                        {fuel.type}
                      </span>
                    </div>
                    {fuelIndex < stat.breakdown.length - 1 && (
                      <div className="w-px h-8 bg-gray-300"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : stat.cost ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold text-color-mode-text-icons-t-blue">
                    {stat.cost}
                  </span>
                  <span className="text-xs text-color-mode-text-icons-t-sec">
                    التكلفة
                  </span>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold text-color-mode-text-icons-t-blue">
                    {stat.replaced}
                  </span>
                  <span className="text-xs text-color-mode-text-icons-t-sec">
                    مستبدلة
                  </span>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold text-color-mode-text-icons-t-blue">
                    {stat.requested}
                  </span>
                  <span className="text-xs text-color-mode-text-icons-t-sec">
                    طلب
                  </span>
                </div>
              </div>
            ) : stat.completed ? (
              <p className="text-2xl text-color-mode-text-icons-t-blue font-bold">
                <span className="text-red-500">{stat.cancelled}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-blue-600">{stat.completed}</span>
              </p>
            ) : stat.active ? (
              <p className="text-2xl text-color-mode-text-icons-t-blue font-bold">
                <span className="text-red-500">{stat.inactive}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-blue-600">{stat.active}</span>
              </p>
            ) : stat.isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-500">جاري التحميل...</span>
              </div>
            ) : (
              <p className="text-2xl text-color-mode-text-icons-t-blue font-bold">
                {stat.amount}{" "}
                <span className="text-base">{stat.currency || stat.unit}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </section>
  );
};

// Subscription and Locations Section
const SubscriptionAndLocationsSection = () => {
  const { company } = useAuth();

  // Extract current subscription from company data
  const currentSubscription = company?.selectedSubscription;

  // Get subscription details using correct field names:
  // نوع الباقة = periodName (extract Arabic text from object)
  const packageType =
    currentSubscription?.periodName?.ar ||
    currentSubscription?.periodName?.en ||
    (typeof currentSubscription?.periodName === "string"
      ? currentSubscription?.periodName
      : "N/A");

  // عدد المركبات = maxCarNumber (with fallbacks)
  const vehicleCount =
    company?.maxCarNumber ||
    company?.numberOfVehicles ||
    company?.vehicleCount ||
    company?.carsLimit ||
    currentSubscription?.maxCarNumber ||
    0;

  // اسم الباقة
  const packageName =
    currentSubscription?.title?.ar || currentSubscription?.title?.en || "N/A";

  // Calculate days remaining using createdDate + periodValueInDays
  const calculateDaysRemaining = () => {
    const createdDate = currentSubscription?.createdDate;
    const periodValueInDays = currentSubscription?.periodValueInDays;

    if (!createdDate || !periodValueInDays) return 0;

    try {
      const startDate = createdDate.toDate
        ? createdDate.toDate()
        : new Date(createdDate);
      const expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + periodValueInDays);

      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      return 0;
    }
  };

  const daysRemaining = calculateDaysRemaining();

  console.log("\n📅 Dashboard Subscription Data:");
  console.log("==============================");
  console.log("Company:", company?.name);
  console.log("Company Data - Checking all possible vehicle count fields:");
  console.log("  maxCarNumber:", company?.maxCarNumber);
  console.log("  numberOfVehicles:", company?.numberOfVehicles);
  console.log("  vehicleCount:", company?.vehicleCount);
  console.log("  carsLimit:", company?.carsLimit);
  console.log(
    "  selectedSubscription.maxCarNumber:",
    currentSubscription?.maxCarNumber
  );
  console.log("Final Vehicle Count:", vehicleCount);
  console.log("Period Name:", currentSubscription?.periodName);
  console.log("Package Type (extracted):", packageType);
  console.log("Package Name:", packageName);
  console.log("Created Date:", currentSubscription?.createdDate);
  console.log("Period Value in Days:", currentSubscription?.periodValueInDays);
  console.log("Days Remaining:", daysRemaining);
  console.log("==============================\n");

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Subscription Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg lg:col-span-1">
        {/* Main Title */}
        <div className="text-right mb-6">
          <h3 className="text-lg font-bold text-purple-800 [direction:rtl] text-right">
            اشتراكي الحالي
          </h3>
        </div>

        {/* Two Information Boxes */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Package Type Box */}
          <div className="bg-yellow-50 rounded-lg p-4 shadow-sm text-center">
            <div className="text-lg font-bold text-purple-800 mb-1">
              نوع الباقة
            </div>
            <div className="text-xs text-purple-800">{packageType}</div>
          </div>

          {/* Number of Vehicles Box */}
          <div className="bg-yellow-50 rounded-lg p-4 shadow-sm text-center">
            <div className="text-lg font-bold text-purple-800 mb-1">
              عدد المركبات
            </div>
            <div className="text-xs text-purple-800">{vehicleCount}</div>
          </div>
        </div>

        {/* Explanatory Text */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-2 text-orange-500">
            <div className="w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            <span className="text-xs text-center [direction:rtl]">
              نوع الاشتراك يُحدد تلقائياً وفقاً لعدد المركبات.
            </span>
          </div>
        </div>

        {/* Remaining Days Section */}
        <div className="text-center">
          <div className="text-sm text-purple-800 mb-3 [direction:rtl] text-center">
            الأيام المتبقية من الاشتراك
          </div>

          {/* Countdown Numbers */}
          <div className="text-2xl font-bold text-orange-500 mb-2 [direction:rtl] text-center">
            {daysRemaining} يوم
          </div>

          {/* Package Name */}
          <div className="text-sm text-gray-600 mt-2 [direction:rtl] text-center">
            {packageName}
          </div>
        </div>
      </div>

      {/* Station Locations Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm lg:col-span-2 overflow-hidden">
        <Map />
      </div>
    </section>
  );
};

// Consumption Section
const ConsumptionSection = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("اخر 12 شهر");
  const [activeLegendIndex, setActiveLegendIndex] = useState<number | null>(
    null
  );
  const [salesTrends, setSalesTrends] =
    useState<EssentialCategorySalesTrends | null>(null);
  const [isLoadingSales, setIsLoadingSales] = useState<boolean>(true);
  const [salesError, setSalesError] = useState<string | null>(null);

  const defaultMonthLabels = useMemo(
    () => [
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoadingSales(true);
        const result = await getCompanyEssentialCategorySalesTrends();
        if (cancelled) {
          return;
        }
        setSalesTrends(result);
        setSalesError(null);
      } catch (error) {
        console.error(
          "❌ Failed to load company essential category sales trends:",
          error
        );
        if (!cancelled) {
          setSalesTrends(null);
          setSalesError("تعذر تحميل بيانات المشتريات الخاصة بالشركة.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSales(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayedSeries: EssentialCategoryTimeseries | null = useMemo(() => {
    if (!salesTrends) return null;

    if (selectedPeriod === "اخر اسبوع") {
      return salesTrends.last7Days;
    }

    if (selectedPeriod === "اخر 30 يوم") {
      return salesTrends.last30Days;
    }

    if (selectedPeriod === "اخر 6 شهور") {
      const labels = salesTrends.last12Months.labels.slice(-6);
      const datasets = salesTrends.last12Months.datasets.map((dataset) => ({
        ...dataset,
        data: dataset.data.slice(-6),
      }));
      return { labels, datasets };
    }

    return salesTrends.last12Months;
  }, [salesTrends, selectedPeriod]);

  const essentialColors: Record<EssentialCategoryKey, string> = useMemo(
    () => ({
      batteries: "rgb(0, 200, 80)",
      wheels: "rgb(231, 101, 0)",
      oils: "rgb(91, 115, 139)",
      fuels: "rgb(238, 57, 57)",
      carCare: "rgb(90, 102, 193)",
    }),
    []
  );

  const chartDatasets = useMemo(() => {
    if (!displayedSeries) return [];

    return displayedSeries.datasets.map((dataset) => {
      const color = essentialColors[dataset.key] ?? "rgb(148, 163, 184)";

      return {
        label: dataset.label,
        color,
        data: dataset.data.map((value) =>
          Number.isFinite(value) ? Number(value) : 0
        ),
      };
    });
  }, [displayedSeries, essentialColors]);

  useEffect(() => {
    if (
      activeLegendIndex !== null &&
      (chartDatasets.length === 0 ||
        activeLegendIndex < 0 ||
        activeLegendIndex >= chartDatasets.length)
    ) {
      setActiveLegendIndex(null);
    }
  }, [activeLegendIndex, chartDatasets.length]);

  const legendItems = useMemo(
    () =>
      chartDatasets.map((dataset, index) => ({
        text: dataset.label,
        color: dataset.color,
        index,
      })),
    [chartDatasets]
  );

  const chartLabels = useMemo(() => {
    if (displayedSeries?.labels && displayedSeries.labels.length) {
      return displayedSeries.labels;
    }
    return defaultMonthLabels;
  }, [displayedSeries?.labels, defaultMonthLabels]);

  const hasData = useMemo(
    () =>
      chartDatasets.some((dataset) =>
        dataset.data.some((value) => Math.abs(value) > 0)
      ),
    [chartDatasets]
  );

  return (
    <section className="mb-8">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {/* First Row - Title and Time Periods on Right, Legend on Left */}
        <div className="flex items-center justify-between mb-6">
          {/* Legend - Left */}
          <div className="flex items-center">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              {legendItems.map((item) => {
                const isActive =
                  activeLegendIndex === null || activeLegendIndex === item.index;

                return (
                  <button
                    key={item.index}
                    type="button"
                    onMouseEnter={() => setActiveLegendIndex(item.index)}
                    onMouseLeave={() => setActiveLegendIndex(null)}
                    onFocus={() => setActiveLegendIndex(item.index)}
                    onBlur={() => setActiveLegendIndex(null)}
                    className="inline-flex items-center gap-2 rounded-lg border border-transparent px-3 py-1 text-xs font-bold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      color: item.color,
                      opacity: isActive ? 1 : 0.4,
                      backgroundColor: isActive
                        ? "rgba(148, 163, 184, 0.12)"
                        : "transparent",
                    }}
                    title={`تسليط الضوء على ${item.text}`}
                  >
                    <span className="[font-family:'Tajawal',Helvetica] [direction:rtl]">
                      {item.text}
                    </span>
                    <span
                      className="h-2 w-2 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title and Time Periods - Right */}
          <div className="flex items-center gap-4">
            {/* Time Period Filter */}
            <TimeFilter
              selectedFilter={selectedPeriod}
              onFilterChange={setSelectedPeriod}
              filters={["اخر اسبوع", "اخر 30 يوم", "اخر 6 شهور", "اخر 12 شهر"]}
            />

            {/* Title */}
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--form-section-title-color)]">
                المشتريات
              </h2>
              <Fuel className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Second Row - Chart */}
        <div className="w-full">
          {salesError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {salesError}
            </div>
          )}
          <div className="relative w-full">
            {isLoadingSales ? (
              <div className="flex h-[260px] items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : hasData ? (
              <LegendHighlightLineChart
                labels={chartLabels}
                datasets={chartDatasets}
                height={260}
                showLegend={false}
                activeDatasetIndex={activeLegendIndex}
                onActiveDatasetIndexChange={setActiveLegendIndex}
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
                                maximumFractionDigits: 2,
                              })
                            : value?.toString() ?? "",
                      },
                    },
                  },
                }}
                tooltipFormatter={(datasetLabel, value) =>
                  `${datasetLabel}: ${value.toLocaleString("ar-SA", {
                    maximumFractionDigits: 2,
                  })}`
                }
              />
            ) : (
              <div className="flex h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
                لا توجد بيانات مبيعات للفترة المحددة.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// Fuel Delivery Requests Section
const FuelDeliveryRequestsSection = () => {
  const [deliveryStats, setDeliveryStats] = useState<{
    completed: number;
    cancelled: number;
    total: number;
    completionPercentage: number;
  }>({ completed: 0, cancelled: 0, total: 0, completionPercentage: 0 });

  useEffect(() => {
    const loadDeliveryStats = async () => {
      try {
        const orders = await fetchOrders();

        // Filter for fuel delivery orders
        const fuelDeliveryOrders = orders.filter((order) => {
          const titleAr = order.service?.title?.ar || "";
          const titleEn = order.service?.title?.en || "";
          const descAr = order.service?.desc?.ar || "";
          const descEn = order.service?.desc?.en || "";

          return (
            titleAr === "توصيل الوقود" ||
            titleEn === "Fuel Delivery" ||
            descAr === "عند الطلب وفي أي وقت وفي أي مكان" ||
            descEn === "On-demand, anytime anywhere."
          );
        });

        // Count completed and cancelled
        let completed = 0;
        let cancelled = 0;

        fuelDeliveryOrders.forEach((order) => {
          const status = order.status?.toLowerCase().trim() || "";

          if (
            status === "completed" ||
            status === "done" ||
            status === "delivered" ||
            status === "مكتمل" ||
            status === "تم التوصيل"
          ) {
            completed++;
          } else if (
            status === "cancelled" ||
            status === "canceled" ||
            status === "rejected" ||
            status === "ملغي" ||
            status === "مرفوض"
          ) {
            cancelled++;
          }
        });

        const total = fuelDeliveryOrders.length;
        const completionPercentage =
          total > 0 ? Math.round((completed / total) * 100) : 0;

        console.log("\n⛽ Fuel Delivery Requests Stats:");
        console.log("========================");
        console.log("Total Fuel Delivery Orders:", total);
        console.log("Completed:", completed);
        console.log("Cancelled:", cancelled);
        console.log("Completion Rate:", completionPercentage + "%");
        console.log("========================\n");

        setDeliveryStats({
          completed,
          cancelled,
          total,
          completionPercentage,
        });
      } catch (error) {
        console.error("Error loading delivery stats:", error);
      }
    };

    loadDeliveryStats();
  }, []);

  // Calculate stroke-dasharray for the progress circle
  // Circle circumference = 2 * π * r = 2 * 3.14159 * 45 ≈ 283
  const circumference = 283;
  const progressLength =
    (deliveryStats.completionPercentage / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="text-sm text-gray-600 [direction:rtl] text-right">
          المكتملة {deliveryStats.completed} / الملغية {deliveryStats.cancelled}
        </div>
        <h3 className="text-xl font-bold text-gray-800 [direction:rtl] text-right">
          طلبات توصيل الوقود
        </h3>
      </div>

      {/* Donut Chart */}
      <div className="flex justify-center items-center">
        <div className="relative w-48 h-48">
          {/* Background Circle */}
          <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="6"
            />
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#5A66C1"
              strokeWidth="6"
              strokeDasharray={`${progressLength} ${circumference}`}
              strokeLinecap="round"
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-base text-gray-500 mb-1 [direction:rtl]">
              الطلبات المكتملة
            </div>
            <div className="text-4xl font-bold text-gray-900">
              {deliveryStats.completionPercentage}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// My Cars Section
const MyCarsSection = () => {
  const [carsData, setCarsData] = useState<{
    total: number;
    categories: Array<{ name: string; count: number }>;
  }>({ total: 0, categories: [] });

  useEffect(() => {
    const loadCarsData = async () => {
      try {
        const carStats = await calculateCarStatistics();

        console.log("\n🚗 My Cars Section Data:");
        console.log("========================");
        console.log("Total Cars:", carStats.total);
        console.log("By Size:", carStats.sizes);
        console.log("========================\n");

        // Map size names to full names for display
        const categories = carStats.sizes.map((size) => {
          let fullName = "";
          switch (size.name) {
            case "صغيرة":
              fullName = "سيارات صغيرة";
              break;
            case "متوسطة":
              fullName = "سيارات متوسطة";
              break;
            case "كبيرة":
              fullName = "سيارات كبيرة";
              break;
            case "VIP":
              fullName = "سيارات VIP";
              break;
            default:
              fullName = `سيارات ${size.name}`;
          }
          return {
            name: fullName,
            count: size.count,
          };
        });

        setCarsData({
          total: carStats.total,
          categories: categories,
        });
      } catch (error) {
        console.error("Error loading cars data:", error);
      }
    };

    loadCarsData();
  }, []);

  const carCategories =
    carsData.categories.length > 0
      ? carsData.categories
      : [
          { name: "سيارات صغيرة", count: 0 },
          { name: "سيارات متوسطة", count: 0 },
          { name: "سيارات كبيرة", count: 0 },
          { name: "سيارات VIP", count: 0 },
        ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="text-sm text-gray-600 [direction:rtl] text-right">
          اجمالي السيارات {carsData.total}
        </div>
        <h3 className="text-xl font-bold text-gray-800 [direction:rtl] text-right">
          سياراتي
        </h3>
      </div>

      {/* Car Categories */}
      <div className="space-y-6">
        {carCategories.map((category, index) => {
          const percentage =
            carsData.total > 0 ? (category.count / carsData.total) * 100 : 0;
          return (
            <div key={index} className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 [direction:rtl]">
                  {carsData.total}/{category.count}
                </span>
                <span className="text-sm font-medium text-gray-900 [direction:rtl]">
                  {category.name}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 flex justify-end">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: "#5A66C1",
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Fuel Consumption by Cities Section
const FuelConsumptionByCitiesSection = () => {
  const { addToast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState("اخر 12 شهر");
  const [citiesData, setCitiesData] = useState<
    Array<{ name: string; consumption: number; stationCount?: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  // Fetch cities data from Firestore
  useEffect(() => {
    const loadCitiesData = async () => {
      try {
        setLoading(true);
        const data = await calculateFuelConsumptionByCities();
        setCitiesData(data);
      } catch (error) {
        console.error("Error loading cities data:", error);
        addToast({
          title: "خطأ",
          message: "فشل في تحميل بيانات المدن",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCitiesData();
  }, [addToast]);

  const maxConsumption =
    citiesData.length > 0
      ? Math.max(...citiesData.map((city) => city.consumption))
      : 0;

  // Handle export
  const handleExport = async () => {
    try {
      const exportColumns = [
        { key: "name", label: "المدينة" },
        { key: "consumption", label: "الاستهلاك (لتر)" },
      ];

      await exportDataTable(
        citiesData,
        exportColumns,
        "fuel-consumption-by-cities",
        "excel",
        "استهلاك الوقود للمدن"
      );

      addToast({
        title: "نجح التصدير",
        message: "تم تصدير بيانات استهلاك الوقود بنجاح",
        type: "success",
      });
    } catch (error) {
      console.error("Export error:", error);
      addToast({
        title: "فشل التصدير",
        message: "حدث خطأ أثناء تصدير البيانات",
        type: "error",
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium [direction:rtl]">تصدير</span>
          </button>
          <TimeFilter
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            filters={["اخر اسبوع", "اخر 30 يوم", "اخر 6 شهور", "اخر 12 شهر"]}
          />
        </div>
        <h3 className="text-xl font-bold text-gray-800 [direction:rtl] text-right">
          استهلاك الوقود للمدن
        </h3>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 [direction:rtl]">
              جاري تحميل البيانات...
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && citiesData.length === 0 && (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 [direction:rtl] text-lg font-medium">
              لا توجد بيانات لعرضها
            </p>
            <p className="text-gray-500 [direction:rtl] text-sm mt-2">
              لم يتم العثور على استهلاك وقود في أي مدينة
            </p>
          </div>
        </div>
      )}

      {/* Bar Chart */}
      {!loading && citiesData.length > 0 && (
        <div className="h-80 flex items-end justify-between gap-1">
          {citiesData.map((city, index) => {
            const height =
              maxConsumption > 0
                ? (city.consumption / maxConsumption) * 100
                : 0;
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                {/* Litres Consumed - On Top */}
                <div
                  className="text-xs font-bold text-gray-700 [direction:rtl] text-center mb-2"
                  style={{ minHeight: "20px" }}
                >
                  {city.consumption.toFixed(1)} .L
                </div>

                {/* Bar */}
                <div className="relative w-6 mb-3">
                  <div
                    className="w-full bg-gray-100 rounded-full"
                    style={{ height: "220px" }}
                  >
                    <div
                      className="w-full rounded-full transition-all duration-700 hover:opacity-80"
                      style={{
                        height: `${height}%`,
                        position: "absolute",
                        bottom: 0,
                        backgroundColor: "#5A66C1",
                      }}
                      title={`${city.name}: ${city.consumption.toFixed(1)} لتر`}
                    ></div>
                  </div>
                </div>

                {/* City Name - At Bottom */}
                <div
                  className="text-xs text-gray-600 [direction:rtl] text-center font-medium max-w-[60px] truncate"
                  title={city.name}
                >
                  {city.name}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Most Used Stations and Drivers Section
const MostUsedSection = () => {
  const [topDrivers, setTopDrivers] = useState<any[]>([]);
  const [topStations, setTopStations] = useState<any[]>([]);

  useEffect(() => {
    const loadTopData = async () => {
      try {
        const orders = await fetchOrders();

        // Group orders by driver and calculate total fuel consumption and cost
        const driverConsumption: Record<
          string,
          {
            name: string;
            phone: string;
            totalFuel: number;
            totalCost: number;
            fuelType: string;
          }
        > = {};

        // Group orders by station and calculate usage
        const stationUsage: Record<
          string,
          {
            name: string;
            address: string;
            totalFuel: number;
            totalPrice: number;
            fuelType: string;
          }
        > = {};

        orders.forEach((order) => {
          // Process drivers
          const driverName = order.assignedDriver?.name;
          const driverPhone =
            order.assignedDriver?.phoneNumber ||
            order.assignedDriver?.phone ||
            "N/A";

          if (driverName) {
            if (!driverConsumption[driverName]) {
              driverConsumption[driverName] = {
                name: driverName,
                phone: driverPhone,
                totalFuel: 0,
                totalCost: 0,
                fuelType: "",
              };
            }

            // Add fuel litres
            const fuel = parseFloat(order.totalLitre || order.quantity || 0);
            driverConsumption[driverName].totalFuel += fuel;

            // Add cost
            const cost = parseFloat(order.totalPrice || 0);
            driverConsumption[driverName].totalCost += cost;

            // Get fuel type (use the most common one)
            const fuelType =
              order.selectedOption?.name?.ar ||
              order.selectedOption?.label ||
              order.service?.title?.ar ||
              "وقود";
            if (!driverConsumption[driverName].fuelType) {
              driverConsumption[driverName].fuelType = fuelType;
            }
          }

          // Process stations
          const stationName = order.carStation?.name || order.station?.name;
          const stationAddress =
            order.carStation?.address ||
            order.carStation?.formattedLocation?.address?.formatted ||
            order.station?.address ||
            "N/A";

          if (stationName) {
            if (!stationUsage[stationName]) {
              stationUsage[stationName] = {
                name: stationName,
                address:
                  typeof stationAddress === "string" ? stationAddress : "N/A",
                totalFuel: 0,
                totalPrice: 0,
                fuelType: "",
              };
            }

            // Add fuel litres
            const fuel = parseFloat(order.totalLitre || order.quantity || 0);
            stationUsage[stationName].totalFuel += fuel;

            // Add price
            const price = parseFloat(order.totalPrice || 0);
            stationUsage[stationName].totalPrice += price;

            // Get fuel type
            const fuelType =
              order.selectedOption?.name?.ar ||
              order.selectedOption?.label ||
              order.service?.title?.ar ||
              "وقود";
            if (!stationUsage[stationName].fuelType) {
              stationUsage[stationName].fuelType = fuelType;
            }
          }
        });

        // Convert to array and sort by total cost (descending)
        const sortedDrivers = Object.values(driverConsumption)
          .sort((a, b) => b.totalCost - a.totalCost)
          .slice(0, 5); // Top 5 drivers

        console.log("\n👥 Top 5 Most Consuming Drivers:");
        console.log("========================");
        sortedDrivers.forEach((driver, index) => {
          console.log(`Driver ${index + 1}:`, {
            name: driver.name,
            totalFuel: Math.round(driver.totalFuel),
            totalCost: Math.round(driver.totalCost),
            fuelType: driver.fuelType,
          });
        });
        console.log("========================\n");

        // Transform drivers to table format
        const transformedDrivers = sortedDrivers.map((driver) => ({
          name: driver.name,
          phone: driver.phone,
          cost: Math.round(driver.totalCost),
          fuel: Math.round(driver.totalFuel).toString(),
          type: driver.fuelType,
        }));

        setTopDrivers(transformedDrivers);

        // Sort stations by total price (descending)
        const sortedStations = Object.values(stationUsage)
          .sort((a, b) => b.totalPrice - a.totalPrice)
          .slice(0, 5); // Top 5 stations

        console.log("\n⛽ Top 5 Most Used Stations:");
        console.log("========================");
        sortedStations.forEach((station, index) => {
          console.log(`Station ${index + 1}:`, {
            name: station.name,
            address: station.address,
            totalFuel: Math.round(station.totalFuel),
            totalPrice: Math.round(station.totalPrice),
            fuelType: station.fuelType,
          });
        });
        console.log("========================\n");

        // Transform stations to table format
        const transformedStations = sortedStations.map((station) => ({
          name: station.name,
          address: station.address,
          price: Math.round(station.totalPrice),
          fuel: Math.round(station.totalFuel).toString(),
          type: station.fuelType,
        }));

        setTopStations(transformedStations);
      } catch (error) {
        console.error("Error loading top data:", error);
      }
    };

    loadTopData();
  }, []);

  const stationsData = topStations;
  const driversData = topDrivers;

  // Table columns for stations
  const stationsColumns = [
    {
      key: "fuel",
      label: "الوقود",
      width: "min-w-[100px]",
      render: (value: any, station: any) => (
        <div className="text-right">
          <div className="font-medium text-orange-500">
            {station?.fuel || "N/A"}
          </div>
          <div className="text-gray-500">{station?.type || "N/A"}</div>
        </div>
      ),
    },
    {
      key: "price",
      label: "السعر",
      width: "min-w-[100px]",
      render: (value: any, station: any) => (
        <div className="text-right">
          <div className="font-medium text-blue-600">
            {station?.price || "N/A"}
          </div>
          <div className="text-gray-500">ر.س</div>
        </div>
      ),
    },
    {
      key: "station",
      label: "المحطة",
      width: "min-w-[200px]",
      render: (value: any, station: any) => (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-medium text-gray-800 [direction:rtl] text-right">
              {station?.name || "N/A"}
            </div>
            <div className="text-sm text-gray-500 [direction:rtl] text-right">
              {station?.address || "N/A"}
            </div>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <Fuel className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      ),
    },
  ];

  // Table columns for drivers
  const driversColumns = [
    {
      key: "fuel",
      label: "الوقود",
      width: "min-w-[100px]",
      render: (value: any, driver: any) => (
        <div className="text-right">
          <div className="font-medium text-orange-500">
            {driver?.fuel || "N/A"}
          </div>
          <div className="text-gray-500">{driver?.type || "N/A"}</div>
        </div>
      ),
    },
    {
      key: "cost",
      label: "التكلفة",
      width: "min-w-[100px]",
      render: (value: any, driver: any) => (
        <div className="text-right">
          <div className="font-medium text-blue-600">
            {driver?.cost || "N/A"}
          </div>
          <div className="text-gray-500">ر.س</div>
        </div>
      ),
    },
    {
      key: "driver",
      label: "السائق",
      width: "min-w-[200px]",
      render: (value: any, driver: any) => (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-medium text-gray-800 [direction:rtl] text-right">
              {driver?.name || "N/A"}
            </div>
            <div className="text-sm text-gray-500 [direction:rtl] text-right">
              {driver?.phone || "N/A"}
            </div>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Most Used Stations */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="mb-6">
          <div className="flex justify-end">
            <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
              <h3 className="mt-[-1.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] relative font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]">
                المحطات الأكثر استخداما
              </h3>
              <Fuel className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>

        <Table columns={stationsColumns} data={stationsData} className="mb-4" />
      </div>

      {/* Most Consuming Drivers */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="mb-6">
          <div className="flex justify-end">
            <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
              <h3 className="mt-[-1.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] relative font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]">
                السائقين الأكثر استهلاكا
              </h3>
              <Users className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>

        <Table columns={driversColumns} data={driversData} className="mb-4" />
      </div>
    </section>
  );
};

// Latest Orders Table
const LatestOrdersSection = () => {
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const { goTo } = useNavigation();

  useEffect(() => {
    const loadRecentOrders = async () => {
      try {
        const orders = await fetchOrders();

        // Sort by createdDate (most recent first) and take top 5
        const sortedOrders = orders
          .sort((a, b) => {
            const dateA = a.createdDate?.toDate
              ? a.createdDate.toDate()
              : new Date(a.createdDate || 0);
            const dateB = b.createdDate?.toDate
              ? b.createdDate.toDate()
              : new Date(b.createdDate || 0);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5);

        console.log("\n📋 Latest Orders (Top 5):");
        console.log("========================");
        sortedOrders.forEach((order, index) => {
          console.log(`Order ${index + 1}:`, {
            id: order.id,
            date: order.createdDate,
            driver: order.assignedDriver?.name,
            type: order.service?.title?.ar || order.selectedOption?.name?.ar,
            value: order.totalPrice,
          });
        });
        console.log("========================\n");

        // Transform orders to table format with cumulative totals
        let cumulativeTotal = 0;
        const transformedOrders = sortedOrders.map((order) => {
          const value = parseFloat(order.totalPrice) || 0;
          cumulativeTotal += value;

          // Format date
          let formattedDate = "N/A";
          if (order.createdDate) {
            const date = order.createdDate?.toDate
              ? order.createdDate.toDate()
              : new Date(order.createdDate);
            formattedDate = new Intl.DateTimeFormat("ar-SA", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(date);
          }

          return {
            code: order.id || order.refId || "N/A",
            type:
              order.service?.title?.ar ||
              order.selectedOption?.name?.ar ||
              order.selectedOption?.label ||
              order.service?.title?.en ||
              "منتج",
            driver: order.assignedDriver?.name || "--",
            date: formattedDate,
            value: Math.round(value).toString(),
            cumulative: Math.round(cumulativeTotal).toString(),
          };
        });

        setRecentOrders(transformedOrders);
      } catch (error) {
        console.error("Error loading recent orders:", error);
      }
    };

    loadRecentOrders();
  }, []);

  const ordersData = recentOrders;

  // Table columns for orders
  const ordersColumns = [
    {
      key: "cumulative",
      label: "تراكمي العمليات (ر.س)",
      width: "min-w-[150px]",
      render: (value: any, order: any) => (
        <div className="text-right text-sm text-gray-800 [direction:rtl]">
          {order?.cumulative || "N/A"}
        </div>
      ),
    },
    {
      key: "value",
      label: "قيمة العملية",
      width: "min-w-[100px]",
      render: (value: any, order: any) => (
        <div className="text-right text-sm text-gray-800 [direction:rtl]">
          {order?.value || "N/A"}
        </div>
      ),
    },
    {
      key: "date",
      label: "تاريخ العملية",
      width: "min-w-[150px]",
      render: (value: any, order: any) => (
        <div className="text-right text-sm text-gray-800 [direction:rtl]">
          {order?.date || "N/A"}
        </div>
      ),
    },
    {
      key: "driver",
      label: "اسم السائق",
      width: "min-w-[120px]",
      render: (value: any, order: any) => (
        <div className="text-right text-sm text-gray-800 [direction:rtl]">
          {order?.driver || "N/A"}
        </div>
      ),
    },
    {
      key: "type",
      label: "نوع العملية",
      width: "min-w-[120px]",
      render: (value: any, order: any) => (
        <div className="text-right text-sm text-gray-800 [direction:rtl]">
          {order?.type || "N/A"}
        </div>
      ),
    },
    {
      key: "code",
      label: "كود العملية",
      width: "min-w-[120px]",
      render: (value: any, order: any) => (
        <div className="text-right text-sm text-gray-800 [direction:rtl]">
          {order?.code || "N/A"}
        </div>
      ),
    },
  ];

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => goTo(ROUTES.WALLET)}
          className="flex items-center gap-2 px-3 py-2 border border-gray-500 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium [direction:rtl]">
            عرض المزيد
          </span>
        </button>
        <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
          <h3 className="mt-[-1.00px] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] relative font-subtitle-subtitle-2 whitespace-nowrap [font-style:var(--subtitle-subtitle-2-font-style)]">
            أحدث الطلبات
          </h3>
          <FileText className="w-5 h-5 text-gray-500" />
        </div>
      </div>

      <Table columns={ordersColumns} data={ordersData} className="mb-4" />
    </section>
  );
};

// Main Dashboard Component
export const ComprehensiveDashboard = (): JSX.Element => {
  return (
    <div className="space-y-8">
      {/* Banner Section */}
      <BannerSection />

      {/* All Cards - 4 rows of 3 cards each */}
      <StatsCardsSection />

      {/* Subscription and Locations */}
      <SubscriptionAndLocationsSection />

      {/* Consumption Section */}
      <ConsumptionSection />

      {/* New Dashboard Sections */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <FuelDeliveryRequestsSection />
        <MyCarsSection />
      </section>

      {/* Fuel Consumption by Cities */}
      <FuelConsumptionByCitiesSection />

      {/* Most Used Section */}
      <MostUsedSection />

      {/* Latest Orders */}
      <LatestOrdersSection />
    </div>
  );
};
