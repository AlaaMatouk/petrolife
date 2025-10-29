import { useDataInitialization } from "../../hooks/useDataInitialization";
import dashboardIcon from "../../assets/imgs/icons/dashboard.svg";
import { useState, useEffect } from "react";
import { fetchServiceDistributerStatistics, fetchTopClientsByConsumption, fetchTopStationsByConsumption } from "../../services/firestore";

// Dashboard icon component
const DashboardIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <img 
    src={dashboardIcon} 
    alt="Dashboard" 
    className={className}
  />
);
import BannerSection from "../sections/BannerSection/BannerSection";
import ConsumptionSection from "../sections/ConsumptionSection/ConsumptionSection";
import { SubscriptionAndLocationsSection } from "../sections/SubscriptionAndLocationsSection";
import FuelConsumptionByCitiesSection from "../sections/FuelConsumptionByCitiesSection";
import { DeliverySurveySection } from "../sections/DeliverySurveySection";
import MostUsedSection from "../sections/MostUsedSection/MostUsedSections";
import { StationLocationsMap } from "../sections/StationLocationsMap";

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
          <ConsumptionSection />
          <FuelConsumptionByCitiesSection />
          <StationLocationsMap title="مواقع محطات بترولايف" />
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
