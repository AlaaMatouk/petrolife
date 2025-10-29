import React, { ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LayoutSimple } from "../shared/Layout/LayoutSimple";
import { serviceDistributerNavigationMenuData, userInfo } from "../../constants/data";
import dashboardIcon from "../../assets/imgs/icons/dashboard.svg";
import { UserRound, Fuel, FileText, MapPin, Receipt, Building2 } from "lucide-react";

interface PageConfig {
  title: string;
  titleIcon: ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

// Dashboard icon component
const DashboardIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <img 
    src={dashboardIcon} 
    alt="Dashboard" 
    className={className}
  />
);

// Define page configurations for each service distributer route
const SERVICE_DISTRIBUTER_PAGE_CONFIGS: Record<string, PageConfig> = {
  '/service-distributer': {
    title: 'لوحة التحكم',
    titleIcon: <DashboardIcon className="w-5 h-5" />,
    showSearch: false,
  },
  '/service-distributer-station-workers': {
    title: 'عمال المحطات',
    titleIcon: <UserRound className="w-5 h-5 text-gray-500" />,
    showSearch: true,
    searchPlaceholder: 'بحث عن عامل...',
  },
  '/service-distributer-stations': {
    title: 'المحطات',
    titleIcon: <Fuel className="w-5 h-5 text-gray-500" />,
    showSearch: true,
    searchPlaceholder: 'بحث عن محطة...',
  },
  '/service-distributer-stations/add': {
    title: 'المحطات / اضافة محطة جديدة',
    titleIcon: <Fuel className="w-5 h-5 text-gray-500" />,
    showSearch: false,
  },
  '/fuel-station-requests': {
    title: 'طلبات محطات الوقود',
    titleIcon: <FileText className="w-5 h-5 text-gray-500" />,
    showSearch: true,
    searchPlaceholder: 'بحث عن طلب...',
  },
  '/service-distributer-financial-reports': {
    title: 'التقارير المالية',
    titleIcon: <FileText className="w-5 h-5 text-gray-500" />,
    showSearch: true,
    searchPlaceholder: 'بحث في التقارير المالية...',
  },
  '/service-distributer-station-locations': {
    title: 'مواقع المحطات',
    titleIcon: <MapPin className="w-5 h-5 text-gray-500" />,
    showSearch: false,
  },
  '/service-distributer-invoices': {
    title: 'الفواتير',
    titleIcon: <Receipt className="w-5 h-5 text-gray-500" />,
    showSearch: true,
    searchPlaceholder: 'بحث في الفواتير...',
  },
  '/service-distributer-general-information': {
    title: 'المعلومات العامة',
    titleIcon: <Building2 className="w-5 h-5 text-gray-500" />,
    showSearch: false,
  },
};

// Helper to get config for dynamic routes
const getPageConfig = (pathname: string): PageConfig | null => {
  // Direct match
  if (SERVICE_DISTRIBUTER_PAGE_CONFIGS[pathname]) {
    return SERVICE_DISTRIBUTER_PAGE_CONFIGS[pathname];
  }

  // Match dynamic routes (e.g., /service-distributer-station-worker/:id)
  if (pathname.startsWith('/service-distributer-station-worker/') && 
      pathname !== '/service-distributer-station-workers') {
    return {
      title: 'عمال المحطات / تفاصيل العامل',
      titleIcon: <UserRound className="w-5 h-5 text-gray-500" />,
      showSearch: false,
    };
  }

  // Match dynamic routes (e.g., /service-distributer-station/:id)
  if (pathname.startsWith('/service-distributer-station/') && 
      pathname !== '/service-distributer-stations' &&
      pathname !== '/service-distributer-stations/add') {
    return {
      title: 'المحطات / تفاصيل المحطة',
      titleIcon: <Fuel className="w-5 h-5 text-gray-500" />,
      showSearch: false,
    };
  }

  // Match dynamic routes (e.g., /fuel-station-request/:id)
  if (pathname.startsWith('/fuel-station-request/') && 
      pathname !== '/fuel-station-requests') {
    return {
      title: 'طلبات محطات الوقود / تفاصيل الطلب',
      titleIcon: <FileText className="w-5 h-5 text-gray-500" />,
      showSearch: false,
    };
  }

  return null;
};

export const ServiceDistributerLayoutWrapper: React.FC = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dynamicTitle, setDynamicTitle] = React.useState<string | null>(null);

  const pageConfig = getPageConfig(location.pathname);

  // Reset dynamic title when pathname changes
  React.useEffect(() => {
    setDynamicTitle(null);
  }, [location.pathname]);

  // If no config found, render without layout
  if (!pageConfig) {
    return <Outlet context={{ searchQuery, setSearchQuery, setDynamicTitle }} />;
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Use dynamic title if set, otherwise use config title
  const displayTitle = dynamicTitle || pageConfig.title;

  return (
    <LayoutSimple
      headerProps={{
        title: displayTitle,
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
        sections: serviceDistributerNavigationMenuData.sections,
        topItems: serviceDistributerNavigationMenuData.topItems,
        bottomItems: serviceDistributerNavigationMenuData.bottomItems,
        userInfo: userInfo,
      }}
    >
      <Outlet context={{ searchQuery, setSearchQuery, setDynamicTitle }} />
    </LayoutSimple>
  );
};

