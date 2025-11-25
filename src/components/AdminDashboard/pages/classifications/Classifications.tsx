import { useState, useMemo, useEffect } from "react";
import { Table, Pagination, ExportButton, LoadingSpinner } from "../../../shared";
import {
  CirclePlus,
  MoreVertical,
  Trash2,
  X,
  Info,
  Upload,
  Download,
  PencilLine,
  Loader2,
  Cloud,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { StatusToggle } from "../../../shared";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import { useRef } from "react";
import { exportDataTable } from "../../../../services/exportService";
import { useToast } from "../../../../context/ToastContext";
import { createCategory } from "../../../../services/firestore";

// Action Menu Component for each row
interface ActionMenuProps {
  item: any;
  navigate: any;
  onAddSubCategory: (categoryId: string) => void;
}

const ActionMenu = ({ item, navigate, onAddSubCategory }: ActionMenuProps) => {
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
      navigate(`/admin-categories/${item.id}`, {
        state: {
          category: item.rawCategory,
          subcategories: item.rawSubcategories,
        },
      });
    } else if (action === "add-sub") {
      onAddSubCategory(item.id);
    } else if (action === "delete") {
      console.log("Delete classification:", item.id);
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
                  <Info className="w-4 h-4 text-gray-500" />
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
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const [addMenuPosition, setAddMenuPosition] = useState({ top: 0, left: 0 });
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const [subCategoryModal, setSubCategoryModal] = useState<{
    open: boolean;
    categoryId: string | null;
  }>({ open: false, categoryId: null });
  const [isAddSubcategoryFormOpen, setIsAddSubcategoryFormOpen] =
    useState(false);
  const [isSubmittingSubcategory, setIsSubmittingSubcategory] =
    useState(false);
  const [subcategoryFormValues, setSubcategoryFormValues] = useState({
    arabicName: "",
    englishName: "",
    accountingSystemId: "",
    priceForIndividuals: "0",
    priceForCompanies: "0",
    productImage: null as File | null,
    unitOfMeasurement: "Liter",
  });
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    []
  );
  const closeAddMenu = () => setIsAddMenuOpen(false);

  const updateAddMenuPosition = () => {
    const button = addButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 280;

    let left = rect.right - menuWidth;
    if (left < 8) left = 8;
    const top = rect.bottom + 8;

    setAddMenuPosition({ top, left });
  };

  const toggleAddMenu = () => {
    setIsAddMenuOpen((prev) => {
      const next = !prev;
      if (!prev) {
        updateAddMenuPosition();
        setTimeout(updateAddMenuPosition, 0);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!isAddMenuOpen) return;

    const handleScroll = () => updateAddMenuPosition();
    const handleResize = () => updateAddMenuPosition();
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (addButtonRef.current?.contains(target)) return;
      if (addMenuRef.current?.contains(target)) return;
      closeAddMenu();
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAddMenuOpen]);


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

  const handleAddMenuAction = (action: string) => {
    if (action === "add-single") {
      navigate("/admin-categories/add");
    } else if (action === "upload-excel") {
      console.log("Upload Excel classifications");
    } else if (action === "download-template") {
      console.log("Download classifications template");
    }
    closeAddMenu();
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


  const subCategoriesByParentId = useMemo(() => {
    const map = new Map<string, any[]>();

    categories.forEach((category) => {
      const parentId = normalizeId(category.parentId);
      if (!parentId) return;
      const existing = map.get(parentId) ?? [];
      existing.push(category);
      map.set(parentId, existing);
    });

    return map;
  }, [categories]);

  const transformedCategories = useMemo(() => {
    if (!categories.length) return [];

    return categories.map((category, index) => {
      const categoryId = category.id ?? normalizeId(category.refId) ?? `temp-${index}`;
      const parentId = normalizeId(category.parentId);
      const children = subCategoriesByParentId.get(categoryId) ?? [];

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
        rawCategory: category,
        rawSubcategories: children,
      };
    });
  }, [categories, subCategoriesByParentId]);

  const openSubCategoryModal = (categoryId: string) => {
    setSelectedSubcategories([]);
    setSubCategoryModal({ open: true, categoryId });
  };

  const closeSubCategoryModal = () => {
    setSubCategoryModal({ open: false, categoryId: null });
    setSelectedSubcategories([]);
    setIsAddSubcategoryFormOpen(false);
  };

  const toggleSubcategorySelection = (subcategoryId: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subcategoryId)
        ? prev.filter((id) => id !== subcategoryId)
        : [...prev, subcategoryId]
    );
  };

  const resetSubcategoryForm = () => {
    setSubcategoryFormValues({
      arabicName: "",
      englishName: "",
      accountingSystemId: "",
      priceForIndividuals: "0",
      priceForCompanies: "0",
      productImage: null,
      unitOfMeasurement: "Liter",
    });
    setIsSubmittingSubcategory(false);
  };

  const openAddSubcategoryForm = () => {
    resetSubcategoryForm();
    setSubcategoryFormValues((prev) => ({
      ...prev,
      accountingSystemId: subCategoryModal.categoryId || "",
    }));
    setIsAddSubcategoryFormOpen(true);
  };

  const handleSubcategoryFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] ?? null;
      setSubcategoryFormValues((prev) => ({
        ...prev,
        productImage: file,
      }));
    };
    input.click();
  };

  const handleSubcategoryFieldChange = (
    field: keyof typeof subcategoryFormValues,
    value: string
  ) => {
    setSubcategoryFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitSubcategory = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!subCategoryModal.categoryId) return;

    setIsSubmittingSubcategory(true);

    try {
      await createCategory({
        arabicName: subcategoryFormValues.arabicName,
        englishName: subcategoryFormValues.englishName,
        accountingSystemId: subcategoryFormValues.accountingSystemId,
        unitOfMeasurement:
          subcategoryFormValues.unitOfMeasurement?.toLowerCase?.() ??
          subcategoryFormValues.unitOfMeasurement,
        individualPrice: subcategoryFormValues.priceForIndividuals,
        companyPrice: subcategoryFormValues.priceForCompanies,
        imageFile: subcategoryFormValues.productImage,
        parentCategoryId: subCategoryModal.categoryId,
        categoryType: "subOrdinate",
      });

      resetSubcategoryForm();
      setIsAddSubcategoryFormOpen(false);
    } catch (error) {
      console.error("Failed to add subcategory:", error);
    } finally {
      setIsSubmittingSubcategory(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "actions",
        label: "",
        width: "w-16",
        priority: "high",
        render: (_: any, row: any) => (
          <div className="flex items-center justify-center">
            <ActionMenu
              item={row}
              navigate={navigate}
              onAddSubCategory={openSubCategoryModal}
            />
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
    [navigate, openSubCategoryModal]
  );

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

  const { addToast } = useToast();

  const handleExport = async (format: string) => {
    try {
      const exportColumns = [
        { key: "number", label: "الرقم" },
        { key: "mainCategory", label: "التصنيف الرئيسي" },
        { key: "englishName", label: "التصنيف بالانجليزي" },
        { key: "subCategories", label: "التصنيفات الفرعية" },
        { key: "statusLabel", label: "حالة التصنيف" },
        { key: "creator", label: "المنشئ" },
        { key: "creationDate", label: "تاريخ الانشاء" },
      ];

      // Transform data for export
      const exportData = transformedCategories.map((item) => ({
        ...item,
        creator: item.creator?.name || "-",
        statusLabel: item.statusLabel || (item.isActive ? "فعال" : "غير فعال"),
      }));

      await exportDataTable(
        exportData,
        exportColumns,
        "classifications",
        format as "excel" | "pdf",
        "تقرير التصنيفات"
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
            ref={addButtonRef}
            onClick={toggleAddMenu}
            className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
            type="button"
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

      {isAddMenuOpen &&
        createPortal(
          <div
            ref={addMenuRef}
            className="fixed w-[280px] bg-white border border-gray-200 rounded-[20px] shadow-xl z-50 overflow-hidden"
            style={{ top: addMenuPosition.top, left: addMenuPosition.left }}
          >
            <div className="flex flex-col divide-y divide-gray-200">
              <button
                type="button"
                onClick={() => handleAddMenuAction("add-single")}
                className="flex items-center gap-3 px-5 py-4 text-[15px] text-gray-800 hover:bg-gray-100 transition-colors"
              >
                <span className="flex-1 text-right whitespace-nowrap">إضافة تصنيف واحد</span>
                <CirclePlus className="w-5 h-5 text-gray-400" />
              </button>
              <button
                type="button"
                onClick={() => handleAddMenuAction("upload-excel")}
                className="flex items-center gap-3 px-5 py-4 text-[15px] text-gray-800 hover:bg-gray-100 transition-colors"
              >
                <span className="flex-1 text-right whitespace-nowrap">
                  رفع ملف Excel لمجموعة تصنيفات
                </span>
                <Upload className="w-5 h-5 text-gray-400" />
              </button>
              <button
                type="button"
                onClick={() => handleAddMenuAction("download-template")}
                className="flex items-center gap-3 px-5 py-4 text-[15px] text-gray-800 hover:bg-gray-100 transition-colors"
              >
                <span className="flex-1 text-right whitespace-nowrap">
                  تنزيل نموذج للتعبئة
                </span>
                <Download className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>,
          document.body
        )}

      {isAddSubcategoryFormOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4"
            onClick={() => {
              if (!isSubmittingSubcategory) {
                setIsAddSubcategoryFormOpen(false);
              }
            }}
          >
            <form
              onSubmit={handleSubmitSubcategory}
              onClick={(event) => event.stopPropagation()}
              className="bg-white w-full max-w-[520px] rounded-[24px] shadow-2xl overflow-hidden flex flex-col"
              dir="rtl"
            >
              <div className="px-6 pt-5 pb-4 border-b border-gray-200 text-center">
                <h3 className="text-[18px] font-semibold text-gray-800">
                  إضافة تصنيف فرعي جديد
                </h3>
              </div>

              <div className="px-6 py-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col items-end gap-2">
                    <label className="self-stretch text-sm text-gray-600 text-right">
                      اسم التصنيف بالعربي
                    </label>
                    <input
                      type="text"
                      required
                      value={subcategoryFormValues.arabicName}
                      onChange={(e) =>
                        handleSubcategoryFieldChange("arabicName", e.target.value)
                      }
                      placeholder="التصنيف بالعربي هنا"
                      className="w-full h-11 rounded-[12px] border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A66C1] text-right"
                    />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <label className="self-stretch text-sm text-gray-600 text-right">
                      اسم التصنيف بالانجليزي
                    </label>
                    <input
                      type="text"
                      required
                      value={subcategoryFormValues.englishName}
                      onChange={(e) =>
                        handleSubcategoryFieldChange("englishName", e.target.value)
                      }
                      placeholder="التصنيف بالإنجليزي هنا"
                      className="w-full h-11 rounded-[12px] border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A66C1] text-right"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <label className="self-stretch text-sm text-gray-600 text-right">
                    الرقم التعريفي للنظام المحاسبي
                  </label>
                  <input
                    type="text"
                    value={subcategoryFormValues.accountingSystemId}
                    onChange={(e) =>
                      handleSubcategoryFieldChange(
                        "accountingSystemId",
                        e.target.value
                      )
                    }
                    placeholder="اكتب الرقم هنا"
                    className="w-full h-11 rounded-[12px] border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A66C1] text-right"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col items-end gap-2">
                    <label className="self-stretch text-sm text-gray-600 text-right">
                      سعر المنتج للأفراد
                    </label>
                    <div className="flex items-center h-11 rounded-[12px] border border-gray-300 px-3">
                      <span className="text-gray-500 text-sm ml-2">ر.س</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={subcategoryFormValues.priceForIndividuals}
                        onChange={(e) =>
                          handleSubcategoryFieldChange(
                            "priceForIndividuals",
                            e.target.value
                          )
                        }
                        className="flex-1 text-sm bg-transparent outline-none text-right"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <label className="self-stretch text-sm text-gray-600 text-right">
                      سعر المنتج للشركات
                    </label>
                    <div className="flex items-center h-11 rounded-[12px] border border-gray-300 px-3">
                      <span className="text-gray-500 text-sm ml-2">ر.س</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={subcategoryFormValues.priceForCompanies}
                        onChange={(e) =>
                          handleSubcategoryFieldChange(
                            "priceForCompanies",
                            e.target.value
                          )
                        }
                        className="flex-1 text-sm bg-transparent outline-none text-right"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col items-end gap-2">
                    <label className="self-stretch text-sm text-gray-600 text-right">
                      وحدة القياس
                    </label>
                    <select
                      value={subcategoryFormValues.unitOfMeasurement}
                      onChange={(e) =>
                        handleSubcategoryFieldChange(
                          "unitOfMeasurement",
                          e.target.value
                        )
                      }
                      className="w-full h-11 rounded-[12px] border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A66C1] text-right"
                    >
                      <option value="Liter">لتر</option>
                      <option value="Kilogram">كيلوغرام</option>
                      <option value="Piece">قطعة</option>
                      <option value="Box">صندوق</option>
                    </select>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <label className="self-stretch text-sm text-gray-600 text-right">
                      صورة المنتج
                    </label>
                    <button
                      type="button"
                      onClick={handleSubcategoryFileUpload}
                      className="flex h-16 items-center justify-center gap-2 rounded-[12px] border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors px-3"
                    >
                      <Cloud className="w-6 h-6 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {subcategoryFormValues.productImage?.name ||
                          "ارفع الصورة هنا"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-6 py-5 border-t border-gray-200">
                <button
                  type="button"
                  disabled={isSubmittingSubcategory}
                  onClick={() => setIsAddSubcategoryFormOpen(false)}
                  className="flex-1 h-11 rounded-[12px] border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  رجوع
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSubcategory}
                  className="flex-1 h-11 rounded-[12px] bg-[#5A66C1] text-white hover:bg-[#4A55AE] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingSubcategory && (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  )}
                  <span>{isSubmittingSubcategory ? "جاري الحفظ..." : "حفظ"}</span>
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {subCategoryModal.open &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4"
            onClick={closeSubCategoryModal}
          >
            <div
              className="bg-white w-full max-w-[400px] rounded-[24px] shadow-2xl overflow-hidden flex flex-col"
              dir="rtl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-[17px] font-semibold text-gray-800">
                  اختر التصنيفات الفرعية
                </h2>
                <button
                  type="button"
                  onClick={closeSubCategoryModal}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {(() => {
                  const list =
                    subCategoriesByParentId.get(
                      subCategoryModal.categoryId ?? ""
                    ) ?? [];

                  if (!list.length) {
                    return (
                      <div className="px-6 py-8 text-center text-sm text-gray-500">
                        لا توجد تصنيفات فرعية لهذا التصنيف.
                      </div>
                    );
                  }

                  return list.map((subcategory) => {
                    const subId = subcategory.id ?? "";
                    const name =
                      extractText(
                        subcategory?.name?.ar ??
                          subcategory?.name?.en ??
                          subcategory?.label
                      ) || "-";

                    return (
                      <div
                        key={subId}
                        className="flex items-center gap-3 px-6 py-3 border-b border-gray-100"
                      >
                        <span className="flex-1 text-right text-[15px] text-gray-800">
                          {name}
                        </span>
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-[#5A66C1] focus:ring-[#5A66C1]"
                          checked={selectedSubcategories.includes(subId)}
                          onChange={() => toggleSubcategorySelection(subId)}
                        />
                        <div className="flex items-center gap-2 text-gray-500">
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                            aria-label="تعديل"
                            onClick={() =>
                              console.log("Edit subcategory:", subId)
                            }
                          >
                            <PencilLine className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-red-50 text-red-500 transition-colors"
                            aria-label="حذف"
                            onClick={() =>
                              console.log("Delete subcategory:", subId)
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
                <div className="px-6 py-4 text-center border-b border-gray-200">
                  <button
                    type="button"
                    onClick={openAddSubcategoryForm}
                    className="inline-flex items-center gap-2 text-[#5A66C1] text-[15px] font-medium hover:text-[#4A55AE] transition-colors"
                  >
                    <CirclePlus className="w-4 h-4" />
                    <span>إضافة تصنيف فرعي جديد</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-6 py-4">
                <button
                  type="button"
                  onClick={closeSubCategoryModal}
                  className="flex-1 h-11 rounded-[12px] border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  رجوع
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log(
                      "Selected subcategories:",
                      selectedSubcategories
                    );
                    closeSubCategoryModal();
                  }}
                  className="flex-1 h-11 rounded-[12px] bg-[#5A66C1] text-white hover:bg-[#4A55AE] transition-colors"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

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

