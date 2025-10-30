import { DataTableSection } from "../../../sections/DataTableSection/DataTableSection";
import { UserRound } from "lucide-react";

const columns = [
  { key: "actions", label: "الإجراءات", width: "w-16", priority: "high" },
  {
    key: "accountStatus",
    label: "حالة الحساب",
    width: "min-w-[120px]",
    priority: "high",
    render: (value: { active: boolean; text: string }) => (
      <span className={value.active ? "text-green-700" : "text-gray-500"}>
        {value.text}
      </span>
    ),
  },
  { key: "carNumber", label: "رقم السيارة", priority: "medium" },
  { key: "city", label: "المدينة", priority: "low" },
  { key: "email", label: "البريد الإلكتروني", priority: "low" },
  { key: "phone", label: "رقم الهاتف", priority: "medium" },
  { key: "driverName", label: "اسم السائق", priority: "high" },
  { key: "driverCode", label: "كود السائق", priority: "high" },
];

const fetchData = async () => [
  {
    id: 1,
    driverCode: "21A254",
    driverName: "أحمد محمد",
    phone: "00965284358",
    email: "ahmedmohamed@gmail.com",
    city: "الرياض",
    carNumber: "2145224",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 2,
    driverCode: "21A254",
    driverName: "أحمد محمد",
    phone: "00965284358",
    email: "ahmedmohamed@gmail.com",
    city: "الرياض",
    carNumber: "2145224",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 3,
    driverCode: "21A254",
    driverName: "أحمد محمد",
    phone: "00965284358",
    email: "ahmedmohamed@gmail.com",
    city: "الرياض",
    carNumber: "2145224",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 4,
    driverCode: "21A254",
    driverName: "أحمد محمد",
    phone: "00965284358",
    email: "ahmedmohamed@gmail.com",
    city: "الرياض",
    carNumber: "2145224",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 5,
    driverCode: "21A254",
    driverName: "أحمد محمد",
    phone: "00965284358",
    email: "ahmedmohamed@gmail.com",
    city: "الرياض",
    carNumber: "2145224",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 6,
    driverCode: "21A254",
    driverName: "أحمد محمد",
    phone: "00965284358",
    email: "ahmedmohamed@gmail.com",
    city: "الرياض",
    carNumber: "2145224",
    accountStatus: { active: false, text: "معطل" },
  },
  {
    id: 7,
    driverCode: "21A254",
    driverName: "أحمد محمد",
    phone: "00965284358",
    email: "ahmedmohamed@gmail.com",
    city: "الرياض",
    carNumber: "2145224",
    accountStatus: { active: false, text: "معطل" },
  },
  {
    id: 8,
    driverCode: "21A254",
    driverName: "أحمد محمد",
    phone: "00965284358",
    email: "ahmedmohamed@gmail.com",
    city: "الرياض",
    carNumber: "2145224",
    accountStatus: { active: false, text: "معطل" },
  },
  {
    id: 9,
    driverCode: "21A254",
    driverName: "أحمد محمد",
    phone: "00965284358",
    email: "ahmedmohamed@gmail.com",
    city: "الرياض",
    carNumber: "2145224",
    accountStatus: { active: false, text: "معطل" },
  },
  {
    id: 10,
    driverCode: "21A254",
    driverName: "أحمد محمد",
    phone: "00965284358",
    email: "ahmedmohamed@gmail.com",
    city: "الرياض",
    carNumber: "2145224",
    accountStatus: { active: false, text: "معطل" },
  },
  {
    id: 11,
    driverCode: "21A254",
    driverName: "أحمد محمد",
    phone: "00965284358",
    email: "ahmedmohamed@gmail.com",
    city: "الرياض",
    carNumber: "2145224",
    accountStatus: { active: false, text: "معطل" },
  },
  {
    id: 12,
    driverCode: "21A254",
    driverName: "أحمد محمد",
    phone: "00965284358",
    email: "ahmedmohamed@gmail.com",
    city: "الرياض",
    carNumber: "2145224",
    accountStatus: { active: false, text: "معطل" },
  },
];

const PetrolifeDrivers = () => {
  return (
    <DataTableSection
      title="سائقو بترولايف (24)"
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
