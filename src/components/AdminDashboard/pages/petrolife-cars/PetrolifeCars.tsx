import { DataTableSection } from "../../../sections/DataTableSection/DataTableSection";
import { Car } from "lucide-react";

const columns = [
  { key: "actions", label: "الإجراءات", width: "w-16", priority: "high" },
  {
    key: "drivers",
    label: "السائقون",
    width: "min-w-[150px]",
    priority: "high",
    render: (value: { name: string; avatar?: string }[]) => (
      <div className="flex items-center gap-1">
        {value.slice(0, 3).map((driver, idx) => (
          <div
            key={idx}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-xs"
          >
            {driver.avatar ? (
              <img
                src={driver.avatar}
                alt={driver.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              driver.name.charAt(0)
            )}
          </div>
        ))}
        {value.length > 3 && (
          <div className="text-xs text-gray-500">+{value.length - 3}</div>
        )}
      </div>
    ),
  },
  {
    key: "city",
    label: "المدينة",
    width: "min-w-[100px]",
    priority: "low",
  },
  {
    key: "carClassification",
    label: "تصنيف السيارة",
    width: "min-w-[120px]",
    priority: "high",
    render: (value: string) => (
      <div className="flex items-center gap-2">
        <Car className="w-4 h-4 text-gray-500" />
        <span className="font-medium">{value}</span>
      </div>
    ),
  },
  {
    key: "fuelType",
    label: "نوع الوقود",
    width: "min-w-[100px]",
    priority: "medium",
  },
  {
    key: "releaseYear",
    label: "سنة الاصدار",
    width: "min-w-[100px]",
    priority: "medium",
  },
  {
    key: "model",
    label: "الطراز",
    width: "min-w-[100px]",
    priority: "high",
  },
  {
    key: "brand",
    label: "الماركة",
    width: "min-w-[100px]",
    priority: "high",
  },
  {
    key: "carName",
    label: "اسم السيارة",
    width: "min-w-[150px]",
    priority: "high",
  },
  {
    key: "carNumber",
    label: "رقم السيارة",
    width: "min-w-[120px]",
    priority: "high",
  },
];

const fetchData = async () => [
  {
    id: 1,
    carNumber: "21A254",
    carName: "سيارة الطلبات",
    brand: "تيوتا",
    model: "كرولا",
    releaseYear: "2020",
    fuelType: "بنزين 91",
    carClassification: "صغيرة",
    city: "الرياض",
    drivers: [
      { name: "محمد مراد", avatar: undefined },
      { name: "أحمد محمد", avatar: undefined },
    ],
  },
  {
    id: 2,
    carNumber: "21A254",
    carName: "سيارة الطلبات",
    brand: "تيوتا",
    model: "كرولا",
    releaseYear: "2020",
    fuelType: "بنزين 91",
    carClassification: "كبيرة",
    city: "الرياض",
    drivers: [
      { name: "محمد مراد عبدالك", avatar: undefined },
      { name: "أحمد محمد", avatar: undefined },
      { name: "خالد علي", avatar: undefined },
    ],
  },
  {
    id: 3,
    carNumber: "21A254",
    carName: "سيارة الطلبات",
    brand: "تيوتا",
    model: "كرولا",
    releaseYear: "2020",
    fuelType: "بنزين 91",
    carClassification: "متوسطة",
    city: "الرياض",
    drivers: [
      { name: "محمد", avatar: undefined },
      { name: "أحمد", avatar: undefined },
    ],
  },
  {
    id: 4,
    carNumber: "21A254",
    carName: "سيارة الطلبات",
    brand: "تيوتا",
    model: "كرولا",
    releaseYear: "2020",
    fuelType: "بنزين 91",
    carClassification: "VIP",
    city: "الرياض",
    drivers: [
      { name: "محمد مراد", avatar: undefined },
      { name: "أحمد محمد", avatar: undefined },
    ],
  },
  {
    id: 5,
    carNumber: "21A254",
    carName: "سيارة الطلبات",
    brand: "تيوتا",
    model: "كرولا",
    releaseYear: "2020",
    fuelType: "بنزين 91",
    carClassification: "صغيرة",
    city: "الرياض",
    drivers: [
      { name: "محمد مراد", avatar: undefined },
      { name: "أحمد محمد", avatar: undefined },
    ],
  },
  {
    id: 6,
    carNumber: "21A254",
    carName: "سيارة الطلبات",
    brand: "تيوتا",
    model: "كرولا",
    releaseYear: "2020",
    fuelType: "بنزين 91",
    carClassification: "كبيرة",
    city: "الرياض",
    drivers: [
      { name: "محمد مراد", avatar: undefined },
      { name: "أحمد محمد", avatar: undefined },
    ],
  },
  {
    id: 7,
    carNumber: "21A254",
    carName: "سيارة الطلبات",
    brand: "تيوتا",
    model: "كرولا",
    releaseYear: "2020",
    fuelType: "بنزين 91",
    carClassification: "متوسطة",
    city: "الرياض",
    drivers: [
      { name: "محمد مراد", avatar: undefined },
      { name: "أحمد محمد", avatar: undefined },
    ],
  },
  {
    id: 8,
    carNumber: "21A254",
    carName: "سيارة الطلبات",
    brand: "تيوتا",
    model: "كرولا",
    releaseYear: "2020",
    fuelType: "بنزين 91",
    carClassification: "VIP",
    city: "الرياض",
    drivers: [
      { name: "محمد مراد", avatar: undefined },
      { name: "أحمد محمد", avatar: undefined },
    ],
  },
];

const PetrolifeCars = () => {
  return (
    <DataTableSection
      title="مركبات بترولايف (24)"
      entityName="مركبة"
      entityNamePlural="مركبات"
      icon={Car}
      columns={columns}
      fetchData={fetchData}
      addNewRoute="/petrolife-cars/add"
      viewDetailsRoute={(id) => `/petrolife-cars/${id}`}
      itemsPerPage={10}
    />
  );
};

export default PetrolifeCars;

