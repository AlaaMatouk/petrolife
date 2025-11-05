// Route constants for the application
export const ROUTES = {
  // Main routes
  LOGIN: "/",
  DASHBOARD: "/dashboard",

  // Resource management
  DRIVERS: "/drivers",
  ADD_DRIVER: "/adddriver",
  DRIVER_DETAILS: "/driver/:id",
  CARS: "/cars",
  ADD_CAR: "/addcar",
  CAR_DETAILS: "/car/:id",

  // Wallet and financial
  WALLET: "/wallet",
  CHARGE_WALLET: "/chargewallet",
  TRANSFER_MONEY: "/transfermoney",
  FINANCIAL_REPORTS: "/financialreports",
  WALLET_REPORTS: "/walletreports",

  // Operations
  FUEL_DELIVERY: "/fuel-delivery",
  CREATE_DELIVERY_REQUEST: "/create-delivery-request",
  USED_STATIONS: "/used-stations",
  CHARGE_REQUESTS: "/walletchargerequests",
  PEROLIFE_STATION_LOCATIONS: "/perolifestationlocations",

  // Store and Subscriptions
  STORE: "/store",
  SUBSCRIPTIONS: "/subscriptions",

  // Invoices
  INVOICES: "/invoices",

  // Settings
  SETTINGS: "/settings",

  // Test
  TEST: "/test",

  // Service Distributer Dashboard
  SERVICE_DISTRIBUTER_DASHBOARD: "/service-distributer",
  STATION_WORKERS: "/service-distributer-station-workers",
  STATION_WORKER_DETAILS: "/service-distributer-station-worker/:id",
  STATIONS: "/service-distributer-stations",
  ADD_STATIONS: "/service-distributer-stations/add",
  STATIONS_DETAILS: "/service-distributer-station/:id",
  FUEL_STATION_REQUESTS: "/fuel-station-requests",
  FUEL_STATION_REQUESTS_DETAILS: "/fuel-station-request/:id",
  SERVICE_DISTRIBUTER_FINANCIAL_REPORTS:
    "/service-distributer-financial-reports",
  SERVICE_DISTRIBUTER_STATION_LOCATIONS:
    "/service-distributer-station-locations",
  SERVICE_DISTRIBUTER_INVOICES: "/service-distributer-invoices",

  // Admin Dashboard
  ADMIN_DASHBOARD: "/admin-dashboard",
  SUPERVISORS: "/supervisors",
  SUPERVISOR_DETAILS: "/supervisors/:id",
  ADD_SUPERVISOR: "/supervisors/add",
  COMPANIES: "/companies",
  COMPANY_DETAILS: "/companies/:id",
  ADD_COMPANY: "/companies/add",
  INDIVIDUALS: "/individuals",
  INDIVIDUAL_DETAILS: "/individuals/:id",
  ADD_INDIVIDUAL: "/individuals/add",
  PEOPLE: "/people",
  SERVICE_PROVIDERS: "/service-providers",
  SERVICE_PROVIDER_DETAILS: "/service-providers/:id",
  ADD_SERVICE_PROVIDER: "/service-providers/add",
  SERVICE_PROVIDER_JOIN_REQUESTS: "/service-providers/join-requests",
  PETROLIFE_DRIVERS: "/petrolife-drivers",
  PETROLIFE_AGENTS: "/petrolife-agents",
  ADD_PETROLIFE_AGENT: "/petrolife-agents/add",
  PETROLIFE_AGENT_DETAILS: "/petrolife-agents/:id",
  PETROLIFE_REPRESENTATIVES: "/petrolife-representatives",
  PETROLIFE_CARS: "/petrolife-cars",
  ADD_PETROLIFE_CAR: "/petrolife-cars/add",
  PETROLIFE_CAR_DETAILS: "/petrolife-cars/:id",
  PETROLIFE_PRODUCTS: "/petrolife-products",
  ADD_PETROLIFE_PRODUCT: "/petrolife-products/add",
  PETROLIFE_PRODUCT_DETAILS: "/petrolife-products/:id",
  PETROLIFE_COUPONS: "/petrolife-coupons",
  ADD_PETROLIFE_COUPON: "/petrolife-coupons/add",
  PETROLIFE_COUPON_DETAILS: "/petrolife-coupons/:id",
  WALLET_REQUESTS: "/wallet-requests",
  WALLET_REQUEST_DETAILS: "/wallet-requests/:id",
  REFUND_REQUESTS: "/wallet-requests/moneyrefundrequests",
  REFUND_REQUEST_DETAILS: "/wallet-requests/moneyrefundrequests/:id",
  FUEL_DELIVERY_REQUESTS: "/fuel-delivery-requests",
  RECEIVED_DELIVERY_REQUESTS:
    "/fuel-delivery-requests/received-delivery-requests",
  RECEIVED_DELIVERY_REQUEST_DETAILS:
    "/fuel-delivery-requests/received-delivery-requests/:id",
  ADMIN_FINANCIAL_REPORTS: "/admin-financial-reports",
  ADMIN_INVOICE_REPORTS: "/admin-invoice-reports",
  ADMIN_SERVICE_PROVIDER_REPORTS: "/admin-service-provider-reports",
  ADMIN_REPRESENTATIVE_REPORTS: "/admin-representative-reports",
  ADMIN_WALLET_REPORTS: "/admin-wallet-reports",
  ADMIN_COUNTRIES: "/admin-countries",
  ADD_COUNTRY: "/admin-countries/add",
  COUNTRY_DETAILS: "/admin-countries/:id",
  ADD_CITY: "/admin-countries/:countryId/add-city",
  ADD_REGION: "/admin-countries/:countryId/add-region",
  ADMIN_CARS: "/admin-cars",
  ADMIN_CATEGORIES: "/admin-categories",
  ADD_CLASSIFICATION: "/admin-categories/add",
  CLASSIFICATION_DETAILS: "/admin-categories/:id",
  APPLICATION_SERVICES: "/application-services",
  APPLICATION_SERVICE_DETAILS: "/application-services/:id",
  ADD_SERVICE: "/application-services/add",
  ADD_CHOICE: "/application-services/add-choice",
  DEFAULT_ACCOUNTS: "/default-accounts",
  ADVERTISEMENTS: "/advertisements",
  ADD_ADVERTISEMENT: "/advertisements/add",
  ADVERTISEMENT_DETAILS: "/advertisements/:id",
  SPECIAL_NOTIFICATIONS: "/special-notifications",
  ADD_SPECIAL_NOTIFICATION: "/special-notifications/add",
  SPECIAL_NOTIFICATION_DETAILS: "/special-notifications/:id",
  ADMIN_SUBSCRIPTIONS: "/admin-subscriptions",
  ADMIN_COMMUNICATION_POLICIES: "/admin-communication-policies",
  FAQ: "/faq",
  CUSTOMER_MESSAGES: "/customer-messages",
} as const;

// Helper function to generate dynamic routes
export const generateRoute = (
  route: string,
  params: Record<string, string | number>
) => {
  let generatedRoute = route;
  Object.entries(params).forEach(([key, value]) => {
    generatedRoute = generatedRoute.replace(`:${key}`, String(value));
  });
  return generatedRoute;
};

// Helper function to check if a route matches the current path
export const isRouteMatch = (route: string, currentPath: string) => {
  // Convert route pattern to regex
  const pattern = route.replace(/:\w+/g, "[^/]+");
  const regex = new RegExp(`^${pattern}$`);
  return regex.test(currentPath);
};
