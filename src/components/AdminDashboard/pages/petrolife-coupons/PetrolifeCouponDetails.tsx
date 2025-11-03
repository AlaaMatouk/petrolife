import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Pagination, TimeFilter } from "../../../shared";
import {
  ArrowLeft,
  Info,
  MoreVertical,
  User,
  Building2,
} from "lucide-react";

// Dummy coupon info matching screenshot style
const couponInfo = {
  discountPercentage: "10",
  discountCode: "21542635",
  capacity: "200",
  maxDiscount: "5000",
  expirationDate: "21 فبراير 2025",
  couponStatus: { status: "جاري", color: "blue" },
  categories: "زيوت ، غسيل",
  numberOfBeneficiaries: "150",
  beneficiary: "شركات ، افراد",
};

// Dummy beneficiaries data
const generateBeneficiaries = () => {
  const beneficiaries = [];
  const startDate = new Date("2024-01-01");
  
  for (let i = 0; i < 145; i++) {
    const daysOffset = Math.floor(i / 10);
    const date = new Date(startDate);
    date.setDate(date.getDate() + daysOffset);
    
    const isCompany = i === 0 || i % 10 !== 0;
    const accountType = isCompany ? "شركة" : "فرد";
    const name = isCompany
      ? i === 0
        ? "شركة النصر"
        : `أحمد محمد`
      : `أحمد محمد`;
    
    const purchaseValue = (Math.random() * 100 + 50).toFixed(0);
    const discountValue = (parseFloat(purchaseValue) * 0.1).toFixed(0);
    
    beneficiaries.push({
      id: i + 1,
      number: i + 1,
      beneficiaryName: {
        name,
        avatar: undefined,
        isCompany: isCompany && i === 0,
      },
      accountType,
      purchaseValue,
      discountValue,
      creationDate: `${date.getDate()} فبراير ${date.getFullYear()} - ${date.getHours() % 12 || 12}:${date.getMinutes().toString().padStart(2, "0")} ${date.getHours() >= 12 ? "م" : "ص"}`,
    });
  }
  
  return beneficiaries;
};

const allBeneficiaries = generateBeneficiaries();

const PetrolifeCouponDetails = (): JSX.Element => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(3);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("اخر 12 شهر");
  const itemsPerPage = 10;

  // Filter beneficiaries based on time filter
  const filteredBeneficiaries = useMemo(() => {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (selectedTimeFilter) {
      case "اخر اسبوع":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "اخر 30 يوم":
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case "اخر 6 شهور":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "اخر 12 شهر":
        cutoffDate.setMonth(now.getMonth() - 12);
        break;
      default:
        return allBeneficiaries;
    }
    
    return allBeneficiaries.filter((beneficiary) => {
      // Parse the creation date - simple parsing for this demo
      const dateStr = beneficiary.creationDate.split(" - ")[0];
      const [day, monthName] = dateStr.split(" ");
      const monthMap: Record<string, number> = {
        يناير: 0, فبراير: 1, مارس: 2, أبريل: 3, مايو: 4, يونيو: 5,
        يوليو: 6, أغسطس: 7, سبتمبر: 8, أكتوبر: 9, نوفمبر: 10, ديسمبر: 11,
      };
      const month = monthMap[monthName] || 0;
      const year = 2024 + Math.floor(Math.random() * 2); // Random year between 2024-2025
      const beneficiaryDate = new Date(year, month, parseInt(day));
      
      return beneficiaryDate >= cutoffDate;
    });
  }, [selectedTimeFilter]);

  const columns = useMemo(
    () => [
      {
        key: "number",
        label: "الرقم",
        width: "min-w-[80px]",
        priority: "high",
      },
      {
        key: "beneficiaryName",
        label: "اسم المستفيد",
        width: "min-w-[180px]",
        priority: "high",
        render: (value: { name: string; avatar?: string; isCompany?: boolean }) => (
          <div className="flex items-center gap-2">
            {value.isCompany ? (
              <Building2 className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white" />
            ) : (
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
            )}
            <span className="font-medium text-gray-900">{value.name}</span>
          </div>
        ),
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
        key: "purchaseValue",
        label: "قيمة المشتريات (ر.س)",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "discountValue",
        label: "قيمة الخصم (ر.س)",
        width: "min-w-[130px]",
        priority: "high",
      },
      {
        key: "creationDate",
        label: "تاريخ الانشاء",
        width: "min-w-[180px]",
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


  const paginated = useMemo(
    () =>
      filteredBeneficiaries.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filteredBeneficiaries, currentPage]
  );

  return (
    <div className="flex flex-col w-full items-start gap-5">
      {/* Coupon Info Card */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <div className="flex items-center justify-between w-full">
          {/* Title on right */}
          <div className="flex items-center justify-end gap-1.5">
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              معلومات الكوبون
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

        {/* Coupon info - read-only inputs style */}
        <section className="flex flex-col items-start gap-5 relative self-stretch w-full">
          {/* Bordered frame around read-only fields */}
          <div className="w-full rounded-[var(--corner-radius-large)] border border-color-mode-text-icons-t-placeholder bg-white p-4 shadow-sm">
            {(() => {
              const fields = [
                { label: "الحد الأقصي للخصم (ر.س)", value: couponInfo.maxDiscount },
                { label: "نسبة الخصم (%)", value: couponInfo.discountPercentage },
                { label: "تاريخ الانتهاء", value: couponInfo.expirationDate },
                { label: "كود الخصم", value: couponInfo.discountCode },
                { label: "حالة الكوبون", value: couponInfo.couponStatus.status },
                { label: "سعة الكوبون", value: couponInfo.capacity },
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

              // Add full-width fields
              const fullWidthFields = [
                { label: "التصنيفات المتاحة", value: couponInfo.categories },
                { label: "الجهة المستفيدة", value: couponInfo.beneficiary },
              ];

              fullWidthFields.forEach((f) => {
                rows.push(
                  <div key={f.label} className="flex flex-col gap-2 w-full mb-4">
                    <label className="text-sm font-normal text-[var(--form-readonly-label-color)] text-right [direction:rtl]">
                      {f.label}
                    </label>
                    <div className="px-3 py-2 bg-gray-50 rounded-[10px] border border-color-mode-text-icons-t-placeholder text-[var(--form-readonly-input-text-color)] text-right [direction:rtl]">
                      {f.value}
                    </div>
                  </div>
                );
              });

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

      {/* Beneficiaries table section */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <header className="flex items-center justify-between w-full mb-4">
          {/* Right side - Title */}
          <div className="flex items-center justify-end gap-1.5">
            <User className="w-5 h-5 text-gray-500" />
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              المستفيدين ({filteredBeneficiaries.length})
            </h2>
          </div>
          {/* Left side - Time Filter */}
          <div className="flex items-center">
            <TimeFilter
              selectedFilter={selectedTimeFilter}
              onFilterChange={setSelectedTimeFilter}
            />
          </div>
        </header>

        {/* Bordered frame around table and pagination */}
        <div className="w-full rounded-[var(--corner-radius-large)] border border-color-mode-text-icons-t-placeholder bg-white p-4 shadow-sm">
          <div className="w-full overflow-x-auto hidden lg:block">
            <Table columns={columns as any} data={paginated as any} />
          </div>
          <div className="w-full overflow-x-auto hidden md:block lg:hidden">
            <Table
              columns={(columns as any).filter(
                (c: any) => c.priority !== "low"
              )}
              data={paginated as any}
            />
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredBeneficiaries.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default PetrolifeCouponDetails;

