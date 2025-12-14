import { useState, useMemo, useEffect } from "react";
import { Table, Pagination, ExportButton, LoadingSpinner } from "../../../shared";
import { Car, CirclePlus, MoreVertical, Eye, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  fetchCarTypes,
  fetchUserDisplayNameByEmail,
  deleteCarType,
} from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";
import { exportDataTable } from "../../../../services/exportService";

interface CarTypeRow {
  id: string;
  refid: string;
  logo: string | null;
  brand: string;
  model: string;
  year: string;
  creator: {
    name: string;
    avatar?: string;
  };
  creationDate: string;
}

// Format date value helper function
const formatDateValue = (value: any): string => {
  if (!value) {
    return "-";
  }

  try {
    if (typeof value === "string") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleString("ar-EG");
      }
      return value;
    }

    if (typeof value === "number") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleString("ar-EG");
      }
      return "-";
    }

    if (value?.toDate) {
      const parsed = value.toDate();
      return parsed.toLocaleString("ar-EG");
    }

    if (value?.seconds) {
      const parsed = new Date(value.seconds * 1000);
      return parsed.toLocaleString("ar-EG");
    }

    return "-";
  } catch {
    return "-";
  }
};

// Format value helper
const formatValue = (value: any, defaultValue = "-"): string => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  const stringValue = String(value).trim();
  return stringValue.length === 0 ? defaultValue : stringValue;
};

// Logo Component with error handling
const CarLogo = ({ imageUrl }: { imageUrl: string | null }) => {
  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
        <Car className="w-6 h-6 text-white" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="Car logo"
      className="w-12 h-12 rounded-lg object-cover"
      onError={() => setImageError(true)}
    />
  );
};

// Action Menu Component for each row
interface ActionMenuProps {
  item: any;
  navigate: any;
  onDelete: (id: string) => void;
}

const ActionMenu = ({ item, navigate, onDelete }: ActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateMenuPosition = () => {
    if (!buttonRef) return;
    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 192;
    let left = rect.right + 4;
    if (left + menuWidth > window.innerWidth) {
      left = rect.left - menuWidth - 4;
    }
    setMenuPosition({
      top: rect.bottom + 4,
      left: Math.max(4, left),
    });
  };

  const handleAction = (action: string) => {
    if (action === "view") {
      navigate(`/admin-cars/${item.id}`);
      setIsOpen(false);
    } else if (action === "delete") {
      setShowDeleteConfirm(true);
      setIsOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    onDelete(item.id);
    setShowDeleteConfirm(false);
  };

  useEffect(() => {
    if (isOpen) {
      updateMenuPosition();
      const handleScroll = () => updateMenuPosition();
      const handleResize = () => updateMenuPosition();
      window.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isOpen, buttonRef]);

  return (
    <>
      <div className="relative">
        <button
          ref={setButtonRef}
          onClick={() => {
            setIsOpen(!isOpen);
            setTimeout(updateMenuPosition, 0);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="إجراءات"
        >
          <MoreVertical className="w-4 h-4 text-gray-600" />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            {createPortal(
              <div
                className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
                style={{ top: menuPosition.top, left: menuPosition.left }}
              >
                <div className="py-1">
                  <button
                    onClick={() => handleAction("view")}
                    className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                  >
                    <span>مشاهدة بيانات المركبة</span>
                    <Eye className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleAction("delete")}
                    className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center justify-end gap-2 transition-colors"
                  >
                    <span>حذف المركبة</span>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>,
              document.body
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto"
              dir="rtl"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  تأكيد الحذف
                </h2>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-gray-700 mb-4">
                  هل أنت متأكد من حذف هذه المركبة؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>
              <div className="flex justify-end p-4 border-t border-gray-100 gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center gap-2"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

const Vehicles = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [vehicles, setVehicles] = useState<CarTypeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const carTypes = await fetchCarTypes();

        // Fetch creator names for all car types
        const vehiclesWithCreators = await Promise.all(
          carTypes.map(async (carType, index) => {
            const creatorEmail = carType.createdUserId;
            let creatorName = "غير محدد";

            if (creatorEmail) {
              try {
                const name = await fetchUserDisplayNameByEmail(creatorEmail);
                creatorName = name || creatorEmail;
              } catch (err) {
                console.error(
                  `Error fetching creator name for ${creatorEmail}:`,
                  err
                );
                creatorName = creatorEmail;
              }
            }

            return {
              id: carType.docId || carType.id || String(index + 1),
              refid: String(index + 1).padStart(8, "0"),
              logo: carType.carModel?.carModelImageUrl || null,
              brand: formatValue(carType.carModel?.name?.ar),
              model: formatValue(carType.name?.ar),
              year: formatValue(carType.year),
              creator: {
                name: creatorName,
              },
              creationDate: formatDateValue(carType.createdDate),
            } as CarTypeRow;
          })
        );

        setVehicles(vehiclesWithCreators);
      } catch (err) {
        console.error("Error loading car types:", err);
        setError("فشل في تحميل بيانات المركبات.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const columns = useMemo(
    () => [
      {
        key: "actions",
        label: "",
        width: "w-16",
        priority: "high",
        render: (_: any, row: any) => (
          <div className="flex items-center justify-center">
            <ActionMenu item={row} navigate={navigate} onDelete={handleDelete} />
          </div>
        ),
      },
      {
        key: "creationDate",
        label: "تاريخ الانشاء",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "creator",
        label: "المنشئ",
        width: "min-w-[150px]",
        priority: "high",
        render: (value: { name: string; avatar?: string }) => (
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
        key: "year",
        label: "سنة الاصدار",
        width: "min-w-[120px]",
        priority: "high",
      },
      {
        key: "model",
        label: "الطراز",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "brand",
        label: "الماركة",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "logo",
        label: "لوجو السيارة",
        width: "min-w-[100px]",
        priority: "high",
        render: (value: string | null) => (
          <div className="flex items-center justify-center">
            <CarLogo imageUrl={value} />
          </div>
        ),
      },
      {
        key: "refid",
        label: "الرقم",
        width: "min-w-[80px]",
        priority: "high",
      },
    ],
    [navigate]
  );

  const paginatedData = useMemo(
    () =>
      vehicles.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [vehicles, currentPage]
  );

  const handleExport = async (format: string) => {
    try {
      // Define columns for export
      const exportColumns = [
        { key: "refid", label: "الرقم" },
        { key: "brand", label: "الماركة" },
        { key: "model", label: "الطراز" },
        { key: "year", label: "سنة الاصدار" },
        { key: "creator", label: "المنشئ" },
        { key: "creationDate", label: "تاريخ الانشاء" },
      ];

      // Transform data for export (flatten creator object)
      const exportData = vehicles.map((vehicle) => ({
        ...vehicle,
        creator: vehicle.creator?.name || "-",
      }));

      await exportDataTable(
        exportData,
        exportColumns,
        "vehicles",
        format as "excel" | "pdf",
        "تقرير المركبات"
      );

      addToast({
        type: "success",
        title: "نجح التصدير",
        message: `تم تصدير البيانات بنجاح كـ ${format === "excel" ? "Excel" : "PDF"}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      addToast({
        type: "error",
        title: "فشل التصدير",
        message: "حدث خطأ أثناء تصدير البيانات",
      });
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);

    try {
      await deleteCarType(id);

      addToast({
        type: "success",
        title: "تم الحذف",
        message: "تم حذف المركبة بنجاح",
      });

      // Reload the list
      const carTypes = await fetchCarTypes();

      // Fetch creator names for all car types
      const vehiclesWithCreators = await Promise.all(
        carTypes.map(async (carType, index) => {
          const creatorEmail = carType.createdUserId;
          let creatorName = "غير محدد";

          if (creatorEmail) {
            try {
              const name = await fetchUserDisplayNameByEmail(creatorEmail);
              creatorName = name || creatorEmail;
            } catch (err) {
              console.error(
                `Error fetching creator name for ${creatorEmail}:`,
                err
              );
              creatorName = creatorEmail;
            }
          }

          return {
            id: carType.docId || carType.id || String(index + 1),
            refid: String(index + 1).padStart(8, "0"),
            logo: carType.carModel?.carModelImageUrl || null,
            brand: formatValue(carType.carModel?.name?.ar),
            model: formatValue(carType.name?.ar),
            year: formatValue(carType.year),
            creator: {
              name: creatorName,
            },
            creationDate: formatDateValue(carType.createdDate),
          } as CarTypeRow;
        })
      );

      setVehicles(vehiclesWithCreators);
    } catch (error: any) {
      console.error("Error deleting car type:", error);
      addToast({
        type: "error",
        title: "خطأ",
        message:
          error?.message || "حدث خطأ أثناء حذف المركبة. يرجى المحاولة مرة أخرى",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-16">
        <LoadingSpinner message="جاري تحميل بيانات المركبات..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-20 gap-4">
        <div className="text-red-600 text-lg [direction:rtl]">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        {/* Title on right */}
        <div className="flex items-center justify-end gap-1.5" dir="rtl">
          <Car className="w-5 h-5 text-gray-500" />
          <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
            المركبات ({vehicles.length})
          </h1>
        </div>
        {/* Buttons on left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin-cars/upload")}
            className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
          >
            <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                  رفع من Excel
                </span>
              </div>
              <CirclePlus className="w-4 h-4 text-gray-500" />
            </div>
          </button>
          <button
            onClick={() => navigate("/admin-cars/add")}
            className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
          >
            <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                  إضافة مركبة جديدة
                </span>
              </div>
              <CirclePlus className="w-4 h-4 text-gray-500" />
            </div>
          </button>
          <ExportButton onExport={handleExport} buttonText="تصدير" />
        </div>
      </div>

      {/* Table Section */}
      {vehicles.length === 0 ? (
        <div className="flex items-center justify-center w-full py-12">
          <div className="text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg [direction:rtl]">
              لا توجد مركبات
            </p>
            <p className="text-gray-400 text-sm mt-2 [direction:rtl]">
              قم بإضافة مركبة جديدة للبدء
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <Table columns={columns} data={paginatedData} />
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(vehicles.length / itemsPerPage) || 1}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default Vehicles;
