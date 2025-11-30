import React, { ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LayoutSimple } from "./LayoutSimple";
import { navigationMenuData, userInfo } from "../../../constants/data";

interface PageConfig {
  title: string;
  titleIcon: ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

// Define page configurations for each route
const PAGE_CONFIGS: Record<string, PageConfig> = {
  "/dashboard": {
    title: "لوحة التحكم",
    titleIcon: <img src="/img/side-icons-1.svg" alt="" className="w-5 h-5" />,
  },
  "/drivers": {
    title: "الســـــــــــــــائقين",
    titleIcon: <img src="/img/side-icons-3.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث بالاسم، الهاتف، أو رقم السيارة...",
  },
  "/cars": {
    title: "السيــــــــــــارات",
    titleIcon: <img src="/img/side-icons-4.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث بالاسم، الماركة، الرقم، أو الطراز...",
  },
  "/wallet": {
    title: "محفظــــــــــــتي",
    titleIcon: <img src="/img/side-icons-6.svg" alt="" className="w-5 h-5" />,
  },
  "/financialreports": {
    title: "تقارير المشتريات",
    titleIcon: <img src="/img/side-icons-5.svg" alt="" className="w-5 h-5" />,
  },
  "/walletreports": {
    title: "تقرير المحفظة",
    titleIcon: <img src="/img/side-icons-6.svg" alt="" className="w-5 h-5" />,
  },
  "/fuel-delivery": {
    title: "طلبات توصيل الوقود",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
  },
  "/perolifestationlocations": {
    title: "محطات البترول",
    titleIcon: <img src="/img/side-icons-8.svg" alt="" className="w-5 h-5" />,
  },
  "/moneyrefundrequests": {
    title: "طلبات الاسترداد",
    titleIcon: <img src="/img/side-icons-10.svg" alt="" className="w-5 h-5" />,
  },
  "/walletchargerequests": {
    title: "طلبات الشحن",
    titleIcon: <img src="/img/side-icons-11.svg" alt="" className="w-5 h-5" />,
  },
  "/chargewallet": {
    title: "شحن المحفظة",
    titleIcon: <img src="/img/side-icons-6.svg" alt="" className="w-5 h-5" />,
  },
  "/store": {
    title: "المتجر",
    titleIcon: <img src="/img/side-icons-10.svg" alt="" className="w-5 h-5" />,
  },
  "/subscriptions": {
    title: "اشتراكاتي",
    titleIcon: <img src="/img/side-icons-11.svg" alt="" className="w-5 h-5" />,
  },
  "/subscription-plans": {
    title: "الباقات",
    titleIcon: <img src="/img/side-icons-11.svg" alt="" className="w-5 h-5" />,
  },
  "/invoices": {
    title: "الفواتير",
    titleIcon: <img src="/img/side-icons-5.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder:
      "بحث برقم العميل / العملية السجل التجاري / رقم الهاتف...",
  },
  "/technical-support": {
    title: "الدعم الفني",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/company-faq": {
    title: "الأسئلة الشائعة",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/adddriver": {
    title: "إضافة سائق",
    titleIcon: <img src="/img/side-icons-3.svg" alt="" className="w-5 h-5" />,
  },
  "/addcar": {
    title: "إضافة سيارة",
    titleIcon: <img src="/img/side-icons-4.svg" alt="" className="w-5 h-5" />,
  },
  "/create-delivery-request": {
    title: "إنشاء طلب توصيل",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
  },
  "/test-transfer": {
    title: "بيانات النقل المفلترة",
    titleIcon: <img src="/img/side-icons-1.svg" alt="" className="w-5 h-5" />,
  },
};

// Helper to get config for dynamic routes
const getPageConfig = (pathname: string): PageConfig | null => {
  // Direct match
  if (PAGE_CONFIGS[pathname]) {
    return PAGE_CONFIGS[pathname];
  }

  // Check for dynamic routes
  if (pathname.startsWith("/driver/")) {
    return {
      title: "تفاصيل السائق",
      titleIcon: <img src="/img/side-icons-3.svg" alt="" className="w-5 h-5" />,
    };
  }

  if (pathname.startsWith("/car/")) {
    return {
      title: "تفاصيل السيارة",
      titleIcon: <img src="/img/side-icons-4.svg" alt="" className="w-5 h-5" />,
    };
  }

  return null;
};

export const LayoutWrapper: React.FC = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = React.useState("");

  const pageConfig = getPageConfig(location.pathname);

  // If no config found, render without layout (for login page, etc.)
  if (!pageConfig) {
    return <Outlet context={{ searchQuery, setSearchQuery }} />;
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <LayoutSimple
      headerProps={{
        title: pageConfig.title,
        titleIconSrc: pageConfig.titleIcon,
        showSearch: pageConfig.showSearch,
        searchProps: pageConfig.showSearch
          ? {
              onSearch: handleSearch,
              placeholder: pageConfig.searchPlaceholder || "بحث...",
            }
          : undefined,
      }}
      sidebarProps={{
        sections: navigationMenuData.sections,
        topItems: navigationMenuData.topItems,
        bottomItems: navigationMenuData.bottomItems,
        anotherSections: navigationMenuData.anotherSections,
        userInfo: userInfo,
      }}
    >
      <Outlet context={{ searchQuery, setSearchQuery }} />
    </LayoutSimple>
  );
};
