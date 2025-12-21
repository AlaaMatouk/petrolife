import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Table, Pagination } from "../../../shared";
import {
  ArrowLeft,
  UserRound,
  MoreVertical,
  Download,
  FileSpreadsheet,
  FileText,
  Building2,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { createPortal } from "react-dom";
import {
  getPetrolifeAgentById,
  addCompanyToAgent,
  removeCompanyFromAgent,
  fetchAllCompanies,
} from "../../../../services/firestore";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import { AddCompanyModal } from "./AddCompanyModal";
import { useToast } from "../../../../context/ToastContext";
import { Timestamp } from "firebase/firestore";
import { ConfirmDialog } from "../../../shared/ConfirmDialog/ConfirmDialog";

const ExportMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const updateMenuPosition = () => {
    if (!buttonRef) return;
    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 150;
    const viewportWidth = window.innerWidth;
    let left = rect.right + 4;
    if (left + menuWidth > viewportWidth) left = rect.left - menuWidth - 4;
    setMenuPosition({ top: rect.bottom + 4, left: Math.max(4, left) });
  };

  const handleExport = (format: "excel" | "pdf") => {
    console.log("Export companies as", format);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={setButtonRef}
        onClick={() => {
          setIsOpen((v) => !v);
          setTimeout(updateMenuPosition, 0);
        }}
        className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray"
      >
        <div className="flex items-center gap-[var(--corner-radius-small)]">
          <span className="font-body-body-2 text-[length:var(--body-body-2-font-size)] text-color-mode-text-icons-t-sec [direction:rtl]">
            تصدير
          </span>
          <Download className="w-4 h-4 text-gray-500" />
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {createPortal(
            <div
              className="fixed w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
            >
              <div className="py-1">
                <button
                  onClick={() => handleExport("excel")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2"
                >
                  <span>ملف Excel</span>
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2"
                >
                  <span>ملف PDF</span>
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
};

const PetrolifeAgentDetails = (): JSX.Element => {
  const navigate = useNavigate();
  const { id: agentId } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [agent, setAgent] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    companyId: string | null;
    companyName: string;
  }>({
    isOpen: false,
    companyId: null,
    companyName: "",
  });

  // Format date helper
  const formatDate = (timestamp: Timestamp | null | undefined): string => {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (error) {
      return "-";
    }
  };

  // Fetch agent and companies data
  useEffect(() => {
    const fetchData = async () => {
      if (!agentId) {
        addToast({
          title: "خطأ",
          message: "معرف المندوب غير موجود",
          type: "error",
        });
        navigate("/petrolife-agents");
        return;
      }

      setLoading(true);
      try {
        const agentData = await getPetrolifeAgentById(agentId);
        if (!agentData) {
          addToast({
            title: "خطأ",
            message: "المندوب غير موجود",
            type: "error",
          });
          navigate("/petrolife-agents");
          return;
        }

        setAgent(agentData);

        // Fetch companies if agent has companies
        if (agentData.companies && agentData.companies.length > 0) {
          const allCompanies = await fetchAllCompanies();
          
          // Fetch cars and drivers collections to count them
          const [carsSnapshot, driversSnapshot] = await Promise.all([
            getDocs(collection(db, "companies-cars")),
            getDocs(collection(db, "companies-drivers")),
          ]);
          
          // Normalize agent's company IDs for comparison (they are emails/document IDs)
          const normalizedAgentCompanyIds = new Set(
            agentData.companies.map((id: string) => String(id || "").toLowerCase().trim())
          );
          
          const agentCompanies = allCompanies.filter((company: any) => {
            // Check document ID (which is the email)
            const companyId = String(company.id || "").toLowerCase().trim();
            const idMatch = normalizedAgentCompanyIds.has(companyId);
            
            // Also check email field as fallback
            const companyEmail = String(company.email || "").toLowerCase().trim();
            const emailMatch = normalizedAgentCompanyIds.has(companyEmail);
            
            return idMatch || emailMatch;
          });
          
          console.log("Agent companies filter:", {
            agentCompanyIds: agentData.companies,
            normalizedIds: Array.from(normalizedAgentCompanyIds),
            foundCompanies: agentCompanies.map((c: any) => ({
              id: c.id,
              email: c.email,
              name: c.name
            }))
          });

          // Transform companies for table display with car and driver counts
          const transformedCompanies = agentCompanies.map((company: any) => {
            const city =
              company.formattedLocation?.address?.city || company.city || "-";
            const subscriptionTitle = company.selectedSubscription?.title;
            let subscription = "-";
            if (subscriptionTitle) {
              if (typeof subscriptionTitle === "string") {
                subscription = subscriptionTitle;
              } else if (typeof subscriptionTitle === "object" && subscriptionTitle.ar) {
                subscription = subscriptionTitle.ar;
              } else if (typeof subscriptionTitle === "object" && subscriptionTitle.en) {
                subscription = subscriptionTitle.en;
              }
            }

            // Get company email for counting
            const companyEmail = (company.email || company.id || "").toLowerCase().trim();
            const companyUid = company.uId || "";

            // Count cars for this company
            let carsCount = 0;
            carsSnapshot.forEach((carDoc) => {
              const carData = carDoc.data();
              const carEmail =
                carData.email || carData.companyEmail || carData.createdUserId || "";
              const carUid = carData.uId || carData.companyUid || "";

              // Check by UID first, then by email
              const uidMatch = carUid && companyUid && carUid === companyUid;
              const emailMatch =
                carEmail &&
                companyEmail &&
                carEmail.toLowerCase() === companyEmail.toLowerCase();

              if (uidMatch || emailMatch) {
                carsCount++;
              }
            });

            // Count drivers for this company
            let driversCount = 0;
            driversSnapshot.forEach((driverDoc) => {
              const driverData = driverDoc.data();
              const driverEmail =
                driverData.createdUserId ||
                driverData.email ||
                driverData.companyEmail ||
                "";
              const driverUid = driverData.uId || driverData.companyUid || "";

              // Check by UID first, then by email
              const uidMatch = driverUid && companyUid && driverUid === companyUid;
              const emailMatch =
                driverEmail &&
                companyEmail &&
                driverEmail.toLowerCase() === companyEmail.toLowerCase();

              if (uidMatch || emailMatch) {
                driversCount++;
              }
            });

            return {
              id: company.id,
              companyCode: company.refid || "-",
              companyName: {
                name: company.name || "-",
                logo: company.logo || undefined,
              },
              phone: company.phoneNumber || "-",
              email: company.email || "-",
              city: city,
              cars: carsCount.toString(),
              drivers: driversCount.toString(),
              subscription: subscription,
            };
          });

          setCompanies(transformedCompanies);
        } else {
          setCompanies([]);
        }
      } catch (error) {
        console.error("Error fetching agent data:", error);
        addToast({
          title: "خطأ",
          message: "حدث خطأ أثناء تحميل بيانات المندوب",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId, navigate, addToast]);

  // Helper function to refresh companies list
  const refreshCompaniesList = async () => {
    if (!agentId) return;

    try {
      const agentData = await getPetrolifeAgentById(agentId);
      if (agentData) {
        setAgent(agentData);
        
        if (agentData.companies && agentData.companies.length > 0) {
          const allCompanies = await fetchAllCompanies();
          
          // Fetch cars and drivers collections to count them
          const [carsSnapshot, driversSnapshot] = await Promise.all([
            getDocs(collection(db, "companies-cars")),
            getDocs(collection(db, "companies-drivers")),
          ]);
          
          // Normalize agent's company IDs for comparison (they are emails/document IDs)
          const normalizedAgentCompanyIds = new Set(
            agentData.companies.map((id: string) => String(id || "").toLowerCase().trim())
          );
          
          const agentCompanies = allCompanies.filter((company: any) => {
            // Check document ID (which is the email)
            const companyId = String(company.id || "").toLowerCase().trim();
            const idMatch = normalizedAgentCompanyIds.has(companyId);
            
            // Also check email field as fallback
            const companyEmail = String(company.email || "").toLowerCase().trim();
            const emailMatch = normalizedAgentCompanyIds.has(companyEmail);
            
            return idMatch || emailMatch;
          });

          const transformedCompanies = agentCompanies.map((company: any) => {
            const city =
              company.formattedLocation?.address?.city || company.city || "-";
            const subscriptionTitle = company.selectedSubscription?.title;
            let subscription = "-";
            if (subscriptionTitle) {
              if (typeof subscriptionTitle === "string") {
                subscription = subscriptionTitle;
              } else if (typeof subscriptionTitle === "object" && subscriptionTitle.ar) {
                subscription = subscriptionTitle.ar;
              } else if (typeof subscriptionTitle === "object" && subscriptionTitle.en) {
                subscription = subscriptionTitle.en;
              }
            }

            // Get company email for counting
            const companyEmail = (company.email || company.id || "").toLowerCase().trim();
            const companyUid = company.uId || "";

            // Count cars for this company
            let carsCount = 0;
            carsSnapshot.forEach((carDoc) => {
              const carData = carDoc.data();
              const carEmail =
                carData.email || carData.companyEmail || carData.createdUserId || "";
              const carUid = carData.uId || carData.companyUid || "";

              // Check by UID first, then by email
              const uidMatch = carUid && companyUid && carUid === companyUid;
              const emailMatch =
                carEmail &&
                companyEmail &&
                carEmail.toLowerCase() === companyEmail.toLowerCase();

              if (uidMatch || emailMatch) {
                carsCount++;
              }
            });

            // Count drivers for this company
            let driversCount = 0;
            driversSnapshot.forEach((driverDoc) => {
              const driverData = driverDoc.data();
              const driverEmail =
                driverData.createdUserId ||
                driverData.email ||
                driverData.companyEmail ||
                "";
              const driverUid = driverData.uId || driverData.companyUid || "";

              // Check by UID first, then by email
              const uidMatch = driverUid && companyUid && driverUid === companyUid;
              const emailMatch =
                driverEmail &&
                companyEmail &&
                driverEmail.toLowerCase() === companyEmail.toLowerCase();

              if (uidMatch || emailMatch) {
                driversCount++;
              }
            });

            return {
              id: company.id,
              companyCode: company.refid || "-",
              companyName: {
                name: company.name || "-",
                logo: company.logo || undefined,
              },
              phone: company.phoneNumber || "-",
              email: company.email || "-",
              city: city,
              cars: carsCount.toString(),
              drivers: driversCount.toString(),
              subscription: subscription,
            };
          });

          setCompanies(transformedCompanies);
        } else {
          setCompanies([]);
        }
      }
    } catch (error) {
      console.error("Error refreshing companies list:", error);
    }
  };

  const handleDeleteCompany = (companyId: string, companyName: string) => {
    setDeleteConfirm({
      isOpen: true,
      companyId,
      companyName,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!agentId || !deleteConfirm.companyId) return;

    try {
      await removeCompanyFromAgent(agentId, deleteConfirm.companyId);
      
      addToast({
        title: "نجح",
        message: `تم حذف الشركة "${deleteConfirm.companyName}" بنجاح`,
        type: "success",
      });

      // Close confirmation dialog
      setDeleteConfirm({
        isOpen: false,
        companyId: null,
        companyName: "",
      });

      // Refresh companies list
      await refreshCompaniesList();
    } catch (error: any) {
      console.error("Error deleting company:", error);
      addToast({
        title: "خطأ",
        message: error.message || "حدث خطأ أثناء حذف الشركة",
        type: "error",
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({
      isOpen: false,
      companyId: null,
      companyName: "",
    });
  };

  // Define columns - must be before conditional returns (Rules of Hooks)
  const columns = useMemo(
    () => [
      {
        key: "companyCode",
        label: "كود الشركة",
        width: "min-w-[120px]",
        priority: "high",
      },
      {
        key: "companyName",
        label: "اسم الشركة",
        width: "min-w-[180px]",
        priority: "high",
        render: (value: { name: string; logo?: string }) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
              {value.logo ? (
                <img
                  src={value.logo}
                  alt={value.name}
                  className="w-full h-full rounded object-cover"
                />
              ) : (
                <Building2 className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <span className="font-medium text-gray-900">{value.name}</span>
          </div>
        ),
      },
      {
        key: "phone",
        label: "رقم الهاتف",
        width: "min-w-[130px]",
        priority: "high",
      },
      {
        key: "email",
        label: "البريد الألكتروني",
        width: "min-w-[150px]",
        priority: "medium",
      },
      {
        key: "city",
        label: "المدينة",
        width: "min-w-[100px]",
        priority: "medium",
      },
      {
        key: "cars",
        label: "السيارات",
        width: "min-w-[90px]",
        priority: "high",
      },
      {
        key: "drivers",
        label: "السائقين",
        width: "min-w-[90px]",
        priority: "high",
      },
      {
        key: "subscription",
        label: "الاشتراكات",
        width: "min-w-[120px]",
        priority: "high",
        render: (value: string) => (
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            {value}
          </span>
        ),
      },
      {
        key: "actions",
        label: "الإجراءات",
        width: "w-16",
        priority: "high",
        render: (value: any, row: any) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (row?.id) {
                handleDeleteCompany(row.id, row.companyName?.name || "هذه الشركة");
              }
            }}
            className="p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-700 transition-colors"
            title="حذف الشركة"
            aria-label="حذف الشركة"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ),
      },
    ],
    []
  );

  const columnsReversed = useMemo(
    () => [...(columns as any[])].reverse(),
    [columns]
  );

  const paginated = useMemo(
    () =>
      companies.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [currentPage, companies]
  );

  const handleAddCompany = async (companyId: string) => {
    if (!agentId) return;

    try {
      await addCompanyToAgent(agentId, companyId);
      await refreshCompaniesList();
    } catch (error: any) {
      throw error; // Let modal handle the error
    }
  };

  // Conditional returns must come AFTER all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">جاري التحميل...</div>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <div className="flex flex-col w-full items-start gap-5">
      {/* Header */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <div className="flex items-center justify-between w-full">
          {/* Title on right */}
          <div className="flex items-center justify-end gap-1.5">
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              معلومات المندوب
            </h1>
            <UserRound className="w-5 h-5 text-gray-500" />
          </div>
          {/* Back button on left */}
          <button
            onClick={() => navigate(-1)}
            aria-label="رجوع"
            className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)]"
          >
            <div className="flex w-10 h-10 items-center justify-center bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </div>
          </button>
        </div>

        {/* Agent info - read-only inputs style (3 columns) */}
        <section className="flex flex-col items-start gap-5 relative self-stretch w-full">
          <div className="flex items-start gap-5 w-full">
            {/* Avatar */}
            <div className="flex flex-col items-center justify-center gap-2">
              {agent.imageUrl ? (
                <img
                  src={agent.imageUrl}
                  alt={agent.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold">
                  {agent.name?.charAt(0) || "?"}
              </div>
              )}
            </div>
          </div>

          {/* Agent Name */}
          <div className="w-full">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              اسم المندوب
            </label>
            <div className="text-lg font-semibold text-gray-900">
              {agent.name || "-"}
            </div>
          </div>

          {/* Bordered frame around read-only fields */}
          <div className="w-full rounded-[var(--corner-radius-large)] border border-color-mode-text-icons-t-placeholder bg-white p-4 shadow-sm">
            {(() => {
              const fields = [
                { label: "البريد الإلكتروني", value: agent.email || "-" },
                { label: "رقم الهاتف", value: agent.phone || "-" },
                { label: "المدينة", value: agent.city || "-" },
                { label: "العنوان", value: agent.address || "-" },
                { label: "تاريخ الانضمام", value: formatDate(agent.joinDate) },
                { label: "كود المندوب", value: agent.agentCode || "-" },
                { label: "قيمة العمولة (%)", value: agent.commissionValue?.toString() || "0" },
                { label: "عدد الشركات المضافة", value: (agent.companies?.length || 0).toString() },
              ];

              const rows = [] as JSX.Element[];
              for (let i = 0; i < fields.length; i += 3) {
                const row = fields.slice(i, i + 3);
                rows.push(
                  <div key={i} className="flex items-start gap-5 w-full mb-4">
                    {row.map((f, idx) => (
                      <div key={idx} className="flex flex-col gap-2 flex-1">
                        <label className="text-sm font-normal text-[var(--form-readonly-label-color)] text-right [direction:rtl]">
                          {f.label}
                        </label>
                        <div className="px-3 py-2 bg-gray-50 rounded-[10px] border border-color-mode-text-icons-t-placeholder text-[var(--form-readonly-input-text-color)] text-right [direction:rtl]">
                          {f.value}
                        </div>
                      </div>
                    ))}
                    {row.length < 3 &&
                      Array.from({ length: 3 - row.length }).map((_, k) => (
                        <div key={`empty-${k}`} className="flex-1" />
                      ))}
                  </div>
                );
              }
              return rows;
            })()}
          </div>

          {/* Actions: Contact and Edit */}
          <div className="w-full flex items-center gap-3">
            <button
              type="button"
              className="px-4 h-10 rounded-[10px] border border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              تواصل مع المندوب
            </button>
          </div>
        </section>
      </div>

      {/* Companies table section */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <header className="flex items-center justify-between w-full">
          <div className="flex items-center justify-end gap-1.5">
            <Building2 className="w-5 h-5 text-gray-500" />
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              الشركات المضافة ({companies.length})
            </h2>
          </div>
          <div className="inline-flex items-center gap-[var(--corner-radius-medium)]">
            <button
              onClick={() => setIsAddCompanyModalOpen(true)}
              className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray"
            >
              <div className="flex items-center gap-[var(--corner-radius-small)]">
                <span className="font-body-body-2 text-[length:var(--body-body-2-font-size)] text-color-mode-text-icons-t-sec [direction:rtl]">
                  إضافة شركة
                </span>
                <Plus className="w-4 h-4 text-gray-500" />
              </div>
            </button>
            <ExportMenu />
          </div>
        </header>

        {/* Bordered frame around table and pagination */}
        <div className="w-full rounded-[var(--corner-radius-large)] border border-color-mode-text-icons-t-placeholder bg-white p-4 shadow-sm">
          <div className="w-full overflow-x-auto hidden lg:block">
            <Table columns={columnsReversed as any} data={paginated as any} />
          </div>
          <div className="w-full overflow-x-auto hidden md:block lg:hidden">
            <Table
              columns={(columnsReversed as any).filter(
                (c: any) => c.priority !== "low"
              )}
              data={paginated as any}
            />
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(companies.length / itemsPerPage) || 1}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={isAddCompanyModalOpen}
        onClose={() => setIsAddCompanyModalOpen(false)}
        onAdd={handleAddCompany}
        excludedCompanyIds={agent.companies || []}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        title="حذف الشركة"
        message={`هل أنت متأكد من حذف الشركة "${deleteConfirm.companyName}" من هذا المندوب؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

export default PetrolifeAgentDetails;

