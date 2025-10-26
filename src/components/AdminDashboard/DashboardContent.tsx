import { useState, useEffect } from "react";
// import { useOutletContext } from "react-router-dom"; // Uncomment when using search functionality
import { Table, TimeFilter } from "../../components/shared";
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
} from "../../services/firestore";

// Context type for outlet (uncomment when using search functionality)
// interface OutletContextType {
//   searchQuery: string;
//   setSearchQuery: (query: string) => void;
// }

// Consumption Section
const ConsumptionSection = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("اخر 12 شهر");

  const months = [
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
  ];

  const legendItems = [
    {
      text: "بطاريات",
      color: "var(--core-colors-green-green-6)",
      width: "w-[46px]",
    },
    {
      text: "إطارات",
      color: "var(--core-colors-mango-mango-6)",
      width: "w-10",
    },
    {
      text: "زيوت",
      color: "var(--text-secondary)",
      width: "w-7",
    },
    {
      text: "وقـــــــــود",
      color: "var(--core-colors-red-red-6)",
      width: "w-[51px]",
      containerWidth: "w-[50px]",
      marginLeft: "ml-[-8.00px]",
    },
    {
      text: "غســـــيل",
      color: "var(--color-mode-text-icons-t-blue)",
      width: "w-12",
      containerWidth: "w-[51px]",
      marginLeft: "ml-[-4.00px]",
    },
  ];

  return (
    <section className="mb-8">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {/* First Row - Title and Time Periods on Right, Legend on Left */}
        <div className="flex items-center justify-between mb-6">
          {/* Legend - Left */}
          <div className="flex items-center">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center gap-2">
                {legendItems.map((item, index) => (
                  <div
                    key={index}
                    className={`${
                      item.containerWidth
                        ? `flex ${item.containerWidth} items-center justify-end gap-0.5`
                        : "inline-flex items-center gap-0.5"
                    }`}
                  >
                    <div
                      className={`${item.width} h-3.5 ${
                        item.marginLeft || ""
                      } font-bold text-xs tracking-[0.40px] leading-[19.2px] whitespace-nowrap [font-family:'Tajawal',Helvetica] [direction:rtl]`}
                      style={{ color: item.color }}
                    >
                      {item.text}
                    </div>
                    <div
                      className="w-[5px] h-[5px] rounded-[1px]"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                ))}
              </div>
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
              <Fuel className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Second Row - Chart */}
        <div className="w-full">
          {/* Graph Background */}
          <div className="relative w-full h-[220px] flex flex-col justify-end">
            <img
              className="w-full h-full object-contain"
              alt="Graph background"
              src="/img/bgDD.png"
            />

            {/* Months row */}
            <div className="absolute bottom-0 left-0 w-full flex justify-between px-2">
              {months.map((month, index) => (
                <div
                  key={index}
                  className="text-[var(--text-secondary)] text-[0.8rem] md:text-[0.9rem] font-medium text-center"
                >
                  {month}
                </div>
              ))}
            </div>
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

  const colors = ["#5A66C1", "#EE3939", "#5B738B", "#E76500", "#00C950"];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="text-[16px] font-normal text-[#5B738B] [direction:rtl] text-right">
          اجمالي طلبات التوصيل 200
        </div>
        <h3 className="text-xl font-bold text-[#5A66C1] [direction:rtl] text-right">
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
                <span className="text-sm font-medium text-[#223548] [direction:rtl]">
                  {category.total}/{category.count}
                </span>
                <span className="text-sm font-normal text-[#223548] [direction:rtl]">
                  {category.name}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-[5px] flex justify-end">
                <div
                  className="h-[5px] rounded-full transition-all duration-500"
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
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium [direction:rtl]">تصدير</span>
          </button>
          <TimeFilter
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
          />
        </div>
        <h3 className="text-xl font-bold text-gray-800 [direction:rtl] text-right">
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
                  className="w-full bg-gray-100 rounded-full"
                  style={{ height: "240px" }}
                >
                  <div
                    className="w-full rounded-full transition-all duration-700"
                    style={{
                      height: `${height}%`,
                      position: "absolute",
                      bottom: 0,
                      backgroundColor: "#5A66C1",
                    }}
                  ></div>
                </div>
              </div>
              {/* City Name */}
              <div className="text-xs text-gray-600 [direction:rtl] text-center font-medium">
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
        <div className="text-right text-sm text-gray-800 [direction:rtl]">
          {order?.date || "N/A"}
        </div>
      ),
    },
    {
      key: "totalCost",
      label: "السعر الكلي",
      width: "min-w-[100px]",
      render: (_: any, order: any) => (
        <div className="text-right text-sm text-gray-800 [direction:rtl]">
          {order?.totalCost || "N/A"}
        </div>
      ),
    },
    {
      key: "litre",
      label: "اجمالي اللترات",
      width: "min-w-[100px]",
      render: (_: any, order: any) => (
        <div className="text-right text-sm text-gray-800 [direction:rtl]">
          {order?.litre || "N/A"}
        </div>
      ),
    },
    {
      key: "service",
      label: "الخدمة",
      width: "min-w-[100px]",
      render: (_: any, order: any) => (
        <div className="text-right text-sm text-gray-800 [direction:rtl]">
          {order?.service || "N/A"}
        </div>
      ),
    },
    {
      key: "client",
      label: "اسم العميل",
      width: "min-w-[100px]",
      render: (_: any, order: any) => (
        <div className="text-right text-sm text-gray-800 [direction:rtl]">
          {order?.client || "N/A"}
        </div>
      ),
    },
    {
      key: "code",
      label: "الرقم المرجعي",
      width: "min-w-[100px]",
      render: (_: any, order: any) => (
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
          className="flex items-center gap-2 px-3 py-2 bg-white text-[#5A66C1] rounded-lg hover:bg-gray-50 transition-colors"
          style={{ border: "1px solid #5A66C1" }}
        >
          <span className="text-sm font-medium [direction:rtl] ">
            عرض المزيد
          </span>
        </button>

        <div className="inline-flex items-center gap-[28px] relative flex-[0_0_auto]">
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedButton(0)}
              className="px-[10px] py-1 rounded-[8px] transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor:
                  selectedButton === 0 ? "#F9F3FF" : "rgba(245, 246, 247, 0.4)",
                color: selectedButton === 0 ? "#223548" : "#A9B4BE",
                fontSize: "14px",
                fontWeight: "500",
                border: "none",
                cursor: "pointer",
              }}
            >
              محطات الوقود
            </button>
            <button
              onClick={() => setSelectedButton(1)}
              className="px-[10px] py-1 rounded-[8px] transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor:
                  selectedButton === 1 ? "#F9F3FF" : "rgba(245, 246, 247, 0.4)",
                color: selectedButton === 1 ? "#223548" : "#A9B4BE",
                fontSize: "14px",
                fontWeight: "500",
                border: "none",
                cursor: "pointer",
              }}
            >
              الشركات
            </button>
          </div>
          <h3 className="mt-[-1.00px] font-[800] text-[#5A66C1] text-[18px] leading-[24px] [direction:rtl] relative  whitespace-nowrap ">
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
