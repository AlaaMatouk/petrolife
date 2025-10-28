import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { fetchCurrentCompany } from "./firestore";

export interface TransactionData {
  id: string;
  operationName: string;
  operationType: string;
  date: string;
  balance: string;
  debit: string;
  sourceType?: "driver-transfer" | "wallet-charge";
  rawDate?: any;
}

export interface ExportFilters {
  timePeriod: string;
  operationType: string;
  operationName: string;
  reportType: string;
}

export interface FinancialReportData {
  city: string;
  stationName: string;
  date: string;
  operationNumber: string;
  quantity: string;
  productName: string;
  productNumber: string;
  productType: string;
  driverName: string;
  driverCode: string;
  rawDate?: any;
}

export interface FinancialReportFilters {
  timePeriod: string;
  driverCode: string;
  city: string;
  productType: string;
  reportType: string;
}

/**
 * Export wallet reports to Excel or PDF
 * @param transactions - Array of transaction data
 * @param filters - Current filter settings
 * @param format - Export format ('excel' or 'pdf')
 */
export const exportWalletReport = async (
  transactions: TransactionData[],
  filters: ExportFilters,
  format: "excel" | "pdf"
) => {
  try {
    const reportType = filters.reportType;
    const templateFile =
      reportType === "تحليلي"
        ? "/src/constants/detailed-wallet-report.xlsx"
        : "/src/constants/total-wallet-report.xlsx";

    if (format === "excel") {
      await exportToExcel(transactions, filters, templateFile);
    } else {
      await exportToPDF(transactions, filters, templateFile);
    }
  } catch (error) {
    console.error("Export error:", error);
    throw new Error("فشل في تصدير التقرير");
  }
};

/**
 * Export data to Excel using new template structure
 */
const exportToExcel = async (
  transactions: TransactionData[],
  filters: ExportFilters,
  _templatePath: string
) => {
  try {
    // Get current company data
    const companyData = await fetchCurrentCompany();

    // Create new workbook from scratch
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    const reportType = filters.reportType;

    if (reportType === "تحليلي") {
      // Analytical report - detailed data
      await createDetailedReport(worksheet, transactions, filters, companyData);
    } else {
      // Detailed report - summary data
      await createSummaryReport(worksheet, transactions, filters, companyData);
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Wallet Report");

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `wallet-report-${reportType}-${currentDate}.xlsx`;

    // Save the workbook with cell styles
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, filename);
  } catch (error) {
    console.error("Excel export error:", error);
    throw error;
  }
};

/**
 * Helper function to create a cell with RTL alignment
 */
const createRTLCell = (value: string | number, type: "s" | "n" = "s") => {
  return {
    v: value,
    t: type,
    s: {
      alignment: {
        horizontal: "right",
        vertical: "center",
        readingOrder: 2, // RTL reading order
      },
    },
  };
};

/**
 * Create detailed report (تحليلي) with proper structure
 */
const createDetailedReport = async (
  worksheet: XLSX.WorkSheet,
  transactions: TransactionData[],
  _filters: ExportFilters,
  companyData: any
) => {
  // Extract company information
  const companyName =
    companyData?.brandName || companyData?.name || companyData?.email || "N/A";
  const commercialRegister =
    companyData?.commercialRegister || companyData?.cr || "123456789";
  const taxNumber =
    companyData?.taxNumber ||
    companyData?.vat ||
    companyData?.taxId ||
    "123456789";
  const clientNumber = companyData?.id || companyData?.uid || "N/A";

  // Initialize merges array
  if (!worksheet["!merges"]) {
    worksheet["!merges"] = [];
  }

  // TOP PART (Rows 1-4)

  // Top Left (C & D columns) - Arabic company info
  worksheet["C1"] = createRTLCell("شركة بترولايف");
  worksheet["D1"] = createRTLCell("");
  worksheet["C2"] = createRTLCell("بترو لايف");
  worksheet["D2"] = createRTLCell("");
  worksheet["C3"] = createRTLCell("السجل التجاري : 123456789");
  worksheet["D3"] = createRTLCell("");
  worksheet["C4"] = createRTLCell("الرقم الضريبي : 123456789");
  worksheet["D4"] = createRTLCell("");

  // Merge C&D for rows 1-4
  worksheet["!merges"].push(
    { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // C1:D1
    { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }, // C2:D2
    { s: { r: 2, c: 2 }, e: { r: 2, c: 3 } }, // C3:D3
    { s: { r: 3, c: 2 }, e: { r: 3, c: 3 } } // C4:D4
  );

  // Top Middle (F & G & H columns) - Empty space for logos
  worksheet["F1"] = createRTLCell("");
  worksheet["G1"] = createRTLCell("");
  worksheet["H1"] = createRTLCell("");
  worksheet["F2"] = createRTLCell("");
  worksheet["G2"] = createRTLCell("");
  worksheet["H2"] = createRTLCell("");
  worksheet["F3"] = createRTLCell("");
  worksheet["G3"] = createRTLCell("");
  worksheet["H3"] = createRTLCell("");

  // Merge F&G&H for rows 1-3
  worksheet["!merges"].push(
    { s: { r: 0, c: 5 }, e: { r: 0, c: 7 } }, // F1:H1
    { s: { r: 1, c: 5 }, e: { r: 1, c: 7 } }, // F2:H2
    { s: { r: 2, c: 5 }, e: { r: 2, c: 7 } } // F3:H3
  );

  // Top Right (J & K columns) - English company info
  worksheet["J1"] = createRTLCell("petrolife co.");
  worksheet["K1"] = createRTLCell("");
  worksheet["J2"] = createRTLCell("petro life");
  worksheet["K2"] = createRTLCell("");
  worksheet["J3"] = createRTLCell("CR: 123456789");
  worksheet["K3"] = createRTLCell("");
  worksheet["J4"] = createRTLCell("vat: 123456789");
  worksheet["K4"] = createRTLCell("");

  // Merge J&K for rows 1-4
  worksheet["!merges"].push(
    { s: { r: 0, c: 9 }, e: { r: 0, c: 10 } }, // J1:K1
    { s: { r: 1, c: 9 }, e: { r: 1, c: 10 } }, // J2:K2
    { s: { r: 2, c: 9 }, e: { r: 2, c: 10 } }, // J3:K3
    { s: { r: 3, c: 9 }, e: { r: 3, c: 10 } } // J4:K4
  );

  // SECOND PART - Client information (Rows 6-7)

  // Left side (C & D columns)
  worksheet["C6"] = createRTLCell("اسم العميل");
  worksheet["D6"] = createRTLCell(companyName);
  worksheet["C7"] = createRTLCell("رقم العميل");
  worksheet["D7"] = createRTLCell(clientNumber);

  // Right side (J & K columns)
  worksheet["J6"] = createRTLCell("السجل التجاري :");
  worksheet["K6"] = createRTLCell(commercialRegister);
  worksheet["J7"] = createRTLCell("الرقم الضريبي :");
  worksheet["K7"] = createRTLCell(taxNumber);

  // FINAL PART - Report title and table

  // Report title (row 9) - Centered across F, G, H columns
  worksheet["F9"] = createRTLCell("التقرير التفصيلي للمحفظة");
  worksheet["G9"] = createRTLCell("");
  worksheet["H9"] = createRTLCell("");
  worksheet["!merges"].push(
    { s: { r: 8, c: 5 }, e: { r: 8, c: 7 } } // F9:H9
  );

  // Table headers (row 11) - RTL order with proper column assignment
  worksheet["B11"] = createRTLCell("التاريخ");
  worksheet["D11"] = createRTLCell("رقم العملية");
  worksheet["F11"] = createRTLCell("نوع العملية");
  worksheet["H11"] = createRTLCell("الحالة");
  worksheet["J11"] = createRTLCell("اسم الشركة");
  worksheet["L11"] = createRTLCell("المبلغ");

  // Add transaction data starting from row 12
  transactions.forEach((transaction, index) => {
    const row = 12 + index;

    // Add data in RTL order
    worksheet[`B${row}`] = createRTLCell(formatSimpleDate(transaction.date));
    worksheet[`D${row}`] = createRTLCell(transaction.id);
    worksheet[`F${row}`] = createRTLCell(transaction.operationType);
    worksheet[`H${row}`] = createRTLCell("مقبول");
    worksheet[`J${row}`] = createRTLCell(transaction.operationName || "N/A");
    worksheet[`L${row}`] = createRTLCell(transaction.debit);
  });

  // Set column widths for better readability
  worksheet["!cols"] = [
    { wch: 5 }, // A - padding
    { wch: 15 }, // B - Date
    { wch: 5 }, // C - spacing
    { wch: 25 }, // D - Operation ID
    { wch: 5 }, // E - spacing
    { wch: 20 }, // F - Operation Type
    { wch: 5 }, // G - spacing
    { wch: 15 }, // H - Status
    { wch: 5 }, // I - spacing
    { wch: 25 }, // J - Company Name
    { wch: 5 }, // K - spacing
    { wch: 15 }, // L - Amount
  ];

  // Set worksheet range
  const lastRow = 12 + transactions.length - 1;
  worksheet["!ref"] = `B1:L${lastRow > 11 ? lastRow : 11}`;
};

/**
 * Create summary report (تفصيلي) with proper structure
 */
const createSummaryReport = async (
  worksheet: XLSX.WorkSheet,
  transactions: TransactionData[],
  filters: ExportFilters,
  companyData: any
) => {
  // Extract company information
  const companyName =
    companyData?.brandName || companyData?.name || companyData?.email || "N/A";
  const commercialRegister =
    companyData?.commercialRegister || companyData?.cr || "123456789";
  const taxNumber =
    companyData?.taxNumber ||
    companyData?.vat ||
    companyData?.taxId ||
    "123456789";
  const clientNumber = companyData?.id || companyData?.uid || "N/A";

  // Calculate summary data
  const totalAmount = transactions.reduce((sum, transaction) => {
    const amount = parseFloat(transaction.debit.replace(/,/g, "")) || 0;
    return sum + amount;
  }, 0);

  const transactionCount = transactions.length;
  const operationType =
    filters.operationType === "الكل" ? "طلبات المحفظة" : filters.operationType;

  // Initialize merges array
  if (!worksheet["!merges"]) {
    worksheet["!merges"] = [];
  }

  // TOP PART (Rows 1-4)

  // Top Left (C & D columns) - Arabic company info
  worksheet["C1"] = createRTLCell("شركة بترولايف");
  worksheet["D1"] = createRTLCell("");
  worksheet["C2"] = createRTLCell("بترو لايف");
  worksheet["D2"] = createRTLCell("");
  worksheet["C3"] = createRTLCell("السجل التجاري : 123456789");
  worksheet["D3"] = createRTLCell("");
  worksheet["C4"] = createRTLCell("الرقم الضريبي : 123456789");
  worksheet["D4"] = createRTLCell("");

  // Merge C&D for rows 1-4
  worksheet["!merges"].push(
    { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // C1:D1
    { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }, // C2:D2
    { s: { r: 2, c: 2 }, e: { r: 2, c: 3 } }, // C3:D3
    { s: { r: 3, c: 2 }, e: { r: 3, c: 3 } } // C4:D4
  );

  // Top Middle (F & G & H columns) - Empty space for logos
  worksheet["F1"] = createRTLCell("");
  worksheet["G1"] = createRTLCell("");
  worksheet["H1"] = createRTLCell("");
  worksheet["F2"] = createRTLCell("");
  worksheet["G2"] = createRTLCell("");
  worksheet["H2"] = createRTLCell("");
  worksheet["F3"] = createRTLCell("");
  worksheet["G3"] = createRTLCell("");
  worksheet["H3"] = createRTLCell("");

  // Merge F&G&H for rows 1-3
  worksheet["!merges"].push(
    { s: { r: 0, c: 5 }, e: { r: 0, c: 7 } }, // F1:H1
    { s: { r: 1, c: 5 }, e: { r: 1, c: 7 } }, // F2:H2
    { s: { r: 2, c: 5 }, e: { r: 2, c: 7 } } // F3:H3
  );

  // Top Right (J & K columns) - English company info
  worksheet["J1"] = createRTLCell("petrolife co.");
  worksheet["K1"] = createRTLCell("");
  worksheet["J2"] = createRTLCell("petro life");
  worksheet["K2"] = createRTLCell("");
  worksheet["J3"] = createRTLCell("CR: 123456789");
  worksheet["K3"] = createRTLCell("");
  worksheet["J4"] = createRTLCell("vat: 123456789");
  worksheet["K4"] = createRTLCell("");

  // Merge J&K for rows 1-4
  worksheet["!merges"].push(
    { s: { r: 0, c: 9 }, e: { r: 0, c: 10 } }, // J1:K1
    { s: { r: 1, c: 9 }, e: { r: 1, c: 10 } }, // J2:K2
    { s: { r: 2, c: 9 }, e: { r: 2, c: 10 } }, // J3:K3
    { s: { r: 3, c: 9 }, e: { r: 3, c: 10 } } // J4:K4
  );

  // SECOND PART - Client information (Rows 6-7)

  // Left side (C & D columns)
  worksheet["C6"] = createRTLCell("اسم العميل");
  worksheet["D6"] = createRTLCell(companyName);
  worksheet["C7"] = createRTLCell("رقم العميل");
  worksheet["D7"] = createRTLCell(clientNumber);

  // Right side (J & K columns)
  worksheet["J6"] = createRTLCell("السجل التجاري :");
  worksheet["K6"] = createRTLCell(commercialRegister);
  worksheet["J7"] = createRTLCell("الرقم الضريبي :");
  worksheet["K7"] = createRTLCell(taxNumber);

  // FINAL PART - Report title and summary table

  // Report title (row 9) - Centered across F, G, H columns
  worksheet["F9"] = createRTLCell("التقرير الإجمالي للمحفظة");
  worksheet["G9"] = createRTLCell("");
  worksheet["H9"] = createRTLCell("");
  worksheet["!merges"].push(
    { s: { r: 8, c: 5 }, e: { r: 8, c: 7 } } // F9:H9
  );

  // Summary table headers (row 11) - RTL order
  worksheet["D11"] = createRTLCell("نوع العملية");
  worksheet["F11"] = createRTLCell("الكمية");
  worksheet["H11"] = createRTLCell("المبلغ");

  // Summary data (row 12)
  worksheet["D12"] = createRTLCell(operationType);
  worksheet["F12"] = createRTLCell(transactionCount.toString());
  worksheet["H12"] = createRTLCell(totalAmount.toFixed(2), "n");

  // Total row (row 14) - with label
  worksheet["D14"] = createRTLCell("الإجمالي");
  worksheet["H14"] = createRTLCell(totalAmount.toFixed(2), "n");

  // Set column widths for better readability
  worksheet["!cols"] = [
    { wch: 5 }, // A - padding
    { wch: 5 }, // B - spacing
    { wch: 15 }, // C - labels
    { wch: 20 }, // D - Operation Type
    { wch: 5 }, // E - spacing
    { wch: 15 }, // F - Count
    { wch: 5 }, // G - spacing
    { wch: 15 }, // H - Amount
    { wch: 5 }, // I - spacing
    { wch: 20 }, // J - CR/VAT labels
    { wch: 20 }, // K - CR/VAT values
  ];

  // Set worksheet range
  worksheet["!ref"] = "B1:K14";
};

/**
 * Format date to simple format to avoid column overflow
 */
const formatSimpleDate = (dateString: string): string => {
  try {
    // Extract date part from the formatted string
    const dateMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // If no match, try to parse as Date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0]; // YYYY-MM-DD format
    }

    return dateString.substring(0, 10); // Take first 10 characters
  } catch (error) {
    return dateString.substring(0, 10); // Fallback
  }
};

/**
 * Export data to PDF by converting Excel to PDF
 */
const exportToPDF = async (
  transactions: TransactionData[],
  filters: ExportFilters,
  _templatePath: string
) => {
  try {
    // Get current company data
    const companyData = await fetchCurrentCompany();

    // Create new workbook from scratch
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    const reportType = filters.reportType;

    if (reportType === "تحليلي") {
      await createDetailedReport(worksheet, transactions, filters, companyData);
    } else {
      await createSummaryReport(worksheet, transactions, filters, companyData);
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Wallet Report");

    // Convert Excel to HTML table
    const html = XLSX.utils.sheet_to_html(worksheet, {
      id: "wallet-report-table",
      header: "",
      footer: "",
    });

    // Create a temporary container for the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    document.body.appendChild(tempDiv);

    // Convert HTML to canvas then to PDF
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    // Remove temporary element
    document.body.removeChild(tempDiv);

    // Create PDF
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4"); // Landscape orientation

    const imgWidth = 297; // A4 width in mm
    const pageHeight = 210; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add image to PDF
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add new pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate filename and save
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `wallet-report-${reportType}-${currentDate}.pdf`;

    pdf.save(filename);
  } catch (error) {
    console.error("PDF export error:", error);
    throw error;
  }
};

/**
 * Get filtered transactions based on current filters
 */
export const getFilteredTransactions = (
  transactions: TransactionData[],
  filters: ExportFilters
): TransactionData[] => {
  return transactions.filter((transaction) => {
    // Filter by time period
    if (filters.timePeriod !== "الكل") {
      const transactionDate = transaction.rawDate;
      if (transactionDate) {
        const date = transactionDate.toDate
          ? transactionDate.toDate()
          : new Date(transactionDate);
        const now = new Date();
        const daysDiff = Math.floor(
          (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        switch (filters.timePeriod) {
          case "اخر اسبوع":
            if (daysDiff > 7) return false;
            break;
          case "اخر 30 يوم":
            if (daysDiff > 30) return false;
            break;
          case "اخر 6 شهور":
            if (daysDiff > 180) return false;
            break;
          case "اخر 12 شهر":
            if (daysDiff > 365) return false;
            break;
        }
      }
    }

    // Filter by operation type
    if (
      filters.operationType !== "الكل" &&
      transaction.operationType !== filters.operationType
    ) {
      return false;
    }

    // Filter by operation name
    if (
      filters.operationName !== "الكل" &&
      transaction.operationName !== filters.operationName
    ) {
      return false;
    }

    return true;
  });
};

/**
 * Get filtered financial report data based on current filters
 */
export const getFilteredFinancialData = (
  data: FinancialReportData[],
  filters: FinancialReportFilters
): FinancialReportData[] => {
  return data.filter((item) => {
    // Filter by time period
    if (filters.timePeriod !== "الكل") {
      const itemDate = item.rawDate;
      if (itemDate) {
        const date = itemDate.toDate ? itemDate.toDate() : new Date(itemDate);
        const now = new Date();
        const daysDiff = Math.floor(
          (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        switch (filters.timePeriod) {
          case "اخر اسبوع":
            if (daysDiff > 7) return false;
            break;
          case "اخر 30 يوم":
            if (daysDiff > 30) return false;
            break;
          case "اخر 6 شهور":
            if (daysDiff > 180) return false;
            break;
          case "اخر 12 شهر":
            if (daysDiff > 365) return false;
            break;
        }
      }
    }

    // Filter by driver code
    if (
      filters.driverCode !== "الكل" &&
      item.driverCode !== filters.driverCode
    ) {
      return false;
    }

    // Filter by city
    if (filters.city !== "الكل" && item.city !== filters.city) {
      return false;
    }

    // Filter by product type
    if (
      filters.productType !== "الكل" &&
      item.productType !== filters.productType
    ) {
      return false;
    }

    return true;
  });
};

/**
 * Export financial reports to Excel or PDF
 * @param reportData - Array of financial report data
 * @param filters - Current filter settings
 * @param format - Export format ('excel' or 'pdf')
 */
export const exportFinancialReport = async (
  reportData: FinancialReportData[],
  filters: FinancialReportFilters,
  format: "excel" | "pdf"
) => {
  try {
    if (format === "excel") {
      await exportFinancialToExcel(reportData, filters);
    } else {
      await exportFinancialToPDF(reportData, filters);
    }
  } catch (error) {
    console.error("Export error:", error);
    throw new Error("فشل في تصدير التقرير المالي");
  }
};

/**
 * Export financial data to Excel with detailed or summary report
 */
const exportFinancialToExcel = async (
  reportData: FinancialReportData[],
  filters: FinancialReportFilters
) => {
  try {
    // Get current company data
    const companyData = await fetchCurrentCompany();

    // Create new workbook from scratch
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    const reportType = filters.reportType;

    if (reportType === "تحليلي") {
      // Detailed report - all data
      await createFinancialDetailedReport(
        worksheet,
        reportData,
        filters,
        companyData
      );
    } else {
      // Summary report - aggregated data
      await createFinancialSummaryReport(
        worksheet,
        reportData,
        filters,
        companyData
      );
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `financial-report-${reportType}-${currentDate}.xlsx`;

    // Save the workbook with cell styles
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, filename);
  } catch (error) {
    console.error("Excel export error:", error);
    throw error;
  }
};

/**
 * Create detailed financial report (تحليلي) with proper structure
 */
const createFinancialDetailedReport = async (
  worksheet: XLSX.WorkSheet,
  reportData: FinancialReportData[],
  _filters: FinancialReportFilters,
  companyData: any
) => {
  // Extract company information
  const companyName =
    companyData?.brandName || companyData?.name || companyData?.email || "N/A";
  const commercialRegister =
    companyData?.commercialRegister || companyData?.cr || "123456789";
  const taxNumber =
    companyData?.taxNumber ||
    companyData?.vat ||
    companyData?.taxId ||
    "123456789";
  const clientNumber = companyData?.id || companyData?.uid || "N/A";

  // Initialize merges array
  if (!worksheet["!merges"]) {
    worksheet["!merges"] = [];
  }

  // TOP PART (Rows 1-4)

  // Top Left (C & D columns) - Arabic company info
  worksheet["C1"] = createRTLCell("شركة بترولايف");
  worksheet["D1"] = createRTLCell("");
  worksheet["C2"] = createRTLCell("بترو لايف");
  worksheet["D2"] = createRTLCell("");
  worksheet["C3"] = createRTLCell("السجل التجاري : 123456789");
  worksheet["D3"] = createRTLCell("");
  worksheet["C4"] = createRTLCell("الرقم الضريبي : 123456789");
  worksheet["D4"] = createRTLCell("");

  // Merge C&D for rows 1-4
  worksheet["!merges"].push(
    { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // C1:D1
    { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }, // C2:D2
    { s: { r: 2, c: 2 }, e: { r: 2, c: 3 } }, // C3:D3
    { s: { r: 3, c: 2 }, e: { r: 3, c: 3 } } // C4:D4
  );

  // Top Middle (F & G & H columns) - Empty space for logos
  worksheet["F1"] = createRTLCell("");
  worksheet["G1"] = createRTLCell("");
  worksheet["H1"] = createRTLCell("");
  worksheet["F2"] = createRTLCell("");
  worksheet["G2"] = createRTLCell("");
  worksheet["H2"] = createRTLCell("");
  worksheet["F3"] = createRTLCell("");
  worksheet["G3"] = createRTLCell("");
  worksheet["H3"] = createRTLCell("");

  // Merge F&G&H for rows 1-3
  worksheet["!merges"].push(
    { s: { r: 0, c: 5 }, e: { r: 0, c: 7 } }, // F1:H1
    { s: { r: 1, c: 5 }, e: { r: 1, c: 7 } }, // F2:H2
    { s: { r: 2, c: 5 }, e: { r: 2, c: 7 } } // F3:H3
  );

  // Top Right (J & K columns) - English company info
  worksheet["J1"] = createRTLCell("petrolife co.");
  worksheet["K1"] = createRTLCell("");
  worksheet["J2"] = createRTLCell("petro life");
  worksheet["K2"] = createRTLCell("");
  worksheet["J3"] = createRTLCell("CR: 123456789");
  worksheet["K3"] = createRTLCell("");
  worksheet["J4"] = createRTLCell("vat: 123456789");
  worksheet["K4"] = createRTLCell("");

  // Merge J&K for rows 1-4
  worksheet["!merges"].push(
    { s: { r: 0, c: 9 }, e: { r: 0, c: 10 } }, // J1:K1
    { s: { r: 1, c: 9 }, e: { r: 1, c: 10 } }, // J2:K2
    { s: { r: 2, c: 9 }, e: { r: 2, c: 10 } }, // J3:K3
    { s: { r: 3, c: 9 }, e: { r: 3, c: 10 } } // J4:K4
  );

  // SECOND PART - Client information (Rows 6-7)

  // Left side (C & D columns)
  worksheet["C6"] = createRTLCell("اسم العميل");
  worksheet["D6"] = createRTLCell(companyName);
  worksheet["C7"] = createRTLCell("رقم العميل");
  worksheet["D7"] = createRTLCell(clientNumber);

  // Right side (J & K columns)
  worksheet["J6"] = createRTLCell("السجل التجاري :");
  worksheet["K6"] = createRTLCell(commercialRegister);
  worksheet["J7"] = createRTLCell("الرقم الضريبي :");
  worksheet["K7"] = createRTLCell(taxNumber);

  // FINAL PART - Report title and table

  // Report title (row 9) - Centered across F, G, H columns
  worksheet["F9"] = createRTLCell("التقرير المالي التفصيلي");
  worksheet["G9"] = createRTLCell("");
  worksheet["H9"] = createRTLCell("");
  worksheet["!merges"].push(
    { s: { r: 8, c: 5 }, e: { r: 8, c: 7 } } // F9:H9
  );

  // Table headers (row 11) - RTL order
  worksheet["B11"] = createRTLCell("المدينة");
  worksheet["D11"] = createRTLCell("اسم المحطة");
  worksheet["F11"] = createRTLCell("التاريخ");
  worksheet["H11"] = createRTLCell("رقم العملية");
  worksheet["J11"] = createRTLCell("الكمية");
  worksheet["L11"] = createRTLCell("اسم المنتج");
  worksheet["N11"] = createRTLCell("نوع المنتج");
  worksheet["P11"] = createRTLCell("اسم السائق");
  worksheet["R11"] = createRTLCell("كود السائق");

  // Add report data starting from row 12
  reportData.forEach((item, index) => {
    const row = 12 + index;

    // Add data in RTL order
    worksheet[`B${row}`] = createRTLCell(item.city || "-");
    worksheet[`D${row}`] = createRTLCell(item.stationName || "-");
    worksheet[`F${row}`] = createRTLCell(item.date || "-");
    worksheet[`H${row}`] = createRTLCell(item.operationNumber || "-");
    worksheet[`J${row}`] = createRTLCell(item.quantity || "-");
    worksheet[`L${row}`] = createRTLCell(item.productName || "-");
    worksheet[`N${row}`] = createRTLCell(item.productType || "-");
    worksheet[`P${row}`] = createRTLCell(item.driverName || "-");
    worksheet[`R${row}`] = createRTLCell(item.driverCode || "-");
  });

  // Set column widths for better readability
  worksheet["!cols"] = [
    { wch: 5 }, // A - padding
    { wch: 15 }, // B - City
    { wch: 5 }, // C - spacing
    { wch: 20 }, // D - Station Name
    { wch: 5 }, // E - spacing
    { wch: 20 }, // F - Date
    { wch: 5 }, // G - spacing
    { wch: 18 }, // H - Operation Number
    { wch: 5 }, // I - spacing
    { wch: 12 }, // J - Quantity
    { wch: 5 }, // K - spacing
    { wch: 20 }, // L - Product Name
    { wch: 5 }, // M - spacing
    { wch: 18 }, // N - Product Type
    { wch: 5 }, // O - spacing
    { wch: 20 }, // P - Driver Name
    { wch: 5 }, // Q - spacing
    { wch: 18 }, // R - Driver Code
  ];

  // Set worksheet range
  const lastRow = 12 + reportData.length - 1;
  worksheet["!ref"] = `B1:R${lastRow > 11 ? lastRow : 11}`;
};

/**
 * Create summary financial report (إجمالي) with proper structure
 */
const createFinancialSummaryReport = async (
  worksheet: XLSX.WorkSheet,
  reportData: FinancialReportData[],
  _filters: FinancialReportFilters,
  companyData: any
) => {
  // Extract company information
  const companyName =
    companyData?.brandName || companyData?.name || companyData?.email || "N/A";
  const commercialRegister =
    companyData?.commercialRegister || companyData?.cr || "123456789";
  const taxNumber =
    companyData?.taxNumber ||
    companyData?.vat ||
    companyData?.taxId ||
    "123456789";
  const clientNumber = companyData?.id || companyData?.uid || "N/A";

  // Calculate summary data
  const totalQuantity = reportData.reduce((sum, item) => {
    const qty = parseFloat(item.quantity.replace(/,/g, "")) || 0;
    return sum + qty;
  }, 0);

  const totalTransactions = reportData.length;

  // Group by product type
  const productGroups = reportData.reduce((acc, item) => {
    const type = item.productType || "غير محدد";
    if (!acc[type]) {
      acc[type] = { count: 0, quantity: 0 };
    }
    acc[type].count += 1;
    acc[type].quantity += parseFloat(item.quantity.replace(/,/g, "")) || 0;
    return acc;
  }, {} as Record<string, { count: number; quantity: number }>);

  // Initialize merges array
  if (!worksheet["!merges"]) {
    worksheet["!merges"] = [];
  }

  // TOP PART (Rows 1-4)

  // Top Left (C & D columns) - Arabic company info
  worksheet["C1"] = createRTLCell("شركة بترولايف");
  worksheet["D1"] = createRTLCell("");
  worksheet["C2"] = createRTLCell("بترو لايف");
  worksheet["D2"] = createRTLCell("");
  worksheet["C3"] = createRTLCell("السجل التجاري : 123456789");
  worksheet["D3"] = createRTLCell("");
  worksheet["C4"] = createRTLCell("الرقم الضريبي : 123456789");
  worksheet["D4"] = createRTLCell("");

  // Merge C&D for rows 1-4
  worksheet["!merges"].push(
    { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // C1:D1
    { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }, // C2:D2
    { s: { r: 2, c: 2 }, e: { r: 2, c: 3 } }, // C3:D3
    { s: { r: 3, c: 2 }, e: { r: 3, c: 3 } } // C4:D4
  );

  // Top Middle (F & G & H columns) - Empty space for logos
  worksheet["F1"] = createRTLCell("");
  worksheet["G1"] = createRTLCell("");
  worksheet["H1"] = createRTLCell("");
  worksheet["F2"] = createRTLCell("");
  worksheet["G2"] = createRTLCell("");
  worksheet["H2"] = createRTLCell("");
  worksheet["F3"] = createRTLCell("");
  worksheet["G3"] = createRTLCell("");
  worksheet["H3"] = createRTLCell("");

  // Merge F&G&H for rows 1-3
  worksheet["!merges"].push(
    { s: { r: 0, c: 5 }, e: { r: 0, c: 7 } }, // F1:H1
    { s: { r: 1, c: 5 }, e: { r: 1, c: 7 } }, // F2:H2
    { s: { r: 2, c: 5 }, e: { r: 2, c: 7 } } // F3:H3
  );

  // Top Right (J & K columns) - English company info
  worksheet["J1"] = createRTLCell("petrolife co.");
  worksheet["K1"] = createRTLCell("");
  worksheet["J2"] = createRTLCell("petro life");
  worksheet["K2"] = createRTLCell("");
  worksheet["J3"] = createRTLCell("CR: 123456789");
  worksheet["K3"] = createRTLCell("");
  worksheet["J4"] = createRTLCell("vat: 123456789");
  worksheet["K4"] = createRTLCell("");

  // Merge J&K for rows 1-4
  worksheet["!merges"].push(
    { s: { r: 0, c: 9 }, e: { r: 0, c: 10 } }, // J1:K1
    { s: { r: 1, c: 9 }, e: { r: 1, c: 10 } }, // J2:K2
    { s: { r: 2, c: 9 }, e: { r: 2, c: 10 } }, // J3:K3
    { s: { r: 3, c: 9 }, e: { r: 3, c: 10 } } // J4:K4
  );

  // SECOND PART - Client information (Rows 6-7)

  // Left side (C & D columns)
  worksheet["C6"] = createRTLCell("اسم العميل");
  worksheet["D6"] = createRTLCell(companyName);
  worksheet["C7"] = createRTLCell("رقم العميل");
  worksheet["D7"] = createRTLCell(clientNumber);

  // Right side (J & K columns)
  worksheet["J6"] = createRTLCell("السجل التجاري :");
  worksheet["K6"] = createRTLCell(commercialRegister);
  worksheet["J7"] = createRTLCell("الرقم الضريبي :");
  worksheet["K7"] = createRTLCell(taxNumber);

  // FINAL PART - Report title and summary table

  // Report title (row 9) - Centered across F, G, H columns
  worksheet["F9"] = createRTLCell("التقرير المالي الإجمالي");
  worksheet["G9"] = createRTLCell("");
  worksheet["H9"] = createRTLCell("");
  worksheet["!merges"].push(
    { s: { r: 8, c: 5 }, e: { r: 8, c: 7 } } // F9:H9
  );

  // Summary table headers (row 11) - RTL order
  worksheet["D11"] = createRTLCell("نوع المنتج");
  worksheet["F11"] = createRTLCell("عدد المعاملات");
  worksheet["H11"] = createRTLCell("إجمالي الكمية");

  // Summary data by product type (starting from row 12)
  let currentRow = 12;
  Object.entries(productGroups).forEach(([type, data]) => {
    worksheet[`D${currentRow}`] = createRTLCell(type);
    worksheet[`F${currentRow}`] = createRTLCell(data.count.toString());
    worksheet[`H${currentRow}`] = createRTLCell(data.quantity.toFixed(2), "n");
    currentRow++;
  });

  // Total row
  currentRow++; // Add empty row
  worksheet[`D${currentRow}`] = createRTLCell("الإجمالي الكلي");
  worksheet[`F${currentRow}`] = createRTLCell(totalTransactions.toString());
  worksheet[`H${currentRow}`] = createRTLCell(totalQuantity.toFixed(2), "n");

  // Set column widths for better readability
  worksheet["!cols"] = [
    { wch: 5 }, // A - padding
    { wch: 5 }, // B - spacing
    { wch: 15 }, // C - labels
    { wch: 20 }, // D - Product Type
    { wch: 5 }, // E - spacing
    { wch: 18 }, // F - Count
    { wch: 5 }, // G - spacing
    { wch: 18 }, // H - Total Quantity
    { wch: 5 }, // I - spacing
    { wch: 20 }, // J - CR/VAT labels
    { wch: 20 }, // K - CR/VAT values
  ];

  // Set worksheet range
  worksheet["!ref"] = `B1:K${currentRow}`;
};

/**
 * Export financial data to PDF
 */
const exportFinancialToPDF = async (
  reportData: FinancialReportData[],
  filters: FinancialReportFilters
) => {
  try {
    // Get current company data
    const companyData = await fetchCurrentCompany();

    // Create new workbook from scratch (for conversion to PDF)
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    const reportType = filters.reportType;

    if (reportType === "تحليلي") {
      await createFinancialDetailedReport(
        worksheet,
        reportData,
        filters,
        companyData
      );
    } else {
      await createFinancialSummaryReport(
        worksheet,
        reportData,
        filters,
        companyData
      );
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");

    // Convert Excel to HTML table
    const html = XLSX.utils.sheet_to_html(worksheet, {
      id: "financial-report-table",
      header: "",
      footer: "",
    });

    // Create a temporary container for the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    document.body.appendChild(tempDiv);

    // Convert HTML to canvas then to PDF
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    // Remove temporary element
    document.body.removeChild(tempDiv);

    // Create PDF
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4"); // Landscape orientation

    const imgWidth = 297; // A4 width in mm
    const pageHeight = 210; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add image to PDF
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add new pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate filename and save
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `financial-report-${reportType}-${currentDate}.pdf`;

    pdf.save(filename);
  } catch (error) {
    console.error("PDF export error:", error);
    throw error;
  }
};

/**
 * Generic export function for any data table with company data
 * @param data - Array of data objects to export
 * @param columns - Column headers for the table
 * @param filename - Name of the exported file
 * @param format - Export format ('excel' or 'pdf')
 * @param reportTitle - Title for the report
 */
export const exportDataTable = async (
  data: any[],
  columns: { key: string; label: string }[],
  filename: string,
  format: "excel" | "pdf",
  reportTitle: string = "تقرير البيانات"
) => {
  try {
    // Fetch company data
    const company = await fetchCurrentCompany();

    if (format === "excel") {
      await exportTableToExcel(data, columns, company, filename, reportTitle);
    } else {
      await exportTableToPDF(data, columns, company, filename, reportTitle);
    }
  } catch (error) {
    console.error("Export error:", error);
    throw new Error("فشل في تصدير البيانات");
  }
};

/**
 * Export table data to Excel with company header (new template format)
 */
const exportTableToExcel = async (
  data: any[],
  columns: { key: string; label: string }[],
  company: any,
  filename: string,
  reportTitle: string
) => {
  try {
    // Extract company information
    const companyName =
      company?.brandName || company?.name || company?.email || "N/A";
    const commercialRegister =
      company?.commercialRegister ||
      company?.commercialRegistrationNumber ||
      company?.cr ||
      "123456789";
    const taxNumber =
      company?.taxNumber ||
      company?.vatNumber ||
      company?.vat ||
      company?.taxId ||
      "123456789";
    const clientNumber = company?.id || company?.uid || "N/A";

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    // Initialize merges array
    if (!worksheet["!merges"]) {
      worksheet["!merges"] = [];
    }

    // TOP PART (Rows 1-4)

    // Top Left (C & D columns) - Arabic company info
    worksheet["C1"] = createRTLCell("شركة بترولايف");
    worksheet["D1"] = createRTLCell("");
    worksheet["C2"] = createRTLCell("بترو لايف");
    worksheet["D2"] = createRTLCell("");
    worksheet["C3"] = createRTLCell("السجل التجاري : 123456789");
    worksheet["D3"] = createRTLCell("");
    worksheet["C4"] = createRTLCell("الرقم الضريبي : 123456789");
    worksheet["D4"] = createRTLCell("");

    // Merge C&D for rows 1-4
    worksheet["!merges"].push(
      { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // C1:D1
      { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }, // C2:D2
      { s: { r: 2, c: 2 }, e: { r: 2, c: 3 } }, // C3:D3
      { s: { r: 3, c: 2 }, e: { r: 3, c: 3 } } // C4:D4
    );

    // Top Middle (F & G & H columns) - Empty space for logos
    worksheet["F1"] = createRTLCell("");
    worksheet["G1"] = createRTLCell("");
    worksheet["H1"] = createRTLCell("");
    worksheet["F2"] = createRTLCell("");
    worksheet["G2"] = createRTLCell("");
    worksheet["H2"] = createRTLCell("");
    worksheet["F3"] = createRTLCell("");
    worksheet["G3"] = createRTLCell("");
    worksheet["H3"] = createRTLCell("");

    // Merge F&G&H for rows 1-3
    worksheet["!merges"].push(
      { s: { r: 0, c: 5 }, e: { r: 0, c: 7 } }, // F1:H1
      { s: { r: 1, c: 5 }, e: { r: 1, c: 7 } }, // F2:H2
      { s: { r: 2, c: 5 }, e: { r: 2, c: 7 } } // F3:H3
    );

    // Top Right (J & K columns) - English company info
    worksheet["J1"] = createRTLCell("petrolife co.");
    worksheet["K1"] = createRTLCell("");
    worksheet["J2"] = createRTLCell("petro life");
    worksheet["K2"] = createRTLCell("");
    worksheet["J3"] = createRTLCell("CR: 123456789");
    worksheet["K3"] = createRTLCell("");
    worksheet["J4"] = createRTLCell("vat: 123456789");
    worksheet["K4"] = createRTLCell("");

    // Merge J&K for rows 1-4
    worksheet["!merges"].push(
      { s: { r: 0, c: 9 }, e: { r: 0, c: 10 } }, // J1:K1
      { s: { r: 1, c: 9 }, e: { r: 1, c: 10 } }, // J2:K2
      { s: { r: 2, c: 9 }, e: { r: 2, c: 10 } }, // J3:K3
      { s: { r: 3, c: 9 }, e: { r: 3, c: 10 } } // J4:K4
    );

    // SECOND PART - Client information (Rows 6-7)

    // Left side (C & D columns)
    worksheet["C6"] = createRTLCell("اسم العميل");
    worksheet["D6"] = createRTLCell(companyName);
    worksheet["C7"] = createRTLCell("رقم العميل");
    worksheet["D7"] = createRTLCell(clientNumber);

    // Right side (J & K columns)
    worksheet["J6"] = createRTLCell("السجل التجاري :");
    worksheet["K6"] = createRTLCell(commercialRegister);
    worksheet["J7"] = createRTLCell("الرقم الضريبي :");
    worksheet["K7"] = createRTLCell(taxNumber);

    // FINAL PART - Report title and table

    // Report title (row 9) - Centered across F, G, H columns
    worksheet["F9"] = createRTLCell(reportTitle);
    worksheet["G9"] = createRTLCell("");
    worksheet["H9"] = createRTLCell("");
    worksheet["!merges"].push(
      { s: { r: 8, c: 5 }, e: { r: 8, c: 7 } } // F9:H9
    );

    // Table headers (row 11) - RTL order
    const startCol = 2; // Column C
    columns.forEach((col, index) => {
      const colIndex = startCol + index * 2;
      const colLetter = String.fromCharCode(66 + colIndex); // B=66, so C=68
      worksheet[`${colLetter}11`] = createRTLCell(col.label);
    });

    // Add table data starting from row 12
    data.forEach((item, rowIndex) => {
      const row = 12 + rowIndex;

      columns.forEach((col, colIndex) => {
        const colPos = startCol + colIndex * 2;
        const colLetter = String.fromCharCode(66 + colPos);

        let value = item[col.key];

        // Handle nested objects
        if (typeof value === "object" && value !== null) {
          if (value.text) value = value.text;
          else if (value.name) value = value.name;
          else if (value.active !== undefined)
            value = value.text || (value.active ? "مفعل" : "معطل");
          else value = "-";
        }

        worksheet[`${colLetter}${row}`] = createRTLCell(value || "-");
      });
    });

    // Set column widths for better readability
    const maxCol = startCol + columns.length * 2;
    const colWidths = [];
    for (let i = 0; i <= maxCol + 2; i++) {
      if (i % 2 === 0) {
        colWidths.push({ wch: 20 }); // Data columns
      } else {
        colWidths.push({ wch: 5 }); // Spacing columns
      }
    }
    worksheet["!cols"] = colWidths;

    // Set worksheet range
    const lastRow = 12 + data.length - 1;
    const lastColLetter = String.fromCharCode(66 + maxCol);
    worksheet["!ref"] = `B1:${lastColLetter}${lastRow > 11 ? lastRow : 11}`;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const fullFilename = `${filename}-${currentDate}.xlsx`;

    // Save the workbook with cell styles
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, fullFilename);
  } catch (error) {
    console.error("Excel export error:", error);
    throw error;
  }
};

/**
 * Export table data to PDF with company header
 */
const exportTableToPDF = async (
  data: any[],
  columns: { key: string; label: string }[],
  company: any,
  filename: string,
  reportTitle: string
) => {
  try {
    const pdf = new jsPDF("l", "mm", "a4"); // Landscape orientation

    let yPosition = 10;

    // Add report title
    pdf.setFontSize(16);
    pdf.text(reportTitle, pdf.internal.pageSize.getWidth() - 10, yPosition, {
      align: "right",
    });
    yPosition += 10;

    // Add company information
    if (company) {
      pdf.setFontSize(10);
      const companyInfo = [
        `${company.brandName || company.name || "-"} :اسم الشركة`,
        `${company.email || "-"} :البريد الإلكتروني`,
        `${company.phoneNumber || "-"} :رقم الهاتف`,
        `ر.س ${company.balance || 0} :الرصيد`,
      ];

      companyInfo.forEach((info) => {
        pdf.text(info, pdf.internal.pageSize.getWidth() - 10, yPosition, {
          align: "right",
        });
        yPosition += 6;
      });

      yPosition += 5;
    }

    // Prepare table data
    const tableHeaders = columns.map((col) => col.label);
    const tableRows = data.map((item) =>
      columns.map((col) => {
        const value = item[col.key];
        // Handle nested objects
        if (typeof value === "object" && value !== null) {
          if (value.text) return value.text;
          if (value.name) return value.name;
          return "-";
        }
        return value || "-";
      })
    );

    // Add table using autoTable
    (pdf as any).autoTable({
      head: [tableHeaders],
      body: tableRows,
      startY: yPosition,
      styles: {
        font: "helvetica",
        halign: "center",
      },
      headStyles: {
        fillColor: [79, 91, 179],
        textColor: [255, 255, 255],
        fontSize: 10,
      },
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
    });

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const fullFilename = `${filename}-${currentDate}.pdf`;

    // Save the PDF
    pdf.save(fullFilename);
  } catch (error) {
    console.error("PDF export error:", error);
    throw error;
  }
};
