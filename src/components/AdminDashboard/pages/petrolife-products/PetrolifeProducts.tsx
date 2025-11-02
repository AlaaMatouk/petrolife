import { useState } from "react";
import { DataTableSection } from "../../../sections/DataTableSection/DataTableSection";
import { Package, Star, Settings } from "lucide-react";
import { createPortal } from "react-dom";
import { ChevronLeft, X } from "lucide-react";

const columns = [
  { key: "actions", label: "الإجراءات", width: "w-16", priority: "high" },
  {
    key: "ratings",
    label: "التقييمات",
    width: "min-w-[150px]",
    priority: "high",
    render: (value: { rating: string; reviews: string }) => (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="font-medium">{value.rating}</span>
        </div>
        <span className="text-sm text-gray-500">({value.reviews})</span>
      </div>
    ),
  },
  {
    key: "availableQuantity",
    label: "الكمية المتاحة",
    width: "min-w-[120px]",
    priority: "high",
  },
  {
    key: "productSales",
    label: "مبيعات المنتج (ر.س)",
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
    key: "description",
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

const fetchData = async () => [
  {
    id: 1,
    productCode: "21A254",
    productName: "مسند ظهر للسائقين",
    description: "مسند مميز يساعد السائقين على الراحة أثناء القيادة",
    category: "فلاتر",
    price: "30",
    productSales: "15326",
    availableQuantity: "200",
    ratings: { rating: "4.5", reviews: "12 مراجعة" },
  },
  {
    id: 2,
    productCode: "21A255",
    productName: "مسند ظهر للسائقين",
    description: "مسند مميز يساعد السائقين على الراحة أثناء القيادة",
    category: "فلاتر",
    price: "30",
    productSales: "15326",
    availableQuantity: "200",
    ratings: { rating: "4.5", reviews: "12 مراجعة" },
  },
  {
    id: 3,
    productCode: "21A256",
    productName: "مسند ظهر للسائقين",
    description: "مسند مميز يساعد السائقين على الراحة أثناء القيادة",
    category: "فلاتر",
    price: "30",
    productSales: "15326",
    availableQuantity: "200",
    ratings: { rating: "4.5", reviews: "12 مراجعة" },
  },
  {
    id: 4,
    productCode: "21A257",
    productName: "مسند ظهر للسائقين",
    description: "مسند مميز يساعد السائقين على الراحة أثناء القيادة",
    category: "فلاتر",
    price: "30",
    productSales: "15326",
    availableQuantity: "200",
    ratings: { rating: "4.5", reviews: "12 مراجعة" },
  },
  {
    id: 5,
    productCode: "21A258",
    productName: "مسند ظهر للسائقين",
    description: "مسند مميز يساعد السائقين على الراحة أثناء القيادة",
    category: "فلاتر",
    price: "30",
    productSales: "15326",
    availableQuantity: "200",
    ratings: { rating: "4.5", reviews: "12 مراجعة" },
  },
  {
    id: 6,
    productCode: "21A259",
    productName: "مسند ظهر للسائقين",
    description: "مسند مميز يساعد السائقين على الراحة أثناء القيادة",
    category: "فلاتر",
    price: "30",
    productSales: "15326",
    availableQuantity: "200",
    ratings: { rating: "4.5", reviews: "12 مراجعة" },
  },
  {
    id: 7,
    productCode: "21A260",
    productName: "مسند ظهر للسائقين",
    description: "مسند مميز يساعد السائقين على الراحة أثناء القيادة",
    category: "فلاتر",
    price: "30",
    productSales: "15326",
    availableQuantity: "200",
    ratings: { rating: "4.5", reviews: "12 مراجعة" },
  },
  {
    id: 8,
    productCode: "21A261",
    productName: "مسند ظهر للسائقين",
    description: "مسند مميز يساعد السائقين على الراحة أثناء القيادة",
    category: "فلاتر",
    price: "30",
    productSales: "15326",
    availableQuantity: "200",
    ratings: { rating: "4.5", reviews: "12 مراجعة" },
  },
];

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
        {/* Modal Header */}
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

        {/* Modal Content */}
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

        {/* Modal Footer */}
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
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);

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

      <DataTableSection
        title="منتجات بترولايف (144)"
        entityName="منتج"
        entityNamePlural="منتجات"
        icon={Package}
        columns={columns}
        fetchData={fetchData}
        addNewRoute="/petrolife-products/add"
        viewDetailsRoute={(id) => `/petrolife-products/${id}`}
        itemsPerPage={10}
        hideAddButton={false}
      />

      <LoyaltyProgramModal
        isOpen={showLoyaltyModal}
        onClose={() => setShowLoyaltyModal(false)}
      />
    </>
  );
};

export default PetrolifeProducts;

