import { useState, useEffect, useMemo } from "react";
// import { useOutletContext } from "react-router-dom"; // Uncomment when using search functionality
import {
  LegendHighlightLineChart,
  Spinner,
  Table,
  TimeFilter,
} from "../../components/shared";
import { Fuel, Download } from "lucide-react";
import MostUsedSection from "./MostUsedSection";
import StatsCardsSection, {
  FuelUsageData,
  FuelCostData,
  CarWashData,
  UsersData,
  CompaniesData,
} from "./StatsCardsSection";
import { statsData, defaultSelectedOptions } from "./statsData";
import { Map } from "../../screens/PerolifeStationLocations/sections/map/Map";
import {
  getTotalClientsBalance,
  getTotalFuelUsageByType,
  getTotalFuelCostByType,
  getCarWashOperationsBySize,
  getTotalUsersByType,
  getCompaniesCountByType,
  getTireChangeOperationsBySize,
  getOilChangeOperationsBySize,
  getMostConsumingCompanies,
  getMostConsumingClients,
  getMostUsedStations,
  getLatestOrders,
  getEssentialCategorySalesTrends,
  EssentialCategorySalesTrends,
  EssentialCategoryTimeseries,
  EssentialCategoryKey,
} from "../../services/firestore";

// Context type for outlet (uncomment when using search functionality)
// interface OutletContextType {
//   searchQuery: string;
//   setSearchQuery: (query: string) => void;
// }

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
        const result = await getEssentialCategorySalesTrends();
        if (cancelled) {
          return;
        }
        setSalesTrends(result);
        setSalesError(null);
      } catch (error) {
        console.error("❌ Failed to load essential category sales trends:", error);
        if (!cancelled) {
          setSalesTrends(null);
          setSalesError("تعذر تحميل بيانات المبيعات من قاعدة البيانات.");
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
      <div className="bg-[var(--surface-card)] rounded-xl border border-[color:var(--border-subtle)] p-6 shadow-sm transition-colors duration-300">
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
            {/* Time Filter with Calendar Icon */}
            <TimeFilter
              selectedFilter={selectedPeriod}
              onFilterChange={setSelectedPeriod}
              filters={["اخر اسبوع", "اخر 30 يوم", "اخر 6 شهور", "اخر 12 شهر"]}
              showCalendar={true}
            />

            {/* Title */}
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--form-section-title-color)]">
                المبيعات
              </h2>
              <Fuel className="w-5 h-5 text-color-mode-text-icons-t-blue" />
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
              <div className="flex h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--border-subtle)] bg-[var(--surface-control)] text-sm text-[var(--text-secondary)]">
                لا توجد بيانات مبيعات للفترة المحددة.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// Fuel Delivery Requests Section (Currently unused - uncomment when needed)
// const FuelDeliveryRequestsSection = () => {
//   return (
//     <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//       <div className="flex items-center justify-between mb-8">
//         <div className="text-sm text-gray-600 [direction:rtl] text-right">
//           المكتملة 20 / الملغية 22
//         </div>
//         <h3 className="text-xl font-bold text-gray-800 [direction:rtl] text-right">
//           طلبات توصيل الوقود
//         </h3>
//       </div>

//       {/* Donut Chart */}
//       <div className="flex justify-center items-center">
//         <div className="relative w-48 h-48">
//           {/* Background Circle */}
//           <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
//             <circle
//               cx="50"
//               cy="50"
//               r="45"
//               fill="none"
//               stroke="#f1f5f9"
//               strokeWidth="6"
//             />
//             {/* Progress Circle */}
//             <circle
//               cx="50"
//               cy="50"
//               r="45"
//               fill="none"
//               stroke="#5A66C1"
//               strokeWidth="6"
//               strokeDasharray={`${49 * 2.83} 283`}
//               strokeLinecap="round"
//             />
//           </svg>

//           {/* Center Text */}
//           <div className="absolute inset-0 flex flex-col items-center justify-center">
//             <div className="text-base text-gray-500 mb-1 [direction:rtl]">
//               الطلبات المكتملة
//             </div>
//             <div className="text-4xl font-bold text-gray-900">49%</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// My Cars Section
const MyCarsSection = () => {
  const carCategories = [
    { name: "طللبات غسيل السيارات", count: 100, total: 200 },
    { name: "طلبات الوقود", count: 50, total: 200 },
    { name: "طلبات تغيير الزيوت", count: 20, total: 200 },
    { name: "طلبات تغيير الاطارات", count: 15, total: 200 },
    { name: "طلبات تغيير البطاريات", count: 15, total: 200 },
  ];

  const colors = [
    "var(--color-mode-text-icons-t-blue)",
    "#EE3939",
    "var(--text-secondary)",
    "#E76500",
    "#00C950",
  ];

  return (
    <div className="bg-[var(--surface-card)] rounded-xl border border-[color:var(--border-strong)] p-6 shadow-lg transition-colors duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="text-[16px] font-normal text-[var(--text-secondary)] [direction:rtl] text-right transition-colors duration-300">
          اجمالي طلبات التوصيل 200
        </div>
        <h3 className="text-xl font-bold text-color-mode-text-icons-t-blue [direction:rtl] text-right transition-colors duration-300">
          تقرير طلبات التوصيل
        </h3>
      </div>

      {/* Car Categories */}
      <div className="space-y-6">
        {carCategories.map((category, index) => {
          const percentage = (category.count / category.total) * 100;
          return (
            <div key={index} className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[var(--text-primary)] [direction:rtl] transition-colors duration-300">
                  {category.total}/{category.count}
                </span>
                <span className="text-sm font-normal text-[var(--text-secondary)] [direction:rtl] transition-colors duration-300">
                  {category.name}
                </span>
              </div>
              <div className="w-full bg-[var(--surface-control-hover)] rounded-full h-[6px] flex justify-end transition-colors duration-300">
                <div
                  className="h-[6px] rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: colors[index],
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
  const [selectedFilter, setSelectedFilter] = useState("اخر 12 شهر");

  const citiesData = [
    { name: "الرياض", consumption: 15 },
    { name: "جدة", consumption: 70 },
    { name: "مكة", consumption: 45 },
    { name: "الرياض", consumption: 60 },
    { name: "الرياض", consumption: 75 },
    { name: "الرياض", consumption: 80 },
    { name: "الرياض", consumption: 65 },
    { name: "الرياض", consumption: 20 },
    { name: "الرياض", consumption: 85 },
    { name: "الرياض", consumption: 90 },
    { name: "الرياض", consumption: 95 },
  ];

  const maxConsumption = Math.max(
    ...citiesData.map((city) => city.consumption)
  );

  return (
    <div className="bg-[var(--surface-card)] rounded-xl border border-[color:var(--border-subtle)] p-6 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-3 py-2 border border-[color:var(--border-subtle)] bg-[var(--surface-control)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--surface-control-hover)] transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium [direction:rtl]">تصدير</span>
          </button>
          <TimeFilter
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
          />
        </div>
        <h3 className="text-xl font-bold text-color-mode-text-icons-t-blue [direction:rtl] text-right transition-colors duration-300">
          استهلاك الوقود للمدن
        </h3>
      </div>

      {/* Bar Chart */}
      <div className="h-80 flex items-end justify-between gap-1">
        {citiesData.map((city, index) => {
          const height = (city.consumption / maxConsumption) * 100;
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              {/* Bar */}
              <div className="relative w-6 mb-3">
                <div
                  className="w-full bg-[var(--surface-control)] rounded-full transition-colors duration-300"
                  style={{ height: "240px" }}
                >
                  <div
                    className="w-full rounded-full transition-all duration-700"
                    style={{
                      height: `${height}%`,
                      position: "absolute",
                      bottom: 0,
                      backgroundColor: "var(--color-mode-text-icons-t-blue)",
                    }}
                  ></div>
                </div>
              </div>
              {/* City Name */}
              <div className="text-xs text-[var(--text-secondary)] [direction:rtl] text-center font-medium transition-colors duration-300">
                {city.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// stationsData, driversData and companiesData will be fetched from real data

// Latest Orders Table
const LatestOrdersSection = ({
  ordersData,
}: {
  ordersData: {
    code: string;
    client: string;
    service: string;
    litre: string;
    totalCost: string;
    date: string;
    status: string;
  }[];
}) => {
  const [selectedButton, setSelectedButton] = useState(0);

  // Table columns for orders
  const ordersColumns = [
    {
      key: "status",
      label: "حالة الطلب",
      width: "min-w-[150px]",
      render: (_: any, order: any) => (
        <div className="text-right font-medium text-sm rounded-[8px] px-[10px] py-2 text-[#E76500] bg-[#FFFCEC] [direction:rtl]">
          <span className="inline-block w-[6px] h-[6px] rounded-full bg-[#E76500]"></span>{" "}
          {order?.status || "N/A"}
        </div>
      ),
    },
    {
      key: "date",
      label: "تاريخ العملية",
      width: "min-w-[150px]",
      render: (_: any, order: any) => (
        <div className="text-right text-sm text-[var(--text-primary)] [direction:rtl] transition-colors duration-300">
          {order?.date || "N/A"}
        </div>
      ),
    },
    {
      key: "totalCost",
      label: "السعر الكلي",
      width: "min-w-[100px]",
      render: (_: any, order: any) => (
        <div className="text-right text-sm text-[var(--text-primary)] [direction:rtl] transition-colors duration-300">
          {order?.totalCost || "N/A"}
        </div>
      ),
    },
    {
      key: "litre",
      label: "اجمالي اللترات",
      width: "min-w-[100px]",
      render: (_: any, order: any) => (
        <div className="text-right text-sm text-[var(--text-primary)] [direction:rtl] transition-colors duration-300">
          {order?.litre || "N/A"}
        </div>
      ),
    },
    {
      key: "service",
      label: "الخدمة",
      width: "min-w-[100px]",
      render: (_: any, order: any) => (
        <div className="text-right text-sm text-[var(--text-primary)] [direction:rtl] transition-colors duration-300">
          {order?.service || "N/A"}
        </div>
      ),
    },
    {
      key: "client",
      label: "اسم العميل",
      width: "min-w-[100px]",
      render: (_: any, order: any) => (
        <div className="text-right text-sm text-[var(--text-primary)] [direction:rtl] transition-colors duration-300">
          {order?.client || "N/A"}
        </div>
      ),
    },
    {
      key: "code",
      label: "الرقم المرجعي",
      width: "min-w-[100px]",
      render: (_: any, order: any) => (
        <div className="text-right text-sm text-[var(--text-primary)] [direction:rtl] transition-colors duration-300">
          {order?.code || "N/A"}
        </div>
      ),
    },
  ];

  return (
    <section className="bg-[var(--surface-card)] rounded-xl border border-[color:var(--border-subtle)] p-6 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <button
          className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-control)] text-color-mode-text-icons-t-blue rounded-lg hover:bg-[var(--surface-control-hover)] transition-colors"
          style={{
            border: "1px solid var(--nav-tab-active-bg)",
          }}
        >
          <span className="text-sm font-medium [direction:rtl] ">
            عرض المزيد
          </span>
        </button>

        <div className="inline-flex items-center gap-[28px] relative flex-[0_0_auto]">
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedButton(0)}
              className="px-[10px] py-1 rounded-[8px] transition-all duration-200 border"
              style={{
                backgroundColor:
                  selectedButton === 0
                    ? "var(--nav-tab-active-bg)"
                    : "var(--surface-control)",
                color:
                  selectedButton === 0
                    ? "var(--nav-tab-active-text)"
                    : "var(--text-secondary)",
                fontSize: "14px",
                fontWeight: "500",
                borderColor: selectedButton === 0
                  ? "transparent"
                  : "var(--border-subtle)",
                cursor: "pointer",
              }}
            >
              محطات الوقود
            </button>
            <button
              onClick={() => setSelectedButton(1)}
              className="px-[10px] py-1 rounded-[8px] transition-all duration-200 border"
              style={{
                backgroundColor:
                  selectedButton === 1
                    ? "var(--nav-tab-active-bg)"
                    : "var(--surface-control)",
                color:
                  selectedButton === 1
                    ? "var(--nav-tab-active-text)"
                    : "var(--text-secondary)",
                fontSize: "14px",
                fontWeight: "500",
                borderColor: selectedButton === 1
                  ? "transparent"
                  : "var(--border-subtle)",
                cursor: "pointer",
              }}
            >
              الشركات
            </button>
          </div>
          <h3 className="mt-[-1.00px] font-[800] text-color-mode-text-icons-t-blue text-[18px] leading-[24px] [direction:rtl] relative whitespace-nowrap transition-colors duration-300">
            أحدث الطلبات
          </h3>
        </div>
      </div>

      <Table columns={ordersColumns} data={ordersData} className="mb-4" />
    </section>
  );
};

// Main Dashboard Component
export const DashboardContent = (): JSX.Element => {
  // Access search query from outlet context if needed
  // Uncomment below when you need to use the search query for filtering
  // const { searchQuery } = useOutletContext<OutletContextType>();
  // console.log("Current search query:", searchQuery);

  // State for total clients wallet balance
  const [totalClientsBalance, setTotalClientsBalance] = useState<
    number | undefined
  >(undefined);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // State for fuel usage data
  const [fuelUsageData, setFuelUsageData] = useState<FuelUsageData>({
    diesel: 0,
    gasoline95: 0,
    gasoline91: 0,
    total: 0,
  });
  const [loadingFuelData, setLoadingFuelData] = useState(true);

  // State for fuel cost data
  const [fuelCostData, setFuelCostData] = useState<FuelCostData>({
    diesel: 0,
    gasoline95: 0,
    gasoline91: 0,
    total: 0,
  });
  const [loadingFuelCostData, setLoadingFuelCostData] = useState(true);

  // State for car wash data
  const [carWashData, setCarWashData] = useState<CarWashData>({
    small: 0,
    medium: 0,
    large: 0,
    vip: 0,
  });
  const [loadingCarWashData, setLoadingCarWashData] = useState(true);

  // State for users data
  const [usersData, setUsersData] = useState<UsersData>({
    supervisors: 0,
    companies: 0,
    individuals: 0,
    serviceProviders: 0,
  });
  const [loadingUsersData, setLoadingUsersData] = useState(true);

  // State for companies count data
  const [companiesCountData, setCompaniesCountData] = useState<CompaniesData>({
    direct: 0,
    viaRepresentatives: 0,
    total: 0,
  });
  const [loadingCompaniesCountData, setLoadingCompaniesCountData] =
    useState(true);

  // State for tire change operations data
  const [tireChangeData, setTireChangeData] = useState<CarWashData>({
    small: 0,
    medium: 0,
    large: 0,
    vip: 0,
  });
  const [loadingTireChangeData, setLoadingTireChangeData] = useState(true);

  // State for oil change operations data
  const [oilChangeData, setOilChangeData] = useState<CarWashData>({
    small: 0,
    medium: 0,
    large: 0,
    vip: 0,
  });
  const [loadingOilChangeData, setLoadingOilChangeData] = useState(true);

  // State for most consuming companies data
  const [companiesData, setCompaniesData] = useState<
    {
      name: string;
      email: string;
      price: number;
      image?: string;
    }[]
  >([]);
  const [loadingCompaniesData, setLoadingCompaniesData] = useState(true);

  // State for most consuming clients data
  const [driversData, setDriversData] = useState<
    {
      name: string;
      email: string;
      price: number;
      image?: string;
    }[]
  >([]);
  const [loadingDriversData, setLoadingDriversData] = useState(true);

  // State for most used stations data
  const [stationsData, setStationsData] = useState<
    {
      name: string;
      email: string;
      price: number;
      image?: string;
    }[]
  >([]);
  const [loadingStationsData, setLoadingStationsData] = useState(true);

  // State for latest orders data
  const [latestOrdersData, setLatestOrdersData] = useState<
    {
      code: string;
      client: string;
      service: string;
      litre: string;
      totalCost: string;
      date: string;
      status: string;
    }[]
  >([]);
  const [loadingLatestOrders, setLoadingLatestOrders] = useState(true);

  // Fetch all dashboard data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingBalance(true);
        setLoadingFuelData(true);
        setLoadingFuelCostData(true);
        setLoadingCarWashData(true);
        setLoadingUsersData(true);
        setLoadingCompaniesCountData(true);
        setLoadingTireChangeData(true);
        setLoadingOilChangeData(true);
        setLoadingCompaniesData(true);
        setLoadingDriversData(true);
        setLoadingStationsData(true);
        setLoadingLatestOrders(true);

        // Fetch all data in parallel
        const [
          balance,
          fuelData,
          fuelCost,
          carWash,
          users,
          companiesCount,
          tireChange,
          oilChange,
          consumingCompanies,
          consumingClients,
          usedStations,
          latestOrders,
        ] = await Promise.all([
          getTotalClientsBalance(),
          getTotalFuelUsageByType(),
          getTotalFuelCostByType(),
          getCarWashOperationsBySize(),
          getTotalUsersByType(),
          getCompaniesCountByType(),
          getTireChangeOperationsBySize(),
          getOilChangeOperationsBySize(),
          getMostConsumingCompanies(),
          getMostConsumingClients(),
          getMostUsedStations(),
          getLatestOrders(),
        ]);

        setTotalClientsBalance(balance);
        setFuelUsageData(fuelData);
        setFuelCostData(fuelCost);
        setCarWashData(carWash);
        setUsersData(users);
        setCompaniesCountData(companiesCount);
        setTireChangeData(tireChange);
        setOilChangeData(oilChange);
        setCompaniesData(consumingCompanies);
        setDriversData(consumingClients);
        setStationsData(usedStations);
        setLatestOrdersData(latestOrders);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setTotalClientsBalance(0);
        setFuelUsageData({
          diesel: 0,
          gasoline95: 0,
          gasoline91: 0,
          total: 0,
        });
        setFuelCostData({
          diesel: 0,
          gasoline95: 0,
          gasoline91: 0,
          total: 0,
        });
        setCarWashData({
          small: 0,
          medium: 0,
          large: 0,
          vip: 0,
        });
        setUsersData({
          supervisors: 0,
          companies: 0,
          individuals: 0,
          serviceProviders: 0,
        });
        setCompaniesCountData({
          direct: 0,
          viaRepresentatives: 0,
          total: 0,
        });
        setTireChangeData({
          small: 0,
          medium: 0,
          large: 0,
          vip: 0,
        });
        setOilChangeData({
          small: 0,
          medium: 0,
          large: 0,
          vip: 0,
        });
        setCompaniesData([]);
        setDriversData([]);
        setStationsData([]);
        setLatestOrdersData([]);
      } finally {
        setLoadingBalance(false);
        setLoadingFuelData(false);
        setLoadingFuelCostData(false);
        setLoadingCarWashData(false);
        setLoadingUsersData(false);
        setLoadingCompaniesCountData(false);
        setLoadingTireChangeData(false);
        setLoadingOilChangeData(false);
        setLoadingCompaniesData(false);
        setLoadingDriversData(false);
        setLoadingStationsData(false);
        setLoadingLatestOrders(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* All Cards - 4 rows of 3 cards each */}
      <StatsCardsSection
        statsData={statsData}
        defaultSelectedOptions={defaultSelectedOptions}
        totalClientsBalance={totalClientsBalance}
        fuelUsageData={fuelUsageData}
        fuelCostData={fuelCostData}
        carWashData={carWashData}
        usersData={usersData}
        companiesData={companiesCountData}
        tireChangeData={tireChangeData}
        oilChangeData={oilChangeData}
      />

      {/* Consumption Section */}
      <ConsumptionSection />

      {/* Fuel Consumption by Cities */}
      <FuelConsumptionByCitiesSection />

      {/* Interactive Map - Petrolife Station Locations */}
      <Map />

      {/* New Dashboard Sections */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <MyCarsSection />
        <MyCarsSection />
      </section>

      {/* Most Used Section */}
      <MostUsedSection
        stationsData={stationsData}
        driversData={driversData}
        companiesData={companiesData}
        stationsTitle="محطات الوقود الأكثر استخداما"
        driversTitle="الأفراد الأكثر استهلاكا"
        companiesTitle="الشركات الأكثر استهلاكا"
      />

      {/* Latest Orders */}
      <LatestOrdersSection ordersData={latestOrdersData} />
    </div>
  );
};
