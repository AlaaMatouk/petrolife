import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Table, Pagination, LoadingSpinner } from "../../../shared";
import {
  ArrowLeft,
  Info,
  MoreVertical,
  Star,
  Package,
  Building2,
} from "lucide-react";
import { fetchProductById } from "../../../../services/firestore";

interface ProductInfo {
  productName: string;
  category: string;
  availableQuantity: string;
  price: string;
  description: string;
  image?: string | null;
}

const formatValue = (value: any, fallback = "-"): string => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toString() : fallback;
  }

  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : fallback;
};

const PetrolifeProductDetails = (): JSX.Element => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("12 شهر");
  const itemsPerPage = 10;
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeFilters = ["اسبوع", "30 يوم", "6 شهور", "12 شهر"];

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setError("معرف المنتج غير متوفر.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const product = await fetchProductById(id);

        setProductInfo({
          productName: formatValue(product?.title?.ar ?? product?.title?.en),
          category: formatValue(product?.category),
          availableQuantity: formatValue(product?.quantity),
          price: formatValue(product?.price),
          description: formatValue(product?.desc?.ar ?? product?.desc?.en),
          image: product?.image ?? null,
        });
      } catch (err) {
        console.error("Failed to load product details:", err);
        setError("فشل في تحميل بيانات المنتج.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const columns = useMemo(
    () => [
      {
        key: "deliveryStatus",
        label: "حالة التوصيل",
        width: "min-w-[120px]",
        priority: "high",
      },
      {
        key: "rating",
        label: "التقييم",
        width: "min-w-[100px]",
        priority: "high",
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
      },
      {
        key: "buyerName",
        label: "اسم المشتري",
        width: "min-w-[180px]",
        priority: "high",
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
    () => [] as any[],
    [currentPage]
  );

  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-16">
        <LoadingSpinner message="جاري تحميل بيانات المنتج..." />
      </div>
    );
  }

  if (error || !productInfo) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-20 gap-4">
        <div className="text-red-600 text-lg [direction:rtl]">
          {error || "لا توجد بيانات لهذا المنتج."}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white"
        >
          الرجوع
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full items-start gap-5">
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center justify-end gap-1.5">
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              معلومات المنتج
            </h1>
            <Info className="w-5 h-5 text-gray-500" />
          </div>
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

        <section className="flex flex-col items-start gap-5 relative self-stretch w-full">
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
        </section>
      </div>

      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <div className="w-full">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">صور المنتج</h2>
          <div className="flex gap-3">
            {[productInfo.image, productInfo.image, productInfo.image, null, null].map(
              (img, i) => (
                <div
                  key={i}
                  className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden"
                >
                  {img ? (
                    <img
                      src={img}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-gray-400" />
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <header className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center justify-end gap-1.5">
            <Package className="w-5 h-5 text-gray-500" />
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              مبيعات المنتج
            </h2>
          </div>
        </header>

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
            totalPages={1}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default PetrolifeProductDetails;

