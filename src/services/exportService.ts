import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

    // Add logo to the worksheet
    const workbookWithLogo = await addLogoToExcelWorksheet(workbook, "Wallet Report");

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `wallet-report-${reportType}-${currentDate}.xlsx`;

    // Save the workbook with cell styles and logo
    const excelBuffer = XLSX.write(workbookWithLogo, {
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
 * Add logo to Excel worksheet using ExcelJS
 * Logo is placed in the middle section (columns F-H, rows 1-3) matching template structure
 */
const addLogoToExcelWorksheet = async (
  workbook: XLSX.WorkBook,
  worksheetName: string = "Sheet1"
): Promise<XLSX.WorkBook> => {
  try {
    // Convert XLSX workbook to ExcelJS format to add image
    const xlsxBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const exceljsWorkbook = new ExcelJS.Workbook();
    await exceljsWorkbook.xlsx.load(xlsxBuffer);

    const worksheet = exceljsWorkbook.getWorksheet(worksheetName) || exceljsWorkbook.worksheets[0];
    if (!worksheet) {
      return workbook; // Return original if worksheet not found
    }

    // Load logo image
    const logoResponse = await fetch("/static/img/logo-3.png");
    if (!logoResponse.ok) {
      console.warn("Logo not found at /static/img/logo-3.png, skipping image addition");
      // Convert back to XLSX format
      const buffer = await exceljsWorkbook.xlsx.writeBuffer();
      return XLSX.read(buffer, { type: "array" });
    }

    const logoBuffer = await logoResponse.arrayBuffer();
    const logoImage = exceljsWorkbook.addImage({
      buffer: logoBuffer,
      extension: "png",
    });

    // Add image to middle section (columns F-H, rows 1-3)
    // Columns: F=6, G=7, H=8 (1-indexed in ExcelJS, but 0-indexed in addImage)
    // Rows: 1-3 (0-indexed: rows 0, 1, 2)
    // Position: Center of merged cells F1:H3
    worksheet.addImage(logoImage, {
      tl: { col: 5, row: 0 }, // Top-left at column F (index 5), row 1 (index 0)
      ext: { width: 150, height: 75 }, // Logo size
    });

    // Convert back to XLSX format
    const buffer = await exceljsWorkbook.xlsx.writeBuffer();
    return XLSX.read(buffer, { type: "array" });
  } catch (error) {
    console.error("Error adding logo to Excel:", error);
    return workbook; // Return original workbook if logo addition fails
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
 * Create PDF HTML template with consistent styling
 */
/**
 * Load logo as base64 for embedding in PDF
 */
const loadLogoAsBase64 = async (): Promise<string> => {
  try {
    const response = await fetch("/static/img/logo-3.png");
    if (!response.ok) {
      return ""; // Return empty string if logo not found
    }
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Could not load logo:", error);
    return "";
  }
};

const createPDFHTMLTemplate = async (
  companyData: any,
  reportTitle: string,
  tableHeaders: string[],
  tableRows: string[][]
): Promise<string> => {
  const companyName =
    companyData?.brandName || companyData?.name || companyData?.email || "N/A";
  const commercialRegister =
    companyData?.commercialRegister ||
    companyData?.commercialRegistrationNumber ||
    companyData?.cr ||
    "123456789";
  const taxNumber =
    companyData?.taxNumber ||
    companyData?.vatNumber ||
    companyData?.vat ||
    companyData?.taxId ||
    "123456789";
  const clientNumber = companyData?.id || companyData?.uid || "N/A";

  // Load logo as base64
  const logoBase64 = await loadLogoAsBase64();
  const logoImg = logoBase64 ? `<img src="${logoBase64}" alt="Petrolife Logo" />` : "";

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Tajawal', Arial, sans-serif;
          direction: rtl;
          padding: 20px;
          background: white;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #ddd;
          padding-bottom: 15px;
        }
        .logo-container {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0 20px;
        }
        .logo-container img {
          max-width: 150px;
          max-height: 80px;
          object-fit: contain;
        }
        .company-info-arabic {
          text-align: right;
          flex: 1;
        }
        .company-info-english {
          text-align: left;
          flex: 1;
        }
        .company-info-arabic h2 {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .company-info-arabic p,
        .company-info-english p {
          font-size: 12px;
          margin: 3px 0;
        }
        .report-title {
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin: 20px 0;
        }
        .client-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 12px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 11px;
        }
        th {
          background-color: #4f5bb3;
          color: white;
          padding: 10px;
          text-align: right;
          font-weight: bold;
          border: 1px solid #ddd;
        }
        td {
          padding: 8px;
          text-align: right;
          border: 1px solid #ddd;
        }
        tr:nth-child(even) {
          background-color: #f5f5f5;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info-arabic">
          <h2>شركة بترولايف</h2>
          <p>بترو لايف</p>
          <p>السجل التجاري : ${commercialRegister}</p>
          <p>الرقم الضريبي : ${taxNumber}</p>
        </div>
        <div class="logo-container">
          ${logoImg}
        </div>
        <div class="company-info-english">
          <h2>petrolife co.</h2>
          <p>petro life</p>
          <p>CR: ${commercialRegister}</p>
          <p>vat: ${taxNumber}</p>
        </div>
      </div>
      
      <div class="client-info">
        <div>
          <strong>اسم العميل:</strong> ${companyName}<br>
          <strong>رقم العميل:</strong> ${clientNumber}
        </div>
        <div>
          <strong>السجل التجاري:</strong> ${commercialRegister}<br>
          <strong>الرقم الضريبي:</strong> ${taxNumber}
        </div>
      </div>
      
      <div class="report-title">${reportTitle}</div>
      
      <table>
        <thead>
          <tr>
            ${tableHeaders.map((header) => `<th>${header}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${tableRows
            .map(
              (row) =>
                `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
};

/**
 * Export data to PDF using consistent table style
 */
const exportToPDF = async (
  transactions: TransactionData[],
  filters: ExportFilters,
  _templatePath: string
) => {
  try {
    // Get current company data
    const companyData = await fetchCurrentCompany();

    const reportType = filters.reportType;
    const reportTitle =
      reportType === "تحليلي"
        ? "التقرير التفصيلي للمحفظة"
        : "التقرير الإجمالي للمحفظة";

    // Prepare table data
    let tableHeaders: string[];
    let tableRows: string[][];

    if (reportType === "تحليلي") {
      // Detailed report
      tableHeaders = [
        "التاريخ",
        "رقم العملية",
        "نوع العملية",
        "الحالة",
        "اسم الشركة",
        "المبلغ",
      ];

      tableRows = transactions.map((transaction) => [
        formatSimpleDate(transaction.date),
        transaction.id,
        transaction.operationType,
        "مقبول",
        transaction.operationName || "N/A",
        transaction.debit,
      ]);
    } else {
      // Summary report
      const totalAmount = transactions.reduce((sum, transaction) => {
        const amount = parseFloat(transaction.debit.replace(/,/g, "")) || 0;
        return sum + amount;
      }, 0);

      const transactionCount = transactions.length;
      const operationType =
        filters.operationType === "الكل" ? "طلبات المحفظة" : filters.operationType;

      tableHeaders = ["نوع العملية", "الكمية", "المبلغ"];
      tableRows = [
        [operationType, transactionCount.toString(), totalAmount.toFixed(2)],
        ["الإجمالي", "", totalAmount.toFixed(2)],
      ];
    }

    // Create HTML template
    const htmlContent = await createPDFHTMLTemplate(
      companyData,
      reportTitle,
      tableHeaders,
      tableRows
    );

    // Create an iframe to completely isolate the PDF content from the main UI
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";
    iframe.style.width = "297mm";
    iframe.style.height = "210mm";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
    
    // Wait for iframe to load
    await new Promise((resolve) => {
      iframe.onload = resolve;
      iframe.src = "about:blank";
    });
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      throw new Error("فشل في إنشاء إطار PDF");
    }
    
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    const tempDiv = iframeDoc.body;

    // Convert HTML to canvas then to PDF
    let canvas: HTMLCanvasElement;
    try {
      // Wait for fonts to load
      await new Promise((resolve) => setTimeout(resolve, 500)); // Give time for fonts to load
      
      canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
        windowWidth: tempDiv.scrollWidth,
        windowHeight: tempDiv.scrollHeight,
      });
    } catch (canvasError) {
      document.body.removeChild(iframe);
      console.error("html2canvas error:", canvasError);
      throw new Error("فشل في تحويل البيانات إلى صورة. يرجى المحاولة مرة أخرى.");
    }

    // Remove temporary element
    document.body.removeChild(iframe);

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
    const errorMessage = error instanceof Error ? error.message : "فشل في تصدير ملف PDF";
    throw new Error(errorMessage);
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

    // Add logo to the worksheet
    const workbookWithLogo = await addLogoToExcelWorksheet(workbook, "Financial Report");

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `financial-report-${reportType}-${currentDate}.xlsx`;

    // Save the workbook with cell styles and logo
    const excelBuffer = XLSX.write(workbookWithLogo, {
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
 * Export financial data to PDF using consistent table style
 */
const exportFinancialToPDF = async (
  reportData: FinancialReportData[],
  filters: FinancialReportFilters
) => {
  try {
    // Get current company data
    const companyData = await fetchCurrentCompany();

    const reportType = filters.reportType;
    const reportTitle =
      reportType === "تحليلي"
        ? "التقرير المالي التفصيلي"
        : "التقرير المالي الإجمالي";

    // Prepare table data
    let tableHeaders: string[];
    let tableRows: string[][];

    if (reportType === "تحليلي") {
      // Detailed report
      tableHeaders = [
        "المدينة",
        "اسم المحطة",
        "التاريخ",
        "رقم العملية",
        "الكمية",
        "اسم المنتج",
        "نوع المنتج",
        "اسم السائق",
        "كود السائق",
      ];

      tableRows = reportData.map((item) => [
        item.city || "-",
        item.stationName || "-",
        item.date || "-",
        item.operationNumber || "-",
        item.quantity || "-",
        item.productName || "-",
        item.productType || "-",
        item.driverName || "-",
        item.driverCode || "-",
      ]);
    } else {
      // Summary report
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

      tableHeaders = ["نوع المنتج", "عدد المعاملات", "إجمالي الكمية"];
      tableRows = Object.entries(productGroups).map(([type, data]) => [
        type,
        data.count.toString(),
        data.quantity.toFixed(2),
      ]);

      // Add total row
      tableRows.push([
        "الإجمالي الكلي",
        totalTransactions.toString(),
        totalQuantity.toFixed(2),
      ]);
    }

    // Create HTML template
    const htmlContent = await createPDFHTMLTemplate(
      companyData,
      reportTitle,
      tableHeaders,
      tableRows
    );

    // Create an iframe to completely isolate the PDF content from the main UI
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";
    iframe.style.width = "297mm";
    iframe.style.height = "210mm";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
    
    // Wait for iframe to load
    await new Promise((resolve) => {
      iframe.onload = resolve;
      iframe.src = "about:blank";
    });
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      throw new Error("فشل في إنشاء إطار PDF");
    }
    
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    const tempDiv = iframeDoc.body;

    // Convert HTML to canvas then to PDF
    let canvas: HTMLCanvasElement;
    try {
      // Wait for fonts to load
      await new Promise((resolve) => setTimeout(resolve, 500)); // Give time for fonts to load
      
      canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
        windowWidth: tempDiv.scrollWidth,
        windowHeight: tempDiv.scrollHeight,
      });
    } catch (canvasError) {
      document.body.removeChild(iframe);
      console.error("html2canvas error:", canvasError);
      throw new Error("فشل في تحويل البيانات إلى صورة. يرجى المحاولة مرة أخرى.");
    }

    // Remove temporary element
    document.body.removeChild(iframe);

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
    const errorMessage = error instanceof Error ? error.message : "فشل في تصدير ملف PDF";
    throw new Error(errorMessage);
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

    // Add logo to the worksheet
    const workbookWithLogo = await addLogoToExcelWorksheet(workbook, "Report");

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const fullFilename = `${filename}-${currentDate}.xlsx`;

    // Save the workbook with cell styles and logo
    const excelBuffer = XLSX.write(workbookWithLogo, {
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
 * Uses consistent table style matching drivers/cars exports
 */
const exportTableToPDF = async (
  data: any[],
  columns: { key: string; label: string }[],
  company: any,
  filename: string,
  reportTitle: string
) => {
  try {
    // Debug: Log input data
    console.log("exportTableToPDF - Input data:", data);
    console.log("exportTableToPDF - Columns:", columns);
    
    // Validate data
    if (!data || data.length === 0) {
      throw new Error("لا توجد بيانات للتصدير");
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
    
    // Debug: Log prepared data
    console.log("exportTableToPDF - Table headers:", tableHeaders);
    console.log("exportTableToPDF - Table rows:", tableRows);
    
    if (!tableRows || tableRows.length === 0) {
      throw new Error("فشل في تحضير بيانات الجدول");
    }

    // Create HTML template using shared function
    const htmlContent = await createPDFHTMLTemplate(
      company,
      reportTitle,
      tableHeaders,
      tableRows
    );
    
    // Debug: Log HTML content length
    console.log("exportTableToPDF - HTML content length:", htmlContent.length);

    // Create an iframe to completely isolate the PDF content from the main UI
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";
    iframe.style.width = "297mm";
    iframe.style.height = "210mm";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
    
    // Wait for iframe to load
    await new Promise((resolve) => {
      iframe.onload = resolve;
      iframe.src = "about:blank";
    });
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      throw new Error("فشل في إنشاء إطار PDF");
    }
    
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    const tempDiv = iframeDoc.body;

    // Wait for fonts to load
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Convert HTML to canvas then to PDF
    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
        windowWidth: tempDiv.scrollWidth,
        windowHeight: tempDiv.scrollHeight,
      });
    } catch (canvasError) {
      document.body.removeChild(iframe);
      console.error("html2canvas error:", canvasError);
      throw new Error("فشل في تحويل البيانات إلى صورة. يرجى المحاولة مرة أخرى.");
    }

    // Remove temporary element
    document.body.removeChild(iframe);

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

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const fullFilename = `${filename}-${currentDate}.pdf`;

    // Save the PDF
    pdf.save(fullFilename);
  } catch (error) {
    console.error("PDF export error:", error);
    const errorMessage = error instanceof Error ? error.message : "فشل في تصدير ملف PDF";
    throw new Error(errorMessage);
  }
};
