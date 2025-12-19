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

