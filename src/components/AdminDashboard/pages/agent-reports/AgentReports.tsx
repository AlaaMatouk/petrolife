import { useState, useMemo } from "react";
import { Table, Pagination, ExportButton, TimeFilter } from "../../../shared";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Input, Select } from "../../../shared/Form";
import { MoreVertical, Download } from "lucide-react";
import { exportDataTable } from "../../../../services/exportService";
import { useToast } from "../../../../context/ToastContext";

// Mock data for 48 agent report entries with varied dates for time filtering
const generateMockData = () => {
  const now = new Date();
  const data = [];
  
  // Product types and names
  const productTypes = ["وقود", "زيوت", "إطارات", "فلاتر"];
  const productNames = [
    "بنزين 91 اخضر",
    "بنزين 95 أحمر",
    "ديزل",
    "زيت محرك",
    "زيت ناقل",
    "إطار محرك أمامي",
    "إطار محرك خلفي",
    "فلتر هواء",
    "فلتر زيت",
  ];

  // Agent and client names
  const agentNames = ["علي محمد", "أحمد حسن", "محمد عبدالله", "سعد إبراهيم", "خالد علي"];
  const clientNames = ["شركة النصر", "شركة التعاون", "شركة الخليج", "شركة الصقر", "شركة الأمل"];

  for (let i = 0; i < 48; i++) {
    // Distribute dates over different time periods
    const dateOffset = i < 8 ? 7 : i < 16 ? 30 : i < 32 ? 180 : 365;
    const date = new Date(now);
    date.setDate(now.getDate() - dateOffset);

    const day = date.getDate();
    const monthNames = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    const monthName = monthNames[date.getMonth()];

    data.push({
      id: i + 1,
      clientCode: 1000 + i,
      clientName: clientNames[i % clientNames.length],
      agentCode: 1254262 + i,
      agentName: agentNames[i % agentNames.length],
      productType: productTypes[i % productTypes.length],
      productNumber: 10260 + i,
      productName: productNames[i % productNames.length],
      quantity: (i % 10) * 5 + 10,
      date: `${day} ${monthName} ${date.getFullYear()} - ${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")} ${date.getHours() >= 12 ? "م" : "ص"}`,
      fullDate: date,
    });
  }
  
  return data;
};

const mockData = generateMockData();

// Action Menu Component for each row
interface ActionMenuProps {
  item: any;
}

const ActionMenu = ({ item }: ActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const updateMenuPosition = () => {
    if (!buttonRef) return;
    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 192;
    let left = rect.right + 4;
    if (left + menuWidth > window.innerWidth) {
      left = rect.left - menuWidth - 4;
    }
    setMenuPosition({
      top: rect.bottom + 4,
      left: Math.max(4, left),
    });
  };

  const handleDownload = () => {
    console.log("Download report for:", item);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={setButtonRef}
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(updateMenuPosition, 0);
        }}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="إجراءات"
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          {createPortal(
            <div
              className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <div className="py-1">
                <button
                  onClick={handleDownload}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>تحميل التقرير</span>
                  <Download className="w-4 h-4 text-gray-500" />
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

const AgentReports = () => {
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("12 شهر");
  const [filters, setFilters] = useState({
    reportType: "تحليلي",
    agentCode: "الكل",
    agentName: "الكل",
    clientType: "الكل",
    clientCode: "الكل",
    productName: "الكل",
  });
  const itemsPerPage = 10;

  // Get unique values for filter options from mockData
  const uniqueAgentCodes = useMemo(() => {
    return Array.from(new Set(mockData.map(item => String(item.agentCode))));
  }, []);

  const uniqueAgentNames = useMemo(() => {
    return Array.from(new Set(mockData.map(item => item.agentName).filter(Boolean)));
  }, []);

  const uniqueClientCodes = useMemo(() => {
    return Array.from(new Set(mockData.map(item => String(item.clientCode))));
  }, []);

  const uniqueProductNames = useMemo(() => {
    return Array.from(new Set(mockData.map(item => item.productName).filter(Boolean)));
  }, []);

  // Filter data based on time filter and all other filters
  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoffDate = new Date();
    let filtered = mockData;

    // Apply time filter
    switch (selectedTimeFilter) {
      case "اسبوع":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "30 يوم":
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case "6 شهور":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "12 شهر":
        cutoffDate.setMonth(now.getMonth() - 12);
        break;
      default:
        // No time filter, continue with all data
        break;
    }

    if (selectedTimeFilter !== "الكل" && selectedTimeFilter) {
      filtered = filtered.filter((item) => item.fullDate >= cutoffDate);
    }

    // Apply agentCode filter
    if (filters.agentCode && filters.agentCode !== "الكل") {
      filtered = filtered.filter((item) => 
        String(item.agentCode) === String(filters.agentCode)
      );
    }

    // Apply agentName filter
    if (filters.agentName && filters.agentName !== "الكل") {
      filtered = filtered.filter((item) => 
        item.agentName && item.agentName.includes(filters.agentName)
      );
    }

    // Apply clientType filter
    if (filters.clientType && filters.clientType !== "الكل") {
      filtered = filtered.filter((item) => 
        item.clientType && item.clientType === filters.clientType
      );
    }

    // Apply clientCode filter
    if (filters.clientCode && filters.clientCode !== "الكل") {
      filtered = filtered.filter((item) => 
        String(item.clientCode) === String(filters.clientCode)
      );
    }

    // Apply productName filter
    if (filters.productName && filters.productName !== "الكل") {
      filtered = filtered.filter((item) => 
        item.productName && item.productName.includes(filters.productName)
      );
    }

    return filtered;
  }, [selectedTimeFilter, filters]);

  const columns = useMemo(
    () => [
      {
        key: "actions",
        label: "الإجراءات",
        width: "w-16",
        priority: "high",
        render: (_: any, row: any) => (
          <div className="flex items-center justify-center">
            <ActionMenu item={row} />
          </div>
        ),
      },
      {
        key: "quantity",
        label: "الكمية",
        width: "min-w-[100px]",
        priority: "high",
      },
      {
        key: "productName",
        label: "اسم المنتج",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "productNumber",
        label: "رقم المنتج",
        width: "min-w-[120px]",
        priority: "high",
      },
      {
        key: "productType",
        label: "نوع المنتج",
        width: "min-w-[120px]",
        priority: "high",
      },
      {
        key: "agentName",
        label: "اسم المندوب",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "agentCode",
        label: "كود المندوب",
        width: "min-w-[120px]",
        priority: "high",
      },
      {
        key: "clientName",
        label: "اسم العميل",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "clientCode",
        label: "كود العميل",
        width: "min-w-[120px]",
        priority: "high",
      },
    ],
    []
  );

  const paginatedData = useMemo(
    () =>
      filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filteredData, currentPage]
  );

  const handleExport = async (format: string) => {
    try {
      const exportColumns = [
        { key: "clientCode", label: "كود العميل" },
        { key: "clientName", label: "اسم العميل" },
        { key: "agentCode", label: "كود المندوب" },
        { key: "agentName", label: "اسم المندوب" },
        { key: "productType", label: "نوع المنتج" },
        { key: "productNumber", label: "رقم المنتج" },
        { key: "productName", label: "اسم المنتج" },
        { key: "quantity", label: "الكمية" },
      ];

      await exportDataTable(
        filteredData,
        exportColumns,
        "agent-reports",
        format as "excel" | "pdf",
        "تقرير المندوبين"
      );

      addToast({
        type: "success",
        title: "نجح التصدير",
        message: `تم تصدير البيانات بنجاح كـ ${format === "excel" ? "Excel" : "PDF"}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      addToast({
        type: "error",
        title: "فشل التصدير",
        message: "حدث خطأ أثناء تصدير البيانات",
      });
    }
  };

  return (
    <div
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        {/* Title on right */}
        <div className="flex items-center justify-end gap-1.5">
          <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
            تقارير المندوبين ({filteredData.length})
          </h1>
          <Users className="w-5 h-5 text-gray-500" />
        </div>
        {/* Time Filter in middle */}
        <div className="flex items-center">
          <TimeFilter
            selectedFilter={selectedTimeFilter}
            onFilterChange={setSelectedTimeFilter}
            filters={["اسبوع", "30 يوم", "6 شهور", "12 شهر"]}
          />
        </div>
        {/* Export button on left */}
        <div className="flex items-center">
          <ExportButton onExport={handleExport} buttonText="تصدير" />
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="w-full flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
          <Select
            label="نوع التقرير"
            value={filters.reportType}
            onChange={(value) => setFilters((prev) => ({ ...prev, reportType: value }))}
            options={[
              { value: "تحليلي", label: "تحليلي" },
              { value: "تفصيلي", label: "تفصيلي" },
            ]}
          />
          <Select
            label="كود المندوب"
            value={filters.agentCode}
            onChange={(value) => setFilters((prev) => ({ ...prev, agentCode: value }))}
            options={[
              { value: "الكل", label: "الكل" },
              ...uniqueAgentCodes.map(code => ({ value: code, label: code })),
            ]}
          />
          <Select
            label="اسم المندوب"
            value={filters.agentName}
            onChange={(value) => setFilters((prev) => ({ ...prev, agentName: value }))}
            options={[
              { value: "الكل", label: "الكل" },
              ...uniqueAgentNames.map(name => ({ value: name, label: name })),
            ]}
          />
          <Select
            label="نوع العميل"
            value={filters.clientType}
            onChange={(value) => setFilters((prev) => ({ ...prev, clientType: value }))}
            options={[
              { value: "الكل", label: "الكل" },
            ]}
          />
          <Select
            label="كود العميل"
            value={filters.clientCode}
            onChange={(value) => setFilters((prev) => ({ ...prev, clientCode: value }))}
            options={[
              { value: "الكل", label: "الكل" },
              ...uniqueClientCodes.map(code => ({ value: code, label: code })),
            ]}
          />
          <Select
            label="اسم المنتج"
            value={filters.productName}
            onChange={(value) => setFilters((prev) => ({ ...prev, productName: value }))}
            options={[
              { value: "الكل", label: "الكل" },
              ...uniqueProductNames.map(name => ({ value: name, label: name })),
            ]}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full flex flex-col gap-[var(--corner-radius-large)]">
        {/* Table Content */}
        <div className="w-full overflow-x-auto">
          <Table columns={columns} data={paginatedData} />
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredData.length / itemsPerPage) || 1}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default AgentReports;

