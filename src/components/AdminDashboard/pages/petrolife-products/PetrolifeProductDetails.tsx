import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Pagination } from "../../../shared";
import {
  ArrowLeft,
  Info,
  MoreVertical,
  Star,
  Package,
  Building2,
  User,
} from "lucide-react";

// Dummy product info matching screenshot style
const productInfo = {
  productName: "مسند الظهر",
  category: "فلاتر",
  availableQuantity: "150",
  price: "10",
  description: "منتج مميز عالي الطلب",
};

// Dummy sales data
const sales = Array.from({ length: 125 }).map((_, i) => ({
  id: i + 1,
  number: i + 1,
  buyerName: {
    name: i % 2 === 0 ? "شركة النصر" : "أحمد محمد",
    avatar: undefined,
  },
  accountType: i % 2 === 0 ? "شركة" : "فرد",
  piecesQuantity: i % 3 === 0 ? "1" : i % 3 === 1 ? "12" : "2",
  totalPrice: i % 3 === 0 ? "10" : i % 3 === 1 ? "120" : "20",
  rating: i % 5 === 0 ? "4.5" : "-",
  deliveryStatus: i % 2 === 0 ? { status: "مكتمل", color: "green" } : { status: "جاري التوصيل", color: "orange" },
}));

const PetrolifeProductDetails = (): JSX.Element => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(3);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("12 شهر");
  const itemsPerPage = 10;

  const timeFilters = ["اسبوع", "30 يوم", "6 شهور", "12 شهر"];

  const columns = useMemo(
    () => [
      {
        key: "deliveryStatus",
        label: "حالة التوصيل",
        width: "min-w-[120px]",
        priority: "high",
        render: (value: { status: string; color: string }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              value.color === "green"
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {value.status}
          </span>
        ),
      },
      {
        key: "rating",
        label: "التقييم",
        width: "min-w-[100px]",
        priority: "high",
        render: (value: string) =>
          value === "-" ? (
            <span className="text-gray-400">-</span>
          ) : (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{value}</span>
            </div>
          ),
      },
      {
        key: "totalPrice",
        label: "اجمالي السعر (رس)",
        width: "min-w-[130px]",
        priority: "high",
      },
      {
        key: "piecesQuantity",
        label: "عدد القطع",
        width: "min-w-[100px]",
        priority: "high",
      },
      {
        key: "accountType",
        label: "نوع الحساب",
        width: "min-w-[100px]",
        priority: "high",
        render: (value: string) => (
          <span className="text-sm text-gray-700">{value}</span>
        ),
      },
      {
        key: "buyerName",
        label: "اسم المشتري",
        width: "min-w-[180px]",
        priority: "high",
        render: (value: { name: string; avatar?: string }) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm">
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
        key: "number",
        label: "الرقم",
        width: "min-w-[80px]",
        priority: "high",
      },
      {
        key: "actions",
        label: "الإجراءات",
        width: "w-16",
        priority: "high",
        render: () => (
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-4 h-4 text-gray-600" />
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
      sales.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [currentPage]
  );

  return (
    <div className="flex flex-col w-full items-start gap-5">
      {/* Product Info Card */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <div className="flex items-center justify-between w-full">
          {/* Title on right */}
          <div className="flex items-center justify-end gap-1.5">
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              معلومات المنتج
            </h1>
            <Info className="w-5 h-5 text-gray-500" />
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

        {/* Product info - read-only inputs style */}
        <section className="flex flex-col items-start gap-5 relative self-stretch w-full">
          {/* Bordered frame around read-only fields */}
          <div className="w-full rounded-[var(--corner-radius-large)] border border-color-mode-text-icons-t-placeholder bg-white p-4 shadow-sm">
            {(() => {
              const fields = [
                { label: "اسم المنتج", value: productInfo.productName },
                { label: "تصنيف المنتج", value: productInfo.category },
                { label: "الكمية المتاحة", value: productInfo.availableQuantity },
                { label: "السعر (رس)", value: productInfo.price },
              ];

              const rows = [] as JSX.Element[];
              for (let i = 0; i < fields.length; i += 2) {
                const row = fields.slice(i, i + 2);
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
                  </div>
                );
              }

              // Add description field full width
              rows.push(
                <div key="description" className="flex flex-col gap-2 w-full mb-4">
                  <label className="text-sm font-normal text-[var(--form-readonly-label-color)] text-right [direction:rtl]">
                    وصف المنتج
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-[10px] border border-color-mode-text-icons-t-placeholder text-[var(--form-readonly-input-text-color)] text-right [direction:rtl]">
                    {productInfo.description}
                  </div>
                </div>
              );

              return rows;
            })()}
          </div>

          {/* Edit Button */}
          <div className="w-full flex items-center justify-end">
            <button
              type="button"
              className="px-4 h-10 rounded-[10px] bg-yellow-500 hover:bg-yellow-600 text-white font-medium"
            >
              تعديل البيانات
            </button>
          </div>
        </section>
      </div>

      {/* Product Images Card */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <div className="w-full">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">صور المنتج</h2>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden"
              >
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales table section */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <header className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center justify-end gap-1.5">
            <Package className="w-5 h-5 text-gray-500" />
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              مبيعات المنتج (125)
            </h2>
          </div>
        </header>

        {/* Time Filters */}
        <div className="flex gap-2 mb-4" dir="rtl">
          {timeFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedTimeFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTimeFilter === filter
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

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
            totalPages={Math.ceil(sales.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default PetrolifeProductDetails;

