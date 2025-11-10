import { useState, useMemo, useEffect } from "react";
import { Table, Pagination, ExportButton, LoadingSpinner } from "../../../shared";
import { CirclePlus, MoreVertical, Eye, Trash2, X, Upload, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { StatusToggle } from "../../../shared";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../../config/firebase";

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
    const menuWidth = 240;
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
      navigate(`/admin-categories/${item.id}`);
    } else if (action === "delete") {
      console.log("Delete classification:", item.id);
    } else if (action === "add-sub") {
      console.log("Add sub-classification:", item.id);
    } else if (action === "add-single") {
      navigate("/admin-categories/add");
    } else if (action === "upload-excel") {
      console.log("Upload Excel:", item.id);
    } else if (action === "download-template") {
      console.log("Download template");
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
              className="fixed w-60 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <div className="py-1">
                <button
                  onClick={() => handleAction("view")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>مشاهدة التصنيف</span>
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleAction("add-sub")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>إضافة تصنيف فرعي</span>
                  <CirclePlus className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleAction("delete")}
                  className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>حذف التصنيف</span>
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => handleAction("add-single")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>إضافة تصنيف واحد</span>
                  <CirclePlus className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleAction("upload-excel")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>رفع ملف Excel لمجموعة تصنيفات</span>
                  <Upload className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleAction("download-template")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>تنزيل نموذج للتعبئة</span>
                  <Download className="w-4 h-4 text-gray-500" />
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

const Classifications = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const extractText = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : "-";
    }
    if (typeof value === "number") return value.toString();
    if (Array.isArray(value)) {
      const combined = value
        .map((entry) => extractText(entry))
        .filter((entry) => entry !== "-")
        .join("، ");
      return combined.length ? combined : "-";
    }
    if (typeof value === "object") {
      if (value.ar && typeof value.ar === "string" && value.ar.trim().length) {
        return value.ar.trim();
      }
      if (value.en && typeof value.en === "string" && value.en.trim().length) {
        return value.en.trim();
      }
      if (value.name) {
        return extractText(value.name);
      }
      if (value.label) {
        return extractText(value.label);
      }
    }
    return "-";
  };

  const formatDateValue = (value: any): string => {
    if (!value) return "-";

    try {
      const date =
        typeof value?.toDate === "function"
          ? value.toDate()
          : value instanceof Date
          ? value
          : typeof value === "number"
          ? new Date(value)
          : typeof value === "string"
          ? new Date(value)
          : value?.seconds
          ? new Date(value.seconds * 1000)
          : null;

      if (!date || Number.isNaN(date.getTime())) {
        return "-";
      }

      const day = `${date.getDate()}`.padStart(2, "0");
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (err) {
      console.warn("Failed to format category date:", value, err);
      return "-";
    }
  };

  const normalizeId = (value: any): string | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    if (typeof value === "object") {
      if (typeof value.id === "string" && value.id.trim().length) return value.id;
      if (typeof value.id === "number") return value.id.toString();
      if (typeof value._keyPath === "string") return value._keyPath;
      if (typeof value.path === "string") return value.path;
    }
    return null;
  };

  useEffect(() => {
    setIsLoading(true);

    const categoriesRef = collection(db, "categories");
    const q = query(categoriesRef, orderBy("createdDate", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(data);
        setIsLoading(false);
      },
      (error) => {
        console.error("❌ Error listening to categories:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
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
        label: "حالة التصنيف",
        width: "min-w-[150px]",
        priority: "high",
        render: (_: any, row: any) => (
          <StatusToggle
            isActive={row.isActive}
            onToggle={() => {}}
            statusText={row.statusLabel}
          />
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
        key: "subCategories",
        label: "التصنيفات الفرعية",
        width: "min-w-[120px]",
        priority: "high",
      },
      {
        key: "englishName",
        label: "التصنيف بالانجليزي",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "mainCategory",
        label: "التصنيف الرئيسي",
        width: "min-w-[150px]",
        priority: "high",
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

  const transformedCategories = useMemo(() => {
    if (!categories.length) return [];

    const parentChildMap = new Map<string, any[]>();

    categories.forEach((category) => {
      const parentId = normalizeId(category.parentId);
      if (!parentId) return;
      const existing = parentChildMap.get(parentId) ?? [];
      existing.push(category);
      parentChildMap.set(parentId, existing);
    });

    return categories.map((category, index) => {
      const categoryId = category.id ?? normalizeId(category.refId) ?? `temp-${index}`;
      const parentId = normalizeId(category.parentId);
      const children = parentChildMap.get(categoryId) ?? [];

      let subCategoriesDisplay = "-";
      if (parentId === null) {
        subCategoriesDisplay = "Main Category";
      } else if (children.length > 0) {
        const childNames = children
          .map((child) => extractText(child?.name?.ar ?? child?.name?.en ?? child?.label))
          .filter((name) => name !== "-");
        subCategoriesDisplay = childNames.length
          ? childNames.join("، ")
          : `${children.length}`;
      } else {
        subCategoriesDisplay = "0";
      }

      const creatorName =
        category?.createdUserEmail ||
        category?.createdUserId ||
        "-";

      const categoryType = extractText(category?.categoryTypeEnum ?? category?.majorTypeEnum ?? category?.label);
      const englishName = extractText(category?.name?.en ?? category?.name);
      const isActive =
        typeof category?.isActive === "boolean" ? category.isActive : true;

      return {
        id: categoryId,
        number: index + 1,
        mainCategory: categoryType,
        englishName,
        subCategories: subCategoriesDisplay,
        creator: { name: creatorName },
        creationDate: formatDateValue(category?.createdDate),
        isActive,
        statusLabel: isActive ? "فعال" : "غير فعال",
      };
    });
  }, [categories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [transformedCategories.length]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(transformedCategories.length / itemsPerPage)
    );
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, transformedCategories.length, itemsPerPage]);

  const paginatedData = useMemo(
    () =>
      transformedCategories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [currentPage, transformedCategories]
  );

  const handleExport = (format: string) => {
    console.log(`Exporting classifications as ${format}`);
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
          <X className="w-5 h-5 text-gray-500" />
          <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
            التصنيفات ({transformedCategories.length})
          </h1>
        </div>
        {/* Buttons on left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin-categories/add")}
            className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
          >
            <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                  إضافة تصنيف جديد
                </span>
              </div>
              <CirclePlus className="w-4 h-4 text-gray-500" />
            </div>
          </button>
          <ExportButton onExport={handleExport} buttonText="تصدير" />
        </div>
      </div>

      {/* Table Section */}
      {isLoading ? (
        <div className="w-full flex justify-center items-center py-12">
          <LoadingSpinner message="جاري تحميل التصنيفات..." />
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <Table columns={columns} data={paginatedData} />
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={
          Math.max(1, Math.ceil(transformedCategories.length / itemsPerPage)) || 1
        }
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Classifications;

