import { DataTableSection } from "../../../sections/DataTableSection/DataTableSection";
import { UserRound } from "lucide-react";
import { getAllPetrolifeAgents, deletePetrolifeAgent } from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";
import { useState } from "react";
import { ConfirmDialog } from "../../../shared/ConfirmDialog/ConfirmDialog";

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
            value.name?.charAt(0) || "?"
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

const fetchData = async () => {
  try {
    const agents = await getAllPetrolifeAgents();
    
    // Transform agents data to match table format
    return agents.map((agent) => ({
      id: agent.id,
      agentCode: agent.agentCode || "-",
      referenceNumber: agent.agentCode || "-", // Using agentCode as reference number
      agentName: {
        name: agent.name || "-",
        avatar: agent.imageUrl || undefined,
      },
      phone: agent.phone || "-",
      email: agent.email || "-",
      city: agent.city || "-",
      commission: agent.commissionValue?.toString() || "0",
      successfulReferrals: (agent.companies?.length || 0).toString(),
      accountStatus: {
        active: agent.isActive !== false,
        text: agent.isActive !== false ? "مفعل" : "معطل",
      },
    }));
  } catch (error) {
    console.error("Error fetching agents:", error);
    return [];
  }
};

const PetrolifeAgents = () => {
  const { addToast } = useToast();
  const [agentsData, setAgentsData] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    agentId: string | null;
    agentName: string;
  }>({
    isOpen: false,
    agentId: null,
    agentName: "",
  });

  // Fetch agents and store in state
  const fetchAgentsWithState = async () => {
    const data = await fetchData();
    setAgentsData(data);
    return data;
  };

  const handleToggleStatus = (id: number | string) => {
    console.log("Toggle status for agent:", id);
    // TODO: Implement actual status toggle logic
  };

  // Handle delete agent - open confirmation popup
  const handleDelete = (id: string | number) => {
    const agentId = String(id);

    // Find agent name for confirmation message
    const agent = agentsData.find((a) => a.id === agentId);
    const agentName = agent?.agentName?.name || "المندوب";

    // Open confirmation dialog
    setDeleteConfirm({
      isOpen: true,
      agentId,
      agentName,
    });
  };

  // Confirm and delete agent
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.agentId) return;

    try {
      // Delete from Firestore
      await deletePetrolifeAgent(deleteConfirm.agentId);

      // Show success message
      addToast({
        title: "نجح",
        message: `تم حذف ${deleteConfirm.agentName} بنجاح`,
        type: "success",
      });

      // Refresh the agents list by triggering refresh
      setRefreshTrigger((prev) => prev + 1);

      // Close confirmation popup
      setDeleteConfirm({
        isOpen: false,
        agentId: null,
        agentName: "",
      });
    } catch (error: any) {
      console.error("Error deleting agent:", error);
      addToast({
        title: "خطأ",
        message: error.message || "فشل في حذف المندوب",
        type: "error",
      });
    }
  };

  // Cancel delete
  const handleDeleteCancel = () => {
    setDeleteConfirm({
      isOpen: false,
      agentId: null,
      agentName: "",
    });
  };

  return (
    <>
      <DataTableSection
        title="مندوبو بترولايف"
        entityName="مندوب"
        entityNamePlural="مندوبين"
        icon={UserRound}
        columns={columns}
        fetchData={fetchAgentsWithState}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
        addNewRoute="/petrolife-agents/add"
        viewDetailsRoute={(id) => `/petrolife-agents/${id}`}
        itemsPerPage={10}
        refreshTrigger={refreshTrigger}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        title="حذف المندوب"
        message={`هل أنت متأكد من حذف المندوب "${deleteConfirm.agentName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default PetrolifeAgents;

