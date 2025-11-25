import React, { useState, useEffect, useCallback } from "react";
import { DataTableSection } from "../../../sections/DataTableSection/DataTableSection";
import { Wallet } from "lucide-react";
import { fetchAdminWalletReports } from "../../../../services/firestore";
import { exportWalletReport, TransactionData, ExportFilters, getFilteredTransactions } from "../../../../services/exportService";

// Table columns configuration
const tableColumns = [
  {
    key: "balance",
    label: "الرصيد (ر.س)",
    priority: "high",
  },
  {
    key: "credit",
    label: "دائن",
    priority: "high",
  },
  {
    key: "debit",
    label: "مدين",
    priority: "high",
  },
  {
    key: "operationType",
    label: "نوع العملية",
    priority: "high",
  },
  {
    key: "operationNumber",
    label: "رقم العملية",
    priority: "high",
  },
  {
    key: "clientName",
    label: "اسم العميل",
    priority: "high",
  },
  {
    key: "clientType",
    label: "نوع العميل",
    priority: "high",
  },
  {
    key: "date",
    label: "التاريخ",
    priority: "high",
  },
];

// Function to fetch real wallet reports data from Firestore
const fetchWalletData = async () => {
  try {
    console.log("🔄 Fetching admin wallet reports data...");
    const data = await fetchAdminWalletReports();
    console.log(`✅ Successfully fetched ${data.length} wallet reports`);
    return data;
  } catch (error) {
    console.error("❌ Error fetching wallet reports:", error);
    throw error;
  }
};

export const WalletReport: React.FC = () => {
  const [filterOptions, setFilterOptions] = useState<any[]>([]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        // Fetch wallet reports data to extract unique values
        const data = await fetchAdminWalletReports();

        // Extract unique operation numbers (refid values)
        const uniqueOperationNumbers = Array.from(
          new Set(
            data
              .map((item) => item.operationNumber)
              .filter((opNum) => opNum && opNum !== "-")
          )
        );

        // Extract unique client names
        const uniqueClientNames = Array.from(
          new Set(
            data
              .map((item) => item.clientName)
              .filter((name) => name && name !== "-")
          )
        );

        // Create filter options with real data
        const options = [
          {
            label: "نوع العميل",
            value: "الكل",
            options: [
              { value: "الكل", label: "الكل" },
              { value: "فرد", label: "فرد" },
              { value: "شركة", label: "شركة" },
              { value: "مؤسسة", label: "مؤسسة" },
            ],
          },
          {
            label: "اسم العميل",
            value: "الكل",
            options: [
              { value: "الكل", label: "الكل" },
              ...uniqueClientNames.map((name) => ({
                value: name,
                label: name,
              })),
            ],
          },
          {
            label: "نوع العملية",
            value: "الكل",
            options: [
              { value: "الكل", label: "الكل" },
              { value: "-", label: "-" },
            ],
          },
          {
            label: "رقم العملية",
            value: "الكل",
            options: [
              { value: "الكل", label: "الكل" },
              ...uniqueOperationNumbers.map((opNum) => ({
                value: String(opNum),
                label: String(opNum),
              })),
            ],
          },
          {
            label: "نوع التقرير",
            value: "تحليلي",
            options: [
              { value: "تحليلي", label: "تحليلي" },
              { value: "تفصيلي", label: "تفصيلي" },
              { value: "ملخص", label: "ملخص" },
            ],
          },
        ];

        setFilterOptions(options);
      } catch (error) {
        console.error("Error loading filter options:", error);
        // Fallback to default options
        setFilterOptions([
          {
            label: "نوع العميل",
            value: "الكل",
            options: [
              { value: "الكل", label: "الكل" },
              { value: "فرد", label: "فرد" },
              { value: "افؤاد", label: "افؤاد" },
              { value: "شركة", label: "شركة" },
              { value: "مؤسسة", label: "مؤسسة" },
            ],
          },
          {
            label: "اسم العميل",
            value: "الكل",
            options: [{ value: "الكل", label: "الكل" }],
          },
          {
            label: "نوع العملية",
            value: "الكل",
            options: [
              { value: "الكل", label: "الكل" },
              { value: "-", label: "-" },
            ],
          },
          {
            label: "رقم العملية",
            value: "الكل",
            options: [{ value: "الكل", label: "الكل" }],
          },
          {
            label: "نوع التقرير",
            value: "تحليلي",
            options: [
              { value: "تحليلي", label: "تحليلي" },
              { value: "تفصيلي", label: "تفصيلي" },
              { value: "ملخص", label: "ملخص" },
            ],
          },
        ]);
      }
    };

    loadFilterOptions();
  }, []);

  // Custom export handler for wallet reports
  const handleWalletExport = useCallback(async (
    data: any[],
    filters: Record<string, string>,
    format: "excel" | "pdf"
  ) => {
    // Transform admin wallet data to TransactionData format
    const transactions: TransactionData[] = data.map((item) => ({
      id: item.operationNumber || item.id,
      operationName: item.clientName || "-",
      operationType: item.operationType || "-",
      date: item.date || "-",
      balance: String(item.balance || "-"),
      debit: String(item.debit || "-"),
      rawDate: item.rawDate,
    }));

    // Map filters to ExportFilters format
    const exportFilters: ExportFilters = {
      timePeriod: "الكل", // Admin reports don't have time period filter in the same way
      operationType: filters.operationType || "الكل",
      operationName: filters.clientName || "الكل",
      reportType: filters.reportType || "تحليلي",
    };

    // Get filtered transactions (applies time period and other filters)
    const filteredTransactions = getFilteredTransactions(transactions, exportFilters);

    // Export using the wallet report export function
    await exportWalletReport(filteredTransactions, exportFilters, format);
  }, []);

  return (
    <div className="flex flex-col w-full items-start gap-5">
      <DataTableSection
        title="تقارير المحافظ"
        entityName="تقرير"
        entityNamePlural="تقارير"
        icon={Wallet}
        columns={tableColumns}
        fetchData={fetchWalletData}
        addNewRoute="/admin-wallet-reports/add"
        viewDetailsRoute={(id: number) => `/admin-wallet-reports/${id}`}
        loadingMessage="جاري تحميل تقارير المحافظ..."
        errorMessage="فشل في تحميل تقارير المحافظ"
        itemsPerPage={10}
        showTimeFilter={false}
        showAddButton={false}
        filterOptions={filterOptions}
        customExportHandler={handleWalletExport}
      />
    </div>
  );
};
