import { DataTableSection } from "../../../sections/DataTableSection/DataTableSection";
import { UserRound } from "lucide-react";
import { fetchDrivers } from "../../../../services/firestore";

interface PetrolifeDriverRow {
  id: string;
  driverCode: string;
  driverName: string;
  phone: string;
  email: string;
  city: string;
  carNumber: string;
  status: string;
}

const columns = [
  { key: "actions", label: "الإجراءات", width: "w-16", priority: "high" },
  {
    key: "status",
    label: "حالة الحساب",
    width: "min-w-[120px]",
    priority: "high",
    render: (value: string) => (
      <span className={value === "نشط" ? "text-green-700" : "text-gray-500"}>
        {value}
      </span>
    ),
  },
  { key: "carNumber", label: "رقم السيارة", priority: "medium" },
  { key: "city", label: "المدينة", priority: "medium" },
  { key: "email", label: "البريد الإلكتروني", priority: "low" },
  { key: "phone", label: "رقم الهاتف", priority: "medium" },
  { key: "driverName", label: "اسم السائق", priority: "high" },
  { key: "driverCode", label: "كود السائق", priority: "high" },
];

const mapDriverToRow = (driver: any): PetrolifeDriverRow => {
  const driverCodeValue =
    driver?.id ?? driver?.uId ?? (driver?.docId ? String(driver.docId) : "-");

  const fallbackId =
    driver?.docId ??
    driver?.id ??
    driver?.uId ??
    `driver-${Math.random().toString(36).slice(2, 11)}`;

  const cityValue =
    driver?.city && typeof driver.city === "object"
      ? driver.city?.name?.ar || driver.city?.name?.en
      : undefined;

  const carNumberValue =
    driver?.car?.plateNumber?.en ||
    driver?.car?.plateNumber?.ar ||
    driver?.car?.plateNumber ||
    "-";

  return {
    id: String(fallbackId),
    driverCode: driverCodeValue ? String(driverCodeValue) : "-",
    driverName: driver?.name ? String(driver.name) : "-",
    phone: driver?.phoneNumber ? String(driver.phoneNumber) : "-",
    email: driver?.email ? String(driver.email) : "-",
    city: cityValue ? String(cityValue) : "غير محدد",
    carNumber: carNumberValue ? String(carNumberValue) : "-",
    status: driver?.isActive === true ? "نشط" : "معطل",
  };
};

const fetchData = async (): Promise<PetrolifeDriverRow[]> => {
  try {
    const drivers = await fetchDrivers();
    return drivers.map(mapDriverToRow);
  } catch (error) {
    console.error("Error fetching Petrolife drivers:", error);
    return [];
  }
};

const PetrolifeDrivers = () => {
  return (
    <DataTableSection
      title="سائقي بترولايف"
      entityName="سائق"
      entityNamePlural="سائقين"
      icon={UserRound}
      columns={columns}
      fetchData={fetchData}
      addNewRoute="/petrolife-drivers/add"
      viewDetailsRoute={(id) => `/petrolife-drivers/${id}`}
      itemsPerPage={10}
    />
  );
};

export default PetrolifeDrivers;
