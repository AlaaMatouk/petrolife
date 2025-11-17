import { useState, useMemo, useEffect } from "react";
import { Table, Pagination, ExportButton } from "../../../shared";
import { Megaphone, MoreVertical, Eye, Trash2, CirclePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { StatusToggle } from "../../../shared";
import {
  fetchAdvertisements,
  Advertisement,
} from "../../../../services/firestore";

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
      navigate(`/advertisements/${item.id}`);
    } else if (action === "delete") {
      console.log("Delete advertisement:", item.id);
      // TODO: Show confirmation dialog and handle delete
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
                  <span>مشاهدة الاعلان</span>
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleAction("delete")}
                  className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>حذف الاعلان</span>
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

const Advertisements = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const loadAds = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("🔄 Loading advertisements...");
        const data = await fetchAdvertisements();
        console.log("📊 Fetched advertisements:", data);
        console.log("📊 Number of ads:", data.length);
        setAds(data);
      } catch (err) {
        console.error("❌ Error loading advertisements:", err);
        setError("حدث خطأ أثناء تحميل الإعلانات");
      } finally {
        setIsLoading(false);
      }
    };

    loadAds();
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
            <ActionMenu item={row} navigate={navigate} />
          </div>
        ),
      },
      {
        key: "status",
        label: "حالة الاعلان",
        width: "min-w-[150px]",
        priority: "high",
        render: (value: boolean | string | null) => (
          <StatusToggle
            isActive={value === true || value === "معروض"}
            onToggle={() => {
              console.log("Toggle status for advertisement");
            }}
            statusText="معروض"
          />
        ),
      },
      {
        key: "type",
        label: "العرض",
        width: "min-w-[150px]",
        priority: "high",
        render: (value: any) => {
          // Safely extract string from object or use string directly
          if (typeof value === "string") return value;
          if (value && typeof value === "object") {
            return value.ar || value.en || "";
          }
          return value || "";
        },
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
        key: "description",
        label: "الوصف",
        width: "min-w-[200px]",
        priority: "medium",
        render: (value: any) => {
          // Safely extract string from object or use string directly
          if (typeof value === "string") return value;
          if (value && typeof value === "object") {
            return value.ar || value.en || "";
          }
          return value || "";
        },
      },
      {
        key: "title",
        label: "العنوان",
        width: "min-w-[150px]",
        priority: "high",
        render: (value: any) => {
          // Safely extract string from object or use string directly
          if (typeof value === "string") return value;
          if (value && typeof value === "object") {
            return value.ar || value.en || "";
          }
          return value || "";
        },
      },
      {
        key: "adImageUrl",
        label: "التصميم",
        width: "min-w-[100px]",
        priority: "high",
        render: (value: string) => (
          <div className="flex items-center justify-center">
            <div className="w-16 h-12 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">
              {value ? (
                <img
                  src={value}
                  alt="تصميم الاعلان"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs">
                  تصميم
                </div>
              )}
            </div>
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

  const paginatedData = useMemo(() => {
    const mapped = ads.map((ad) => {
      // Ensure title and description are strings, not objects
      const safeTitle =
        typeof ad.title === "string"
          ? ad.title
          : ad.title && typeof ad.title === "object"
          ? ad.title.ar || ad.title.en || ""
          : "";
      const safeDescription =
        typeof ad.description === "string"
          ? ad.description
          : ad.description && typeof ad.description === "object"
          ? ad.description.ar || ad.description.en || ""
          : "";

      return {
        ...ad,
        title: safeTitle,
        description: safeDescription,
        creator: {
          name: ad.creatorDisplayName || ad.createdUserId || "غير معروف",
          avatar: undefined,
        },
      };
    });
    const paginated = mapped.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    console.log("📋 Paginated data:", paginated);
    return paginated;
  }, [ads, currentPage]);

  const handleExport = (format: string) => {
    console.log(`Exporting advertisements as ${format}`);
  };

  return (
    <div
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        {/* Title on right with icon */}
        <div className="flex items-center justify-end gap-1.5" dir="rtl">
          <Megaphone className="w-5 h-5 text-gray-500" />
          <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
            الإعلانات ({ads.length})
          </h1>
        </div>
        {/* Buttons on left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/advertisements/add")}
            className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
          >
            <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                  إضافة إعلان جديد
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
        {isLoading ? (
          <div className="w-full py-10 text-center text-gray-500">
            جاري تحميل الإعلانات...
          </div>
        ) : error ? (
          <div className="w-full py-10 text-center text-red-500">{error}</div>
        ) : (
          <Table columns={columns} data={paginatedData} />
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(ads.length / itemsPerPage) || 1}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Advertisements;

