import * as XLSX from "xlsx";

export interface ParsedCarData {
  brands: string[];
  brandModels: Map<string, string[]>;
}

/**
 * Parse Excel file to extract car brands and models
 * Structure: Each column = brand (first row = brand name), rows below = models
 * @param file - Excel file (File object or file path)
 * @returns Parsed data with brands and their models
 */
export const parseCarDataFromExcel = async (
  file: File | string
): Promise<ParsedCarData> => {
  try {
    let workbook: XLSX.WorkBook;

    if (file instanceof File) {
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      workbook = XLSX.read(arrayBuffer, { type: "array" });
    } else {
      // Read from file path (for Node.js script)
      workbook = XLSX.readFile(file);
    }

    // Get the first sheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error("Excel file has no sheets");
    }

    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    }) as any[][];

    if (jsonData.length === 0) {
      throw new Error("Excel file is empty");
    }

    // First row contains brand names (column headers)
    const headerRow = jsonData[0];
    if (!headerRow || headerRow.length === 0) {
      throw new Error("Excel file has no header row");
    }

    const brands: string[] = [];
    const brandModels = new Map<string, string[]>();

    // Process each column (brand)
    for (let colIndex = 0; colIndex < headerRow.length; colIndex++) {
      const brandName = String(headerRow[colIndex] || "").trim();

      // Skip empty columns
      if (!brandName) {
        continue;
      }

      // Collect models for this brand (rows below header)
      const models: string[] = [];
      for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
        const row = jsonData[rowIndex];
        if (row && row[colIndex] !== undefined) {
          const modelName = String(row[colIndex] || "").trim();
          if (modelName) {
            models.push(modelName);
          }
        }
      }

      // Only add brand if it has at least one model
      if (models.length > 0) {
        brands.push(brandName);
        brandModels.set(brandName, models);
      }
    }

    if (brands.length === 0) {
      throw new Error("No valid brands found in Excel file");
    }

    return {
      brands,
      brandModels,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
    throw new Error("Failed to parse Excel file: Unknown error");
  }
};

export interface ParsedBankData {
  banks: Array<{
    arabic: string;
    english: string;
  }>;
}

/**
 * Parse Excel file to extract bank names
 * Structure: Arabic names in columns F/G, English names in columns C/D/E, starting from row 4
 * @param file - Excel file (File object)
 * @returns Parsed data with banks in Arabic and English
 */
export const parseBanksFromExcel = async (
  file: File
): Promise<ParsedBankData> => {
  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // Get the first sheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error("Excel file has no sheets");
    }

    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON (row-based array)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    }) as any[][];

    if (jsonData.length < 4) {
      throw new Error("Excel file does not have enough rows");
    }

    const banks: Array<{ arabic: string; english: string }> = [];

    // Start from row 4 (index 3, since arrays are 0-indexed)
    // Arabic names are in columns F/G (indices 5/6)
    // English names are in columns C/D/E (indices 2/3/4)
    for (let rowIndex = 3; rowIndex < jsonData.length; rowIndex++) {
      const row = jsonData[rowIndex];
      if (!row) continue;

      // Extract Arabic name from columns F/G (indices 5/6)
      // Primary column is G (index 6), F (index 5) may extend
      const arabicColF = String(row[5] || "").trim();
      const arabicColG = String(row[6] || "").trim();
      // Prioritize G, append F if both exist
      const arabicName = arabicColG
        ? arabicColF
          ? (arabicColF + " " + arabicColG).trim()
          : arabicColG
        : arabicColF;

      // Extract English name from columns C/D/E (indices 2/3/4)
      // Primary column is D (index 3), C (index 2) and E (index 4) may extend
      const englishColC = String(row[2] || "").trim();
      const englishColD = String(row[3] || "").trim();
      const englishColE = String(row[4] || "").trim();
      // Prioritize D, append C and E if they exist
      const englishName = englishColD
        ? [englishColC, englishColD, englishColE]
            .filter((col) => col)
            .join(" ")
            .trim()
        : englishColC || englishColE;

      // Only add if we have at least one name (Arabic or English)
      if (arabicName || englishName) {
        banks.push({
          arabic: arabicName || englishName, // Fallback to English if Arabic is missing
          english: englishName || arabicName, // Fallback to Arabic if English is missing
        });
      }
    }

    if (banks.length === 0) {
      throw new Error("No valid banks found in Excel file");
    }

    return { banks };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
    throw new Error("Failed to parse Excel file: Unknown error");
  }
};

