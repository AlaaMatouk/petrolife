/**
 * Standalone script to upload car brands and models from Excel to Firestore
 * Usage: npm run upload-cars <path-to-excel-file>
 * 
 * Example: npm run upload-cars ./data/cars.xlsx
 */

import * as XLSX from "xlsx";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  limit,
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { readFileSync, existsSync } from "fs";
import { createInterface } from "readline";

// Firebase config - you may need to adjust this based on your setup
// For Node.js scripts, you might need to use environment variables or a separate config file
const firebaseConfig = {
  // Add your Firebase config here or load from environment variables
  // This is a placeholder - you'll need to provide actual values
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || "",
};

interface ParsedCarData {
  brands: string[];
  brandModels: Map<string, string[]>;
}

/**
 * Parse Excel file to extract car brands and models
 */
const parseCarDataFromExcel = (filePath: string): ParsedCarData => {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    
    if (!firstSheetName) {
      throw new Error("Excel file has no sheets");
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    }) as any[][];

    if (jsonData.length === 0) {
      throw new Error("Excel file is empty");
    }

    const headerRow = jsonData[0];
    if (!headerRow || headerRow.length === 0) {
      throw new Error("Excel file has no header row");
    }

    const brands: string[] = [];
    const brandModels = new Map<string, string[]>();

    for (let colIndex = 0; colIndex < headerRow.length; colIndex++) {
      const brandName = String(headerRow[colIndex] || "").trim();

      if (!brandName) {
        continue;
      }

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

      if (models.length > 0) {
        brands.push(brandName);
        brandModels.set(brandName, models);
      }
    }

    if (brands.length === 0) {
      throw new Error("No valid brands found in Excel file");
    }

    return { brands, brandModels };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
    throw new Error("Failed to parse Excel file: Unknown error");
  }
};

/**
 * Fetch all car-models from Firestore
 */
const fetchCarModels = async (db: any): Promise<any[]> => {
  try {
    const carModelsRef = collection(db, "car-models");
    const querySnapshot = await getDocs(carModelsRef);

    const carModelsData: any[] = [];
    querySnapshot.forEach((doc) => {
      carModelsData.push({
        docId: doc.id,
        id: doc.id,
        ...doc.data(),
      });
    });

    return carModelsData;
  } catch (error) {
    console.error("Error fetching car-models data:", error);
    throw error;
  }
};

/**
 * Create a new car-model document in Firestore
 */
const createCarModel = async (
  db: any,
  carModelData: {
    name: { ar: string; en?: string };
    createdUserId?: string | null;
  }
): Promise<{ id: string; data: any }> => {
  try {
    const carModelsCollection = collection(db, "car-models");
    const sampleQuery = query(carModelsCollection, limit(1));
    const sampleSnapshot = await getDocs(sampleQuery);

    const carModelPayload: any = {
      name: {
        ar: carModelData.name.ar,
        en: carModelData.name.en || carModelData.name.ar,
      },
      createdDate: serverTimestamp(),
      createdUserId: carModelData.createdUserId,
    };

    if (!sampleSnapshot.empty) {
      const sampleData = sampleSnapshot.docs[0].data();
      Object.keys(sampleData).forEach((key) => {
        if (
          !["name", "createdDate", "createdUserId", "docId", "id"].includes(key)
        ) {
          if (sampleData[key] !== null && sampleData[key] !== undefined) {
            if (typeof sampleData[key] === "string") {
              carModelPayload[key] = "";
            } else if (typeof sampleData[key] === "number") {
              carModelPayload[key] = 0;
            } else if (typeof sampleData[key] === "boolean") {
              carModelPayload[key] = false;
            } else if (Array.isArray(sampleData[key])) {
              carModelPayload[key] = [];
            } else if (typeof sampleData[key] === "object") {
              carModelPayload[key] = {};
            } else {
              carModelPayload[key] = null;
            }
          }
        }
      });
    }

    const carModelDocRef = doc(carModelsCollection);
    await setDoc(carModelDocRef, carModelPayload);

    return {
      id: carModelDocRef.id,
      data: carModelPayload,
    };
  } catch (error) {
    console.error("Error creating car-model document:", error);
    throw error;
  }
};

/**
 * Fetch all car-types from Firestore
 */
const fetchCarTypes = async (db: any): Promise<any[]> => {
  try {
    const carTypesRef = collection(db, "car-types");
    const querySnapshot = await getDocs(carTypesRef);

    const carTypesData: any[] = [];
    querySnapshot.forEach((doc) => {
      carTypesData.push({
        docId: doc.id,
        id: doc.id,
        ...doc.data(),
      });
    });

    return carTypesData;
  } catch (error) {
    console.error("Error fetching car-types data:", error);
    throw error;
  }
};

/**
 * Create a new car-type document in Firestore
 */
const createCarType = async (
  db: any,
  carTypeData: {
    name: { ar: string; en?: string };
    carModel: {
      name: { ar: string; en?: string };
      carModelImageUrl?: string | null;
    };
    year: string;
    fuelType: string;
    createdUserId?: string | null;
  }
): Promise<{ id: string; data: any }> => {
  try {
    const carTypePayload: any = {
      name: {
        ar: carTypeData.name.ar,
        en: carTypeData.name.en || carTypeData.name.ar,
      },
      carModel: {
        name: {
          ar: carTypeData.carModel.name.ar,
          en: carTypeData.carModel.name.en || carTypeData.carModel.name.ar,
        },
        carModelImageUrl: carTypeData.carModel.carModelImageUrl || null,
      },
      year: carTypeData.year,
      fuelType: carTypeData.fuelType,
      createdDate: serverTimestamp(),
      createdUserId: carTypeData.createdUserId,
    };

    const carTypesCollection = collection(db, "car-types");
    const carTypeDocRef = doc(carTypesCollection);
    await setDoc(carTypeDocRef, carTypePayload);

    return {
      id: carTypeDocRef.id,
      data: carTypePayload,
    };
  } catch (error) {
    console.error("Error creating car-type document:", error);
    throw error;
  }
};

/**
 * Upload car brands from Excel data
 */
const uploadCarBrandsFromExcel = async (
  db: any,
  brands: string[],
  createdUserId?: string | null
): Promise<{ created: number; skipped: number; brandMap: Map<string, string> }> => {
  try {
    const existingBrands = await fetchCarModels(db);
    const existingBrandNames = new Set(
      existingBrands
        .map((brand) => brand.name?.ar?.trim().toLowerCase())
        .filter((name): name is string => !!name)
    );

    const brandMap = new Map<string, string>();
    let created = 0;
    let skipped = 0;

    for (const brandName of brands) {
      const normalizedName = brandName.trim().toLowerCase();

      if (existingBrandNames.has(normalizedName)) {
        const existingBrand = existingBrands.find(
          (b) => b.name?.ar?.trim().toLowerCase() === normalizedName
        );
        if (existingBrand?.id) {
          brandMap.set(brandName.trim(), existingBrand.id);
        }
        skipped++;
        console.log(`⏭️  Skipped duplicate brand: ${brandName}`);
        continue;
      }

      try {
        const result = await createCarModel(db, {
          name: { ar: brandName.trim() },
          createdUserId: createdUserId,
        });

        brandMap.set(brandName.trim(), result.id);
        existingBrandNames.add(normalizedName);
        created++;
        console.log(`✅ Created brand: ${brandName}`);
      } catch (error) {
        console.error(`❌ Error creating brand "${brandName}":`, error);
      }
    }

    return { created, skipped, brandMap };
  } catch (error) {
    console.error("Error uploading car brands:", error);
    throw error;
  }
};

/**
 * Upload car types from Excel data
 */
const uploadCarTypesFromExcel = async (
  db: any,
  brandModels: Map<string, string[]>,
  brandMap: Map<string, string>,
  defaultYear: string = "2020",
  defaultFuelType: string = "fuel95",
  createdUserId?: string | null
): Promise<{ created: number; skipped: number }> => {
  try {
    const existingCarTypes = await fetchCarTypes(db);
    const existingTypeKeys = new Set(
      existingCarTypes.map((type) => {
        const brandName = type.carModel?.name?.ar?.trim().toLowerCase() || "";
        const modelName = type.name?.ar?.trim().toLowerCase() || "";
        return `${brandName}::${modelName}`;
      })
    );

    let created = 0;
    let skipped = 0;

    for (const [brandName, models] of brandModels.entries()) {
      const brandDocId = brandMap.get(brandName.trim());

      if (!brandDocId) {
        console.warn(`⚠️  Brand "${brandName}" not found in brandMap, skipping models`);
        continue;
      }

      const brandDoc = await getDoc(doc(db, "car-models", brandDocId));
      if (!brandDoc.exists()) {
        console.warn(`⚠️  Brand document "${brandDocId}" not found, skipping models`);
        continue;
      }

      const brandData = brandDoc.data();
      const brandNameAr = brandData?.name?.ar || brandName.trim();
      const brandNameEn = brandData?.name?.en || brandNameAr;

      for (const modelName of models) {
        const normalizedKey = `${brandName.trim().toLowerCase()}::${modelName.trim().toLowerCase()}`;

        if (existingTypeKeys.has(normalizedKey)) {
          skipped++;
          console.log(`⏭️  Skipped duplicate model: ${modelName} (${brandName})`);
          continue;
        }

        try {
          await createCarType(db, {
            name: { ar: modelName.trim() },
            carModel: {
              name: { ar: brandNameAr, en: brandNameEn },
              carModelImageUrl: null,
            },
            year: defaultYear,
            fuelType: defaultFuelType,
            createdUserId: createdUserId,
          });

          existingTypeKeys.add(normalizedKey);
          created++;
          console.log(`✅ Created model: ${modelName} (${brandName})`);
        } catch (error) {
          console.error(`❌ Error creating model "${modelName}" for brand "${brandName}":`, error);
        }
      }
    }

    return { created, skipped };
  } catch (error) {
    console.error("Error uploading car types:", error);
    throw error;
  }
};

/**
 * Prompt for user input
 */
const prompt = (question: string): Promise<string> => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

/**
 * Main function
 */
const main = async () => {
  try {
    // Get file path from command line arguments
    const filePath = process.argv[2];

    if (!filePath) {
      console.error("❌ Error: Please provide the path to the Excel file");
      console.log("Usage: npm run upload-cars <path-to-excel-file>");
      console.log("Example: npm run upload-cars ./data/cars.xlsx");
      process.exit(1);
    }

    // Check if Firebase config is provided
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.error("❌ Error: Firebase configuration is missing");
      console.log("Please set the following environment variables:");
      console.log("  FIREBASE_API_KEY");
      console.log("  FIREBASE_AUTH_DOMAIN");
      console.log("  FIREBASE_PROJECT_ID");
      console.log("  FIREBASE_STORAGE_BUCKET");
      console.log("  FIREBASE_MESSAGING_SENDER_ID");
      console.log("  FIREBASE_APP_ID");
      process.exit(1);
    }

    console.log("🚀 Starting car data upload...\n");

    // Initialize Firebase
    console.log("📡 Initializing Firebase...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    // Authenticate (you may need to adjust this based on your auth setup)
    // For scripts, you might want to use a service account or prompt for credentials
    const email = process.env.FIREBASE_EMAIL || (await prompt("Firebase email: "));
    const password = process.env.FIREBASE_PASSWORD || (await prompt("Firebase password: "));

    console.log("🔐 Authenticating...");
    await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Authenticated successfully\n");

    // Parse Excel file
    console.log(`📄 Parsing Excel file: ${filePath}`);
    const parsedData = parseCarDataFromExcel(filePath);
    console.log(`✅ Found ${parsedData.brands.length} brands`);
    const totalModels = Array.from(parsedData.brandModels.values()).reduce(
      (sum, models) => sum + models.length,
      0
    );
    console.log(`✅ Found ${totalModels} models\n`);

    // Upload brands
    console.log("📤 Uploading brands to Firestore...");
    const brandsResult = await uploadCarBrandsFromExcel(
      db,
      parsedData.brands,
      auth.currentUser?.email || null
    );
    console.log(`\n✅ Brands upload complete:`);
    console.log(`   Created: ${brandsResult.created}`);
    console.log(`   Skipped: ${brandsResult.skipped}\n`);

    // Upload models
    console.log("📤 Uploading models to Firestore...");
    const modelsResult = await uploadCarTypesFromExcel(
      db,
      parsedData.brandModels,
      brandsResult.brandMap,
      "2020",
      "fuel95",
      auth.currentUser?.email || null
    );
    console.log(`\n✅ Models upload complete:`);
    console.log(`   Created: ${modelsResult.created}`);
    console.log(`   Skipped: ${modelsResult.skipped}\n`);

    console.log("🎉 Upload completed successfully!");
    console.log(`\nSummary:`);
    console.log(`  Brands: ${brandsResult.created} created, ${brandsResult.skipped} skipped`);
    console.log(`  Models: ${modelsResult.created} created, ${modelsResult.skipped} skipped`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
};

// Run the script
main();

