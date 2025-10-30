import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Pagination } from "../../../shared";
import {
  ArrowLeft,
  UserRound,
  MoreVertical,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { createPortal } from "react-dom";

// Dummy driver info matching screenshot style
const driverInfo = {
  name: "محمد طارق محمد",
  email: "hesham@gmail.com",
  phone: "رقم الهاتف هنا",
  city: "الرياض",
  address: ", Riyadh 13245, Saudi Arabia ,شرطة ,7453 ص",
  carNumber: "2145364",
  lastUsed: "ص 10:15 ، 2025 فبراير 12",
  avatar: "/img/image-2.png",
};

// Dummy deliveries data
const deliveries = Array.from({ length: 24 }).map((_, i) => ({
  id: i + 1,
  tripNumber: "12563",
  fuelType: "بنزين 91",
  quantity: "200",
  address: "12 ش المنيل ، محافظة القاهرة",
  orderDate: "ص 5:05 - 2025 فبراير 21",
  status:
    i % 7 === 0
      ? { color: "text-red-600", bg: "bg-red-50", text: "ملغي" }
      : i % 3 === 0
      ? { color: "text-yellow-600", bg: "bg-yellow-50", text: "جاري التوصيل" }
      : i % 5 === 0
      ? { color: "text-blue-600", bg: "bg-blue-50", text: "طلب تغيير سائق" }
      : { color: "text-gray-600", bg: "bg-gray-50", text: "مكتمل" },
}));

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
        className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 rounded-[var(--corner-radius-small)] border-[0.8px] border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray"
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
  const [currentPage, setCurrentPage] = useState(3);
  const itemsPerPage = 10;

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
        key: "quantity",
        label: "الكمية (لتر)",
        width: "min-w-[90px]",
        priority: "high",
      },
      {
        key: "address",
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
        key: "status",
        label: "حالة الطلب",
        width: "min-w-[140px]",
        priority: "high",
        render: (value: any) => (
          <StatusBadge text={value.text} color={value.color} bg={value.bg} />
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

  const paginated = useMemo(
    () =>
      deliveries.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [currentPage]
  );

  return (
    <div className="flex flex-col w-full items-start gap-5">
      {/* Header */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-color-mode-text-icons-t-placeholder w-full"
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
                { label: "اسم السائق", value: driverInfo.name },
                { label: "البريد الإلكتروني", value: driverInfo.email },
                { label: "رقم الهاتف", value: driverInfo.phone },
                { label: "المدينة", value: driverInfo.city },
                { label: "العنوان", value: driverInfo.address },
                { label: "رقم السيارة", value: driverInfo.carNumber },
                { label: "تاريخ الاستخدام", value: driverInfo.lastUsed },
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
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <header className="flex items-center justify-between w-full">
          <div className="inline-flex items-center gap-[var(--corner-radius-medium)]">
            <ExportMenu />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              رحلات توصيل الوقود
            </h2>
          </div>
        </header>

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
            totalPages={Math.ceil(deliveries.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default PetrolifeDriverDetails;
