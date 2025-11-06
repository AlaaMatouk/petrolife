import React, { ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LayoutSimple } from "../shared/Layout/LayoutSimple";
import { adminNavigationMenuData, userInfo } from "../../constants/data";
import sideIcons1 from "../../../static/img/side-icons-1.svg";

interface PageConfig {
  title: string;
  titleIcon: ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

// Define page configurations for each admin route
const ADMIN_PAGE_CONFIGS: Record<string, PageConfig> = {
  "/admin-dashboard": {
    title: "لوحة التحكم",
    titleIcon: <img src={sideIcons1} alt="logo" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث برقم العميل / العملية / السجل التجاري / رقم الهاتف",
  },
  "/supervisors": {
    title: "المشرفين",
    titleIcon: <img src="/img/side-icons-3.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث عن مشرف...",
  },
  "/supervisors/add": {
    title: "المشرفين / اضافة مشرف جديد",
    titleIcon: <img src="/img/side-icons-3.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/companies": {
    title: "الشركات",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث عن شركة...",
  },
  "/companies/add": {
    title: "الشركات / اضافة شركة جديدة",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/individuals": {
    title: "الأفراد",
    titleIcon: <img src="/img/side-icons-8.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث عن فرد...",
  },
  "/individuals/add": {
    title: "الأفراد / اضافة فرد جديد",
    titleIcon: <img src="/img/side-icons-8.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/service-providers": {
    title: "مزودي الخدمة",
    titleIcon: <img src="/img/side-icons-9.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث عن مزود خدمة...",
  },
  "/service-providers/add": {
    title: "مزودي الخدمة / اضافة مزود خدمة جديد",
    titleIcon: <img src="/img/side-icons-9.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/wallet-requests": {
    title: "طلبات المحافظ",
    titleIcon: <img src="/img/side-icons-3.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث عن طلب...",
  },
  "/wallet-requests/moneyrefundrequests": {
    title: "طلبات استرداد الاموال",
    titleIcon: <img src="/img/side-icons-3.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث عن طلب استرداد...",
  },
  "/fuel-delivery-requests": {
    title: "طلبات توصيل الوقود",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث عن طلب توصيل...",
  },
  "/fuel-delivery-requests/received-delivery-requests": {
    title: "طلبات التوصيل المستلمة",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث عن طلب توصيل مستلم...",
  },
  "/application-services": {
    title: "خدمات التطبيق",
    titleIcon: <img src="/img/side-icons-9.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث في الخدمات...",
  },
  "/application-services/add-choice": {
    title: "خدمات التطبيق / إضافة خيار جديد",
    titleIcon: <img src="/img/side-icons-9.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/admin-financial-reports": {
    title: "تقارير المبيعات",
    titleIcon: <img src="/img/side-icons-20.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث في تقارير المبيعات...",
  },
  "/admin-service-provider-reports": {
    title: "تقارير مزودي الخدمة",
    titleIcon: <img src="/img/side-icons-9.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث في تقارير مزودي الخدمة...",
  },
  "/admin-wallet-reports": {
    title: "تقارير المحافظ",
    titleIcon: <img src="/img/side-icons-6.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث في تقارير المحافظ...",
  },
  "/petrolife-drivers": {
    title: "سائقي بترولايف",
    titleIcon: <img src="/img/side-icons-3.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث عن سائق...",
  },
  "/petrolife-drivers/add": {
    title: "سائقي بترولايف / اضافة سائق جديد",
    titleIcon: <img src="/img/side-icons-3.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/petrolife-agents": {
    title: "مندوبو بترولايف",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث عن مندوب...",
  },
  "/petrolife-agents/add": {
    title: "مندوبو بترولايف / اضافة مندوب جديد",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/petrolife-cars": {
    title: "مركبات بترولايف",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث عن مركبة...",
  },
  "/petrolife-cars/add": {
    title: "مركبات بترولايف / إضافة مركبة جديدة",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/petrolife-products": {
    title: "منتجات بترولايف",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث عن منتج...",
  },
  "/petrolife-products/add": {
    title: "منتجات بترولايف / إضافة منتج جديد",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/petrolife-coupons": {
    title: "كوبونات بترولايف",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث في الكوبونات...",
  },
  "/petrolife-coupons/add": {
    title: "كوبونات بترولايف / إضافة كوبون جديد",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/admin-invoice-reports": {
    title: "تقارير الفواتير",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/admin-representative-reports": {
    title: "تقارير المندوبين",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/admin-countries": {
    title: "البلدان",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/admin-countries/add": {
    title: "البلدان / إضافة بلد جديدة",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/admin-cars": {
    title: "المركبات",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث برقم العميل / العملية السجل التجاري / رقم الهاتف",
  },
  "/admin-cars/add": {
    title: "المركبات / إضافة مركبة جديدة",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/admin-categories": {
    title: "التصنيفات",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث في التصنيفات...",
  },
  "/admin-categories/add": {
    title: "التصنيفات / إضافة تصنيف جديد",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/default-accounts": {
    title: "الحسابات الافتراضية",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث برقم العميل / العملية السجل التجاري / رقم الهاتف",
  },
  "/admin-communication-policies": {
    title: "وسائل التواصل & السياسة",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/advertisements": {
    title: "الإعلانات",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث برقم العميل / العملية السجل التجاري / رقم الهاتف",
  },
  "/advertisements/add": {
    title: "الإعلانات / إضافة إعلان جديد",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/special-notifications": {
    title: "الاشعارات المخصصة",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: true,
    searchPlaceholder: "بحث برقم العميل / العملية السجل التجاري / رقم الهاتف",
  },
  "/special-notifications/add": {
    title: "الاشعارات المخصصة / إضافة اشعار مخصص جديد",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/admin-subscriptions": {
    title: "الاشتراكات",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
  "/admin-subscriptions/add": {
    title: "الاشتراكات / إضافة باقة جديدة",
    titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
    showSearch: false,
  },
};

// Helper to get config for dynamic routes
const getPageConfig = (pathname: string): PageConfig | null => {
  // Direct match
  if (ADMIN_PAGE_CONFIGS[pathname]) {
    return ADMIN_PAGE_CONFIGS[pathname];
  }

  // Match dynamic routes (e.g., /supervisors/:id)
  if (pathname.startsWith("/supervisors/") && pathname !== "/supervisors/add") {
    return {
      title: "المشرفين / تفاصيل المشرف",
      titleIcon: <img src="/img/side-icons-3.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes (e.g., /companies/:id)
  if (pathname.startsWith("/companies/") && pathname !== "/companies/add") {
    return {
      title: "الشركات / تفاصيل الشركة",
      titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes (e.g., /individuals/:id)
  if (pathname.startsWith("/individuals/") && pathname !== "/individuals/add") {
    return {
      title: "الأفراد / تفاصيل الفرد",
      titleIcon: <img src="/img/side-icons-8.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes (e.g., /service-providers/:id)
  if (
    pathname.startsWith("/service-providers/") &&
    pathname !== "/service-providers/add"
  ) {
    return {
      title: "مزودي الخدمة / تفاصيل مزود الخدمة",
      titleIcon: <img src="/img/side-icons-9.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes (e.g., /wallet-requests/:id)
  if (
    pathname.startsWith("/wallet-requests/") &&
    pathname !== "/wallet-requests/moneyrefundrequests"
  ) {
    return {
      title: "طلبات المحافظ / مراجعة الطلب",
      titleIcon: <img src="/img/side-icons-3.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes (e.g., /wallet-requests/moneyrefundrequests)
  if (pathname === "/wallet-requests/moneyrefundrequests") {
    return {
      title: "طلبات المحافظ/طلبات استرداد الاموال",
      titleIcon: <img src="/img/side-icons-6.svg" alt="" className="w-5 h-5" />,
      showSearch: true,
      searchPlaceholder: "بحث عن طلب استرداد...",
    };
  }

  // Match dynamic routes (e.g., /wallet-requests/moneyrefundrequests/:id)
  if (
    pathname.startsWith("/wallet-requests/moneyrefundrequests/") &&
    pathname !== "/wallet-requests/moneyrefundrequests"
  ) {
    return {
      title: "طلبات المحافظ/طلبات استرداد الاموال / مراجعة طلب الاسترداد",
      titleIcon: <img src="/img/side-icons-6.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes (e.g., /fuel-delivery-requests/:id)
  if (
    pathname.startsWith("/fuel-delivery-requests/") &&
    pathname !== "/fuel-delivery-requests" &&
    pathname !== "/fuel-delivery-requests/received-delivery-requests"
  ) {
    return {
      title: "طلبات توصيل الوقود / معاينة طلب التوصيل",
      titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes (e.g., /fuel-delivery-requests/received-delivery-requests/:id)
  if (
    pathname.startsWith(
      "/fuel-delivery-requests/received-delivery-requests/"
    ) &&
    pathname !== "/fuel-delivery-requests/received-delivery-requests"
  ) {
    return {
      title: "طلبات التوصيل المستلمة / تفاصيل الطلب",
      titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes (e.g., /application-services/:id)
  if (
    pathname.startsWith("/application-services/") &&
    pathname !== "/application-services"
  ) {
    return {
      title: "خدمات التطبيق / تفاصيل الخدمة",
      titleIcon: <img src="/img/side-icons-9.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes (e.g., /admin-financial-reports/:id)
  if (
    pathname.startsWith("/admin-financial-reports/") &&
    pathname !== "/admin-financial-reports" &&
    pathname !== "/admin-financial-reports/add"
  ) {
    return {
      title: "تقارير المبيعات / تفاصيل التقرير",
      titleIcon: (
        <img src="/img/side-icons-20.svg" alt="" className="w-5 h-5" />
      ),
      showSearch: false,
    };
  }

  // Match dynamic routes (e.g., /admin-service-provider-reports/:id)
  if (
    pathname.startsWith("/admin-service-provider-reports/") &&
    pathname !== "/admin-service-provider-reports" &&
    pathname !== "/admin-service-provider-reports/add"
  ) {
    return {
      title: "تقارير مزودي الخدمة / تفاصيل التقرير",
      titleIcon: <img src="/img/side-icons-9.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes (e.g., /admin-wallet-reports/:id)
  if (
    pathname.startsWith("/admin-wallet-reports/") &&
    pathname !== "/admin-wallet-reports" &&
    pathname !== "/admin-wallet-reports/add"
  ) {
    return {
      title: "تقارير المحافظ / تفاصيل التقرير",
      titleIcon: <img src="/img/side-icons-6.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  if (
    pathname.startsWith("/petrolife-drivers/") &&
    pathname !== "/petrolife-drivers/add"
  ) {
    return {
      title: "سائقي بترولايف / تفاصيل السائق",
      titleIcon: <img src="/img/side-icons-3.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  if (
    pathname.startsWith("/petrolife-agents/") &&
    pathname !== "/petrolife-agents/add"
  ) {
    return {
      title: "مندوبو بترولايف / تفاصيل المندوب",
      titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  if (
    pathname.startsWith("/petrolife-cars/") &&
    pathname !== "/petrolife-cars/add"
  ) {
    return {
      title: "مركبات بترولايف / تفاصيل المركبة",
      titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  if (
    pathname.startsWith("/petrolife-products/") &&
    pathname !== "/petrolife-products/add"
  ) {
    return {
      title: "منتجات بترولايف / تفاصيل المنتج",
      titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  if (
    pathname.startsWith("/petrolife-coupons/") &&
    pathname !== "/petrolife-coupons/add"
  ) {
    return {
      title: "كوبونات بترولايف / تفاصيل الكوبون",
      titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes for countries (e.g., /admin-countries/:id)
  if (
    pathname.startsWith("/admin-countries/") &&
    pathname !== "/admin-countries" &&
    pathname !== "/admin-countries/add" &&
    !pathname.includes("/add-city") &&
    !pathname.includes("/add-region")
  ) {
    return {
      title: "البلدان / مصر",
      titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match routes for adding cities and regions
  if (pathname.includes("/add-city")) {
    return {
      title: "البلدان / إضافة مدينة جديدة",
      titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  if (pathname.includes("/add-region")) {
    return {
      title: "البلدان / إضافة منطقة جديدة",
      titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes for admin-cars (e.g., /admin-cars/:id)
  if (
    pathname.startsWith("/admin-cars/") &&
    pathname !== "/admin-cars" &&
    pathname !== "/admin-cars/add"
  ) {
    return {
      title: "المركبات / تيوتا كرولا 2020",
      titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes for admin-categories (e.g., /admin-categories/:id)
  if (
    pathname.startsWith("/admin-categories/") &&
    pathname !== "/admin-categories" &&
    pathname !== "/admin-categories/add"
  ) {
    return {
      title: "التصنيفات / تفاصيل التصنيف",
      titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes for advertisements (e.g., /advertisements/:id)
  if (
    pathname.startsWith("/advertisements/") &&
    pathname !== "/advertisements" &&
    pathname !== "/advertisements/add"
  ) {
    return {
      title: "الإعلانات / مشاهدة الاعلان",
      titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes for special-notifications (e.g., /special-notifications/:id)
  if (
    pathname.startsWith("/special-notifications/") &&
    pathname !== "/special-notifications" &&
    pathname !== "/special-notifications/add"
  ) {
    return {
      title: "الاشعارات المخصصة / مشاهدة الاشعار المخصص",
      titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  // Match dynamic routes for admin-subscriptions (e.g., /admin-subscriptions/:id)
  if (
    pathname.startsWith("/admin-subscriptions/") &&
    pathname !== "/admin-subscriptions" &&
    pathname !== "/admin-subscriptions/add"
  ) {
    return {
      title: "الاشتراكات / تعديل الباقة",
      titleIcon: <img src="/img/side-icons-7.svg" alt="" className="w-5 h-5" />,
      showSearch: false,
    };
  }

  return null;
};

export const AdminLayoutWrapper: React.FC = () => {
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
    return (
      <Outlet context={{ searchQuery, setSearchQuery, setDynamicTitle }} />
    );
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Use dynamic title if set, otherwise use config title
  const displayTitle = dynamicTitle || pageConfig.title;

  return (
    <LayoutSimple
      headerProps={{
        admin: true,
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
        sections: adminNavigationMenuData.sections,
        topItems: adminNavigationMenuData.topItems,
        bottomItems: adminNavigationMenuData.bottomItems,
        anotherSections: adminNavigationMenuData.anotherSections,
        userInfo: userInfo,
      }}
    >
      <Outlet context={{ searchQuery, setSearchQuery, setDynamicTitle }} />
    </LayoutSimple>
  );
};
