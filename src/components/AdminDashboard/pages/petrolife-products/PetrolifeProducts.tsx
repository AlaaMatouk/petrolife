import { useState } from "react";
import { DataTableSection } from "../../../sections/DataTableSection/DataTableSection";
import { Package, Star, Settings } from "lucide-react";
import { createPortal } from "react-dom";
import { ChevronLeft, X } from "lucide-react";
import {
  fetchProducts,
  addRefidToExistingProducts,
  deletePetrolifeProduct,
} from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";
import { ConfirmDialog } from "../../../shared/ConfirmDialog/ConfirmDialog";

const columns = [
  { key: "actions", label: "الإجراءات", width: "w-16", priority: "high" },
  {
    key: "ratings",
    label: "التقييمات",
    width: "min-w-[150px]",
    priority: "high",
    render: (value: string) => <span className="text-sm">{value || "-"}</span>,
  },
  {
    key: "availableQuantity",
    label: "الكمية المتاحة",
    width: "min-w-[120px]",
    priority: "high",
  },
  {
    key: "sales",
    label: "المبيعات",
    width: "min-w-[150px]",
    priority: "high",
  },
  {
    key: "price",
    label: "السعر (ر.س)",
    width: "min-w-[120px]",
    priority: "high",
  },
  {
    key: "category",
    label: "التصنيف",
    width: "min-w-[100px]",
    priority: "high",
  },
  {
    key: "productDescription",
    label: "وصف المنتج",
    width: "min-w-[200px]",
    priority: "medium",
  },
  {
    key: "productName",
    label: "اسم المنتج",
    width: "min-w-[180px]",
    priority: "high",
  },
  {
    key: "productCode",
    label: "كود المنتج",
    width: "min-w-[120px]",
    priority: "high",
  },
];

const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toString() : "-";
  }

  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : "-";
};

const mapProductToRow = (product: Record<string, any>) => ({
  id: product?.id ?? undefined,
  // Use refid as primary source for productCode, with fallback to id
  productCode: formatValue(product?.refid ?? product?.id),
  productName: formatValue(product?.title?.ar),
  productDescription: formatValue(product?.desc?.ar),
  category: formatValue(product?.category),
  price: formatValue(product?.price),
  sales: formatValue(product?.sales),
  availableQuantity: formatValue(product?.quantity),
  ratings: formatValue(product?.ratings),
});

const fetchData = async () => {
  try {
    const products = await fetchProducts();
    if (!Array.isArray(products)) {
      return [];
    }

    return products.map((product) => mapProductToRow(product));
  } catch (error) {
    console.error("Failed to load Petrolife products:", error);
    return [];
  }
};

// Fetch products with state update for migration
const fetchDataWithState = async (
  setRawProductsData: (data: any[]) => void,
  setProductsData?: (data: any[]) => void
) => {
  const products = await fetchProducts();
  setRawProductsData(products || []);
  if (!Array.isArray(products)) {
    if (setProductsData) setProductsData([]);
    return [];
  }
  const mappedProducts = products.map((product) => mapProductToRow(product));
  if (setProductsData) setProductsData(mappedProducts);
  return mappedProducts;
};

const LoyaltyProgramModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [purchaseThreshold, setPurchaseThreshold] = useState("100");
  const [points, setPoints] = useState("5");
  const [pointValue, setPointValue] = useState("1");

  const handleSave = () => {
    console.log("Saving loyalty program:", {
      purchaseThreshold,
      points,
      pointValue,
    });
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-[var(--corner-radius-large)] w-full max-w-md mx-4 flex flex-col">
        <div
          className="flex items-center justify-between p-4 border-b border-gray-200"
          dir="rtl"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">برنامج الولاء</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4" dir="rtl">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              عند وصول قيمة المشتريات ل
            </label>
            <div className="relative">
              <input
                type="number"
                value={purchaseThreshold}
                onChange={(e) => setPurchaseThreshold(e.target.value)}
                className="w-full pr-8 pl-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="rtl"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                ﷼
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              يحصل العميل على (نقاط)
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full py-2 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="rtl"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              بحيث كل نقطة تعادل
            </label>
            <div className="relative">
              <input
                type="number"
                value={pointValue}
                onChange={(e) => setPointValue(e.target.value)}
                className="w-full pr-8 pl-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="rtl"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                ﷼
              </span>
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-between p-4 border-t border-gray-200 gap-3"
          dir="rtl"
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            رجوع
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-[#4c5bd4] text-white hover:opacity-95"
          >
            حفظ البرنامج
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const PetrolifeProducts = () => {
  const { addToast } = useToast();
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [rawProductsData, setRawProductsData] = useState<any[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    productId: string | null;
    productName: string;
  }>({
    isOpen: false,
    productId: null,
    productName: "",
  });

  const handleAddRefidToExisting = async () => {
    setIsMigrating(true);
    try {
      const updatedCount = await addRefidToExistingProducts();
      addToast({
        type: "success",
        message: `تم إضافة كود المنتج لـ ${updatedCount} منتج بنجاح`,
        duration: 5000,
      });
      // Reload products data
      await fetchDataWithState(setRawProductsData, setProductsData);
      // Reload the page to refresh the table
      window.location.reload();
    } catch (error: any) {
      console.error("Error migrating products:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في إضافة كود المنتج للمنتجات الموجودين",
        duration: 5000,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Handle delete
  const handleDelete = (id: string | number) => {
    const productId = String(id);

    // Find product name for confirmation message
    const product = productsData.find((p) => p.id === productId);
    const productName = product?.productName || "المنتج";

    // Open confirmation dialog
    setDeleteConfirm({
      isOpen: true,
      productId,
      productName,
    });
  };

  // Confirm and delete product
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.productId) return;

    try {
      setDeletingId(deleteConfirm.productId);

      // Delete from Firestore
      await deletePetrolifeProduct(deleteConfirm.productId);

      // Show success message
      addToast({
        type: "success",
        message: `تم حذف ${deleteConfirm.productName} بنجاح`,
        duration: 3000,
      });

      // Close confirmation popup
      setDeleteConfirm({
        isOpen: false,
        productId: null,
        productName: "",
      });

      // Refresh the products data and trigger table re-render
      await fetchDataWithState(setRawProductsData, setProductsData);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Error deleting product:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في حذف المنتج",
        duration: 3000,
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Cancel delete
  const handleDeleteCancel = () => {
    setDeleteConfirm({
      isOpen: false,
      productId: null,
      productName: "",
    });
  };

  return (
    <>
      <div className="mb-4 flex gap-3 justify-end" dir="rtl">
        <button
          onClick={() => setShowLoyaltyModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray"
        >
          <Star className="w-4 h-4 text-gray-500" />
          <span className="font-body-body-2 text-[length:var(--body-body-2-font-size)] text-color-mode-text-icons-t-sec">
            برنامج الولاء
          </span>
        </button>
      </div>

      {/* Migration Button */}
      {rawProductsData.length > 0 &&
        rawProductsData.some((product) => !product.refid) && (
          <div className="w-full mb-4">
            <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleAddRefidToExisting}
                    disabled={isMigrating}
                    className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                      <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                        <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                          {isMigrating
                            ? "جاري إضافة كود المنتج..."
                            : "إضافة كود المنتج للمنتجات الموجودين"}
                        </span>
                      </div>
                      {isMigrating && (
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                  </button>
                  <p className="text-sm text-gray-600 [direction:rtl]">
                    هذا الزر يضيف كود منتج (8 أرقام) للمنتجات التي لا تملك كود
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      <div key={refreshKey}>
        <DataTableSection
          title="منتجات بترولايف"
          entityName="منتج"
          entityNamePlural="منتجات"
          icon={Package}
          fetchData={() => fetchDataWithState(setRawProductsData, setProductsData)}
          columns={columns}
          onDelete={handleDelete}
          addNewRoute="/petrolife-products/add"
          viewDetailsRoute={(id) => `/petrolife-products/${id}`}
          itemsPerPage={10}
          hideAddButton={false}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف ${deleteConfirm.productName}؟\n\nهذه العملية لا يمكن التراجع عنها.`}
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <LoyaltyProgramModal
        isOpen={showLoyaltyModal}
        onClose={() => setShowLoyaltyModal(false)}
      />
    </>
  );
};

export default PetrolifeProducts;

