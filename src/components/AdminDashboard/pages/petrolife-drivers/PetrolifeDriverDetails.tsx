import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Table, Pagination, LoadingSpinner } from "../../../shared";
import {
  ArrowLeft,
  UserRound,
  MoreVertical,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { createPortal } from "react-dom";
import { fetchDriverDocumentById, fetchAllOrdersDocuments } from "../../../../services/firestore";

const StatusBadge = ({
  text,
  color,
  bg,
}: {
  text: string;
  color: string;
  bg: string;
}) => (
  <span
    className={`inline-flex items-center gap-2 ${bg} ${color} rounded-full px-2 py-0.5 text-xs`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${color.replace("text-", "bg-")}`}
    />
    {text}
  </span>
);

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
    console.log("Export driver trips as", format);
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

const PetrolifeDriverDetails = (): JSX.Element => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverInfo, setDriverInfo] = useState<{
    id: string;
    driverCode: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    carNumber: string;
    status: string;
    lastUsed: string;
    avatar: string;
  } | null>(null);
  const [orders, setOrders] = useState<
    Array<{
      tripNumber: string;
      fuelType: string;
      litreAmount: string;
      deliveryAddress: string;
      orderDate: string;
      orderStatus: string;
    }>
  >([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const mapDriverDocumentToInfo = (driver: any) => {
    const fallback = (value: any, defaultValue = "-") =>
      value === null || value === undefined || value === ""
        ? defaultValue
        : String(value);

    const driverCodeValue =
      driver?.id ?? driver?.uId ?? (driver?.docId ? String(driver.docId) : "-");

    const cityValue =
      driver?.city && typeof driver.city === "object"
        ? driver.city?.name?.ar || driver.city?.name?.en
        : driver?.city;

    const carNumberValue =
      driver?.car?.plateNumber?.en ||
      driver?.car?.plateNumber?.ar ||
      driver?.car?.plateNumber ||
      driver?.plateNumber?.en ||
      driver?.plateNumber?.ar ||
      driver?.plateNumber;

    const avatarValue =
      driver?.avatar ||
      driver?.imageUrl ||
      driver?.profileImage ||
      driver?.driverImage ||
      "/img/image-2.png";

    const addressValue =
      driver?.address ||
      driver?.location ||
      driver?.city?.address ||
      driver?.car?.address;

    const lastUsedValue =
      driver?.lastUsedAt ||
      driver?.lastTransactionDate ||
      driver?.lastTripDate ||
      "-";

    return {
      id: fallback(driver?.docId ?? driver?.id ?? driver?.uId ?? id ?? "-"),
      driverCode: fallback(driverCodeValue),
      name: fallback(driver?.name ?? driver?.driverName ?? driver?.fullName),
      email: fallback(driver?.email),
      phone: fallback(driver?.phoneNumber ?? driver?.phone ?? driver?.mobile),
      city: fallback(cityValue, "غير محدد"),
      address: fallback(addressValue, "غير محدد"),
      carNumber: fallback(carNumberValue, "-"),
      status: driver?.isActive === true ? "نشط" : "معطل",
      lastUsed:
        lastUsedValue && lastUsedValue !== "-"
          ? fallback(lastUsedValue)
          : "غير متوفر",
      avatar: String(avatarValue),
    };
  };

  useEffect(() => {
    const loadDriverInfo = async () => {
      if (!id) {
        setError("لم يتم العثور على معرف السائق.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const driver = await fetchDriverDocumentById(id);
        const mappedDriver = mapDriverDocumentToInfo(driver);
        setDriverInfo(mappedDriver);

        try {
          setOrdersLoading(true);
          setOrdersError(null);

          const allOrders = await fetchAllOrdersDocuments();
          const filteredOrders = allOrders.filter((order: any) => {
            const serviceMatch =
              order?.service?.desc?.ar === "نصلك في أسرع وقد لتزويدك بالوقود" ||
              order?.service?.id === "0987eXediDwG7LrN9gtk";

            if (!serviceMatch) {
              return false;
            }

            const assigned = order?.assignedDriver || {};

            const matchesDriver =
              (mappedDriver?.id &&
                (order?.assignedDriver === mappedDriver.id ||
                  assigned?.id === mappedDriver.id)) ||
              (mappedDriver?.driverCode &&
                (order?.assignedDriver === mappedDriver.driverCode ||
                  assigned?.id === mappedDriver.driverCode)) ||
              (mappedDriver?.email &&
                (assigned?.email === mappedDriver.email ||
                  order?.assignedDriver === mappedDriver.email)) ||
              (mappedDriver?.phone &&
                (assigned?.phoneNumber === mappedDriver.phone ||
                  order?.assignedDriver === mappedDriver.phone)) ||
              (mappedDriver?.phone &&
                assigned?.phone === mappedDriver.phone) ||
              (mappedDriver?.phone &&
                assigned?.mobile === mappedDriver.phone) ||
              (mappedDriver?.id &&
                assigned?.uid === mappedDriver.id) ||
              (mappedDriver?.driverCode &&
                assigned?.driverCode === mappedDriver.driverCode) ||
              (mappedDriver?.email &&
                assigned?.contactEmail === mappedDriver.email) ||
              (mappedDriver?.phone &&
                assigned?.contactPhone === mappedDriver.phone);

            return matchesDriver;
          });

          const mappedOrders = filteredOrders.map((order: any) => {
            const getValue = (value: any, fallback = "-") =>
              value === null || value === undefined || value === ""
                ? fallback
                : value;

            const tripNumber =
              getValue(order?.refId) || getValue(order?.id, "-");

            const fuelType =
              order?.selectedOption?.name?.ar ||
              order?.selectedOption?.label ||
              "-";

            const litreAmount = getValue(order?.totalLitre, "-");

            const deliveryAddress =
              order?.location?.address ||
              order?.carStation?.address ||
              "-";

            const orderDate = getValue(order?.createdDate, "-");

            const orderStatus = getValue(order?.status, "-");

            return {
              tripNumber: String(tripNumber),
              fuelType: String(fuelType),
              litreAmount: String(litreAmount),
              deliveryAddress: String(deliveryAddress),
              orderDate: String(orderDate),
              orderStatus: String(orderStatus),
            };
          });

          setOrders(mappedOrders);
        } catch (ordersErr) {
          console.error("Failed to load driver orders:", ordersErr);
          setOrdersError("فشل في تحميل رحلات السائق.");
          setOrders([]);
        } finally {
          setOrdersLoading(false);
        }
      } catch (err) {
        console.error("Failed to load driver details:", err);
        setError("فشل في تحميل بيانات السائق.");
        setOrders([]);
        setOrdersLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadDriverInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const columns = useMemo(
    () => [
      {
        key: "tripNumber",
        label: "رقم الرحلة",
        width: "min-w-[90px]",
        priority: "high",
      },
      {
        key: "fuelType",
        label: "نوع الوقود",
        width: "min-w-[90px]",
        priority: "high",
      },
      {
        key: "litreAmount",
        label: "الكمية (لتر)",
        width: "min-w-[90px]",
        priority: "high",
      },
      {
        key: "deliveryAddress",
        label: "عنوان التوصيل",
        width: "min-w-[220px]",
        priority: "medium",
      },
      {
        key: "orderDate",
        label: "تاريخ الطلب",
        width: "min-w-[160px]",
        priority: "medium",
      },
      {
        key: "orderStatus",
        label: "حالة الطلب",
        width: "min-w-[140px]",
        priority: "high",
        render: (value: any) => (
          <StatusBadge
            text={getOrderStatusLabel(value)}
            color={getOrderStatusColor(value).color}
            bg={getOrderStatusColor(value).bg}
          />
        ),
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

  const paginated = useMemo(() => {
    return Array.isArray(orders)
      ? orders.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
        )
      : [];
  }, [orders, currentPage]);

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return { color: "text-yellow-600", bg: "bg-yellow-50" };
      case "assigned":
        return { color: "text-blue-600", bg: "bg-blue-50" };
      case "onWay":
        return { color: "text-orange-600", bg: "bg-orange-50" };
      case "done":
        return { color: "text-green-600", bg: "bg-green-50" };
      case "canceled":
        return { color: "text-red-600", bg: "bg-red-50" };
      default:
        return { color: "text-gray-600", bg: "bg-gray-50" };
    }
  };

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "معلق";
      case "assigned":
        return "تم التعيين";
      case "onWay":
        return "في الطريق";
      case "done":
        return "مكتمل";
      case "canceled":
        return "ملغي";
      default:
        return status || "-";
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-20">
        <LoadingSpinner size="lg" message="جاري تحميل بيانات السائق..." />
      </div>
    );
  }

  if (error || !driverInfo) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-20">
        <div className="text-red-600 text-lg [direction:rtl]">
          {error || "لا توجد بيانات متاحة لهذا السائق."}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 px-4 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white"
        >
          الرجوع
        </button>
      </div>
    );
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
              معلومات السائق
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

        {/* Driver info - read-only inputs style (3 columns) */}
        <section className="flex flex-col items-start gap-5 relative self-stretch w-full">
          <div className="flex items-start gap-5 w-full">
            {/* Avatar */}
            <div className="flex flex-col items-center justify-center gap-2">
              <img
                src={driverInfo.avatar}
                alt="avatar"
                className="w-16 h-16 rounded-lg object-cover"
              />
            </div>
          </div>

          {/* Bordered frame around read-only fields */}
          <div className="w-full rounded-[var(--corner-radius-large)] border border-color-mode-text-icons-t-placeholder bg-white p-4 shadow-sm">
            {(() => {
              const fields = [
                { label: "كود السائق", value: driverInfo.driverCode },
                { label: "اسم السائق", value: driverInfo.name },
                { label: "رقم الهاتف", value: driverInfo.phone },
                { label: "البريد الإلكتروني", value: driverInfo.email },
                { label: "المدينة", value: driverInfo.city },
                { label: "العنوان", value: driverInfo.address },
                { label: "رقم السيارة", value: driverInfo.carNumber },
                { label: "حالة الحساب", value: driverInfo.status },
                { label: "آخر استخدام", value: driverInfo.lastUsed },
              ];

              const rows = [] as JSX.Element[];
              for (let i = 0; i < fields.length; i += 3) {
                const row = fields.slice(i, i + 3);
                rows.push(
                  <div key={i} className="flex items-start gap-5 w-full">
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
              className="px-4 h-10 rounded-[10px] border border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray"
            >
              تواصل مع السائق
            </button>
          </div>
        </section>
      </div>

      {/* Deliveries table section */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <header className="flex items-center justify-between w-full">
          <div className="flex items-center justify-end gap-1.5">
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              رحلات توصيل الوقود
            </h2>
          </div>
          <div className="inline-flex items-center gap-[var(--corner-radius-medium)]">
            <ExportMenu />
          </div>
        </header>

        {/* Bordered frame around table and pagination */}
        <div className="w-full rounded-[var(--corner-radius-large)] border border-color-mode-text-icons-t-placeholder bg-white p-4 shadow-sm">
          {ordersLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner message="جاري تحميل رحلات السائق..." />
            </div>
          ) : ordersError ? (
            <div className="py-12 text-center text-red-600">
              {ordersError}
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              لا توجد رحلات توصيل وقود لهذا السائق
            </div>
          ) : (
            <>
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
                totalPages={
                  Math.ceil((orders?.length || 0) / itemsPerPage) || 1
                }
                onPageChange={setCurrentPage}
            />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetrolifeDriverDetails;
