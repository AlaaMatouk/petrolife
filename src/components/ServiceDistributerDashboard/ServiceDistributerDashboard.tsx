import { useDataInitialization } from "../../hooks/useDataInitialization";
import dashboardIcon from "../../assets/imgs/icons/dashboard.svg";
import { useState, useEffect, useMemo } from "react";
import { Fuel } from "lucide-react";
import { fetchServiceDistributerStatistics, fetchTopClientsByConsumption, fetchTopStationsByConsumption } from "../../services/firestore";
import {
  getServiceDistributerEssentialCategorySalesTrends,
  EssentialCategorySalesTrends,
  EssentialCategoryTimeseries,
  EssentialCategoryKey,
} from "../../services/firestore";

// Dashboard icon component
const DashboardIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <img 
    src={dashboardIcon} 
    alt="Dashboard" 
    className={className}
  />
);
import BannerSection from "../sections/BannerSection/BannerSection";
import { SubscriptionAndLocationsSection } from "../sections/SubscriptionAndLocationsSection";
import FuelConsumptionByCitiesSection from "../sections/FuelConsumptionByCitiesSection";
import { DeliverySurveySection } from "../sections/DeliverySurveySection";
import MostUsedSection from "../sections/MostUsedSection/MostUsedSections";
import { StationLocationsMap } from "../sections/StationLocationsMap";
import { LegendHighlightLineChart, Spinner, TimeFilter } from "../shared";

const ServiceDistributerSalesSection = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("اخر 12 شهر");
  const [activeLegendIndex, setActiveLegendIndex] = useState<number | null>(null);
  const [salesTrends, setSalesTrends] = useState<EssentialCategorySalesTrends | null>(
    null
  );
  const [isLoadingSales, setIsLoadingSales] = useState(true);
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
        const result = await getServiceDistributerEssentialCategorySalesTrends();
        if (cancelled) return;
        setSalesTrends(result);
        setSalesError(null);
      } catch (error) {
        console.error(
          "❌ Failed to load service distributer essential category sales trends:",
          error
        );
        if (!cancelled) {
          setSalesTrends(null);
          setSalesError("تعذر تحميل بيانات المبيعات الخاصة بالموزع للخدمة.");
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
        <div className="flex items-center justify-between mb-6">
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

          <div className="flex items-center gap-4">
            <TimeFilter
              selectedFilter={selectedPeriod}
              onFilterChange={setSelectedPeriod}
              filters={["اخر اسبوع", "اخر 30 يوم", "اخر 6 شهور", "اخر 12 شهر"]}
              showCalendar={false}
            />
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--form-section-title-color)]">
                المبيعات
              </h2>
              <Fuel className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>

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

export const ServiceDistributerDashboard = () => {
  useDataInitialization();
  
  // Initialize with default stats data structure to prevent empty state
  const [statsData, setStatsData] = useState<any[]>([
    {
      title: "اجمالي تكلفة الوقود",
      total: "جاري التحميل...",
      breakdown: [
        { type: "ديزل", amount: "...", color: "text-color-mode-text-icons-t-orange" },
        { type: "بنزين 95", amount: "...", color: "text-color-mode-text-icons-t-red" },
        { type: "بنزين 91", amount: "...", color: "text-color-mode-text-icons-t-green" }
      ],
      icon: <img src="/src/assets/imgs/icons/money-bag-orange.svg" alt="money bag" className="w-5 h-5" />,
    },
    {
      title: "اجمالي اللترات",
      content: [
        { type: "ديزل", amount: "...", color: "text-color-mode-text-icons-t-orange" },
        { type: "بنزين 95", amount: "...", color: "text-color-mode-text-icons-t-red" },
        { type: "بنزين 91", amount: "...", color: "text-color-mode-text-icons-t-green" }
      ],
      icon: <img src="/src/assets/imgs/icons/droplet-orange.svg" alt="droplet" className="w-5 h-5" />,
      type: "fuel"
    },
    {
      title: "نوع الخدمة",
      value: "تعبئة وقود",
      icon: <img src="/src/assets/imgs/icons/dashboard-orange.svg" alt="dashboard" className="w-5 h-5" />,
    },
    {
      title: "عدد المحطـــــــــــــــات",
      value: "...",
      icon: <img src="/src/assets/imgs/icons/petrol-station-orange.svg" alt="petrol station" className="w-5 h-5" />
    },
    {
      title: "عدد العمــــــــــال",
      value: "...",
      icon: <img src="/src/assets/imgs/icons/user-group-orange.svg" alt="user group" className="w-5 h-5" />,
      type: "oil"
    },
    {
      title: "عدد العمـــــــــلاء",
      value: "...",
      icon: <img src="/src/assets/imgs/icons/user-group-orange.svg" alt="user group" className="w-5 h-5" />,
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [clientsData, setClientsData] = useState<any[]>([]);
  const [stationsData, setStationsData] = useState<any[]>([]);

  // Fetch top clients and stations data
  useEffect(() => {
    const loadTopData = async () => {
      try {
        console.log("🔄 Loading top clients data...");
        const clients = await fetchTopClientsByConsumption();
        console.log("✅ Top clients loaded:", clients);
        setClientsData(clients);
        
        console.log("🔄 Loading top stations data...");
        const stations = await fetchTopStationsByConsumption();
        console.log("✅ Top stations loaded:", stations);
        setStationsData(stations);
      } catch (error) {
        console.error("❌ Error loading top data:", error);
      }
    };

    loadTopData();
  }, []);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true);
        console.log("🔄 Loading statistics...");
        const stats = await fetchServiceDistributerStatistics();
        console.log("✅ Statistics loaded:", stats);
        
        // Format fuel cost breakdown
        const fuelCostBreakdown = stats.fuelCost.breakdown.map(item => ({
          type: item.type,
          amount: item.amount.toFixed(2),
          color: item.color
        }));

        // Format total liters breakdown
        const totalLitersBreakdown = stats.totalLiters.breakdown.map(item => ({
          type: item.type,
          amount: `${item.amount.toFixed(2)} L`,
          color: item.color
        }));

        // Format numbers with commas
        const formatNumber = (num: number) => {
          return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        };

        const updatedStatsData = [
          {
            title: "اجمالي تكلفة الوقود",
            total: `الاجمالي ${formatNumber(stats.fuelCost.total)}`,
            breakdown: fuelCostBreakdown,
            icon: <img src="/src/assets/imgs/icons/money-bag-orange.svg" alt="money bag" className="w-5 h-5" />,
          },
          {
            title: "اجمالي اللترات",
            content: totalLitersBreakdown,
            icon: <img src="/src/assets/imgs/icons/droplet-orange.svg" alt="droplet" className="w-5 h-5" />,
            type: "fuel"
          },
          {
            title: "نوع الخدمة",
            value: "تعبئة وقود",
            icon: <img src="/src/assets/imgs/icons/dashboard-orange.svg" alt="dashboard" className="w-5 h-5" />,
          },
          {
            title: "عدد المحطـــــــــــــــات",
            value: stats.totalStations.toString(),
            icon: <img src="/src/assets/imgs/icons/petrol-station-orange.svg" alt="petrol station" className="w-5 h-5" />
          },
          {
            title: "عدد العمــــــــــال",
            value: stats.uniqueWorkers.toString(),
            icon: <img src="/src/assets/imgs/icons/user-group-orange.svg" alt="user group" className="w-5 h-5" />,
            type: "oil"
          },
          {
            title: "عدد العمـــــــــلاء",
            value: stats.uniqueClients.toString(),
            icon: <img src="/src/assets/imgs/icons/user-group-orange.svg" alt="user group" className="w-5 h-5" />,
          }
        ];

        console.log("📊 Updating stats data with:", updatedStatsData);
        setStatsData(updatedStatsData);
        console.log("✅ Stats data updated");
      } catch (error) {
        console.error("❌ Error loading statistics:", error);
        // Keep the default loading state on error (don't reset to empty)
      } finally {
        setLoading(false);
        console.log("🏁 Loading state set to false");
      }
    };

    loadStatistics();
  }, []);

  // Debug: Log statsData whenever it changes
  useEffect(() => {
    console.log("📈 statsData state changed:", statsData);
  }, [statsData]);

  // Use real stations and clients data or fallback to empty arrays
  const activeStationsData = stationsData.length > 0 ? stationsData : [];
  const activeClientsData = clientsData.length > 0 ? clientsData : [];

  //   if (!isInitialized) {
  return (
    <>
      <BannerSection />
      <SubscriptionAndLocationsSection statsData={statsData} />
      {!loading && (
        <>
          <ServiceDistributerSalesSection />
          <FuelConsumptionByCitiesSection />
          <StationLocationsMap title="مواقع محطات بترولايف" filterByUser={true} />
          <DeliverySurveySection />
          <MostUsedSection 
            stationsData={activeStationsData} 
            driversData={activeClientsData}
            stationsTitle="محطات الوقود الأكثر استخداما"
            driversTitle="الأفراد الأكثر استهلاكا"
          />
        </>
      )}
    </>
  );
};
