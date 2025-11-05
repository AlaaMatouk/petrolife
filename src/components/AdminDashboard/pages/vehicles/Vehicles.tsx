import { useState, useMemo, useEffect } from "react";
import { Table, Pagination, ExportButton } from "../../../shared";
import { Car, CirclePlus, MoreVertical, Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

// Mock data for 200 vehicles
const mockVehicles = Array.from({ length: 200 }).map((_, i) => ({
  id: i + 1,
  number: i + 1,
  logo: undefined,
  brand: "تيوتا",
  model: "كرولا",
  year: "2020",
  creator: {
    name: "أحمد محمد",
    avatar: undefined,
  },
  creationDate: "21 فبراير 2025 - 5:05 ص",
}));

// Action Menu Component for each row
interface ActionMenuProps {
  item: any;
  navigate: any;
}

const ActionMenu = ({ item, navigate }: ActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

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
    } else if (action === "delete") {
      console.log("Delete vehicle:", item.id);
    }
    setIsOpen(false);
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
  );
};

const Vehicles = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(3);
  const itemsPerPage = 10;

  const columns = useMemo(
    () => [
      {
        key: "actions",
        label: "",
        width: "w-16",
        priority: "high",
        render: (_: any, row: any) => (
          <div className="flex items-center justify-center">
            <ActionMenu item={row} navigate={navigate} />
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
        render: (value: any) => (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
          </div>
        ),
      },
      {
        key: "number",
        label: "الرقم",
        width: "min-w-[80px]",
        priority: "high",
      },
    ],
    [navigate]
  );

  const paginatedData = useMemo(
    () =>
      mockVehicles.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [currentPage]
  );

  const handleExport = (format: string) => {
    console.log(`Exporting vehicles as ${format}`);
  };

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
            المركبات ({mockVehicles.length})
          </h1>
        </div>
        {/* Buttons on left */}
        <div className="flex items-center gap-3">
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
      <div className="w-full overflow-x-auto">
        <Table columns={columns} data={paginatedData} />
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(mockVehicles.length / itemsPerPage) || 1}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Vehicles;
