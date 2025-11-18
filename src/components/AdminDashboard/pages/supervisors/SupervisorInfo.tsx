import { UserRound, ArrowLeft, History } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import checkIcon from "../../../../assets/imgs/icons/checkbox.svg";
import { DataTableSection } from "../../../sections/DataTableSection";

interface SupervisorInfoProps {
  supervisorData: any;
}

// Mock data type for supervisor activity log
interface SupervisorActivity {
  id: number;
  event: string;
  number: string;
  date: string;
}

// Mock data for supervisor activity log
const mockSupervisorActivities: SupervisorActivity[] = [
  {
    id: 1,
    event:
      "قام المشرف بإضافة اسم_المستخدم كعميل من خلال صلاحيته في إدارة الأفراد",
    number: "1",
    date: "2025-01-01",
  },
  {
    id: 2,
    event:
      "قام المشرف بإضافة اسم_المستخدم كعميل من خلال صلاحيته في إدارة الأفراد",
    number: "2",
    date: "2025-01-01",
  },
  {
    id: 3,
    event:
      "قام المشرف بإضافة اسم_المستخدم كعميل من خلال صلاحيته في إدارة الأفراد",
    number: "3",
    date: "2025-01-01",
  },
  {
    id: 4,
    event:
      "قام المشرف بإضافة اسم_المستخدم كعميل من خلال صلاحيته في إدارة الأفراد",
    number: "4",
    date: "2025-01-01",
  },
  {
    id: 5,
    event:
      "قام المشرف بإضافة اسم_المستخدم كعميل من خلال صلاحيته في إدارة الأفراد",
    number: "5",
    date: "2025-01-01",
  },
];

// Columns configuration for supervisor activity log
const activityColumns = [
  {
    key: "actions",
    priority: "high" as const,
  },
  {
    key: "date",
    label: "التاريخ",
    priority: "high" as const,
  },
  {
    key: "event",
    label: "الحدث",
    priority: "high" as const,
  },
  {
    key: "number",
    label: "الرقم",
    priority: "medium" as const,
  },
];

// Mock data fetching function
const fetchSupervisorActivities = async (): Promise<SupervisorActivity[]> => {
  return mockSupervisorActivities;
};

export const SupervisorInfo = ({
  supervisorData,
}: SupervisorInfoProps): JSX.Element => {
  const navigate = useNavigate();
  
  // Get supervisor ID from the data
  const supervisorId = supervisorData.id;

  // Helper function to get value or dash
  const getValueOrDash = (value: any): string => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    return String(value);
  };

  // Extract supervisor information from Firestore data
  const supervisorInfo = {
    name: getValueOrDash(supervisorData.supervisorName || supervisorData.name),
    supervisorCode: getValueOrDash(
      supervisorData.supervisorCode ||
        supervisorData.code ||
        supervisorData.employeeNumber
    ),
    email: getValueOrDash(supervisorData.email),
    phone: getValueOrDash(supervisorData.phone || supervisorData.phoneNumber),
    city: getValueOrDash(
      supervisorData.city?.name?.ar ||
        supervisorData.city?.name?.en ||
        supervisorData.city
    ),
    accountStatus:
      supervisorData.accountStatus?.text ||
      (supervisorData.accountStatus?.active ? "مفعل" : "غير مفعل"),
    isActive:
      supervisorData.accountStatus?.active ?? supervisorData.isActive ?? true,
    permissions: supervisorData.permissions || [],
  };

  // Define all fields to display in 3-column layout
  const fields = [
    { label: "اسم المشرف", value: supervisorInfo.name },
    { label: "البريد الإلكتروني", value: supervisorInfo.email },
    { label: "كود المشرف", value: supervisorInfo.supervisorCode },
    { label: "رقم الهاتف", value: supervisorInfo.phone },
    { label: "المدينة", value: supervisorInfo.city },
    { label: "حالة الحساب", value: supervisorInfo.accountStatus },
  ];

  // Helper function to render field
  const renderField = (field: { label: string; value: string }) => (
    <div className="flex flex-col gap-2 flex-1">
      <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
        {field.label}
      </label>
      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
        {field.value}
      </div>
    </div>
  );

  // Helper function to render rows of 3 columns
  const renderFieldRows = () => {
    const rows = [];
    for (let i = 0; i < fields.length; i += 3) {
      const rowFields = fields.slice(i, i + 3);
      rows.push(
        <div
          key={i}
          className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]"
        >
          {rowFields.map((field, index) => (
            <React.Fragment key={index}>{renderField(field)}</React.Fragment>
          ))}
          {/* Fill remaining columns if less than 3 */}
          {rowFields.length < 3 &&
            Array.from({ length: 3 - rowFields.length }).map((_, index) => (
              <div key={`empty-${index}`} className="flex-1" />
            ))}
        </div>
      );
    }
    return rows;
  };

  return (
    <div>
      <main
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
        data-model-id="supervisor-info"
      >
        <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
          <nav className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]"
              aria-label="العودة"
            >
              <div className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </div>
            </button>

            <div className="flex w-[134px] items-center justify-end gap-1.5 relative">
              <h1 className="w-[145px] h-5 mt-[-1.00px] ml-[-35.00px] font-bold text-[var(--form-section-title-color)] text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap relative [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
                معلومات المشرف
              </h1>
              <UserRound className="w-5 h-5 text-gray-500" />
            </div>
          </nav>
        </header>

        <section className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-end gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
            <form className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              {/* Dynamic fields in 3-column layout */}
              {renderFieldRows()}

              {/* Supervisor Permissions Section */}
              <div className="flex flex-col items-end gap-4 relative self-stretch w-full flex-[0_0_auto]">
                <h3 className="text-[14px] font-normal text-[var(--form-section-title-color)] [direction:rtl] text-right">
                  صلاحيات المشرف
                </h3>

                {supervisorInfo.permissions.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 w-full">
                    {supervisorInfo.permissions.map(
                      (permission: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center text-[#5B738B] text-[14px] font-normal [direction:rtl] p-[10px] rounded-[4px] gap-1 bg-white"
                          style={{
                            border: "0.5px solid #A9B4BE",
                            direction: "rtl",
                          }}
                        >
                          <img src={checkIcon} alt={permission} />
                          {permission}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="w-full p-4 text-center text-gray-500 bg-gray-50 rounded-lg [direction:rtl]">
                    لا توجد صلاحيات محددة لهذا المشرف
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                <button
                  onClick={() => navigate(`/supervisors/add?edit=${supervisorId}`)}
                  className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#FFFCEC" }}
                  aria-label="تعديل البيانات"
                >
                  <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                    <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-color-mode-text-icons-t-orange text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
                      تعديل البيانات
                    </div>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* Supervisor Activity Log Section - Using DataTableSection */}
      <div className="mt-[var(--corner-radius-large)]">
        <DataTableSection<SupervisorActivity>
          title="سجل المشرف"
          entityName="نشاط"
          entityNamePlural="أنشطة"
          icon={History}
          columns={activityColumns}
          fetchData={fetchSupervisorActivities}
          addNewRoute=""
          viewDetailsRoute={(id) => `/supervisor-activity/${id}`}
          loadingMessage="جاري تحميل سجل المشرف..."
          itemsPerPage={5}
          showTimeFilter={false}
          showAddButton={false}
        />
      </div>
    </div>
  );
};
