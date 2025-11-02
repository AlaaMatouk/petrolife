import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Pagination } from "../../../shared";
import {
  ArrowLeft,
  Eye,
  MoreVertical,
  Download,
  FileSpreadsheet,
  FileText,
  UserRound,
  Plus,
  Building2,
} from "lucide-react";
import { createPortal } from "react-dom";

// Dummy car info matching screenshot style
const carInfo = {
  plateNumber: "215436654",
  creator: "احمد محمد على",
  carName: "",
  creationDate: "12 فبراير 2025 10:15 ص",
  chassisNumber: "21452635",
  numberOfDrivers: "2",
  carImage: "/img/car-image.png",
};

// Dummy drivers data
const drivers = Array.from({ length: 48 }).map((_, i) => ({
  id: i + 1,
  driverCode: "21A254",
  driverName: { name: "احمد محمد", avatar: undefined },
  phone: "00965284358",
  email: "ahmedmohamed@gmail.com",
  city: "الرياض",
  accountStatus: { active: true, text: "مفعل" },
}));

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
    console.log("Export drivers as", format);
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

const PetrolifeCarDetails = (): JSX.Element => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(3);
  const itemsPerPage = 10;

  const columns = useMemo(
    () => [
      {
        key: "accountStatus",
        label: "حالة الحساب",
        width: "min-w-[120px]",
        priority: "high",
        render: (value: { active: boolean; text: string }) => (
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                value.active ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span className="text-sm text-gray-700">{value.text}</span>
          </div>
        ),
      },
      {
        key: "city",
        label: "المدينة",
        width: "min-w-[100px]",
        priority: "high",
      },
      {
        key: "email",
        label: "البريد الألكتروني",
        width: "min-w-[150px]",
        priority: "medium",
      },
      {
        key: "phone",
        label: "رقم الهاتف",
        width: "min-w-[130px]",
        priority: "high",
      },
      {
        key: "driverName",
        label: "اسم السائق",
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
        key: "driverCode",
        label: "كود السائق",
        width: "min-w-[120px]",
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
      drivers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [currentPage]
  );

  return (
    <div className="flex flex-col w-full items-start gap-5">
      {/* Car Info Card */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <div className="flex items-center justify-between w-full">
          {/* Title on right */}
          <div className="flex items-center justify-end gap-1.5">
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              معلومات المركبة
            </h1>
            <Eye className="w-5 h-5 text-gray-500" />
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

        {/* Car info - read-only inputs style */}
        <section className="flex flex-col items-start gap-5 relative self-stretch w-full">
          {/* Car Image */}
          <div className="flex items-start gap-5 w-full">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                {carInfo.carImage ? (
                  <img
                    src={carInfo.carImage}
                    alt="Car"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {/* Bordered frame around read-only fields */}
          <div className="w-full rounded-[var(--corner-radius-large)] border border-color-mode-text-icons-t-placeholder bg-white p-4 shadow-sm">
            {(() => {
              const fields = [
                { label: "رقم اللوحة", value: carInfo.plateNumber },
                { label: "المنشيء", value: carInfo.creator },
                { label: "اسم المركبة", value: carInfo.carName || "الاسم" },
                { label: "تاريخ الانشاء", value: carInfo.creationDate },
                { label: "رقم الهيكل", value: carInfo.chassisNumber },
                { label: "عدد السائقين", value: carInfo.numberOfDrivers },
              ];

              const rows = [] as JSX.Element[];
              for (let i = 0; i < fields.length; i += 3) {
                const row = fields.slice(i, i + 3);
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
        </section>
      </div>

      {/* Drivers table section */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <header className="flex items-center justify-between w-full">
          <div className="flex items-center justify-end gap-1.5">
            <UserRound className="w-5 h-5 text-gray-500" />
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              السائقين المضافين للمركبة
            </h2>
          </div>
          <div className="inline-flex items-center gap-[var(--corner-radius-medium)]">
            <button className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray">
              <div className="flex items-center gap-[var(--corner-radius-small)]">
                <span className="font-body-body-2 text-[length:var(--body-body-2-font-size)] text-color-mode-text-icons-t-sec [direction:rtl]">
                  إضافة سائق جديد للمركبة
                </span>
                <Plus className="w-4 h-4 text-gray-500" />
              </div>
            </button>
            <ExportMenu />
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
            totalPages={Math.ceil(drivers.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default PetrolifeCarDetails;

