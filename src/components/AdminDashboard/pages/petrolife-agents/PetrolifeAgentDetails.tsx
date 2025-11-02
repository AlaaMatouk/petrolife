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
  Building2,
  MessageSquare,
} from "lucide-react";
import { createPortal } from "react-dom";

// Dummy agent info matching screenshot style
const agentInfo = {
  name: "محمد احمد علي",
  email: "hesham@gmail.com",
  phone: "رقم الهاتف هنا",
  city: "الرياض",
  address: "الصائن، 7453، حي قرطبة، Riyadh 13245, Saudi Arabia",
  joinDate: "12 فبراير 2025 10:15 ص",
  agentCode: "21452368452",
  commissionValue: "10",
  numberOfCompanies: "48",
};

// Dummy companies data
const companies = Array.from({ length: 48 }).map((_, i) => ({
  id: i + 1,
  companyCode: "21A254",
  companyName: { name: "شركة النصر الدولية", logo: "/img/company-logo.png" },
  phone: "00965284358",
  email: "ahmedmohamed@gmail.com",
  city: "الرياض",
  cars: i % 3 === 0 ? "14" : i % 3 === 1 ? "50" : i % 2 === 0 ? "24" : "26",
  drivers: "14",
  subscription: i % 10 === 0 ? "بريميوم" : "كلاسيك",
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
    console.log("Export companies as", format);
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

const PetrolifeAgentDetails = (): JSX.Element => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(3);
  const itemsPerPage = 10;

  const columns = useMemo(
    () => [
      {
        key: "companyCode",
        label: "كود الشركة",
        width: "min-w-[120px]",
        priority: "high",
      },
      {
        key: "companyName",
        label: "اسم الشركة",
        width: "min-w-[180px]",
        priority: "high",
        render: (value: { name: string; logo?: string }) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
              {value.logo ? (
                <img
                  src={value.logo}
                  alt={value.name}
                  className="w-full h-full rounded object-cover"
                />
              ) : (
                <Building2 className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <span className="font-medium text-gray-900">{value.name}</span>
          </div>
        ),
      },
      {
        key: "phone",
        label: "رقم الهاتف",
        width: "min-w-[130px]",
        priority: "high",
      },
      {
        key: "email",
        label: "البريد الألكتروني",
        width: "min-w-[150px]",
        priority: "medium",
      },
      {
        key: "city",
        label: "المدينة",
        width: "min-w-[100px]",
        priority: "medium",
      },
      {
        key: "cars",
        label: "السيارات",
        width: "min-w-[90px]",
        priority: "high",
      },
      {
        key: "drivers",
        label: "السائقين",
        width: "min-w-[90px]",
        priority: "high",
      },
      {
        key: "subscription",
        label: "الاشتراكات",
        width: "min-w-[120px]",
        priority: "high",
        render: (value: string) => (
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            {value}
          </span>
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
      companies.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [currentPage]
  );

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
              معلومات المندوب
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

        {/* Agent info - read-only inputs style (3 columns) */}
        <section className="flex flex-col items-start gap-5 relative self-stretch w-full">
          <div className="flex items-start gap-5 w-full">
            {/* Avatar */}
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold">
                {agentInfo.name.charAt(0)}
              </div>
            </div>
          </div>

          {/* Agent Name */}
          <div className="w-full">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              اسم المندوب
            </label>
            <div className="text-lg font-semibold text-gray-900">
              {agentInfo.name}
            </div>
          </div>

          {/* Bordered frame around read-only fields */}
          <div className="w-full rounded-[var(--corner-radius-large)] border border-color-mode-text-icons-t-placeholder bg-white p-4 shadow-sm">
            {(() => {
              const fields = [
                { label: "البريد الإلكتروني", value: agentInfo.email },
                { label: "رقم الهاتف", value: agentInfo.phone },
                { label: "المدينة", value: agentInfo.city },
                { label: "العنوان", value: agentInfo.address },
                { label: "تاريخ الانضمام", value: agentInfo.joinDate },
                { label: "كود المندوب", value: agentInfo.agentCode },
                { label: "قيمة العمولة (%)", value: agentInfo.commissionValue },
                { label: "عدد الشركات المضافة", value: agentInfo.numberOfCompanies },
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

          {/* Actions: Contact and Edit */}
          <div className="w-full flex items-center gap-3">
            <button
              type="button"
              className="px-4 h-10 rounded-[10px] border border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              تواصل مع المندوب
            </button>
          </div>
        </section>
      </div>

      {/* Companies table section */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <header className="flex items-center justify-between w-full">
          <div className="flex items-center justify-end gap-1.5">
            <Building2 className="w-5 h-5 text-gray-500" />
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              الشركات المضافة (48)
            </h2>
          </div>
          <div className="inline-flex items-center gap-[var(--corner-radius-medium)]">
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
            totalPages={Math.ceil(companies.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default PetrolifeAgentDetails;

