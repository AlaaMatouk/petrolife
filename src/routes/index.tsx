import { Routes, Route } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { LayoutWrapper } from "../components/shared/Layout";
import { AdminLayoutWrapper } from "../components/AdminDashboard";
import { ServiceDistributerLayoutWrapper } from "../components/ServiceDistributerDashboard";

// Import all screen components
import { Drivers } from "../screens/Drivers";
import { Cars } from "../screens/Cars";
import { FinancialReports } from "../screens/FinancialReports";
import { WalletReports } from "../screens/WalletReports";
import { Dashboard } from "../components/Dashboard";
import { Wallet } from "../screens/Wallet/Wallet";
import { AddDriver } from "../screens/AddDriver/AddDriver";
import { DriverDetails } from "../screens/DriverDetails/DriverDetails";
import { AddNewCar } from "../screens/AddNewCar/AddNewCar";
import { CarDetails } from "../screens/CarDetails/CarDetails";
import { MoneyReq } from "../components/AdminDashboard/pages/wallet-requests/MoneyReq";
import { WalletChargeRequests } from "../screens/ChargeRequests/WalletChargeRequests";
import { ChargeWallet } from "../screens/ChargeWallet";
import { PerolifeStationLocations } from "../screens/PerolifeStationLocations/perolifestationlocations";
import { StoreScreen } from "../screens/Store";
import { SubscriptionsScreen } from "../screens/Subscriptions";
import { DeliveryFuelRequests } from "../screens/DeliveryFuelRequests";
import { CreateDeliveryRequest } from "../screens/CreateDeliveryRequest";
import LoginAndRegister from "../screens/Login And Register/LoginAndRegister";
import { ServiceDistributerDashboard } from "../components/ServiceDistributerDashboard";
import { StationWorkers } from "../screens/StationWorkers/StationWorkers";
import { Stations } from "../screens/Stations";
import { TestTransfer } from "../screens/TestTransfer";
import StationWorkerDetails from "../screens/StationWorkerDetails/StationWorkerDetails";
import { FuelStationRequests } from "../screens/FuelStationRequests";
import { ServiceDistributerFinancialReports } from "../screens/ServiceDistributerFinancialReports";
import { ServiceDistributerStationLocations } from "../screens/ServiceDistributerStationLocations";
import { ServiceDistributerInvoices } from "../screens/ServiceDistributerInvoices";
import { Invoices } from "../screens/Invoices";
import { IconPreview } from "../screens/IconPreview";
// admin dashboard
import { AdminDashboard } from "../components/AdminDashboard/AdminDashboard";
import { Supervisors } from "../components/AdminDashboard/pages/supervisors/Supervisors";
import { AddSupervisor } from "../components/AdminDashboard/pages/supervisors/AddSupervisor";
import { SupervisorDetails } from "../components/AdminDashboard/pages/supervisors/SupervisorDetails";
import { Companies } from "../components/AdminDashboard/pages/companies/Companies";
import { AddCompany } from "../components/AdminDashboard/pages/companies/AddCompany";
import { CompanyDetails } from "../components/AdminDashboard/pages/companies/CompanyDetails";
import { Test } from "../screens/Test";
import { Individuals } from "../components/AdminDashboard/pages/Individuals/Individuals";
// @ts-ignore - JSX component imports
import { AddIndividuals } from "../components/AdminDashboard/pages/Individuals/AddIndividuals";
import { IndividualsDetails } from "../components/AdminDashboard/pages/Individuals/IndividualsDetails";
import { ServiceProviders } from "../components/AdminDashboard/pages/service-providers/ServiceProviders";
import { AddServiceProvider } from "../components/AdminDashboard/pages/service-providers/AddServiceProvider";
import { ServiceProvidersDetails } from "../components/AdminDashboard/pages/service-providers/ServiceProvidersDetails";
import { JoinRequests } from "../components/AdminDashboard/pages/service-providers/JoinRequests";
import { StationsDetails } from "../screens/StationsDetails/StationsDetails";
import { FuelStationRequestsDetails } from "../screens/FuelStationRequestsDetails";
import { AddStations } from "../screens/AddStations";
import { WalletReq } from "../components/AdminDashboard/pages/wallet-requests/WalletReq";
import { ReqRevision } from "../components/AdminDashboard/pages/wallet-requests/ReqRevision";
import { RefundRevision } from "../components/AdminDashboard/pages/wallet-requests/RefundRevision";
import { FuelDelivery } from "../components/AdminDashboard/pages/fuel-delivery/FuelDelivery";
import { ReceivedDeliveryReq } from "../components/AdminDashboard/pages/fuel-delivery/ReceivedDeliveryReq";
import { ReceivedDeliveryRevision } from "../components/AdminDashboard/pages/fuel-delivery/ReceivedDeliveryRevision";
import { Services } from "../components/AdminDashboard/pages/services/Services";
import { ServiceDetails } from "../components/AdminDashboard/pages/services/ServiceDetails";
import { AddService } from "../components/AdminDashboard/pages/services/AddService";
import { AddChoice } from "../components/AdminDashboard/pages/services/AddChoice";
import { FinancialReport } from "../components/AdminDashboard/pages/financial-report";
import { ServiceProviderReport } from "../components/AdminDashboard/pages/service-provider-report";
import { WalletReport } from "../components/AdminDashboard/pages/wallet-report";
import { ServiceDistributerGeneralInformation } from "../screens/ServiceDistributerGeneralInformation";

// 404 Component
const NotFound = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-700 mb-4">404</h1>
      <p className="text-gray-500 text-lg">الصفحة غير موجودة</p>
    </div>
  </div>
);

// App Router using regular React Router with Layout Wrapper
export const AppRouter = () => {
  return (
    <Routes>
      {/* Authentication - No Layout */}
      <Route path={ROUTES.LOGIN} element={<LoginAndRegister />} />

      {/* Admin Dashboard with AdminLayoutWrapper */}
      <Route element={<AdminLayoutWrapper />}>
        <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
        <Route path={ROUTES.SUPERVISORS} element={<Supervisors />} />
        <Route path={ROUTES.ADD_SUPERVISOR} element={<AddSupervisor />} />
        <Route
          path={ROUTES.SUPERVISOR_DETAILS}
          element={<SupervisorDetails />}
        />
        <Route path={ROUTES.COMPANIES} element={<Companies />} />
        <Route path={ROUTES.ADD_COMPANY} element={<AddCompany />} />
        <Route path={ROUTES.COMPANY_DETAILS} element={<CompanyDetails />} />
        <Route path={ROUTES.INDIVIDUALS} element={<Individuals />} />
        <Route path={ROUTES.ADD_INDIVIDUAL} element={<AddIndividuals />} />
        <Route
          path={ROUTES.INDIVIDUAL_DETAILS}
          element={<IndividualsDetails />}
        />
        <Route path={ROUTES.SERVICE_PROVIDERS} element={<ServiceProviders />} />
        <Route
          path={ROUTES.ADD_SERVICE_PROVIDER}
          element={<AddServiceProvider />}
        />
        <Route
          path={ROUTES.SERVICE_PROVIDER_JOIN_REQUESTS}
          element={<JoinRequests />}
        />
        <Route
          path={ROUTES.SERVICE_PROVIDER_DETAILS}
          element={<ServiceProvidersDetails />}
        />
        <Route path={ROUTES.WALLET_REQUESTS} element={<WalletReq />} />
        <Route path={ROUTES.WALLET_REQUEST_DETAILS} element={<ReqRevision />} />
        <Route path={ROUTES.REFUND_REQUESTS} element={<MoneyReq />} />
        <Route
          path={ROUTES.REFUND_REQUEST_DETAILS}
          element={<RefundRevision />}
        />
        <Route
          path={ROUTES.FUEL_DELIVERY_REQUESTS}
          element={<FuelDelivery />}
        />
        <Route
          path={ROUTES.RECEIVED_DELIVERY_REQUESTS}
          element={<ReceivedDeliveryReq />}
        />
        <Route
          path={ROUTES.RECEIVED_DELIVERY_REQUEST_DETAILS}
          element={<ReceivedDeliveryRevision />}
        />
        <Route path={ROUTES.APPLICATION_SERVICES} element={<Services />} />
        <Route
          path={ROUTES.APPLICATION_SERVICE_DETAILS}
          element={<ServiceDetails />}
        />
        <Route path={ROUTES.ADD_SERVICE} element={<AddService />} />
        <Route path={ROUTES.ADD_CHOICE} element={<AddChoice />} />
        <Route
          path={ROUTES.ADMIN_FINANCIAL_REPORTS}
          element={<FinancialReport />}
        />
        <Route
          path={ROUTES.ADMIN_SERVICE_PROVIDER_REPORTS}
          element={<ServiceProviderReport />}
        />
        <Route path={ROUTES.ADMIN_WALLET_REPORTS} element={<WalletReport />} />
      </Route>

      {/* Service Distributer Routes with ServiceDistributerLayoutWrapper */}
      <Route element={<ServiceDistributerLayoutWrapper />}>
        <Route
          path={ROUTES.SERVICE_DISTRIBUTER_DASHBOARD}
          element={<ServiceDistributerDashboard />}
        />
        <Route path={ROUTES.STATION_WORKERS} element={<StationWorkers />} />
        <Route
          path={ROUTES.STATION_WORKER_DETAILS}
          element={<StationWorkerDetails />}
        />
        <Route path={ROUTES.STATIONS} element={<Stations />} />
        <Route path={ROUTES.ADD_STATIONS} element={<AddStations />} />
        <Route path={ROUTES.STATIONS_DETAILS} element={<StationsDetails />} />
        <Route
          path={ROUTES.FUEL_STATION_REQUESTS}
          element={<FuelStationRequests />}
        />
        <Route
          path={ROUTES.FUEL_STATION_REQUESTS_DETAILS}
          element={<FuelStationRequestsDetails />}
        />
        <Route
          path={ROUTES.SERVICE_DISTRIBUTER_FINANCIAL_REPORTS}
          element={<ServiceDistributerFinancialReports />}
        />
        <Route
          path={ROUTES.SERVICE_DISTRIBUTER_STATION_LOCATIONS}
          element={<ServiceDistributerStationLocations />}
        />
        <Route
          path={ROUTES.SERVICE_DISTRIBUTER_INVOICES}
          element={<ServiceDistributerInvoices />}
        />
        <Route
          path={ROUTES.SERVICE_DISTRIBUTER_GENERAL_INFORMATION}
          element={<ServiceDistributerGeneralInformation />}
        />
      </Route>

      {/* All Protected Routes with Layout Wrapper */}
      <Route element={<LayoutWrapper />}>
        {/* Main Dashboard */}
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />

        {/* Resource Management */}
        <Route path={ROUTES.DRIVERS} element={<Drivers />} />
        <Route path={ROUTES.ADD_DRIVER} element={<AddDriver />} />
        <Route path={ROUTES.DRIVER_DETAILS} element={<DriverDetails />} />
        <Route path={ROUTES.CARS} element={<Cars />} />
        <Route path={ROUTES.ADD_CAR} element={<AddNewCar />} />
        <Route path={ROUTES.CAR_DETAILS} element={<CarDetails />} />

        {/* Wallet and Financial */}
        <Route path={ROUTES.WALLET} element={<Wallet />} />
        <Route path={ROUTES.CHARGE_WALLET} element={<ChargeWallet />} />
        <Route path={ROUTES.FINANCIAL_REPORTS} element={<FinancialReports />} />
        <Route path={ROUTES.WALLET_REPORTS} element={<WalletReports />} />

        {/* Operations */}
        <Route path={ROUTES.FUEL_DELIVERY} element={<DeliveryFuelRequests />} />
        <Route
          path={ROUTES.CREATE_DELIVERY_REQUEST}
          element={<CreateDeliveryRequest />}
        />

        <Route
          path={ROUTES.CHARGE_REQUESTS}
          element={<WalletChargeRequests />}
        />
        <Route
          path={ROUTES.PEROLIFE_STATION_LOCATIONS}
          element={<PerolifeStationLocations />}
        />

        {/* Store and Subscriptions */}
        <Route path={ROUTES.STORE} element={<StoreScreen />} />
        <Route path={ROUTES.SUBSCRIPTIONS} element={<SubscriptionsScreen />} />

        {/* Invoices */}
        <Route path={ROUTES.INVOICES} element={<Invoices />} />

        {/* Settings */}
        <Route path={ROUTES.SETTINGS} element={<NotFound />} />

        {/* Test Routes */}
        <Route path={ROUTES.TEST} element={<Test />} />
        <Route path="/test-transfer" element={<TestTransfer />} />

        {/* Developer Tools */}
        <Route path="/icons" element={<IconPreview />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};
