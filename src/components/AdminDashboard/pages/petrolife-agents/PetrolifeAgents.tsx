import { DataTableSection } from "../../../sections/DataTableSection/DataTableSection";
import { UserRound } from "lucide-react";

const columns = [
  { key: "actions", label: "الإجراءات", width: "w-16", priority: "high" },
  {
    key: "accountStatus",
    label: "حالة الحساب",
    width: "min-w-[120px]",
    priority: "high",
  },
  {
    key: "successfulReferrals",
    label: "الإحالات الناجحة",
    width: "min-w-[120px]",
    priority: "medium",
  },
  {
    key: "commission",
    label: "العمولة (%)",
    width: "min-w-[100px]",
    priority: "medium",
  },
  { key: "agentCode", label: "كود المندوب", priority: "high" },
  { key: "city", label: "المدينة", priority: "low" },
  { key: "phone", label: "رقم الهاتف", priority: "medium" },
  {
    key: "agentName",
    label: "اسم المندوب",
    width: "min-w-[150px]",
    priority: "high",
    render: (value: { name: string; avatar?: string }, row: any) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold text-sm">
          {value.avatar ? (
            <img
              src={value.avatar}
              alt={value.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            value.name.charAt(0)
          )}
        </div>
        <span className="font-medium text-gray-900">{value.name}</span>
      </div>
    ),
  },
  {
    key: "referenceNumber",
    label: "الرقم المرجعي",
    width: "min-w-[120px]",
    priority: "high",
  },
];

const fetchData = async () => [
  {
    id: 1,
    agentCode: "21A254",
    referenceNumber: "REF001",
    agentName: { name: "أحمد محمد" },
    phone: "00965284358",
    email: "ahmedmohamed@gmail.com",
    city: "الرياض",
    commission: "2",
    successfulReferrals: "42",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 2,
    agentCode: "21A255",
    referenceNumber: "REF002",
    agentName: { name: "محمد أحمد" },
    phone: "00965284359",
    email: "mohamedahmed@gmail.com",
    city: "الرياض",
    commission: "6",
    successfulReferrals: "38",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 3,
    agentCode: "21A256",
    referenceNumber: "REF003",
    agentName: { name: "علي حسن" },
    phone: "00965284360",
    email: "alihassan@gmail.com",
    city: "الرياض",
    commission: "10",
    successfulReferrals: "52",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 4,
    agentCode: "21A257",
    referenceNumber: "REF004",
    agentName: { name: "حسن علي" },
    phone: "00965284361",
    email: "hassanali@gmail.com",
    city: "الرياض",
    commission: "4",
    successfulReferrals: "28",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 5,
    agentCode: "21A258",
    referenceNumber: "REF005",
    agentName: { name: "محمود سعد" },
    phone: "00965284362",
    email: "mahmoudsaad@gmail.com",
    city: "الرياض",
    commission: "8",
    successfulReferrals: "45",
    accountStatus: { active: true, text: "مفعل" },
  },
  {
    id: 6,
    agentCode: "21A259",
    referenceNumber: "REF006",
    agentName: { name: "سعد محمود" },
    phone: "00965284363",
    email: "saadmahmoud@gmail.com",
    city: "الرياض",
    commission: "2",
    successfulReferrals: "12",
    accountStatus: { active: false, text: "معطل" },
  },
  {
    id: 7,
    agentCode: "21A260",
    referenceNumber: "REF007",
    agentName: { name: "يوسف إبراهيم" },
    phone: "00965284364",
    email: "yousefibrahim@gmail.com",
    city: "الرياض",
    commission: "6",
    successfulReferrals: "0",
    accountStatus: { active: false, text: "معطل" },
  },
  {
    id: 8,
    agentCode: "21A261",
    referenceNumber: "REF008",
    agentName: { name: "إبراهيم يوسف" },
    phone: "00965284365",
    email: "ibrahimyousef@gmail.com",
    city: "الرياض",
    commission: "10",
    successfulReferrals: "22",
    accountStatus: { active: false, text: "معطل" },
  },
];

const PetrolifeAgents = () => {
  const handleToggleStatus = (id: number | string) => {
    console.log("Toggle status for agent:", id);
    // TODO: Implement actual status toggle logic
  };

  return (
    <DataTableSection
      title="مندوبو بترولايف (24)"
      entityName="مندوب"
      entityNamePlural="مندوبين"
      icon={UserRound}
      columns={columns}
      fetchData={fetchData}
      onToggleStatus={handleToggleStatus}
      addNewRoute="/petrolife-agents/add"
      viewDetailsRoute={(id) => `/petrolife-agents/${id}`}
      itemsPerPage={10}
    />
  );
};

export default PetrolifeAgents;

