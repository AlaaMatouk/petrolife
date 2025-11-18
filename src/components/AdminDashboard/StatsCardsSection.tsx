import { useState } from "react";
import {
  DriversSummaryData,
  SubscriptionsSummaryData,
  SubscriptionGroupSummary,
} from "../../types/dashboardStats";

// Type definitions for the stats data structure
export interface StatCategory {
  name: string;
  count: number;
}

export interface StatBreakdown {
  type: string;
  amount: string;
  color: string;
}

export interface StatTotal {
  name: string;
  count: number;
}

export interface StatData {
  title: string;
  icon: React.ReactNode;
  categories?: StatCategory[];
  breakdown?: StatBreakdown[];
  total?: StatTotal;
  options?: string[];
  optionCategories?: Record<string, StatCategory[]>;
  optionTotals?: Record<string, StatTotal>;
  amount?: string;
  type?: string;
}

export interface FuelUsageData {
  diesel: number;
  gasoline95: number;
  gasoline91: number;
  total: number;
}

export interface FuelCostData {
  diesel: number;
  gasoline95: number;
  gasoline91: number;
  total: number;
}

export interface CarWashData {
  small: number;
  medium: number;
  large: number;
  vip: number;
}

export interface UsersData {
  supervisors: number;
  companies: number;
  individuals: number;
  serviceProviders: number;
}

export interface CompaniesData {
  direct: number;
  viaRepresentatives: number;
  total: number;
}

export interface StatsCardsSectionProps {
  statsData: StatData[];
  defaultSelectedOptions?: { [key: number]: number };
  style?: string;
  totalClientsBalance?: number;
  fuelUsageData?: FuelUsageData;
  fuelCostData?: FuelCostData;
  carWashData?: CarWashData;
  usersData?: UsersData;
  companiesData?: CompaniesData;
  tireChangeData?: CarWashData; // Reuse CarWashData interface for tire change
  oilChangeData?: CarWashData; // Reuse CarWashData interface for oil change
  purchaseCostData?: number; // Total purchase cost
  driversData?: { active: number; inactive: number; total: number };
  carsData?: CarWashData; // Reuse CarWashData interface for cars
  ordersData?: { completed: number; canceled: number; total: number };
  driversSummary?: DriversSummaryData;
  subscriptionsSummary?: SubscriptionsSummaryData;
}

const StatsCardsSection = ({
  statsData,
  defaultSelectedOptions = {},
  style = "",
  totalClientsBalance,
  fuelUsageData,
  fuelCostData,
  carWashData,
  usersData,
  companiesData,
  tireChangeData,
  oilChangeData,
  purchaseCostData,
  driversData,
  carsData,
  ordersData,
  driversSummary,
  subscriptionsSummary,
}: StatsCardsSectionProps) => {
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: number]: number;
  }>(defaultSelectedOptions);

  // Update wallet balance, fuel usage, and fuel cost in statsData if provided
  const updatedStatsData = statsData.map((stat) => {
    // Update wallet balance
    if (stat.type === "wallet" && totalClientsBalance !== undefined) {
      return {
        ...stat,
        amount: new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(totalClientsBalance),
      };
    }

    // Update fuel usage data
    if (stat.title === "اجمالي اللترات" && fuelUsageData) {
      return {
        ...stat,
        breakdown: [
          {
            type: "ديزل",
            amount: `${fuelUsageData.diesel.toFixed(0)} .L`,
            color: "text-color-mode-text-icons-t-orange",
          },
          {
            type: "بنزين 95",
            amount: `${fuelUsageData.gasoline95.toFixed(0)} .L`,
            color: "text-color-mode-text-icons-t-red",
          },
          {
            type: "بنزين 91",
            amount: `${fuelUsageData.gasoline91.toFixed(0)} .L`,
            color: "text-color-mode-text-icons-t-green",
          },
        ],
        total: { name: "الاجمالي", count: fuelUsageData.total },
      };
    }

    // Update fuel cost data
    if (stat.title === "اجمالي تكلفة الوقود" && fuelCostData) {
      return {
        ...stat,
        breakdown: [
          {
            type: "ديزل",
            amount: fuelCostData.diesel.toFixed(0),
            color: "text-color-mode-text-icons-t-orange",
          },
          {
            type: "بنزين 95",
            amount: fuelCostData.gasoline95.toFixed(0),
            color: "text-color-mode-text-icons-t-red",
          },
          {
            type: "بنزين 91",
            amount: fuelCostData.gasoline91.toFixed(0),
            color: "text-color-mode-text-icons-t-green",
          },
        ],
        total: { name: "الاجمالي", count: fuelCostData.total },
      };
    }

    // Update car wash operations data
    if (stat.title === "عمليات غسيل السيارات" && carWashData) {
      return {
        ...stat,
        categories: [
          { name: "VIP", count: carWashData.vip },
          { name: "كبيرة", count: carWashData.large },
          { name: "متوسطة", count: carWashData.medium },
          { name: "صغيرة", count: carWashData.small },
        ],
      };
    }

    // Update users data
    if (stat.title === "المستخدمين" && usersData) {
      return {
        ...stat,
        categories: [
          { name: "مزودي الخدمة", count: usersData.serviceProviders },
          { name: "افراد", count: usersData.individuals },
          { name: "شركات", count: usersData.companies },
          { name: "مشرفين", count: usersData.supervisors },
        ],
      };
    }

    // Update drivers summary data (delivery vs company)
    if (stat.title === "السائقين" && driversSummary) {
      return {
        ...stat,
        categories: [
          { name: "سائقونا بتوصيل الوقود", count: driversSummary.delivery },
          { name: "سائقي الشركات", count: driversSummary.company },
        ],
        total: { name: "الاجمالي", count: driversSummary.total },
      };
    }

    // Update subscriptions summary data
    if (stat.title === "الاشتراكات" && subscriptionsSummary) {
      const buildSubscriptionCategories = (group: SubscriptionGroupSummary) => [
        { name: "Premium", count: group.premium },
        { name: "Classic", count: group.classic },
        { name: "Basic", count: group.basic },
      ];

      return {
        ...stat,
        categories: buildSubscriptionCategories(subscriptionsSummary.individuals),
        optionCategories: {
          الأفراد: buildSubscriptionCategories(subscriptionsSummary.individuals),
          الشركات: buildSubscriptionCategories(subscriptionsSummary.companies),
        },
        optionTotals: {
          الأفراد: {
            name: "الاشتراكات المنتهية",
            count: subscriptionsSummary.individuals.expired,
          },
          الشركات: {
            name: "الاشتراكات المنتهية",
            count: subscriptionsSummary.companies.expired,
          },
        },
        total: {
          name: "الاشتراكات المنتهية",
          count:
            subscriptionsSummary.individuals.expired +
            subscriptionsSummary.companies.expired,
        },
      };
    }

    // Update companies data
    if (stat.title === "الشركات" && companiesData) {
      return {
        ...stat,
        categories: [
          {
            name: "حسابات بواسطة المناديب",
            count: companiesData.viaRepresentatives,
          },
          { name: "حسابات مباشرة", count: companiesData.direct },
        ],
        total: { name: "الاجمالي", count: companiesData.total },
      };
    }

    // Update purchase cost data
    if (
      stat.title === "التكلفة الإجمالية للمشتريات" &&
      purchaseCostData !== undefined
    ) {
      return {
        ...stat,
        amount:
          new Intl.NumberFormat("en-US").format(purchaseCostData) + " ر.س",
      };
    }

    // Update drivers data
    if (stat.title === "السائقين النشطين / المعطلين" && driversData) {
      return {
        ...stat,
        categories: [
          { name: "نشطين", count: driversData.active },
          { name: "معطلين", count: driversData.inactive },
        ],
      };
    }

    // Update cars data
    if (
      (stat.title === "السيارات" ||
        stat.title === "السيارات المشتركة" ||
        stat.title === "اجمالي السيارات") &&
      carsData
    ) {
      return {
        ...stat,
        categories: [
          { name: "صغيرة", count: carsData.small },
          { name: "متوسطة", count: carsData.medium },
          { name: "كبيرة", count: carsData.large },
          { name: "VIP", count: carsData.vip },
        ],
        total: {
          name: "الاجمالي",
          count:
            carsData.small + carsData.medium + carsData.large + carsData.vip,
        },
      };
    }

    // Update orders data
    if (stat.title === "الطلبات المكتملة / الملغية" && ordersData) {
      return {
        ...stat,
        categories: [
          { name: "مكتملة", count: ordersData.completed },
          { name: "ملغية", count: ordersData.canceled },
        ],
      };
    }

    // Update tire change operations data
    if (stat.title === "عمليات تغيير الإطارات" && tireChangeData) {
      return {
        ...stat,
        categories: [
          { name: "صغيرة", count: tireChangeData.small },
          { name: "متوسطة", count: tireChangeData.medium },
          { name: "كبيرة", count: tireChangeData.large },
          { name: "VIP", count: tireChangeData.vip },
        ],
      };
    }

    // Update oil change operations data
    if (stat.title === "عمليات تغيير الزيوت" && oilChangeData) {
      return {
        ...stat,
        categories: [
          { name: "صغيرة", count: oilChangeData.small },
          { name: "متوسطة", count: oilChangeData.medium },
          { name: "كبيرة", count: oilChangeData.large },
          { name: "VIP", count: oilChangeData.vip },
        ],
      };
    }

    return stat;
  });

  return (
    <section
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 ${style}`}
      style={{ direction: "rtl" }}
    >
      {updatedStatsData.map((stat, index) => {
        const selectedOptionIndex =
          stat.options && stat.options.length > 0
            ? selectedOptions[index] ?? 0
            : null;
        const selectedOption =
          selectedOptionIndex !== null && stat.options
            ? stat.options[selectedOptionIndex] ?? stat.options[0]
            : null;
        const categoriesToRender =
          selectedOption && stat.optionCategories
            ? stat.optionCategories[selectedOption] ?? []
            : stat.categories ?? [];
        const totalToRender =
          selectedOption && stat.optionTotals
            ? stat.optionTotals[selectedOption]
            : stat.total;

        return (
          <div
            key={index}
            className="relative w-full rounded-[16px] rounded-bl-[28px] border p-6 flex flex-col justify-between transition-colors duration-300"
            style={{
              direction: "ltr",
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-strong)",
              boxShadow: "0px 6px 18px rgba(0, 0, 0, 0.25)",
            }}
          >
            {/* Upper row - title */}
            {!totalToRender && !stat.options ? (
              <div className="flex justify-end mb-4">
                <span className="text-base text-[var(--text-secondary)] transition-colors duration-300">
                  {stat.title}
                </span>
              </div>
            ) : stat.options ? (
              <div className="flex justify-between items-start mb-4 gap-4">
                {/* Options buttons */}
                <div className="flex gap-2 flex-wrap">
                  {stat.options.map((option, optionIndex) => {
                    const isSelected =
                      (selectedOptions[index] ?? 0) === optionIndex;
                    return (
                      <button
                        key={optionIndex}
                        onClick={() =>
                          setSelectedOptions((prev) => ({
                            ...prev,
                            [index]: optionIndex,
                          }))
                        }
                        className="px-[10px] py-1 rounded-[8px] transition-all duration-200 border"
                        style={{
                          backgroundColor: isSelected
                            ? "var(--nav-tab-active-bg)"
                            : "var(--surface-control)",
                          color: isSelected
                            ? "var(--nav-tab-active-text)"
                            : "var(--text-secondary)",
                          fontSize: "12px",
                          fontWeight: 500,
                          borderColor: isSelected
                            ? "transparent"
                            : "var(--border-subtle)",
                          cursor: "pointer",
                        }}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                {/* Title and optional total */}
                <div className="flex flex-col items-end gap-1">
                  <span className="text-base text-[var(--text-secondary)] transition-colors duration-300">
                    {stat.title}
                  </span>
                  {totalToRender && (
                    <span className="text-sm text-[var(--text-secondary)] transition-colors duration-300">
                      {`${totalToRender.name} ${totalToRender.count}`}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-between mb-4">
                <span className="text-base text-[var(--text-secondary)] transition-colors duration-300">
                  {typeof totalToRender === "object" &&
                  totalToRender !== null &&
                  "name" in totalToRender
                    ? `${totalToRender.name} ${totalToRender.count}`
                    : ""}
                </span>
                <span className="text-base text-[var(--text-secondary)] transition-colors duration-300">
                  {stat.title}
                </span>
              </div>
            )}

            {/* Lower row - value and icon */}
            <div className="flex items-center justify-end">
              <div
                className="w-10 h-10 absolute bottom-[8px] left-[8px] rounded-full flex items-center justify-center transition-colors duration-300"
                style={{ backgroundColor: "var(--surface-control-muted)" }}
              >
                {stat.icon}
              </div>

              {categoriesToRender.length > 0 ? (
                <div className="flex items-center gap-[10px]">
                  {categoriesToRender.map((category, catIndex) => (
                    <div key={catIndex} className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-[var(--stats-card-number)] transition-colors duration-300">
                          {category.count}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)] text-right transition-colors duration-300">
                          {category.name}
                        </span>
                      </div>
                      {catIndex < categoriesToRender.length - 1 && (
                        <div className="w-px h-8 bg-[color:var(--border-subtle)] transition-colors duration-300"></div>
                      )}
                    </div>
                  ))}
                </div>
              ) : stat.breakdown && stat.breakdown.length > 0 ? (
                <div className="flex items-center gap-4">
                  {stat.breakdown.map((fuel, fuelIndex) => (
                    <div key={fuelIndex} className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-[var(--stats-card-number)] transition-colors duration-300">
                          {fuel.amount}
                        </span>
                        <span className={`${fuel.color} text-xs font-bold`}>
                          {fuel.type}
                        </span>
                      </div>
                      {fuelIndex < stat.breakdown!.length - 1 && (
                        <div className="w-px h-8 bg-[color:var(--border-subtle)] transition-colors duration-300"></div>
                      )}
                    </div>
                  ))}
                </div>
              ) : totalToRender ? (
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold text-[var(--stats-card-total)] transition-colors duration-300">
                    {totalToRender.count}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] transition-colors duration-300">
                    {totalToRender.name}
                  </span>
                </div>
              ) : (
                <p className="text-xl font-bold text-[var(--stats-card-total)] transition-colors duration-300">
                  {stat.amount}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default StatsCardsSection;
