import {
  collection,
  getDocs,
  query,
  QuerySnapshot,
  DocumentData,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  where,
  orderBy,
  setDoc,
  limit,
  deleteDoc,
  Timestamp,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth, storage } from "../config/firebase";
import {
  DriversSummaryData,
  SubscriptionGroupSummary,
  SubscriptionsSummaryData,
} from "../types/dashboardStats";

/**
 * Normalize car size to standard Arabic format
 * Converts English (small/middle/big) and Arabic variations to standard Arabic
 * @param size - Car size in any format
 * @returns Normalized Arabic car size
 */
export const normalizeCarSize = (size: any): string => {
  if (!size) return "-";

  const sizeStr = String(size).toLowerCase().trim();

  // Small (صغيرة)
  if (sizeStr === "small" || sizeStr === "صغيرة" || sizeStr.includes("صغير")) {
    return "صغيرة";
  }

  // Medium/Middle (متوسطة)
  if (
    sizeStr === "medium" ||
    sizeStr === "middle" ||
    sizeStr === "متوسطة" ||
    sizeStr.includes("متوسط")
  ) {
    return "متوسطة";
  }

  // Large/Big (كبيرة)
  if (
    sizeStr === "large" ||
    sizeStr === "big" ||
    sizeStr === "كبيرة" ||
    sizeStr.includes("كبير")
  ) {
    return "كبيرة";
  }

  // VIP
  if (sizeStr === "vip" || sizeStr.includes("vip")) {
    return "VIP";
  }

  // Return original if no match
  return size;
};

/**
 * Fetch companies-drivers data from Firestore
 * @returns Promise with the companies-drivers data
 */
export const fetchCompaniesDrivers = async () => {
  try {
    // console.log('Fetching companies-drivers data from Firestore...');

    const companiesDriversRef = collection(db, "companies-drivers");
    const q = query(companiesDriversRef, orderBy("createdDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    const companiesDriversData: any[] = [];

    querySnapshot.forEach((doc) => {
      companiesDriversData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // console.log('Companies-Drivers Data (All):');
    // console.log('======================');
    // console.log(`Total documents: ${companiesDriversData.length}`);
    // console.log('Data:', companiesDriversData);
    // console.table(companiesDriversData);

    // Get current user
    const currentUser = auth.currentUser;

    if (currentUser) {
      const userEmail = currentUser.email;
      const userId = currentUser.uid;

      // console.log('\nCurrent User Info:');
      // console.log('==================');
      // console.log('Email:', userEmail);
      // console.log('UID:', userId);

      // Filter drivers where createdUserId contains user email OR companyUid equals user id
      const filteredDrivers = companiesDriversData.filter((driver) => {
        const createdUserIdMatch =
          driver.createdUserId &&
          userEmail &&
          driver.createdUserId.toLowerCase().includes(userEmail.toLowerCase());

        const companyUidMatch =
          driver.companyUid && userId && driver.companyUid === userId;

        return createdUserIdMatch || companyUidMatch;
      });

      // console.log('\nFiltered Companies-Drivers Data:');
      // console.log('=================================');
      // console.log(`Total filtered documents: ${filteredDrivers.length}`);
      // console.log('Filtered Data:', filteredDrivers);
      // console.table(filteredDrivers);

      return filteredDrivers;
    } else {
      // console.log('\nNo user is currently logged in. Returning all data.');
      return companiesDriversData;
    }
  } catch (error) {
    console.error("Error fetching companies-drivers data:", error);
    throw error;
  }
};

/**
 * Fetch all documents from the Firestore "drivers" collection
 * @returns Promise with the drivers data
 */
export const fetchDrivers = async () => {
  try {
    const driversRef = collection(db, "drivers");
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(
      driversRef
    );

    const driversData: any[] = [];

    querySnapshot.forEach((doc) => {
      driversData.push({
        docId: doc.id,
        ...doc.data(),
      });
    });

    return driversData;
  } catch (error) {
    console.error("Error fetching drivers data:", error);
    throw error;
  }
};

/**
 * Add 8-digit refid to existing petrolife drivers that don't have one
 * @returns Promise with the number of updated drivers
 */
export const addRefidToExistingPetrolifeDrivers = async (): Promise<number> => {
  try {
    console.log(
      "🔄 Starting migration: Adding refid to existing petrolife drivers..."
    );
    const driversRef = collection(db, "drivers");
    // Fetch all documents without orderBy to avoid errors if some don't have createdDate
    const driversSnapshot = await getDocs(driversRef);
    console.log(`📦 Found ${driversSnapshot.size} drivers`);

    let updatedCount = 0;
    const driversToUpdate: Array<{ docRef: any; refid: string }> = [];

    for (const driverDoc of driversSnapshot.docs) {
      const driverData = driverDoc.data();
      if (driverData.refid) {
        console.log(
          `⏭️  Driver ${driverDoc.id} already has refid: ${driverData.refid}`
        );
        continue;
      }

      let refid: string = "";
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 20;

      while (!isUnique && attempts < maxAttempts) {
        const randomCode = Math.floor(10000000 + Math.random() * 90000000);
        refid = randomCode.toString();
        const driversRefCheck = collection(db, "drivers");
        const qCheck = query(driversRefCheck, where("refid", "==", refid));
        const querySnapshot = await getDocs(qCheck);
        const isInPendingUpdates = driversToUpdate.some(
          (item) => item.refid === refid
        );

        if (querySnapshot.empty && !isInPendingUpdates) {
          isUnique = true;
        } else {
          attempts++;
        }
      }

      if (!isUnique || !refid) {
        console.error(
          `❌ Failed to generate unique refid for driver ${driverDoc.id} after ${maxAttempts} attempts`
        );
        continue;
      }

      driversToUpdate.push({
        docRef: doc(db, "drivers", driverDoc.id),
        refid: refid,
      });
      console.log(`✅ Generated refid ${refid} for driver ${driverDoc.id}`);
    }

    console.log(`📝 Updating ${driversToUpdate.length} drivers with refid...`);
    for (const { docRef, refid } of driversToUpdate) {
      try {
        await updateDoc(docRef, { refid: refid });
        updatedCount++;
        console.log(`✅ Updated driver ${docRef.id} with refid: ${refid}`);
      } catch (error) {
        console.error(`❌ Error updating driver ${docRef.id}:`, error);
      }
    }
    console.log(
      `✅ Migration completed: ${updatedCount} drivers updated with refid`
    );
    return updatedCount;
  } catch (error) {
    console.error("❌ Error in migration:", error);
    throw error;
  }
};

/**
 * Fetch a petrolife driver document by ID (for getting raw data like isActive)
 * @param driverId - The driver document ID
 * @returns Promise with driver document data
 */
export const fetchPetrolifeDriverById = async (driverId: string) => {
  try {
    console.log("Fetching petrolife driver by ID:", driverId);

    // Fetch the specific driver document from Firestore
    const driverDocRef = doc(db, "drivers", driverId);
    const driverDoc = await getDoc(driverDocRef);

    if (!driverDoc.exists()) {
      throw new Error("Driver not found");
    }

    const driverData = driverDoc.data();

    const driver = {
      id: driverDoc.id,
      ...driverData,
    };

    console.log("Driver data fetched:", driver);

    return driver;
  } catch (error) {
    console.error("Error fetching petrolife driver by ID:", error);
    throw error;
  }
};

/**
 * Update petrolife driver isActive status in Firestore
 * @param driverId - The driver document ID
 * @param isActive - The new isActive status
 * @returns Promise<boolean> - Returns true if update was successful
 */
export const updatePetrolifeDriverIsActive = async (
  driverId: string,
  isActive: boolean
): Promise<boolean> => {
  try {
    console.log(
      `📝 Updating petrolife driver isActive status: ${driverId} -> ${isActive}`
    );

    const driverDocRef = doc(db, "drivers", driverId);
    await updateDoc(driverDocRef, {
      isActive: isActive,
    });

    console.log(`✅ Successfully updated petrolife driver isActive status`);
    return true;
  } catch (error) {
    console.error("❌ Error updating petrolife driver isActive status:", error);
    throw error;
  }
};

/**
 * Delete a petrolife driver from Firestore
 * @param driverId - The driver document ID
 * @returns Promise<boolean> - Returns true if deletion was successful
 */
export const deletePetrolifeDriver = async (
  driverId: string
): Promise<boolean> => {
  try {
    console.log(`🗑️ Deleting petrolife driver from Firestore: ${driverId}`);

    // Verify the driver exists before deleting
    const driverDocRef = doc(db, "drivers", driverId);
    const driverDoc = await getDoc(driverDocRef);

    if (!driverDoc.exists()) {
      throw new Error("Driver not found");
    }

    // Delete the driver document
    await deleteDoc(driverDocRef);
    console.log(`✅ Successfully deleted petrolife driver from Firestore`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting petrolife driver:", error);
    throw error;
  }
};

/**
 * Fetch a single driver document from the Firestore "drivers" collection
 * @param driverId - Driver document ID
 * @returns Promise with the driver data
 */
export const fetchDriverDocumentById = async (driverId: string) => {
  try {
    const driverDocRef = doc(db, "drivers", driverId);
    const driverDoc = await getDoc(driverDocRef);

    if (!driverDoc.exists()) {
      throw new Error("Driver not found");
    }

    return {
      docId: driverDoc.id,
      ...driverDoc.data(),
    };
  } catch (error) {
    console.error("Error fetching driver document:", error);
    throw error;
  }
};

type DriverSchemaNode =
  | { kind: "value" }
  | { kind: "object"; fields: Record<string, DriverSchemaNode> }
  | { kind: "array"; element: DriverSchemaNode | null };

let driverSchemaCache: DriverSchemaNode | null = null;
let driverSchemaPromise: Promise<DriverSchemaNode> | null = null;
let couponSchemaCache: DriverSchemaNode | null = null;
let couponSchemaPromise: Promise<DriverSchemaNode> | null = null;

const isFirestoreTimestamp = (value: any): boolean =>
  Boolean(value) &&
  typeof value === "object" &&
  typeof value.toDate === "function" &&
  typeof value.seconds === "number";

const isPlainObjectLike = (value: any): value is Record<string, any> =>
  Boolean(value) &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  !isFirestoreTimestamp(value);

const mergeSchemaNode = (
  existing: DriverSchemaNode | undefined,
  value: any
): DriverSchemaNode => {
  if (value === null || value === undefined) {
    return existing ?? { kind: "value" };
  }

  if (Array.isArray(value)) {
    const elementSchema =
      existing && existing.kind === "array" ? existing.element : null;

    const mergedElement = value.reduce<DriverSchemaNode | null>((acc, item) => {
      if (item === undefined) {
        return acc;
      }
      const next = mergeSchemaNode(acc ?? undefined, item);
      return next;
    }, elementSchema ?? null);

    return {
      kind: "array",
      element: mergedElement,
    };
  }

  if (isPlainObjectLike(value)) {
    const fields: Record<string, DriverSchemaNode> =
      existing && existing.kind === "object" ? { ...existing.fields } : {};

    Object.entries(value).forEach(([key, nestedValue]) => {
      if (key === "docId") {
        return;
      }
      fields[key] = mergeSchemaNode(fields[key], nestedValue);
    });

    return {
      kind: "object",
      fields,
    };
  }

  return { kind: "value" };
};

const deriveSchemaFromDocuments = (documents: any[]): DriverSchemaNode => {
  const root: DriverSchemaNode = { kind: "object", fields: {} };

  documents.forEach((document) => {
    if (!isPlainObjectLike(document)) {
      return;
    }

    Object.entries(document).forEach(([key, value]) => {
      if (key === "docId") {
        return;
      }
      root.fields[key] = mergeSchemaNode(root.fields[key], value);
    });
  });

  return root;
};

const deriveSchemaFromDrivers = (drivers: any[]): DriverSchemaNode =>
  deriveSchemaFromDocuments(drivers);

const ensureDriverSchemaLoaded = async (): Promise<DriverSchemaNode> => {
  if (driverSchemaCache) {
    return driverSchemaCache;
  }

  if (!driverSchemaPromise) {
    driverSchemaPromise = (async () => {
      const drivers = await fetchDrivers();
      const schema = deriveSchemaFromDrivers(drivers);
      driverSchemaCache = schema;
      return schema;
    })();
  }

  return driverSchemaPromise;
};

const ensureCouponSchemaLoaded = async (): Promise<DriverSchemaNode> => {
  if (couponSchemaCache) {
    return couponSchemaCache;
  }

  if (!couponSchemaPromise) {
    couponSchemaPromise = (async () => {
      const couponsSnapshot = await getDocs(collection(db, "coupons"));
      const coupons = couponsSnapshot.docs.map((docSnapshot) =>
        docSnapshot.data()
      );
      const schema = deriveSchemaFromDocuments(coupons);
      couponSchemaCache = schema;
      return schema;
    })();
  }

  return couponSchemaPromise;
};

const buildPayloadFromSchema = (schema: DriverSchemaNode, source: any): any => {
  if (schema.kind === "value") {
    // Leaf nodes fallback to null whenever the caller does not provide a value.
    return source ?? null;
  }

  if (schema.kind === "array") {
    if (!Array.isArray(source)) {
      return [];
    }

    const elementSchema = schema.element;
    if (!elementSchema) {
      return source;
    }

    return source.map((item) => buildPayloadFromSchema(elementSchema, item));
  }

  const result: Record<string, any> = {};
  const sourceObject = isPlainObjectLike(source) ? source : {};

  Object.entries(schema.fields).forEach(([key, childSchema]) => {
    // Materialise nested objects recursively to keep structure identical
    // across all documents (missing values bubble down as nulls).
    result[key] = buildPayloadFromSchema(childSchema, sourceObject[key]);
  });

  return result;
};

const TIMESTAMP_FIELD_NAMES = new Set([
  "createdAt",
  "createdDate",
  "updatedAt",
  "updatedDate",
  "lastUpdatedAt",
]);

const applyTimestampOverrides = (value: any): void => {
  if (Array.isArray(value)) {
    value.forEach((entry) => applyTimestampOverrides(entry));
    return;
  }

  if (!isPlainObjectLike(value)) {
    return;
  }

  Object.entries(value).forEach(([key, nested]) => {
    if (
      TIMESTAMP_FIELD_NAMES.has(key) &&
      (nested === null || nested === undefined)
    ) {
      value[key] = serverTimestamp();
      return;
    }

    applyTimestampOverrides(nested);
  });
};

/**
 * Generate a full driver payload by projecting the provided form data
 * over the schema derived from existing driver documents.
 *
 * - We scan historic documents once to collect every field (including nested).
 * - For each field, we copy the supplied value if present, otherwise we fall back to null.
 * - Nested objects are always materialised so the Firestore document keeps a consistent shape.
 */
export const generateFullDriverPayload = async (
  formData: Record<string, any>
): Promise<Record<string, any>> => {
  let schema = await ensureDriverSchemaLoaded();

  if (
    schema.kind === "object" &&
    Object.keys(schema.fields).length === 0 &&
    isPlainObjectLike(formData)
  ) {
    schema = deriveSchemaFromDrivers([formData]);
    driverSchemaCache = schema;
  }

  return buildPayloadFromSchema(schema, formData);
};

export const generateFullCouponPayload = async (
  formData: Record<string, any>
): Promise<Record<string, any>> => {
  let schema = await ensureCouponSchemaLoaded();

  if (
    schema.kind === "object" &&
    Object.keys(schema.fields).length === 0 &&
    isPlainObjectLike(formData)
  ) {
    schema = deriveSchemaFromDocuments([formData]);
    couponSchemaCache = schema;
  }

  const payload = buildPayloadFromSchema(schema, formData);

  if (isPlainObjectLike(formData)) {
    Object.entries(formData).forEach(([key, value]) => {
      if (!(key in payload)) {
        payload[key] = value;
      }
    });
  }

  return payload;
};

/**
 * Create a new driver document in the "drivers" collection while ensuring
 * the payload respects the complete schema observed in previous documents.
 *
 * This prevents new records from dropping fields (they become null instead),
 * which keeps Firestore data shape consistent for downstream consumers.
 */
export const createNewDriver = async (formData: Record<string, any>) => {
  const payload = await generateFullDriverPayload(formData);

  applyTimestampOverrides(payload);

  // Generate unique 8-digit refid for driver
  console.log("🔢 Generating unique 8-digit refid for petrolife driver...");
  let refid: string = "";
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    const randomCode = Math.floor(10000000 + Math.random() * 90000000);
    refid = randomCode.toString();
    const driversRefCheck = collection(db, "drivers");
    const qCheck = query(driversRefCheck, where("refid", "==", refid));
    const querySnapshot = await getDocs(qCheck);

    if (querySnapshot.empty) {
      isUnique = true;
    } else {
      attempts++;
    }
  }

  if (!isUnique || !refid) {
    throw new Error("فشل في إنشاء كود السائق. يرجى المحاولة مرة أخرى.");
  }

  console.log(`✅ Generated unique refid: ${refid}`);

  // Add refid to payload
  payload.refid = refid;

  const driversRef = collection(db, "drivers");
  const docRef = await addDoc(driversRef, payload);

  return {
    docId: docRef.id,
    ...payload,
  };
};

export const createCouponWithSchema = async (formData: Record<string, any>) => {
  const payload = await generateFullCouponPayload(formData);

  if (payload.createdDate === null || payload.createdDate === undefined) {
    payload.createdDate = serverTimestamp();
  }

  const currentUser = auth.currentUser;
  const currentUserIdentifier = currentUser?.uid ?? currentUser?.email ?? null;

  payload.createdUserId =
    currentUserIdentifier ?? payload.createdUserId ?? null;

  if (payload.percentage === undefined) {
    payload.percentage = formData.percentage ?? null;
  }

  if (payload.precentage === undefined) {
    payload.precentage = formData.precentage ?? payload.percentage ?? null;
  } else if (payload.precentage === null && payload.percentage != null) {
    payload.precentage = payload.percentage;
  }

  applyTimestampOverrides(payload);

  const couponsRef = collection(db, "coupons");
  const docRef = await addDoc(couponsRef, payload);

  couponSchemaCache = null;
  couponSchemaPromise = null;

  return {
    id: docRef.id,
    ...payload,
  };
};

/**
 * Fetch all documents from the Firestore "orders" collection
 * @returns Promise with the orders data
 */
export const fetchAllOrdersDocuments = async () => {
  try {
    const ordersRef = collection(db, "orders");
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(ordersRef);

    const ordersData: any[] = [];

    querySnapshot.forEach((doc) => {
      ordersData.push({
        docId: doc.id,
        ...doc.data(),
      });
    });

    return ordersData;
  } catch (error) {
    console.error("Error fetching orders data:", error);
    throw error;
  }
};

/**
 * Fetch all data from a specific collection
 * @param collectionName - Name of the collection to fetch
 * @returns Promise with the collection data
 */
export const fetchCollection = async (collectionName: string) => {
  try {
    // console.log(`Fetching data from collection: ${collectionName}...`);

    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, orderBy("createdDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    const data: any[] = [];

    querySnapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // console.log(`${collectionName} Data:`, data);

    return data;
  } catch (error) {
    console.error(`Error fetching ${collectionName} data:`, error);
    throw error;
  }
};

/**
 * Fetch companies-drivers-transfer data from Firestore
 * Filtered by current user's company email (createdUser.email)
 * @returns Promise with the companies-drivers-transfer data filtered by current company
 */
/**
 * Add 8-digit refid to existing driver transfers in companies-drivers-transfer collection
 * @returns Promise with number of updated transfers
 */
export const addRefidToExistingDriverTransfers = async (): Promise<number> => {
  try {
    console.log(
      "🔄 Starting migration: Adding refid to existing driver transfers..."
    );

    const transfersRef = collection(db, "companies-drivers-transfer");
    const transfersSnapshot = await getDocs(transfersRef);
    console.log(`📦 Found ${transfersSnapshot.size} driver transfers`);

    let updatedCount = 0;
    const transfersToUpdate: Array<{ docRef: any; refid: string }> = [];

    // First pass: Identify transfers without refid and generate refids
    for (const transferDoc of transfersSnapshot.docs) {
      const transferData = transferDoc.data();

      // Skip if transfer already has refid
      if (transferData.refid) {
        console.log(
          `⏭️  Driver transfer ${transferDoc.id} already has refid: ${transferData.refid}`
        );
        continue;
      }

      // Generate unique 8-digit refid
      let refid: string = "";
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 20;

      while (!isUnique && attempts < maxAttempts) {
        // Generate 8-digit number (10000000 to 99999999)
        const randomCode = Math.floor(10000000 + Math.random() * 90000000);
        refid = randomCode.toString();

        // Check if refid already exists in Firestore or in our pending updates
        const transfersRefCheck = collection(db, "companies-drivers-transfer");
        const qCheck = query(transfersRefCheck, where("refid", "==", refid));
        const querySnapshot = await getDocs(qCheck);

        // Also check if this refid is already in our pending updates
        const isInPendingUpdates = transfersToUpdate.some(
          (item) => item.refid === refid
        );

        if (querySnapshot.empty && !isInPendingUpdates) {
          isUnique = true;
        } else {
          attempts++;
        }
      }

      if (!isUnique || !refid) {
        console.error(
          `❌ Failed to generate unique refid for driver transfer ${transferDoc.id} after ${maxAttempts} attempts`
        );
        continue;
      }

      transfersToUpdate.push({
        docRef: doc(db, "companies-drivers-transfer", transferDoc.id),
        refid: refid,
      });
      console.log(
        `✅ Generated refid ${refid} for driver transfer ${transferDoc.id}`
      );
    }

    console.log(
      `📝 Updating ${transfersToUpdate.length} driver transfers with refid...`
    );
    for (const { docRef, refid } of transfersToUpdate) {
      try {
        await updateDoc(docRef, { refid: refid });
        updatedCount++;
        console.log(
          `✅ Updated driver transfer ${docRef.id} with refid: ${refid}`
        );
      } catch (error) {
        console.error(`❌ Error updating driver transfer ${docRef.id}:`, error);
      }
    }
    console.log(
      `✅ Migration completed: ${updatedCount} driver transfers updated with refid`
    );
    return updatedCount;
  } catch (error) {
    console.error("❌ Error in migration:", error);
    throw error;
  }
};

export const fetchCompaniesDriversTransfer = async () => {
  try {
    // console.log('\n🔄 ========================================');
    // console.log('📊 FETCHING COMPANIES-DRIVERS-TRANSFER DATA');
    // console.log('========================================');
    // console.log('Fetching data from companies-drivers-transfer collection...\n');

    const companiesDriversTransferRef = collection(
      db,
      "companies-drivers-transfer"
    );
    const q = query(
      companiesDriversTransferRef,
      orderBy("createdDate", "desc")
    );
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    const allTransferData: any[] = [];

    querySnapshot.forEach((doc) => {
      allTransferData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // console.log('✅ DATA FETCHED SUCCESSFULLY!');
    // console.log('========================================');
    // console.log(`📌 Total Documents Found: ${allTransferData.length}`);
    // console.log('========================================\n');

    // Get current user
    const currentUser = auth.currentUser;

    if (!currentUser) {
      // console.log('⚠️ No user is currently logged in. Returning all data.');
      return allTransferData;
    }

    const userEmail = currentUser.email;

    // console.log('ℹ️ CURRENT USER INFO:');
    // console.log('========================================');
    // console.log('Email:', userEmail);
    // console.log('UID:', currentUser.uid);
    // console.log('========================================\n');

    // if (allTransferData.length > 0) {
    //   console.log('📋 SAMPLE DOCUMENT STRUCTURE:');
    //   console.log('========================================');
    //   console.dir(allTransferData[0], { depth: null, colors: true });
    //   console.log('========================================\n');
    //
    //   console.log('📊 ALL DOCUMENTS - CREATED USER EMAILS:');
    //   console.log('========================================');
    //   console.table(allTransferData.map(doc => ({
    //     id: doc.id,
    //     'createdUser.email': doc.createdUser?.email || 'N/A',
    //     'createdUser.brandName': doc.createdUser?.brandName || 'N/A',
    //   })));
    //   console.log('========================================\n');
    // }

    // Filter transfers where createdUser.email matches current user's email
    const filteredTransfers = allTransferData.filter((transfer) => {
      const createdUserEmail = transfer.createdUser?.email;

      // Check if createdUser.email matches current user's email
      const emailMatch =
        createdUserEmail &&
        userEmail &&
        createdUserEmail.toLowerCase() === userEmail.toLowerCase();

      return emailMatch;
    });

    console.log("✅ FILTERED COMPANIES-DRIVERS-TRANSFER DATA:");
    console.log("========================================");
    console.log(
      `📌 Total Transfers for ${userEmail}:`,
      filteredTransfers.length
    );
    console.log("========================================\n");

    if (filteredTransfers.length === 0) {
      console.log("⚠️ NO MATCHING TRANSFERS FOUND!");
      console.log("========================================");
      console.log("Debugging Info:");
      console.log("- Looking for createdUser.email =", userEmail);
      console.log("\n📋 All createdUser.email values in collection:");
      const uniqueEmails = [
        ...new Set(
          allTransferData.map((t) => t.createdUser?.email).filter(Boolean)
        ),
      ];
      console.log(uniqueEmails);
      console.log("========================================\n");
    } else {
      console.log("📋 FILTERED TRANSFER DATA:");
      console.log("========================================");
      console.dir(filteredTransfers, { depth: null, colors: true });
      console.log("\n📊 FILTERED TABLE VIEW:");
      console.table(
        filteredTransfers.map((doc) => ({
          id: doc.id,
          "createdUser.email": doc.createdUser?.email,
          "createdUser.brandName": doc.createdUser?.brandName,
          "createdUser.balance": doc.createdUser?.balance,
        }))
      );
      console.log("========================================\n");
    }

    return filteredTransfers;
  } catch (error) {
    console.error("❌ Error fetching companies-drivers-transfer data:", error);
    throw error;
  }
};

/**
 * Fetch orders data from Firestore orders collection
 * Filtered by companyUid matching current user's UID or email
 * Enriched with driver data from companies-drivers collection
 * @returns Promise with filtered and enriched orders data
 */
export const fetchOrders = async () => {
  try {
    console.log("\n🔄 ========================================");
    console.log("📊 FETCHING ORDERS DATA");
    console.log("========================================");

    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    const allOrdersData: any[] = [];

    querySnapshot.forEach((doc) => {
      allOrdersData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log("✅ DATA FETCHED SUCCESSFULLY!");
    console.log(`📌 Total Documents Found: ${allOrdersData.length}`);

    // Get current user
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log("⚠️ No user is currently logged in. Returning all data.");
      return allOrdersData;
    }

    const userEmail = currentUser.email;
    const userId = currentUser.uid;

    console.log("ℹ️ CURRENT USER INFO:");
    console.log("Email:", userEmail);
    console.log("UID:", userId);

    // Filter orders where companyUid matches current user's UID or email
    const filteredOrders = allOrdersData.filter((order) => {
      const companyUid = order.companyUid;

      // Check if companyUid matches UID
      const uidMatch = companyUid && userId && companyUid === userId;

      // Check if companyUid matches email
      const emailMatch =
        companyUid &&
        userEmail &&
        companyUid.toLowerCase() === userEmail.toLowerCase();

      return uidMatch || emailMatch;
    });

    console.log("✅ FILTERED ORDERS DATA:");
    console.log(`📌 Total Orders for ${userEmail}:`, filteredOrders.length);

    if (filteredOrders.length > 0) {
      console.log("\n📋 Sample Filtered Order:");
      console.log("Address Check:");
      console.log("- city:", filteredOrders[0].city);
      console.log("- city.name:", filteredOrders[0].city?.name);
      console.log("- city.name.ar:", filteredOrders[0].city?.name?.ar);
      console.log("- city.name.en:", filteredOrders[0].city?.name?.en);
      console.log("- address field:", filteredOrders[0].address);
    }

    // Enrich orders with driver data
    const enrichedOrders = await Promise.all(
      filteredOrders.map(async (order) => {
        let driverPhone = "-";
        let driverName = "-";

        // Get driver email from assignedDriver
        const driverEmail = order.assignedDriver?.email;

        if (driverEmail) {
          try {
            // Fetch driver data from companies-drivers by email
            const driversRef = collection(db, "companies-drivers");
            const driverQuery = query(
              driversRef,
              where("email", "==", driverEmail)
            );
            const driverSnapshot = await getDocs(driverQuery);

            if (!driverSnapshot.empty) {
              const driverData = driverSnapshot.docs[0].data();
              driverPhone = driverData.phoneNumber || driverData.phone || "-";
              driverName = driverData.name || "-";
            }
          } catch (err) {
            console.error(
              "Error fetching driver data for order:",
              order.id,
              err
            );
          }
        }

        return {
          ...order,
          enrichedDriverPhone: driverPhone,
          enrichedDriverName: driverName,
        };
      })
    );

    // console.log('✅ ENRICHED ORDERS DATA:');
    // console.log('📊 Total enriched orders:', enrichedOrders.length);

    return enrichedOrders;
  } catch (error) {
    console.error("❌ Error fetching orders data:", error);
    throw error;
  }
};
/**
 * Fetch orders data for a specific company from Firestore orders collection
 * Filtered by companyUid matching the provided company ID or email
 * Enriched with driver data from companies-drivers collection
 * @param companyId - The company ID or email to filter orders by
 * @returns Promise with filtered and enriched orders data for the specific company
 */
export const fetchOrdersForCompany = async (companyId: string) => {
  try {
    console.log("\n🔄 ========================================");
    console.log("📊 FETCHING ORDERS DATA FOR COMPANY:", companyId);
    console.log("========================================");

    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    const allOrdersData: any[] = [];

    querySnapshot.forEach((doc) => {
      allOrdersData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log("✅ DATA FETCHED SUCCESSFULLY!");
    console.log(`📌 Total Documents Found: ${allOrdersData.length}`);

    // Filter orders where companyUid matches the provided company ID or email
    const filteredOrders = allOrdersData.filter((order) => {
      const companyUid = order.companyUid;

      // Check if companyUid matches the provided company ID
      const idMatch = companyUid && companyId && companyUid === companyId;

      // Check if companyUid matches the provided company email
      const emailMatch =
        companyUid &&
        companyId &&
        companyUid.toLowerCase() === companyId.toLowerCase();

      return idMatch || emailMatch;
    });

    console.log("✅ FILTERED ORDERS DATA:");
    console.log(
      `📌 Total Orders for Company ${companyId}:`,
      filteredOrders.length
    );

    if (filteredOrders.length > 0) {
      console.log("\n📋 Sample Filtered Order:");
      console.log("Address Check:");
      console.log("- city:", filteredOrders[0].city);
      console.log("- city.name:", filteredOrders[0].city?.name);
      console.log("- city.name.ar:", filteredOrders[0].city?.name?.ar);
      console.log("- city.name.en:", filteredOrders[0].city?.name?.en);
      console.log("- address field:", filteredOrders[0].address);
    }

    // Enrich orders with driver data
    const enrichedOrders = await Promise.all(
      filteredOrders.map(async (order) => {
        let driverPhone = "-";
        let driverName = "-";

        // Get driver email from assignedDriver
        const driverEmail = order.assignedDriver?.email;

        if (driverEmail) {
          try {
            // Fetch driver data from companies-drivers by email
            const driversRef = collection(db, "companies-drivers");
            const driverQuery = query(
              driversRef,
              where("email", "==", driverEmail)
            );
            const driverSnapshot = await getDocs(driverQuery);

            if (!driverSnapshot.empty) {
              const driverData = driverSnapshot.docs[0].data();
              driverPhone = driverData.phoneNumber || driverData.phone || "-";
              driverName = driverData.name || "-";
            }
          } catch (err) {
            console.error(
              "Error fetching driver data for order:",
              order.id,
              err
            );
          }
        }

        return {
          ...order,
          enrichedDriverName: driverName,
          enrichedDriverPhone: driverPhone,
        };
      })
    );

    console.log("✅ ENRICHED ORDERS DATA:");
    console.log(`📌 Total Enriched Orders: ${enrichedOrders.length}`);

    return enrichedOrders;
  } catch (error) {
    console.error("❌ Error fetching orders data for company:", error);
    throw error;
  }
};

/**
 * Fetch orders data for a specific client from Firestore orders collection
 * Filtered by clientId or clientEmail matching the provided client identifier
 * @param clientId - The client ID or email to filter orders by
 * @returns Promise with filtered and enriched orders data for the specific client
 */
export const fetchOrdersForClient = async (clientId: string) => {
  try {
    console.log("\n🔄 ========================================");
    console.log("FETCHING ORDERS FOR CLIENT:", clientId);
    console.log("========================================");

    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    console.log(`📊 Orders query snapshot size: ${querySnapshot.size}`);
    console.log(`📊 Orders query snapshot empty: ${querySnapshot.empty}`);

    const allOrdersData: any[] = [];

    querySnapshot.forEach((doc) => {
      const orderData: any = {
        id: doc.id,
        ...doc.data(),
      };
      allOrdersData.push(orderData);

      // Log first few orders for debugging
      if (allOrdersData.length <= 3) {
        console.log(`\n📦 Order ${allOrdersData.length}:`);
        console.log(`  - ID: ${orderData.id}`);
        console.log(`  - ClientId: ${orderData.clientId || "N/A"}`);
        console.log(`  - ClientEmail: ${orderData.clientEmail || "N/A"}`);
        console.log(`  - CompanyUid: ${orderData.companyUid || "N/A"}`);
        console.log(`  - TotalPrice: ${orderData.totalPrice || "N/A"}`);
        console.log(`  - OrderDate: ${orderData.orderDate || "N/A"}`);
      }
    });

    console.log("✅ ORDERS DATA FETCHED SUCCESSFULLY!");
    console.log(`📌 Total Orders Found: ${allOrdersData.length}`);

    // Filter orders where client.email matches the provided client email
    const filteredOrders = allOrdersData.filter((order) => {
      const orderClientEmail = order.client?.email || order.clientEmail;
      const orderClientId = order.clientId;
      const orderCompanyUid = order.companyUid;

      // Primary filter: Check if client.email matches the provided clientId (which should be email)
      const emailMatch =
        orderClientEmail && clientId && orderClientEmail === clientId;

      // Fallback filters for other possible identifiers
      const idMatch = orderClientId && clientId && orderClientId === clientId;
      const uidMatch =
        orderCompanyUid && clientId && orderCompanyUid === clientId;

      const matches = emailMatch || idMatch || uidMatch;

      if (matches) {
        console.log(`\n✅ MATCHING ORDER FOUND:`);
        console.log(`  - Order ID: ${order.id}`);
        console.log(`  - Client Email: ${orderClientEmail}`);
        console.log(`  - ClientId: ${orderClientId}`);
        console.log(`  - CompanyUid: ${orderCompanyUid}`);
        console.log(`  - TotalPrice: ${order.totalPrice}`);
        console.log(
          `  - Match Type: ${emailMatch ? "EMAIL" : idMatch ? "ID" : "UID"}`
        );
      }

      return matches;
    });

    console.log(
      `\n📌 FILTERED ORDERS FOR CLIENT ${clientId}: ${filteredOrders.length}`
    );

    if (filteredOrders.length === 0) {
      console.log("⚠️ WARNING: No orders found for this client!");
      console.log("🔍 Available client identifiers in orders:");

      // Check different possible email field locations
      const uniqueClientEmailsFromClient = [
        ...new Set(allOrdersData.map((o) => o.client?.email).filter(Boolean)),
      ];
      const uniqueClientEmailsDirect = [
        ...new Set(allOrdersData.map((o) => o.clientEmail).filter(Boolean)),
      ];
      const uniqueClientIds = [
        ...new Set(allOrdersData.map((o) => o.clientId).filter(Boolean)),
      ];
      const uniqueCompanyUids = [
        ...new Set(allOrdersData.map((o) => o.companyUid).filter(Boolean)),
      ];

      console.log(
        "  - Client Emails (client.email):",
        uniqueClientEmailsFromClient.slice(0, 5)
      );
      console.log(
        "  - Client Emails (clientEmail):",
        uniqueClientEmailsDirect.slice(0, 5)
      );
      console.log("  - ClientIds:", uniqueClientIds.slice(0, 5));
      console.log("  - CompanyUids:", uniqueCompanyUids.slice(0, 5));
      console.log(`  - Searching for: "${clientId}"`);
    }

    // Enrich orders with driver data
    const enrichedOrders = await Promise.all(
      filteredOrders.map(async (order) => {
        let driverPhone = "-";
        let driverName = "-";

        // Get driver email from assignedDriver
        const driverEmail = order.assignedDriver?.email;

        if (driverEmail) {
          try {
            // Query companies-drivers collection for driver info
            const driversRef = collection(db, "companies-drivers");
            const driverQuery = query(
              driversRef,
              where("email", "==", driverEmail)
            );
            const driverSnapshot = await getDocs(driverQuery);

            if (!driverSnapshot.empty) {
              const driverDoc = driverSnapshot.docs[0];
              const driverData = driverDoc.data();
              driverName = driverData.name || "-";
              driverPhone = driverData.phone || "-";
            }
          } catch (driverError) {
            console.warn("⚠️ Error fetching driver data:", driverError);
          }
        }

        return {
          ...order,
          driverName,
          driverPhone,
        };
      })
    );

    console.log(`📌 Total Enriched Orders: ${enrichedOrders.length}`);

    return enrichedOrders;
  } catch (error) {
    console.error("❌ Error fetching orders data for client:", error);
    throw error;
  }
};

/**
 * Create a new delivery order in Firestore
 * @param orderData - Order form data
 * @returns Promise with the created order document
 */
export const createDeliveryOrder = async (orderData: {
  location?: string | null;
  recipientName?: string | null;
  phone?: string | null;
  fuelType: string;
  quantity: number;
  fuelCost: number;
  deliveryFees: number;
  totalCost: number;
}) => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("No user is currently logged in");
    }

    // Prepare the order document - save exactly as submitted, even if null
    const orderDocument = {
      // Form fields - save as-is, even if null
      location: orderData.location || null,
      recipientName: orderData.recipientName || null,
      phone: orderData.phone || null,

      // Fuel details
      fuelType: orderData.fuelType,
      totalLitre: orderData.quantity,

      // Selected option - maps to product/fuel type
      selectedOption: {
        name: {
          ar: orderData.fuelType,
          en:
            orderData.fuelType === "بنزين 91"
              ? "Gasoline 91"
              : orderData.fuelType === "بنزين 95"
              ? "Gasoline 95"
              : orderData.fuelType === "ديزل"
              ? "Diesel"
              : orderData.fuelType,
        },
      },

      // Service type - identifies this as a Fuel Delivery order
      service: {
        title: {
          ar: "توصيل الوقود",
          en: "Fuel Delivery",
        },
        desc: {
          ar: "عند الطلب وفي أي وقت وفي أي مكان",
          en: "On-demand, anytime anywhere.",
        },
      },

      // Costs
      fuelCost: orderData.fuelCost,
      deliveryFees: orderData.deliveryFees,
      totalPrice: orderData.totalCost,

      // Status - always "in progress" for new orders
      status: "in progress",

      // Company info
      companyUid: currentUser.uid,
      createdUserId: currentUser.uid,

      // Timestamps
      orderDate: serverTimestamp(),
      createdDate: serverTimestamp(),

      // Reference ID
      refId: Date.now().toString(),
    };

    // Add to Firestore
    const ordersRef = collection(db, "orders");
    const docRef = await addDoc(ordersRef, orderDocument);

    return {
      id: docRef.id,
      ...orderDocument,
    };
  } catch (error) {
    console.error("Error creating delivery order:", error);
    throw error;
  }
};

/**
 * Calculate fuel statistics from orders
 * Groups orders by fuel type and calculates total litres and cost
 */
export const calculateFuelStatistics = (
  orders: any[]
): {
  fuelTypes: Array<{
    type: string;
    totalLitres: number;
    totalCost: number;
    color: string;
  }>;
  totalLitres: number;
  totalCost: number;
} => {
  // Initialize the three fuel types with zero values
  const fuelTypeMap = new Map<
    string,
    { totalLitres: number; totalCost: number }
  >([
    ["ديزل", { totalLitres: 0, totalCost: 0 }],
    ["بنزين 91", { totalLitres: 0, totalCost: 0 }],
    ["بنزين 95", { totalLitres: 0, totalCost: 0 }],
  ]);

  // Color mapping for fuel types
  const colorMap: { [key: string]: string } = {
    ديزل: "text-color-mode-text-icons-t-orange",
    "بنزين 91": "text-color-mode-text-icons-t-green",
    "بنزين 95": "text-color-mode-text-icons-t-red",
  };

  orders.forEach((order) => {
    // Extract fuel type with multiple fallbacks
    let fuelType = "";

    if (order.selectedOption?.name?.ar) {
      fuelType = order.selectedOption.name.ar;
    } else if (order.selectedOption?.name?.en) {
      fuelType = order.selectedOption.name.en;
    } else if (order.selectedOption?.label) {
      fuelType = order.selectedOption.label;
    } else if (order.selectedOption?.title?.ar) {
      fuelType = order.selectedOption.title.ar;
    } else if (order.selectedOption?.title?.en) {
      fuelType = order.selectedOption.title.en;
    } else if (order.service?.title?.ar) {
      fuelType = order.service.title.ar;
    } else if (order.service?.title?.en) {
      fuelType = order.service.title.en;
    }

    // Extract litres and cost
    const litres = order.totalLitre || 0;
    const cost = order.totalPrice || 0;

    // Map fuel type to one of our three categories
    let mappedFuelType = "";
    if (
      fuelType.includes("ديزل") ||
      fuelType.includes("Diesel") ||
      fuelType.includes("ديزل")
    ) {
      mappedFuelType = "ديزل";
    } else if (fuelType.includes("91") || fuelType.includes("91")) {
      mappedFuelType = "بنزين 91";
    } else if (fuelType.includes("95") || fuelType.includes("95")) {
      mappedFuelType = "بنزين 95";
    }

    // Add to the mapped fuel type
    if (mappedFuelType && fuelTypeMap.has(mappedFuelType)) {
      const current = fuelTypeMap.get(mappedFuelType)!;
      current.totalLitres += litres;
      current.totalCost += cost;
    }
  });

  // Convert map to array - always show all three types
  const fuelTypes = [
    {
      type: "ديزل",
      totalLitres: fuelTypeMap.get("ديزل")?.totalLitres || 0,
      totalCost: fuelTypeMap.get("ديزل")?.totalCost || 0,
      color: colorMap["ديزل"],
    },
    {
      type: "بنزين 91",
      totalLitres: fuelTypeMap.get("بنزين 91")?.totalLitres || 0,
      totalCost: fuelTypeMap.get("بنزين 91")?.totalCost || 0,
      color: colorMap["بنزين 91"],
    },
    {
      type: "بنزين 95",
      totalLitres: fuelTypeMap.get("بنزين 95")?.totalLitres || 0,
      totalCost: fuelTypeMap.get("بنزين 95")?.totalCost || 0,
      color: colorMap["بنزين 95"],
    },
  ];

  // Calculate overall totals
  const totalLitres = fuelTypes.reduce(
    (sum, fuel) => sum + fuel.totalLitres,
    0
  );
  const totalCost = fuelTypes.reduce((sum, fuel) => sum + fuel.totalCost, 0);

  return { fuelTypes, totalLitres, totalCost };
};

/**
 * Fetch the currently authenticated service distributer (stationscompany) raw document
 * Matches by auth uid or email. Returns full document data as stored in Firestore.
 */
export const fetchCurrentStationsCompany = async (): Promise<any | null> => {
  try {
    const currentUser = await waitForAuthState();
    if (!currentUser) return null;

    const userUid = currentUser.uid;
    const userEmail = currentUser.email?.toLowerCase() || "";

    // Try match by uId first
    let qRef = query(
      collection(db, "stationscompany"),
      where("uId", "==", userUid)
    );
    let snapshot = await getDocs(qRef);

    // Fallback: match by email
    if (snapshot.empty && userEmail) {
      qRef = query(
        collection(db, "stationscompany"),
        where("email", "==", userEmail)
      );
      snapshot = await getDocs(qRef);
    }

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("❌ Error fetching current stations company:", error);
    throw error;
  }
};

/**
 * Interface for commission document in Firestore
 */
export interface CommissionDocument {
  orderId: string;
  orderRefId: string;
  orderDate: any;
  carStation: any;
  stationsCompanyEmail: string;
  totalPrice: number;
  totalLitre: number;
  fuelType: string;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  createdAt: any;
  updatedAt: any;
}

/**
 * Calculate commission for a single order
 * @param order - The order object
 * @param commissionSettings - Commission settings (petrol and diesel rates)
 * @returns Object with commission, rateUsed, and netAmount
 */
export const calculateOrderCommission = (
  order: any,
  commissionSettings: CommissionSettings
): { commission: number; rateUsed: number; netAmount: number } => {
  // Extract fuel type (using same logic as fetchOperationsData)
  const extractFuelType = (order: any): string => {
    if (order.selectedOption?.name?.ar) return order.selectedOption.name.ar;
    if (order.selectedOption?.name?.en) return order.selectedOption.name.en;
    if (order.selectedOption?.title?.ar) return order.selectedOption.title.ar;
    if (order.selectedOption?.title?.en) return order.selectedOption.title.en;
    if (order.service?.options && Array.isArray(order.service.options)) {
      const selectedOptionId =
        order.selectedOption?.id || order.selectedOption?.refId;
      const matchingOption = order.service.options.find(
        (opt: any) =>
          opt.id === selectedOptionId || opt.refId === selectedOptionId
      );
      if (matchingOption?.name?.ar) return matchingOption.name.ar;
      if (matchingOption?.name?.en) return matchingOption.name.en;
      if (matchingOption?.title?.ar) return matchingOption.title.ar;
      if (matchingOption?.title?.en) return matchingOption.title.en;
    }
    if (order.service?.title?.ar) return order.service.title.ar;
    if (order.service?.title?.en) return order.service.title.en;
    return "غير محدد";
  };

  const fuelType = extractFuelType(order);
  const totalLitre =
    typeof order.totalLitre === "string"
      ? parseFloat(order.totalLitre)
      : order.totalLitre || 0;
  const totalPrice =
    typeof order.totalPrice === "string"
      ? parseFloat(order.totalPrice)
      : order.totalPrice || 0;

  // Determine if diesel
  const isDiesel = (fuelType: string): boolean => {
    const normalized = fuelType.toLowerCase().trim();
    return (
      normalized.includes("ديزل") ||
      normalized.includes("ديزيل") ||
      normalized.includes("diesel")
    );
  };

  // Use stored commission rate if available, otherwise use current settings
  const storedCommissionRate = order.commissionRateUsed;
  const commissionRate =
    storedCommissionRate !== undefined && storedCommissionRate !== null
      ? storedCommissionRate
      : isDiesel(fuelType)
      ? commissionSettings.diesel
      : commissionSettings.petrol;

  // Calculate commission
  const liters = isNaN(totalLitre) || totalLitre <= 0 ? 0 : totalLitre;
  const commission = liters * commissionRate;
  const netAmount = totalPrice - commission;

  return {
    commission: commission,
    rateUsed: commissionRate,
    netAmount: netAmount,
  };
};

/**
 * Save commission to Firestore commissions collection
 * @param order - The order object
 * @param commissionData - Commission calculation results
 * @returns Promise with the commission document ID
 */
export const saveCommissionToCollection = async (
  order: any,
  commissionData: { commission: number; rateUsed: number; netAmount: number }
): Promise<string> => {
  try {
    if (!order || !order.id) {
      throw new Error("Invalid order: missing order ID");
    }

    const orderId = order.id;
    const stationsCompanyEmail = order.carStation?.createdUserId || "";

    // Extract fuel type
    const extractFuelType = (order: any): string => {
      if (order.selectedOption?.name?.ar) return order.selectedOption.name.ar;
      if (order.selectedOption?.name?.en) return order.selectedOption.name.en;
      if (order.selectedOption?.title?.ar) return order.selectedOption.title.ar;
      if (order.selectedOption?.title?.en) return order.selectedOption.title.en;
      if (order.service?.options && Array.isArray(order.service.options)) {
        const selectedOptionId =
          order.selectedOption?.id || order.selectedOption?.refId;
        const matchingOption = order.service.options.find(
          (opt: any) =>
            opt.id === selectedOptionId || opt.refId === selectedOptionId
        );
        if (matchingOption?.name?.ar) return matchingOption.name.ar;
        if (matchingOption?.name?.en) return matchingOption.name.en;
        if (matchingOption?.title?.ar) return matchingOption.title.ar;
        if (matchingOption?.title?.en) return matchingOption.title.en;
      }
      if (order.service?.title?.ar) return order.service.title.ar;
      if (order.service?.title?.en) return order.service.title.en;
      return "غير محدد";
    };

    const fuelType = extractFuelType(order);
    const totalLitre =
      typeof order.totalLitre === "string"
        ? parseFloat(order.totalLitre)
        : order.totalLitre || 0;
    const totalPrice =
      typeof order.totalPrice === "string"
        ? parseFloat(order.totalPrice)
        : order.totalPrice || 0;

    // Check if commission document already exists for this order
    const commissionsRef = collection(db, "commissions");
    const q = query(commissionsRef, where("orderId", "==", orderId));
    const querySnapshot = await getDocs(q);

    const commissionDocData: CommissionDocument = {
      orderId: orderId,
      orderRefId: order.refId || order.refDocId || orderId,
      orderDate: order.orderDate || order.createdDate || serverTimestamp(),
      carStation: order.carStation || {},
      stationsCompanyEmail: stationsCompanyEmail,
      totalPrice: totalPrice,
      totalLitre: totalLitre,
      fuelType: fuelType,
      commissionRate: commissionData.rateUsed,
      commissionAmount: commissionData.commission,
      netAmount: commissionData.netAmount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (!querySnapshot.empty) {
      // Update existing commission document
      const existingDoc = querySnapshot.docs[0];
      const docRef = doc(db, "commissions", existingDoc.id);
      await updateDoc(docRef, {
        ...commissionDocData,
        createdAt: existingDoc.data().createdAt, // Keep original createdAt
        updatedAt: serverTimestamp(),
      });
      console.log(`✅ Updated commission document for order ${orderId}`);
      return existingDoc.id;
    } else {
      // Create new commission document
      const docRef = await addDoc(commissionsRef, commissionDocData);
      console.log(
        `✅ Created commission document for order ${orderId}: ${docRef.id}`
      );
      return docRef.id;
    }
  } catch (error) {
    console.error(`❌ Error saving commission for order ${order?.id}:`, error);
    throw error;
  }
};

/**
 * Process commission for a single order
 * Calculates commission, saves to commissions collection, and updates balance
 * @param orderId - The order ID
 * @param orderData - The order data (optional, will fetch if not provided)
 * @returns Promise<void>
 */
export const processOrderCommission = async (
  orderId: string,
  orderData?: any
): Promise<void> => {
  try {
    console.log(`🔄 Processing commission for order: ${orderId}`);

    // Fetch order if not provided
    let order = orderData;
    if (!order) {
      const orderRef = doc(db, "stationscompany-orders", orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) {
        throw new Error(`Order ${orderId} not found`);
      }
      order = { id: orderSnap.id, ...orderSnap.data() };
    }

    const stationsCompanyEmail = order.carStation?.createdUserId;
    if (!stationsCompanyEmail) {
      console.warn(
        `⚠️ Order ${orderId} has no carStation.createdUserId, skipping commission processing`
      );
      return;
    }

    // Fetch commission settings
    const commissionSettings = await fetchCommissionSettings();

    // Calculate commission
    const commissionData = calculateOrderCommission(order, commissionSettings);

    // Save to commissions collection
    await saveCommissionToCollection(order, commissionData);

    // Update stationscompany balance
    await updateStationsCompanyBalance(stationsCompanyEmail);

    console.log(`✅ Processed commission for order ${orderId}`);
  } catch (error) {
    console.error(
      `❌ Error processing commission for order ${orderId}:`,
      error
    );
    throw error;
  }
};

/**
 * Process commissions for all orders (or orders for a specific company)
 * @param companyEmail - Optional: process only orders for this company
 * @returns Promise<void>
 */
export const processAllOrdersCommissions = async (
  companyEmail?: string
): Promise<void> => {
  try {
    console.log(
      companyEmail
        ? `🔄 Processing commissions for company: ${companyEmail}`
        : "🔄 Processing commissions for all orders..."
    );

    // Fetch all orders
    const ordersRef = collection(db, "stationscompany-orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot = await getDocs(q);

    const allOrders: any[] = [];
    querySnapshot.forEach((doc) => {
      allOrders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`📋 Total orders found: ${allOrders.length}`);

    // Filter by company if specified
    let ordersToProcess = allOrders;
    if (companyEmail) {
      ordersToProcess = allOrders.filter((order) => {
        const carStationCreatedUserId = order.carStation?.createdUserId;
        return (
          carStationCreatedUserId &&
          carStationCreatedUserId.toLowerCase() === companyEmail.toLowerCase()
        );
      });
      console.log(
        `✅ Filtered orders for company ${companyEmail}: ${ordersToProcess.length}`
      );
    }

    // Fetch commission settings once
    const commissionSettings = await fetchCommissionSettings();

    // Check which orders already have commission documents
    const commissionsRef = collection(db, "commissions");
    const allCommissionsSnapshot = await getDocs(commissionsRef);
    const existingOrderIds = new Set<string>();
    allCommissionsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.orderId) {
        existingOrderIds.add(data.orderId);
      }
    });

    console.log(
      `📊 Found ${existingOrderIds.size} existing commission documents`
    );

    // Process orders that don't have commission documents yet
    const ordersToProcessList = ordersToProcess.filter(
      (order) => !existingOrderIds.has(order.id)
    );

    console.log(
      `🔄 Processing ${ordersToProcessList.length} orders without commission documents...`
    );

    // Process in batches to avoid overwhelming Firestore
    const batchSize = 50;
    const companiesToUpdate = new Set<string>();

    for (let i = 0; i < ordersToProcessList.length; i += batchSize) {
      const batch = ordersToProcessList.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (order) => {
          try {
            const commissionData = calculateOrderCommission(
              order,
              commissionSettings
            );
            await saveCommissionToCollection(order, commissionData);

            const companyEmail = order.carStation?.createdUserId;
            if (companyEmail) {
              companiesToUpdate.add(companyEmail);
            }
          } catch (error) {
            console.error(
              `❌ Error processing commission for order ${order.id}:`,
              error
            );
            // Continue with other orders
          }
        })
      );

      console.log(
        `✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          ordersToProcessList.length / batchSize
        )}`
      );
    }

    // Update balances for all affected companies
    // Note: We calculate balance directly here instead of calling updateStationsCompanyBalance
    // to avoid redundant commission processing (updateStationsCompanyBalance also processes commissions)
    console.log(
      `🔄 Updating balances for ${companiesToUpdate.size} companies...`
    );
    await Promise.all(
      Array.from(companiesToUpdate).map(async (email) => {
        try {
          // Calculate balance (commissions are already processed above)
          const balance = await calculateStationsCompanyBalance(email);

          // Find and update stationscompany document
          const qRef = query(
            collection(db, "stationscompany"),
            where("email", "==", email.toLowerCase())
          );
          const snapshot = await getDocs(qRef);

          if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            const docRef = doc(db, "stationscompany", docSnap.id);
            await updateDoc(docRef, {
              balance: balance,
            });
            console.log(
              `✅ Updated balance for ${email}: ${balance.toFixed(2)}`
            );
          }
        } catch (error) {
          console.error(
            `❌ Error updating balance for company ${email}:`,
            error
          );
        }
      })
    );

    console.log("✅ Finished processing all orders commissions");
  } catch (error) {
    console.error("❌ Error processing all orders commissions:", error);
    throw error;
  }
};

/**
 * Initialize commissions for all existing orders
 * Can be called once to backfill commission data
 * @returns Promise<void>
 */
export const initializeCommissionsForAllOrders = async (): Promise<void> => {
  try {
    console.log("🔄 Initializing commissions for all existing orders...");
    await processAllOrdersCommissions();
    console.log("✅ Finished initializing commissions for all orders");
  } catch (error) {
    console.error("❌ Error initializing commissions:", error);
    throw error;
  }
};

/**
 * Get the last day of the previous month as a Date object
 * Returns a date set to 23:59:59.999 of the last day of last month
 * @returns Date object representing the end of last month
 */
export const getLastMonthEndDate = (): Date => {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
  lastMonth.setHours(23, 59, 59, 999); // Set to end of day
  return lastMonth;
};

/**
 * Calculate stationscompany balance up to a specific date (after commission deduction)
 * Fetches orders from stationscompany-orders where carStation.createdUserId matches companyEmail
 * and orderDate <= endDate
 * Sums all netAmount values (totalPrice - commission) from filtered orders
 * @param companyEmail - The stationscompany email to calculate balance for
 * @param endDate - The cutoff date (orders up to and including this date)
 * @returns Promise with the total balance (sum of all order netAmounts after commission)
 */
export const calculateStationsCompanyBalanceUpToDate = async (
  companyEmail: string,
  endDate: Date
): Promise<number> => {
  try {
    console.log(
      `💰 Calculating balance up to ${endDate.toISOString()} for stationscompany: ${companyEmail}`
    );

    if (!companyEmail) {
      console.warn("⚠️ No company email provided, returning 0");
      return 0;
    }

    // Fetch all orders from stationscompany-orders collection
    const ordersRef = collection(db, "stationscompany-orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot = await getDocs(q);

    const allOrders: any[] = [];
    querySnapshot.forEach((doc) => {
      allOrders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`📋 Total orders found: ${allOrders.length}`);

    // Filter orders where carStation.createdUserId matches company email
    // and orderDate <= endDate
    const filteredOrders = allOrders.filter((order) => {
      const carStationCreatedUserId = order.carStation?.createdUserId;

      const match =
        carStationCreatedUserId &&
        carStationCreatedUserId.toLowerCase() === companyEmail.toLowerCase();

      if (!match) return false;

      // Check if order date is before or equal to endDate
      const orderDate = order.orderDate || order.createdDate;
      if (!orderDate) return false;

      let orderDateObj: Date;
      if (orderDate.toDate) {
        orderDateObj = orderDate.toDate();
      } else if (orderDate instanceof Date) {
        orderDateObj = orderDate;
      } else {
        orderDateObj = new Date(orderDate);
      }

      return orderDateObj <= endDate;
    });

    console.log(
      `✅ Filtered orders for company ${companyEmail} up to ${endDate.toISOString()}: ${
        filteredOrders.length
      }`
    );

    // Fetch commission settings
    const commissionSettings = await fetchCommissionSettings();

    // Calculate balance by summing net amounts (totalPrice - commission)
    let totalBalance = 0;
    for (const order of filteredOrders) {
      const commissionData = calculateOrderCommission(
        order,
        commissionSettings
      );
      totalBalance += commissionData.netAmount;
    }

    console.log(
      `💰 Calculated balance for ${companyEmail} up to ${endDate.toISOString()}: ${totalBalance.toFixed(
        2
      )} (after commission deduction)`
    );

    return totalBalance;
  } catch (error) {
    console.error(
      `❌ Error calculating balance up to date for stationscompany ${companyEmail}:`,
      error
    );
    throw error;
  }
};

/**
 * Calculate balance change percentage compared to last month
 * @param companyEmail - The stationscompany email to calculate balance change for
 * @returns Promise with current balance, last month balance, percentage change, and whether it's an increase
 */
export const calculateStationsCompanyBalanceChange = async (
  companyEmail: string
): Promise<{
  currentBalance: number;
  lastMonthBalance: number;
  percentageChange: number;
  isIncrease: boolean;
}> => {
  try {
    console.log(
      `📊 Calculating balance change for stationscompany: ${companyEmail}`
    );

    if (!companyEmail) {
      throw new Error("No company email provided");
    }

    // Get last month's end date
    const lastMonthEndDate = getLastMonthEndDate();

    // Calculate current balance and last month balance in parallel
    const [currentBalance, lastMonthBalance] = await Promise.all([
      calculateStationsCompanyBalance(companyEmail),
      calculateStationsCompanyBalanceUpToDate(companyEmail, lastMonthEndDate),
    ]);

    // Calculate percentage change
    let percentageChange = 0;
    let isIncrease = false;

    if (lastMonthBalance > 0) {
      percentageChange =
        ((currentBalance - lastMonthBalance) / lastMonthBalance) * 100;
      isIncrease = percentageChange > 0;
    } else if (currentBalance > 0) {
      // If last month balance is 0 but current is positive, it's a 100% increase
      percentageChange = 100;
      isIncrease = true;
    } else {
      // Both are 0, no change
      percentageChange = 0;
      isIncrease = false;
    }

    console.log(
      `📊 Balance change for ${companyEmail}: Current: ${currentBalance.toFixed(
        2
      )}, Last Month: ${lastMonthBalance.toFixed(
        2
      )}, Change: ${percentageChange.toFixed(2)}%`
    );

    // Calculate absolute difference
    const absoluteDifference = currentBalance - lastMonthBalance;

    return {
      currentBalance,
      lastMonthBalance,
      percentageChange,
      absoluteDifference,
      isIncrease,
    };
  } catch (error) {
    console.error(
      `❌ Error calculating balance change for stationscompany ${companyEmail}:`,
      error
    );
    throw error;
  }
};

/**
 * Calculate stationscompany balance by summing all order totals (after commission deduction)
 * Fetches all orders from stationscompany-orders where carStation.createdUserId matches companyEmail
 * Sums all netAmount values (totalPrice - commission) from filtered orders
 * @param companyEmail - The stationscompany email to calculate balance for
 * @returns Promise with the total balance (sum of all order netAmounts after commission)
 */
export const calculateStationsCompanyBalance = async (
  companyEmail: string
): Promise<number> => {
  try {
    console.log(`💰 Calculating balance for stationscompany: ${companyEmail}`);

    if (!companyEmail) {
      console.warn("⚠️ No company email provided, returning 0");
      return 0;
    }

    // Fetch all orders from stationscompany-orders collection
    const ordersRef = collection(db, "stationscompany-orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot = await getDocs(q);

    const allOrders: any[] = [];
    querySnapshot.forEach((doc) => {
      allOrders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`📋 Total orders found: ${allOrders.length}`);

    // Filter orders where carStation.createdUserId matches company email
    const filteredOrders = allOrders.filter((order) => {
      const carStationCreatedUserId = order.carStation?.createdUserId;

      const match =
        carStationCreatedUserId &&
        carStationCreatedUserId.toLowerCase() === companyEmail.toLowerCase();

      return match;
    });

    console.log(
      `✅ Filtered orders for company ${companyEmail}: ${filteredOrders.length}`
    );

    // Fetch commission settings
    const commissionSettings = await fetchCommissionSettings();

    // Calculate balance by summing net amounts (totalPrice - commission)
    let totalBalance = 0;
    for (const order of filteredOrders) {
      const commissionData = calculateOrderCommission(
        order,
        commissionSettings
      );
      totalBalance += commissionData.netAmount;
    }

    console.log(
      `💰 Calculated balance for ${companyEmail}: ${totalBalance.toFixed(
        2
      )} (after commission deduction)`
    );

    return totalBalance;
  } catch (error) {
    console.error(
      `❌ Error calculating balance for stationscompany ${companyEmail}:`,
      error
    );
    throw error;
  }
};

/**
 * Calculate total commissions for a stationscompany
 * Sums all commissionAmount values from commissions collection for the given company
 * @param companyEmail - The stationscompany email to calculate commissions for
 * @returns Promise with the total commission amount
 */
export const calculateStationsCompanyTotalCommissions = async (
  companyEmail: string
): Promise<number> => {
  try {
    console.log(
      `💰 Calculating total commissions for stationscompany: ${companyEmail}`
    );

    if (!companyEmail) {
      console.warn("⚠️ No company email provided, returning 0");
      return 0;
    }

    // Fetch all commission documents for this company
    const commissionsRef = collection(db, "commissions");
    const q = query(
      commissionsRef,
      where("stationsCompanyEmail", "==", companyEmail.toLowerCase())
    );
    const querySnapshot = await getDocs(q);

    let totalCommissions = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const commissionAmount = data.commissionAmount || 0;
      totalCommissions += commissionAmount;
    });

    console.log(
      `💰 Calculated total commissions for ${companyEmail}: ${totalCommissions.toFixed(
        2
      )}`
    );

    return totalCommissions;
  } catch (error) {
    console.error(
      `❌ Error calculating total commissions for stationscompany ${companyEmail}:`,
      error
    );
    throw error;
  }
};

/**
 * Interface for service distributer transfer request
 */
export interface ServiceDistributerTransferRequest {
  id: string;
  transferNumber: string;
  stationsCompanyEmail: string;
  stationsCompanyId?: string;
  transferAmount: number;
  status: "pending" | "transferred";
  createdAt: any;
  transferredAt?: any;
  processedBy?: {
    uid: string;
    email: string;
    name: string;
  };
  bankAccountDetails?: any;
}

/**
 * Generate unique transfer number
 * Format: TRF-YYYYMMDD-XXXX (where XXXX is random 4-digit number)
 * @returns string
 */
const generateTransferNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `TRF-${year}${month}${day}-${random}`;
};

/**
 * Check if balance >= 3000 and create transfer request if needed
 * Only creates if no pending transfer already exists
 * @param companyEmail - The stationscompany email
 * @returns Promise with transfer request ID or null if not created
 */
export const checkAndCreateTransferRequest = async (
  companyEmail: string
): Promise<string | null> => {
  try {
    console.log(
      `🔄 Checking transfer request eligibility for: ${companyEmail}`
    );

    if (!companyEmail) {
      console.warn("⚠️ No company email provided");
      return null;
    }

    // Fetch current balance
    const currentBalance = await calculateStationsCompanyBalance(companyEmail);

    console.log(`💰 Current balance: ${currentBalance.toFixed(2)}`);

    // Check if balance >= 3000
    if (currentBalance < 3000) {
      console.log("⚠️ Balance is less than 3000, no transfer request needed");
      return null;
    }

    // Check if there's already a pending transfer request
    const transfersRef = collection(db, "service-distributer-transfers");
    const q = query(
      transfersRef,
      where("stationsCompanyEmail", "==", companyEmail.toLowerCase()),
      where("status", "==", "pending")
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log(
        "⚠️ Pending transfer request already exists, skipping creation"
      );
      return null;
    }

    // Fetch stationscompany document to get ID
    const company = await fetchCurrentStationsCompany();
    if (!company) {
      console.warn("⚠️ Stationscompany document not found");
      return null;
    }

    // Create transfer request with full balance amount
    const transferNumber = generateTransferNumber();
    const transferAmount = currentBalance; // Transfer entire balance

    const transferData: Omit<ServiceDistributerTransferRequest, "id"> = {
      transferNumber: transferNumber,
      stationsCompanyEmail: companyEmail.toLowerCase(),
      stationsCompanyId: company.id,
      transferAmount: transferAmount,
      status: "pending",
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(transfersRef, transferData);

    console.log(
      `✅ Created transfer request ${transferNumber} (ID: ${docRef.id}) for ${companyEmail}`
    );

    return docRef.id;
  } catch (error) {
    console.error(
      `❌ Error checking/creating transfer request for ${companyEmail}:`,
      error
    );
    // Don't throw - this is non-critical
    return null;
  }
};

/**
 * Fetch all transfer requests for a service distributer
 * @param companyEmail - The stationscompany email
 * @returns Promise with array of transfer requests
 */
export const fetchServiceDistributerTransfers = async (
  companyEmail: string
): Promise<ServiceDistributerTransferRequest[]> => {
  try {
    console.log(`📊 Fetching transfer requests for: ${companyEmail}`);

    if (!companyEmail) {
      console.warn("⚠️ No company email provided");
      return [];
    }

    const transfersRef = collection(db, "service-distributer-transfers");
    const q = query(
      transfersRef,
      where("stationsCompanyEmail", "==", companyEmail.toLowerCase())
    );
    const querySnapshot = await getDocs(q);

    const transfers: ServiceDistributerTransferRequest[] = [];
    querySnapshot.forEach((doc) => {
      transfers.push({
        id: doc.id,
        ...doc.data(),
      } as ServiceDistributerTransferRequest);
    });

    // Sort by createdAt descending (client-side to avoid composite index requirement)
    transfers.sort((a, b) => {
      const aDate = a.createdAt?.toDate
        ? a.createdAt.toDate()
        : new Date(a.createdAt || 0);
      const bDate = b.createdAt?.toDate
        ? b.createdAt.toDate()
        : new Date(b.createdAt || 0);
      return bDate.getTime() - aDate.getTime();
    });

    console.log(
      `✅ Found ${transfers.length} transfer requests for ${companyEmail}`
    );

    return transfers;
  } catch (error) {
    console.error(
      `❌ Error fetching transfer requests for ${companyEmail}:`,
      error
    );
    throw error;
  }
};

/**
 * Create a test order with totalPrice of 3000 for transfer request testing
 * Matches the exact structure of existing orders in stationscompany-orders collection
 * @param companyEmail - Optional company email (uses current user if not provided)
 * @returns Promise with the created order document ID
 */
export const createTestOrderForTransferTesting = async (
  companyEmail?: string
): Promise<string> => {
  try {
    console.log("🧪 Creating test order for transfer request testing...");

    // Get current authenticated user
    const currentUser = await waitForAuthState();
    if (!currentUser || !currentUser.email) {
      throw new Error("No authenticated user found");
    }

    const userEmail = companyEmail || currentUser.email.toLowerCase();
    console.log(`👤 Using company email: ${userEmail}`);

    // Generate test order refId
    const testRefId = `TEST-ORDER-${Date.now()}`;

    // Calculate totalLitre to make totalPrice = 3000
    // Using price of 2 SAR per liter (typical fuel price)
    const pricePerLiter = 2;
    const totalLitre = 1500; // 1500 liters * 2 SAR = 3000 SAR

    // Create test order document matching the exact structure
    const testOrder = {
      assignedDriver: null,
      carStation: {
        address: "Test Address",
        balance: 0,
        commercialRegistration: null,
        createdUserId: userEmail, // This links to the service distributer
        email: "teststation@carstation.com",
        formattedLocation: {
          address: {
            city: "",
            country: "Saudi Arabia",
            countryCode: "SA",
            highway: "",
            postcode: "12345",
            road: "",
            state: "",
            stateDistrict: "",
          },
          lat: 24.7136,
          lng: 46.6753,
          name: "Test Location, Riyadh, Saudi Arabia",
          placeId: "TEST_PLACE_ID",
          id: "teststation@carstation.com",
        },
        id: "teststation@carstation.com",
        isActive: true,
        location: "https://www.google.com/maps",
        name: "Test Station",
        options: [
          {
            category: {
              categoryTypeEnum: "subOrdinate",
              createdDate: null,
              createdUserEmail: "admin@carstation.com",
              createdUserId: "ssrhAaHD0uMtP9xfG1wgyKEgYsa2",
              id: "KQGqqSlB1cg7F7V3hQaX",
              label: "Fuel 91",
              majorTypeEnum: "leter",
              name: {
                ar: "بنزين ٩١",
                en: "Fuel 91",
              },
              onyxProductId: "P1001",
              parentId: "v0GnCxTEP4CGiGyY3FEz",
              refId: "799189389",
            },
            companyPrice: pricePerLiter,
            desc: {
              ar: " ",
              en: " Clear",
            },
            id: null,
            onyxProductId: "P1001",
            price: pricePerLiter,
            title: {
              ar: "بنزين ٩٢",
              en: "Fuel 92",
            },
          },
        ],
        phoneNumber: "0512345678",
        taxCertificate: null,
        type: "stationsCompany",
        uId: "TEST_UID_123",
      },
      cartItems: [],
      client: {
        address: null,
        appleEmail: null,
        balance: 0,
        commercialRegistration: null,
        createdDate: serverTimestamp(),
        createdUserId: null,
        email: "testclient@email.com",
        gmail: "",
        id: "TEST_CLIENT_ID",
        idPhoto: "",
        isActive: null,
        latLng: null,
        name: "Test Client",
        phoneNumber: "0500000000",
        profilePhoto: "",
        taxCertificate: null,
        tokens: [],
        type: "Customer",
        uid: "TEST_CLIENT_UID",
      },
      clientCar: {
        carModel: {
          carModelImageUrl: "",
          createdDate: serverTimestamp(),
          createdUserId: "admin@carstation.com",
          id: "TEST_CAR_MODEL_ID",
          name: {
            ar: "سيارة تجريبية",
            en: "Test Car",
          },
        },
        carType: {
          carModel: {
            carModelImageUrl: "",
            createdDate: serverTimestamp(),
            createdUserId: "admin@carstation.com",
            id: "TEST_CAR_MODEL_ID",
            name: {
              ar: "سيارة تجريبية",
              en: "Test Car",
            },
          },
          createdDate: serverTimestamp(),
          createdUserId: "admin@carstation.com",
          id: "TEST_CAR_TYPE_ID",
          name: {
            ar: "نموذج تجريبي",
            en: "Test Model",
          },
          year: "2024",
        },
        createdDate: serverTimestamp(),
        createdUserId: "TEST_CLIENT_UID",
        driverIds: null,
        fuelType: "fuel91",
        id: "TEST_CAR_ID",
        name: {
          ar: "سيارة اختبار",
          en: "Test Car",
        },
        plan: {
          carSize: "middle",
          createdDate: Date.now(),
          createdUserId: "TEST_CLIENT_UID",
          dailyTrans: "0",
          exceptionDays: [],
          id: "TEST_PLAN_ID",
          plateNumber: {
            ar: "TEST 123",
            en: "TEST 123",
          },
          size: "middle",
        },
      },
      commissionRateUsed: 0.01,
      companyUid: null,
      coupon: null,
      createdDate: serverTimestamp(),
      fuelStationsWorker: {
        carStation: {
          address: "Test Address",
          balance: 0,
          commercialRegistration: null,
          createdUserId: null,
          email: "teststation@carstation.com",
          formattedLocation: null,
          id: null,
          isActive: true,
          location: null,
          name: "Test Station",
          options: null,
          phoneNumber: "0512345678",
          taxCertificate: null,
          type: "stationsCompany",
          uId: null,
        },
        createdDate: serverTimestamp(),
        createdUserId: userEmail,
        email: "testworker@carstation.com",
        image: "",
        isActive: null,
        name: "Test Worker",
        phoneNumber: "0512345678",
        stationsCompany: {
          address: "Test Address",
          addressFile: null,
          brandName: null,
          commercialRegistration: "",
          commercialRegistrationNumber: null,
          createdDate: null,
          createdUserId: "admin@carstation.com",
          email: userEmail,
          formattedLocation: null,
          id: null,
          isActive: true,
          location: null,
          logo: null,
          name: "Test Stations Company",
          phoneNumber: "0512312311",
          status: null,
          taxCertificate: "",
          tokens: [],
          uId: "TEST_COMPANY_UID",
          vatNumber: null,
        },
        tokens: [],
        uId: "TEST_WORKER_UID",
      },
      isCompany: false,
      location: null,
      orderDate: serverTimestamp(),
      paidFromCustomerBalance: 0,
      priceBeforeUsingCustomerBalance: 0,
      reasonForCancelingOrder: null,
      refId: testRefId,
      selectedOption: {
        category: {
          categoryTypeEnum: "subOrdinate",
          createdDate: null,
          createdUserEmail: "admin@carstation.com",
          createdUserId: "ssrhAaHD0uMtP9xfG1wgyKEgYsa2",
          id: "KQGqqSlB1cg7F7V3hQaX",
          label: "Fuel 91",
          majorTypeEnum: "leter",
          name: {
            ar: "بنزين ٩١",
            en: "Fuel 91",
          },
          onyxProductId: "P1001",
          parentId: "v0GnCxTEP4CGiGyY3FEz",
          refId: "799189389",
        },
        companyPrice: pricePerLiter,
        desc: {
          ar: "بنزين 91",
          en: "okten91",
        },
        id: "",
        onyxProductId: "P1001",
        price: pricePerLiter,
        title: {
          ar: "بنزين ٩١",
          en: "Fuel 91",
        },
      },
      sendToOnyx: false,
      service: {
        desc: {
          ar: "ابحث عن أقرب محطة وقود",
          en: "Find Nearest Fuel Station.",
        },
        id: "VLqXety2qwRwCPIskrHz",
        image:
          "https://firebasestorage.googleapis.com/v0/b/car-station-6393f.appspot.com/o/services%2F20241031221620238142214fuel_delivery.png?alt=media&token=94f32bc1-5f20-4722-ae0c-50fb7bc51c37",
        options: [
          {
            category: {
              categoryTypeEnum: "subOrdinate",
              createdDate: null,
              createdUserEmail: "admin@carstation.com",
              createdUserId: "ssrhAaHD0uMtP9xfG1wgyKEgYsa2",
              id: "KQGqqSlB1cg7F7V3hQaX",
              label: "Fuel 91",
              majorTypeEnum: "leter",
              name: {
                ar: "بنزين ٩١",
                en: "Fuel 91",
              },
              onyxProductId: "P1001",
              parentId: "v0GnCxTEP4CGiGyY3FEz",
              refId: "799189389",
            },
            companyPrice: pricePerLiter,
            desc: {
              ar: "بنزين 91",
              en: "okten91",
            },
            id: null,
            onyxProductId: "P1001",
            price: pricePerLiter,
            title: {
              ar: "بنزين ٩١",
              en: "Fuel 91",
            },
          },
        ],
        serviceId: 7,
        title: {
          ar: "وقود بالقرب منك",
          en: "Fuel near you",
        },
        unit: {
          ar: "لتر",
          en: "litre",
        },
      },
      serviceId: "VLqXety2qwRwCPIskrHz",
      startDriverLocation: null,
      status: "done",
      totalBeforeCoupon: 3000,
      totalLitre: totalLitre,
      totalPrice: 3000, // MUST be 3000 to trigger transfer request
      transactionId: null,
    };

    // Save to stationscompany-orders collection
    const ordersRef = collection(db, "stationscompany-orders");
    const docRef = await addDoc(ordersRef, testOrder);

    console.log(`✅ Test order created successfully!`);
    console.log(`📋 Order ID: ${docRef.id}`);
    console.log(`📝 Order RefId: ${testRefId}`);
    console.log(`💰 Total Price: 3000 SAR`);
    console.log(`⛽ Total Liters: ${totalLitre}`);

    // Process commission for this order (this will also update balance)
    try {
      await processOrderCommission(docRef.id, testOrder);
      console.log(`✅ Commission processed for test order`);
    } catch (error) {
      console.warn(`⚠️ Error processing commission (non-critical):`, error);
    }

    // Trigger balance update which will check for transfer request
    try {
      await updateStationsCompanyBalance(userEmail);
      console.log(`✅ Balance updated and transfer request check completed`);
    } catch (error) {
      console.warn(`⚠️ Error updating balance (non-critical):`, error);
    }

    return docRef.id;
  } catch (error) {
    console.error(`❌ Error creating test order:`, error);
    throw error;
  }
};

/**
 * Approve service distributer transfer request (Admin Only)
 * Uses Firestore transaction for atomicity
 * Updates transfer status to "transferred" AND deducts amount from balance
 * @param transferId - Transfer request document ID
 * @param adminUser - Admin processing the request
 * @returns Promise with success boolean
 */
export const approveServiceDistributerTransfer = async (
  transferId: string,
  adminUser: { uid: string; email: string; name: string }
): Promise<boolean> => {
  try {
    console.log("\n✅ ========================================");
    console.log("📝 APPROVING SERVICE DISTRIBUTER TRANSFER");
    console.log("========================================");
    console.log("📋 Transfer ID:", transferId);
    console.log("👤 Admin:", adminUser.email);

    // STEP 1: Fetch transfer request BEFORE transaction
    const transferRef = doc(db, "service-distributer-transfers", transferId);
    const transferSnap = await getDoc(transferRef);

    if (!transferSnap.exists()) {
      throw new Error("Transfer request not found");
    }

    const transferData = transferSnap.data();
    console.log("💵 Transfer Amount:", transferData.transferAmount);
    console.log("📧 Company Email:", transferData.stationsCompanyEmail);

    // Validate request status
    if (transferData.status !== "pending") {
      throw new Error(`Transfer already ${transferData.status}`);
    }

    // Find stationscompany document
    const stationsCompanyEmail = transferData.stationsCompanyEmail;
    const qRef = query(
      collection(db, "stationscompany"),
      where("email", "==", stationsCompanyEmail.toLowerCase())
    );
    const snapshot = await getDocs(qRef);

    if (snapshot.empty) {
      throw new Error("Stationscompany document not found");
    }

    const companyDocId = snapshot.docs[0].id;
    const companyDocRef = doc(db, "stationscompany", companyDocId);

    // STEP 2: Run atomic transaction
    const result = await runTransaction(db, async (transaction) => {
      // Re-read transfer inside transaction
      const transferSnap = await transaction.get(transferRef);

      if (!transferSnap.exists()) {
        throw new Error("Transfer request not found");
      }

      const transferData = transferSnap.data();

      // Validate status again
      if (transferData.status !== "pending") {
        throw new Error(`Transfer already ${transferData.status}`);
      }

      // Get company document
      const companySnap = await transaction.get(companyDocRef);

      if (!companySnap.exists()) {
        throw new Error("Company not found");
      }

      const companyData = companySnap.data();
      const currentBalance = companyData.balance || 0;
      const transferAmount = transferData.transferAmount;

      // CRITICAL: Validate sufficient balance
      if (currentBalance < transferAmount) {
        throw new Error(
          `رصيد غير كافٍ. الرصيد الحالي: ${currentBalance} ر.س، المبلغ المطلوب: ${transferAmount} ر.س`
        );
      }

      const newBalance = currentBalance - transferAmount;

      console.log("💰 Current Balance:", currentBalance);
      console.log("➖ Transferring:", transferAmount);
      console.log("💰 New Balance:", newBalance);

      // Update transfer status
      transaction.update(transferRef, {
        status: "transferred",
        transferredAt: serverTimestamp(),
        processedBy: adminUser,
      });

      // Update company balance (DEDUCTION)
      transaction.update(companyDocRef, {
        balance: newBalance,
      });

      console.log("✅ Transaction completed successfully");
      return true;
    });

    console.log("========================================\n");
    return result;
  } catch (error: any) {
    console.error("❌ Error approving transfer request:", error);
    throw error;
  }
};

/**
 * Update the last transfer request to have the full current balance
 * Useful for fixing existing transfers that were created with fixed 3000 amount
 * @param companyEmail - The stationscompany email
 * @returns Promise with updated transfer ID or null if not found
 */
export const updateLastTransferToFullBalance = async (
  companyEmail: string
): Promise<string | null> => {
  try {
    console.log(
      `🔄 Updating last transfer request to full balance for: ${companyEmail}`
    );

    if (!companyEmail) {
      console.warn("⚠️ No company email provided");
      return null;
    }

    // Fetch current balance
    const currentBalance = await calculateStationsCompanyBalance(companyEmail);
    console.log(`💰 Current balance: ${currentBalance.toFixed(2)}`);

    // Fetch all transfers for this company
    const transfersRef = collection(db, "service-distributer-transfers");
    const q = query(
      transfersRef,
      where("stationsCompanyEmail", "==", companyEmail.toLowerCase())
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("⚠️ No transfer requests found for this company");
      return null;
    }

    // Get all transfers and sort by createdAt descending
    const allTransfers = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ServiceDistributerTransferRequest[];

    allTransfers.sort((a, b) => {
      const aDate = a.createdAt?.toDate
        ? a.createdAt.toDate()
        : new Date(a.createdAt || 0);
      const bDate = b.createdAt?.toDate
        ? b.createdAt.toDate()
        : new Date(b.createdAt || 0);
      return bDate.getTime() - aDate.getTime();
    });

    // Get the last (most recent) transfer
    const lastTransfer = allTransfers[0];

    if (!lastTransfer) {
      console.log("⚠️ No transfer found");
      return null;
    }

    // Only update if status is pending
    if (lastTransfer.status !== "pending") {
      console.log(
        `⚠️ Last transfer is already ${lastTransfer.status}, cannot update`
      );
      return null;
    }

    // Update the transfer amount to full balance
    const transferRef = doc(
      db,
      "service-distributer-transfers",
      lastTransfer.id
    );
    await updateDoc(transferRef, {
      transferAmount: currentBalance,
    });

    console.log(
      `✅ Updated transfer ${lastTransfer.transferNumber} (ID: ${
        lastTransfer.id
      }) to full balance: ${currentBalance.toFixed(2)}`
    );

    return lastTransfer.id;
  } catch (error) {
    console.error(
      `❌ Error updating last transfer request for ${companyEmail}:`,
      error
    );
    throw error;
  }
};

/**
 * Update stationscompany balance field
 * Calculates balance using calculateStationsCompanyBalance and updates the document
 * @param companyEmail - The stationscompany email to update balance for
 * @returns Promise<void>
 */
export const updateStationsCompanyBalance = async (
  companyEmail: string
): Promise<void> => {
  try {
    console.log(`🔄 Updating balance for stationscompany: ${companyEmail}`);

    if (!companyEmail) {
      console.warn("⚠️ No company email provided, skipping balance update");
      return;
    }

    // First, ensure all orders have commission documents processed
    // This ensures commissions are tracked before calculating balance
    // We process commissions here to ensure they're saved to the collection
    try {
      // Fetch orders for this company
      const ordersRef = collection(db, "stationscompany-orders");
      const q = query(ordersRef, orderBy("orderDate", "desc"));
      const querySnapshot = await getDocs(q);

      const allOrders: any[] = [];
      querySnapshot.forEach((doc) => {
        allOrders.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      const filteredOrders = allOrders.filter((order) => {
        const carStationCreatedUserId = order.carStation?.createdUserId;
        return (
          carStationCreatedUserId &&
          carStationCreatedUserId.toLowerCase() === companyEmail.toLowerCase()
        );
      });

      // Check which orders already have commission documents
      const commissionsRef = collection(db, "commissions");
      const allCommissionsSnapshot = await getDocs(commissionsRef);
      const existingOrderIds = new Set<string>();
      allCommissionsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.orderId) {
          existingOrderIds.add(data.orderId);
        }
      });

      // Process commissions for orders that don't have them yet
      const ordersNeedingCommission = filteredOrders.filter(
        (order) => !existingOrderIds.has(order.id)
      );

      if (ordersNeedingCommission.length > 0) {
        console.log(
          `🔄 Processing commissions for ${ordersNeedingCommission.length} orders...`
        );
        const commissionSettings = await fetchCommissionSettings();

        // Process in smaller batches to avoid overwhelming Firestore
        const batchSize = 20;
        for (let i = 0; i < ordersNeedingCommission.length; i += batchSize) {
          const batch = ordersNeedingCommission.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (order) => {
              try {
                const commissionData = calculateOrderCommission(
                  order,
                  commissionSettings
                );
                await saveCommissionToCollection(order, commissionData);
              } catch (error) {
                console.error(
                  `❌ Error processing commission for order ${order.id}:`,
                  error
                );
              }
            })
          );
        }
      }
    } catch (error) {
      console.error(
        `⚠️ Error processing commissions before balance update (non-critical):`,
        error
      );
      // Continue with balance calculation even if commission processing fails
    }

    // Calculate the balance (which now deducts commission)
    const balance = await calculateStationsCompanyBalance(companyEmail);

    // Find stationscompany document by email
    const qRef = query(
      collection(db, "stationscompany"),
      where("email", "==", companyEmail.toLowerCase())
    );
    const snapshot = await getDocs(qRef);

    if (snapshot.empty) {
      // Try to find by uId if email doesn't match
      console.log(
        `⚠️ No document found by email, trying to find by other methods...`
      );
      // Could also try by uId if we have it, but for now just log
      console.warn(
        `⚠️ Stationscompany document not found for email: ${companyEmail}`
      );
      return;
    }

    // Update the document with balance field
    const docSnap = snapshot.docs[0];
    const docRef = doc(db, "stationscompany", docSnap.id);

    await updateDoc(docRef, {
      balance: balance,
    });

    console.log(
      `✅ Updated balance for stationscompany ${companyEmail}: ${balance.toFixed(
        2
      )}`
    );

    // Auto-check and create transfer request if balance >= 3000
    // This is non-blocking - don't fail balance update if transfer creation fails
    try {
      await checkAndCreateTransferRequest(companyEmail);
    } catch (error) {
      console.error(
        `⚠️ Error checking/creating transfer request (non-critical):`,
        error
      );
      // Continue - balance update was successful
    }
  } catch (error) {
    console.error(
      `❌ Error updating balance for stationscompany ${companyEmail}:`,
      error
    );
    throw error;
  }
};

/**
 * Initialize balance for all existing stationscompany documents
 * Can be called once to backfill existing data
 * @returns Promise<void>
 */
export const initializeAllStationsCompanyBalances = async (): Promise<void> => {
  try {
    console.log(
      "🔄 Initializing balances for all stationscompany documents..."
    );

    // Fetch all stationscompany documents
    const stationsCompanyRef = collection(db, "stationscompany");
    const snapshot = await getDocs(stationsCompanyRef);

    console.log(`📋 Found ${snapshot.size} stationscompany documents`);

    // Update balance for each company
    const updatePromises = snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const companyEmail = data.email;

      if (!companyEmail) {
        console.warn(`⚠️ Document ${docSnap.id} has no email, skipping...`);
        return;
      }

      try {
        await updateStationsCompanyBalance(companyEmail);
      } catch (error) {
        console.error(`❌ Error updating balance for ${companyEmail}:`, error);
        // Continue with other companies even if one fails
      }
    });

    await Promise.all(updatePromises);

    console.log("✅ Finished initializing all stationscompany balances");
  } catch (error) {
    console.error("❌ Error initializing stationscompany balances:", error);
    throw error;
  }
};

/**
 * Calculate car wash statistics grouped by car size
 * @param orders - Array of orders
 * @returns Object with car wash totals by size
 */
export const calculateCarWashStatistics = (
  orders: any[]
): {
  sizes: Array<{ name: string; count: number; totalCost: number }>;
  totalOrders: number;
  totalCost: number;
} => {
  // Initialize size categories in Arabic
  const sizeMap: { [key: string]: { count: number; totalCost: number } } = {
    صغيرة: { count: 0, totalCost: 0 },
    متوسطة: { count: 0, totalCost: 0 },
    كبيرة: { count: 0, totalCost: 0 },
    VIP: { count: 0, totalCost: 0 },
  };

  // Filter car wash orders
  const carWashOrders = orders.filter((order) => {
    const checkCategory = (value: any): boolean => {
      if (!value) return false;
      const str = typeof value === "string" ? value : "";
      return (
        str.includes("عمليات غسيل السيارات") ||
        str.includes("غسيل سيارة") ||
        str.includes("غسيل خارجي") ||
        str.includes("غسيل") ||
        str.includes("Car Wash") ||
        str.includes("Car wash") ||
        str.includes("Exterior wash") ||
        str.includes("washing") ||
        str.toLowerCase().includes("wash")
      );
    };

    return (
      checkCategory(order.category?.ar) ||
      checkCategory(order.category?.en) ||
      checkCategory(order.service?.category?.ar) ||
      checkCategory(order.service?.category?.en) ||
      checkCategory(order.service?.title?.ar) ||
      checkCategory(order.service?.title?.en) ||
      checkCategory(order.selectedOption?.category?.name?.ar) ||
      checkCategory(order.selectedOption?.category?.name?.en) ||
      checkCategory(order.selectedOption?.category?.ar) ||
      checkCategory(order.selectedOption?.category?.en) ||
      checkCategory(order.selectedOption?.title?.ar) ||
      checkCategory(order.selectedOption?.title?.en) ||
      checkCategory(order.selectedOption?.label) ||
      checkCategory(order.type) ||
      checkCategory(order.orderType)
    );
  });

  console.log("\n🔍 DEBUG: Car Wash Orders Filtering");
  console.log("Total orders received:", orders.length);
  console.log("Car wash orders found:", carWashOrders.length);

  if (carWashOrders.length > 0) {
    console.log("\n📋 First car wash order structure:");
    console.dir(carWashOrders[0], { depth: 3 });
  }

  // Process each car wash order
  carWashOrders.forEach((order, index) => {
    console.log(`\n--- Processing Car Wash Order ${index + 1} ---`);
    console.log("Order ID:", order.refId || order.id);
    console.log("Total Price:", order.totalPrice);
    console.log("Service Title:", order.service?.title);
    console.log(
      "Selected Option Category:",
      order.selectedOption?.category?.name
    );

    // Get car size from car.size
    let carSize = order.car?.size;

    console.log("car.size:", carSize);

    // Normalize car size to match our categories
    if (carSize) {
      const originalSize = carSize;
      carSize = String(carSize).toLowerCase().trim();
      let mappedSize = "";

      // Check for small (صغيرة)
      if (
        carSize === "small" ||
        carSize === "صغيرة" ||
        carSize.includes("صغير")
      ) {
        mappedSize = "صغيرة";
      }
      // Check for medium/middle (متوسطة)
      else if (
        carSize === "medium" ||
        carSize === "middle" ||
        carSize === "متوسطة" ||
        carSize.includes("متوسط")
      ) {
        mappedSize = "متوسطة";
      }
      // Check for large/big (كبيرة)
      else if (
        carSize === "large" ||
        carSize === "big" ||
        carSize === "كبيرة" ||
        carSize.includes("كبير")
      ) {
        mappedSize = "كبيرة";
      }
      // Check for VIP
      else if (carSize === "vip" || carSize.toUpperCase() === "VIP") {
        mappedSize = "VIP";
      }

      if (mappedSize && sizeMap[mappedSize]) {
        const price = order.totalPrice || 0;
        sizeMap[mappedSize].count += 1;
        sizeMap[mappedSize].totalCost += price;
        console.log(
          `✅ SUCCESS: Mapped "${originalSize}" → "${mappedSize}" | Price: ${price} ر.س`
        );
      } else {
        console.log(
          `❌ FAILED: Could not map size "${originalSize}" (normalized: "${carSize}")`
        );
      }
    } else {
      console.log("⚠️ WARNING: No car.size found for this order");
    }
  });

  // Convert to array format
  const sizes = Object.entries(sizeMap).map(([name, data]) => ({
    name,
    count: data.count,
    totalCost: data.totalCost,
  }));

  const totalOrders = carWashOrders.length;
  const totalCost = sizes.reduce((sum, size) => sum + size.totalCost, 0);

  console.log("\n🚗 Car Wash Statistics:");
  console.log("========================");
  console.log("Total Orders:", totalOrders);
  console.log("Total Cost:", totalCost);
  console.log("By Size:");
  sizes.forEach((size) => {
    console.log(`  ${size.name}: ${size.count} orders, ${size.totalCost} ر.س`);
  });
  console.log("========================\n");

  return { sizes, totalOrders, totalCost };
};

/**
 * Calculate oil change statistics from filtered orders
 * Filters orders by oil service names and sums total litres
 * @param orders - Array of order documents
 * @returns Object with total litres of oil
 */
export const calculateOilChangeStatistics = (
  orders: any[]
): { totalLitres: number } => {
  console.log("\n🛢️ ========================================");
  console.log("CALCULATING OIL CHANGE STATISTICS");
  console.log("========================================");
  console.log("Total orders to process:", orders.length);

  // Filter orders where service or category matches oil change keywords
  const oilOrders = orders.filter((order) => {
    // Check all possible service/category field paths for oil keywords
    const checkOilService = (value: any): boolean => {
      if (!value) return false;
      const str = typeof value === "string" ? value : "";
      return (
        str.includes("زيت بترولايف") ||
        str.includes("Petrolife Oil") ||
        str.includes("زيت محرك موبيل") ||
        str.includes("Mobil motor oil") ||
        str.toLowerCase().includes("oil") ||
        str.includes("زيت")
      );
    };

    return (
      checkOilService(order.service?.title?.ar) ||
      checkOilService(order.service?.title?.en) ||
      checkOilService(order.service?.name?.ar) ||
      checkOilService(order.service?.name?.en) ||
      checkOilService(order.category?.ar) ||
      checkOilService(order.category?.en) ||
      checkOilService(order.selectedOption?.title?.ar) ||
      checkOilService(order.selectedOption?.title?.en) ||
      checkOilService(order.selectedOption?.name?.ar) ||
      checkOilService(order.selectedOption?.name?.en) ||
      checkOilService(order.selectedOption?.label)
    );
  });

  console.log("Oil orders found:", oilOrders.length);

  // Log sample oil orders for debugging
  if (oilOrders.length > 0) {
    console.log("\n📋 Sample Oil Orders (first 3):");
    oilOrders.slice(0, 3).forEach((order, index) => {
      console.log(`\nOil Order ${index + 1}:`);
      console.log("  Service Title AR:", order.service?.title?.ar);
      console.log("  Service Title EN:", order.service?.title?.en);
      console.log("  Total Litre:", order.totalLitre);
      console.log("  Quantity:", order.quantity);
      console.log("  Cart Items:", order.cartItems?.[0]?.quantity);
    });
  }

  // Sum total litres from oil orders
  let totalLitres = 0;

  oilOrders.forEach((order) => {
    // Try different field paths for quantity/litres
    const litres =
      order.totalLitre || order.quantity || order.cartItems?.[0]?.quantity || 0;

    totalLitres += parseFloat(litres) || 0;
  });

  console.log("\n🛢️ Oil Change Statistics:");
  console.log("========================");
  console.log("Total Oil Orders:", oilOrders.length);
  console.log("Total Litres:", totalLitres);
  console.log("========================\n");

  return { totalLitres };
};

/**
 * Calculate battery change statistics from filtered orders
 * Filters orders by battery service names and groups by car size
 * @param orders - Array of order documents
 * @returns Object with battery orders grouped by car size
 */
export const fetchProductById = async (productId: string) => {
  try {
    const productDocRef = doc(db, "products", productId);
    const productDoc = await getDoc(productDocRef);

    if (!productDoc.exists()) {
      throw new Error("Product not found");
    }

    return {
      id: productDoc.id,
      ...productDoc.data(),
    };
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    throw error;
  }
};

export const fetchCouponById = async (couponId: string) => {
  try {
    const couponDocRef = doc(db, "coupons", couponId);
    const couponDoc = await getDoc(couponDocRef);

    if (!couponDoc.exists()) {
      throw new Error("Coupon not found");
    }

    return {
      id: couponDoc.id,
      ...couponDoc.data(),
    };
  } catch (error) {
    console.error("Error fetching coupon by ID:", error);
    throw error;
  }
};

export const fetchCoupons = async (): Promise<any[]> => {
  try {
    const couponsCollection = collection(db, "coupons");
    const couponsSnapshot = await getDocs(couponsCollection);

    return couponsSnapshot.docs.map((couponDoc) => ({
      id: couponDoc.id,
      ...couponDoc.data(),
    }));
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return [];
  }
};

/**
 * Fetch coupon by code from Firestore
 * @param code - The coupon code to search for
 * @returns Promise with coupon data or null if not found
 */
export const fetchCouponByCode = async (code: string): Promise<any | null> => {
  try {
    const couponsCollection = collection(db, "coupons");
    const q = query(
      couponsCollection,
      where("code", "==", code.toUpperCase().trim())
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const couponDoc = querySnapshot.docs[0];
    return {
      id: couponDoc.id,
      ...couponDoc.data(),
    };
  } catch (error) {
    console.error("Error fetching coupon by code:", error);
    return null;
  }
};
export const calculateBatteryChangeStatistics = (
  orders: any[]
): {
  sizes: Array<{ name: string; count: number }>;
  totalOrders: number;
} => {
  console.log("\n🔋 ========================================");
  console.log("CALCULATING BATTERY CHANGE STATISTICS");
  console.log("========================================");
  console.log("Total orders to process:", orders.length);

  // Filter orders where service or category matches battery keywords
  const batteryOrders = orders.filter((order) => {
    // Check all possible service/category field paths for battery keywords
    const checkBatteryService = (value: any): boolean => {
      if (!value) return false;
      const str = typeof value === "string" ? value : "";
      return (
        str.includes("تغيير وفحص البطارية") ||
        str.includes("Change and check the Battery") ||
        str.includes("تغيير البطارية") ||
        str.includes("Change the battery") ||
        str.includes("بريميوم بطارية") ||
        str.includes("Premium Battrey") ||
        str.includes("بوش") ||
        str.includes("Bosch") ||
        str.includes("AGM بطارية") ||
        str.includes("AGM Battrey") ||
        str.includes("ايه سي ديلكو") ||
        str.includes("ACDelco") ||
        str.includes("بطارية قياسي") ||
        str.includes("Standard Battrey") ||
        str.includes("فارتا") ||
        str.includes("Varta") ||
        str.toLowerCase().includes("battery") ||
        str.includes("بطارية")
      );
    };

    return (
      checkBatteryService(order.service?.title?.ar) ||
      checkBatteryService(order.service?.title?.en) ||
      checkBatteryService(order.service?.name?.ar) ||
      checkBatteryService(order.service?.name?.en) ||
      checkBatteryService(order.category?.ar) ||
      checkBatteryService(order.category?.en) ||
      checkBatteryService(order.selectedOption?.title?.ar) ||
      checkBatteryService(order.selectedOption?.title?.en) ||
      checkBatteryService(order.selectedOption?.name?.ar) ||
      checkBatteryService(order.selectedOption?.name?.en) ||
      checkBatteryService(order.selectedOption?.label)
    );
  });

  console.log("Battery orders found:", batteryOrders.length);

  // Log sample battery orders for debugging
  if (batteryOrders.length > 0) {
    console.log("\n📋 Sample Battery Orders (first 3):");
    batteryOrders.slice(0, 3).forEach((order, index) => {
      console.log(`\nBattery Order ${index + 1}:`);
      console.log("  Service Title AR:", order.service?.title?.ar);
      console.log("  Service Title EN:", order.service?.title?.en);
      console.log("  Car Size:", order.car?.size);
      console.log("  Order Size:", order.size);
    });
  }

  // Group by car size
  const sizeMap: Record<string, number> = {
    صغيرة: 0,
    متوسطة: 0,
    كبيرة: 0,
    VIP: 0,
  };

  batteryOrders.forEach((order) => {
    // Extract car size from multiple possible paths
    let carSize = order.car?.size || order.size || "";

    if (carSize) {
      console.log(`Processing order - Raw car size: "${carSize}"`);

      // Use normalizeCarSize helper function
      const normalizedSize = normalizeCarSize(carSize);

      // Increment count for normalized size
      if (sizeMap.hasOwnProperty(normalizedSize)) {
        sizeMap[normalizedSize]++;
        console.log("  → Mapped to:", normalizedSize);
      } else {
        console.log(`  ⚠️ Unknown size format: "${carSize}"`);
      }
    } else {
      console.log("⚠️ WARNING: No car.size found for this battery order");
    }
  });

  // Convert to array format
  const sizes = Object.entries(sizeMap).map(([name, count]) => ({
    name,
    count,
  }));

  const totalOrders = batteryOrders.length;

  console.log("\n🔋 Battery Change Statistics:");
  console.log("========================");
  console.log("Total Orders:", totalOrders);
  console.log("By Size:");
  sizes.forEach((size) => {
    console.log(`  ${size.name}: ${size.count} orders`);
  });
  console.log("========================\n");

  return { sizes, totalOrders };
};

/**
 * Calculate tire change statistics
 * Filters orders by tire service names and groups by car size
 * @param orders - Array of orders to process
 * @returns Object with sizes array and total tire change count
 */
export const calculateTireChangeStatistics = (
  orders: any[]
): {
  sizes: Array<{ name: string; count: number }>;
  totalOrders: number;
} => {
  // console.log('\n🚗 ========================================');
  // console.log('CALCULATING TIRE CHANGE STATISTICS');
  // console.log('========================================');
  // console.log('Total orders to process:', orders.length);

  // Filter orders where service or category matches tire keywords
  const tireOrders = orders.filter((order) => {
    // Check all possible service/category field paths for tire keywords
    const checkTireService = (value: any): boolean => {
      if (!value) return false;
      const str = typeof value === "string" ? value : "";
      return (
        str.includes("تغيير الإطارات") ||
        str.includes("Tire Change") ||
        str.includes("تغيير إطار") ||
        str.includes("Change Tire") ||
        str.includes("إطارات") ||
        str.includes("Tires") ||
        str.toLowerCase().includes("tire") ||
        str.toLowerCase().includes("tyre")
      );
    };

    return (
      checkTireService(order.service?.title?.ar) ||
      checkTireService(order.service?.title?.en) ||
      checkTireService(order.service?.name?.ar) ||
      checkTireService(order.service?.name?.en) ||
      checkTireService(order.category?.ar) ||
      checkTireService(order.category?.en) ||
      checkTireService(order.selectedOption?.title?.ar) ||
      checkTireService(order.selectedOption?.title?.en) ||
      checkTireService(order.selectedOption?.name?.ar) ||
      checkTireService(order.selectedOption?.name?.en) ||
      checkTireService(order.selectedOption?.label)
    );
  });

  // console.log('Tire change orders found:', tireOrders.length);

  // Group by car size
  const sizeMap: Record<string, number> = {
    صغيرة: 0,
    متوسطة: 0,
    كبيرة: 0,
    VIP: 0,
  };

  tireOrders.forEach((order) => {
    // Extract car size from multiple possible paths
    let carSize = order.car?.size || order.size || "";

    if (carSize) {
      // Use normalizeCarSize helper function
      const normalizedSize = normalizeCarSize(carSize);

      // Increment count for normalized size
      if (sizeMap.hasOwnProperty(normalizedSize)) {
        sizeMap[normalizedSize]++;
      }
    }
  });

  // Convert to array format
  const sizes = Object.entries(sizeMap).map(([name, count]) => ({
    name,
    count,
  }));

  const totalOrders = tireOrders.length;

  // console.log('\n🚗 Tire Change Statistics:');
  // console.log('========================');
  // console.log('Total Orders:', totalOrders);
  // console.log('By Size:');
  // sizes.forEach(size => {
  //   console.log(`  ${size.name}: ${size.count} orders`);
  // });
  // console.log('========================\n');

  return { sizes, totalOrders };
};

/**
 * Calculate battery replacement statistics
 * Filters orders by battery replacement keywords and calculates cost and counts
 * @param orders - Array of orders to process
 * @returns Object with total cost, replaced count, and requested count
 */
export const calculateBatteryReplacementStatistics = (
  orders: any[]
): {
  totalCost: number;
  replacedCount: number;
  requestedCount: number;
} => {
  // console.log('\n🔋 ========================================');
  // console.log('CALCULATING BATTERY REPLACEMENT STATISTICS');
  // console.log('========================================');
  // console.log('Total orders to process:', orders.length);

  // Filter orders where service or category matches battery keywords
  const batteryOrders = orders.filter((order) => {
    // Check all possible service/category field paths for battery keywords
    const checkBatteryService = (value: any): boolean => {
      if (!value) return false;
      const str = typeof value === "string" ? value : "";
      return (
        str.includes("تغيير وفحص البطارية") ||
        str.includes("Change and check the Battery") ||
        str.includes("تغيير البطارية") ||
        str.includes("Change the battery") ||
        str.includes("بريميوم بطارية") ||
        str.includes("Premium Battrey") ||
        str.includes("بوش") ||
        str.includes("Bosch") ||
        str.includes("AGM بطارية") ||
        str.includes("AGM Battrey") ||
        str.includes("ايه سي ديلكو") ||
        str.includes("ACDelco") ||
        str.includes("بطارية قياسي") ||
        str.includes("Standard Battrey") ||
        str.includes("فارتا") ||
        str.includes("Varta") ||
        str.includes("استبدال البطارية") ||
        str.includes("Battery Replacement") ||
        str.toLowerCase().includes("battery") ||
        str.includes("بطارية")
      );
    };

    return (
      checkBatteryService(order.service?.title?.ar) ||
      checkBatteryService(order.service?.title?.en) ||
      checkBatteryService(order.service?.name?.ar) ||
      checkBatteryService(order.service?.name?.en) ||
      checkBatteryService(order.category?.ar) ||
      checkBatteryService(order.category?.en) ||
      checkBatteryService(order.selectedOption?.title?.ar) ||
      checkBatteryService(order.selectedOption?.title?.en) ||
      checkBatteryService(order.selectedOption?.name?.ar) ||
      checkBatteryService(order.selectedOption?.name?.en) ||
      checkBatteryService(order.selectedOption?.label)
    );
  });

  // console.log('Battery replacement orders found:', batteryOrders.length);

  // Calculate statistics
  let totalCost = 0;
  let replacedCount = 0;
  let requestedCount = batteryOrders.length;

  batteryOrders.forEach((order) => {
    // Calculate total cost
    const orderCost = parseFloat(
      order.totalCost || order.total || order.price || 0
    );
    totalCost += orderCost;

    // Count replaced batteries (status = done or completed)
    const status = order.status?.toLowerCase() || "";
    if (status === "done" || status === "completed" || status === "مكتمل") {
      replacedCount++;
    }
  });

  // console.log('\n🔋 Battery Replacement Statistics:');
  // console.log('========================');
  // console.log('Total Cost:', totalCost);
  // console.log('Replaced Count:', replacedCount);
  // console.log('Requested Count:', requestedCount);
  // console.log('========================\n');

  return { totalCost, replacedCount, requestedCount };
};

/**
 * Calculate driver statistics (active vs inactive)
 * Fetches companies-drivers and counts by isActive status
 * @returns Object with active and inactive driver counts
 */
export const calculateDriverStatistics = async (): Promise<{
  active: number;
  inactive: number;
  total: number;
}> => {
  try {
    console.log("\n👥 ========================================");
    console.log("CALCULATING DRIVER STATISTICS");
    console.log("========================================");

    // Fetch companies-drivers data (already filtered by current user)
    const drivers = await fetchCompaniesDrivers();

    console.log("Total drivers for current company:", drivers.length);

    // Count active and inactive drivers
    let activeCount = 0;
    let inactiveCount = 0;

    drivers.forEach((driver) => {
      const isActive = driver.isActive === true || driver.isActive === "true";

      if (isActive) {
        activeCount++;
      } else {
        inactiveCount++;
      }

      // Debug logging for first 3 drivers
      if (activeCount + inactiveCount <= 3) {
        console.log(`\nDriver ${activeCount + inactiveCount}:`);
        console.log("  Name:", driver.name);
        console.log("  isActive:", driver.isActive);
        console.log("  Status:", isActive ? "Active" : "Inactive");
      }
    });

    console.log("\n👥 Driver Statistics:");
    console.log("========================");
    console.log("Active Drivers:", activeCount);
    console.log("Inactive Drivers:", inactiveCount);
    console.log("Total Drivers:", drivers.length);
    console.log("========================\n");

    return {
      active: activeCount,
      inactive: inactiveCount,
      total: drivers.length,
    };
  } catch (error) {
    console.error("Error calculating driver statistics:", error);
    return { active: 0, inactive: 0, total: 0 };
  }
};

/**
 * Calculate car statistics grouped by size
 * Fetches companies-cars and counts by size/category
 * @returns Object with cars grouped by size and total count
 */
export const calculateCarStatistics = async (): Promise<{
  sizes: Array<{ name: string; count: number }>;
  total: number;
}> => {
  try {
    console.log("\n🚗 ========================================");
    console.log("CALCULATING CAR STATISTICS");
    console.log("========================================");

    // Fetch companies-cars data (already filtered by current user)
    const cars = await fetchCompaniesCars();

    console.log("Total cars for current company:", cars.length);

    // Initialize size map
    const sizeMap: Record<string, number> = {
      صغيرة: 0,
      متوسطة: 0,
      كبيرة: 0,
      VIP: 0,
    };

    // Count cars by size
    cars.forEach((car, index) => {
      // Extract car size from multiple possible paths
      let carSize = car.size || car.category?.name || car.category || "";

      if (carSize) {
        // Debug logging for first 3 cars
        if (index < 3) {
          console.log(`\nCar ${index + 1}:`);
          console.log("  Name:", car.name);
          console.log("  Plate Number:", car.plateNumber);
          console.log("  Raw Size:", carSize);
        }

        // Use normalizeCarSize helper function
        const normalizedSize = normalizeCarSize(carSize);

        // Increment count for normalized size
        if (sizeMap.hasOwnProperty(normalizedSize)) {
          sizeMap[normalizedSize]++;
          if (index < 3) console.log("  → Mapped to:", normalizedSize);
        } else {
          if (index < 3) console.log(`  ⚠️ Unknown size format: "${carSize}"`);
        }
      } else {
        if (index < 3) console.log("⚠️ WARNING: No size found for this car");
      }
    });

    // Convert to array format
    const sizes = Object.entries(sizeMap).map(([name, count]) => ({
      name,
      count,
    }));

    console.log("\n🚗 Car Statistics:");
    console.log("========================");
    console.log("Total Cars:", cars.length);
    console.log("By Size:");
    sizes.forEach((size) => {
      console.log(`  ${size.name}: ${size.count} cars`);
    });
    console.log("========================\n");

    return {
      sizes,
      total: cars.length,
    };
  } catch (error) {
    console.error("Error calculating car statistics:", error);
    return { sizes: [], total: 0 };
  }
};

/**
 * Calculate order statistics (completed vs cancelled)
 * Counts orders by status from filtered orders
 * @param orders - Array of order documents
 * @returns Object with completed and cancelled order counts
 */
export const calculateOrderStatistics = (
  orders: any[]
): {
  completed: number;
  cancelled: number;
  total: number;
} => {
  console.log("\n📊 ========================================");
  console.log("CALCULATING ORDER STATISTICS");
  console.log("========================================");
  console.log("Total orders to process:", orders.length);

  // Count completed and cancelled orders
  let completedCount = 0;
  let cancelledCount = 0;

  orders.forEach((order, index) => {
    const status = order.status?.toLowerCase().trim() || "";

    // Debug logging for first 5 orders
    if (index < 5) {
      console.log(`\nOrder ${index + 1}:`);
      console.log("  ID:", order.id);
      console.log("  Status:", order.status);
      console.log("  Status (normalized):", status);
    }

    // Check for completed status variations
    if (
      status === "completed" ||
      status === "done" ||
      status === "delivered" ||
      status === "مكتمل" ||
      status === "تم التوصيل"
    ) {
      completedCount++;
      if (index < 5) console.log("  → Counted as: Completed");
    }
    // Check for cancelled status variations
    else if (
      status === "cancelled" ||
      status === "canceled" ||
      status === "rejected" ||
      status === "ملغي" ||
      status === "مرفوض"
    ) {
      cancelledCount++;
      if (index < 5) console.log("  → Counted as: Cancelled");
    } else {
      if (index < 5) console.log("  → Status:", status || "unknown");
    }
  });

  console.log("\n📊 Order Statistics:");
  console.log("========================");
  console.log("Completed Orders:", completedCount);
  console.log("Cancelled Orders:", cancelledCount);
  console.log("Other Orders:", orders.length - completedCount - cancelledCount);
  console.log("Total Orders:", orders.length);
  console.log("========================\n");

  return {
    completed: completedCount,
    cancelled: cancelledCount,
    total: orders.length,
  };
};

/**
 * Fetch and filter orders by car wash category
 * Prints filtered orders to console in their raw Firestore format
 */
export const fetchCarWashOrders = async (): Promise<any[]> => {
  try {
    const orders = await fetchOrders();

    // Filter orders where category contains car wash keywords
    const carWashOrders = orders.filter((order) => {
      // Check all possible category field paths
      const checkCategory = (value: any): boolean => {
        if (!value) return false;
        const str = typeof value === "string" ? value : "";
        return (
          str.includes("عمليات غسيل السيارات") ||
          str.includes("غسيل سيارة") ||
          str.includes("غسيل") ||
          str.includes("Car Wash") ||
          str.includes("washing") ||
          str.toLowerCase().includes("wash")
        );
      };

      return (
        checkCategory(order.category?.ar) ||
        checkCategory(order.category?.en) ||
        checkCategory(order.service?.category?.ar) ||
        checkCategory(order.service?.category?.en) ||
        checkCategory(order.service?.title?.ar) ||
        checkCategory(order.service?.title?.en) ||
        checkCategory(order.selectedOption?.category?.ar) ||
        checkCategory(order.selectedOption?.category?.en) ||
        checkCategory(order.selectedOption?.title?.ar) ||
        checkCategory(order.selectedOption?.title?.en) ||
        checkCategory(order.selectedOption?.label) ||
        checkCategory(order.type) ||
        checkCategory(order.orderType)
      );
    });

    console.log("\n🚗 ========================================");
    console.log("CAR WASH ORDERS");
    console.log("========================================");
    console.log("Total Car Wash Orders Found:", carWashOrders.length);
    console.log("========================================\n");

    if (carWashOrders.length > 0) {
      console.log("📋 Car Wash Orders Array:");
      console.log(JSON.stringify(carWashOrders, null, 2));
      console.log("\n📦 Car Wash Orders (Full Objects):");
      carWashOrders.forEach((order, index) => {
        console.log(`\n--- Order ${index + 1} ---`);
        console.dir(order, { depth: null });
      });
    } else {
      console.log("❌ No car wash orders found in current company orders.");
      console.log("\n🔍 Debugging - All available categories in orders:");
      const allCategories = new Set<string>();
      orders.forEach((order) => {
        if (order.category?.ar)
          allCategories.add(`category.ar: ${order.category.ar}`);
        if (order.category?.en)
          allCategories.add(`category.en: ${order.category.en}`);
        if (order.service?.category?.ar)
          allCategories.add(
            `service.category.ar: ${order.service.category.ar}`
          );
        if (order.service?.category?.en)
          allCategories.add(
            `service.category.en: ${order.service.category.en}`
          );
        if (order.service?.title?.ar)
          allCategories.add(`service.title.ar: ${order.service.title.ar}`);
        if (order.service?.title?.en)
          allCategories.add(`service.title.en: ${order.service.title.en}`);
        if (order.selectedOption?.category?.ar)
          allCategories.add(
            `selectedOption.category.ar: ${order.selectedOption.category.ar}`
          );
        if (order.selectedOption?.category?.en)
          allCategories.add(
            `selectedOption.category.en: ${order.selectedOption.category.en}`
          );
        if (order.selectedOption?.title?.ar)
          allCategories.add(
            `selectedOption.title.ar: ${order.selectedOption.title.ar}`
          );
        if (order.selectedOption?.title?.en)
          allCategories.add(
            `selectedOption.title.en: ${order.selectedOption.title.en}`
          );
        if (order.selectedOption?.label)
          allCategories.add(
            `selectedOption.label: ${order.selectedOption.label}`
          );
      });
      console.log("Available categories:");
      Array.from(allCategories).forEach((cat) => console.log("  -", cat));
    }

    return carWashOrders;
  } catch (error) {
    console.error("❌ Error fetching car wash orders:", error);
    return [];
  }
};

/**
 * Fetch car stations and calculate total liters consumed from orders
 * @returns Promise with car stations data enriched with consumption info
 */
export interface CarStationsWithConsumptionOptions {
  includeAllOrders?: boolean;
  orders?: any[];
}

export const fetchCarStationsWithConsumption = async (
  options?: CarStationsWithConsumptionOptions
): Promise<any[]> => {
  try {
    const user = auth.currentUser;
    if (!options?.includeAllOrders) {
      if (!user) {
        console.error("No authenticated user");
        return [];
      }
    }

    // Step 1: Fetch all car stations
    const carStationsCollection = collection(db, "carstations");
    const carStationsSnapshot = await getDocs(carStationsCollection);

    const carStations = carStationsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        stationCode: data.id || data.placeId || doc.id,
        city:
          data.formattedLocation?.address?.city ||
          data.address?.city ||
          data.city ||
          "N/A",
        company: data.name || data.email || "N/A",
        status: data.status || data.isActive ? "active" : "inactive",
        email: data.email || "",
        totalLitersConsumed: 0,
        ...data,
      };
    });

    console.log("\n🏢 Car Stations fetched:", carStations.length);

    // Debug: Show first 3 stations
    console.log("\n📍 Sample Car Stations:");
    carStations.slice(0, 3).forEach((station, i) => {
      console.log(`Station ${i + 1}:`, {
        city: station.city,
        company: station.company,
        email: station.email,
      });
    });

    // Step 2: Fetch orders based on scope
    let orders: any[] = [];
    if (options?.orders) {
      orders = options.orders;
      console.log("\n📦 Orders provided via options:", orders.length);
    } else if (options?.includeAllOrders) {
      orders = await fetchAllOrders();
      console.log("\n📦 Orders fetched for admin view:", orders.length);
    } else {
      orders = await fetchOrders();
      console.log("\n📦 Orders fetched for current user:", orders.length);
    }

    // Debug: Show first 3 orders
    if (orders.length > 0) {
      console.log("\n📍 Sample Orders:");
      orders.slice(0, 3).forEach((order, i) => {
        console.log(`Order ${i + 1}:`, {
          id: order.id || order.refId,
          carStationEmail:
            order.carStation?.email || order.stationEmail || "NO EMAIL",
          totalLitre: order.totalLitre,
          quantity: order.quantity,
        });
      });
    }

    // Step 3: Match orders to stations and calculate consumption
    let matchedCount = 0;
    let unmatchedCount = 0;

    orders.forEach((order, index) => {
      const orderStationEmail = order.carStation?.email || order.stationEmail;

      if (orderStationEmail) {
        // Find matching station
        const station = carStations.find((s) => s.email === orderStationEmail);

        if (station) {
          // Calculate fuel quantity from order
          const quantity =
            order.totalLitre ||
            order.quantity ||
            order.selectedOption?.quantity ||
            0;

          station.totalLitersConsumed += quantity;
          matchedCount++;

          if (index < 5) {
            console.log(
              `✅ Order ${index + 1} matched to "${station.company}" (${
                station.city
              }) - Added ${quantity}L`
            );
          }
        } else {
          unmatchedCount++;
          if (index < 5) {
            console.log(
              `⚠️ Order ${
                index + 1
              } - No station found with email: ${orderStationEmail}`
            );
          }
        }
      } else {
        unmatchedCount++;
        if (index < 5) {
          console.log(`⚠️ Order ${index + 1} - No carStation.email in order`);
        }
      }
    });

    console.log("\n🔗 MATCHING SUMMARY:");
    console.log("===================");
    console.log(`Total orders: ${orders.length}`);
    console.log(`Matched to stations: ${matchedCount}`);
    console.log(`Unmatched: ${unmatchedCount}`);
    console.log("===================\n");

    // Log summary
    console.log("\n📊 Car Stations Summary:");
    console.log("========================");
    carStations.forEach((station) => {
      if (station.totalLitersConsumed > 0) {
        console.log(
          `${station.company} (${station.city}): ${station.totalLitersConsumed}L`
        );
      }
    });
    console.log("========================\n");

    return carStations;
  } catch (error) {
    console.error("Error fetching car stations with consumption:", error);
    return [];
  }
};
/**
 * Fetch orders and transform them for financial reports
 * @returns Promise with formatted financial report data
 */
export const fetchFinancialReportData = async (): Promise<any[]> => {
  try {
    const orders = await fetchOrders();

    // Fetch all drivers to get refid mapping
    const drivers = await fetchCompaniesDrivers();
    // Create a map for quick lookup: driver id/email/uId -> refid
    const driverRefIdMap = new Map<string, string>();
    const driverByIdMap = new Map<string, any>(); // Also store full driver objects for fallback

    drivers.forEach((driver) => {
      const refid = driver.refid || driver.refId; // Support both lowercase and camelCase
      if (!refid) {
        console.warn(`Driver ${driver.id} has no refid`);
        return;
      }

      // Store full driver object
      if (driver.id) {
        driverByIdMap.set(driver.id, driver);
      }

      // Map by document id
      if (driver.id) {
        driverRefIdMap.set(driver.id, refid);
      }
      // Map by email (case-insensitive)
      if (driver.email) {
        const emailLower = driver.email.toLowerCase().trim();
        driverRefIdMap.set(emailLower, refid);
        driverRefIdMap.set(driver.email.trim(), refid);
      }
      // Map by uId
      if (driver.uId) {
        driverRefIdMap.set(driver.uId, refid);
      }
    });

    // Log map statistics
    console.log("Driver mapping stats:", {
      totalDrivers: drivers.length,
      driversWithRefid: drivers.filter((d) => d.refid || d.refId).length,
      mapEntries: driverRefIdMap.size,
      uniqueRefids: new Set(Array.from(driverRefIdMap.values())).size,
    });

    console.log("\n📊 Processing Financial Report Data");
    console.log("===================================");
    console.log("Total orders:", orders.length);
    console.log("Total drivers:", drivers.length);
    console.log("Driver refid map size:", driverRefIdMap.size);

    // Log sample drivers for debugging
    if (drivers.length > 0) {
      console.log(
        "Sample drivers (first 3):",
        drivers.slice(0, 3).map((d) => ({
          id: d.id,
          email: d.email,
          refid: d.refid || d.refId,
          name: d.name,
        }))
      );
    }

    // Log sample orders for debugging
    if (orders.length > 0) {
      console.log(
        "Sample orders assignedDriver (first 3):",
        orders.slice(0, 3).map((o) => ({
          orderId: o.id,
          assignedDriver: o.assignedDriver,
          enrichedDriverName: o.enrichedDriverName,
        }))
      );
    }

    // Transform each order to financial report format
    const reportData = orders.map((order, index) => {
      // Extract city from document.carStation.address
      const city =
        order.document?.carStation?.address ||
        order.carStation?.address ||
        order.city?.name ||
        "-";

      // Extract station name from carStation.name
      const stationName = order.carStation?.name || "-";

      // Extract date from createdDate
      const date = order.createdDate || order.orderDate || null;

      // Extract operation number from document.refId
      const operationNumber =
        order.document?.refId || order.refId || order.id || "-";

      // Extract quantity from cartItems[0].quantity
      const quantity =
        order.cartItems?.[0]?.quantity ||
        order.totalLitre ||
        order.quantity ||
        0;

      // Extract product name from cartItems[0].name.ar
      const productName =
        order.cartItems?.[0]?.name?.ar ||
        order.cartItems?.[0]?.name?.en ||
        order.selectedOption?.name?.ar ||
        order.selectedOption?.name?.en ||
        order.selectedOption?.title?.ar ||
        order.selectedOption?.title?.en ||
        "-";

      // Extract product number from cartItems[0].onyxProductId
      const productNumber =
        order.cartItems?.[0]?.onyxProductId ||
        order.selectedOption?.onyxProductId ||
        "-";

      // Extract product type from service name (نوع المنتج)
      const productType =
        order.service?.title?.ar ||
        order.service?.title?.en ||
        order.service?.name?.ar ||
        order.service?.name?.en ||
        order.cartItems?.[0]?.category?.majorTypeEnum ||
        order.selectedOption?.category?.majorTypeEnum ||
        "-";

      // Extract driver name from assignedDriver.name
      const driverName =
        order.assignedDriver?.name || order.enrichedDriverName || "-";

      // Extract driver code (refid) from companies-drivers collection
      // Match by driver name - find the driver in companies-drivers collection by name
      let driverCode = "-";

      if (driverName && driverName !== "-") {
        // Find driver by name (case-insensitive, trim whitespace)
        const driverNameNormalized = driverName.trim().toLowerCase();
        const driver = drivers.find((d) => {
          const dName = (d.name || d.driverName || d.fullName || "")
            .trim()
            .toLowerCase();
          return dName === driverNameNormalized;
        });

        if (driver) {
          driverCode = driver.refid || driver.refId || "-";
        }

        // Debug logging for first few orders
        if (index < 5) {
          console.log(`Order ${index + 1} driver lookup by name:`, {
            orderId: order.id,
            driverName: driverName,
            driverNameNormalized: driverNameNormalized,
            foundDriver: driver
              ? {
                  id: driver.id,
                  name: driver.name || driver.driverName || driver.fullName,
                  refid: driver.refid || driver.refId,
                  email: driver.email,
                }
              : null,
            driverCode: driverCode,
          });
        }
      } else {
        // No driver name, log for debugging
        if (index < 5) {
          console.log(`Order ${index + 1} has no driver name:`, {
            orderId: order.id,
            assignedDriver: order.assignedDriver,
            enrichedDriverName: order.enrichedDriverName,
          });
        }
      }

      if (index < 3) {
        console.log(`\n--- Order ${index + 1} ---`);
        console.log("City:", city);
        console.log("Station Name:", stationName);
        console.log("Date:", date);
        console.log("Operation Number:", operationNumber);
        console.log("Quantity:", quantity);
        console.log("Product Name:", productName);
        console.log("Product Number:", productNumber);
        console.log("Product Type:", productType);
        console.log("Driver Name:", driverName);
        console.log("Driver Code:", driverCode);
      }

      return {
        city,
        stationName,
        date,
        operationNumber,
        quantity,
        productName,
        productNumber,
        productType,
        driverName,
        driverCode,
        // Keep original order data for reference
        originalOrder: order,
      };
    });

    console.log("\n✅ Financial report data processed:", reportData.length);
    console.log("===================================\n");

    return reportData;
  } catch (error) {
    console.error("Error fetching financial report data:", error);
    return [];
  }
};

/**
 * Calculate fuel consumption by cities from car stations data
 * Uses fetchCarStationsWithConsumption() which calculates consumption from orders
 * Groups stations by city and sums consumption
 * @returns Promise with array of cities and their fuel consumption
 */
export interface FuelConsumptionByCitiesOptions
  extends CarStationsWithConsumptionOptions {}

export const calculateFuelConsumptionByCities = async (
  options?: FuelConsumptionByCitiesOptions
) => {
  try {
    console.log("\n🏙️ ========================================");
    console.log("📊 CALCULATING FUEL CONSUMPTION BY CITIES");
    console.log("📍 Using fetchCarStationsWithConsumption()");
    console.log("========================================\n");

    // Fetch car stations WITH consumption calculated from orders
    // This function matches orders to stations and calculates totalLitersConsumed
    const stations = await fetchCarStationsWithConsumption(options);

    if (!stations || stations.length === 0) {
      console.log("⚠️ No stations found");
      return [];
    }

    console.log(`📦 Total stations fetched: ${stations.length}`);

    // Debug: Log first 5 stations to see what we got
    console.log("\n📋 SAMPLE STATIONS WITH CONSUMPTION:");
    console.log("====================================");
    stations.slice(0, 5).forEach((station, index) => {
      console.log(`Station ${index + 1}:`, {
        city: station.city,
        company: station.company,
        totalLitersConsumed: station.totalLitersConsumed,
      });
    });
    console.log("====================================\n");

    // Group stations by city and sum consumption
    const cityConsumption: Record<
      string,
      {
        name: string;
        totalLitres: number;
        stationCount: number;
      }
    > = {};

    let processedCount = 0;
    let skippedNoCityCount = 0;
    let skippedNoConsumptionCount = 0;

    stations.forEach((station, index) => {
      // Extract city from station (already extracted by fetchCarStationsWithConsumption)
      const cityName = station.city;

      // Extract consumption (already calculated by fetchCarStationsWithConsumption)
      const consumption = station.totalLitersConsumed || 0;

      // Only process stations with valid city and consumption
      if (!cityName || cityName === "N/A") {
        skippedNoCityCount++;
        if (index < 10) {
          console.log(
            `⚠️ Station ${index + 1} (${
              station.company
            }) skipped - No valid city`
          );
        }
      } else if (consumption <= 0) {
        skippedNoConsumptionCount++;
        if (index < 10) {
          console.log(
            `⚠️ Station ${index + 1} (${
              station.company
            }) skipped - No consumption (City: ${cityName})`
          );
        }
      } else {
        // Valid station - add to city totals
        processedCount++;

        if (index < 10) {
          console.log(
            `✅ Station ${index + 1} (${
              station.company
            }) processed - City: ${cityName}, Litres: ${consumption}`
          );
        }

        if (!cityConsumption[cityName]) {
          cityConsumption[cityName] = {
            name: cityName,
            totalLitres: 0,
            stationCount: 0,
          };
        }

        cityConsumption[cityName].totalLitres += consumption;
        cityConsumption[cityName].stationCount += 1;
      }
    });

    console.log("\n📊 PROCESSING SUMMARY:");
    console.log("====================");
    console.log(`Total stations: ${stations.length}`);
    console.log(`Processed: ${processedCount}`);
    console.log(`Skipped (no city): ${skippedNoCityCount}`);
    console.log(`Skipped (no consumption): ${skippedNoConsumptionCount}`);
    console.log("====================\n");

    // Convert to array and sort by consumption (highest first)
    const citiesArray = Object.values(cityConsumption)
      .sort((a, b) => b.totalLitres - a.totalLitres)
      .map((city) => ({
        name: city.name,
        consumption: Math.round(city.totalLitres * 100) / 100, // Round to 2 decimal places
        stationCount: city.stationCount,
      }));

    console.log("\n✅ FUEL CONSUMPTION BY CITIES:");
    console.log("========================================");
    console.table(citiesArray);
    console.log(`📍 Total cities: ${citiesArray.length}`);
    console.log("========================================\n");

    return citiesArray;
  } catch (error) {
    console.error("❌ Error calculating fuel consumption by cities:", error);
    return [];
  }
};

/**
 * Fetch subscriptions for current user and calculate expiry dates
 * @returns Promise with subscription data including expiry dates
 */
/**
 * Check if this is the company's first time subscribing
 * @returns Promise<boolean> - true if no subscription history exists, false otherwise
 */
export const checkIsFirstTimeSubscription = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user");
      return false;
    }

    // Get the current company
    const company = await fetchCurrentCompany();
    if (!company) {
      console.error("No company found for current user");
      return false;
    }

    const companyEmail = company.email;
    if (!companyEmail) {
      console.error("No company email found");
      return false;
    }

    // Query subscriptions-payment collection by company email
    const subscriptionsCollection = collection(db, "subscriptions-payment");
    const q = query(
      subscriptionsCollection,
      where("company.email", "==", companyEmail),
      limit(1)
    );
    const subscriptionsSnapshot = await getDocs(q);

    // Return true if no subscriptions found (first time)
    return subscriptionsSnapshot.docs.length === 0;
  } catch (error) {
    console.error("Error checking first-time subscription status:", error);
    return false;
  }
};

export const fetchUserSubscriptions = async (): Promise<any[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user");
      return [];
    }

    console.log("\n📋 Fetching User Subscriptions");
    console.log("==============================");
    console.log("Current User UID:", user.uid);

    // First, get the current company
    const company = await fetchCurrentCompany();
    if (!company) {
      console.error("No company found for current user");
      return [];
    }

    console.log("Current Company ID:", company.id);
    console.log("Current User Email:", user.email);
    console.log("Current Company Email:", company.email);

    // Fetch subscriptions from subscriptions-payment collection
    const subscriptionsCollection = collection(db, "subscriptions-payment");

    // Query by company email
    const companyEmail = company.email;
    if (!companyEmail) {
      console.error("No company email found");
      return [];
    }

    console.log(
      "Fetching subscriptions-payment filtered by company email:",
      companyEmail
    );

    // Query by company.email (nested field)
    const q = query(
      subscriptionsCollection,
      where("company.email", "==", companyEmail),
      orderBy("createdDate", "desc")
    );
    const subscriptionsSnapshot = await getDocs(q);

    console.log(
      "Total subscriptions found (filtered by company.email):",
      subscriptionsSnapshot.docs.length
    );

    // If we found subscriptions, log the first one's structure to help debug
    if (subscriptionsSnapshot.docs.length > 0) {
      console.log("\n🔍 First subscription document structure:");
      console.log("Document ID:", subscriptionsSnapshot.docs[0].id);
      console.log(
        "Available fields:",
        Object.keys(subscriptionsSnapshot.docs[0].data())
      );
      console.log("Full document data:", subscriptionsSnapshot.docs[0].data());
    } else {
      console.log(
        "\n❌ No documents found in subscriptions-payment collection"
      );
      console.log("Please check:");
      console.log("1. Does the subscriptions-payment collection exist?");
      console.log("2. Do documents have email field matching:", company.email);
      console.log("3. Check Firebase Console for actual field names");
    }

    // Transform each subscription
    const subscriptions = subscriptionsSnapshot.docs.map((doc, index) => {
      const data = doc.data();

      // Extract fields from the document structure
      const selectedSubscription = data.selectedSubscription || {};
      const planName =
        selectedSubscription.title?.ar ||
        selectedSubscription.title?.en ||
        "N/A";
      const price = selectedSubscription.price || 0;
      const subscriptionStartDate =
        data.subscriptionStartDate || data.createdDate;
      const subscriptionEndDate = data.subscriptionEndDate;
      const periodValueInDays = selectedSubscription.periodValueInDays || 30;
      const isPaid = data.isPaid !== undefined ? data.isPaid : true;

      // Format dates as DD/MM/YYYY
      const formatDate = (date: any): string => {
        if (!date) return "N/A";
        try {
          const dateObj = date.toDate ? date.toDate() : new Date(date);
          const day = String(dateObj.getDate()).padStart(2, "0");
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const year = dateObj.getFullYear();
          return `${day}/${month}/${year}`;
        } catch (error) {
          return "N/A";
        }
      };

      const createdDateFormatted = formatDate(subscriptionStartDate);
      const expiryDateFormatted = formatDate(subscriptionEndDate);

      if (index < 3) {
        console.log(`\n--- Subscription ${index + 1} ---`);
        console.log("Plan Name:", planName);
        console.log("Price:", price);
        console.log("Start Date:", createdDateFormatted);
        console.log("End Date:", expiryDateFormatted);
        console.log("Period (days):", periodValueInDays);
        console.log("Is Paid:", isPaid);
      }

      return {
        id: doc.id,
        planName,
        price,
        createdDate: createdDateFormatted,
        expiryDate: expiryDateFormatted,
        periodValueInDays,
        isPaid,
        // Keep original data for reference
        originalData: data,
      };
    });

    // If still no subscriptions found, check if they're stored in the company document itself
    if (subscriptions.length === 0) {
      console.log(
        "\n⚠️ No subscriptions found in subscriptions-payment collection"
      );
      console.log(
        "Checking if subscriptions are stored in company document..."
      );

      if (
        company.subscriptionsHistory &&
        Array.isArray(company.subscriptionsHistory)
      ) {
        console.log(
          "Found subscriptionsHistory in company document:",
          company.subscriptionsHistory.length
        );
        // Return the subscriptions from company document
        return company.subscriptionsHistory.map((sub: any, index: number) => ({
          id: sub.id || `company-sub-${index}`,
          planName: sub.planName || sub.title?.ar || sub.title?.en || "N/A",
          price: sub.price || 0,
          createdDate: sub.createdDate || "N/A",
          expiryDate: sub.expiryDate || "N/A",
          periodValueInDays: sub.periodValueInDays || 30,
          originalData: sub,
        }));
      }

      console.log("⚠️ No subscriptions found in company document either");
      console.log("Please check:");
      console.log("1. Are subscriptions being created in the database?");
      console.log("2. What is the correct field name to query by?");
      console.log(
        "3. Check Firebase Console to see subscription documents structure"
      );
    }

    console.log("\n✅ Subscriptions processed:", subscriptions.length);
    console.log("==============================\n");

    return subscriptions;
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    return [];
  }
};

/**
 * Fetch all products from Firestore
 * @returns Promise with products data
 */
export const fetchProducts = async (): Promise<any[]> => {
  try {
    const productsCollection = collection(db, "products");
    const q = query(productsCollection, orderBy("createdDate", "desc"));
    const productsSnapshot = await getDocs(q);

    const products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

/**
 * Delete a petrolife product from Firestore
 * @param productId - The product document ID
 * @returns Promise<boolean> - Returns true if deletion was successful
 */
export const deletePetrolifeProduct = async (
  productId: string
): Promise<boolean> => {
  try {
    console.log(`🗑️ Deleting petrolife product from Firestore: ${productId}`);

    // Verify the product exists before deleting
    const productDocRef = doc(db, "products", productId);
    const productDoc = await getDoc(productDocRef);

    if (!productDoc.exists()) {
      throw new Error("Product not found");
    }

    // Delete the product document
    await deleteDoc(productDocRef);
    console.log(`✅ Successfully deleted petrolife product from Firestore`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting petrolife product:", error);
    throw error;
  }
};

/**
 * Add 8-digit refid to existing products that don't have one
 * @returns Promise with the number of updated products
 */
export const addRefidToExistingProducts = async (): Promise<number> => {
  try {
    console.log("🔄 Starting migration: Adding refid to existing products...");
    const productsRef = collection(db, "products");
    // Try to fetch with orderBy, fallback to without if it fails
    let productsSnapshot;
    try {
      const q = query(productsRef, orderBy("createdDate", "desc"));
      productsSnapshot = await getDocs(q);
    } catch (orderByError) {
      console.warn("⚠️ Could not order by createdDate, fetching without order");
      productsSnapshot = await getDocs(productsRef);
    }
    console.log(`📦 Found ${productsSnapshot.size} products`);

    let updatedCount = 0;
    const productsToUpdate: Array<{ docRef: any; refid: string }> = [];

    for (const productDoc of productsSnapshot.docs) {
      const productData = productDoc.data();
      if (productData.refid) {
        console.log(
          `⏭️  Product ${productDoc.id} already has refid: ${productData.refid}`
        );
        continue;
      }

      let refid: string = "";
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 20;

      while (!isUnique && attempts < maxAttempts) {
        const randomCode = Math.floor(10000000 + Math.random() * 90000000);
        refid = randomCode.toString();
        const productsRefCheck = collection(db, "products");
        const qCheck = query(productsRefCheck, where("refid", "==", refid));
        const querySnapshot = await getDocs(qCheck);
        const isInPendingUpdates = productsToUpdate.some(
          (item) => item.refid === refid
        );

        if (querySnapshot.empty && !isInPendingUpdates) {
          isUnique = true;
        } else {
          attempts++;
        }
      }

      if (!isUnique || !refid) {
        console.error(
          `❌ Failed to generate unique refid for product ${productDoc.id} after ${maxAttempts} attempts`
        );
        continue;
      }

      productsToUpdate.push({
        docRef: doc(db, "products", productDoc.id),
        refid: refid,
      });
      console.log(`✅ Generated refid ${refid} for product ${productDoc.id}`);
    }

    console.log(
      `📝 Updating ${productsToUpdate.length} products with refid...`
    );
    for (const { docRef, refid } of productsToUpdate) {
      try {
        await updateDoc(docRef, { refid: refid });
        updatedCount++;
        console.log(`✅ Updated product ${docRef.id} with refid: ${refid}`);
      } catch (error) {
        console.error(`❌ Error updating product ${docRef.id}:`, error);
      }
    }
    console.log(
      `✅ Migration completed: ${updatedCount} products updated with refid`
    );
    return updatedCount;
  } catch (error) {
    console.error("❌ Error in migration:", error);
    throw error;
  }
};

/**
 * Fetch all subscriptions from Firestore
 * @returns Promise with subscriptions data
 */
export const fetchSubscriptions = async (): Promise<any[]> => {
  try {
    console.log("📋 Fetching subscriptions from Firestore...");
    const subscriptionsCollection = collection(db, "subscriptions");

    let subscriptionsSnapshot;
    try {
      // Try with orderBy first
      const q = query(subscriptionsCollection, orderBy("createdDate", "desc"));
      subscriptionsSnapshot = await getDocs(q);
    } catch (orderByError) {
      // If orderBy fails (no index or field doesn't exist), fetch without ordering
      console.warn(
        "⚠️ Could not order by createdDate, fetching without order:",
        orderByError
      );
      subscriptionsSnapshot = await getDocs(subscriptionsCollection);
    }

    const subscriptions = subscriptionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(
      `✅ Fetched ${subscriptions.length} subscriptions from Firestore`
    );
    if (subscriptions.length > 0) {
      console.log(
        "📄 Sample subscription data:",
        JSON.stringify(subscriptions[0], null, 2)
      );
      console.log(
        "📄 All subscriptions periodName values:",
        subscriptions.map((s: any) => ({ id: s.id, periodName: s.periodName }))
      );
    }
    return subscriptions;
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return [];
  }
};

/**
 * Fetch a single subscription by ID from Firestore
 * @param subscriptionId - The subscription document ID
 * @returns Promise with subscription data or null if not found
 */
export const fetchSubscriptionById = async (
  subscriptionId: string
): Promise<any | null> => {
  try {
    console.log(
      "📋 Fetching subscription by ID from Firestore:",
      subscriptionId
    );
    const subscriptionsCollection = collection(db, "subscriptions");
    const subscriptionDoc = doc(subscriptionsCollection, subscriptionId);
    const subscriptionSnapshot = await getDoc(subscriptionDoc);

    if (!subscriptionSnapshot.exists()) {
      console.warn(`⚠️ Subscription with ID ${subscriptionId} not found`);
      return null;
    }

    const subscriptionData = {
      id: subscriptionSnapshot.id,
      ...subscriptionSnapshot.data(),
    };

    console.log("✅ Fetched subscription from Firestore:", subscriptionData);
    return subscriptionData;
  } catch (error) {
    console.error("Error fetching subscription by ID:", error);
    throw error;
  }
};

/**
 * Update a subscription in Firestore
 * @param subscriptionId - The subscription document ID
 * @param updateData - The data to update (should maintain the structure with .ar and .en fields)
 * @returns Promise<void>
 */
export const updateSubscription = async (
  subscriptionId: string,
  updateData: {
    title?: { ar?: string; en?: string } | string;
    description?:
      | {
          ar?: string;
          en?: string;
          minCarNumber?: number;
          maxCarNumber?: number;
        }
      | string;
    status?: { ar?: string; en?: string } | string;
    price?: number;
    options?: Array<{ ar?: string; en?: string } | string>;
    periodName?: { ar?: string; en?: string } | string;
    periodValueInDays?: number;
  }
): Promise<void> => {
  try {
    console.log(
      "📝 Updating subscription in Firestore:",
      subscriptionId,
      updateData
    );
    const subscriptionsCollection = collection(db, "subscriptions");
    const subscriptionDoc = doc(subscriptionsCollection, subscriptionId);

    // Prepare update data - maintain structure if it's an object, otherwise convert
    const firestoreUpdateData: any = {};

    if (updateData.title !== undefined) {
      if (typeof updateData.title === "string") {
        // If title is a string, preserve existing structure or create new
        firestoreUpdateData.title = { ar: updateData.title };
      } else {
        firestoreUpdateData.title = updateData.title;
      }
    }

    if (updateData.description !== undefined) {
      if (typeof updateData.description === "string") {
        firestoreUpdateData.description = { ar: updateData.description };
      } else {
        // Clean description object - remove undefined fields
        const cleanDescription: any = {};
        if (updateData.description.ar !== undefined) {
          cleanDescription.ar = updateData.description.ar;
        }
        if (updateData.description.en !== undefined) {
          cleanDescription.en = updateData.description.en;
        }
        if (updateData.description.minCarNumber !== undefined) {
          cleanDescription.minCarNumber = updateData.description.minCarNumber;
        }
        if (updateData.description.maxCarNumber !== undefined) {
          cleanDescription.maxCarNumber = updateData.description.maxCarNumber;
        }
        firestoreUpdateData.description = cleanDescription;
      }
    }

    if (updateData.status !== undefined) {
      if (typeof updateData.status === "string") {
        firestoreUpdateData.status = { ar: updateData.status };
      } else {
        firestoreUpdateData.status = updateData.status;
      }
    }

    if (updateData.price !== undefined) {
      firestoreUpdateData.price = updateData.price;
    }

    if (updateData.options !== undefined) {
      firestoreUpdateData.options = updateData.options.map((option) => {
        if (typeof option === "string") {
          return { ar: option, en: option };
        }
        return option;
      });
    }

    if (updateData.periodName !== undefined) {
      if (typeof updateData.periodName === "string") {
        firestoreUpdateData.periodName = { ar: updateData.periodName };
      } else {
        firestoreUpdateData.periodName = updateData.periodName;
      }
    }

    if (updateData.periodValueInDays !== undefined) {
      firestoreUpdateData.periodValueInDays = updateData.periodValueInDays;
    }

    await updateDoc(subscriptionDoc, firestoreUpdateData);
    console.log("✅ Subscription updated successfully in Firestore");
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
};

/**
 * Create a new subscription in Firestore
 * @param subscriptionData - The subscription data with proper structure
 * @returns Promise with the created subscription document ID
 */
export const createSubscription = async (subscriptionData: {
  title: { ar: string; en?: string };
  description: {
    ar: string;
    en?: string;
    minCarNumber?: number;
    maxCarNumber?: number;
  };
  status: { ar: string; en?: string };
  price: number;
  options: Array<{ ar: string; en?: string }>;
  periodName: { ar: string; en?: string };
  periodValueInDays: number;
  logo?: string;
}): Promise<string> => {
  try {
    console.log("📝 Creating new subscription in Firestore:", subscriptionData);
    const subscriptionsCollection = collection(db, "subscriptions");

    // Prepare subscription document with all required fields
    const subscriptionDocument: any = {
      title: subscriptionData.title,
      description: subscriptionData.description,
      status: subscriptionData.status,
      price: subscriptionData.price,
      options: subscriptionData.options,
      periodName: subscriptionData.periodName,
      periodValueInDays: subscriptionData.periodValueInDays,
      createdDate: serverTimestamp(),
      createdUserId: auth.currentUser?.uid || auth.currentUser?.email || null,
    };

    // Add optional fields only if they exist
    if (subscriptionData.logo) {
      subscriptionDocument.logo = subscriptionData.logo;
    }

    const docRef = await addDoc(subscriptionsCollection, subscriptionDocument);
    console.log(
      "✅ Subscription created successfully in Firestore with ID:",
      docRef.id
    );
    return docRef.id;
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
};

/**
 * Delete a subscription from Firestore
 * @param subscriptionId - The subscription document ID to delete
 * @returns Promise<void>
 */
export const deleteSubscription = async (
  subscriptionId: string
): Promise<void> => {
  try {
    console.log("🗑️ Deleting subscription from Firestore:", subscriptionId);
    const subscriptionsCollection = collection(db, "subscriptions");
    const subscriptionDoc = doc(subscriptionsCollection, subscriptionId);

    await deleteDoc(subscriptionDoc);
    console.log("✅ Subscription deleted successfully from Firestore");
  } catch (error) {
    console.error("Error deleting subscription:", error);
    throw error;
  }
};

/**
 * Process subscription payment: deduct wallet balance, create subscription payment, order, and invoice
 * @param subscriptionData - Subscription payment data
 * @returns Promise with invoice ID and subscription payment ID
 */
export const processSubscriptionPayment = async (subscriptionData: {
  subscriptionId: string;
  subscription: any;
  vehicleCount: number;
  totalWithVAT: number;
  totalWithoutVAT: number;
  vat: number;
  companyId: string;
  company: any;
  couponCode?: string;
  couponData?: any;
}): Promise<{
  invoiceId: string;
  subscriptionPaymentId: string;
  orderId: string;
}> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No user is currently logged in");
    }

    const {
      subscriptionId,
      subscription,
      vehicleCount,
      totalWithVAT,
      totalWithoutVAT,
      vat,
      companyId,
      company,
    } = subscriptionData;

    // Validate required data with detailed error messages
    if (!subscriptionId) {
      throw new Error("Missing subscription ID");
    }
    if (!subscription) {
      throw new Error("Missing subscription data");
    }
    if (!company) {
      throw new Error("Missing company data");
    }

    // Construct finalCompanyId from available sources
    // companyId from parameter, or company.id, or company.email (which might be the doc ID)
    const finalCompanyId = companyId || company.id || company.email || "";

    if (!finalCompanyId) {
      console.error("Company data received:", company);
      throw new Error(
        "Company ID is missing - cannot proceed with subscription. Please ensure company data is loaded."
      );
    }

    // Get email from company data (may be in different fields)
    const companyEmail = company.email || company.userEmail || "";
    if (!companyEmail) {
      console.warn(
        "Company email not found, but continuing with subscription payment"
      );
    }

    // Calculate dates
    const subscriptionStartDate = new Date();

    // Safely determine periodValueInDays
    let periodValueInDays = subscription.periodValueInDays;

    // If coupon is applied (especially LIFE1 with 100% discount), set to 1 year
    const couponCode = subscriptionData.couponCode;
    const couponData = subscriptionData.couponData;
    if (couponCode && couponData) {
      const couponPercentage =
        couponData.percentage || couponData.precentage || 0;
      // If it's LIFE1 or 100% discount coupon, set to 1 year (365 days)
      if (couponCode.toUpperCase() === "LIFE1" || couponPercentage === 100) {
        periodValueInDays = 365;
      }
    }

    if (!periodValueInDays) {
      // Try to determine from periodName
      let periodNameStr = "";
      if (subscription.periodName) {
        if (typeof subscription.periodName === "string") {
          periodNameStr = subscription.periodName.toLowerCase();
        } else if (subscription.periodName.ar) {
          periodNameStr = String(subscription.periodName.ar).toLowerCase();
        } else if (subscription.periodName.en) {
          periodNameStr = String(subscription.periodName.en).toLowerCase();
        }
      }

      // Check if it's monthly
      if (periodNameStr.includes("شهري") || periodNameStr.includes("monthly")) {
        periodValueInDays = 30;
      } else {
        periodValueInDays = 365; // Default to annual
      }
    }

    const subscriptionEndDate = new Date(subscriptionStartDate);
    subscriptionEndDate.setDate(
      subscriptionEndDate.getDate() + periodValueInDays
    );

    // Validate finalCompanyId is not null/empty
    if (
      !finalCompanyId ||
      typeof finalCompanyId !== "string" ||
      finalCompanyId.trim() === ""
    ) {
      throw new Error("Invalid company ID");
    }

    // Get company document reference (use finalCompanyId which might be email or doc ID)
    const companyDocRef = doc(db, "companies", finalCompanyId);

    // Use transaction to ensure atomicity
    const result = await runTransaction(db, async (transaction) => {
      // 1. Read company document within transaction
      const companyDoc = await transaction.get(companyDocRef);

      if (!companyDoc.exists()) {
        throw new Error("Company not found");
      }

      const companyData = companyDoc.data();
      const currentBalance =
        companyData.balance || companyData.walletBalance || 0;

      // Verify sufficient balance (skip if total is 0 due to 100% discount)
      if (totalWithVAT > 0 && currentBalance < totalWithVAT) {
        throw new Error("Insufficient balance");
      }

      // Calculate new balance (only deduct if total > 0)
      const newBalance =
        totalWithVAT > 0 ? currentBalance - totalWithVAT : currentBalance;

      // 2. Create subscription payment document
      const subscriptionPaymentRef = doc(
        collection(db, "subscriptions-payment")
      );
      const subscriptionPaymentData: any = {
        company: {
          id: company.id || finalCompanyId,
          email: companyEmail || companyData.email || "",
          name:
            company.name ||
            company.brandName ||
            companyData.name ||
            companyData.brandName ||
            "",
        },
        selectedSubscription: {
          id: subscriptionId,
          title: subscription.title,
          description: subscription.description,
          status: subscription.status,
          price: subscription.price,
          options: subscription.options,
          periodName: subscription.periodName,
          periodValueInDays: periodValueInDays,
          logo: subscription.logo,
        },
        vehicleCount: vehicleCount,
        subscriptionStartDate: Timestamp.fromDate(subscriptionStartDate),
        subscriptionEndDate: Timestamp.fromDate(subscriptionEndDate),
        isPaid: true,
        price: subscription.price,
        totalPrice: totalWithVAT,
        vat: vat,
        createdDate: serverTimestamp(),
        createdUserId: currentUser.uid,
      };

      // Add coupon information if provided
      if (couponCode) {
        subscriptionPaymentData.couponCode = couponCode;
      }
      if (couponData) {
        subscriptionPaymentData.couponData = couponData;
      }

      transaction.set(subscriptionPaymentRef, subscriptionPaymentData);

      // 3. Create order document
      const orderRef = doc(collection(db, "orders"));
      const orderData: any = {
        companyUid: currentUser.uid,
        createdUserId: currentUser.uid,
        orderDate: serverTimestamp(),
        createdDate: serverTimestamp(),
        service: {
          title: {
            ar: "اشتراك",
            en: "Subscription",
          },
          desc: {
            ar: "اشتراك في باقة",
            en: "Subscription package",
          },
        },
        selectedOption: {
          name: {
            ar: subscription.title?.ar || subscription.title?.en || "اشتراك",
            en:
              subscription.title?.en ||
              subscription.title?.ar ||
              "Subscription",
          },
        },
        totalPrice: totalWithVAT,
        fuelCost: 0,
        deliveryFees: 0,
        status: "completed",
        subscriptionPaymentId: subscriptionPaymentRef.id,
      };

      // Add coupon information to order if provided
      if (couponCode) {
        orderData.couponCode = couponCode;
      }

      transaction.set(orderRef, orderData);

      // 4. Update company's balance, selectedSubscription, and maxCarNumber in one update
      transaction.update(companyDocRef, {
        balance: newBalance,
        selectedSubscription: {
          id: subscriptionId,
          title: subscription.title,
          description: subscription.description,
          status: subscription.status,
          price: subscription.price,
          options: subscription.options,
          periodName: subscription.periodName,
          periodValueInDays: periodValueInDays,
          logo: subscription.logo,
          createdDate: Timestamp.fromDate(subscriptionStartDate),
          vehicleCount: vehicleCount,
        },
        maxCarNumber: vehicleCount,
      });

      return {
        subscriptionPaymentId: subscriptionPaymentRef.id,
        orderId: orderRef.id,
      };
    });

    // 5. Generate invoice (outside transaction)
    const { generateInvoiceNumber, calculateVAT } = await import(
      "./invoiceService"
    );
    const invoiceNumber = await generateInvoiceNumber();
    const vatRate = 15;

    // Safely extract subscription title
    let subscriptionTitle = "اشتراك";
    if (subscription.title) {
      if (typeof subscription.title === "string") {
        subscriptionTitle = subscription.title;
      } else if (subscription.title.ar) {
        subscriptionTitle = subscription.title.ar;
      } else if (subscription.title.en) {
        subscriptionTitle = subscription.title.en;
      }
    }

    // Safely extract period name - use "شهري" for monthly, "سنوي" for yearly
    // PRIORITIZE periodValueInDays first, as it's the most reliable indicator
    let periodName = "سنوي"; // Default to yearly

    // First check periodValueInDays (most reliable)
    if (periodValueInDays === 30) {
      periodName = "شهري";
    } else if (periodValueInDays === 365 || periodValueInDays === 360) {
      periodName = "سنوي";
    } else if (subscription.periodName) {
      // Fallback to periodName string matching if periodValueInDays is not standard
      if (typeof subscription.periodName === "string") {
        const periodStr = subscription.periodName.toLowerCase();
        if (periodStr.includes("شهري") || periodStr.includes("monthly")) {
          periodName = "شهري";
        } else if (
          periodStr.includes("سنوي") ||
          periodStr.includes("yearly") ||
          periodStr.includes("annual")
        ) {
          periodName = "سنوي";
        } else {
          periodName = subscription.periodName;
        }
      } else if (subscription.periodName.ar) {
        const periodStr = String(subscription.periodName.ar).toLowerCase();
        if (periodStr.includes("شهري") || periodStr.includes("monthly")) {
          periodName = "شهري";
        } else if (
          periodStr.includes("سنوي") ||
          periodStr.includes("yearly") ||
          periodStr.includes("annual")
        ) {
          periodName = "سنوي";
        } else {
          periodName = subscription.periodName.ar;
        }
      } else if (subscription.periodName.en) {
        const periodStr = String(subscription.periodName.en).toLowerCase();
        if (periodStr.includes("monthly") || periodStr.includes("شهري")) {
          periodName = "شهري";
        } else if (
          periodStr.includes("yearly") ||
          periodStr.includes("annual") ||
          periodStr.includes("سنوي")
        ) {
          periodName = "سنوي";
        } else {
          periodName = subscription.periodName.en;
        }
      }
    }

    // Safely extract subscription description
    let subscriptionDescription = "اشتراك نظام إدارة الأسطول";
    if (subscription.description) {
      if (typeof subscription.description === "string") {
        subscriptionDescription = subscription.description;
      } else if (subscription.description.ar) {
        subscriptionDescription = subscription.description.ar;
      } else if (subscription.description.en) {
        subscriptionDescription = subscription.description.en;
      }
    }

    // Format dates for invoice
    const formatDateForInvoice = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const invoiceItem: any = {
      product: subscriptionTitle,
      quantity: 1,
      pricePerUnit: subscription.price || 0,
      amountBeforeTax: totalWithoutVAT,
      vat: vat,
      total: totalWithVAT,
      // Add subscription-specific fields
      packageName: subscriptionTitle,
      period: periodName, // "شهري" or "سنوي"
      periodValueInDays: periodValueInDays,
      startDate: formatDateForInvoice(subscriptionStartDate),
      endDate: formatDateForInvoice(subscriptionEndDate),
      description: subscriptionDescription, // Full plan description
    };

    // Get company data from transaction result or use passed company data
    const companyDocRefForInvoice = doc(db, "companies", finalCompanyId);
    const companyDocForInvoice = await getDoc(companyDocRefForInvoice);
    const companyDataForInvoice = companyDocForInvoice.exists()
      ? companyDocForInvoice.data()
      : company || {};

    const cleanCompanyData = Object.fromEntries(
      Object.entries(companyDataForInvoice).filter(
        ([_, v]) => v !== undefined && v !== null
      )
    );

    const invoiceData: any = {
      invoiceNumber,
      type: "Subscription",
      createdAt: Timestamp.fromDate(subscriptionStartDate),
      companyData: cleanCompanyData,
      orderId: result.orderId,
      items: [invoiceItem],
      subtotal: totalWithoutVAT,
      vatAmount: vat,
      total: totalWithVAT,
      subscriptionPaymentId: result.subscriptionPaymentId,
    };

    const invoicesRef = collection(db, "invoices");
    const invoiceDocRef = await addDoc(invoicesRef, invoiceData);

    console.log("✅ Subscription payment processed successfully");
    return {
      invoiceId: invoiceDocRef.id,
      subscriptionPaymentId: result.subscriptionPaymentId,
      orderId: result.orderId,
    };
  } catch (error) {
    console.error("❌ Error processing subscription payment:", error);
    throw error;
  }
};

export const createProductWithSchema = async (
  formFields: Record<string, any>,
  imageFile?: File | string | null
) => {
  try {
    let imageUrl: string | null = null;

    if (imageFile instanceof File) {
      const timestamp = Date.now();
      const storagePath = `products/${timestamp}-${imageFile.name}`;
      imageUrl = await uploadFileToStorage(imageFile, storagePath);
    } else if (typeof imageFile === "string" && imageFile.trim() !== "") {
      imageUrl = imageFile.trim();
    }

    const productsCollection = collection(db, "products");
    const snapshot = await getDocs(query(productsCollection, limit(1)));
    const sampleSchema = snapshot.empty ? {} : snapshot.docs[0].data();

    const combined: Record<string, any> = {};

    Object.keys(sampleSchema).forEach((key) => {
      if (key === "image") {
        combined[key] = imageUrl ?? null;
      } else if (Object.prototype.hasOwnProperty.call(formFields, key)) {
        combined[key] = formFields[key];
      } else {
        combined[key] = null;
      }
    });

    Object.entries(formFields).forEach(([key, value]) => {
      if (!Object.prototype.hasOwnProperty.call(combined, key)) {
        combined[key] = value;
      }
    });

    if (!Object.prototype.hasOwnProperty.call(combined, "image")) {
      combined.image = imageUrl;
    }

    if (
      Object.prototype.hasOwnProperty.call(combined, "createdDate") &&
      (combined.createdDate === null || combined.createdDate === undefined)
    ) {
      combined.createdDate = serverTimestamp();
    }

    // Generate unique 8-digit refid for product
    console.log("🔢 Generating unique 8-digit refid for product...");
    let refid: string = "";
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const randomCode = Math.floor(10000000 + Math.random() * 90000000);
      refid = randomCode.toString();
      const productsRefCheck = collection(db, "products");
      const qCheck = query(productsRefCheck, where("refid", "==", refid));
      const querySnapshot = await getDocs(qCheck);

      if (querySnapshot.empty) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique || !refid) {
      throw new Error("فشل في إنشاء كود المنتج. يرجى المحاولة مرة أخرى.");
    }

    console.log(`✅ Generated unique refid: ${refid}`);

    // Add refid to combined data
    combined.refid = refid;

    const productDocRef = doc(productsCollection);
    await setDoc(productDocRef, combined);

    return {
      id: productDocRef.id,
      data: combined,
    };
  } catch (error) {
    console.error("Error creating product document:", error);
    throw error;
  }
};

/**
 * Fetch all services from Firestore
 * @returns Promise with services data
 */
export const fetchServices = async (): Promise<any[]> => {
  try {
    console.log("📋 Fetching services from Firestore...");

    const servicesCollection = collection(db, "services");
    const q = query(servicesCollection, orderBy("createdDate", "desc"));
    const servicesSnapshot = await getDocs(q);

    const services = servicesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("✅ Fetched services:", services.length);
    return services;
  } catch (error) {
    console.error("❌ Error fetching services:", error);
    return [];
  }
};

/**
 * Fetch all services from Firestore (simple version without ordering)
 * @returns Promise with services data
 */
export const fetchAllServices = async (): Promise<any[]> => {
  try {
    console.log("📋 Fetching all services from Firestore (no ordering)...");

    const servicesCollection = collection(db, "services");
    const servicesSnapshot = await getDocs(servicesCollection);

    const services = servicesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Fetched ${services.length} services`);
    console.log("📦 Services data:", services);

    return services;
  } catch (error) {
    console.error("❌ Error fetching services:", error);
    throw error;
  }
};

/**
 * Fetch all categories from Firestore
 * @returns Promise with categories data
 */
export const fetchAllCategories = async (): Promise<any[]> => {
  try {
    console.log("📋 Fetching all categories from Firestore...");

    const categoriesCollection = collection(db, "categories");
    const categoriesSnapshot = await getDocs(categoriesCollection);

    const categories = categoriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Fetched ${categories.length} categories`);

    return categories;
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    throw error;
  }
};

/**
 * Fetch a single category by ID from Firestore
 * @param categoryId - Category document ID
 * @returns Promise with the category data or null if not found
 */
export const fetchCategoryById = async (
  categoryId: string
): Promise<any | null> => {
  try {
    if (!categoryId) {
      console.warn("⚠️ No categoryId provided to fetchCategoryById");
      return null;
    }

    const categoryRef = doc(db, "categories", categoryId);
    const snapshot = await getDoc(categoryRef);

    if (!snapshot.exists()) {
      console.warn(`⚠️ No category found with ID: ${categoryId}`);
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };
  } catch (error) {
    console.error("❌ Error fetching category by ID:", error);
    throw error;
  }
};

/**
 * Fetch subcategories for a given parent category ID
 * @param parentId - Parent category document ID
 * @returns Promise with array of subcategory documents
 */
export const fetchSubcategoriesByParentId = async (
  parentId: string
): Promise<any[]> => {
  try {
    if (!parentId) {
      console.warn("⚠️ No parentId provided to fetchSubcategoriesByParentId");
      return [];
    }

    const categoriesCollection = collection(db, "categories");
    const subcategoriesQuery = query(
      categoriesCollection,
      where("parentId", "==", parentId)
    );
    const snapshot = await getDocs(subcategoriesQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(
      `❌ Error fetching subcategories for parentId ${parentId}:`,
      error
    );
    throw error;
  }
};

/**
 * Fetch all countries from Firestore countries collection
 */
export const fetchAllCountries = async (): Promise<any[]> => {
  try {
    const countriesCollection = collection(db, "countries");
    const countriesQuery = query(
      countriesCollection,
      orderBy("createdDate", "desc")
    );
    const snapshot = await getDocs(countriesQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("❌ Error fetching countries:", error);
    throw error;
  }
};

/**
 * Fetch all cities from Firestore cities collection
 */
export const fetchAllCities = async (): Promise<any[]> => {
  try {
    const citiesCollection = collection(db, "cities");
    const snapshot = await getDocs(citiesCollection);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("❌ Error fetching cities:", error);
    throw error;
  }
};

/**
 * Fetch all areas from Firestore areas collection
 */
export const fetchAllAreas = async (): Promise<any[]> => {
  try {
    const areasCollection = collection(db, "areas");
    const snapshot = await getDocs(areasCollection);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("❌ Error fetching areas:", error);
    throw error;
  }
};

/**
 * Create a new country in Firestore countries collection
 * Ensures all standard fields are populated and preserves schema compatible with existing docs
 */
export const createCountry = async ({
  arabicName,
  englishName,
}: {
  arabicName: string;
  englishName: string;
}): Promise<{ id: string }> => {
  try {
    const currentUser = auth.currentUser;

    const countriesCollection = collection(db, "countries");

    const payload: Record<string, any> = {
      name: {
        ar: arabicName || null,
        en: englishName || null,
      },
      createdDate: serverTimestamp(),
      createdUserId: currentUser?.email ?? null,
    };

    const docRef = await addDoc(countriesCollection, payload);

    return { id: docRef.id };
  } catch (error) {
    console.error("❌ Error creating country:", error);
    throw error;
  }
};

/**
 * Delete a country from Firestore countries collection
 * @param countryId - Country document ID to delete
 * @returns Promise that resolves when deletion is complete
 */
export const deleteCountry = async (countryId: string): Promise<void> => {
  try {
    if (!countryId) {
      throw new Error("Country ID is required");
    }

    const countryDocRef = doc(db, "countries", countryId);
    await deleteDoc(countryDocRef);

    console.log(`✅ Country ${countryId} deleted successfully`);
  } catch (error) {
    console.error("❌ Error deleting country:", error);
    throw error;
  }
};

export const createCity = async ({
  countryId,
  countryNameAr,
  countryNameEn,
  cityNameAr,
  cityNameEn,
  latitude = 0,
  longitude = 0,
}: {
  countryId: string | null;
  countryNameAr: string | null;
  countryNameEn: string | null;
  cityNameAr: string;
  cityNameEn: string;
  latitude?: number;
  longitude?: number;
}): Promise<{ id: string }> => {
  try {
    const currentUser = auth.currentUser;
    const citiesCollection = collection(db, "cities");

    const timestamp = serverTimestamp();
    const creator = currentUser?.email ?? null;

    const countryMap: Record<string, any> = {
      id: countryId ?? null,
      name: {
        ar: countryNameAr ?? null,
        en: countryNameEn ?? null,
      },
      createdDate: timestamp,
      createdUserId: creator,
    };

    const payload: Record<string, any> = {
      country: countryMap,
      createdDate: timestamp,
      createdUserId: creator,
      latlng: {
        lat: latitude ?? 0,
        lng: longitude ?? 0,
      },
      name: {
        ar: cityNameAr || null,
        en: cityNameEn || null,
      },
      id: null,
    };

    const docRef = await addDoc(citiesCollection, payload);
    await updateDoc(docRef, { id: docRef.id });

    return { id: docRef.id };
  } catch (error) {
    console.error("❌ Error creating city:", error);
    throw error;
  }
};

export const createArea = async ({
  countryId,
  countryNameAr,
  countryNameEn,
  cityId,
  cityNameAr,
  cityNameEn,
  cityLatitude = 0,
  cityLongitude = 0,
  areaNameAr,
  areaNameEn,
}: {
  countryId: string | null;
  countryNameAr: string | null;
  countryNameEn: string | null;
  cityId: string | null;
  cityNameAr: string | null;
  cityNameEn: string | null;
  cityLatitude?: number;
  cityLongitude?: number;
  areaNameAr: string;
  areaNameEn: string;
}): Promise<{ id: string }> => {
  try {
    const currentUser = auth.currentUser;
    const areasCollection = collection(db, "areas");

    const timestamp = serverTimestamp();
    const creator = currentUser?.email ?? null;

    const countryMap: Record<string, any> = {
      id: countryId ?? null,
      name: {
        ar: countryNameAr ?? null,
        en: countryNameEn ?? null,
      },
      createdDate: timestamp,
      createdUserId: creator,
    };

    const cityMap: Record<string, any> = {
      id: cityId ?? null,
      name: {
        ar: cityNameAr ?? null,
        en: cityNameEn ?? null,
      },
      createdDate: timestamp,
      createdUserId: creator,
      latlng: {
        lat: cityLatitude ?? 0,
        lng: cityLongitude ?? 0,
      },
      country: countryMap,
    };

    const payload: Record<string, any> = {
      city: cityMap,
      country: countryMap,
      createdDate: timestamp,
      createdUserId: creator,
      name: {
        ar: areaNameAr || null,
        en: areaNameEn || null,
      },
      id: null,
    };

    const docRef = await addDoc(areasCollection, payload);
    await updateDoc(docRef, { id: docRef.id });

    return { id: docRef.id };
  } catch (error) {
    console.error("❌ Error creating area:", error);
    throw error;
  }
};
/**
 * Create a new category document in Firestore
 * Ensures all standard fields are included and preserves base structure
 */
export const createCategory = async ({
  arabicName,
  englishName,
  accountingSystemId,
  unitOfMeasurement,
  individualPrice,
  companyPrice,
  imageFile,
  parentCategoryId,
  categoryType = "essential",
}: {
  arabicName: string;
  englishName: string;
  accountingSystemId: string;
  unitOfMeasurement: string;
  individualPrice: string | number;
  companyPrice: string | number;
  imageFile?: File | null;
  parentCategoryId?: string | null;
  categoryType?: string;
}): Promise<{ id: string }> => {
  try {
    const currentUser = auth.currentUser;

    const categoriesCollection = collection(db, "categories");
    const randomRefId = Math.floor(100000000 + Math.random() * 900000000);

    let imageUrl: string | null = null;

    if (imageFile) {
      const storagePath = `categories/${Date.now()}_${imageFile.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }

    const hasParent =
      parentCategoryId !== undefined &&
      parentCategoryId !== null &&
      parentCategoryId !== "";

    const payload: Record<string, any> = {
      categoryTypeEnum: hasParent ? categoryType : "essential",
      createdDate: serverTimestamp(),
      createdUserEmail: currentUser?.email ?? null,
      createdUserId: currentUser?.uid ?? null,
      id: null,
      label: englishName || null,
      majorTypeEnum: unitOfMeasurement || null,
      name: {
        ar: arabicName || null,
        en: englishName || null,
      },
      onyxProductId: null,
      parentId: hasParent ? parentCategoryId : accountingSystemId || null,
      refId: randomRefId.toString(),
      individualPrice:
        individualPrice !== undefined && individualPrice !== null
          ? Number(individualPrice)
          : null,
      companyPrice:
        companyPrice !== undefined && companyPrice !== null
          ? Number(companyPrice)
          : null,
      image: imageUrl,
    };

    const docRef = await addDoc(categoriesCollection, payload);

    return { id: docRef.id };
  } catch (error) {
    console.error("❌ Error creating category:", error);
    throw error;
  }
};

/**
 * Get a single service by ID from Firestore
 * @param serviceId - Service document ID
 * @returns Promise with the service data
 */
export const getServiceById = async (serviceId: string): Promise<any> => {
  try {
    console.log("📋 Fetching service by ID:", serviceId);

    const serviceDocRef = doc(db, "services", serviceId);
    const serviceDoc = await getDoc(serviceDocRef);

    if (!serviceDoc.exists()) {
      throw new Error("Service not found");
    }

    const serviceData = {
      id: serviceDoc.id,
      ...serviceDoc.data(),
    };

    console.log("✅ Service fetched:", serviceData);
    return serviceData;
  } catch (error) {
    console.error("❌ Error fetching service:", error);
    throw error;
  }
};

/**
 * Add a new service to Firestore
 * @param serviceData - Service data to add
 * @returns Promise with the created service document
 */
export const addService = async (serviceData: any): Promise<any> => {
  try {
    console.log("📝 Adding new service to Firestore...", serviceData);

    const servicesCollection = collection(db, "services");

    // Prepare document with server timestamp
    const serviceDocument = {
      ...serviceData,
      createdDate: serverTimestamp(),
      ...(auth.currentUser?.email && {
        createdUserId: auth.currentUser.email,
      }),
    };

    // Add to Firestore
    const docRef = await addDoc(servicesCollection, serviceDocument);

    console.log("✅ Service added successfully with ID:", docRef.id);

    return {
      id: docRef.id,
      ...serviceDocument,
    };
  } catch (error) {
    console.error("❌ Error adding service to Firestore:", error);
    throw error;
  }
};

/**
 * Update a service in Firestore
 * @param serviceId - Service document ID
 * @param serviceData - Updated service data
 * @returns Promise with the updated service data
 */
export const updateService = async (
  serviceId: string,
  serviceData: any
): Promise<any> => {
  try {
    console.log("📝 Updating service in Firestore...", serviceId, serviceData);

    const serviceDocRef = doc(db, "services", serviceId);

    // Prepare update data (exclude id and Firestore metadata)
    const { id, ...updateData } = serviceData;

    await updateDoc(serviceDocRef, updateData);

    console.log("✅ Service updated successfully");

    return {
      id: serviceId,
      ...updateData,
    };
  } catch (error) {
    console.error("❌ Error updating service in Firestore:", error);
    throw error;
  }
};

/**
 * Fetch companies-wallets-requests data from Firestore
 * Filtered by requestedUser.email matching current user's email
 * Uses requestedUser.balance as old balance
 * @returns Promise with filtered wallet requests data
 */
export const fetchWalletChargeRequests = async () => {
  try {
    const requestsRef = collection(db, "companies-wallets-requests");
    const q = query(requestsRef, orderBy("createdDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    const allRequestsData: any[] = [];

    querySnapshot.forEach((doc) => {
      allRequestsData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    const currentUser = auth.currentUser;

    if (!currentUser) {
      return allRequestsData;
    }

    const userEmail = currentUser.email;

    const filteredRequests = allRequestsData.filter((request) => {
      const requestedUserEmail = request.requestedUser?.email;

      const emailMatch =
        requestedUserEmail &&
        userEmail &&
        requestedUserEmail.toLowerCase() === userEmail.toLowerCase();

      return emailMatch;
    });

    const enrichedRequests = filteredRequests.map((request) => ({
      ...request,
      oldBalance: request.requestedUser?.balance || 0,
    }));

    return enrichedRequests;
  } catch (error) {
    console.error("❌ Error fetching wallet charge requests:", error);
    throw error;
  }
};

/**
 * Add refid to existing wallet requests in wallets-requests collection
 * @returns Promise with count of updated documents
 */
export const addRefidToExistingAdminWalletRequests =
  async (): Promise<number> => {
    try {
      console.log(
        "🔄 Starting migration: Adding refid to existing admin wallet requests..."
      );

      const requestsRef = collection(db, "wallets-requests");
      const requestsSnapshot = await getDocs(requestsRef);
      console.log(`📦 Found ${requestsSnapshot.size} admin wallet requests`);

      let updatedCount = 0;
      const requestsToUpdate: Array<{ docRef: any; refid: string }> = [];

      // First pass: Identify requests without refid and generate refids
      for (const requestDoc of requestsSnapshot.docs) {
        const requestData = requestDoc.data();
        if (!requestData.refid) {
          const refid = generateRefId();
          const docRef = doc(db, "wallets-requests", requestDoc.id);
          requestsToUpdate.push({ docRef, refid });
        }
      }

      console.log(`📝 Found ${requestsToUpdate.length} requests without refid`);

      // Second pass: Update all documents in batch
      const updatePromises = requestsToUpdate.map(({ docRef, refid }) =>
        updateDoc(docRef, { refid }).catch((error) => {
          console.error(
            `❌ Error updating refid for wallet request ${docRef.id}:`,
            error
          );
          return null; // Return null for failed updates
        })
      );

      const results = await Promise.all(updatePromises);
      updatedCount = results.filter((result) => result !== null).length;

      console.log(
        `✅ Successfully updated ${updatedCount} admin wallet requests with refid`
      );
      return updatedCount;
    } catch (error) {
      console.error(
        "❌ Error adding refid to existing admin wallet requests:",
        error
      );
      throw error;
    }
  };

/**
 * Fetch admin wallet reports data from wallets-requests collection
 * - Checks if refid exists in each document
 * - If refid exists, uses it as operationNumber
 * - If refid doesn't exist, generates a unique 8-digit code and stores it in Firestore
 * @returns Promise with admin wallet reports data
 */
export const fetchAdminWalletReports = async () => {
  try {
    console.log("\n🔄 Fetching admin wallet reports from wallets-requests...");

    const requestsRef = collection(db, "wallets-requests");
    const q = query(requestsRef, orderBy("actionDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    const allRequestsData: any[] = [];
    const requestsToUpdate: Array<{ docRef: any; refid: string }> = [];

    const formatDate = (timestamp: any): string => {
      if (!timestamp) return "-";

      try {
        if (timestamp.toDate && typeof timestamp.toDate === "function") {
          return new Date(timestamp.toDate()).toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
        if (timestamp instanceof Date) {
          return timestamp.toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
        return new Date(timestamp).toLocaleString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (error) {
        return String(timestamp);
      }
    };

    // Process each document and check for refid
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docRef = doc(db, "wallets-requests", docSnap.id);

      // Check if refid exists, if not generate and store it
      let operationNumber = data.refid || data.refId; // Support both lowercase and camelCase
      if (!operationNumber) {
        // Generate unique refid
        operationNumber = generateRefId();
        // Store it for batch update
        requestsToUpdate.push({ docRef, refid: operationNumber });
      }

      allRequestsData.push({
        id: docSnap.id,
        date: formatDate(data.actionDate),
        clientType: data.requestedUser?.type || "-",
        clientName: data.requestedUser?.name || "-",
        operationNumber: operationNumber, // Use refid if exists, otherwise generated code
        operationType: "-",
        debit: data.value || "-",
        credit: "-",
        balance: data.requestedUser?.balance || "-",
        rawDate: data.actionDate,
      });
    });

    // Update documents that don't have refid (batch update in background)
    if (requestsToUpdate.length > 0) {
      console.log(
        `📝 Updating ${requestsToUpdate.length} documents with refid...`
      );
      // Update in background without blocking the return
      Promise.all(
        requestsToUpdate.map(({ docRef, refid }) =>
          updateDoc(docRef, { refid }).catch((error) => {
            console.error(
              `❌ Error updating refid for document ${docRef.id}:`,
              error
            );
            return null;
          })
        )
      )
        .then(() => {
          console.log(
            `✅ Updated ${requestsToUpdate.length} documents with refid`
          );
        })
        .catch((error) => {
          console.error("❌ Error in batch update:", error);
        });
    }

    console.log(
      `✅ Total admin wallet reports found: ${allRequestsData.length}`
    );
    return allRequestsData;
  } catch (error) {
    console.error("❌ Error fetching admin wallet reports:", error);
    throw error;
  }
};
/**
 * Fetch all companies-wallets-requests data for admin dashboard
 * @returns Promise with all wallet requests data
 */
export const fetchAllAdminWalletRequests = async () => {
  try {
    console.log(
      "\n🔄 Fetching admin wallet requests from companies-wallets-requests..."
    );

    const requestsRef = collection(db, "companies-wallets-requests");
    // Query by createdDate (new requests) or actionDate (old requests) - get all and sort
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(
      requestsRef
    );

    const allRequestsData: any[] = [];

    // Helper function to format Firestore timestamp
    const formatDate = (timestamp: any): string => {
      if (!timestamp) return "-";

      try {
        if (timestamp.toDate && typeof timestamp.toDate === "function") {
          return new Date(timestamp.toDate()).toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
        if (timestamp instanceof Date) {
          return timestamp.toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
        return new Date(timestamp).toLocaleString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (error) {
        return String(timestamp);
      }
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Determine the date to use (createdDate for new requests, actionDate for old ones)
      const dateToUse = data.createdDate || data.actionDate || data.requestDate;

      // Get status from correct location (data.status for new, data.requestedUser.status for old)
      const status = data.status || data.requestedUser?.status || "pending";

      // Get order type
      const orderType = data.type || "-";

      // Get responsible person (processedBy for new, actionUser for old)
      const responsible =
        data.processedBy?.name || data.actionUser?.name || "-";

      allRequestsData.push({
        id: doc.id,
        requestNumber: data.refid || doc.id, // رقم العملية
        clientName: data.requestedUser?.name || "-", // العميل
        orderType: orderType, // نوع الشحن
        oldBalance: data.requestedUser?.balance || "-", // الرصيد القديم
        addedBalance: data.value || "-", // الرصيد المضاف
        requestDate: formatDate(dateToUse), // تاريخ الانشاء
        status: status, // حالة الطلب
        responsible: responsible, // المسؤول
        rawDate: dateToUse, // For sorting
      });
    });

    // Sort by date descending (newest first)
    allRequestsData.sort((a, b) => {
      const dateA = a.rawDate?.toDate
        ? a.rawDate.toDate()
        : new Date(a.rawDate || 0);
      const dateB = b.rawDate?.toDate
        ? b.rawDate.toDate()
        : new Date(b.rawDate || 0);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(
      `✅ Total admin wallet requests found: ${allRequestsData.length}`
    );
    return allRequestsData;
  } catch (error) {
    console.error("❌ Error fetching admin wallet requests:", error);
    throw error;
  }
};

/**
 * Delete a wallet request from Firestore
 * @param requestId - The wallet request document ID
 * @returns Promise with boolean indicating success
 */
export const deleteWalletRequest = async (
  requestId: string
): Promise<boolean> => {
  try {
    console.log(`🗑️ Deleting wallet request from Firestore: ${requestId}`);

    // Verify the wallet request exists before deleting
    const requestDocRef = doc(db, "companies-wallets-requests", requestId);
    const requestDoc = await getDoc(requestDocRef);

    if (!requestDoc.exists()) {
      throw new Error("Wallet request not found");
    }

    // Delete the wallet request document
    await deleteDoc(requestDocRef);
    console.log(`✅ Successfully deleted wallet request from Firestore`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting wallet request:", error);
    throw error;
  }
};

/**
 * Add 8-digit refid to existing wallet requests that don't have one
 * @returns Promise with number of updated requests
 */
export const addRefidToExistingWalletRequests = async (): Promise<number> => {
  try {
    console.log(
      "🔄 Starting migration: Adding refid to existing wallet requests..."
    );

    const requestsRef = collection(db, "companies-wallets-requests");
    const requestsSnapshot = await getDocs(requestsRef);
    console.log(`📦 Found ${requestsSnapshot.size} wallet requests`);

    let updatedCount = 0;
    const requestsToUpdate: Array<{ docRef: any; refid: string }> = [];

    // First pass: Identify requests without refid and generate refids
    for (const requestDoc of requestsSnapshot.docs) {
      const requestData = requestDoc.data();

      // Skip if request already has refid
      if (requestData.refid) {
        console.log(
          `⏭️  Wallet request ${requestDoc.id} already has refid: ${requestData.refid}`
        );
        continue;
      }

      // Generate unique 8-digit refid
      let refid: string = "";
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 20;

      while (!isUnique && attempts < maxAttempts) {
        // Generate 8-digit number (10000000 to 99999999)
        const randomCode = Math.floor(10000000 + Math.random() * 90000000);
        refid = randomCode.toString();

        // Check if refid already exists in Firestore or in our pending updates
        const requestsRefCheck = collection(db, "companies-wallets-requests");
        const qCheck = query(requestsRefCheck, where("refid", "==", refid));
        const querySnapshot = await getDocs(qCheck);

        // Also check if this refid is already in our pending updates
        const isInPendingUpdates = requestsToUpdate.some(
          (item) => item.refid === refid
        );

        if (querySnapshot.empty && !isInPendingUpdates) {
          isUnique = true;
        } else {
          attempts++;
        }
      }

      if (!isUnique || !refid) {
        console.error(
          `❌ Failed to generate unique refid for wallet request ${requestDoc.id} after ${maxAttempts} attempts`
        );
        continue;
      }

      requestsToUpdate.push({
        docRef: doc(db, "companies-wallets-requests", requestDoc.id),
        refid: refid,
      });
      console.log(
        `✅ Generated refid ${refid} for wallet request ${requestDoc.id}`
      );
    }

    console.log(
      `📝 Updating ${requestsToUpdate.length} wallet requests with refid...`
    );
    for (const { docRef, refid } of requestsToUpdate) {
      try {
        await updateDoc(docRef, { refid: refid });
        updatedCount++;
        console.log(
          `✅ Updated wallet request ${docRef.id} with refid: ${refid}`
        );
      } catch (error) {
        console.error(`❌ Error updating wallet request ${docRef.id}:`, error);
      }
    }
    console.log(
      `✅ Migration completed: ${updatedCount} wallet requests updated with refid`
    );
    return updatedCount;
  } catch (error) {
    console.error("❌ Error in migration:", error);
    throw error;
  }
};

/**
 * Fetch all fuel delivery requests (توصيل الوقود) for admin dashboard
 * Filters by service.title.ar == "توصيل الوقود" or serviceId == "76WpaQ5NQs4TJUQJn6hV"
 * @returns Promise with all fuel delivery requests data
 */
export const fetchAdminFuelDeliveryRequests = async () => {
  try {
    console.log(
      "\n🔄 Fetching admin fuel delivery requests from orders collection..."
    );

    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    const allOrdersData: any[] = [];

    // Helper function to format Firestore timestamp
    const formatDate = (timestamp: any): string => {
      if (!timestamp) return "-";

      try {
        if (timestamp.toDate && typeof timestamp.toDate === "function") {
          return new Date(timestamp.toDate()).toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
        if (timestamp instanceof Date) {
          return timestamp.toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
        return new Date(timestamp).toLocaleString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (error) {
        return String(timestamp);
      }
    };

    // Filter for fuel delivery orders
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Check if this is a fuel delivery order
      const isFuelDelivery =
        data.service?.title?.ar === "توصيل الوقود" ||
        data.service?.title?.en === "Fuel Delivery" ||
        data.serviceId === "76WpaQ5NQs4TJUQJn6hV";

      if (isFuelDelivery) {
        // Extract fuel type from selectedOption
        let fuelType = "-";
        if (data.selectedOption?.title?.ar) {
          fuelType = data.selectedOption.title.ar;
        } else if (data.selectedOption?.title?.en) {
          fuelType = data.selectedOption.title.en;
        } else if (data.selectedOption?.name?.ar) {
          fuelType = data.selectedOption.name.ar;
        } else if (data.selectedOption?.name?.en) {
          fuelType = data.selectedOption.name.en;
        }

        // Extract delivery address from location
        let deliveryAddress = "-";
        if (data.location?.address) {
          deliveryAddress = data.location.address;
        } else if (data.address) {
          deliveryAddress = data.address;
        }

        allOrdersData.push({
          id: doc.id,
          requestNumber: data.refId || doc.id, // رقم العملية
          driverName: "-", // السائق الحالي
          driverType: "-", // نوع السائق
          fuelType: fuelType, // نوع الوقود
          quantity: data.totalLitre?.toString() || "0", // الكمية (لتر)
          deliveryAddress: deliveryAddress, // عنوان التوصيل
          requestDate: formatDate(data.orderDate), // تاريخ الطلب
          status: data.status || "-", // حالة الطلب
        });
      }
    });

    console.log(
      `✅ Total admin fuel delivery requests found: ${allOrdersData.length}`
    );
    return allOrdersData;
  } catch (error) {
    console.error("❌ Error fetching admin fuel delivery requests:", error);
    throw error;
  }
};

/**
 * Fetch pending fuel delivery requests (توصيل الوقود) for admin dashboard
 * Filters by service.title.ar == "توصيل الوقود" AND status == "pending"
 * @returns Promise with pending fuel delivery requests data
 */
export const fetchAdminReceivedDeliveryRequests = async () => {
  try {
    console.log(
      "\n🔄 Fetching admin pending delivery requests from orders collection..."
    );

    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    const allOrdersData: any[] = [];

    // Helper function to format Firestore timestamp
    const formatDate = (timestamp: any): string => {
      if (!timestamp) return "-";

      try {
        if (timestamp.toDate && typeof timestamp.toDate === "function") {
          return new Date(timestamp.toDate()).toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
        if (timestamp instanceof Date) {
          return timestamp.toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
        return new Date(timestamp).toLocaleString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (error) {
        return String(timestamp);
      }
    };

    // Filter for pending fuel delivery orders
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Check if this is a pending fuel delivery order
      const isFuelDelivery =
        data.service?.title?.ar === "توصيل الوقود" ||
        data.service?.title?.en === "Fuel Delivery" ||
        data.serviceId === "76WpaQ5NQs4TJUQJn6hV";
      const isPending = data.status === "pending";

      if (isFuelDelivery && isPending) {
        // Extract fuel type from selectedOption
        let fuelType = "-";
        if (data.selectedOption?.title?.ar) {
          fuelType = data.selectedOption.title.ar;
        } else if (data.selectedOption?.title?.en) {
          fuelType = data.selectedOption.title.en;
        } else if (data.selectedOption?.name?.ar) {
          fuelType = data.selectedOption.name.ar;
        } else if (data.selectedOption?.name?.en) {
          fuelType = data.selectedOption.name.en;
        }

        // Extract delivery address from location
        let deliveryAddress = "-";
        if (data.location?.address) {
          deliveryAddress = data.location.address;
        } else if (data.address) {
          deliveryAddress = data.address;
        }

        allOrdersData.push({
          id: doc.id,
          requestNumber: data.refId || doc.id, // رقم الطلب
          fuelType: fuelType, // نوع الوقود
          driverType: "-", // نوع الموقع
          quantity: data.totalLitre?.toString() || "0", // الكمية المطلوبة (لتر)
          deliveryAddress: deliveryAddress, // عنوان التوصيل
          requestDate: formatDate(data.orderDate), // تاريخ الطلب
        });
      }
    });

    console.log(
      `✅ Total admin pending delivery requests found: ${allOrdersData.length}`
    );
    return allOrdersData;
  } catch (error) {
    console.error("❌ Error fetching admin pending delivery requests:", error);
    throw error;
  }
};

/**
 * Fetch a single order by ID from Firestore
 * @param orderId - The ID of the order to fetch
 * @returns Promise with the order data
 */
export const fetchOrderById = async (orderId: string) => {
  try {
    console.log(`🔄 Fetching order with ID: ${orderId}`);

    const orderRef = doc(db, "orders", orderId);
    const orderSnapshot = await getDoc(orderRef);

    if (!orderSnapshot.exists()) {
      console.error("❌ Order not found:", orderId);
      throw new Error("Order not found");
    }

    const orderData = {
      id: orderSnapshot.id,
      ...orderSnapshot.data(),
    };

    console.log("✅ Order fetched successfully:", orderData.id);
    return orderData;
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    throw error;
  }
};

/**
 * Update order status in Firestore
 * @param orderId - The ID of the order to update
 * @param newStatus - The new status to set (e.g., "done", "cancelled")
 * @returns Promise with success boolean
 */
export const updateOrderStatus = async (orderId: string, newStatus: string) => {
  try {
    console.log(`🔄 Updating order ${orderId} status to: ${newStatus}`);

    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: newStatus,
    });

    console.log(`✅ Order ${orderId} status updated to: ${newStatus}`);
    return true;
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    throw error;
  }
};

/**
 * Determine user role and redirect path based on email presence in Firestore collections
 * @param email - User's email address
 * @returns Object with redirectPath and userType, or null if not found
 */
export const determineUserRoleAndRedirect = async (
  email: string
): Promise<{
  redirectPath: string;
  userType: string;
  userData?: any;
} | null> => {
  try {
    if (!email) {
      console.error("No email provided to determineUserRoleAndRedirect");
      return null;
    }

    console.log(`🔍 Checking user role for email: ${email}`);

    // 1. Check if email exists in companies collection
    const companiesRef = collection(db, "companies");
    const companiesQuery = query(companiesRef, where("email", "==", email));
    const companiesSnapshot = await getDocs(companiesQuery);

    if (!companiesSnapshot.empty) {
      const companyData = {
        id: companiesSnapshot.docs[0].id,
        ...companiesSnapshot.docs[0].data(),
      };
      console.log("✅ User found in companies collection → /dashboard");
      return {
        redirectPath: "/dashboard",
        userType: "company",
        userData: companyData,
      };
    }

    // 2. Check if email exists in users collection with admin privileges
    const usersRef = collection(db, "users");
    const usersQuery = query(usersRef, where("email", "==", email));
    const usersSnapshot = await getDocs(usersQuery);

    if (!usersSnapshot.empty) {
      const userData = usersSnapshot.docs[0].data();
      const isAdmin =
        userData.isAdmin === true || userData.isSuperAdmin === true;

      if (isAdmin) {
        console.log(
          "✅ Admin user found in users collection → /admin-dashboard"
        );
        return {
          redirectPath: "/admin-dashboard",
          userType: "admin",
          userData: {
            id: usersSnapshot.docs[0].id,
            ...userData,
          },
        };
      } else {
        console.log("⚠️ User found in users collection but not an admin");
      }
    }

    // 3. Check if email exists in stationscompany collection
    const stationsCompanyRef = collection(db, "stationscompany");
    const stationsCompanyQuery = query(
      stationsCompanyRef,
      where("email", "==", email)
    );
    const stationsCompanySnapshot = await getDocs(stationsCompanyQuery);

    if (!stationsCompanySnapshot.empty) {
      const stationData = {
        id: stationsCompanySnapshot.docs[0].id,
        ...stationsCompanySnapshot.docs[0].data(),
      };
      console.log(
        "✅ User found in stationscompany collection → /service-distributer"
      );
      return {
        redirectPath: "/service-distributer",
        userType: "service-distributer",
        userData: stationData,
      };
    }

    // If not found in any collection
    console.warn(`⚠️ Email ${email} not found in any authorized collection`);
    return null;
  } catch (error) {
    console.error("❌ Error determining user role:", error);
    return null;
  }
};
/**
 * Fetch current company data from Firestore companies collection
 * @returns Promise with the current company data
 */
export const fetchCurrentCompany = async (): Promise<any> => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      // console.log('No user is currently logged in.');
      return null;
    }

    // console.log('\n🏢 ========================================');
    // console.log('📊 FETCHING CURRENT COMPANY DATA');
    // console.log('========================================');
    // console.log('👤 Current User Email:', currentUser.email);
    // console.log('🆔 Current User UID:', currentUser.uid);
    // console.log('========================================\n');

    const companiesRef = collection(db, "companies");

    // Try to find company by UID first
    const qByUid = query(companiesRef, where("uid", "==", currentUser.uid));
    let querySnapshot = await getDocs(qByUid);

    // If not found by UID, try by email
    if (querySnapshot.empty && currentUser.email) {
      // console.log('No company found by UID, trying email...');
      const qByEmail = query(
        companiesRef,
        where("email", "==", currentUser.email)
      );
      querySnapshot = await getDocs(qByEmail);
    }

    // If still not found, try by createdUserId
    if (querySnapshot.empty && currentUser.email) {
      // console.log('No company found by email, trying createdUserId...');
      const qByCreatedUserId = query(
        companiesRef,
        where("createdUserId", "==", currentUser.email)
      );
      querySnapshot = await getDocs(qByCreatedUserId);
    }

    if (querySnapshot.empty) {
      // console.log('❌ No company document found for this user.');
      return null;
    }

    // Get the first matching document
    const companyDoc = querySnapshot.docs[0];
    const companyData = {
      id: companyDoc.id,
      ...companyDoc.data(),
    } as any;

    // console.log('\n✅ CURRENT COMPANY DATA FOUND:');
    // console.log('========================================');
    // console.log('🏢 Company ID:', companyData.id);
    // console.log('📧 Email:', companyData.email);
    // console.log('🏭 Brand Name:', companyData.brandName || companyData.name);
    // console.log('📞 Phone:', companyData.phoneNumber);
    // console.log('💰 Balance:', companyData.balance);
    // console.log('✅ Active:', companyData.isActive);
    // console.log('========================================');

    // console.log('\n📋 COMPLETE COMPANY DATA (All Fields):');
    // console.log('========================================');
    // console.dir(companyData, { depth: null, colors: true });
    // console.log('========================================\n');

    // Print specific important fields
    // console.log('🔑 KEY COMPANY INFORMATION:');
    // console.log('========================================');
    // console.log('Name:', companyData.name);
    // console.log('Brand Name:', companyData.brandName);
    // console.log('Email:', companyData.email);
    // console.log('Phone Number:', companyData.phoneNumber);
    // console.log('Balance:', companyData.balance);
    // console.log('Address:', companyData.address);
    // console.log('Location:', companyData.location);
    // console.log('Commercial Registration Number:', companyData.commercialRegistrationNumber);
    // console.log('VAT Number:', companyData.vatNumber);
    // console.log('Is Active:', companyData.isActive);
    // console.log('Status:', companyData.status);
    // console.log('========================================\n');

    // Print nested objects separately for clarity
    // if (companyData.formattedLocation) {
    //   console.log('📍 FORMATTED LOCATION:');
    //   console.log('========================================');
    //   console.dir(companyData.formattedLocation, { depth: null, colors: true });
    //   console.log('========================================\n');
    // }

    // if (companyData.selectedSubscription) {
    //   console.log('📦 SELECTED SUBSCRIPTION:');
    //   console.log('========================================');
    //   console.dir(companyData.selectedSubscription, { depth: null, colors: true });
    //   console.log('========================================\n');
    // }

    // if (companyData.tokens && companyData.tokens.length > 0) {
    //   console.log('🔐 DEVICE TOKENS:');
    //   console.log('========================================');
    //   console.log('Total Tokens:', companyData.tokens.length);
    //   companyData.tokens.forEach((token: any, index: number) => {
    //     console.log(`\nToken ${index + 1}:`);
    //     console.log('  Device Type:', token.deviceType);
    //     console.log('  App Version:', token.appVersion);
    //     console.log('  Last Updated:', token.lastUpdated);
    //   });
    //   console.log('========================================\n');
    // }

    // Print file URLs
    // console.log('📎 COMPANY FILES & DOCUMENTS:');
    // console.log('========================================');
    // console.log('Logo:', companyData.logo);
    // console.log('Address File:', companyData.addressFile);
    // console.log('Commercial Registration:', companyData.commercialRegistration);
    // console.log('Tax Certificate:', companyData.taxCertificate);
    // console.log('========================================\n');

    return companyData;
  } catch (error) {
    console.error("❌ Error fetching current company:", error);
    throw error;
  }
};

/**
 * Fetch ALL clients from Firestore (for admin dashboard)
 * @returns Promise with all clients data
 */
export const fetchAllClients = async (): Promise<any[]> => {
  try {
    console.log("\n👥 ========================================");
    console.log("FETCHING ALL CLIENTS DATA FROM FIRESTORE");
    console.log("========================================");

    const clientsRef = collection(db, "clients");
    const q = query(clientsRef, orderBy("createdDate", "desc"));
    const querySnapshot = await getDocs(q);

    console.log(`📊 Query snapshot size: ${querySnapshot.size}`);
    console.log(`📊 Query snapshot empty: ${querySnapshot.empty}`);

    const clientsData: any[] = [];

    querySnapshot.forEach((doc) => {
      const clientData: any = {
        id: doc.id,
        ...doc.data(),
      };
      clientsData.push(clientData);

      // Log each client's key fields
      console.log(`\n👤 Client ${clientsData.length}:`);
      console.log(`  - ID: ${clientData.id}`);
      console.log(`  - Name: ${clientData.name || "N/A"}`);
      console.log(`  - Email: ${clientData.email || "N/A"}`);
      console.log(`  - Phone: ${clientData.phoneNumber || "N/A"}`);
      console.log(`  - UID: ${clientData.uid || "N/A"}`);
      console.log(`  - IsActive: ${clientData.isActive}`);
      console.log(`  - CreatedDate: ${clientData.createdDate || "N/A"}`);
    });

    console.log(`\n✅ TOTAL CLIENTS FETCHED: ${clientsData.length}`);

    if (clientsData.length === 0) {
      console.log("⚠️ WARNING: No clients found in the collection!");
      console.log("🔍 Checking if 'clients' collection exists...");
    }

    return clientsData;
  } catch (error) {
    console.error("❌ Error fetching all clients:", error);
    console.error("Error details:", error);
    throw error;
  }
};

/**
 * Calculate total wallet balance from all clients
 * @returns Promise with total balance sum
 */
export const getTotalClientsBalance = async (): Promise<number> => {
  try {
    const clients = await fetchAllClients();

    const totalBalance = clients.reduce((sum, client) => {
      const balance = parseFloat(client.balance) || 0;
      return sum + balance;
    }, 0);

    console.log(`💰 Total clients wallet balance: ${totalBalance.toFixed(2)}`);
    return totalBalance;
  } catch (error) {
    console.error("❌ Error calculating total clients balance:", error);
    return 0;
  }
};

/**
 * Fetch ALL orders from Firestore (for admin dashboard - no filtering)
 * @returns Promise with all orders data
 */
export const fetchAllOrders = async (): Promise<any[]> => {
  try {
    console.log("\n📦 Fetching ALL orders data from Firestore...");

    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot = await getDocs(q);

    const allOrdersData: any[] = [];

    querySnapshot.forEach((doc) => {
      allOrdersData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`✅ Fetched ${allOrdersData.length} orders`);
    return allOrdersData;
  } catch (error) {
    console.error("❌ Error fetching all orders:", error);
    throw error;
  }
};

export type EssentialCategoryKey =
  | "batteries"
  | "wheels"
  | "oils"
  | "fuels"
  | "carCare";

export interface EssentialCategorySalesDataset {
  key: EssentialCategoryKey;
  label: string;
  data: number[];
}

export interface EssentialCategoryTimeseries {
  labels: string[];
  datasets: EssentialCategorySalesDataset[];
}

export interface EssentialCategorySalesTrends {
  last12Months: EssentialCategoryTimeseries;
  last30Days: EssentialCategoryTimeseries;
  last7Days: EssentialCategoryTimeseries;
}

export const ESSENTIAL_CATEGORY_LABELS: Record<EssentialCategoryKey, string> = {
  batteries: "بطاريات",
  wheels: "إطارات",
  oils: "زيوت",
  fuels: "وقـــــــــود",
  carCare: "غســـــيل",
};

const ESSENTIAL_CATEGORY_ORDER: EssentialCategoryKey[] = [
  "batteries",
  "wheels",
  "oils",
  "fuels",
  "carCare",
];

const normalizeIdentifier = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value.toString();
  }
  if (typeof value === "object") {
    if (typeof value.id === "string" && value.id.trim().length) return value.id;
    if (typeof value.id === "number" && !Number.isNaN(value.id))
      return value.id.toString();
    if (typeof value._keyPath === "string" && value._keyPath.trim().length)
      return value._keyPath;
    if (typeof value.path === "string" && value.path.trim().length)
      return value.path;
  }
  return null;
};

const ARABIC_DIACRITICS_REGEX =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;

const normalizeTextValue = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return null;

  const stringValue = String(value).trim();
  if (!stringValue.length) return null;

  const lower = stringValue.toLowerCase();
  const withoutDiacritics = lower
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(ARABIC_DIACRITICS_REGEX, "")
    .replace(/أ|إ|آ|ٱ/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");

  const cleaned = withoutDiacritics
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length ? cleaned : null;
};

const splitAndAppendFragments = (
  raw: string,
  target: Set<string>,
  minLength: number = 2
) => {
  const fragments = raw
    .split(/[/|,؛؛،\-]+/)
    .map((fragment) => fragment.trim())
    .filter((fragment) => fragment.length >= minLength);

  fragments.forEach((fragment) => target.add(fragment));
};

const collectCategoryNames = (category: any): Set<string> => {
  const names = new Set<string>();
  const add = (value: any) => {
    const normalized = normalizeTextValue(value);
    if (!normalized) return;
    names.add(normalized);
    if (normalized.includes(" ")) {
      splitAndAppendFragments(normalized, names);
    }
  };

  add(category?.name);
  add(category?.name?.ar);
  add(category?.name?.en);
  add(category?.englishName);
  add(category?.arabicName);
  add(category?.label);
  add(category?.title);
  add(category?.title?.ar);
  add(category?.title?.en);
  add(category?.categoryTypeEnum);
  add(category?.majorTypeEnum);
  add(category?.displayName);
  add(category?.displayNameAr);
  add(category?.displayNameEn);
  add(category?.shortName);
  add(category?.slug);
  add(category?.code);
  add(category?.type);
  add(category?.serviceType);

  if (Array.isArray(category?.keywords)) {
    category.keywords.forEach(add);
  }
  if (Array.isArray(category?.tags)) {
    category.tags.forEach(add);
  }

  return names;
};

interface EssentialCategoryMeta {
  label: string;
  ids: Set<string>;
  names: Set<string>;
  synonyms: Set<string>;
}

const baseEssentialSynonyms: Record<EssentialCategoryKey, string[]> = {
  batteries: [
    "battery",
    "batteries",
    "battaries",
    "بطاريه",
    "بطارية",
    "بطاريات",
    "battery change",
    "battery replacement",
  ],
  wheels: [
    "wheel",
    "wheels",
    "tire",
    "tires",
    "tyre",
    "tyres",
    "كفر",
    "كفرات",
    "اطار",
    "اطارات",
    "اطار ات",
    "إطار",
    "إطارات",
    "wheel alignment",
  ],
  oils: [
    "oil",
    "oils",
    "engine oil",
    "motor oil",
    "lubricant",
    "lubricants",
    "زيت",
    "زيوت",
    "تغيير زيت",
  ],
  fuels: [
    "fuel",
    "fuels",
    "gas",
    "gasoline",
    "diesel",
    "بنزين",
    "محروقات",
    "وقود",
    "تعبئة وقود",
    "fuel delivery",
  ],
  carCare: [
    "car care",
    "carcare",
    "car wash",
    "wash",
    "washing",
    "detailing",
    "cleaning",
    "غسيل",
    "تنظيف",
    "بوليش",
  ],
};

const generateMonthRange = (length: number, reference: Date): Date[] => {
  const months: Date[] = [];
  for (let offset = length - 1; offset >= 0; offset--) {
    months.push(
      new Date(reference.getFullYear(), reference.getMonth() - offset, 1)
    );
  }
  return months;
};

const generateDayRange = (length: number, reference: Date): Date[] => {
  const days: Date[] = [];
  for (let offset = length - 1; offset >= 0; offset--) {
    const date = new Date(
      reference.getFullYear(),
      reference.getMonth(),
      reference.getDate() - offset
    );
    days.push(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
  }
  return days;
};

const formatMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat("en", { month: "short" }).format(date);

const formatDayLabel = (date: Date) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    date
  );

const formatMonthKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}`;

const formatDayKey = (date: Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

const roundValue = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const addOrderStringValues = (collector: Set<string>, value: any) => {
  const normalized = normalizeTextValue(value);
  if (!normalized) return;
  collector.add(normalized);
  if (normalized.includes(" ")) {
    splitAndAppendFragments(normalized, collector);
  }
};

const extractNumericValue = (candidates: any[]): number => {
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) continue;
    const parsed = parseFloat(String(candidate).replace(/,/g, ""));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return 0;
};

const getOrderDate = (order: any): Date | null => {
  const candidates = [
    order?.orderDate,
    order?.createdDate,
    order?.createdAt,
    order?.createdTime,
    order?.date,
    order?.timestamp,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate.toDate === "function") {
      try {
        const date = candidate.toDate();
        if (date instanceof Date && !Number.isNaN(date.getTime())) {
          return date;
        }
      } catch (err) {
        console.warn("⚠️ Failed to convert Firestore timestamp to date:", err);
      }
    } else if (candidate instanceof Date) {
      if (!Number.isNaN(candidate.getTime())) return candidate;
    } else if (typeof candidate === "number") {
      const date = new Date(candidate);
      if (!Number.isNaN(date.getTime())) return date;
    } else if (typeof candidate === "string") {
      const date = new Date(candidate);
      if (!Number.isNaN(date.getTime())) return date;
    } else if (candidate?.seconds) {
      const date = new Date(candidate.seconds * 1000);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }

  return null;
};

export interface EssentialCategorySalesTrendsInput {
  categories?: any[];
  orders?: any[];
}

export const getEssentialCategorySalesTrends = async (
  input?: EssentialCategorySalesTrendsInput
): Promise<EssentialCategorySalesTrends> => {
  const now = new Date();
  const monthRange = generateMonthRange(12, now);
  const dayRange30 = generateDayRange(30, now);
  const dayRange7 = generateDayRange(7, now);

  const emptyTimeseries = (
    dates: Date[],
    labelFormatter: (date: Date) => string
  ): EssentialCategoryTimeseries => ({
    labels: dates.map(labelFormatter),
    datasets: ESSENTIAL_CATEGORY_ORDER.map((key) => ({
      key,
      label: ESSENTIAL_CATEGORY_LABELS[key],
      data: new Array(dates.length).fill(0),
    })),
  });

  try {
    const [categories, orders] = await Promise.all([
      input?.categories
        ? Promise.resolve(input.categories)
        : fetchAllCategories(),
      input?.orders ? Promise.resolve(input.orders) : fetchAllOrders(),
    ]);

    const categoryInfo = new Map<
      string,
      { id: string; parentId: string | null; names: Set<string> }
    >();
    const childrenByParent = new Map<string, string[]>();

    categories.forEach((category) => {
      const id =
        normalizeIdentifier(category?.id) ??
        normalizeIdentifier(category?.categoryId) ??
        normalizeIdentifier(category?.refId);
      if (!id) return;

      const parentId =
        normalizeIdentifier(category?.parentId) ??
        normalizeIdentifier(category?.parentCategoryId) ??
        normalizeIdentifier(category?.parent?.id) ??
        normalizeIdentifier(category?.parentCategory?.id) ??
        normalizeIdentifier(category?.parentRef?.id);

      const names = collectCategoryNames(category);

      categoryInfo.set(id, { id, parentId, names });

      if (parentId) {
        const existingChildren = childrenByParent.get(parentId) ?? [];
        existingChildren.push(id);
        childrenByParent.set(parentId, existingChildren);
      }
    });

    const essentialMeta = new Map<
      EssentialCategoryKey,
      EssentialCategoryMeta
    >();

    ESSENTIAL_CATEGORY_ORDER.forEach((key) => {
      const synonyms = new Set<string>();
      const names = new Set<string>();
      const labelNormalized = normalizeTextValue(
        ESSENTIAL_CATEGORY_LABELS[key]
      );
      if (labelNormalized) synonyms.add(labelNormalized);
      baseEssentialSynonyms[key].forEach((synonym) => {
        const normalized = normalizeTextValue(synonym);
        if (normalized) {
          synonyms.add(normalized);
          if (normalized.includes(" ")) {
            splitAndAppendFragments(normalized, synonyms);
          }
        }
      });

      essentialMeta.set(key, {
        label: ESSENTIAL_CATEGORY_LABELS[key],
        ids: new Set<string>(),
        names,
        synonyms,
      });
    });

    const categoryMatchesEssential = (
      categoryNames: Set<string>,
      synonyms: Set<string>
    ): boolean => {
      for (const name of categoryNames) {
        if (!name) continue;
        for (const synonym of synonyms) {
          if (!synonym) continue;
          if (
            name === synonym ||
            name.includes(synonym) ||
            synonym.includes(name)
          ) {
            return true;
          }
        }
      }
      return false;
    };

    categoryInfo.forEach((info) => {
      ESSENTIAL_CATEGORY_ORDER.forEach((key) => {
        const meta = essentialMeta.get(key);
        if (!meta) return;
        if (categoryMatchesEssential(info.names, meta.synonyms)) {
          meta.ids.add(info.id);
        }
      });
    });

    ESSENTIAL_CATEGORY_ORDER.forEach((key) => {
      const meta = essentialMeta.get(key);
      if (!meta) return;
      const visited = new Set<string>();
      const queue = Array.from(meta.ids);

      while (queue.length) {
        const currentId = queue.shift();
        if (!currentId || visited.has(currentId)) continue;
        visited.add(currentId);

        const info = categoryInfo.get(currentId);
        if (!info) continue;

        info.names.forEach((name) => {
          meta.names.add(name);
          meta.synonyms.add(name);
        });

        const children = childrenByParent.get(currentId) ?? [];
        children.forEach((childId) => {
          if (!meta.ids.has(childId)) {
            meta.ids.add(childId);
          }
          queue.push(childId);
        });
      }
    });

    const monthKeyToIndex = new Map<string, number>();
    monthRange
      .map(formatMonthKey)
      .forEach((key, index) => monthKeyToIndex.set(key, index));

    const day30KeyToIndex = new Map<string, number>();
    dayRange30
      .map(formatDayKey)
      .forEach((key, index) => day30KeyToIndex.set(key, index));

    const day7KeyToIndex = new Map<string, number>();
    dayRange7
      .map(formatDayKey)
      .forEach((key, index) => day7KeyToIndex.set(key, index));

    const monthlyTotals = new Map<EssentialCategoryKey, number[]>();
    const day30Totals = new Map<EssentialCategoryKey, number[]>();
    const day7Totals = new Map<EssentialCategoryKey, number[]>();

    ESSENTIAL_CATEGORY_ORDER.forEach((key) => {
      monthlyTotals.set(key, new Array(monthRange.length).fill(0));
      day30Totals.set(key, new Array(dayRange30.length).fill(0));
      day7Totals.set(key, new Array(dayRange7.length).fill(0));
    });

    const determineEssentialCategory = (
      order: any
    ): EssentialCategoryKey | null => {
      const idCandidates = new Set<string>();
      const nameCandidates = new Set<string>();

      const addIdCandidate = (value: any) => {
        const normalized = normalizeIdentifier(value);
        if (normalized) idCandidates.add(normalized);
      };

      const addNameCandidate = (value: any) =>
        addOrderStringValues(nameCandidates, value);

      addIdCandidate(order?.categoryId);
      addIdCandidate(order?.category?.id);
      addIdCandidate(order?.category?.categoryId);
      addIdCandidate(order?.category?.refId);
      addIdCandidate(order?.category?.categoryRefId);

      const categoryIdsArray = Array.isArray(order?.categoryIds)
        ? order.categoryIds
        : Array.isArray(order?.categories)
        ? order.categories
        : [];
      categoryIdsArray.forEach(addIdCandidate);

      addIdCandidate(order?.selectedOption?.categoryId);
      addIdCandidate(order?.selectedOption?.category?.id);
      addIdCandidate(order?.selectedOption?.category?.categoryId);
      addIdCandidate(order?.selectedOption?.id);

      addIdCandidate(order?.service?.categoryId);
      addIdCandidate(order?.service?.category?.id);
      addIdCandidate(order?.service?.category?.categoryId);

      addIdCandidate(order?.product?.categoryId);

      const addObjectNames = (obj: any) => {
        if (!obj) return;
        if (typeof obj === "string" || typeof obj === "number") {
          addNameCandidate(obj);
          return;
        }
        addNameCandidate(obj?.name);
        addNameCandidate(obj?.name?.ar);
        addNameCandidate(obj?.name?.en);
        addNameCandidate(obj?.label);
        addNameCandidate(obj?.title);
        addNameCandidate(obj?.title?.ar);
        addNameCandidate(obj?.title?.en);
        addNameCandidate(obj?.category);
        addNameCandidate(obj?.category?.ar);
        addNameCandidate(obj?.category?.en);
        addNameCandidate(obj?.type);
        addNameCandidate(obj?.serviceType);
      };

      addObjectNames(order?.category);
      addObjectNames(order?.category?.name);
      addObjectNames(order?.service);
      addObjectNames(order?.service?.category);
      addObjectNames(order?.service?.title);
      addObjectNames(order?.selectedOption);
      addObjectNames(order?.selectedOption?.category);
      addObjectNames(order?.selectedOption?.title);
      addObjectNames(order?.selectedOption?.name);

      addNameCandidate(order?.categoryName);
      addNameCandidate(order?.categoryLabel);
      addNameCandidate(order?.categoryType);
      addNameCandidate(order?.type);
      addNameCandidate(order?.serviceType);
      addNameCandidate(order?.productType);
      addNameCandidate(order?.fuelType);
      addNameCandidate(order?.orderType);
      addNameCandidate(order?.serviceName);
      addNameCandidate(order?.selectedOption?.label);

      for (const key of ESSENTIAL_CATEGORY_ORDER) {
        const meta = essentialMeta.get(key);
        if (!meta) continue;

        const hasIdMatch = Array.from(idCandidates).some((id) =>
          meta.ids.has(id)
        );
        if (hasIdMatch) return key;

        const hasNameMatch = Array.from(nameCandidates).some((name) => {
          if (!name) return false;
          if (meta.names.has(name)) return true;
          for (const synonym of meta.synonyms) {
            if (!synonym) continue;
            if (
              name === synonym ||
              name.includes(synonym) ||
              synonym.includes(name)
            ) {
              return true;
            }
          }
          return false;
        });

        if (hasNameMatch) return key;
      }

      return null;
    };

    const startOfDay = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate());

    orders.forEach((order) => {
      const essentialKey = determineEssentialCategory(order);
      if (!essentialKey) {
        return;
      }

      const orderDate = getOrderDate(order);
      if (!orderDate) return;

      const normalizedDate = startOfDay(orderDate);
      const monthKey = formatMonthKey(normalizedDate);
      const dayKey = formatDayKey(normalizedDate);

      const monthIndex = monthKeyToIndex.get(monthKey);
      const day30Index = day30KeyToIndex.get(dayKey);
      const day7Index = day7KeyToIndex.get(dayKey);

      if (
        monthIndex === undefined &&
        day30Index === undefined &&
        day7Index === undefined
      ) {
        return;
      }

      const amount = extractNumericValue([
        order?.totalCost,
        order?.totalPrice,
        order?.price,
        order?.amount,
        order?.grandTotal,
        order?.total,
        order?.paymentAmount,
        order?.paidAmount,
        order?.totalOrderPrice,
      ]);

      const fallbackQuantity = extractNumericValue([
        order?.totalLitre,
        order?.totalLiter,
        order?.quantity,
        order?.selectedOption?.quantity,
        order?.liters,
        order?.litres,
        order?.count,
      ]);

      const value = amount > 0 ? amount : fallbackQuantity;
      if (value <= 0) return;

      if (monthIndex !== undefined) {
        const totals = monthlyTotals.get(essentialKey);
        if (totals) totals[monthIndex] += value;
      }

      if (day30Index !== undefined) {
        const totals = day30Totals.get(essentialKey);
        if (totals) totals[day30Index] += value;
      }

      if (day7Index !== undefined) {
        const totals = day7Totals.get(essentialKey);
        if (totals) totals[day7Index] += value;
      }
    });

    const buildDatasets = (
      totalsMap: Map<EssentialCategoryKey, number[]>
    ): EssentialCategorySalesDataset[] =>
      ESSENTIAL_CATEGORY_ORDER.map((key) => {
        const data = totalsMap.get(key) ?? [];
        return {
          key,
          label: ESSENTIAL_CATEGORY_LABELS[key],
          data: data.map(roundValue),
        };
      });

    return {
      last12Months: {
        labels: monthRange.map(formatMonthLabel),
        datasets: buildDatasets(monthlyTotals),
      },
      last30Days: {
        labels: dayRange30.map(formatDayLabel),
        datasets: buildDatasets(day30Totals),
      },
      last7Days: {
        labels: dayRange7.map(formatDayLabel),
        datasets: buildDatasets(day7Totals),
      },
    };
  } catch (error) {
    console.error(
      "❌ Error calculating essential category sales trends:",
      error
    );
    return {
      last12Months: emptyTimeseries(monthRange, formatMonthLabel),
      last30Days: emptyTimeseries(dayRange30, formatDayLabel),
      last7Days: emptyTimeseries(dayRange7, formatDayLabel),
    };
  }
};

export const getCompanyEssentialCategorySalesTrends =
  async (): Promise<EssentialCategorySalesTrends> => {
    const [categories, orders] = await Promise.all([
      fetchAllCategories(),
      fetchOrders(),
    ]);

    return getEssentialCategorySalesTrends({
      categories,
      orders,
    });
  };

export const getServiceDistributerEssentialCategorySalesTrends =
  async (): Promise<EssentialCategorySalesTrends> => {
    try {
      const currentUser = await waitForAuthState();
      const email = currentUser?.email?.toLowerCase();

      if (!email) {
        console.warn(
          "⚠️ No authenticated service distributer email found. Returning empty trends."
        );
        const empty = await getEssentialCategorySalesTrends({
          categories: [],
          orders: [],
        });
        return empty;
      }

      const [categories, rawOrders] = await Promise.all([
        fetchAllCategories(),
        fetchFuelStationRequests(email),
      ]);

      const flattenedOrders = rawOrders.map((order) => {
        const base =
          order?.originalOrder && typeof order.originalOrder === "object"
            ? order.originalOrder
            : null;

        if (!base) {
          return order;
        }

        const flattened = {
          ...base,
          id:
            base.id ??
            order.id ??
            base.refId ??
            base.orderNumber ??
            order.refId ??
            order.orderNumber,
          category: base.category ?? order.category,
          categoryId: base.categoryId ?? order.categoryId,
          categoryIds:
            base.categoryIds ??
            base.categories ??
            order.categoryIds ??
            order.categories ??
            [],
          selectedOption: base.selectedOption ?? order.selectedOption,
          service: base.service ?? order.service,
          serviceType: base.serviceType ?? order.serviceType,
          productType: base.productType ?? order.productType,
          totalCost:
            base.totalCost ??
            order.totalCost ??
            order.amount ??
            base.amount ??
            order.price,
          totalPrice: base.totalPrice ?? order.totalPrice,
          totalLitre: base.totalLitre ?? order.totalLitre,
          totalLiter: base.totalLiter ?? order.totalLiter,
          quantity: base.quantity ?? order.quantity,
          liters: base.liters ?? order.liters,
          litres: base.litres ?? order.litres,
          count: base.count ?? order.count,
          orderDate: base.orderDate ?? order.orderDate,
          createdDate: base.createdDate ?? order.createdDate,
          createdAt: base.createdAt ?? order.createdAt,
          createdTime: base.createdTime ?? order.createdTime,
        };

        return flattened;
      });

      return getEssentialCategorySalesTrends({
        categories,
        orders: flattenedOrders,
      });
    } catch (error) {
      console.error(
        "❌ Error calculating service distributer essential category sales trends:",
        error
      );
      return getEssentialCategorySalesTrends({
        categories: [],
        orders: [],
      });
    }
  };
/**
 * Calculate total fuel liter usage by type from all orders
 * @returns Promise with fuel usage breakdown
 */
export const getTotalFuelUsageByType = async (): Promise<{
  diesel: number;
  gasoline95: number;
  gasoline91: number;
  total: number;
}> => {
  try {
    const orders = await fetchAllOrders();

    let dieselTotal = 0;
    let gasoline95Total = 0;
    let gasoline91Total = 0;

    orders.forEach((order) => {
      // Derive fuel type using same fallbacks as companies dashboard
      let fuelType = "";
      if (order?.selectedOption?.name?.ar)
        fuelType = order.selectedOption.name.ar;
      else if (order?.selectedOption?.name?.en)
        fuelType = order.selectedOption.name.en;
      else if (order?.selectedOption?.label)
        fuelType = order.selectedOption.label;
      else if (order?.selectedOption?.title?.ar)
        fuelType = order.selectedOption.title.ar;
      else if (order?.selectedOption?.title?.en)
        fuelType = order.selectedOption.title.en;
      else if (order?.service?.title?.ar) fuelType = order.service.title.ar;
      else if (order?.service?.title?.en) fuelType = order.service.title.en;
      else if (order?.fuelType) fuelType = order.fuelType;
      else if (order?.productType) fuelType = order.productType;

      // Derive litres from multiple possible fields
      const rawLitres =
        order?.totalLitre ??
        (order as any)?.totalLiter ??
        order?.quantity ??
        order?.selectedOption?.quantity ??
        order?.liters ??
        0;
      const liters = parseFloat(String(rawLitres)) || 0;

      const normalizedType = String(fuelType).toLowerCase().trim();

      if (
        normalizedType.includes("ديزل") ||
        normalizedType.includes("diesel")
      ) {
        dieselTotal += liters;
      } else if (
        normalizedType.includes("95") ||
        normalizedType.includes("بنزين 95") ||
        normalizedType.includes("gasoline 95")
      ) {
        gasoline95Total += liters;
      } else if (
        normalizedType.includes("91") ||
        normalizedType.includes("بنزين 91") ||
        normalizedType.includes("gasoline 91")
      ) {
        gasoline91Total += liters;
      }
    });

    const total = dieselTotal + gasoline95Total + gasoline91Total;

    return {
      diesel: dieselTotal,
      gasoline95: gasoline95Total,
      gasoline91: gasoline91Total,
      total: total,
    };
  } catch (error) {
    console.error("❌ Error calculating fuel usage:", error);
    return {
      diesel: 0,
      gasoline95: 0,
      gasoline91: 0,
      total: 0,
    };
  }
};
/**
 * Calculate total fuel cost by type from all orders
 * Uses same logic as companies dashboard calculateFuelStatistics but without filtering
 * @returns Promise with fuel cost breakdown
 */
export const getTotalFuelCostByType = async (): Promise<{
  diesel: number;
  gasoline95: number;
  gasoline91: number;
  total: number;
}> => {
  try {
    const orders = await fetchAllOrders();

    let dieselCost = 0;
    let gasoline95Cost = 0;
    let gasoline91Cost = 0;

    orders.forEach((order) => {
      // Derive fuel type using same fallbacks as companies dashboard
      let fuelType = "";
      if (order?.selectedOption?.name?.ar)
        fuelType = order.selectedOption.name.ar;
      else if (order?.selectedOption?.name?.en)
        fuelType = order.selectedOption.name.en;
      else if (order?.selectedOption?.label)
        fuelType = order.selectedOption.label;
      else if (order?.selectedOption?.title?.ar)
        fuelType = order.selectedOption.title.ar;
      else if (order?.selectedOption?.title?.en)
        fuelType = order.selectedOption.title.en;
      else if (order?.service?.title?.ar) fuelType = order.service.title.ar;
      else if (order?.service?.title?.en) fuelType = order.service.title.en;
      else if (order?.fuelType) fuelType = order.fuelType;
      else if (order?.productType) fuelType = order.productType;

      // Derive cost from multiple possible fields
      const rawCost =
        order?.totalPrice ??
        order?.totalCost ??
        order?.total ??
        order?.price ??
        order?.fuelCost ??
        order?.cost ??
        0;
      const cost = parseFloat(String(rawCost)) || 0;

      const normalizedType = String(fuelType).toLowerCase().trim();

      if (
        normalizedType.includes("ديزل") ||
        normalizedType.includes("diesel")
      ) {
        dieselCost += cost;
      } else if (
        normalizedType.includes("95") ||
        normalizedType.includes("بنزين 95") ||
        normalizedType.includes("gasoline 95")
      ) {
        gasoline95Cost += cost;
      } else if (
        normalizedType.includes("91") ||
        normalizedType.includes("بنزين 91") ||
        normalizedType.includes("gasoline 91")
      ) {
        gasoline91Cost += cost;
      }
    });

    const total = dieselCost + gasoline95Cost + gasoline91Cost;

    return {
      diesel: dieselCost,
      gasoline95: gasoline95Cost,
      gasoline91: gasoline91Cost,
      total: total,
    };
  } catch (error) {
    console.error("❌ Error calculating fuel cost:", error);
    return {
      diesel: 0,
      gasoline95: 0,
      gasoline91: 0,
      total: 0,
    };
  }
};

/**
 * Calculate companies count by type
 * @returns Promise with companies breakdown
 */
export const getCompaniesCountByType = async (): Promise<{
  direct: number;
  viaRepresentatives: number;
  total: number;
}> => {
  try {
    console.log("\n🏢 COMPANIES COUNT CALCULATION");
    console.log("====================================");

    // Fetch both collections in parallel
    const [companiesSnapshot, stationsCompanySnapshot] = await Promise.all([
      getDocs(collection(db, "companies")),
      getDocs(collection(db, "stationscompany")),
    ]);

    // Count direct accounts (from companies collection)
    const directCount = companiesSnapshot.size;

    // Count via representatives (from stationscompany collection)
    const viaRepresentativesCount = stationsCompanySnapshot.size;

    const total = directCount + viaRepresentativesCount;

    console.log(`📱 حسابات مباشرة (Direct): ${directCount}`);
    console.log(
      `👥 حسابات بواسطة المناديب (Via Representatives): ${viaRepresentativesCount}`
    );
    console.log(`📊 الاجمالي (Total): ${total}`);
    console.log("====================================\n");

    return {
      direct: directCount,
      viaRepresentatives: viaRepresentativesCount,
      total: total,
    };
  } catch (error) {
    console.error("❌ Error calculating companies count:", error);
    return {
      direct: 0,
      viaRepresentatives: 0,
      total: 0,
    };
  }
};

/**
 * Aggregate drivers count for admin dashboard (delivery + company drivers)
 */
export const getDriversSummaryForAdmin =
  async (): Promise<DriversSummaryData> => {
    try {
      const [deliverySnapshot, companyDriversSnapshot] = await Promise.all([
        getDocs(collection(db, "drivers")),
        getDocs(collection(db, "companies-drivers")),
      ]);

      const deliveryCount = deliverySnapshot.size;
      const companyDriversCount = companyDriversSnapshot.size;

      return {
        delivery: deliveryCount,
        company: companyDriversCount,
        total: deliveryCount + companyDriversCount,
      };
    } catch (error) {
      console.error("❌ Error calculating drivers summary:", error);
      return { delivery: 0, company: 0, total: 0 };
    }
  };

/**
 * Aggregate cars count by size for admin dashboard
 */
export const getCarsSummaryForAdmin = async (): Promise<{
  small: number;
  medium: number;
  large: number;
  vip: number;
  total: number;
}> => {
  try {
    const carsSnapshot = await getDocs(collection(db, "companies-cars"));

    const summary = {
      small: 0,
      medium: 0,
      large: 0,
      vip: 0,
      total: 0,
    };

    carsSnapshot.forEach((doc) => {
      const data = doc.data();
      const normalizedSize =
        normalizeCarSize(
          data.size ||
            data.category?.name ||
            data.category ||
            data.carSize ||
            data.carCategory
        ) || "";

      if (normalizedSize === "صغيرة") summary.small++;
      else if (normalizedSize === "متوسطة") summary.medium++;
      else if (normalizedSize === "كبيرة") summary.large++;
      else if (normalizedSize === "VIP") summary.vip++;

      summary.total++;
    });

    return summary;
  } catch (error) {
    console.error("❌ Error calculating cars summary for admin:", error);
    return { small: 0, medium: 0, large: 0, vip: 0, total: 0 };
  }
};

type SubscriptionTier = "basic" | "classic" | "premium";

const createEmptySubscriptionGroup = (): SubscriptionGroupSummary => ({
  basic: 0,
  classic: 0,
  premium: 0,
  expired: 0,
  total: 0,
});

const toDateSafe = (value: any): Date | null => {
  if (!value) return null;

  try {
    if (typeof value.toDate === "function") {
      return value.toDate();
    }
  } catch {
    // Ignore conversion errors
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

const normalizeSubscriptionTier = (
  rawTitle?: string | null
): SubscriptionTier | null => {
  if (!rawTitle) return null;
  const value = rawTitle.toString().toLowerCase();

  if (
    value.includes("basic") ||
    value.includes("باسيك") ||
    value.includes("بيسك") ||
    value.includes("الأساسية") ||
    value.includes("basic plan")
  ) {
    return "basic";
  }

  if (
    value.includes("classic") ||
    value.includes("كلاسيك") ||
    value.includes("ستاندرد") ||
    value.includes("standard")
  ) {
    return "classic";
  }

  if (
    value.includes("premium") ||
    value.includes("بريميوم") ||
    value.includes("بلس") ||
    value.includes("plus") ||
    value.includes("vip")
  ) {
    return "premium";
  }

  return null;
};

const extractSubscriptionDetails = (
  record: any
): { tier: SubscriptionTier | null; expired: boolean } | null => {
  if (!record) return null;

  const candidate =
    record.selectedSubscription ||
    record.subscription ||
    record.subscriptionPlan ||
    record.currentSubscription ||
    record.plan ||
    record.subscriptionDetails ||
    record.subscriptionData ||
    {};

  const titleCandidate =
    candidate?.title?.ar ??
    candidate?.title?.en ??
    candidate?.name?.ar ??
    candidate?.name?.en ??
    candidate?.title ??
    candidate?.name ??
    record.subscriptionType ??
    record.subscriptionName ??
    record.planName ??
    record.planType ??
    record.packageName ??
    record.packageType ??
    record.subscriptionTier ??
    null;

  const tier = normalizeSubscriptionTier(titleCandidate);

  const expiryValue =
    candidate?.subscriptionEndDate ??
    candidate?.endDate ??
    candidate?.expiryDate ??
    candidate?.expireDate ??
    candidate?.expireAt ??
    candidate?.expiresAt ??
    candidate?.validTo ??
    candidate?.validUntil ??
    record.subscriptionEndDate ??
    record.subscriptionExpiry ??
    record.expiryDate ??
    record.expirationDate ??
    null;

  const expiryDate = toDateSafe(expiryValue);
  const expired = expiryDate ? expiryDate.getTime() < Date.now() : false;

  if (!tier && !expired) {
    return null;
  }

  return { tier, expired };
};

const increaseSubscriptionCounters = (
  group: SubscriptionGroupSummary,
  tier: SubscriptionTier | null,
  expired: boolean
) => {
  if (expired) {
    group.expired++;
  }

  if (tier === "basic") {
    group.basic++;
    group.total++;
    return;
  }

  if (tier === "classic") {
    group.classic++;
    group.total++;
    return;
  }

  if (tier === "premium") {
    group.premium++;
    group.total++;
    return;
  }

  if (expired) {
    group.total++;
  }
};

/**
 * Aggregate subscriptions summary for admin (companies vs individuals)
 */
export const getSubscriptionsSummaryForAdmin =
  async (): Promise<SubscriptionsSummaryData> => {
    try {
      const [companiesSnapshot, clientsSnapshot, subscriptionsSnapshot] =
        await Promise.all([
          getDocs(collection(db, "companies")),
          getDocs(collection(db, "clients")),
          getDocs(collection(db, "subscriptions-payment")),
        ]);

      const summary: SubscriptionsSummaryData = {
        companies: createEmptySubscriptionGroup(),
        individuals: createEmptySubscriptionGroup(),
      };

      companiesSnapshot.forEach((doc) => {
        const info = extractSubscriptionDetails(doc.data());
        if (!info) return;
        increaseSubscriptionCounters(
          summary.companies,
          info.tier,
          info.expired
        );
      });

      clientsSnapshot.forEach((doc) => {
        const info = extractSubscriptionDetails(doc.data());
        if (!info) return;
        increaseSubscriptionCounters(
          summary.individuals,
          info.tier,
          info.expired
        );
      });

      // Fallback to subscriptions-payment collection if no data was found
      if (
        summary.companies.total === 0 ||
        summary.individuals.total === 0 ||
        (summary.companies.expired === 0 && summary.individuals.expired === 0)
      ) {
        subscriptionsSnapshot.forEach((doc) => {
          const data = doc.data();
          const info =
            extractSubscriptionDetails(data.selectedSubscription || data) ||
            extractSubscriptionDetails(data);
          if (!info) return;

          const targetGroup =
            summary.companies.total === 0 && (data.company || data.companyEmail)
              ? summary.companies
              : summary.individuals.total === 0 &&
                (data.client || data.clientEmail)
              ? summary.individuals
              : data.company || data.companyEmail
              ? summary.companies
              : summary.individuals;

          increaseSubscriptionCounters(targetGroup, info.tier, info.expired);
        });
      }

      return summary;
    } catch (error) {
      console.error("❌ Error calculating subscriptions summary:", error);
      return {
        companies: createEmptySubscriptionGroup(),
        individuals: createEmptySubscriptionGroup(),
      };
    }
  };

/**
 * Fetch supervisors from users collection
 * Filters users where isAdmin === true OR isSuperAdmin === true
 * @returns Promise with array of supervisor data
 */
export const fetchSupervisorsFromUsers = async (): Promise<any[]> => {
  try {
    console.log("\n👔 FETCHING SUPERVISORS FROM USERS COLLECTION");
    console.log("====================================");

    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdDate", "desc"));
    const querySnapshot = await getDocs(q);

    const supervisors: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Filter by isAdmin or isSuperAdmin
      if (data.isAdmin === true || data.isSuperAdmin === true) {
        supervisors.push({
          id: doc.id,
          supervisorCode: data.refid || data.uid || data.id || doc.id || "-",
          supervisorName: data.name || data.fullName || data.displayName || "-",
          phone: data.phoneNumber || data.phone || "-",
          email: data.email || "-",
          city: data.city || data.location || "-",
          accountStatus: {
            active: data.isActive === true,
            text: data.isActive === true ? "مفعل" : "معطل",
          },
          // Keep original data for reference
          ...data,
        });
      }
    });

    console.log(`✅ Found ${supervisors.length} supervisors/admins`);
    console.log("====================================\n");

    return supervisors;
  } catch (error) {
    console.error("❌ Error fetching supervisors:", error);
    throw error;
  }
};

/**
 * Fetch all companies with enriched data (cars and drivers count)
 * @returns Promise with array of companies with counts
 */
export const fetchAllCompaniesWithCounts = async (): Promise<any[]> => {
  try {
    console.log("\n🏢 FETCHING ALL COMPANIES WITH COUNTS");
    console.log("====================================");

    // Fetch companies, cars, and drivers in parallel
    const [companiesSnapshot, carsSnapshot, driversSnapshot] =
      await Promise.all([
        getDocs(
          query(collection(db, "companies"), orderBy("createdDate", "desc"))
        ),
        getDocs(collection(db, "companies-cars")),
        getDocs(collection(db, "companies-drivers")),
      ]);

    console.log(`📦 Total companies: ${companiesSnapshot.size}`);
    console.log(`🚗 Total cars in DB: ${carsSnapshot.size}`);
    console.log(`👤 Total drivers in DB: ${driversSnapshot.size}`);

    // Build companies array with enriched data
    const companies: any[] = [];

    companiesSnapshot.forEach((companyDoc) => {
      const companyData = companyDoc.data();
      const companyEmail = companyData.email || "";

      // Count cars for this company (filter by email)
      let carsCount = 0;
      carsSnapshot.forEach((carDoc) => {
        const carData = carDoc.data();
        const carEmail =
          carData.email || carData.companyEmail || carData.createdUserId || "";
        if (
          carEmail &&
          companyEmail &&
          carEmail.toLowerCase() === companyEmail.toLowerCase()
        ) {
          carsCount++;
        }
      });

      // Count drivers for this company (filter by createdUserId matching company email)
      let driversCount = 0;
      driversSnapshot.forEach((driverDoc) => {
        const driverData = driverDoc.data();
        const driverCompanyEmail =
          driverData.createdUserId ||
          driverData.email ||
          driverData.companyEmail ||
          "";
        if (
          driverCompanyEmail &&
          companyEmail &&
          driverCompanyEmail.toLowerCase() === companyEmail.toLowerCase()
        ) {
          driversCount++;
        }
      });

      // Extract subscription title (handle object with ar/en keys)
      let subscriptionTitle = "-";
      if (companyData.selectedSubscription?.title) {
        const title = companyData.selectedSubscription.title;
        if (typeof title === "string") {
          subscriptionTitle = title;
        } else if (typeof title === "object" && title.ar) {
          subscriptionTitle = title.ar;
        } else if (typeof title === "object" && title.en) {
          subscriptionTitle = title.en;
        }
      }

      // Extract city (handle object with ar/en keys)
      let cityName = "-";
      const cityData =
        companyData.formattedLocation?.address?.city || companyData.city;
      if (cityData) {
        if (typeof cityData === "string") {
          cityName = cityData;
        } else if (typeof cityData === "object" && cityData.ar) {
          cityName = cityData.ar;
        } else if (typeof cityData === "object" && cityData.en) {
          cityName = cityData.en;
        }
      }

      companies.push({
        id: companyDoc.id,
        companyCode:
          companyData.refid || companyData.id || companyDoc.id || "-",
        companyName: companyData.name || companyData.brandName || "-",
        phone: companyData.phoneNumber || companyData.phone || "-",
        email: companyData.email || "-",
        city: cityName,
        cars: carsCount,
        drivers: driversCount,
        subscriptions: subscriptionTitle,
      });
    });

    console.log(`✅ Processed ${companies.length} companies with counts`);
    console.log("====================================\n");

    return companies;
  } catch (error) {
    console.error("❌ Error fetching companies with counts:", error);
    throw error;
  }
};

/**
 * Calculate total users count by type from all collections
 * @returns Promise with users breakdown
 */
export const getTotalUsersByType = async (): Promise<{
  supervisors: number;
  companies: number;
  individuals: number;
  serviceProviders: number;
}> => {
  try {
    console.log("\n👥 USERS COUNT CALCULATION");
    console.log("====================================");

    // Fetch all collections in parallel
    const [
      usersSnapshot,
      companiesSnapshot,
      clientsSnapshot,
      stationsCompanySnapshot,
    ] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "companies")),
      getDocs(collection(db, "clients")),
      getDocs(collection(db, "stationscompany")),
    ]);

    // Count supervisors/admins (users where isAdmin === true OR isSuperAdmin === true)
    let supervisorsCount = 0;
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isAdmin === true || data.isSuperAdmin === true) {
        supervisorsCount++;
      }
    });

    // Count companies
    const companiesCount = companiesSnapshot.size;

    // Count individuals/clients
    const individualsCount = clientsSnapshot.size;

    // Count service providers
    const serviceProvidersCount = stationsCompanySnapshot.size;

    console.log(`👔 مشرفين (Supervisors): ${supervisorsCount}`);
    console.log(`🏢 شركات (Companies): ${companiesCount}`);
    console.log(`👤 افراد (Individuals): ${individualsCount}`);
    console.log(
      `🏪 مزودي الخدمة (Service Providers): ${serviceProvidersCount}`
    );
    console.log("====================================\n");

    return {
      supervisors: supervisorsCount,
      companies: companiesCount,
      individuals: individualsCount,
      serviceProviders: serviceProvidersCount,
    };
  } catch (error) {
    console.error("❌ Error calculating users count:", error);
    return {
      supervisors: 0,
      companies: 0,
      individuals: 0,
      serviceProviders: 0,
    };
  }
};

/**
 * Get the most consuming clients (individuals) based on orders
 * Calculates total money spent per client from all their orders
 * @returns Promise with array of clients sorted by consumption (descending)
 */
export const getMostConsumingClients = async (): Promise<
  {
    name: string;
    email: string;
    price: number;
    image?: string;
  }[]
> => {
  try {
    console.log("\n📊 CALCULATING MOST CONSUMING CLIENTS");
    console.log("====================================");

    // Fetch all clients and orders in parallel
    const [clientsSnapshot, ordersSnapshot] = await Promise.all([
      fetchAllClients(),
      fetchAllOrders(),
    ]);

    console.log(`👥 Total clients: ${clientsSnapshot.length}`);
    console.log(`📦 Total orders: ${ordersSnapshot.length}`);

    // Create a map to store client consumption data
    const clientConsumptionMap = new Map<
      string,
      { totalSpent: number; name: string; email: string; image?: string }
    >();

    // Process each client
    clientsSnapshot.forEach((client) => {
      const clientEmail = client.email || "";
      const clientId = client.id || client.uid || "";
      const identifier = clientEmail || clientId;

      if (identifier) {
        clientConsumptionMap.set(identifier, {
          totalSpent: 0,
          name: client.name || client.fullName || "-",
          email: clientEmail,
          image: client.profileImage || client.image || client.photoURL,
        });
      }
    });

    // Calculate total spent per client from orders
    ordersSnapshot.forEach((order) => {
      const clientEmail = order.client?.email || order.clientEmail;
      const clientId = order.clientId;
      const orderIdentifier = clientEmail || clientId;

      if (orderIdentifier) {
        // Check if this order belongs to any client
        clientConsumptionMap.forEach((value, key) => {
          // Match by client email or ID
          const isMatch =
            orderIdentifier === key ||
            orderIdentifier === value.email ||
            orderIdentifier.toLowerCase() === value.email.toLowerCase();

          if (isMatch) {
            // Calculate total cost from order
            const totalCost =
              order.totalCost ??
              order.totalPrice ??
              order.price ??
              order.amount ??
              0;

            const cost = parseFloat(String(totalCost)) || 0;
            value.totalSpent += cost;
          }
        });
      }
    });

    // Convert map to array and sort by total spent (descending)
    const clientsArray = Array.from(clientConsumptionMap.values())
      .filter((client) => client.totalSpent > 0) // Only include clients with consumption
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5) // Get top 5
      .map((client) => ({
        name: client.name,
        email: client.email,
        price: Math.round(client.totalSpent),
        image: client.image,
      }));

    console.log(
      `✅ Top ${clientsArray.length} most consuming clients calculated`
    );
    console.log("====================================\n");

    return clientsArray;
  } catch (error) {
    console.error("❌ Error calculating most consuming clients:", error);
    return [];
  }
};

/**
 * Get the most used fuel stations based on orders
 * Calculates total money spent per station from all their orders
 * @returns Promise with array of stations sorted by consumption (descending)
 */
export const getMostUsedStations = async (): Promise<
  {
    name: string;
    email: string;
    price: number;
    image?: string;
  }[]
> => {
  try {
    console.log("\n📊 CALCULATING MOST USED STATIONS");
    console.log("====================================");

    // Fetch all stations and orders in parallel
    const [stationsSnapshot, ordersSnapshot] = await Promise.all([
      getDocs(collection(db, "carstations")),
      fetchAllOrders(),
    ]);

    console.log(`⛽ Total stations: ${stationsSnapshot.size}`);
    console.log(`📦 Total orders: ${ordersSnapshot.length}`);

    // Create a map to store station consumption data
    const stationConsumptionMap = new Map<
      string,
      { totalSpent: number; name: string; email: string; image?: string }
    >();

    // Process each station
    stationsSnapshot.forEach((stationDoc) => {
      const stationData = stationDoc.data();
      const stationEmail = stationData.email || "";

      if (stationEmail) {
        stationConsumptionMap.set(stationEmail, {
          totalSpent: 0,
          name: stationData.name || stationData.company || "-",
          email: stationEmail,
          image:
            stationData.logo || stationData.image || stationData.profileImage,
        });
      }
    });

    // Calculate total spent per station from orders
    ordersSnapshot.forEach((order) => {
      const stationEmail = order.carStation?.email || order.stationEmail;

      if (stationEmail) {
        // Check if this order belongs to any station
        if (stationConsumptionMap.has(stationEmail)) {
          const station = stationConsumptionMap.get(stationEmail)!;

          // Calculate total cost from order
          const totalCost =
            order.totalCost ??
            order.totalPrice ??
            order.price ??
            order.amount ??
            0;

          const cost = parseFloat(String(totalCost)) || 0;
          station.totalSpent += cost;
        }
      }
    });

    // Convert map to array and sort by total spent (descending)
    const stationsArray = Array.from(stationConsumptionMap.values())
      .filter((station) => station.totalSpent > 0) // Only include stations with consumption
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5) // Get top 5
      .map((station) => ({
        name: station.name,
        email: station.email,
        price: Math.round(station.totalSpent),
        image: station.image,
      }));

    console.log(`✅ Top ${stationsArray.length} most used stations calculated`);
    console.log("====================================\n");

    return stationsArray;
  } catch (error) {
    console.error("❌ Error calculating most used stations:", error);
    return [];
  }
};

/**
 * Get the latest orders for admin dashboard
 * Fetches the most recent orders and transforms them for display
 * @param limit - Number of orders to fetch (default: 5)
 * @returns Promise with array of recent orders
 */
export const getLatestOrders = async (
  limit: number = 5
): Promise<
  {
    code: string;
    client: string;
    service: string;
    litre: string;
    totalCost: string;
    date: string;
    status: string;
  }[]
> => {
  try {
    console.log("\n📊 FETCHING LATEST ORDERS");
    console.log("====================================");

    // Fetch orders ordered by date descending
    const orders = await fetchAllOrders();

    // Sort by orderDate descending and take the first N orders
    const latestOrders = orders.slice(0, limit);

    console.log(`📦 Total orders fetched: ${orders.length}`);
    console.log(`📋 Latest ${latestOrders.length} orders selected`);

    // Transform orders to match table format
    const transformedOrders = latestOrders.map((order) => {
      // Get order code (ID or refId)
      const code = order.id || order.refId || order.orderNumber || "-";

      // Get client name
      const clientName =
        order.client?.name ||
        order.client?.fullName ||
        order.clientName ||
        order.customer?.name ||
        "-";

      // Get service name
      const serviceName =
        order.selectedOption?.name?.ar ||
        order.selectedOption?.name?.en ||
        order.service?.title?.ar ||
        order.service?.title?.en ||
        order.selectedOption?.title?.ar ||
        order.selectedOption?.title?.en ||
        order.service?.name ||
        order.category?.name?.ar ||
        order.category?.name?.en ||
        "-";

      // Get litres
      const litres =
        order.totalLitre ||
        order.quantity ||
        order.selectedOption?.quantity ||
        order.liters ||
        "0";

      // Get total cost
      const totalCost =
        order.totalCost ||
        order.totalPrice ||
        order.price ||
        order.amount ||
        "0";

      // Format date
      let formattedDate = "-";
      if (order.orderDate) {
        const date = order.orderDate.toDate
          ? order.orderDate.toDate()
          : new Date(order.orderDate);
        formattedDate = new Intl.DateTimeFormat("ar-SA", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        }).format(date);
      }

      // Get status
      const status =
        order.status ||
        order.orderStatus ||
        (order.isCompleted
          ? "مكتمل"
          : order.isRejected
          ? "ملغي"
          : "جاري المراجعة");

      return {
        code,
        client: clientName,
        service: serviceName,
        litre: String(litres),
        totalCost: String(totalCost),
        date: formattedDate,
        status,
      };
    });

    console.log(`✅ Transformed ${transformedOrders.length} orders`);
    console.log("====================================\n");

    return transformedOrders;
  } catch (error) {
    console.error("❌ Error fetching latest orders:", error);
    return [];
  }
};

/**
 * Get the most consuming companies based on orders
 * Calculates total money spent per company from all their orders
 * @returns Promise with array of companies sorted by consumption (descending)
 */
export const getMostConsumingCompanies = async (): Promise<
  {
    name: string;
    email: string;
    price: number;
    image?: string;
  }[]
> => {
  try {
    console.log("\n📊 CALCULATING MOST CONSUMING COMPANIES");
    console.log("====================================");

    // Fetch all companies and orders in parallel
    const [companiesSnapshot, ordersSnapshot] = await Promise.all([
      getDocs(collection(db, "companies")),
      fetchAllOrders(),
    ]);

    console.log(`🏢 Total companies: ${companiesSnapshot.size}`);
    console.log(`📦 Total orders: ${ordersSnapshot.length}`);

    // Create a map to store company consumption data
    const companyConsumptionMap = new Map<
      string,
      { totalSpent: number; name: string; email: string; image?: string }
    >();

    // Process each company
    companiesSnapshot.forEach((companyDoc) => {
      const companyData = companyDoc.data();
      const companyEmail = companyData.email || "";
      const companyId = companyDoc.id;

      if (companyEmail) {
        companyConsumptionMap.set(companyId, {
          totalSpent: 0,
          name: companyData.name || companyData.brandName || "-",
          email: companyEmail,
          image:
            companyData.logo || companyData.image || companyData.profileImage,
        });
      }
    });

    // Calculate total spent per company from orders
    ordersSnapshot.forEach((order) => {
      const companyUid = order.companyUid;

      if (companyUid) {
        // Check if this order belongs to any company
        companyConsumptionMap.forEach((value, key) => {
          // Match by company ID or email
          const isMatch =
            companyUid === key ||
            companyUid === value.email ||
            companyUid.toLowerCase() === value.email.toLowerCase();

          if (isMatch) {
            // Calculate total cost from order
            const totalCost =
              order.totalCost ??
              order.totalPrice ??
              order.price ??
              order.amount ??
              0;

            const cost = parseFloat(String(totalCost)) || 0;
            value.totalSpent += cost;
          }
        });
      }
    });

    // Convert map to array and sort by total spent (descending)
    const companiesArray = Array.from(companyConsumptionMap.values())
      .filter((company) => company.totalSpent > 0) // Only include companies with consumption
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5) // Get top 5
      .map((company) => ({
        name: company.name,
        email: company.email,
        price: Math.round(company.totalSpent),
        image: company.image,
      }));

    console.log(
      `✅ Top ${companiesArray.length} most consuming companies calculated`
    );
    console.log("====================================\n");

    return companiesArray;
  } catch (error) {
    console.error("❌ Error calculating most consuming companies:", error);
    return [];
  }
};
/**
 * Calculate car wash operations by car size from all orders
 * Uses same logic as companies dashboard calculateCarWashStatistics but without filtering by company
 * @returns Promise with car wash operations breakdown
 */
export const getCarWashOperationsBySize = async (): Promise<{
  small: number;
  medium: number;
  large: number;
  vip: number;
}> => {
  try {
    const orders = await fetchAllOrders();

    console.log("\n🚗 CAR WASH OPERATIONS CALCULATION");
    console.log("====================================");
    console.log(`📦 Total orders: ${orders.length}`);

    // Filter car wash orders using same logic as companies dashboard
    const checkCategory = (value: any): boolean => {
      if (!value) return false;
      const str = typeof value === "string" ? value : "";
      return (
        str.includes("عمليات غسيل السيارات") ||
        str.includes("غسيل سيارة") ||
        str.includes("غسيل خارجي") ||
        str.includes("غسيل") ||
        str.includes("تنظيف السيارة من الداخل والخارج") ||
        str.includes("تنظيف السيارة") ||
        str.includes("Car Wash") ||
        str.includes("Car wash") ||
        str.includes("Exterior wash") ||
        str.includes("Exterior & Interior car cleanning") ||
        str.includes("car cleanning") ||
        str.includes("washing") ||
        str.toLowerCase().includes("wash") ||
        str.toLowerCase().includes("clean")
      );
    };

    const carWashOrders = orders.filter(
      (order) =>
        checkCategory(order.category?.ar) ||
        checkCategory(order.category?.en) ||
        checkCategory(order.service?.category?.ar) ||
        checkCategory(order.service?.category?.en) ||
        checkCategory(order.service?.title?.ar) ||
        checkCategory(order.service?.title?.en) ||
        checkCategory(order.service?.desc?.ar) ||
        checkCategory(order.service?.desc?.en) ||
        checkCategory(order.selectedOption?.category?.name?.ar) ||
        checkCategory(order.selectedOption?.category?.name?.en) ||
        checkCategory(order.selectedOption?.category?.ar) ||
        checkCategory(order.selectedOption?.category?.en) ||
        checkCategory(order.selectedOption?.title?.ar) ||
        checkCategory(order.selectedOption?.title?.en) ||
        checkCategory(order.selectedOption?.label) ||
        checkCategory(order.type) ||
        checkCategory(order.orderType)
    );

    console.log(`🧼 Car wash orders found: ${carWashOrders.length}`);

    if (carWashOrders.length > 0) {
      console.log("\n📋 First 3 car wash orders:");
      carWashOrders.slice(0, 3).forEach((order, idx) => {
        console.log(`  Order ${idx + 1}:`, {
          id: order.id || order.refId,
          carSize: order.car?.size,
          category:
            order.category ||
            order.service?.category?.ar ||
            order.service?.title?.ar,
        });
      });
    }

    // Group by car size
    let smallCount = 0;
    let mediumCount = 0;
    let largeCount = 0;
    let vipCount = 0;

    carWashOrders.forEach((order) => {
      const carSize = order.car?.size;

      if (carSize) {
        const normalizedSize = String(carSize).toLowerCase().trim();

        if (
          normalizedSize === "small" ||
          normalizedSize === "صغيرة" ||
          normalizedSize.includes("صغير")
        ) {
          smallCount++;
        } else if (
          normalizedSize === "medium" ||
          normalizedSize === "middle" ||
          normalizedSize === "متوسطة" ||
          normalizedSize.includes("متوسط")
        ) {
          mediumCount++;
        } else if (
          normalizedSize === "large" ||
          normalizedSize === "big" ||
          normalizedSize === "كبيرة" ||
          normalizedSize.includes("كبير")
        ) {
          largeCount++;
        } else if (
          normalizedSize === "vip" ||
          normalizedSize.toUpperCase() === "VIP"
        ) {
          vipCount++;
        }
      }
    });

    console.log("\n📊 Car Wash by Size:");
    console.log(`  صغيرة (small): ${smallCount}`);
    console.log(`  متوسطة (medium): ${mediumCount}`);
    console.log(`  كبيرة (large): ${largeCount}`);
    console.log(`  VIP: ${vipCount}`);
    console.log("====================================\n");

    return {
      small: smallCount,
      medium: mediumCount,
      large: largeCount,
      vip: vipCount,
    };
  } catch (error) {
    console.error("❌ Error calculating car wash operations:", error);
    return {
      small: 0,
      medium: 0,
      large: 0,
      vip: 0,
    };
  }
};

/**
 * Calculate tire change operations by car size from all orders
 * Uses same logic as companies dashboard calculateTireChangeStatistics but without filtering by company
 * @returns Promise with tire change operations breakdown
 */
export const getTireChangeOperationsBySize = async (): Promise<{
  small: number;
  medium: number;
  large: number;
  vip: number;
}> => {
  try {
    const orders = await fetchAllOrders();

    console.log("\n🚗 TIRE CHANGE OPERATIONS CALCULATION");
    console.log("====================================");
    console.log(`📦 Total orders: ${orders.length}`);

    // Filter tire change orders using same logic as companies dashboard
    const checkTireService = (value: any): boolean => {
      if (!value) return false;
      const str = typeof value === "string" ? value : "";
      return (
        str.includes("تغيير الإطارات") ||
        str.includes("Tire Change") ||
        str.includes("تغيير إطار") ||
        str.includes("Change Tire") ||
        str.includes("إطارات") ||
        str.includes("Tires") ||
        str.toLowerCase().includes("tire") ||
        str.toLowerCase().includes("tyre")
      );
    };

    const tireOrders = orders.filter(
      (order) =>
        checkTireService(order.service?.title?.ar) ||
        checkTireService(order.service?.title?.en) ||
        checkTireService(order.service?.name?.ar) ||
        checkTireService(order.service?.name?.en) ||
        checkTireService(order.category?.ar) ||
        checkTireService(order.category?.en) ||
        checkTireService(order.selectedOption?.title?.ar) ||
        checkTireService(order.selectedOption?.title?.en) ||
        checkTireService(order.selectedOption?.name?.ar) ||
        checkTireService(order.selectedOption?.name?.en) ||
        checkTireService(order.selectedOption?.label)
    );

    console.log(`🎯 Tire change orders found: ${tireOrders.length}`);

    // Group by car size
    const sizeMap: Record<string, number> = {
      صغيرة: 0,
      متوسطة: 0,
      كبيرة: 0,
      VIP: 0,
    };

    tireOrders.forEach((order) => {
      // Extract car size from multiple possible paths
      let carSize = order.car?.size || order.size || "";

      if (carSize) {
        const normalizedSize = normalizeCarSize(carSize);
        if (sizeMap.hasOwnProperty(normalizedSize)) {
          sizeMap[normalizedSize]++;
        }
      }
    });

    console.log("Tire change stats:", sizeMap);

    return {
      small: sizeMap.صغيرة,
      medium: sizeMap.متوسطة,
      large: sizeMap.كبيرة,
      vip: sizeMap.VIP,
    };
  } catch (error) {
    console.error("❌ Error calculating tire change operations:", error);
    return {
      small: 0,
      medium: 0,
      large: 0,
      vip: 0,
    };
  }
};

/**
 * Calculate oil change operations by car size from all orders
 * Uses same logic as companies dashboard calculateOilChangeStatistics but without filtering by company
 * @returns Promise with oil change operations breakdown
 */
export const getOilChangeOperationsBySize = async (): Promise<{
  small: number;
  medium: number;
  large: number;
  vip: number;
}> => {
  try {
    const orders = await fetchAllOrders();

    console.log("\n🛢️ OIL CHANGE OPERATIONS CALCULATION");
    console.log("====================================");
    console.log(`📦 Total orders: ${orders.length}`);

    // Filter oil change orders - looking for specific category names and service titles
    const checkOilService = (value: any): boolean => {
      if (!value) return false;
      const str = typeof value === "string" ? value : "";
      return (
        str === "الزيوت" ||
        str === "زيوت" ||
        str === "زيت بترولايف" ||
        str === "زيت الماكينة" ||
        str.includes("زيت الماكينة") ||
        str.includes("الزيوت") ||
        str.includes("زيوت")
      );
    };

    const oilOrders = orders.filter((order) => {
      // Check category name (Ar and En)
      const categoryMatches =
        checkOilService(order.category?.ar) ||
        checkOilService(order.category?.en) ||
        checkOilService(order.service?.category?.name?.ar) ||
        checkOilService(order.service?.category?.name?.en) ||
        checkOilService(order.selectedOption?.category?.name?.ar) ||
        checkOilService(order.selectedOption?.category?.name?.en);

      // Check service title specifically for "زيت الماكينة"
      const serviceTitleMatches =
        checkOilService(order.service?.title?.ar) ||
        checkOilService(order.service?.title?.en);

      return categoryMatches || serviceTitleMatches;
    });

    console.log(`🎯 Oil change orders found: ${oilOrders.length}`);

    // Group by car size
    const sizeMap: Record<string, number> = {
      صغيرة: 0,
      متوسطة: 0,
      كبيرة: 0,
      VIP: 0,
    };

    oilOrders.forEach((order) => {
      // Extract car size from multiple possible paths
      let carSize = order.car?.size || order.size || "";

      if (carSize) {
        const normalizedSize = normalizeCarSize(carSize);
        if (sizeMap.hasOwnProperty(normalizedSize)) {
          sizeMap[normalizedSize]++;
        }
      }
    });

    console.log("Oil change stats:", sizeMap);

    return {
      small: sizeMap.صغيرة,
      medium: sizeMap.متوسطة,
      large: sizeMap.كبيرة,
      vip: sizeMap.VIP,
    };
  } catch (error) {
    console.error("❌ Error calculating oil change operations:", error);
    return {
      small: 0,
      medium: 0,
      large: 0,
      vip: 0,
    };
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Upload a file to Firebase Storage
 * @param file - File to upload
 * @param path - Storage path
 * @returns Promise with download URL
 */
const uploadFileToStorage = async (
  file: File,
  path: string
): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

/**
 * Parse Google Maps link to extract latitude and longitude
 * Supports formats:
 * - https://www.google.com/maps?q=24.620178,46.709404
 * - https://maps.google.com/?q=24.620178,46.709404
 * - https://goo.gl/maps/... (after redirect)
 * @param googleMapsLink - Google Maps URL
 * @returns Object with lat and lng, or null if parsing fails
 */
const parseGoogleMapsLink = (
  googleMapsLink: string
): { lat: number; lng: number } | null => {
  try {
    if (!googleMapsLink || typeof googleMapsLink !== "string") {
      return null;
    }

    // Clean the URL
    const url = googleMapsLink.trim();

    // Handle different Google Maps URL formats
    let lat: number | null = null;
    let lng: number | null = null;

    // Format 1: https://www.google.com/maps?q=24.620178,46.709404
    const qMatch = url.match(/[?&]q=([^&]+)/);
    if (qMatch) {
      const coords = qMatch[1].split(",");
      if (coords.length === 2) {
        lat = parseFloat(coords[0]);
        lng = parseFloat(coords[1]);
      }
    }

    // Format 2: https://maps.google.com/maps/@24.620178,46.709404,15z
    const atMatch = url.match(/@([^,]+),([^,]+)/);
    if (atMatch && !lat && !lng) {
      lat = parseFloat(atMatch[1]);
      lng = parseFloat(atMatch[2]);
    }

    // Format 3: https://www.google.com/maps/place/.../@24.620178,46.709404,15z
    const placeMatch = url.match(/@([^,]+),([^,]+),/);
    if (placeMatch && !lat && !lng) {
      lat = parseFloat(placeMatch[1]);
      lng = parseFloat(placeMatch[2]);
    }

    // Validate coordinates
    if (
      lat !== null &&
      lng !== null &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      return { lat, lng };
    }

    return null;
  } catch (error) {
    console.error("Error parsing Google Maps link:", error);
    return null;
  }
};

/**
 * Convert Arabic city name to city object with ID and bilingual names
 */
const getCityObject = (
  cityNameAr: string
): { id: number; name: { ar: string; en: string } } => {
  const cityMap: { [key: string]: { id: number; en: string } } = {
    الرياض: { id: 1, en: "Riyadh" },
    جدة: { id: 2, en: "Jeddah" },
    "مكة المكرمة": { id: 3, en: "Makkah" },
    "المدينة المنورة": { id: 4, en: "Madinah" },
    الدمام: { id: 5, en: "Dammam" },
    الخبر: { id: 6, en: "Khobar" },
    الظهران: { id: 7, en: "Dhahran" },
    الطائف: { id: 8, en: "Taif" },
    بريدة: { id: 9, en: "Buraidah" },
    تبوك: { id: 10, en: "Tabuk" },
  };

  const cityData = cityMap[cityNameAr] || { id: 0, en: cityNameAr };

  return {
    id: cityData.id,
    name: {
      ar: cityNameAr,
      en: cityData.en,
    },
  };
};

/**
 * Convert Arabic weekday to bilingual object
 */
const getDayObject = (dayAr: string): { ar: string; en: string } => {
  const dayMap: { [key: string]: string } = {
    السبت: "Saturday",
    الأحد: "Sunday",
    الإثنين: "Monday",
    الثلاثاء: "Tuesday",
    الأربعاء: "Wednesday",
    الخميس: "Thursday",
    الجمعة: "Friday",
  };

  return {
    ar: dayAr,
    en: dayMap[dayAr] || dayAr,
  };
};
/**
 * Convert Arabic plate letters to English
 */
const convertPlateLettersToEnglish = (arabicLetters: string): string => {
  const letterMap: { [key: string]: string } = {
    أ: "A",
    ب: "B",
    ج: "J",
    د: "D",
    ه: "H",
    و: "W",
    ز: "Z",
    ح: "H",
    خ: "KH",
    ر: "R",
    س: "S",
    ش: "SH",
    ص: "S",
    ض: "D",
    ط: "T",
    ع: "E",
    غ: "G",
    ف: "F",
    ق: "Q",
    ك: "K",
    ل: "L",
    م: "M",
    ن: "N",
    ي: "Y",
    ء: "A",
  };

  return arabicLetters
    .split("")
    .map((char) => {
      if (char === " ") return " ";
      return letterMap[char] || char;
    })
    .join("");
};

/**
 * Convert Arabic car size to English code
 */
const convertCarSizeToEnglish = (sizeAr: string): string => {
  const sizeMap: { [key: string]: string } = {
    صغيرة: "small",
    متوسطة: "medium",
    كبيرة: "large",
    VIP: "vip",
  };

  return sizeMap[sizeAr] || "small";
};

// ==================== ADD DRIVER FUNCTION ====================

export interface AddDriverData {
  phone: string;
  email: string;
  driverName: string;
  driverImage?: File | string;
  address: string;
  city: string;
  selectedDays: string[];
  vehicleStatus: string;
  driverAmount: string;
  driverLicense?: File | string;
  plateLetters: string;
  plateNumber: string;
  vehicleCategory: string;
}

/**
 * Add a new driver to Firestore companies-drivers collection
 * @param driverData - Driver form data
 * @returns Promise with the created driver document
 */
export const addCompanyDriver = async (driverData: AddDriverData) => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("No user is currently logged in");
    }

    // console.log('Adding new driver to Firestore...');
    // console.log('Current user:', currentUser.email, currentUser.uid);
    // console.log('Driver data:', driverData);

    // Upload files to Firebase Storage if they are File objects
    let imageUrl = "";
    let licenseUrl = "";

    if (driverData.driverImage && driverData.driverImage instanceof File) {
      const timestamp = Date.now();
      const imagePath = `companies-drivers/${timestamp}${driverData.driverImage.name}`;
      imageUrl = await uploadFileToStorage(driverData.driverImage, imagePath);
      // console.log('Driver image uploaded:', imageUrl);
    }

    if (driverData.driverLicense && driverData.driverLicense instanceof File) {
      const timestamp = Date.now();
      const licensePath = `companies-drivers/${timestamp}${driverData.driverLicense.name}`;
      licenseUrl = await uploadFileToStorage(
        driverData.driverLicense,
        licensePath
      );
      // console.log('Driver license uploaded:', licenseUrl);
    }

    // Prepare the driver document
    const driverDocument = {
      // Basic info
      name: driverData.driverName,
      email: driverData.email,
      phoneNumber: driverData.phone,
      location: driverData.address, // العنوان mapped to location

      // City object
      city: getCityObject(driverData.city),

      // Images
      image: imageUrl || "",
      licenceAttachment: licenseUrl || "",

      // Plate number
      plateNumber: {
        ar: `${driverData.plateNumber} ${driverData.plateLetters}`,
        en: `${driverData.plateNumber} ${convertPlateLettersToEnglish(
          driverData.plateLetters
        )}`,
      },

      // Car size
      size: convertCarSizeToEnglish(driverData.vehicleCategory),

      // Plan details
      plan: {
        carSize: convertCarSizeToEnglish(driverData.vehicleCategory),
        dailyTrans: driverData.driverAmount,
        exceptionDays: driverData.selectedDays.map((day) => getDayObject(day)),
        createdDate: Date.now(),
        createdUserId: currentUser.email || "",
      },

      // Financial
      balance: parseInt(driverData.driverAmount) || 0,

      // Status
      isActive: true,

      // System fields
      createdDate: serverTimestamp(),
      createdUserId: currentUser.email || "",
      companyUid: currentUser.uid, // Current user's UID

      // Generate unique 8-digit refid for driver
      refid: await (async () => {
        console.log("🔢 Generating unique 8-digit refid for driver...");
        let refid: string = "";
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 20;

        while (!isUnique && attempts < maxAttempts) {
          const randomCode = Math.floor(10000000 + Math.random() * 90000000);
          refid = randomCode.toString();
          const driversRefCheck = collection(db, "companies-drivers");
          const qCheck = query(driversRefCheck, where("refid", "==", refid));
          const querySnapshot = await getDocs(qCheck);

          if (querySnapshot.empty) {
            isUnique = true;
          } else {
            attempts++;
          }
        }

        if (!isUnique || !refid) {
          throw new Error("فشل في إنشاء كود السائق. يرجى المحاولة مرة أخرى.");
        }

        console.log(`✅ Generated unique refid: ${refid}`);
        return refid;
      })(),

      // Empty arrays for future use
      driverIds: [],

      // Additional info (if needed)
      vehicleStatus: driverData.vehicleStatus,
    };

    // console.log('Prepared driver document:', driverDocument);

    // Add to Firestore
    const companiesDriversRef = collection(db, "companies-drivers");
    const docRef = await addDoc(companiesDriversRef, driverDocument);

    // console.log('Driver added successfully with ID:', docRef.id);

    return {
      id: docRef.id,
      ...driverDocument,
    };
  } catch (error) {
    console.error("Error adding driver to Firestore:", error);
    throw error;
  }
};

/**
 * Add 8-digit refid to existing company drivers that don't have one
 * @returns Promise with number of updated drivers
 */
export const addRefidToExistingCompanyDrivers = async (): Promise<number> => {
  try {
    console.log(
      "🔄 Starting migration: Adding refid to existing company drivers..."
    );

    const driversRef = collection(db, "companies-drivers");
    const driversSnapshot = await getDocs(driversRef);
    console.log(`📦 Found ${driversSnapshot.size} company drivers`);

    let updatedCount = 0;
    const driversToUpdate: Array<{ docRef: any; refid: string }> = [];

    // First pass: Identify drivers without refid and generate refids
    for (const driverDoc of driversSnapshot.docs) {
      const driverData = driverDoc.data();

      // Skip if driver already has refid
      if (driverData.refid) {
        console.log(
          `⏭️  Driver ${driverDoc.id} already has refid: ${driverData.refid}`
        );
        continue;
      }

      // Generate unique 8-digit refid
      let refid: string = "";
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 20;

      while (!isUnique && attempts < maxAttempts) {
        // Generate 8-digit number (10000000 to 99999999)
        const randomCode = Math.floor(10000000 + Math.random() * 90000000);
        refid = randomCode.toString();

        // Check if refid already exists in Firestore or in our pending updates
        const driversRefCheck = collection(db, "companies-drivers");
        const qCheck = query(driversRefCheck, where("refid", "==", refid));
        const querySnapshot = await getDocs(qCheck);

        // Also check if this refid is already in our pending updates
        const isInPendingUpdates = driversToUpdate.some(
          (item) => item.refid === refid
        );

        if (querySnapshot.empty && !isInPendingUpdates) {
          isUnique = true;
        } else {
          attempts++;
        }
      }

      if (!isUnique || !refid) {
        console.error(
          `❌ Failed to generate unique refid for driver ${driverDoc.id} after ${maxAttempts} attempts`
        );
        continue;
      }

      driversToUpdate.push({
        docRef: doc(db, "companies-drivers", driverDoc.id),
        refid: refid,
      });
      console.log(`✅ Generated refid ${refid} for driver ${driverDoc.id}`);
    }

    console.log(`📝 Updating ${driversToUpdate.length} drivers with refid...`);
    for (const { docRef, refid } of driversToUpdate) {
      try {
        await updateDoc(docRef, { refid: refid });
        updatedCount++;
        console.log(`✅ Updated driver ${docRef.id} with refid: ${refid}`);
      } catch (error) {
        console.error(`❌ Error updating driver ${docRef.id}:`, error);
      }
    }
    console.log(
      `✅ Migration completed: ${updatedCount} drivers updated with refid`
    );
    return updatedCount;
  } catch (error) {
    console.error("❌ Error in migration:", error);
    throw error;
  }
};

/**
 * Fetch all documents from the Firestore "vehicles" collection
 * @returns Promise with the vehicles data
 */
export const fetchVehicles = async () => {
  try {
    const vehiclesRef = collection(db, "vehicles");
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(
      vehiclesRef
    );

    const vehiclesData: any[] = [];

    querySnapshot.forEach((doc) => {
      vehiclesData.push({
        docId: doc.id,
        ...doc.data(),
      });
    });

    return vehiclesData;
  } catch (error) {
    console.error("Error fetching vehicles data:", error);
    throw error;
  }
};

/**
 * Delete a petrolife car/vehicle from Firestore
 * @param vehicleId - The vehicle document ID
 * @returns Promise<boolean> - Returns true if deletion was successful
 */
export const deletePetrolifeCar = async (
  vehicleId: string
): Promise<boolean> => {
  try {
    console.log(`🗑️ Deleting petrolife car from Firestore: ${vehicleId}`);

    // Verify the vehicle exists before deleting
    const vehicleDocRef = doc(db, "vehicles", vehicleId);
    const vehicleDoc = await getDoc(vehicleDocRef);

    if (!vehicleDoc.exists()) {
      throw new Error("Vehicle not found");
    }

    // Delete the vehicle document
    await deleteDoc(vehicleDocRef);
    console.log(`✅ Successfully deleted petrolife car from Firestore`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting petrolife car:", error);
    throw error;
  }
};

export interface CreateVehicleOptions {
  chassisNumber: string | null;
  plateNumber: string | null;
  name: string | null;
  imageFile?: File | string | null;
  driverIdentifiers?: Array<string | null | undefined> | string | null;
}

export interface UpdateVehicleOptions {
  vehicleId: string;
  chassisNumber?: string | null;
  plateNumber?: string | null;
  name?: string | null;
  imageFile?: File | string | null;
  driverIdentifiers?: Array<string | null | undefined> | string | null;
}

type VehiclePayloadOverrides = {
  chassisNumber?: string | null;
  createdDate?: any;
  createdUserId?: string | null;
  driverIds?: string[];
  name?: string | null;
  plateNumber?: {
    ar: string | null;
    en: string | null;
  };
  image?: string | null;
  workingStatus?: string | null;
  isActive?: boolean;
};
const normalizeDriverIdentifiers = (
  identifiers: Array<string | null | undefined> | string | null | undefined
): string[] => {
  if (!identifiers) {
    return [];
  }

  const list = Array.isArray(identifiers) ? identifiers : [identifiers];

  const normalized = list
    .map((value) => {
      if (value === null || value === undefined) {
        return null;
      }

      const trimmed = String(value).trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(normalized));
};
const buildVehicleSchemaPayload = (
  source: Record<string, any> | null | undefined,
  overrides: VehiclePayloadOverrides = {}
) => {
  const basePlateNumber = {
    ar: source?.plateNumber?.ar ?? null,
    en: source?.plateNumber?.en ?? null,
  };

  const payload = {
    chassisNumber: source?.chassisNumber ?? null,
    createdDate: source?.createdDate ?? null,
    createdUserId: source?.createdUserId ?? null,
    driver: null,
    driverIds: Array.isArray(source?.driverIds)
      ? source.driverIds.map((id: any) => String(id))
      : [],
    name: source?.name ?? null,
    plateNumber: basePlateNumber,
    city: source?.city ?? null,
    companyUid: source?.companyUid ?? null,
    email: source?.email ?? null,
    fuelType: source?.fuelType ?? null,
    id: source?.id ?? null,
    image: source?.image ?? null,
    isActive: typeof source?.isActive === "boolean" ? source.isActive : true,
    licenceAttachment: source?.licenceAttachment ?? null,
    location: source?.location ?? null,
    phoneNumber: source?.phoneNumber ?? null,
    plan: source?.plan ?? null,
    uId: source?.uId ?? null,
    workingStatus:
      source?.workingStatus !== undefined ? source.workingStatus : "offWorking",
  };

  if (overrides.chassisNumber !== undefined) {
    payload.chassisNumber = overrides.chassisNumber ?? null;
  }

  if (overrides.createdDate !== undefined) {
    payload.createdDate = overrides.createdDate;
  }

  if (overrides.createdUserId !== undefined) {
    payload.createdUserId = overrides.createdUserId ?? null;
  }

  if (overrides.driverIds !== undefined) {
    payload.driverIds = overrides.driverIds;
  }

  if (overrides.name !== undefined) {
    payload.name = overrides.name ?? null;
  }

  if (overrides.plateNumber !== undefined) {
    payload.plateNumber = {
      ar: overrides.plateNumber?.ar ?? null,
      en: overrides.plateNumber?.en ?? null,
    };
  }

  if (overrides.image !== undefined) {
    payload.image = overrides.image ?? null;
  }

  if (overrides.workingStatus !== undefined) {
    payload.workingStatus = overrides.workingStatus ?? null;
  }

  if (overrides.isActive !== undefined) {
    payload.isActive = overrides.isActive ?? false;
  }

  payload.driver = null;

  return payload;
};

/**
 * Create a new vehicle document in Firestore with the standardized schema
 * observed in existing vehicle documents.
 */
export const createVehicleWithSchema = async ({
  chassisNumber,
  plateNumber,
  name,
  imageFile = null,
  driverIdentifiers = null,
}: CreateVehicleOptions) => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("No user is currently logged in.");
    }

    let imageUrl: string | null = null;

    if (imageFile instanceof File) {
      const timestamp = Date.now();
      const storagePath = `vehicles/${timestamp}-${imageFile.name}`;
      imageUrl = await uploadFileToStorage(imageFile, storagePath);
    } else if (typeof imageFile === "string" && imageFile.trim() !== "") {
      imageUrl = imageFile;
    }

    const driverIds = normalizeDriverIdentifiers(driverIdentifiers);

    const vehiclePayload = buildVehicleSchemaPayload(null, {
      chassisNumber: chassisNumber ?? null,
      createdDate: serverTimestamp(),
      createdUserId: currentUser.email ?? null,
      driverIds,
      name: name ?? null,
      plateNumber: {
        ar: plateNumber ?? null,
        en: plateNumber ?? null,
      },
      image: imageUrl,
      workingStatus: "offWorking",
      isActive: true,
    });

    const vehiclesCollection = collection(db, "vehicles");
    const vehicleDocRef = doc(vehiclesCollection);
    await setDoc(vehicleDocRef, vehiclePayload);

    return {
      id: vehicleDocRef.id,
      data: vehiclePayload,
    };
  } catch (error) {
    console.error("Error creating vehicle document:", error);
    throw error;
  }
};

/**
 * Fetch all car-types from Firestore
 * @returns Promise with array of car-type documents
 */
export const fetchCarTypes = async (): Promise<any[]> => {
  try {
    const carTypesRef = collection(db, "car-types");
    const q = query(carTypesRef, orderBy("createdDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

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
 * Fetch all car-models from Firestore
 * @returns Promise with array of car-model documents
 */
export const fetchCarModels = async (): Promise<any[]> => {
  try {
    const carModelsRef = collection(db, "car-models");
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(
      carModelsRef
    );

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
 * @param carModelData - Car model data including name in Arabic and English
 * @returns Promise with created document ID and data
 */
export const createCarModel = async (carModelData: {
  name: { ar: string; en?: string };
  createdUserId?: string | null;
}): Promise<{ id: string; data: any }> => {
  try {
    const currentUser = auth.currentUser;
    const userEmail = currentUser?.email ?? carModelData.createdUserId ?? null;

    // Get a sample car-model to understand the schema
    const carModelsCollection = collection(db, "car-models");
    const sampleQuery = query(carModelsCollection, limit(1));
    const sampleSnapshot = await getDocs(sampleQuery);

    // Build car-model payload with same structure as existing documents
    const carModelPayload: any = {
      name: {
        ar: carModelData.name.ar,
        en: carModelData.name.en || carModelData.name.ar,
      },
      createdDate: serverTimestamp(),
      createdUserId: userEmail,
    };

    // If there's a sample document, copy other fields that might exist
    if (!sampleSnapshot.empty) {
      const sampleData = sampleSnapshot.docs[0].data();
      // Copy fields that should be preserved (excluding name, createdDate, createdUserId)
      Object.keys(sampleData).forEach((key) => {
        if (
          !["name", "createdDate", "createdUserId", "docId", "id"].includes(key)
        ) {
          // Set default values for other fields if they exist in sample
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
 * Fetch a single car-type by ID
 * @param carTypeId - Car type document ID
 * @returns Promise with car-type data
 */
export const fetchCarTypeById = async (carTypeId: string): Promise<any> => {
  try {
    const carTypeDocRef = doc(db, "car-types", carTypeId);
    const carTypeDoc = await getDoc(carTypeDocRef);

    if (!carTypeDoc.exists()) {
      throw new Error("Car type not found");
    }

    return {
      docId: carTypeDoc.id,
      id: carTypeDoc.id,
      ...carTypeDoc.data(),
    };
  } catch (error) {
    console.error("Error fetching car-type by ID:", error);
    throw error;
  }
};

/**
 * Update an existing car-type document in Firestore
 * @param carTypeId - Car type document ID
 * @param carTypeData - Updated car type data
 * @returns Promise with updated document data
 */
export const updateCarType = async (
  carTypeId: string,
  carTypeData: {
    name?: { ar: string; en?: string };
    carModel?: {
      name?: { ar: string; en?: string };
      carModelImageUrl?: string | null;
    };
    year?: string;
    fuelType?: string;
    imageFile?: File | null;
  }
): Promise<{ id: string; data: any }> => {
  try {
    if (!carTypeId) {
      throw new Error("Car type ID is required");
    }

    const carTypeDocRef = doc(db, "car-types", carTypeId);
    const existingDoc = await getDoc(carTypeDocRef);

    if (!existingDoc.exists()) {
      throw new Error("Car type not found");
    }

    const existingData = existingDoc.data();
    const updatePayload: any = {};

    // Update name if provided
    if (carTypeData.name) {
      updatePayload.name = {
        ar: carTypeData.name.ar,
        en: carTypeData.name.en || carTypeData.name.ar,
      };
    }

    // Update carModel if provided
    if (carTypeData.carModel) {
      let imageUrl = existingData.carModel?.carModelImageUrl || null;

      // Upload new image if provided
      if (carTypeData.imageFile instanceof File) {
        const timestamp = Date.now();
        const storagePath = `car-types/${timestamp}-${carTypeData.imageFile.name}`;
        imageUrl = await uploadFileToStorage(
          carTypeData.imageFile,
          storagePath
        );
      } else if (carTypeData.carModel.carModelImageUrl !== undefined) {
        imageUrl = carTypeData.carModel.carModelImageUrl;
      }

      updatePayload.carModel = {
        name: {
          ar:
            carTypeData.carModel.name?.ar ||
            existingData.carModel?.name?.ar ||
            "",
          en:
            carTypeData.carModel.name?.en ||
            carTypeData.carModel.name?.ar ||
            existingData.carModel?.name?.en ||
            existingData.carModel?.name?.ar ||
            "",
        },
        carModelImageUrl: imageUrl,
      };
    }

    // Update year if provided
    if (carTypeData.year !== undefined) {
      updatePayload.year = carTypeData.year;
    }

    // Update fuelType if provided
    if (carTypeData.fuelType !== undefined) {
      updatePayload.fuelType = carTypeData.fuelType;
    }

    await updateDoc(carTypeDocRef, updatePayload);

    return {
      id: carTypeId,
      data: { ...existingData, ...updatePayload },
    };
  } catch (error) {
    console.error("Error updating car-type:", error);
    throw error;
  }
};

/**
 * Delete a car-type document from Firestore
 * @param carTypeId - Car type document ID
 * @returns Promise<boolean> - true if successful
 */
export const deleteCarType = async (carTypeId: string): Promise<boolean> => {
  try {
    if (!carTypeId) {
      throw new Error("Car type ID is required");
    }

    const carTypeDocRef = doc(db, "car-types", carTypeId);
    const carTypeDoc = await getDoc(carTypeDocRef);

    if (!carTypeDoc.exists()) {
      throw new Error("Car type not found");
    }

    await deleteDoc(carTypeDocRef);

    console.log("✅ Car type deleted successfully:", carTypeId);
    return true;
  } catch (error) {
    console.error("Error deleting car-type:", error);
    throw error;
  }
};

/**
 * Create a new car-type document in Firestore
 * @param carTypeData - Car type data including name, carModel, year, fuelType, and optional imageFile
 * @returns Promise with created document ID and data
 */
export const createCarType = async (carTypeData: {
  name: { ar: string; en?: string };
  carModel: {
    name: { ar: string; en?: string };
    carModelImageUrl?: string | null;
  };
  year: string;
  fuelType: string;
  imageFile?: File | null;
  createdUserId?: string | null;
}): Promise<{ id: string; data: any }> => {
  try {
    const currentUser = auth.currentUser;
    const userEmail = currentUser?.email ?? carTypeData.createdUserId ?? null;

    let imageUrl: string | null = null;

    // Upload image if provided
    if (carTypeData.imageFile instanceof File) {
      const timestamp = Date.now();
      const storagePath = `car-types/${timestamp}-${carTypeData.imageFile.name}`;
      imageUrl = await uploadFileToStorage(carTypeData.imageFile, storagePath);
    } else if (carTypeData.carModel.carModelImageUrl) {
      imageUrl = carTypeData.carModel.carModelImageUrl;
    }

    // Build car-type payload
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
        carModelImageUrl: imageUrl,
      },
      year: carTypeData.year,
      fuelType: carTypeData.fuelType,
      createdDate: serverTimestamp(),
      createdUserId: userEmail,
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
 * Upload car brands from Excel data to car-models collection
 * Checks for duplicates before creating
 * @param brands - Array of brand names
 * @param createdUserId - Optional user ID for createdUserId field
 * @returns Object with created brands count and skipped (duplicate) count
 */
export const uploadCarBrandsFromExcel = async (
  brands: string[],
  createdUserId?: string | null
): Promise<{
  created: number;
  skipped: number;
  brandMap: Map<string, string>;
}> => {
  try {
    const currentUser = auth.currentUser;
    const userEmail = currentUser?.email ?? createdUserId ?? null;

    // Fetch existing brands to check for duplicates
    const existingBrands = await fetchCarModels();
    const existingBrandNames = new Set(
      existingBrands
        .map((brand) => brand.name?.ar?.trim().toLowerCase())
        .filter((name): name is string => !!name)
    );

    const brandMap = new Map<string, string>(); // brand name -> document ID
    let created = 0;
    let skipped = 0;

    // Process brands sequentially to avoid overwhelming Firestore
    for (const brandName of brands) {
      const normalizedName = brandName.trim().toLowerCase();

      // Check if brand already exists
      if (existingBrandNames.has(normalizedName)) {
        // Find the existing brand document ID
        const existingBrand = existingBrands.find(
          (b) => b.name?.ar?.trim().toLowerCase() === normalizedName
        );
        if (existingBrand?.id) {
          brandMap.set(brandName.trim(), existingBrand.id);
        }
        skipped++;
        continue;
      }

      try {
        // Create new brand
        const result = await createCarModel({
          name: { ar: brandName.trim() },
          createdUserId: userEmail,
        });

        brandMap.set(brandName.trim(), result.id);
        existingBrandNames.add(normalizedName); // Add to set to avoid duplicates in same batch
        created++;
      } catch (error) {
        console.error(`Error creating brand "${brandName}":`, error);
        // Continue with next brand even if one fails
      }
    }

    return { created, skipped, brandMap };
  } catch (error) {
    console.error("Error uploading car brands:", error);
    throw error;
  }
};

/**
 * Upload car types (models) from Excel data to car-types collection
 * Links each model to its brand using the brandMap
 * @param brandModels - Map of brand name to array of model names
 * @param brandMap - Map of brand name to brand document ID
 * @param defaultYear - Default year to use if not provided (default: "2020")
 * @param defaultFuelType - Default fuel type to use if not provided (default: "fuel95")
 * @param createdUserId - Optional user ID for createdUserId field
 * @returns Object with created models count and skipped (duplicate) count
 */
export const uploadCarTypesFromExcel = async (
  brandModels: Map<string, string[]>,
  brandMap: Map<string, string>,
  defaultYear: string = "2020",
  defaultFuelType: string = "fuel95",
  createdUserId?: string | null
): Promise<{ created: number; skipped: number }> => {
  try {
    const currentUser = auth.currentUser;
    const userEmail = currentUser?.email ?? createdUserId ?? null;

    // Fetch existing car types to check for duplicates
    const existingCarTypes = await fetchCarTypes();
    const existingTypeKeys = new Set(
      existingCarTypes.map((type) => {
        const brandName = type.carModel?.name?.ar?.trim().toLowerCase() || "";
        const modelName = type.name?.ar?.trim().toLowerCase() || "";
        return `${brandName}::${modelName}`;
      })
    );

    let created = 0;
    let skipped = 0;

    // Process each brand and its models
    for (const [brandName, models] of brandModels.entries()) {
      const brandDocId = brandMap.get(brandName.trim());

      if (!brandDocId) {
        console.warn(
          `Brand "${brandName}" not found in brandMap, skipping models`
        );
        continue;
      }

      // Get brand document to get brand name structure
      const brandDoc = await getDoc(doc(db, "car-models", brandDocId));
      if (!brandDoc.exists()) {
        console.warn(
          `Brand document "${brandDocId}" not found, skipping models`
        );
        continue;
      }

      const brandData = brandDoc.data();
      const brandNameAr = brandData?.name?.ar || brandName.trim();
      const brandNameEn = brandData?.name?.en || brandNameAr;

      // Process models for this brand
      for (const modelName of models) {
        const normalizedKey = `${brandName.trim().toLowerCase()}::${modelName
          .trim()
          .toLowerCase()}`;

        // Check if model already exists
        if (existingTypeKeys.has(normalizedKey)) {
          skipped++;
          continue;
        }

        try {
          // Create new car type
          await createCarType({
            name: { ar: modelName.trim() },
            carModel: {
              name: { ar: brandNameAr, en: brandNameEn },
              carModelImageUrl: null,
            },
            year: defaultYear,
            fuelType: defaultFuelType,
            createdUserId: userEmail,
          });

          existingTypeKeys.add(normalizedKey); // Add to set to avoid duplicates in same batch
          created++;
        } catch (error) {
          console.error(
            `Error creating model "${modelName}" for brand "${brandName}":`,
            error
          );
          // Continue with next model even if one fails
        }
      }
    }

    return { created, skipped };
  } catch (error) {
    console.error("Error uploading car types:", error);
    throw error;
  }
};

export const updateVehicleWithSchema = async ({
  vehicleId,
  chassisNumber,
  plateNumber,
  name,
  imageFile = undefined,
  driverIdentifiers,
}: UpdateVehicleOptions) => {
  try {
    if (!vehicleId) {
      throw new Error("Vehicle ID is required to update a vehicle.");
    }

    const vehicleDocRef = doc(db, "vehicles", vehicleId);
    const snapshot = await getDoc(vehicleDocRef);

    if (!snapshot.exists()) {
      throw new Error("Vehicle not found.");
    }

    const existingData = snapshot.data() ?? {};

    let resolvedImage: string | null | undefined = undefined;

    if (imageFile !== undefined) {
      if (imageFile instanceof File) {
        const timestamp = Date.now();
        const storagePath = `vehicles/${timestamp}-${imageFile.name}`;
        resolvedImage = await uploadFileToStorage(imageFile, storagePath);
      } else if (typeof imageFile === "string") {
        const trimmed = imageFile.trim();
        resolvedImage = trimmed.length > 0 ? trimmed : null;
      } else {
        resolvedImage = null;
      }
    }

    const normalizedDriverIds =
      driverIdentifiers !== undefined
        ? normalizeDriverIdentifiers(driverIdentifiers)
        : undefined;

    const payload = buildVehicleSchemaPayload(existingData, {
      chassisNumber:
        chassisNumber !== undefined ? chassisNumber ?? null : undefined,
      name: name !== undefined ? name ?? null : undefined,
      plateNumber:
        plateNumber !== undefined
          ? {
              ar: plateNumber ?? null,
              en: plateNumber ?? null,
            }
          : undefined,
      image: resolvedImage,
      driverIds: normalizedDriverIds,
    });

    if (!payload.createdDate) {
      payload.createdDate = serverTimestamp();
    }

    if (payload.createdUserId === null && existingData?.createdUserId) {
      payload.createdUserId = existingData.createdUserId;
    }

    await setDoc(vehicleDocRef, payload, { merge: false });

    return {
      id: vehicleId,
      data: payload,
    };
  } catch (error) {
    console.error("Error updating vehicle document:", error);
    throw error;
  }
};

/**
 * Fetch a single vehicle document from Firestore
 * @param vehicleId - Vehicle document ID
 * @returns Promise with the vehicle data
 */
export const fetchVehicleById = async (vehicleId: string) => {
  try {
    const vehicleDocRef = doc(db, "vehicles", vehicleId);
    const vehicleDoc = await getDoc(vehicleDocRef);

    if (!vehicleDoc.exists()) {
      throw new Error("Vehicle not found");
    }

    return {
      docId: vehicleDoc.id,
      ...vehicleDoc.data(),
    };
  } catch (error) {
    console.error("Error fetching vehicle by ID:", error);
    throw error;
  }
};

/**
 * Fetch a driver document from Firestore by document ID or email fallback
 * @param identifier - Driver document ID or email
 * @returns Promise with the driver data or null if not found
 */
export const fetchDriverByIdentifier = async (
  identifier: string
): Promise<Record<string, any> | null> => {
  try {
    const trimmedIdentifier = identifier?.trim?.() ?? identifier;
    const candidateIds = [
      identifier,
      trimmedIdentifier,
      trimmedIdentifier?.toLowerCase?.(),
      trimmedIdentifier?.toUpperCase?.(),
    ];

    for (const candidate of candidateIds) {
      if (!candidate) continue;
      const driverDocRef = doc(db, "drivers", candidate);
      const driverDoc = await getDoc(driverDocRef);
      if (driverDoc.exists()) {
        return {
          docId: driverDoc.id,
          ...driverDoc.data(),
        };
      }
    }

    const emailCandidates = Array.from(
      new Set(
        [
          identifier,
          trimmedIdentifier,
          trimmedIdentifier?.toLowerCase?.(),
        ].filter(
          (value) =>
            value !== null && value !== undefined && String(value).trim() !== ""
        )
      )
    );

    if (emailCandidates.length === 0) {
      return null;
    }

    const driversRef = collection(db, "drivers");
    for (const emailCandidate of emailCandidates) {
      const emailQuerySnapshot = await getDocs(
        query(driversRef, where("email", "==", emailCandidate))
      );

      if (!emailQuerySnapshot.empty) {
        const driverDoc = emailQuerySnapshot.docs[0];
        return {
          docId: driverDoc.id,
          ...driverDoc.data(),
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching driver by identifier:", error);
    throw error;
  }
};

export const assignVehicleToDriver = async ({
  driverIdentifier,
  vehicleId,
  vehicleName,
  plateNumber,
}: {
  driverIdentifier: string;
  vehicleId: string;
  vehicleName: string;
  plateNumber: string;
}) => {
  const driverRecord = await fetchDriverByIdentifier(driverIdentifier);

  if (!driverRecord || !driverRecord.docId) {
    throw new Error("Driver not found for the provided identifier.");
  }

  const driverDocRef = doc(db, "drivers", driverRecord.docId);

  await updateDoc(driverDocRef, {
    vehicle: {
      id: vehicleId,
      name: vehicleName ?? null,
      plateNumber: plateNumber ?? null,
    },
    driverIds: arrayUnion(vehicleId),
  });
};

/**
 * Add driver reference to a vehicle document (driverIds array)
 * @param vehicleId - Vehicle document ID
 * @param driverIdentifier - Driver identifier (document ID or legacy identifier)
 */
export const addDriverToVehicle = async (
  vehicleId: string,
  driverIdentifier: string
) => {
  try {
    if (!vehicleId || !driverIdentifier) {
      throw new Error("Vehicle ID and Driver identifier are required");
    }

    const vehicleDocRef = doc(db, "vehicles", vehicleId);
    await updateDoc(vehicleDocRef, {
      driverIds: arrayUnion(driverIdentifier),
    });
  } catch (error) {
    console.error("Error adding driver to vehicle:", error);
    throw error;
  }
};

/**
 * Fetch a single driver by ID from Firestore
 * @param driverId - Driver document ID
 * @returns Promise with the driver data
 */
export const fetchDriverById = async (driverId: string) => {
  try {
    // console.log('Fetching driver by ID:', driverId);

    const driverDocRef = doc(db, "companies-drivers", driverId);
    const driverDoc = await getDoc(driverDocRef);

    if (!driverDoc.exists()) {
      throw new Error("Driver not found");
    }

    const driverData = {
      id: driverDoc.id,
      ...driverDoc.data(),
    };

    // console.log('Driver data fetched:', driverData);

    return driverData;
  } catch (error) {
    console.error("Error fetching driver by ID:", error);
    throw error;
  }
};

/**
 * Fetch multiple drivers by their IDs from companies-drivers collection
 * @param driverIds - Array of driver document IDs
 * @returns Promise with array of driver data
 */
export const fetchDriversByIds = async (driverIds: string[]) => {
  try {
    if (!driverIds || driverIds.length === 0) {
      console.log("No driver IDs provided");
      return [];
    }

    // Filter out null, undefined, and empty string IDs
    const validDriverIds = driverIds.filter(
      (id) => id && typeof id === "string" && id.trim() !== ""
    );

    if (validDriverIds.length === 0) {
      console.log("No valid driver IDs found after filtering");
      return [];
    }

    console.log("Fetching drivers by IDs:", validDriverIds);

    // Fetch all company drivers first
    const allDrivers = await fetchCompaniesDrivers();
    console.log("All company drivers fetched:", allDrivers.length);

    // Filter drivers by matching their IDs with the provided driverIds
    const carDrivers = allDrivers.filter((driver) =>
      validDriverIds.includes(driver.id)
    );

    console.log("Car drivers found:", carDrivers.length);
    console.log("Car drivers:", carDrivers);

    return carDrivers;
  } catch (error) {
    console.error("Error fetching drivers by IDs:", error);
    throw error;
  }
};

/**
 * Add a driver to a car (creates bidirectional link)
 * @param driverId - Driver document ID
 * @param carId - Car document ID
 * @param carData - Car data to store in driver document
 * @returns Promise with update result
 */
export const addDriverToCar = async (
  driverId: string,
  carId: string,
  carData: any
) => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("No user is currently logged in");
    }

    // console.log('Adding driver to car...');
    // console.log('Driver ID:', driverId);
    // console.log('Car ID:', carId);
    // console.log('Car data:', carData);

    // Update the car document - add driver ID to driverIds array
    const carDocRef = doc(db, "companies-cars", carId);
    await updateDoc(carDocRef, {
      driverIds: arrayUnion(driverId),
    });
    // console.log('Car updated: Added driver to driverIds array');

    // Update the driver document - add car data
    const driverDocRef = doc(db, "companies-drivers", driverId);
    await updateDoc(driverDocRef, {
      car: {
        id: carId,
        name: carData.name || "",
        plateNumber: carData.plateNumber || {},
        carModel: carData.carModel || {},
        carType: carData.carType || {},
        fuelType: carData.fuelType || "",
        size: carData.size || carData.plan?.carSize || "",
      },
    });
    // console.log('Driver updated: Added car data to driver document');

    return {
      success: true,
      driverId,
      carId,
    };
  } catch (error) {
    console.error("Error adding driver to car:", error);
    throw error;
  }
};

// ==================== ADD CAR FUNCTION ====================

export interface AddCarData {
  carName: string;
  fuelType: string;
  carType: string;
  city: string;
  year: string;
  model: string;
  brand: string;
  plateLetters: string;
  plateNumbers: string;
  carCondition: string;
}

export interface AddStationData {
  stationName: string;
  email: string;
  phone: string;
  address: string;
  location: string; // Google Maps link
  secretNumber: string; // Password for Firebase Auth
  selectedCategories: string[]; // Array of category IDs
  categoryPrices: {
    [categoryId: string]: { price: number; companyPrice: number; desc: string };
  };
}

export interface AddCompanyData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  brandName: string;
  commercialRegistrationNumber?: string;
  vatNumber?: string;
  city: string;
  address?: string;
  logoFile?: File | null;
  addressFile?: File | null;
  taxCertificateFile?: File | null;
  commercialRegistrationFile?: File | null;
}
export interface AddServiceProviderData {
  // Basic fields
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  brandName: string;
  commercialRegistrationNumber: string;
  vatNumber: string;

  // Location fields - simple address string
  address: string;
  location: string; // Google Maps link or coordinates

  // FormattedLocation nested fields
  city: string;
  country: string;
  countryCode: string;
  highway: string;
  postcode: string;
  road: string;
  state: string;
  stateDistrict: string;

  // File uploads
  logoFile?: File | null;
  addressFile?: File | null;
  taxCertificateFile?: File | null;
  commercialRegistrationFile?: File | null;
}

export interface AddPetrolifeAgentData {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  agentCode?: string;
  commissionValue: string;
  imageFile?: File | null;
}

export interface PetrolifeAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  agentCode: string;
  commissionValue: number;
  imageUrl?: string;
  joinDate: Timestamp;
  isActive: boolean;
  companies: string[]; // Array of company document IDs
  createdDate: Timestamp;
  createdUserId: string;
}

/**
 * Add a new car to Firestore companies-cars collection
 * @param carData - Car form data
 * @returns Promise with the created car document
 */
export const addCompanyCar = async (carData: AddCarData) => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("No user is currently logged in");
    }

    // console.log('Adding new car to Firestore...');
    // console.log('Current user:', currentUser.email, currentUser.uid);
    // console.log('Car data:', carData);

    // Convert fuel type to code
    const fuelTypeMap: { [key: string]: string } = {
      "بنزين 91": "fuel91",
      "بنزين 95": "fuel95",
      ديزل: "diesel",
    };

    // Convert car type to size code
    const carSizeMap: { [key: string]: string } = {
      صغيرة: "small",
      متوسطة: "medium",
      كبيرة: "large",
      Vip: "vip",
      VIP: "vip",
    };

    // Prepare the car document
    const carDocument = {
      // Basic info
      name: carData.carName,

      // City object
      city: getCityObject(carData.city),

      // Plate number
      plateNumber: {
        ar: `${carData.plateNumbers} ${carData.plateLetters}`,
        en: `${carData.plateNumbers} ${convertPlateLettersToEnglish(
          carData.plateLetters
        )}`,
      },

      // Car Model (Brand)
      carModel: {
        name: {
          ar: carData.brand,
          en: carData.brand,
        },
        createdUserId: currentUser.email || "",
        createdDate: serverTimestamp(),
      },

      // Car Type (Model + Year)
      carType: {
        name: {
          ar: carData.model,
          en: carData.model,
        },
        year: carData.year,
        createdUserId: currentUser.email || "",
        createdDate: serverTimestamp(),
      },

      // Fuel type
      fuelType: fuelTypeMap[carData.fuelType] || "fuel95",

      // Car size
      size: carSizeMap[carData.carType] || "small",

      // Plan details
      plan: {
        carSize: carSizeMap[carData.carType] || "small",
        createdDate: Date.now(),
        createdUserId: currentUser.email || "",
      },

      // Car condition/status
      vehicleStatus: carData.carCondition,

      // System fields
      createdDate: serverTimestamp(),
      createdUserId: currentUser.email || "",
      companyUid: currentUser.uid, // Current user's UID

      // Empty arrays for future use
      driverIds: [],

      // Balance/financial
      balance: 0,
    };

    // console.log('Prepared car document:', carDocument);

    // Add to Firestore
    const companiesCarsRef = collection(db, "companies-cars");
    const docRef = await addDoc(companiesCarsRef, carDocument);

    // console.log('Car added successfully with ID:', docRef.id);

    return {
      id: docRef.id,
      ...carDocument,
    };
  } catch (error) {
    console.error("Error adding car to Firestore:", error);
    throw error;
  }
};

/**
 * Fetch a single car by ID from Firestore
 * @param carId - Car document ID
 * @returns Promise with the car data
 */
export const fetchCarById = async (carId: string) => {
  try {
    // console.log('Fetching car by ID:', carId);

    const carDocRef = doc(db, "companies-cars", carId);
    const carDoc = await getDoc(carDocRef);

    if (!carDoc.exists()) {
      throw new Error("Car not found");
    }

    const carData = {
      id: carDoc.id,
      ...carDoc.data(),
    };

    // console.log('Car data fetched:', carData);

    return carData;
  } catch (error) {
    console.error("Error fetching car by ID:", error);
    throw error;
  }
};

/**
 * Fetch companies-cars data from Firestore
 * @returns Promise with the companies-cars data
 */
export const fetchCompaniesCars = async () => {
  try {
    // console.log('Fetching companies-cars data from Firestore...');

    const companiesCarsRef = collection(db, "companies-cars");
    const q = query(companiesCarsRef, orderBy("createdDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    const companiesCarsData: any[] = [];

    querySnapshot.forEach((doc) => {
      companiesCarsData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // console.log('Companies-Cars Data (All):');
    // console.log('======================');
    // console.log(`Total documents: ${companiesCarsData.length}`);
    // console.log('Data:', companiesCarsData);
    // console.table(companiesCarsData);

    // Get current user
    const currentUser = auth.currentUser;

    if (currentUser) {
      const userEmail = currentUser.email;
      const userId = currentUser.uid;

      // console.log('\nCurrent User Info:');
      // console.log('==================');
      // console.log('Email:', userEmail);
      // console.log('UID:', userId);

      // Filter cars where createdUserId contains user email OR companyUid equals user id
      const filteredCars = companiesCarsData.filter((car) => {
        const createdUserIdMatch =
          car.createdUserId &&
          userEmail &&
          car.createdUserId.toLowerCase().includes(userEmail.toLowerCase());

        const companyUidMatch =
          car.companyUid && userId && car.companyUid === userId;

        return createdUserIdMatch || companyUidMatch;
      });

      // console.log('\nFiltered Companies-Cars Data:');
      // console.log('=================================');
      // console.log(`Total filtered documents: ${filteredCars.length}`);
      // console.log('Filtered Data:', filteredCars);
      // console.table(filteredCars);

      return filteredCars;
    } else {
      // console.log('\nNo user is currently logged in. Returning all data.');
      return companiesCarsData;
    }
  } catch (error) {
    console.error("Error fetching companies-cars data:", error);
    throw error;
  }
};

/**
 * Identify the current user's type and identifier
 * Checks all user collections to determine where the user belongs
 * @returns Object with userType, identifier, and collection name, or null if not found
 */
export const identifyCurrentUser = async (): Promise<{
  userType:
    | "client"
    | "company"
    | "driver"
    | "service-provider"
    | "fuel-station-worker"
    | null;
  identifier: string; // email or document ID
  collection: string; // collection name
  documentId?: string; // Firestore document ID
} | null> => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log("❌ No user is currently logged in for identification.");
      return null;
    }

    const userEmail = currentUser.email;
    const userUid = currentUser.uid;

    console.log("🔍 Identifying current user:", {
      email: userEmail,
      uid: userUid,
    });

    // 1. Check companies collection
    try {
      const companiesRef = collection(db, "companies");

      // Check by email
      if (userEmail) {
        const companyQueryByEmail = query(
          companiesRef,
          where("email", "==", userEmail)
        );
        const companySnapshotByEmail = await getDocs(companyQueryByEmail);

        if (!companySnapshotByEmail.empty) {
          const docId = companySnapshotByEmail.docs[0].id;
          const identifier = userEmail || docId;
          console.log("✅ User identified as company (by email):", identifier);
          return {
            userType: "company",
            identifier: identifier,
            collection: "companies",
            documentId: docId,
          };
        }
      }

      // Check by uid
      if (userUid) {
        const companyQueryByUid = query(
          companiesRef,
          where("uid", "==", userUid)
        );
        const companySnapshotByUid = await getDocs(companyQueryByUid);

        if (!companySnapshotByUid.empty) {
          const docId = companySnapshotByUid.docs[0].id;
          const data = companySnapshotByUid.docs[0].data();
          const identifier = data.email || userUid || docId;
          console.log("✅ User identified as company (by uid):", identifier);
          return {
            userType: "company",
            identifier: identifier,
            collection: "companies",
            documentId: docId,
          };
        }
      }
    } catch (error) {
      console.error("Error checking companies collection:", error);
    }

    // 2. Check clients collection
    try {
      const clientsRef = collection(db, "clients");

      if (userEmail) {
        const clientQueryByEmail = query(
          clientsRef,
          where("email", "==", userEmail)
        );
        const clientSnapshotByEmail = await getDocs(clientQueryByEmail);

        if (!clientSnapshotByEmail.empty) {
          const docId = clientSnapshotByEmail.docs[0].id;
          const identifier = userEmail || docId;
          console.log("✅ User identified as client (by email):", identifier);
          return {
            userType: "client",
            identifier: identifier,
            collection: "clients",
            documentId: docId,
          };
        }
      }

      if (userUid) {
        const clientQueryByUid = query(clientsRef, where("uid", "==", userUid));
        const clientSnapshotByUid = await getDocs(clientQueryByUid);

        if (!clientSnapshotByUid.empty) {
          const docId = clientSnapshotByUid.docs[0].id;
          const data = clientSnapshotByUid.docs[0].data();
          const identifier = data.email || userUid || docId;
          console.log("✅ User identified as client (by uid):", identifier);
          return {
            userType: "client",
            identifier: identifier,
            collection: "clients",
            documentId: docId,
          };
        }
      }
    } catch (error) {
      console.error("Error checking clients collection:", error);
    }

    // 3. Check stationscompany collection (service providers)
    try {
      const stationsCompanyRef = collection(db, "stationscompany");

      if (userEmail) {
        const stationQueryByEmail = query(
          stationsCompanyRef,
          where("email", "==", userEmail)
        );
        const stationSnapshotByEmail = await getDocs(stationQueryByEmail);

        if (!stationSnapshotByEmail.empty) {
          const docId = stationSnapshotByEmail.docs[0].id;
          const identifier = userEmail || docId;
          console.log(
            "✅ User identified as service-provider (by email):",
            identifier
          );
          return {
            userType: "service-provider",
            identifier: identifier,
            collection: "stationscompany",
            documentId: docId,
          };
        }
      }

      if (userUid) {
        const stationQueryByUid = query(
          stationsCompanyRef,
          where("uid", "==", userUid)
        );
        const stationSnapshotByUid = await getDocs(stationQueryByUid);

        if (!stationSnapshotByUid.empty) {
          const docId = stationSnapshotByUid.docs[0].id;
          const data = stationSnapshotByUid.docs[0].data();
          const identifier = data.email || userUid || docId;
          console.log(
            "✅ User identified as service-provider (by uid):",
            identifier
          );
          return {
            userType: "service-provider",
            identifier: identifier,
            collection: "stationscompany",
            documentId: docId,
          };
        }
      }
    } catch (error) {
      console.error("Error checking stationscompany collection:", error);
    }

    // 4. Check companies-drivers collection
    try {
      const driversRef = collection(db, "companies-drivers");

      if (userEmail) {
        const driverQueryByEmail = query(
          driversRef,
          where("email", "==", userEmail)
        );
        const driverSnapshotByEmail = await getDocs(driverQueryByEmail);

        if (!driverSnapshotByEmail.empty) {
          const docId = driverSnapshotByEmail.docs[0].id;
          const identifier = userEmail || docId;
          console.log("✅ User identified as driver (by email):", identifier);
          return {
            userType: "driver",
            identifier: identifier,
            collection: "companies-drivers",
            documentId: docId,
          };
        }
      }

      if (userUid) {
        const driverQueryByUid = query(driversRef, where("uid", "==", userUid));
        const driverSnapshotByUid = await getDocs(driverQueryByUid);

        if (!driverSnapshotByUid.empty) {
          const docId = driverSnapshotByUid.docs[0].id;
          const data = driverSnapshotByUid.docs[0].data();
          const identifier = data.email || userUid || docId;
          console.log("✅ User identified as driver (by uid):", identifier);
          return {
            userType: "driver",
            identifier: identifier,
            collection: "companies-drivers",
            documentId: docId,
          };
        }
      }
    } catch (error) {
      console.error("Error checking companies-drivers collection:", error);
    }

    // 5. Check fuelStationsWorkers collection
    try {
      const workersRef = collection(db, "fuelStationsWorkers");

      if (userEmail) {
        const workerQueryByEmail = query(
          workersRef,
          where("email", "==", userEmail)
        );
        const workerSnapshotByEmail = await getDocs(workerQueryByEmail);

        if (!workerSnapshotByEmail.empty) {
          const docId = workerSnapshotByEmail.docs[0].id;
          const identifier = userEmail || docId;
          console.log(
            "✅ User identified as fuel-station-worker (by email):",
            identifier
          );
          return {
            userType: "fuel-station-worker",
            identifier: identifier,
            collection: "fuelStationsWorkers",
            documentId: docId,
          };
        }
      }

      if (userUid) {
        const workerQueryByUid = query(workersRef, where("uid", "==", userUid));
        const workerSnapshotByUid = await getDocs(workerQueryByUid);

        if (!workerSnapshotByUid.empty) {
          const docId = workerSnapshotByUid.docs[0].id;
          const data = workerSnapshotByUid.docs[0].data();
          const identifier = data.email || userUid || docId;
          console.log(
            "✅ User identified as fuel-station-worker (by uid):",
            identifier
          );
          return {
            userType: "fuel-station-worker",
            identifier: identifier,
            collection: "fuelStationsWorkers",
            documentId: docId,
          };
        }
      }
    } catch (error) {
      console.error("Error checking fuelStationsWorkers collection:", error);
    }

    console.warn("⚠️ User not found in any collection");
    return null;
  } catch (error) {
    console.error("❌ Error identifying current user:", error);
    return null;
  }
};

/**
 * Fetch notifications from Firestore notifications collection
 * Filtered by current user based on targetedUsers structure
 * @returns Promise with filtered notifications data
 */
export const fetchNotifications = async () => {
  try {
    console.log("🔔 Fetching notifications from Firestore...");

    // Get current user
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log("❌ No user is currently logged in.");
      return [];
    }

    // Identify current user type and identifier
    const userInfo = await identifyCurrentUser();

    if (!userInfo) {
      console.log("❌ Could not identify current user type.");
      return [];
    }

    console.log("✅ User identified:", {
      userType: userInfo.userType,
      identifier: userInfo.identifier,
      collection: userInfo.collection,
    });

    // Map user types to targetedUsers keys
    const typeToTargetKey: Record<string, string> = {
      client: "clients",
      company: "companies",
      driver: "companies-drivers",
      "service-provider": "stationscompany",
      "fuel-station-worker": "fuelStationsWorkers",
    };

    const targetKey = typeToTargetKey[userInfo.userType || ""];

    if (!targetKey) {
      console.warn("⚠️ Unknown user type:", userInfo.userType);
      return [];
    }

    // Fetch all notifications
    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, orderBy("createdDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    const allNotifications: any[] = [];
    querySnapshot.forEach((doc) => {
      allNotifications.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(
      "📋 Total notifications in collection:",
      allNotifications.length
    );

    // Filter notifications based on targetedUsers structure
    const filteredNotifications = allNotifications.filter((notification) => {
      const targetedUsers = notification.targetedUsers || {};
      const targetArray = targetedUsers[targetKey];

      // If the target key doesn't exist in targetedUsers, skip this notification
      if (!targetArray && !Array.isArray(targetArray)) {
        return false;
      }

      // Empty array means "all users of this type" - include the notification
      if (Array.isArray(targetArray) && targetArray.length === 0) {
        console.log("✅ Notification matched (all users of type):", {
          id: notification.id,
          title: notification.title?.substring(0, 50),
          targetKey: targetKey,
        });
        return true;
      }

      // Check if user's identifier is in the array
      if (Array.isArray(targetArray)) {
        const isIncluded = targetArray.includes(userInfo.identifier);

        if (isIncluded) {
          console.log("✅ Notification matched (specific user):", {
            id: notification.id,
            title: notification.title?.substring(0, 50),
            targetKey: targetKey,
            identifier: userInfo.identifier,
          });
        }

        return isIncluded;
      }

      return false;
    });

    console.log(
      "✅ Filtered notifications for current user:",
      filteredNotifications.length
    );

    // Sort by createdDate (most recent first) - already sorted by query, but ensure
    filteredNotifications.sort((a, b) => {
      const dateA = a.createdDate?.toDate?.() || new Date(a.createdDate || 0);
      const dateB = b.createdDate?.toDate?.() || new Date(b.createdDate || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return filteredNotifications;
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    throw error;
  }
};

/**
 * Fetch a single supervisor by ID from mock data
 * @param supervisorId - Supervisor ID
 * @returns Promise with the supervisor data
 */
export const fetchSupervisorById = async (supervisorId: string) => {
  try {
    console.log("Fetching supervisor by ID:", supervisorId);

    // Fetch the specific user document from Firestore
    const userDocRef = doc(db, "users", supervisorId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("Supervisor not found");
    }

    const data = userDoc.data();

    // Verify user is admin or super admin
    if (data.isAdmin !== true && data.isSuperAdmin !== true) {
      throw new Error("User is not a supervisor/admin");
    }

    const supervisor = {
      id: userDoc.id,
      supervisorCode: data.uid || data.id || userDoc.id || "-",
      supervisorName: data.name || data.fullName || data.displayName || "-",
      phone: data.phoneNumber || data.phone || "-",
      email: data.email || "-",
      city: data.city || data.location || "-",
      accountStatus: {
        active: data.isActive === true,
        text: data.isActive === true ? "مفعل" : "معطل",
      },
      ...data,
    };

    console.log("Supervisor data fetched:", supervisor);

    return supervisor;
  } catch (error) {
    console.error("Error fetching supervisor by ID:", error);
    throw error;
  }
};

/**
 * Update supervisor isActive status in users collection
 * @param supervisorId - The ID of the supervisor (user document ID)
 * @param isActive - The new isActive status (true or false)
 * @returns Promise<boolean> - Returns true if update was successful
 */
export const updateSupervisorIsActive = async (
  supervisorId: string,
  isActive: boolean
): Promise<boolean> => {
  try {
    console.log(
      `📝 Updating supervisor isActive status: ${supervisorId} -> ${isActive}`
    );

    const userDocRef = doc(db, "users", supervisorId);
    await updateDoc(userDocRef, {
      isActive: isActive,
    });

    console.log(`✅ Successfully updated supervisor isActive status`);
    return true;
  } catch (error) {
    console.error("❌ Error updating supervisor isActive status:", error);
    throw error;
  }
};

/**
 * Delete supervisor from users collection
 * @param supervisorId - The ID of the supervisor (user document ID)
 * @returns Promise<boolean> - Returns true if deletion was successful
 */
export const deleteSupervisor = async (
  supervisorId: string
): Promise<boolean> => {
  try {
    console.log(`🗑️ Deleting supervisor from Firestore: ${supervisorId}`);

    // Verify the user is a supervisor/admin before deleting
    const userDocRef = doc(db, "users", supervisorId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("Supervisor not found");
    }

    const data = userDoc.data();
    if (data.isAdmin !== true && data.isSuperAdmin !== true) {
      throw new Error("User is not a supervisor/admin");
    }

    // Delete the user document
    await deleteDoc(userDocRef);
    console.log(`✅ Successfully deleted supervisor from Firestore`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting supervisor:", error);
    throw error;
  }
};

/**
 * Add refid to existing supervisors that don't have one
 * Generates unique 8-digit codes for all supervisors without refid
 * @returns Promise with the number of supervisors updated
 */
export const addRefidToExistingSupervisors = async (): Promise<number> => {
  try {
    console.log(
      "🔄 Starting migration: Adding refid to existing supervisors..."
    );

    // Fetch all users
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdDate", "desc"));
    const usersSnapshot = await getDocs(q);
    console.log(`📦 Found ${usersSnapshot.size} users`);

    let updatedCount = 0;
    const supervisorsToUpdate: Array<{ docRef: any; refid: string }> = [];

    // First pass: Identify supervisors without refid and generate refids
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();

      // Only process supervisors/admins
      if (userData.isAdmin !== true && userData.isSuperAdmin !== true) {
        continue;
      }

      // Skip if supervisor already has refid
      if (userData.refid) {
        console.log(
          `⏭️  Supervisor ${userDoc.id} already has refid: ${userData.refid}`
        );
        continue;
      }

      // Generate unique 8-digit refid
      let refid: string = "";
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 20;

      while (!isUnique && attempts < maxAttempts) {
        // Generate 8-digit number (10000000 to 99999999)
        const randomCode = Math.floor(10000000 + Math.random() * 90000000);
        refid = randomCode.toString();

        // Check if refid already exists in Firestore or in our pending updates
        const usersRefCheck = collection(db, "users");
        const qCheck = query(usersRefCheck, where("refid", "==", refid));
        const querySnapshot = await getDocs(qCheck);

        // Also check if this refid is already in our pending updates
        const isInPendingUpdates = supervisorsToUpdate.some(
          (item) => item.refid === refid
        );

        if (querySnapshot.empty && !isInPendingUpdates) {
          isUnique = true;
        } else {
          attempts++;
        }
      }

      if (!isUnique || !refid) {
        console.error(
          `❌ Failed to generate unique refid for supervisor ${userDoc.id} after ${maxAttempts} attempts`
        );
        continue;
      }

      supervisorsToUpdate.push({
        docRef: doc(db, "users", userDoc.id),
        refid: refid,
      });

      console.log(`✅ Generated refid ${refid} for supervisor ${userDoc.id}`);
    }

    console.log(
      `📝 Updating ${supervisorsToUpdate.length} supervisors with refid...`
    );

    // Second pass: Update all supervisors in batch
    for (const { docRef, refid } of supervisorsToUpdate) {
      try {
        await updateDoc(docRef, { refid: refid });
        updatedCount++;
        console.log(`✅ Updated supervisor ${docRef.id} with refid: ${refid}`);
      } catch (error) {
        console.error(`❌ Error updating supervisor ${docRef.id}:`, error);
      }
    }

    console.log(
      `✅ Migration completed: ${updatedCount} supervisors updated with refid`
    );
    return updatedCount;
  } catch (error) {
    console.error("❌ Error in migration:", error);
    throw error;
  }
};

/**
 * Fetch a client by its ID
 * @param clientId - The ID of the client to fetch
 * @returns Promise with the client data
 */
export const fetchClientById = async (clientId: string) => {
  try {
    console.log("Fetching client by ID:", clientId);

    // Fetch the specific client document from Firestore
    const clientDocRef = doc(db, "clients", clientId);
    const clientDoc = await getDoc(clientDocRef);

    if (!clientDoc.exists()) {
      throw new Error("Client not found");
    }

    const clientData = clientDoc.data();

    const client = {
      id: clientDoc.id,
      ...clientData,
    };

    console.log("Client data fetched:", client);

    return client;
  } catch (error) {
    console.error("Error fetching client by ID:", error);
    throw error;
  }
};

/**
 * Update client isActive status in clients collection
 * @param clientId - The ID of the client (document ID)
 * @param isActive - The new isActive status (true or false)
 * @returns Promise<boolean> - Returns true if update was successful
 */
export const updateClientIsActive = async (
  clientId: string,
  isActive: boolean
): Promise<boolean> => {
  try {
    console.log(
      `📝 Updating client isActive status: ${clientId} -> ${isActive}`
    );

    const clientDocRef = doc(db, "clients", clientId);
    await updateDoc(clientDocRef, {
      isActive: isActive,
    });

    console.log(`✅ Successfully updated client isActive status`);
    return true;
  } catch (error) {
    console.error("❌ Error updating client isActive status:", error);
    throw error;
  }
};

/**
 * Delete client from clients collection
 * @param clientId - The ID of the client (document ID)
 * @returns Promise<boolean> - Returns true if deletion was successful
 */
export const deleteClient = async (clientId: string): Promise<boolean> => {
  try {
    console.log(`🗑️ Deleting client from Firestore: ${clientId}`);

    // Verify the client exists before deleting
    const clientDocRef = doc(db, "clients", clientId);
    const clientDoc = await getDoc(clientDocRef);

    if (!clientDoc.exists()) {
      throw new Error("Client not found");
    }

    // Delete the client document
    await deleteDoc(clientDocRef);
    console.log(`✅ Successfully deleted client from Firestore`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting client:", error);
    throw error;
  }
};

/**
 * Add refid to existing clients that don't have one
 * Generates unique 8-digit codes for all clients without refid
 * @returns Promise with the number of clients updated
 */
export const addRefidToExistingClients = async (): Promise<number> => {
  try {
    console.log("🔄 Starting migration: Adding refid to existing clients...");

    // Fetch all clients
    const clientsRef = collection(db, "clients");
    const q = query(clientsRef, orderBy("createdDate", "desc"));
    const clientsSnapshot = await getDocs(q);
    console.log(`📦 Found ${clientsSnapshot.size} clients`);

    let updatedCount = 0;
    const clientsToUpdate: Array<{ docRef: any; refid: string }> = [];

    // First pass: Identify clients without refid and generate refids
    for (const clientDoc of clientsSnapshot.docs) {
      const clientData = clientDoc.data();

      // Skip if client already has refid
      if (clientData.refid) {
        console.log(
          `⏭️  Client ${clientDoc.id} already has refid: ${clientData.refid}`
        );
        continue;
      }

      // Generate unique 8-digit refid
      let refid: string = "";
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 20;

      while (!isUnique && attempts < maxAttempts) {
        // Generate 8-digit number (10000000 to 99999999)
        const randomCode = Math.floor(10000000 + Math.random() * 90000000);
        refid = randomCode.toString();

        // Check if refid already exists in Firestore or in our pending updates
        const clientsRefCheck = collection(db, "clients");
        const qCheck = query(clientsRefCheck, where("refid", "==", refid));
        const querySnapshot = await getDocs(qCheck);

        // Also check if this refid is already in our pending updates
        const isInPendingUpdates = clientsToUpdate.some(
          (item) => item.refid === refid
        );

        if (querySnapshot.empty && !isInPendingUpdates) {
          isUnique = true;
        } else {
          attempts++;
        }
      }

      if (!isUnique || !refid) {
        console.error(
          `❌ Failed to generate unique refid for client ${clientDoc.id} after ${maxAttempts} attempts`
        );
        continue;
      }

      clientsToUpdate.push({
        docRef: doc(db, "clients", clientDoc.id),
        refid: refid,
      });

      console.log(`✅ Generated refid ${refid} for client ${clientDoc.id}`);
    }

    console.log(`📝 Updating ${clientsToUpdate.length} clients with refid...`);

    // Second pass: Update all clients in batch
    for (const { docRef, refid } of clientsToUpdate) {
      try {
        await updateDoc(docRef, { refid: refid });
        updatedCount++;
        console.log(`✅ Updated client ${docRef.id} with refid: ${refid}`);
      } catch (error) {
        console.error(`❌ Error updating client ${docRef.id}:`, error);
      }
    }

    console.log(
      `✅ Migration completed: ${updatedCount} clients updated with refid`
    );
    return updatedCount;
  } catch (error) {
    console.error("❌ Error in migration:", error);
    throw error;
  }
};

export const deleteCompany = async (companyId: string): Promise<boolean> => {
  try {
    console.log(`🗑️ Deleting company from Firestore: ${companyId}`);

    // Verify the company exists before deleting
    const companyDocRef = doc(db, "companies", companyId);
    const companyDoc = await getDoc(companyDocRef);

    if (!companyDoc.exists()) {
      throw new Error("Company not found");
    }

    // Delete the company document
    await deleteDoc(companyDocRef);
    console.log(`✅ Successfully deleted company from Firestore`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting company:", error);
    throw error;
  }
};

/**
 * Add refid to existing companies that don't have one
 * Generates unique 8-digit codes for all companies without refid
 * @returns Promise with the number of companies updated
 */
export const addRefidToExistingCompanies = async (): Promise<number> => {
  try {
    console.log("🔄 Starting migration: Adding refid to existing companies...");

    // Fetch all companies
    const companiesSnapshot = await getDocs(collection(db, "companies"));
    console.log(`📦 Found ${companiesSnapshot.size} companies`);

    let updatedCount = 0;
    const companiesToUpdate: Array<{ docRef: any; refid: string }> = [];

    // First pass: Identify companies without refid and generate refids
    for (const companyDoc of companiesSnapshot.docs) {
      const companyData = companyDoc.data();

      // Skip if company already has refid
      if (companyData.refid) {
        console.log(
          `⏭️  Company ${companyDoc.id} already has refid: ${companyData.refid}`
        );
        continue;
      }

      // Generate unique 8-digit refid
      let refid: string = "";
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 20;

      while (!isUnique && attempts < maxAttempts) {
        // Generate 8-digit number (10000000 to 99999999)
        const randomCode = Math.floor(10000000 + Math.random() * 90000000);
        refid = randomCode.toString();

        // Check if refid already exists in Firestore or in our pending updates
        const companiesRef = collection(db, "companies");
        const q = query(companiesRef, where("refid", "==", refid));
        const querySnapshot = await getDocs(q);

        // Also check if this refid is already in our pending updates
        const isInPendingUpdates = companiesToUpdate.some(
          (item) => item.refid === refid
        );

        if (querySnapshot.empty && !isInPendingUpdates) {
          isUnique = true;
        } else {
          attempts++;
        }
      }

      if (!isUnique || !refid) {
        console.error(
          `❌ Failed to generate unique refid for company ${companyDoc.id} after ${maxAttempts} attempts`
        );
        continue;
      }

      companiesToUpdate.push({
        docRef: doc(db, "companies", companyDoc.id),
        refid: refid,
      });

      console.log(`✅ Generated refid ${refid} for company ${companyDoc.id}`);
    }

    console.log(
      `📝 Updating ${companiesToUpdate.length} companies with refid...`
    );

    // Second pass: Update all companies in batch
    for (const { docRef, refid } of companiesToUpdate) {
      try {
        await updateDoc(docRef, { refid: refid });
        updatedCount++;
        console.log(`✅ Updated company ${docRef.id} with refid: ${refid}`);
      } catch (error) {
        console.error(`❌ Error updating company ${docRef.id}:`, error);
      }
    }

    console.log(
      `✅ Migration completed: ${updatedCount} companies updated with refid`
    );
    return updatedCount;
  } catch (error) {
    console.error("❌ Error in migration:", error);
    throw error;
  }
};

/**
 * Fetch a company by its ID
 * @param companyId - The ID of the company to fetch
 * @returns Promise with the company data
 */
export const fetchCompanyById = async (companyId: string) => {
  try {
    console.log("Fetching company by ID:", companyId);

    // Fetch the specific company document from Firestore
    const companyDocRef = doc(db, "companies", companyId);
    const companyDoc = await getDoc(companyDocRef);

    if (!companyDoc.exists()) {
      throw new Error("Company not found");
    }

    const companyData = companyDoc.data();
    const companyEmail = companyData.email || "";

    // Fetch cars and drivers for this company in parallel
    const [carsSnapshot, driversSnapshot] = await Promise.all([
      getDocs(collection(db, "companies-cars")),
      getDocs(collection(db, "companies-drivers")),
    ]);

    // Count cars for this company
    let carsCount = 0;
    carsSnapshot.forEach((carDoc) => {
      const carData = carDoc.data();
      const carEmail =
        carData.email || carData.companyEmail || carData.createdUserId || "";
      if (
        carEmail &&
        companyEmail &&
        carEmail.toLowerCase() === companyEmail.toLowerCase()
      ) {
        carsCount++;
      }
    });

    // Count drivers for this company (filter by createdUserId matching company email)
    let driversCount = 0;
    driversSnapshot.forEach((driverDoc) => {
      const driverData = driverDoc.data();
      const driverCompanyEmail =
        driverData.createdUserId ||
        driverData.email ||
        driverData.companyEmail ||
        "";
      if (
        driverCompanyEmail &&
        companyEmail &&
        driverCompanyEmail.toLowerCase() === companyEmail.toLowerCase()
      ) {
        driversCount++;
      }
    });

    // Extract subscription title (handle object with ar/en keys)
    let subscriptionTitle = "-";
    if (companyData.selectedSubscription?.title) {
      const title = companyData.selectedSubscription.title;
      if (typeof title === "string") {
        subscriptionTitle = title;
      } else if (typeof title === "object" && title.ar) {
        subscriptionTitle = title.ar;
      } else if (typeof title === "object" && title.en) {
        subscriptionTitle = title.en;
      }
    }

    // Extract city (handle object with ar/en keys)
    let cityName = "-";
    const cityData =
      companyData.formattedLocation?.address?.city || companyData.city;
    if (cityData) {
      if (typeof cityData === "string") {
        cityName = cityData;
      } else if (typeof cityData === "object" && cityData.ar) {
        cityName = cityData.ar;
      } else if (typeof cityData === "object" && cityData.en) {
        cityName = cityData.en;
      }
    }

    const company = {
      id: companyDoc.id,
      companyCode: companyData.id || companyDoc.id || "-",
      companyName: companyData.name || companyData.brandName || "-",
      phone: companyData.phoneNumber || companyData.phone || "-",
      email: companyData.email || "-",
      city: cityName,
      cars: carsCount,
      drivers: driversCount,
      subscriptions: subscriptionTitle,
    };

    console.log("Company data fetched:", company);

    return company;
  } catch (error) {
    console.error("Error fetching company by ID:", error);
    throw error;
  }
};

/**
 * Find a company by phone number
 * @param phoneNumber - The phone number to search for (can include spaces, country codes like "+966 56 190 4021")
 * @returns Promise with company data if found, null if not found
 */
export const findCompanyByPhoneNumber = async (
  phoneNumber: string
): Promise<{
  id: string;
  name: string;
  email: string;
  uid: string;
  phoneNumber: string;
} | null> => {
  try {
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      return null;
    }

    const companiesRef = collection(db, "companies");
    let snapshot: any;

    // First, try searching with the exact format as entered (with spaces and +)
    // This matches Firestore format like "+966 56 190 4021"
    const exactFormat = phoneNumber.trim();
    console.log("🔍 Searching for company with exact format:", exactFormat);

    let q = query(companiesRef, where("phoneNumber", "==", exactFormat));
    snapshot = await getDocs(q);

    // If not found, try searching by phone field
    if (snapshot.empty) {
      q = query(companiesRef, where("phone", "==", exactFormat));
      snapshot = await getDocs(q);
    }

    // If user entered partial number like "56 190 402", try adding +966 prefix
    if (snapshot.empty && !exactFormat.startsWith("+")) {
      const withPrefix = `+966 ${exactFormat}`.trim();
      console.log("🔍 Trying with +966 prefix:", withPrefix);
      
      q = query(companiesRef, where("phoneNumber", "==", withPrefix));
      snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        q = query(companiesRef, where("phone", "==", withPrefix));
        snapshot = await getDocs(q);
      }
    }

    // If still not found, try with cleaned format (no spaces)
    if (snapshot.empty) {
      const cleanPhone = phoneNumber.replace(/[\s\+\-\(\)]/g, "");
      console.log("🔍 Trying with cleaned format:", cleanPhone);
      
      q = query(companiesRef, where("phoneNumber", "==", cleanPhone));
      snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        q = query(companiesRef, where("phone", "==", cleanPhone));
        snapshot = await getDocs(q);
      }
    }

    // For Saudi numbers, try without leading 0
    if (snapshot.empty) {
      const cleanPhone = phoneNumber.replace(/[\s\+\-\(\)]/g, "");
      if (cleanPhone.startsWith("966")) {
        const withoutCountryCode = cleanPhone.substring(3);
        if (withoutCountryCode.startsWith("0")) {
          const withoutZero = withoutCountryCode.substring(1);
          console.log("🔍 Trying without leading 0:", withoutZero);
          
          q = query(companiesRef, where("phoneNumber", "==", withoutZero));
          snapshot = await getDocs(q);
          
          if (snapshot.empty) {
            q = query(companiesRef, where("phone", "==", withoutZero));
            snapshot = await getDocs(q);
          }
        }
      }
    }

    if (snapshot.empty) {
      console.log("❌ Company not found with phone:", phoneNumber);
      return null;
    }

    const companyDoc = snapshot.docs[0];
    const companyData = companyDoc.data();

    const company = {
      id: companyDoc.id,
      name: companyData.name || companyData.brandName || "",
      email: companyData.email || "",
      uid: companyData.uId || companyData.uid || companyDoc.id,
      phoneNumber: companyData.phoneNumber || companyData.phone || phoneNumber,
    };

    console.log("✅ Company found:", company.name);
    return company;
  } catch (error) {
    console.error("❌ Error searching for company by phone:", error);
    return null;
  }
};

/**
 * Interface for fuel station data
 */
export interface FuelStation {
  id: string;
  stationName: string;
  cityName: string;
  latitude: number;
  longitude: number;
  formattedLocation?: {
    name?: string;
    lat?: number;
    lng?: number;
    address?: {
      city?: string;
      state?: string;
      country?: string;
      road?: string;
      postcode?: string;
    };
    options?: any[];
  };
  // Additional fields from carstations collection
  name?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  isActive?: boolean;
  type?: string;
  options?: any[];
  balance?: number;
  uId?: string;
  createdDate?: any;
  createdUserId?: string;
}

/**
 * Fetch fuel stations from Firestore (carstations collection)
 * @returns Promise with array of fuel stations
 */
export const fetchFuelStations = async (): Promise<FuelStation[]> => {
  try {
    console.log("📍 Fetching fuel stations from Firestore (carstations)...");

    const carStationsRef = collection(db, "carstations");
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(
      carStationsRef
    );

    const fuelStations: FuelStation[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Extract location data from formattedLocation or direct fields
      const formattedLocation = data.formattedLocation || {};
      const stationName =
        data.name || data.email || formattedLocation.name || "Unknown Station";
      const cityName =
        formattedLocation.address?.city ||
        data.address?.city ||
        data.city ||
        "Unknown City";
      const latitude = formattedLocation.lat || data.latitude || 0;
      const longitude = formattedLocation.lng || data.longitude || 0;

      // console.log(`Station ${doc.id}:`, {
      //   name: stationName,
      //   city: cityName,
      //   lat: latitude,
      //   lng: longitude,
      //   hasFormattedLocation: !!data.formattedLocation,
      //   phoneNumber: data.phoneNumber,
      //   isActive: data.isActive,
      // });

      // Only add stations with valid coordinates
      if (latitude !== 0 && longitude !== 0) {
        fuelStations.push({
          id: doc.id,
          stationName,
          cityName,
          latitude,
          longitude,
          formattedLocation: data.formattedLocation,
          // Include all additional fields from the document
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          address: data.address,
          isActive: data.isActive,
          type: data.type,
          options: data.options,
          balance: data.balance,
          uId: data.uId,
          createdDate: data.createdDate,
          createdUserId: data.createdUserId,
        });
      }
    });

    console.log(
      `✅ Fetched ${fuelStations.length} fuel stations with valid coordinates from carstations collection`
    );

    return fuelStations;
  } catch (error) {
    console.error("❌ Error fetching fuel stations:", error);
    throw error;
  }
};

/**
 * Fetch fuel stations filtered by current user's email
 * Only returns stations where createdUserId matches current user's email
 * @returns Promise with array of user's fuel stations
 */
/**
 * Fetch a single fuel station by ID
 * @param stationId The ID of the station document
 * @returns Promise with station data or null if not found
 */
export const fetchFuelStationById = async (
  stationId: string
): Promise<FuelStation | null> => {
  try {
    console.log("📍 Fetching station by ID:", stationId);

    if (!stationId) {
      console.error("❌ No station ID provided");
      return null;
    }

    // Get current user for filtering
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      console.log("⚠️ No authenticated user found");
      return null;
    }

    const userEmail = currentUser.email;

    // Fetch the station document
    const stationRef = doc(db, "carstations", stationId);
    const stationSnap = await getDoc(stationRef);

    if (!stationSnap.exists()) {
      console.log("⚠️ No station found with ID:", stationId);
      return null;
    }

    const data = stationSnap.data();

    // Verify that the station belongs to the current user
    if (data.createdUserId !== userEmail) {
      console.log("⚠️ Station does not belong to current user");
      return null;
    }

    // Extract location data from formattedLocation or direct fields
    const formattedLocation = data.formattedLocation || {};
    const stationName =
      data.name || data.email || formattedLocation.name || "Unknown Station";
    const cityName =
      formattedLocation.address?.city ||
      data.address?.city ||
      data.city ||
      "Unknown City";
    const latitude = formattedLocation.lat || data.latitude || 0;
    const longitude = formattedLocation.lng || data.longitude || 0;

    console.log("✅ Station data fetched:", {
      id: stationSnap.id,
      name: stationName,
      city: cityName,
      email: data.email,
      phoneNumber: data.phoneNumber,
    });

    return {
      id: stationSnap.id,
      stationName,
      cityName,
      latitude,
      longitude,
      formattedLocation: data.formattedLocation,
      // Include all additional fields from the document
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      address: data.address,
      isActive: data.isActive,
      type: data.type,
      options: data.options,
      balance: data.balance,
      uId: data.uId,
      createdDate: data.createdDate,
      createdUserId: data.createdUserId,
    };
  } catch (error) {
    console.error("❌ Error fetching station by ID:", error);
    return null;
  }
};

export const fetchUserFuelStations = async (): Promise<FuelStation[]> => {
  try {
    console.log("📍 Fetching user's fuel stations from Firestore...");

    // Get current user
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      console.log("⚠️ No authenticated user found");
      return [];
    }

    const userEmail = currentUser.email;
    console.log("👤 Current user email:", userEmail);

    // Query with filter at Firestore level
    const carStationsRef = collection(db, "carstations");
    const q = query(carStationsRef, where("createdUserId", "==", userEmail));

    const querySnapshot = await getDocs(q);
    const fuelStations: FuelStation[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Extract location data from formattedLocation or direct fields
      const formattedLocation = data.formattedLocation || {};
      const stationName =
        data.name || data.email || formattedLocation.name || "Unknown Station";
      const cityName =
        formattedLocation.address?.city ||
        data.address?.city ||
        data.city ||
        "Unknown City";
      const latitude = formattedLocation.lat || data.latitude || 0;
      const longitude = formattedLocation.lng || data.longitude || 0;

      console.log(`Station ${doc.id}:`, {
        name: stationName,
        city: cityName,
        lat: latitude,
        lng: longitude,
        hasFormattedLocation: !!data.formattedLocation,
        phoneNumber: data.phoneNumber,
        isActive: data.isActive,
        createdUserId: data.createdUserId,
      });

      // Only add stations with valid coordinates
      if (latitude !== 0 && longitude !== 0) {
        fuelStations.push({
          id: doc.id,
          stationName,
          cityName,
          latitude,
          longitude,
          formattedLocation: data.formattedLocation,
          // Include all additional fields from the document
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          address: data.address,
          isActive: data.isActive,
          type: data.type,
          options: data.options,
          balance: data.balance,
          uId: data.uId,
          createdDate: data.createdDate,
          createdUserId: data.createdUserId,
        });
      }
    });

    console.log(
      `✅ Fetched ${fuelStations.length} fuel stations for user ${userEmail}`
    );

    return fuelStations;
  } catch (error) {
    console.error("❌ Error fetching user fuel stations:", error);
    throw error;
  }
};

/**
 * Fetch fuel stations filtered by provider email/UID
 * Stations can be linked to provider by:
 * - Station's createdUserId matching provider's email or uId
 * - Station's uId matching provider's uId or email
 * @param providerEmail - The email of the provider
 * @param providerUId - The UID of the provider (optional)
 * @returns Promise with array of provider's fuel stations
 */
export const fetchFuelStationsByProvider = async (
  providerEmail: string,
  providerUId?: string
): Promise<FuelStation[]> => {
  try {
    console.log(
      `📍 Fetching fuel stations for provider: email=${providerEmail}, uId=${providerUId}`
    );

    if (!providerEmail && !providerUId) {
      console.log("⚠️ No provider identifier provided");
      return [];
    }

    // Fetch all carstations documents (same approach as fetchProviderStations)
    // This is necessary because stations can have identifier in createdUserId, uId, or uid fields
    const carStationsRef = collection(db, "carstations");
    const querySnapshot = await getDocs(carStationsRef);
    const fuelStations: FuelStation[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Get station identifiers
      const stationCreatedUserId = data.createdUserId;
      const stationUId = data.uId || data.uid;

      // Match stations: station's createdUserId should match provider's email or uId
      // OR station's uId should match provider's uId or email
      const matchesByCreatedUserId =
        stationCreatedUserId &&
        (stationCreatedUserId === providerEmail ||
          (providerUId && stationCreatedUserId === providerUId));
      
      const matchesByUId =
        stationUId &&
        ((providerUId && stationUId === providerUId) ||
          stationUId === providerEmail);

      // Only include stations that belong to this provider
      if (!matchesByCreatedUserId && !matchesByUId) {
        return; // Skip this station
      }

      // Extract location data from formattedLocation or direct fields
      const formattedLocation = data.formattedLocation || {};
      const stationName =
        data.name || data.email || formattedLocation.name || "Unknown Station";
      const cityName =
        formattedLocation.address?.city ||
        data.address?.city ||
        data.city ||
        "Unknown City";
      const latitude = formattedLocation.lat || data.latitude || 0;
      const longitude = formattedLocation.lng || data.longitude || 0;

      console.log(`Station ${doc.id}:`, {
        name: stationName,
        city: cityName,
        lat: latitude,
        lng: longitude,
        hasFormattedLocation: !!data.formattedLocation,
        phoneNumber: data.phoneNumber,
        isActive: data.isActive,
        createdUserId: data.createdUserId,
        uId: data.uId,
      });

      // Include stations regardless of coordinates (different from fetchUserFuelStations)
      fuelStations.push({
        id: doc.id,
        stationName,
        cityName,
        latitude,
        longitude,
        formattedLocation: data.formattedLocation,
        // Include all additional fields from the document
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address: data.address,
        isActive: data.isActive,
        type: data.type,
        options: data.options,
        balance: data.balance,
        uId: data.uId,
        createdDate: data.createdDate,
        createdUserId: data.createdUserId,
      });
    });

    console.log(
      `✅ Fetched ${fuelStations.length} fuel stations for provider email=${providerEmail}, uId=${providerUId}`
    );

    return fuelStations;
  } catch (error) {
    console.error("❌ Error fetching provider fuel stations:", error);
    throw error;
  }
};

/**
 * Advertisement type as stored in Firestore "ads" collection
 */
export interface Advertisement {
  id: string; // Firestore document id
  refid: string; // 8-digit reference id used as الرقم
  adImageUrl?: string | null; // التصميم
  title?: { ar?: string | null } | string | null;
  description?: { ar?: string | null } | string | null;
  createdUserId?: string | null; // المنشئ (email)
  creatorDisplayName?: string | null; // المنشئ (display_name from users collection)
  type?: string | null; // العرض
  status?: boolean | string | null; // حالة الاعلان
  [key: string]: any;
}

/**
 * Fetch user display_name from users collection by email
 * @param email - User email to search for
 * @returns Promise with display_name or null if not found
 */
export const fetchUserDisplayNameByEmail = async (
  email: string | null | undefined
): Promise<string | null> => {
  if (!email) return null;

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      // Try different possible field names for display name
      return (
        userData.display_name ||
        userData.displayName ||
        userData.name ||
        userData.fullName ||
        null
      );
    }

    return null;
  } catch (error) {
    console.error(
      `❌ Error fetching user display_name for email ${email}:`,
      error
    );
    return null;
  }
};

/**
 * Generate an 8-digit numeric reference id
 */
export const generateRefId = (): string => {
  // Simple 8-digit random number as string (00000000 - 99999999)
  const num = Math.floor(Math.random() * 100000000);
  return num.toString().padStart(8, "0");
};

/**
 * Fetch advertisements from Firestore "ads" collection
 * - Ensures each document has an 8-digit refid (creates and persists one if missing)
 * - Normalizes title/description to use Arabic fields when structured as objects
 */
export const fetchAdvertisements = async (): Promise<Advertisement[]> => {
  try {
    console.log("📢 Fetching advertisements from Firestore (ads)...");

    const adsRef = collection(db, "ads");
    let snapshot: QuerySnapshot<DocumentData>;

    // Try to order by createdDate desc, but fallback to simple query if it fails
    // (e.g., if some documents don't have createdDate field or index is missing)
    try {
      const q = query(adsRef, orderBy("createdDate", "desc"));
      snapshot = await getDocs(q);
    } catch (orderError) {
      console.warn(
        "⚠️ Could not order by 'createdDate', fetching without order:",
        orderError
      );
      // Fallback: fetch without ordering
      snapshot = await getDocs(adsRef);
    }

    const ads: Advertisement[] = [];
    const updatePromises: Promise<void>[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() || {};

      let refid: string | undefined = data.refid;
      if (!refid || typeof refid !== "string" || refid.trim() === "") {
        refid = generateRefId();
        const adDocRef = doc(db, "ads", docSnap.id);
        updatePromises.push(
          updateDoc(adDocRef, {
            refid,
          }).catch((error) => {
            console.error(
              "❌ Error updating refid for ad document:",
              docSnap.id,
              error
            );
          }) as Promise<void>
        );
      }

      // Normalize title / description to be easy to consume on the UI
      const rawTitle = data.title;
      const rawDescription = data.description;

      const normalizedTitle =
        typeof rawTitle === "string"
          ? rawTitle
          : rawTitle && typeof rawTitle === "object"
          ? rawTitle.ar ?? ""
          : "";

      const normalizedDescription =
        typeof rawDescription === "string"
          ? rawDescription
          : rawDescription && typeof rawDescription === "object"
          ? rawDescription.ar ?? ""
          : "";

      ads.push({
        ...data,
        id: docSnap.id,
        refid,
        adImageUrl: data.adImageUrl ?? null,
        title: normalizedTitle, // Override with normalized string
        description: normalizedDescription, // Override with normalized string
        createdUserId: data.createdUserId ?? null,
        type: data.type ?? null,
        status: data.status ?? null,
      });
    });

    if (updatePromises.length > 0) {
      console.log(
        `📝 Updating refid for ${updatePromises.length} advertisement(s) missing refid...`
      );
      await Promise.all(updatePromises);
    }

    // Fetch display_name for each createdUserId from users collection
    console.log("👤 Fetching creator display names from users collection...");
    const uniqueEmails = [
      ...new Set(ads.map((ad) => ad.createdUserId).filter(Boolean)),
    ] as string[];
    const displayNameMap = new Map<string, string | null>();

    // Fetch display names for all unique emails in parallel
    const displayNamePromises = uniqueEmails.map(async (email) => {
      const displayName = await fetchUserDisplayNameByEmail(email);
      displayNameMap.set(email, displayName);
    });

    await Promise.all(displayNamePromises);

    // Add creatorDisplayName to each ad
    ads.forEach((ad) => {
      if (ad.createdUserId) {
        ad.creatorDisplayName = displayNameMap.get(ad.createdUserId) || null;
      }
    });

    console.log(`✅ Fetched ${ads.length} advertisements from Firestore (ads)`);

    return ads;
  } catch (error) {
    console.error("❌ Error fetching advertisements:", error);
    throw error;
  }
};

/**
 * Fetch invoices data from Firestore
 * Filtered by current user's company
 * @returns Promise with array of invoice data
 */
/**
 * Fetch fuel categories from Firestore categories collection
 * Filters by parentId to get fuel subcategories
 * @returns Promise with array of fuel category options
 */
export const fetchFuelCategories = async (): Promise<any[]> => {
  try {
    console.log("🔍 Fetching fuel categories from Firestore...");

    const categoriesRef = collection(db, "categories");
    const q = query(categoriesRef, orderBy("createdDate", "desc"));
    const querySnapshot = await getDocs(q);

    const categories: any[] = [];
    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`✅ Fetched ${categories.length} categories from Firestore`);
    return categories;
  } catch (error) {
    console.error("❌ Error fetching fuel categories:", error);
    throw error;
  }
};

/**
 * Delete a fuel station from Firestore carstations collection
 * @param stationId - The ID of the station document to delete
 * @returns Promise<boolean> - Returns true if deletion was successful, false otherwise
 */
export const deleteStation = async (stationId: string): Promise<boolean> => {
  try {
    console.log("🗑️ Deleting station from Firestore...", stationId);

    // Get current user to verify ownership
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      console.error("⚠️ No authenticated user found");
      throw new Error("يجب تسجيل الدخول لحذف المحطة");
    }

    const userEmail = currentUser.email;
    console.log("👤 Current user email:", userEmail);

    // Get the station document first to verify ownership
    const stationRef = doc(db, "carstations", stationId);
    const stationDoc = await getDoc(stationRef);

    if (!stationDoc.exists()) {
      console.error("❌ Station document not found:", stationId);
      throw new Error("المحطة غير موجودة");
    }

    const stationData = stationDoc.data();
    const createdUserId = stationData.createdUserId;

    // Verify that the current user owns this station
    if (createdUserId !== userEmail) {
      console.error("⚠️ User does not have permission to delete this station");
      throw new Error("ليس لديك صلاحية لحذف هذه المحطة");
    }

    // Delete the station document
    await deleteDoc(stationRef);

    console.log("✅ Station deleted successfully:", stationId);
    return true;
  } catch (error) {
    console.error("❌ Error deleting station:", error);
    throw error;
  }
};

/**
 * Add a new car station to Firestore carstations collection
 * 1. Creates Firebase Auth account for station
 * 2. Parses location data from Google Maps link
 * 3. Fetches selected categories with full details
 * 4. Saves complete station document
 * @param stationData - Station form data
 * @returns Promise with the created station document
 */
export const addCarStation = async (stationData: AddStationData) => {
  try {
    console.log("🏪 Adding new car station via Cloud Function...");
    console.log("Station data:", stationData);

    // 1. Get current user (service distributer) - stays logged in!
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new Error("No authenticated user found");
    }
    const serviceDistributerEmail = currentUser.email;
    console.log("👤 Service distributer email:", serviceDistributerEmail);

    // 2. Parse Google Maps link to get lat/lng
    console.log("📍 Parsing Google Maps location...");
    const coordinates = parseGoogleMapsLink(stationData.location);
    if (!coordinates) {
      throw new Error(
        "Invalid Google Maps link format. Please provide a valid Google Maps URL with coordinates."
      );
    }
    console.log("✅ Coordinates parsed:", coordinates);

    // 3. Fetch full category details for selected categories
    console.log("🔍 Fetching category details...");
    const allCategories = await fetchFuelCategories();
    const selectedCategoryDetails = allCategories.filter((category) =>
      stationData.selectedCategories.includes(category.id)
    );

    if (selectedCategoryDetails.length === 0) {
      throw new Error("No valid categories found for selected category IDs");
    }
    console.log(`✅ Found ${selectedCategoryDetails.length} category details`);

    // 4. Build formattedLocation object
    const formattedLocation = {
      lat: coordinates.lat,
      lng: coordinates.lng,
      name: stationData.address,
      address: {
        city: stationData.address.split(",")[0] || stationData.address,
        country: "Saudi Arabia",
        road: stationData.address,
        postcode: "",
        state: "",
        stateDistrict: "",
        countryCode: "SA",
      },
      placeId: "",
      id: stationData.email,
      addresstype: "",
      category: "",
      display_name: stationData.address,
      extratags: {},
      importance: 0,
      licence: "",
      namedetails: {},
      osm_id: 0,
      osm_type: "",
      place_rank: 30,
    };

    // 5. Build options array from categories
    const options = selectedCategoryDetails.map((category) => {
      const priceData = stationData.categoryPrices[category.id] || {
        price: 0,
        companyPrice: 0,
        desc: "",
      };

      return {
        categoryId: category.id,
        categoryName: {
          ar: category.name?.ar || category.label || "",
          en: category.name?.en || category.label || "",
        },
        categoryParentId: category.parentId || category.id,
        companyPrice: priceData.companyPrice,
        desc: {
          ar: priceData.desc,
          en: priceData.desc,
        },
        price: priceData.price,
        refId: category.refId || "",
        title: {
          ar: category.name?.ar || category.label || "",
          en: category.name?.en || category.label || "",
        },
      };
    });

    // 6. Prepare station document
    const stationDocument = {
      name: stationData.stationName,
      email: stationData.email,
      phoneNumber: stationData.phone,
      address: stationData.address,
      formattedLocation: formattedLocation,
      options: options,
      createdUserId: serviceDistributerEmail,
      createdDate: serverTimestamp(),
      balance: 0,
      isActive: true,
      type: "carStation",
      tokens: [],
      commercialRegistration: "",
      taxCertificate: "",
      location: null,
      status: "approved",
    };

    console.log("📄 Station document prepared:", stationDocument);

    // 6. Call Cloud Function to create Firebase Auth account via HTTP
    console.log("☁️ Creating Firebase Auth account via Cloud Function...");
    const idToken = await currentUser.getIdToken();

    const requestData = {
      email: stationData.email,
      password: stationData.secretNumber,
      display_name: stationData.stationName,
      user_type: "station",
      phone_number: stationData.phone,
      photo_url: "",
    };

    const response = await fetch(
      "https://us-central1-car-station-6393f.cloudfunctions.net/createUserFunction",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(requestData),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${result.message || "Unknown error"}`
      );
    }

    const stationUid = result.data.uid;
    console.log("✅ Firebase Auth account created:", stationUid);

    // 7. Add UID to station document
    const stationDocumentWithUid = {
      ...stationDocument,
      uId: stationUid,
    };

    console.log("📄 Station document prepared:", stationDocumentWithUid);

    // 8. Add to carstations collection using email as document ID
    console.log("💾 Adding station document to carstations collection...");
    const stationDocRef = doc(db, "carstations", stationData.email);
    await setDoc(stationDocRef, stationDocumentWithUid);
    console.log("✅ Station document added to carstations collection");

    return {
      id: stationData.email,
      ...stationDocumentWithUid,
      uId: stationUid,
    };
  } catch (error) {
    console.error("❌ Error creating station:", error);

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes("email-already-in-use")) {
        throw new Error(
          "This email is already registered. Please use a different email address."
        );
      } else if (error.message.includes("weak-password")) {
        throw new Error(
          "Password is too weak. Please choose a stronger password."
        );
      } else if (error.message.includes("invalid-email")) {
        throw new Error(
          "Invalid email format. Please enter a valid email address."
        );
      } else if (error.message.includes("Google Maps")) {
        throw error; // Re-throw location parsing errors as-is
      }
    }

    throw error;
  }
};
/**
 * Add a new company to Firestore companies collection
 * 1. Uploads files to Firebase Storage
 * 2. Creates Firebase Auth account for company
 * 3. Saves complete company document with UID
 * @param companyData - Company form data
 * @returns Promise with the created company document
 */
export const addCompany = async (companyData: AddCompanyData) => {
  try {
    console.log("🏢 Adding new company via Cloud Function...");
    console.log("Company data:", companyData);

    // 1. Get current user (admin) - stays logged in!
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new Error("No authenticated user found");
    }
    const adminEmail = currentUser.email;
    console.log("👤 Admin email:", adminEmail);

    // 2. Upload all files to Firebase Storage in parallel
    console.log("📤 Uploading files to Firebase Storage...");
    const [logoUrl, addressFileUrl, taxCertificateUrl, commercialRegUrl] =
      await Promise.all([
        companyData.logoFile
          ? (async () => {
              const fileName = `companies/logos/${Date.now()}_${
                companyData.logoFile!.name
              }`;
              const storageRef = ref(storage, fileName);
              await uploadBytes(storageRef, companyData.logoFile!);
              return await getDownloadURL(storageRef);
            })()
          : Promise.resolve(""),
        companyData.addressFile
          ? (async () => {
              const fileName = `companies/address-files/${Date.now()}_${
                companyData.addressFile!.name
              }`;
              const storageRef = ref(storage, fileName);
              await uploadBytes(storageRef, companyData.addressFile!);
              return await getDownloadURL(storageRef);
            })()
          : Promise.resolve(""),
        companyData.taxCertificateFile
          ? (async () => {
              const fileName = `companies/tax-certificates/${Date.now()}_${
                companyData.taxCertificateFile!.name
              }`;
              const storageRef = ref(storage, fileName);
              await uploadBytes(storageRef, companyData.taxCertificateFile!);
              return await getDownloadURL(storageRef);
            })()
          : Promise.resolve(""),
        companyData.commercialRegistrationFile
          ? (async () => {
              const fileName = `companies/commercial-registrations/${Date.now()}_${
                companyData.commercialRegistrationFile!.name
              }`;
              const storageRef = ref(storage, fileName);
              await uploadBytes(
                storageRef,
                companyData.commercialRegistrationFile!
              );
              return await getDownloadURL(storageRef);
            })()
          : Promise.resolve(""),
      ]);

    console.log("✅ Files uploaded successfully");

    // 3. Call Cloud Function to create Firebase Auth account via HTTP
    console.log("☁️ Creating Firebase Auth account via Cloud Function...");
    const idToken = await currentUser.getIdToken();

    const requestData = {
      email: companyData.email,
      password: companyData.password,
      display_name: companyData.name,
      user_type: "company",
      phone_number: companyData.phoneNumber,
      photo_url: logoUrl || "",
    };

    const response = await fetch(
      "https://us-central1-car-station-6393f.cloudfunctions.net/createUserFunction",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(requestData),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${result.message || "Unknown error"}`
      );
    }

    const companyUid = result.data.uid;
    console.log("✅ Firebase Auth account created:", companyUid);

    // 4. Generate unique 8-digit refid
    let refid: string = "";
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate 8-digit number (10000000 to 99999999)
      const randomCode = Math.floor(10000000 + Math.random() * 90000000);
      refid = randomCode.toString();

      // Check if refid already exists
      const companiesRef = collection(db, "companies");
      const q = query(companiesRef, where("refid", "==", refid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique || !refid) {
      throw new Error("فشل في إنشاء كود الشركة. يرجى المحاولة مرة أخرى.");
    }

    console.log("✅ Generated unique refid:", refid);

    // 5. Build formattedLocation object
    const formattedLocation = {
      address: {
        city: companyData.city,
        country: "Saudi Arabia",
        countryCode: "SA",
        highway: "",
        postcode: "",
        road: "",
        state: "",
        stateDistrict: "",
      },
      lat: null,
      lng: null,
      name: companyData.address || "",
      placeId: "",
    };

    // 6. Prepare company document
    const companyDocument = {
      // Basic info
      name: companyData.name.trim(),
      email: companyData.email.trim(),
      phoneNumber: companyData.phoneNumber.trim(),
      password: companyData.password.trim(),
      brandName: companyData.brandName.trim(),
      commercialRegistrationNumber:
        companyData.commercialRegistrationNumber?.trim() || "",
      vatNumber: companyData.vatNumber?.trim() || "",
      city: companyData.city,
      address: companyData.address?.trim() || "",

      // File URLs
      logo: logoUrl,
      addressFile: addressFileUrl,
      taxCertificate: taxCertificateUrl,
      commercialRegistration: commercialRegUrl,

      // formattedLocation map
      formattedLocation: formattedLocation,

      // Auth UID
      uId: companyUid,

      // Default values
      isActive: true,
      status: "approved",
      balance: 0,

      // Company code (8-digit refid)
      refid: refid,

      // Timestamps and user info
      createdDate: serverTimestamp(),
      createdUserId: adminEmail,

      // Account status for display
      accountStatus: {
        active: true,
        text: "مفعل",
      },
    };

    console.log("📄 Company document prepared:", companyDocument);

    // 7. Add document to Firestore companies collection
    console.log("💾 Adding company document to companies collection...");
    const companyDocRef = doc(db, "companies", companyData.email);
    await setDoc(companyDocRef, companyDocument);
    console.log("✅ Company document added to companies collection");

    return {
      id: companyData.email,
      ...companyDocument,
      uId: companyUid,
    };
  } catch (error) {
    console.error("❌ Error creating company:", error);

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes("email-already-in-use")) {
        throw new Error(
          "This email is already registered. Please use a different email address."
        );
      } else if (error.message.includes("weak-password")) {
        throw new Error(
          "Password is too weak. Please choose a stronger password."
        );
      } else if (error.message.includes("invalid-email")) {
        throw new Error(
          "Invalid email format. Please enter a valid email address."
        );
      } else if (
        error.message.includes("HTTP 400") ||
        error.message.includes("HTTP 500")
      ) {
        // Cloud Function errors
        if (
          error.message.includes("already exists") ||
          error.message.includes("email")
        ) {
          throw new Error(
            "This email is already registered. Please use a different email address."
          );
        }
        throw new Error(
          "Failed to create company account. Please try again or contact support."
        );
      }
    }

    throw error;
  }
};

/**
 * Add a new service provider (stations company) to Firestore
 * @param providerData - Service provider form data
 * @returns Promise with the created service provider document
 */
export const addServiceProvider = async (
  providerData: AddServiceProviderData
) => {
  try {
    console.log("🏢 Adding new service provider via Cloud Function...");
    console.log("Service provider data:", providerData);

    // 1. Get current user (admin) - stays logged in!
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new Error("No authenticated user found");
    }
    const adminEmail = currentUser.email;
    console.log("👤 Admin email:", adminEmail);

    // 2. Upload all files to Firebase Storage in parallel
    console.log("📤 Uploading files to Firebase Storage...");
    const [logoUrl, addressFileUrl, taxCertificateUrl, commercialRegUrl] =
      await Promise.all([
        providerData.logoFile
          ? (async () => {
              const fileName = `stationsCompanies/logos/${Date.now()}_${
                providerData.logoFile!.name
              }`;
              const storageRef = ref(storage, fileName);
              await uploadBytes(storageRef, providerData.logoFile!);
              return await getDownloadURL(storageRef);
            })()
          : Promise.resolve(""),
        providerData.addressFile
          ? (async () => {
              const fileName = `stationsCompanies/address-files/${Date.now()}_${
                providerData.addressFile!.name
              }`;
              const storageRef = ref(storage, fileName);
              await uploadBytes(storageRef, providerData.addressFile!);
              return await getDownloadURL(storageRef);
            })()
          : Promise.resolve(""),
        providerData.taxCertificateFile
          ? (async () => {
              const fileName = `stationsCompanies/tax-certificates/${Date.now()}_${
                providerData.taxCertificateFile!.name
              }`;
              const storageRef = ref(storage, fileName);
              await uploadBytes(storageRef, providerData.taxCertificateFile!);
              return await getDownloadURL(storageRef);
            })()
          : Promise.resolve(""),
        providerData.commercialRegistrationFile
          ? (async () => {
              const fileName = `stationsCompanies/commercial-registrations/${Date.now()}_${
                providerData.commercialRegistrationFile!.name
              }`;
              const storageRef = ref(storage, fileName);
              await uploadBytes(
                storageRef,
                providerData.commercialRegistrationFile!
              );
              return await getDownloadURL(storageRef);
            })()
          : Promise.resolve(""),
      ]);

    console.log("✅ Files uploaded successfully");

    // 3. Call Cloud Function to create Firebase Auth account via HTTP
    console.log("☁️ Creating Firebase Auth account via Cloud Function...");
    const idToken = await currentUser.getIdToken();

    const requestData = {
      email: providerData.email,
      password: providerData.password,
      display_name: providerData.name,
      user_type: "service-provider",
      phone_number: providerData.phoneNumber,
      photo_url: logoUrl || "",
    };

    const response = await fetch(
      "https://us-central1-car-station-6393f.cloudfunctions.net/createUserFunction",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(requestData),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${result.message || "Unknown error"}`
      );
    }

    const providerUid = result.data.uid;
    console.log("✅ Firebase Auth account created:", providerUid);

    // 4. Generate unique 8-digit refid for service provider
    console.log("🔢 Generating unique 8-digit refid for service provider...");
    let refid: string = "";
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const randomCode = Math.floor(10000000 + Math.random() * 90000000);
      refid = randomCode.toString();
      const stationsCompanyRefCheck = collection(db, "stationscompany");
      const qCheck = query(
        stationsCompanyRefCheck,
        where("refid", "==", refid)
      );
      const querySnapshot = await getDocs(qCheck);

      if (querySnapshot.empty) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique || !refid) {
      throw new Error("فشل في إنشاء كود العميل. يرجى المحاولة مرة أخرى.");
    }

    console.log(`✅ Generated unique refid: ${refid}`);

    // 5. Build formattedLocation object with nested Address structure
    const formattedLocation = {
      address: {
        city: providerData.city,
        country: providerData.country,
        countryCode: providerData.countryCode,
        highway: providerData.highway,
        postcode: providerData.postcode,
        road: providerData.road,
        state: providerData.state,
        stateDistrict: providerData.stateDistrict,
      },
    };

    // 6. Prepare service provider document
    const providerDocument = {
      // Basic info
      name: providerData.name.trim(),
      email: providerData.email.trim(),
      phoneNumber: providerData.phoneNumber.trim(),
      password: providerData.password.trim(),
      brandName: providerData.brandName.trim(),
      commercialRegistrationNumber:
        providerData.commercialRegistrationNumber.trim(),
      vatNumber: providerData.vatNumber.trim(),
      address: providerData.address.trim(),
      location: providerData.location.trim(),

      // File URLs
      logo: logoUrl,
      addressFile: addressFileUrl,
      taxCertificate: taxCertificateUrl,
      commercialRegistration: commercialRegUrl,

      // formattedLocation with nested address
      formattedLocation: formattedLocation,

      // Auth UID
      uId: providerUid,

      // 8-digit refid
      refid: refid,

      // Default values
      isActive: false,
      status: "pending",
      balance: 0,

      // Timestamps and user info
      createdDate: serverTimestamp(),
      createdUserId: adminEmail,

      // Account status for display
      accountStatus: {
        active: false,
        text: "معلق",
      },
    };

    console.log("📄 Service provider document prepared:", providerDocument);

    // 7. Add document to Firestore stationscompany collection
    console.log(
      "💾 Adding service provider document to stationscompany collection..."
    );
    const stationsCompanyRef = collection(db, "stationscompany");
    const providerDocRef = await addDoc(stationsCompanyRef, providerDocument);
    console.log(
      "✅ Service provider document added to stationscompany collection with ID:",
      providerDocRef.id
    );

    return {
      id: providerDocRef.id,
      ...providerDocument,
      uId: providerUid,
    };
  } catch (error) {
    console.error("❌ Error creating service provider:", error);

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes("email-already-in-use")) {
        throw new Error(
          "This email is already registered. Please use a different email address."
        );
      } else if (error.message.includes("weak-password")) {
        throw new Error(
          "Password is too weak. Please choose a stronger password."
        );
      } else if (error.message.includes("invalid-email")) {
        throw new Error(
          "Invalid email format. Please enter a valid email address."
        );
      } else if (
        error.message.includes("HTTP 400") ||
        error.message.includes("HTTP 500")
      ) {
        // Cloud Function errors
        if (
          error.message.includes("already exists") ||
          error.message.includes("email")
        ) {
          throw new Error(
            "This email is already registered. Please use a different email address."
          );
        }
        throw new Error(
          "Failed to create service provider account. Please try again or contact support."
        );
      }
    }

    throw error;
  }
};

export const fetchInvoices = async (): Promise<any[]> => {
  try {
    console.log("📄 Fetching invoices from Firestore...");

    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log("❌ No user is currently logged in.");
      return [];
    }

    // Fetch invoices collection
    const invoicesRef = collection(db, "invoices");
    const q = query(invoicesRef, orderBy("createdDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    const allInvoices: any[] = [];

    querySnapshot.forEach((doc) => {
      allInvoices.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log("📋 Total invoices found:", allInvoices.length);

    // Filter invoices by current user's company
    const userEmail = currentUser.email;
    const userId = currentUser.uid;

    const filteredInvoices = allInvoices.filter((invoice) => {
      const companyUid = invoice.companyUid || invoice.createdUserId;

      // Check if companyUid matches UID or email
      const uidMatch = companyUid && userId && companyUid === userId;
      const emailMatch =
        companyUid &&
        userEmail &&
        companyUid.toLowerCase() === userEmail.toLowerCase();

      return uidMatch || emailMatch;
    });

    console.log(
      "✅ Filtered invoices for current company:",
      filteredInvoices.length
    );

    // Transform invoices to standard format
    const transformedInvoices = filteredInvoices.map((invoice) => {
      // Format date
      const formatDate = (date: any): string => {
        if (!date) return "غير محدد";
        try {
          const dateObj = date.toDate ? date.toDate() : new Date(date);
          const day = String(dateObj.getDate()).padStart(2, "0");
          const year = dateObj.getFullYear();
          const hoursNum = dateObj.getHours();
          const minutes = String(dateObj.getMinutes()).padStart(2, "0");
          const ampm = hoursNum >= 12 ? "م" : "ص";
          const displayHours = hoursNum % 12 || 12;

          const monthNames = [
            "يناير",
            "فبراير",
            "مارس",
            "أبريل",
            "مايو",
            "يونيو",
            "يوليو",
            "أغسطس",
            "سبتمبر",
            "أكتوبر",
            "نوفمبر",
            "ديسمبر",
          ];

          return `${day} ${
            monthNames[dateObj.getMonth()]
          } ${year} - ${displayHours}:${minutes} ${ampm}`;
        } catch (error) {
          return "غير محدد";
        }
      };

      return {
        id: invoice.id,
        invoiceCode:
          invoice.invoiceCode ||
          invoice.code ||
          `INV-${invoice.id.substring(0, 6).toUpperCase()}`,
        clientName: invoice.clientName || invoice.companyName || "غير محدد",
        clientType: invoice.clientType || "شركات",
        date: formatDate(invoice.createdDate || invoice.invoiceDate),
        invoiceNumber: invoice.invoiceNumber || invoice.number || invoice.id,
        amount: invoice.amount || invoice.totalAmount || 0,
        rawDate: invoice.createdDate || invoice.invoiceDate,
      };
    });

    console.log("✅ Invoices transformed:", transformedInvoices.length);

    return transformedInvoices;
  } catch (error) {
    console.error("❌ Error fetching invoices:", error);
    throw error;
  }
};
/**
 * Fetch comprehensive statistics for a specific company
 * @param companyId - The ID of the company to get statistics for
 * @returns Promise with company-specific statistics
 */
export const fetchCompanyStatistics = async (companyId: string) => {
  try {
    console.log("\n📊 Fetching company statistics for:", companyId);

    // First, get the company data to extract the email
    const companyDocRef = doc(db, "companies", companyId);
    const companyDoc = await getDoc(companyDocRef);

    if (!companyDoc.exists()) {
      throw new Error("Company not found");
    }

    const companyData = companyDoc.data();
    const companyEmail = companyData.email || "";
    const companyUid = companyData.uId || companyId; // Use uId or fallback to companyId

    if (!companyEmail && !companyUid) {
      throw new Error("Company email and UID not found");
    }

    console.log("Company email:", companyEmail);
    console.log("Company UID:", companyUid);

    // Fetch all orders
    const orders = await fetchAllOrders();

    // Filter orders for this specific company by UID or email
    const companyOrders = orders.filter((order) => {
      const orderCompanyUid = order.companyUid;
      const orderEmail =
        order.userEmail ||
        order.email ||
        order.companyEmail ||
        order.createdUserId ||
        "";

      // Check if companyUid matches (primary method)
      const uidMatch =
        orderCompanyUid && companyUid && orderCompanyUid === companyUid;

      // Check if email matches (fallback method)
      const emailMatch =
        orderEmail &&
        companyEmail &&
        orderEmail.toLowerCase() === companyEmail.toLowerCase();

      return uidMatch || emailMatch;
    });

    console.log(`📦 Total orders for company: ${companyOrders.length}`);

    // Get wallet balance from companies collection
    const walletBalance = companyData.balance || companyData.walletBalance || 0;
    console.log(
      `💰 Wallet balance from companies collection: ${walletBalance}`
    );

    // Calculate total purchase cost by summing totalPrice from filtered orders
    const totalPurchaseCost = companyOrders.reduce((total, order) => {
      const price = parseFloat(order.totalPrice || order.price || 0);
      return total + price;
    }, 0);
    console.log(`💳 Total purchase cost calculated: ${totalPurchaseCost}`);

    // Calculate fuel statistics for this company
    const fuelStats = calculateFuelStatistics
      ? calculateFuelStatistics(companyOrders)
      : null;
    console.log("Fuel stats:", fuelStats);

    // Calculate car wash statistics for this company
    const carWashStats = calculateCarWashStatistics
      ? calculateCarWashStatistics(companyOrders)
      : null;
    console.log("Car wash stats:", carWashStats);

    // Calculate tire change operations
    const tireChangeStats = calculateTireChangeStatistics
      ? calculateTireChangeStatistics(companyOrders)
      : null;
    console.log("Tire change stats:", tireChangeStats);

    // Calculate oil change operations
    const oilChangeStats = calculateOilChangeStatistics
      ? calculateOilChangeStatistics(companyOrders)
      : null;
    console.log("Oil change stats:", oilChangeStats);

    // Get company-specific car and driver counts
    const [carsSnapshot, driversSnapshot] = await Promise.all([
      getDocs(collection(db, "companies-cars")),
      getDocs(collection(db, "companies-drivers")),
    ]);

    let carsCount = 0;
    carsSnapshot.forEach((carDoc) => {
      const carData = carDoc.data();
      const carEmail =
        carData.email || carData.companyEmail || carData.createdUserId || "";
      const carUid = carData.uId || carData.companyUid || "";

      // Check by UID first, then by email
      const uidMatch = carUid && companyUid && carUid === companyUid;
      const emailMatch =
        carEmail &&
        companyEmail &&
        carEmail.toLowerCase() === companyEmail.toLowerCase();

      if (uidMatch || emailMatch) {
        carsCount++;
      }
    });

    let driversCount = 0;
    let activeDrivers = 0;
    let inactiveDrivers = 0;
    driversSnapshot.forEach((driverDoc) => {
      const driverData = driverDoc.data();
      const driverEmail =
        driverData.createdUserId ||
        driverData.email ||
        driverData.companyEmail ||
        "";
      const driverUid = driverData.uId || driverData.companyUid || "";

      // Check by UID first, then by email
      const uidMatch = driverUid && companyUid && driverUid === companyUid;
      const emailMatch =
        driverEmail &&
        companyEmail &&
        driverEmail.toLowerCase() === companyEmail.toLowerCase();

      if (uidMatch || emailMatch) {
        driversCount++;
        if (driverData.status === "active" || driverData.isActive === true) {
          activeDrivers++;
        } else {
          inactiveDrivers++;
        }
      }
    });

    console.log(`🚗 Total cars found: ${carsCount}`);
    console.log(
      `👥 Total drivers found: ${driversCount} (Active: ${activeDrivers}, Inactive: ${inactiveDrivers})`
    );

    // Calculate completed/canceled orders
    const completedOrders = companyOrders.filter(
      (order) =>
        order.status === "completed" ||
        order.orderStatus === "completed" ||
        order.status === "مكتمل"
    ).length;

    const canceledOrders = companyOrders.filter(
      (order) =>
        order.status === "canceled" ||
        order.orderStatus === "canceled" ||
        order.status === "ملغي"
    ).length;

    const statistics = {
      // Wallet balance
      walletBalance: walletBalance || 0,

      // Total purchase cost
      totalPurchaseCost: totalPurchaseCost,

      // Fuel usage statistics
      fuelUsage: {
        diesel:
          fuelStats?.fuelTypes?.find((f) => f.type === "ديزل")?.totalLitres ||
          0,
        gasoline95:
          fuelStats?.fuelTypes?.find((f) => f.type === "بنزين 95")
            ?.totalLitres || 0,
        gasoline91:
          fuelStats?.fuelTypes?.find((f) => f.type === "بنزين 91")
            ?.totalLitres || 0,
        total: fuelStats?.totalLitres || 0,
      },

      // Driver statistics
      drivers: {
        active: activeDrivers,
        inactive: inactiveDrivers,
        total: driversCount,
      },

      // Car statistics - count actual cars by size
      cars: await calculateCompanyCarsBySize(companyEmail, companyUid),

      // Order statistics
      orders: {
        completed: completedOrders,
        canceled: canceledOrders,
        total: companyOrders.length,
      },

      // Car wash statistics
      carWash: {
        small: carWashStats?.sizes?.find((s) => s.name === "صغيرة")?.count || 0,
        medium:
          carWashStats?.sizes?.find((s) => s.name === "متوسطة")?.count || 0,
        large: carWashStats?.sizes?.find((s) => s.name === "كبيرة")?.count || 0,
        vip: carWashStats?.sizes?.find((s) => s.name === "VIP")?.count || 0,
        total: carWashStats?.totalOrders || 0,
      },

      // Tire change statistics
      tireChange: {
        small:
          (tireChangeStats as any)?.sizes?.find((s: any) => s.name === "صغيرة")
            ?.count || 0,
        medium:
          (tireChangeStats as any)?.sizes?.find((s: any) => s.name === "متوسطة")
            ?.count || 0,
        large:
          (tireChangeStats as any)?.sizes?.find((s: any) => s.name === "كبيرة")
            ?.count || 0,
        vip:
          (tireChangeStats as any)?.sizes?.find((s: any) => s.name === "VIP")
            ?.count || 0,
        total: (tireChangeStats as any)?.totalOrders || 0,
      },

      // Oil change statistics
      oilChange: {
        small: 0,
        medium: 0,
        large: 0,
        vip: 0,
        total: oilChangeStats?.totalLitres || 0,
      },
    };

    console.log("✅ Company statistics calculated:", statistics);
    return statistics;
  } catch (error) {
    console.error("❌ Error fetching company statistics:", error);
    throw error;
  }
};

/**
 * Calculate car statistics by size for a specific company
 */
const calculateCompanyCarsBySize = async (
  companyEmail: string,
  companyUid?: string
) => {
  try {
    console.log("🚗 Calculating car statistics for company:", companyEmail);

    const carsRef = collection(db, "companies-cars");
    const carsSnapshot = await getDocs(carsRef);

    let smallCount = 0;
    let mediumCount = 0;
    let largeCount = 0;
    let vipCount = 0;

    carsSnapshot.forEach((doc) => {
      const carData = doc.data();
      const carEmail = carData.email || carData.companyEmail || "";
      const carUid = carData.uId || carData.companyUid || "";

      // Check by UID first, then by email
      const uidMatch = carUid && companyUid && carUid === companyUid;
      const emailMatch =
        carEmail &&
        companyEmail &&
        carEmail.toLowerCase() === companyEmail.toLowerCase();

      if (uidMatch || emailMatch) {
        const carSize = carData.size || carData.carSize || "";

        switch (carSize.toLowerCase()) {
          case "صغيرة":
          case "small":
            smallCount++;
            break;
          case "متوسطة":
          case "medium":
            mediumCount++;
            break;
          case "كبيرة":
          case "large":
            largeCount++;
            break;
          case "vip":
            vipCount++;
            break;
          default:
            // Default to medium if size is not specified
            mediumCount++;
            break;
        }
      }
    });

    const totalCars = smallCount + mediumCount + largeCount + vipCount;

    console.log(
      `🚗 Car counts - Small: ${smallCount}, Medium: ${mediumCount}, Large: ${largeCount}, VIP: ${vipCount}, Total: ${totalCars}`
    );

    return {
      small: smallCount,
      medium: mediumCount,
      large: largeCount,
      vip: vipCount,
      total: totalCars,
    };
  } catch (error) {
    console.error("Error calculating car statistics:", error);
    return {
      small: 0,
      medium: 0,
      large: 0,
      vip: 0,
      total: 0,
    };
  }
};

/**
 * Calculate wallet balance for a specific company
 */
const calculateCompanyWalletBalance = async (
  companyEmail: string
): Promise<number> => {
  try {
    const walletsRef = collection(db, "wallets");
    const q = query(walletsRef, where("userEmail", "==", companyEmail));
    const querySnapshot = await getDocs(q);

    let totalBalance = 0;
    querySnapshot.forEach((doc) => {
      const walletData = doc.data();
      totalBalance += walletData.balance || 0;
    });

    return totalBalance;
  } catch (error) {
    console.error("Error calculating company wallet balance:", error);
    return 0;
  }
};

/**
 * Service Provider (Stations Company) data interface
 */
export interface ServiceProviderData {
  id: string;
  clientCode: string;
  providerName: string;
  type: string;
  phoneNumber: string;
  email: string;
  status: string;
  isActive?: boolean | null;
  stationsCount: number;
  ordersCount: number;
  uId?: string;
}

/**
 * Fetch all stations company data with related counts
 * @returns Promise with array of service provider data
 */
export const fetchStationsCompanyData = async (): Promise<
  ServiceProviderData[]
> => {
  try {
    console.log("🏢 Fetching stations company data with related counts...");

    // Fetch all collections in parallel for better performance
    const [stationsCompanySnapshot, carStationsSnapshot, ordersSnapshot] =
      await Promise.all([
        getDocs(collection(db, "stationscompany")),
        getDocs(collection(db, "carstations")),
        getDocs(collection(db, "stationscompany-orders")),
      ]);

    console.log(
      `📊 Fetched ${stationsCompanySnapshot.size} stations company documents`
    );
    console.log(
      `🏪 Fetched ${carStationsSnapshot.size} car stations documents`
    );
    console.log(`📋 Fetched ${ordersSnapshot.size} orders documents`);

    // Process stations company data
    const serviceProvidersData: ServiceProviderData[] = [];

    stationsCompanySnapshot.forEach((doc) => {
      const data = doc.data();

      // Get company UID for counting related data
      const companyUid = data.uId || data.uid || doc.id;

      // Count related car stations by matching company email with createdUserId
      let stationsCount = 0;
      const companyEmail = data.email;
      console.log(
        `🔍 Checking car stations for company: ${data.name} (${companyEmail})`
      );
      carStationsSnapshot.forEach((stationDoc) => {
        const stationData = stationDoc.data();
        const stationCreatedUserId =
          stationData.createdUserId || stationData.uId || stationData.uid;
        if (stationCreatedUserId === companyEmail) {
          stationsCount++;
          console.log(
            `✅ Found matching car station: ${
              stationData.name || stationDoc.id
            }`
          );
        }
      });
      console.log(`📊 Total car stations for ${data.name}: ${stationsCount}`);

      // Count related orders by matching company email with order.carStation.createdUserId
      let ordersCount = 0;
      console.log(
        `🔍 Checking orders for company: ${data.name} (${companyEmail})`
      );
      ordersSnapshot.forEach((orderDoc) => {
        const orderData = orderDoc.data();
        const carStationCreatedUserId = orderData.carStation?.createdUserId;
        if (carStationCreatedUserId === companyEmail) {
          ordersCount++;
          console.log(`✅ Found matching order: ${orderDoc.id}`);
        }
      });
      console.log(`📊 Total orders for ${data.name}: ${ordersCount}`);

      // Create service provider data object
      const serviceProvider: ServiceProviderData = {
        id: doc.id, // Always use Firestore document ID for consistency
        clientCode: data.refid || data.id || data.uId || doc.id, // Use refid as primary source
        providerName: data.name || "غير محدد",
        type: data.type || "غير محدد",
        phoneNumber: data.phoneNumber || data.phone || "-",
        email: data.email || "-",
        status: data.status || "نشط",
        isActive:
          data.isActive !== undefined
            ? data.isActive
            : data.status === "نشط" || data.status === "active"
            ? true
            : false,
        stationsCount,
        ordersCount,
        uId: companyUid,
      };

      serviceProvidersData.push(serviceProvider);
    });

    console.log(
      `✅ Processed ${serviceProvidersData.length} service providers with counts`
    );

    // Sort by creation date descending (newest first)
    serviceProvidersData.sort((a, b) => {
      // Try to get created date from metadata or fallback to 0
      const dateA = (a as any).createdAt?.toDate?.() || new Date(0);
      const dateB = (b as any).createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    return serviceProvidersData;
  } catch (error) {
    console.error("❌ Error fetching stations company data:", error);
    throw error;
  }
};

/**
 * Add 8-digit refid to existing service providers that don't have one
 * @returns Promise with the number of updated service providers
 */
export const addRefidToExistingServiceProviders = async (): Promise<number> => {
  try {
    console.log(
      "🔄 Starting migration: Adding refid to existing service providers..."
    );
    const stationsCompanyRef = collection(db, "stationscompany");
    // Fetch all documents without orderBy to avoid errors if some don't have createdDate
    const stationsCompanySnapshot = await getDocs(stationsCompanyRef);
    console.log(`📦 Found ${stationsCompanySnapshot.size} service providers`);

    let updatedCount = 0;
    const serviceProvidersToUpdate: Array<{ docRef: any; refid: string }> = [];

    for (const providerDoc of stationsCompanySnapshot.docs) {
      const providerData = providerDoc.data();
      if (providerData.refid) {
        console.log(
          `⏭️  Service provider ${providerDoc.id} already has refid: ${providerData.refid}`
        );
        continue;
      }

      let refid: string = "";
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 20;

      while (!isUnique && attempts < maxAttempts) {
        const randomCode = Math.floor(10000000 + Math.random() * 90000000);
        refid = randomCode.toString();
        const stationsCompanyRefCheck = collection(db, "stationscompany");
        const qCheck = query(
          stationsCompanyRefCheck,
          where("refid", "==", refid)
        );
        const querySnapshot = await getDocs(qCheck);
        const isInPendingUpdates = serviceProvidersToUpdate.some(
          (item) => item.refid === refid
        );

        if (querySnapshot.empty && !isInPendingUpdates) {
          isUnique = true;
        } else {
          attempts++;
        }
      }

      if (!isUnique || !refid) {
        console.error(
          `❌ Failed to generate unique refid for service provider ${providerDoc.id} after ${maxAttempts} attempts`
        );
        continue;
      }

      serviceProvidersToUpdate.push({
        docRef: doc(db, "stationscompany", providerDoc.id),
        refid: refid,
      });
      console.log(
        `✅ Generated refid ${refid} for service provider ${providerDoc.id}`
      );
    }

    console.log(
      `📝 Updating ${serviceProvidersToUpdate.length} service providers with refid...`
    );
    for (const { docRef, refid } of serviceProvidersToUpdate) {
      try {
        await updateDoc(docRef, { refid: refid });
        updatedCount++;
        console.log(
          `✅ Updated service provider ${docRef.id} with refid: ${refid}`
        );
      } catch (error) {
        console.error(
          `❌ Error updating service provider ${docRef.id}:`,
          error
        );
      }
    }
    console.log(
      `✅ Migration completed: ${updatedCount} service providers updated with refid`
    );
    return updatedCount;
  } catch (error) {
    console.error("❌ Error in migration:", error);
    throw error;
  }
};

/**
 * Fetch a service provider document by ID (for getting raw data like isActive)
 * @param serviceProviderId - The service provider document ID
 * @returns Promise with service provider document data
 */
export const fetchServiceProviderById = async (serviceProviderId: string) => {
  try {
    console.log("Fetching service provider by ID:", serviceProviderId);

    // Fetch the specific service provider document from Firestore
    const serviceProviderDocRef = doc(db, "stationscompany", serviceProviderId);
    const serviceProviderDoc = await getDoc(serviceProviderDocRef);

    if (!serviceProviderDoc.exists()) {
      throw new Error("Service provider not found");
    }

    const serviceProviderData = serviceProviderDoc.data();

    const serviceProvider = {
      id: serviceProviderDoc.id,
      ...serviceProviderData,
    };

    console.log("Service provider data fetched:", serviceProvider);

    return serviceProvider;
  } catch (error) {
    console.error("Error fetching service provider by ID:", error);
    throw error;
  }
};

/**
 * Update service provider isActive status in Firestore
 * @param serviceProviderId - The service provider document ID
 * @param isActive - The new isActive status
 * @returns Promise<boolean> - Returns true if update was successful
 */
export const updateServiceProviderIsActive = async (
  serviceProviderId: string,
  isActive: boolean
): Promise<boolean> => {
  try {
    console.log(
      `📝 Updating service provider isActive status: ${serviceProviderId} -> ${isActive}`
    );

    const serviceProviderDocRef = doc(db, "stationscompany", serviceProviderId);
    await updateDoc(serviceProviderDocRef, {
      isActive: isActive,
    });

    console.log(`✅ Successfully updated service provider isActive status`);
    return true;
  } catch (error) {
    console.error("❌ Error updating service provider isActive status:", error);
    throw error;
  }
};

/**
 * Fetch a single stations company by ID
 * @param id - The company ID
 * @returns Promise with service provider data or null
 */
export const fetchStationsCompanyById = async (
  id: string
): Promise<ServiceProviderData | null> => {
  try {
    console.log(`🔍 Fetching stations company with ID: ${id}`);

    // Try to find by document ID first
    const docRef = doc(db, "stationscompany", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const companyUid = data.uId || data.uid || docSnap.id;

      // Count related data
      const [carStationsSnapshot, ordersSnapshot] = await Promise.all([
        getDocs(collection(db, "carstations")),
        getDocs(collection(db, "stationscompany-orders")),
      ]);

      let stationsCount = 0;
      carStationsSnapshot.forEach((stationDoc) => {
        const stationData = stationDoc.data();
        const stationCreatedUserId =
          stationData.createdUserId || stationData.uId || stationData.uid;
        if (stationCreatedUserId === companyUid) {
          stationsCount++;
        }
      });

      let ordersCount = 0;
      ordersSnapshot.forEach((orderDoc) => {
        const orderData = orderDoc.data();
        const orderCreatedUserId =
          orderData.createdUserId || orderData.uId || orderData.uid;
        if (orderCreatedUserId === companyUid) {
          ordersCount++;
        }
      });

      return {
        id: data.id || docSnap.id,
        clientCode: data.refid || data.id || data.uId || docSnap.id, // Use refid as primary source
        providerName: data.name || "غير محدد",
        type: data.type || "غير محدد",
        phoneNumber: data.phoneNumber || data.phone || "-",
        email: data.email || "-",
        status: data.status || "نشط",
        isActive:
          data.isActive !== undefined
            ? data.isActive
            : data.status === "نشط" || data.status === "active"
            ? true
            : false,
        stationsCount,
        ordersCount,
        uId: companyUid,
      };
    }

    // If not found by document ID, try to find by custom ID field
    const q = query(collection(db, "stationscompany"), where("id", "==", id));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const companyUid = data.uId || data.uid || doc.id;

      // Count related data (same logic as above)
      const [carStationsSnapshot, ordersSnapshot] = await Promise.all([
        getDocs(collection(db, "carstations")),
        getDocs(collection(db, "stationscompany-orders")),
      ]);

      let stationsCount = 0;
      carStationsSnapshot.forEach((stationDoc) => {
        const stationData = stationDoc.data();
        const stationCreatedUserId =
          stationData.createdUserId || stationData.uId || stationData.uid;
        if (stationCreatedUserId === companyUid) {
          stationsCount++;
        }
      });

      let ordersCount = 0;
      ordersSnapshot.forEach((orderDoc) => {
        const orderData = orderDoc.data();
        const orderCreatedUserId =
          orderData.createdUserId || orderData.uId || orderData.uid;
        if (orderCreatedUserId === companyUid) {
          ordersCount++;
        }
      });

      return {
        id: data.id || doc.id,
        clientCode: data.refid || data.id || data.uId || doc.id, // Use refid as primary source
        providerName: data.name || "غير محدد",
        type: data.type || "غير محدد",
        phoneNumber: data.phoneNumber || data.phone || "-",
        email: data.email || "-",
        status: data.status || "نشط",
        isActive:
          data.isActive !== undefined
            ? data.isActive
            : data.status === "نشط" || data.status === "active"
            ? true
            : false,
        stationsCount,
        ordersCount,
        uId: companyUid,
      };
    }

    console.log(`❌ No stations company found with ID: ${id}`);
    return null;
  } catch (error) {
    console.error("❌ Error fetching stations company by ID:", error);
    throw error;
  }
};

/**
 * Interface for stations company join request data
 */
export interface StationsCompanyRequestData {
  id: string;
  providerName: string;
  type: string;
  address: string;
  phoneNumber: string;
  email: string;
  stations: number;
  status: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any; // Allow additional fields
}

/**
 * Fetch all stations company join requests from Firestore
 * @returns Promise with array of join request data
 */
export const fetchStationsCompanyRequests = async (): Promise<
  StationsCompanyRequestData[]
> => {
  try {
    console.log("📋 Fetching stations company join requests...");

    // Fetch all documents from stations-company-requests collection
    const requestsSnapshot = await getDocs(
      collection(db, "stations-company-requests")
    );

    console.log(`📊 Fetched ${requestsSnapshot.size} join request documents`);

    // Process join requests data
    const joinRequestsData: StationsCompanyRequestData[] = [];

    requestsSnapshot.forEach((doc) => {
      const data = doc.data();
      const status = data.status || data.requestStatus || "معلق";

      // Only include pending requests (exclude accepted and declined)
      if (
        status === "accepted" ||
        status === "declined" ||
        status === "مقبول" ||
        status === "مرفوض"
      ) {
        return;
      }

      // Transform the data to match our interface
      const requestData: StationsCompanyRequestData = {
        id: doc.id,
        providerName:
          data.providerName || data.name || data.companyName || "غير محدد",
        type: data.type || data.providerType || data.serviceType || "غير محدد",
        address: data.address || data.location || "غير محدد",
        phoneNumber:
          data.phoneNumber || data.phone || data.mobile || "غير محدد",
        email: data.email || data.emailAddress || "غير محدد",
        stations:
          data.stations || data.stationsCount || data.numberOfStations || 0,
        status: status,
        createdAt: data.createdAt || data.created_at,
        updatedAt: data.updatedAt || data.updated_at,
        ...data, // Include all other fields
      };

      joinRequestsData.push(requestData);
    });

    // Sort by creation date (newest first)
    joinRequestsData.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(
      `✅ Successfully fetched ${joinRequestsData.length} join requests`
    );
    return joinRequestsData;
  } catch (error) {
    console.error("❌ Error fetching stations company join requests:", error);
    throw error;
  }
};

/**
 * Accept a stations company join request
 * Updates the request status to "accepted" and adds the company to stationscompany collection
 * @param requestId - The ID of the request to accept
 * @returns Promise<boolean> - Success status
 */
export const acceptStationsCompanyRequest = async (
  requestId: string
): Promise<boolean> => {
  try {
    console.log(`✅ Accepting stations company request: ${requestId}`);

    // Get the request document
    const requestRef = doc(db, "stations-company-requests", requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      console.error(`❌ Request with ID ${requestId} not found`);
      return false;
    }

    const requestData = requestSnap.data();
    console.log("📋 Request data:", requestData);

    // Update the request status to "accepted"
    await updateDoc(requestRef, {
      status: "accepted",
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Request ${requestId} status updated to accepted`);

    // Add the company to stationscompany collection
    const stationsCompanyData = {
      providerName:
        requestData.providerName ||
        requestData.name ||
        requestData.companyName ||
        "غير محدد",
      type:
        requestData.type ||
        requestData.providerType ||
        requestData.serviceType ||
        "غير محدد",
      address: requestData.address || requestData.location || "غير محدد",
      phoneNumber:
        requestData.phoneNumber ||
        requestData.phone ||
        requestData.mobile ||
        "غير محدد",
      email: requestData.email || requestData.emailAddress || "غير محدد",
      stations:
        requestData.stations ||
        requestData.stationsCount ||
        requestData.numberOfStations ||
        0,
      status: "نشط", // Set as active
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Filter out undefined values from additional fields
    const additionalFields = { ...requestData };
    Object.keys(additionalFields).forEach((key) => {
      if (additionalFields[key] === undefined) {
        delete additionalFields[key];
      }
    });

    // Merge additional fields (excluding undefined values)
    const finalData = { ...stationsCompanyData, ...additionalFields };

    // Add to stationscompany collection
    const stationsCompanyRef = collection(db, "stationscompany");
    const newCompanyDoc = await addDoc(stationsCompanyRef, finalData);

    console.log(
      `✅ Company added to stationscompany collection with ID: ${newCompanyDoc.id}`
    );

    return true;
  } catch (error) {
    console.error(
      `❌ Error accepting stations company request ${requestId}:`,
      error
    );
    throw error;
  }
};

/**
 * Calculate fuel consumption by type for a specific station
 * @param stationEmail - The station email or UID to calculate consumption for
 * @returns Promise with fuel consumption breakdown by type
 */
export const calculateStationFuelConsumption = async (
  stationEmail: string
): Promise<{
  fuel91Consumed: number;
  fuel95Consumed: number;
  dieselConsumed: number;
}> => {
  try {
    console.log(`⛽ Calculating fuel consumption for station: ${stationEmail}`);

    // Fetch all orders using the same method as company dashboard
    const orders = await fetchAllOrders();

    console.log(`📦 Total orders fetched: ${orders.length}`);

    let fuel91Consumed = 0;
    let fuel95Consumed = 0;
    let dieselConsumed = 0;

    // Filter orders for this specific station (same pattern as company dashboard)
    const stationOrders = orders.filter((order) => {
      const orderStationEmail =
        order.carStation?.email ||
        order.stationEmail ||
        order.createdUserId ||
        "";

      const orderStationId = order.carStation?.id || order.stationId;

      // Check if station email matches (primary method)
      const emailMatch =
        orderStationEmail &&
        stationEmail &&
        orderStationEmail.toLowerCase() === stationEmail.toLowerCase();

      // Check if station ID matches (fallback method)
      const idMatch =
        orderStationId && stationEmail && orderStationId === stationEmail;

      return emailMatch || idMatch;
    });

    console.log(`📍 Orders matched to station: ${stationOrders.length}`);

    // Use the same calculation method as company dashboard
    stationOrders.forEach((order) => {
      // Extract fuel type with multiple fallbacks (same as company dashboard)
      let fuelType = "";
      if (order?.selectedOption?.name?.ar) {
        fuelType = order.selectedOption.name.ar;
      } else if (order?.selectedOption?.name?.en) {
        fuelType = order.selectedOption.name.en;
      } else if (order?.selectedOption?.label) {
        fuelType = order.selectedOption.label;
      } else if (order?.selectedOption?.title?.ar) {
        fuelType = order.selectedOption.title.ar;
      } else if (order?.selectedOption?.title?.en) {
        fuelType = order.selectedOption.title.en;
      } else if (order?.service?.title?.ar) {
        fuelType = order.service.title.ar;
      } else if (order?.service?.title?.en) {
        fuelType = order.service.title.en;
      } else if (order?.fuelType) {
        fuelType = order.fuelType;
      } else if (order?.productType) {
        fuelType = order.productType;
      }

      // Extract litres from multiple possible fields (same as company dashboard)
      const rawLitres =
        order?.totalLitre ??
        order?.totalLiter ??
        order?.quantity ??
        order?.selectedOption?.quantity ??
        order?.liters ??
        0;
      const liters = parseFloat(String(rawLitres)) || 0;

      // Categorize by fuel type (same as company dashboard)
      const normalizedType = String(fuelType).toLowerCase().trim();

      if (
        normalizedType.includes("ديزل") ||
        normalizedType.includes("diesel")
      ) {
        dieselConsumed += liters;
      } else if (
        normalizedType.includes("95") ||
        normalizedType.includes("بنزين 95") ||
        normalizedType.includes("gasoline 95")
      ) {
        fuel95Consumed += liters;
      } else if (
        normalizedType.includes("91") ||
        normalizedType.includes("بنزين 91") ||
        normalizedType.includes("gasoline 91")
      ) {
        fuel91Consumed += liters;
      }
    });

    console.log(
      `✅ Station ${stationEmail} consumption: 91=${fuel91Consumed}L, 95=${fuel95Consumed}L, Diesel=${dieselConsumed}L`
    );

    return {
      fuel91Consumed,
      fuel95Consumed,
      dieselConsumed,
    };
  } catch (error) {
    console.error(
      `❌ Error calculating fuel consumption for station ${stationEmail}:`,
      error
    );
    return {
      fuel91Consumed: 0,
      fuel95Consumed: 0,
      dieselConsumed: 0,
    };
  }
};

/**
 * Fetch stations for a specific service provider
 * @param providerEmail - The email or UID of the service provider
 * @returns Promise with array of station data
 */
export const fetchProviderStations = async (
  providerEmail: string
): Promise<any[]> => {
  try {
    console.log(`🏪 Fetching stations for provider: ${providerEmail}`);

    // Fetch all carstations documents
    const carStationsSnapshot = await getDocs(collection(db, "carstations"));

    const stations: any[] = [];

    // Process each station
    for (const stationDoc of carStationsSnapshot.docs) {
      const stationData = stationDoc.data();
      const stationCreatedUserId =
        stationData.createdUserId || stationData.uId || stationData.uid;

      // Match stations that belong to this provider
      if (stationCreatedUserId === providerEmail) {
        // Get the station email to match with orders
        const stationEmail =
          stationData.email || stationCreatedUserId || stationDoc.id;

        console.log(
          `🔍 Calculating consumption for station: ${stationData.name}, email: ${stationEmail}`
        );

        // Calculate fuel consumption for this station
        const consumption = await calculateStationFuelConsumption(stationEmail);

        stations.push({
          id: stationDoc.id,
          stationName: stationData.name || "-",
          address: stationData.address || stationData.location || "-",
          fuel91Consumed: consumption.fuel91Consumed,
          fuel95Consumed: consumption.fuel95Consumed,
          dieselConsumed: consumption.dieselConsumed,
          stationStatus: {
            active: stationData.isActive !== false,
            text: stationData.isActive !== false ? "نشط" : "متوقف",
          },
        });
      }
    }

    console.log(
      `✅ Found ${stations.length} stations for provider ${providerEmail}`
    );
    return stations;
  } catch (error) {
    console.error("❌ Error fetching provider stations:", error);
    throw error;
  }
};

/**
 * Fetch a station document by ID (for getting raw data like isActive)
 * @param stationId - The station document ID
 * @returns Promise with station document data
 */
export const fetchStationById = async (stationId: string) => {
  try {
    console.log("Fetching station by ID:", stationId);

    // Fetch the specific station document from Firestore
    const stationDocRef = doc(db, "carstations", stationId);
    const stationDoc = await getDoc(stationDocRef);

    if (!stationDoc.exists()) {
      throw new Error("Station not found");
    }

    const stationData = stationDoc.data();

    const station = {
      id: stationDoc.id,
      ...stationData,
    };

    console.log("Station data fetched:", station);

    return station;
  } catch (error) {
    console.error("Error fetching station by ID:", error);
    throw error;
  }
};

/**
 * Update station isActive status in Firestore
 * @param stationId - The station document ID
 * @param isActive - The new isActive status
 * @returns Promise<boolean> - Returns true if update was successful
 */
export const updateStationIsActive = async (
  stationId: string,
  isActive: boolean
): Promise<boolean> => {
  try {
    console.log(
      `📝 Updating station isActive status: ${stationId} -> ${isActive}`
    );

    const stationDocRef = doc(db, "carstations", stationId);
    await updateDoc(stationDocRef, {
      isActive: isActive,
    });

    console.log(`✅ Successfully updated station isActive status`);
    return true;
  } catch (error) {
    console.error("❌ Error updating station isActive status:", error);
    throw error;
  }
};

/**
 * Fetch the count of pending requests from stations-company-requests collection
 * @returns Promise<number> - Count of pending requests
 */
export const fetchPendingRequestsCount = async (): Promise<number> => {
  try {
    console.log("📊 Fetching pending requests count...");

    // Fetch all documents from stations-company-requests collection
    const requestsSnapshot = await getDocs(
      collection(db, "stations-company-requests")
    );

    let pendingCount = 0;
    requestsSnapshot.forEach((doc) => {
      const data = doc.data();
      const status = data.status || data.requestStatus || "معلق";

      // Only count pending requests (exclude accepted and declined)
      if (
        status !== "accepted" &&
        status !== "declined" &&
        status !== "مقبول" &&
        status !== "مرفوض"
      ) {
        pendingCount++;
      }
    });

    console.log(`✅ Pending requests count: ${pendingCount}`);
    return pendingCount;
  } catch (error) {
    console.error("❌ Error fetching pending requests count:", error);
    return 0;
  }
};

/**
 * Decline a stations company join request
 * Updates the request status to "declined"
 * @param requestId - The ID of the request to decline
 * @returns Promise<boolean> - Success status
 */
export const declineStationsCompanyRequest = async (
  requestId: string
): Promise<boolean> => {
  try {
    console.log(`❌ Declining stations company request: ${requestId}`);

    // Get the request document
    const requestRef = doc(db, "stations-company-requests", requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      console.error(`❌ Request with ID ${requestId} not found`);
      return false;
    }

    // Update the request status to "declined"
    await updateDoc(requestRef, {
      status: "declined",
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Request ${requestId} status updated to declined`);

    return true;
  } catch (error) {
    console.error(
      `❌ Error declining stations company request ${requestId}:`,
      error
    );
    throw error;
  }
};
export const fetchFuelStationRequests = async (
  currentUserEmail: string
): Promise<any[]> => {
  try {
    console.log("⛽ Fetching fuel station requests from Firestore...");

    if (!currentUserEmail) {
      console.log("❌ No user email provided.");
      return [];
    }

    // Fetch stationscompany-orders collection
    const ordersRef = collection(db, "stationscompany-orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    const allOrders: any[] = [];

    querySnapshot.forEach((doc) => {
      allOrders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log("📋 Total orders found:", allOrders.length);

    // Filter orders by current user (service distributer)
    // Check if carStation.createdUserId matches current user's email
    const filteredOrders = allOrders.filter((order) => {
      const carStationCreatedUserId = order.carStation?.createdUserId;

      const match =
        carStationCreatedUserId &&
        carStationCreatedUserId.toLowerCase() ===
          currentUserEmail.toLowerCase();

      return match;
    });

    console.log("✅ Filtered orders for current user:", filteredOrders.length);

    // Transform orders to match the FuelStationRequest interface
    const transformedOrders = filteredOrders.map((order) => {
      // Format date
      const formatDate = (date: any): string => {
        if (!date) return "غير محدد";
        try {
          const dateObj = date.toDate ? date.toDate() : new Date(date);
          const day = String(dateObj.getDate()).padStart(2, "0");
          const year = dateObj.getFullYear();
          const hoursNum = dateObj.getHours();
          const minutes = String(dateObj.getMinutes()).padStart(2, "0");
          const ampm = hoursNum >= 12 ? "م" : "ص";
          const displayHours = hoursNum % 12 || 12;

          const monthNames = [
            "يناير",
            "فبراير",
            "مارس",
            "أبريل",
            "مايو",
            "يونيو",
            "يوليو",
            "أغسطس",
            "سبتمبر",
            "أكتوبر",
            "نوفمبر",
            "ديسمبر",
          ];

          return `${day} ${
            monthNames[dateObj.getMonth()]
          } ${year} - ${displayHours}:${minutes} ${ampm}`;
        } catch (error) {
          return "غير محدد";
        }
      };

      return {
        id: order.id,
        transactionNumber: order.refId || order.refDocId || order.id,
        stationName: order.carStation?.name || "غير محدد",
        clientName: order.client?.name || "غير محدد",
        workerName: order.fuelStationsWorker?.name || "غير محدد",
        fuelType:
          order.selectedOption?.title?.ar ||
          order.selectedOption?.desc?.ar ||
          "غير محدد",
        totalLiters: order.totalLitre?.toString() || "0",
        creationDate: formatDate(order.orderDate),
        rawDate: order.orderDate,
        // Keep original order data for calculations
        originalOrder: order,
      };
    });

    console.log(
      "✅ Fuel station requests transformed:",
      transformedOrders.length
    );

    return transformedOrders;
  } catch (error) {
    console.error("❌ Error fetching fuel station requests:", error);
    throw error;
  }
};

/**
 * Fetch a single order by ID from stationscompany-orders
 * @param orderId - The order ID
 * @returns Promise with the order data or null
 */
export const fetchFuelStationOrderById = async (
  orderId: string
): Promise<any | null> => {
  try {
    console.log("📥 Fetching order by ID:", orderId);

    if (!orderId) {
      console.error("❌ No order ID provided");
      return null;
    }

    // Fetch the order from stationscompany-orders collection
    const orderRef = doc(db, "stationscompany-orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      console.log("⚠️ No order found with ID:", orderId);
      return null;
    }

    const orderData = {
      id: orderSnap.id,
      ...orderSnap.data(),
    };

    console.log("✅ Order data fetched successfully!");
    console.log("📦 Order data:", orderData);

    return orderData;
  } catch (error) {
    console.error("❌ Error fetching order by ID:", error);
    return null;
  }
};

/**
 * Wait for auth state to be initialized
 * @returns Promise with current user or null
 */
export const waitForAuthState = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    // If user is already available, return immediately
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }

    // Otherwise, wait for auth state change
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // Clean up listener
      if (user) {
        resolve(user);
      } else {
        reject(new Error("No authenticated user found"));
      }
    });
  });
};

/**
 * Fetch service distributer statistics
 * Calculates fuel cost, total liters, unique clients, unique workers, and station count
 * @returns Promise with statistics data
 */
export const fetchServiceDistributerStatistics = async (): Promise<{
  fuelCost: {
    total: number;
    breakdown: Array<{ type: string; amount: number; color: string }>;
  };
  totalLiters: {
    total: number;
    breakdown: Array<{ type: string; amount: number; color: string }>;
  };
  uniqueClients: number;
  uniqueWorkers: number;
  totalStations: number;
}> => {
  try {
    console.log("\n📊 ========================================");
    console.log("CALCULATING SERVICE DISTRIBUTER STATISTICS");
    console.log("========================================\n");

    // Wait for auth state to be ready
    console.log("⏳ Waiting for auth state...");
    const currentUser = await waitForAuthState();
    console.log("✅ Auth state ready, current user:", currentUser.email);

    if (!currentUser || !currentUser.email) {
      throw new Error("No authenticated user found");
    }

    const currentUserEmail = currentUser.email;
    console.log("👤 Current user email:", currentUserEmail);

    // Fetch all required data in parallel
    const [orders, stations] = await Promise.all([
      fetchFuelStationRequests(currentUserEmail),
      fetchFuelStations(),
    ]);

    console.log(`📦 Total orders: ${orders.length}`);
    console.log(`🏪 Total stations: ${stations.length}`);

    // Filter stations by createdUserId
    const userStations = stations.filter((station) => {
      const createdUserId = station.createdUserId || "";
      return createdUserId.toLowerCase() === currentUserEmail.toLowerCase();
    });
    console.log(`🏪 User stations: ${userStations.length}`);

    // Initialize fuel type maps
    const fuelCostMap: { [key: string]: number } = {
      ديزل: 0,
      "بنزين 95": 0,
      "بنزين 91": 0,
    };

    const totalLitersMap: { [key: string]: number } = {
      ديزل: 0,
      "بنزين 95": 0,
      "بنزين 91": 0,
    };

    // Track unique clients and workers
    const uniqueClientsSet = new Set<string>();
    const uniqueWorkersSet = new Set<string>();

    // Process each order
    orders.forEach((order, index) => {
      const originalOrder = order.originalOrder || {};

      // Extract fuel type
      const fuelTypeAr = originalOrder.selectedOption?.title?.ar || "";
      const fuelTypeEn = originalOrder.selectedOption?.title?.en || "";

      // Map fuel type to standard categories
      let mappedType = "";
      if (
        fuelTypeAr.includes("ديزل") ||
        fuelTypeEn.toLowerCase().includes("diesel")
      ) {
        mappedType = "ديزل";
      } else if (fuelTypeAr.includes("95") || fuelTypeEn.includes("95")) {
        mappedType = "بنزين 95";
      } else if (fuelTypeAr.includes("91") || fuelTypeEn.includes("91")) {
        mappedType = "بنزين 91";
      }

      if (
        mappedType &&
        (fuelCostMap.hasOwnProperty(mappedType) ||
          totalLitersMap.hasOwnProperty(mappedType))
      ) {
        // Calculate cost
        const cost = parseFloat(originalOrder.totalPrice) || 0;
        fuelCostMap[mappedType] += cost;

        // Calculate liters
        const liters = parseFloat(originalOrder.totalLitre) || 0;
        totalLitersMap[mappedType] += liters;
      }

      // Track unique clients
      if (originalOrder.client?.email) {
        uniqueClientsSet.add(originalOrder.client.email);
      }

      // Track unique workers
      if (originalOrder.fuelStationsWorker?.email) {
        uniqueWorkersSet.add(originalOrder.fuelStationsWorker.email);
      }
    });

    // Build breakdown arrays with colors
    const colorMap: { [key: string]: string } = {
      ديزل: "text-color-mode-text-icons-t-orange",
      "بنزين 95": "text-color-mode-text-icons-t-red",
      "بنزين 91": "text-color-mode-text-icons-t-green",
    };

    const fuelCostBreakdown = Object.entries(fuelCostMap).map(
      ([type, amount]) => ({
        type,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
        color: colorMap[type],
      })
    );

    const totalLitersBreakdown = Object.entries(totalLitersMap).map(
      ([type, amount]) => ({
        type,
        amount: Math.round(amount * 100) / 100,
        color: colorMap[type],
      })
    );

    const totalFuelCost = Object.values(fuelCostMap).reduce(
      (sum, val) => sum + val,
      0
    );
    const totalLitersTotal = Object.values(totalLitersMap).reduce(
      (sum, val) => sum + val,
      0
    );

    const result = {
      fuelCost: {
        total: Math.round(totalFuelCost * 100) / 100,
        breakdown: fuelCostBreakdown,
      },
      totalLiters: {
        total: Math.round(totalLitersTotal * 100) / 100,
        breakdown: totalLitersBreakdown,
      },
      uniqueClients: uniqueClientsSet.size,
      uniqueWorkers: uniqueWorkersSet.size,
      totalStations: userStations.length,
    };

    console.log("\n📊 SERVICE DISTRIBUTER STATISTICS:");
    console.log("=====================================");
    console.log("Fuel Cost:", result.fuelCost);
    console.log("Total Liters:", result.totalLiters);
    console.log("Unique Clients:", result.uniqueClients);
    console.log("Unique Workers:", result.uniqueWorkers);
    console.log("Total Stations:", result.totalStations);
    console.log("=====================================\n");

    return result;
  } catch (error) {
    console.error(
      "❌ Error calculating service distributer statistics:",
      error
    );
    throw error;
  }
};

/**
 * Fetch fuel stations workers from Firestore
 * Filters by carStation.createdUserId matching current user's email
 * @returns Promise with array of worker data
 */
/**
 * Fetch a single fuel station worker by UID
 * @param workerUid The Firebase UID (uId field) of the worker
 * @returns Promise with worker data or null if not found
 */
export const fetchFuelStationWorkerByEmail = async (
  workerUid: string
): Promise<any | null> => {
  try {
    console.log("👷 Fetching single worker by UID:", workerUid);

    if (!workerUid) {
      console.error("❌ No worker UID provided");
      return null;
    }

    // Fetch all workers and find the one with matching uId
    // Since documents are keyed by email, we need to query and filter
    const workersRef = collection(db, "fuelStationsWorkers");
    const querySnapshot = await getDocs(workersRef);

    let workerData = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.uId === workerUid) {
        workerData = {
          id: doc.id, // Keep the email as the document ID for reference
          ...data,
        };
      }
    });

    if (!workerData) {
      console.log("⚠️ No worker found with UID:", workerUid);
      return null;
    }

    console.log("✅ Worker data fetched successfully!");
    console.log("📦 Worker data:", workerData);

    return workerData;
  } catch (error) {
    console.error("❌ Error fetching worker by UID:", error);
    return null;
  }
};

export const fetchFuelStationsWorkers = async (): Promise<any[]> => {
  try {
    console.log("👷 Fetching fuel stations workers from Firestore...");

    // Wait for auth state to be ready
    console.log("⏳ Waiting for auth state...");
    const currentUser = await waitForAuthState();
    console.log("✅ Auth state ready, current user:", currentUser.email);

    if (!currentUser || !currentUser.email) {
      throw new Error("No authenticated user found");
    }

    const currentUserEmail = currentUser.email;

    // ⚠️ NOTE: Firestore doesn't support querying nested fields like "carStation.createdUserId"
    // We have to fetch all workers and filter client-side
    const workersRef = collection(db, "fuelStationsWorkers");
    const q = query(workersRef, orderBy("createdDate", "desc"));
    const querySnapshot = await getDocs(q);

    const allWorkers: any[] = [];

    querySnapshot.forEach((doc) => {
      allWorkers.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log("📋 Total workers found:", allWorkers.length);

    // Filter workers by current user (service distributer)
    // Check if carStation.createdUserId matches current user's email
    const filteredWorkers = allWorkers.filter((worker) => {
      const carStationCreatedUserId = worker.carStation?.createdUserId;

      const match =
        carStationCreatedUserId &&
        carStationCreatedUserId.toLowerCase() ===
          currentUserEmail.toLowerCase();

      return match;
    });

    console.log(
      "✅ Filtered workers for current user:",
      filteredWorkers.length
    );
    console.log(
      `📊 Efficiency: Fetched ${allWorkers.length} workers, filtered to ${
        filteredWorkers.length
      } (${
        filteredWorkers.length > 0
          ? Math.round((filteredWorkers.length / allWorkers.length) * 100)
          : 0
      }% match rate)`
    );

    // Transform workers to standard format
    // IMPORTANT: Use uId (Firebase UID) as the ID for cleaner URLs
    const transformedWorkers = filteredWorkers.map((worker) => {
      return {
        id: worker.uId || worker.id, // Use uId (Firebase UID) as primary ID, fallback to email
        driverCode: "-", // Keep blank for now
        driverName: worker.name || "-",
        phone: worker.phoneNumber || "-",
        emailAddress: worker.email || "-",
        station: worker.carStation?.name || worker.stationsCompany?.name || "-",
        accountStatus: {
          active: worker.isActive === true,
          text: worker.isActive === true ? "مفعل" : "معطل",
        },
        // Keep original worker data for details page
        originalWorker: worker,
      };
    });

    console.log(
      "✅ Fuel stations workers transformed:",
      transformedWorkers.length
    );

    return transformedWorkers;
  } catch (error) {
    console.error("❌ Error fetching fuel stations workers:", error);
    throw error;
  }
};

/**
 * Fetch fuel station workers for a specific station
 * Filters by stationsCompany.email matching the station's email
 * @param stationEmail - The email of the station
 * @returns Promise with array of workers for that station
 */
export const fetchFuelStationWorkersByStationEmail = async (
  stationEmail: string
): Promise<any[]> => {
  try {
    console.log("👷 Fetching fuel stations workers for station:", stationEmail);

    if (!stationEmail) {
      console.error("❌ No station email provided");
      return [];
    }

    // ⚠️ NOTE: Firestore doesn't support querying nested fields like "stationsCompany.email"
    // We have to fetch all workers and filter client-side
    const workersRef = collection(db, "fuelStationsWorkers");
    const q = query(workersRef, orderBy("createdDate", "desc"));
    const querySnapshot = await getDocs(q);

    const allWorkers: any[] = [];

    querySnapshot.forEach((doc) => {
      allWorkers.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log("📋 Total workers found:", allWorkers.length);

    // Filter workers by station email
    // Check if stationsCompany.email matches the station's email
    const filteredWorkers = allWorkers.filter((worker) => {
      const workerStationEmail = worker.stationsCompany?.email;

      const match =
        workerStationEmail &&
        workerStationEmail.toLowerCase() === stationEmail.toLowerCase();

      return match;
    });

    console.log("✅ Filtered workers for station:", filteredWorkers.length);
    console.log(
      `📊 Efficiency: Fetched ${allWorkers.length} workers, filtered to ${
        filteredWorkers.length
      } (${
        filteredWorkers.length > 0
          ? Math.round((filteredWorkers.length / allWorkers.length) * 100)
          : 0
      }% match rate)`
    );

    // Transform workers to standard format
    const transformedWorkers = filteredWorkers.map((worker) => {
      return {
        id: worker.uId || worker.id, // Use uId (Firebase UID) as primary ID, fallback to email
        workerCode: "-", // Keep blank for now
        workerName: worker.name || "-",
        phone: worker.phoneNumber || "-",
        email: worker.email || "-",
        accountStatus: {
          active: worker.isActive === true,
          text: worker.isActive === true ? "مفعل" : "معطل",
        },
        // Keep original worker data for details page
        originalWorker: worker,
      };
    });

    console.log(
      "✅ Fuel stations workers transformed:",
      transformedWorkers.length
    );

    return transformedWorkers;
  } catch (error) {
    console.error(
      "❌ Error fetching fuel station workers by station email:",
      error
    );
    throw error;
  }
};

/**
 * Fetch service distributer financial reports from stationscompany-orders collection
 * Filters by carStation.createdUserId matching current user's email
 * @returns Promise with array of financial report data
 */
export const fetchServiceDistributerFinancialReports = async (): Promise<
  any[]
> => {
  try {
    console.log(
      "📊 Fetching service distributer financial reports from stationscompany-orders..."
    );

    // Wait for auth state to be ready
    console.log("⏳ Waiting for auth state...");
    const currentUser = await waitForAuthState();
    console.log("✅ Auth state ready, current user:", currentUser.email);

    if (!currentUser || !currentUser.email) {
      throw new Error("No authenticated user found");
    }

    const currentUserEmail = currentUser.email;

    // ⚠️ NOTE: Firestore doesn't support querying nested fields like "carStation.createdUserId"
    // We have to fetch all orders and filter client-side
    // This is a known limitation of Firestore queries
    const ordersRef = collection(db, "stationscompany-orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot = await getDocs(q);

    const allOrders: any[] = [];

    querySnapshot.forEach((doc) => {
      allOrders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log("📋 Total orders found:", allOrders.length);

    // Filter orders by current user (service distributer)
    // Check if carStation.createdUserId matches current user's email
    const filteredOrders = allOrders.filter((order) => {
      const carStationCreatedUserId = order.carStation?.createdUserId;

      const match =
        carStationCreatedUserId &&
        carStationCreatedUserId.toLowerCase() ===
          currentUserEmail.toLowerCase();

      return match;
    });

    console.log("✅ Filtered orders for current user:", filteredOrders.length);
    console.log(
      `📊 Efficiency: Fetched ${allOrders.length} orders, filtered to ${
        filteredOrders.length
      } (${
        filteredOrders.length > 0
          ? Math.round((filteredOrders.length / allOrders.length) * 100)
          : 0
      }% match rate)`
    );

    // Transform orders to financial report format
    const financialReports = filteredOrders.map((order) => {
      // Extract values from selectedOption
      const selectedOption = order.selectedOption || {};

      return {
        id: order.id || Date.now().toString(),
        // نوع المنتج (Product Type) - from selectedOption.categoryName
        productType:
          selectedOption.categoryName?.ar ||
          selectedOption.categoryName?.en ||
          "غير محدد",

        // رقم المنتج (Product Number) - from selectedOption.refId
        productNumber: selectedOption.refId || "-",

        // اسم المنتج (Product Name) - from selectedOption.title
        productName:
          selectedOption.title?.ar || selectedOption.title?.en || "-",

        // الكمية (Quantity) - from totalLitre
        quantity: order.totalLitre?.toString() || "0",

        // القيمة (ر.س) (Value) - from selectedOption.price
        value: selectedOption.price?.toString() || "0",

        // الوحدة (Unit)
        unit: "لتر",

        // رقم العملية (Operation Number) - from refId
        operationNumber: order.refId || order.refDocId || order.id || "-",

        // Keep original order for reference
        originalOrder: order,
      };
    });

    console.log(
      "✅ Service distributer financial reports transformed:",
      financialReports.length
    );

    return financialReports;
  } catch (error) {
    console.error(
      "❌ Error fetching service distributer financial reports:",
      error
    );
    throw error;
  }
};

/**
 * Fetch operations data from stationscompany-orders collection for service distributer
 * Uses the same logic as fetchServiceDistributerFinancialReports but with operations table format
 * Filters by carStation.createdUserId matching current user's email
 * @returns Promise with array of operations data formatted for the operations table
 */
export const fetchOperationsData = async (): Promise<any[]> => {
  try {
    console.log("📊 Fetching operations data from stationscompany-orders...");

    // Wait for auth state to be ready
    console.log("⏳ Waiting for auth state...");
    const currentUser = await waitForAuthState();
    console.log("✅ Auth state ready, current user:", currentUser.email);

    if (!currentUser || !currentUser.email) {
      throw new Error("No authenticated user found");
    }

    const currentUserEmail = currentUser.email;

    // ⚠️ NOTE: Firestore doesn't support querying nested fields like "carStation.createdUserId"
    // We have to fetch all orders and filter client-side
    // This is a known limitation of Firestore queries
    const ordersRef = collection(db, "stationscompany-orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot = await getDocs(q);

    const allOrders: any[] = [];

    querySnapshot.forEach((doc) => {
      allOrders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log("📋 Total orders found:", allOrders.length);

    // Filter orders by current user (service distributer)
    // Check if carStation.createdUserId matches current user's email
    const filteredOrders = allOrders.filter((order) => {
      const carStationCreatedUserId = order.carStation?.createdUserId;

      const match =
        carStationCreatedUserId &&
        carStationCreatedUserId.toLowerCase() ===
          currentUserEmail.toLowerCase();

      return match;
    });

    console.log("✅ Filtered orders for current user:", filteredOrders.length);
    console.log(
      `📊 Efficiency: Fetched ${allOrders.length} orders, filtered to ${
        filteredOrders.length
      } (${
        filteredOrders.length > 0
          ? Math.round((filteredOrders.length / allOrders.length) * 100)
          : 0
      }% match rate)`
    );

    // Process commissions for orders that don't have commission documents yet
    // This ensures commissions are tracked when operations are viewed
    try {
      const commissionsRef = collection(db, "commissions");
      const allCommissionsSnapshot = await getDocs(commissionsRef);
      const existingOrderIds = new Set<string>();
      allCommissionsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.orderId) {
          existingOrderIds.add(data.orderId);
        }
      });

      const ordersNeedingCommission = filteredOrders.filter(
        (order) => !existingOrderIds.has(order.id)
      );

      if (ordersNeedingCommission.length > 0) {
        console.log(
          `🔄 Processing commissions for ${ordersNeedingCommission.length} orders...`
        );
        // Process commissions in background (non-blocking)
        processAllOrdersCommissions(currentUserEmail).catch((error) => {
          console.error(
            "⚠️ Error processing commissions (non-critical):",
            error
          );
        });
      }
    } catch (error) {
      console.error(
        "⚠️ Error checking existing commissions (non-critical):",
        error
      );
    }

    // Fetch commission settings
    let commissionSettings: CommissionSettings;
    try {
      commissionSettings = await fetchCommissionSettings();
    } catch (error) {
      console.warn(
        "⚠️ Could not fetch commission settings, using defaults:",
        error
      );
      commissionSettings = { petrol: 0, diesel: 0 };
    }

    // Format date function
    const formatDateTime = (date: any): string => {
      if (!date) return "غير محدد";
      try {
        const dateObj = date.toDate ? date.toDate() : new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");
        return `${year}/${month}/${day} - ${hours}:${minutes}`;
      } catch (error) {
        console.error("Error formatting date:", error);
        return "غير محدد";
      }
    };

    // Extract fuel type with fallback chain
    const extractFuelType = (order: any): string => {
      // Priority 1: selectedOption.name (ar or en)
      if (order.selectedOption?.name?.ar) {
        return order.selectedOption.name.ar;
      }
      if (order.selectedOption?.name?.en) {
        return order.selectedOption.name.en;
      }
      // Priority 2: selectedOption.title (ar or en)
      if (order.selectedOption?.title?.ar) {
        return order.selectedOption.title.ar;
      }
      if (order.selectedOption?.title?.en) {
        return order.selectedOption.title.en;
      }
      // Priority 3: service.options.name (ar or en) - find matching option
      if (order.service?.options && Array.isArray(order.service.options)) {
        const selectedOptionId =
          order.selectedOption?.id || order.selectedOption?.refId;
        const matchingOption = order.service.options.find(
          (opt: any) =>
            opt.id === selectedOptionId || opt.refId === selectedOptionId
        );
        if (matchingOption?.name?.ar) {
          return matchingOption.name.ar;
        }
        if (matchingOption?.name?.en) {
          return matchingOption.name.en;
        }
        if (matchingOption?.title?.ar) {
          return matchingOption.title.ar;
        }
        if (matchingOption?.title?.en) {
          return matchingOption.title.en;
        }
      }
      // Fallback to service.title
      if (order.service?.title?.ar) {
        return order.service.title.ar;
      }
      if (order.service?.title?.en) {
        return order.service.title.en;
      }
      return "غير محدد";
    };

    // Format number with 2 decimal places
    const formatNumber = (value: number | string | undefined): string => {
      if (value === undefined || value === null) return "0";
      const num = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(num)) return "0";
      return num.toFixed(2);
    };

    // Determine if fuel type is diesel
    const isDiesel = (fuelType: string): boolean => {
      const normalized = fuelType.toLowerCase().trim();
      return (
        normalized.includes("ديزل") ||
        normalized.includes("ديزيل") ||
        normalized.includes("diesel")
      );
    };

    // Calculate commission based on fuel type and liters
    // If storedCommissionRate is provided, use it; otherwise use current settings
    const calculateCommission = (
      fuelType: string,
      totalLitre: number,
      storedCommissionRate?: number
    ): { commission: number; rateUsed: number } => {
      const liters =
        typeof totalLitre === "string"
          ? parseFloat(totalLitre)
          : totalLitre || 0;
      if (isNaN(liters) || liters <= 0) return { commission: 0, rateUsed: 0 };

      // Use stored commission rate if available, otherwise use current settings
      const commissionRate =
        storedCommissionRate !== undefined && storedCommissionRate !== null
          ? storedCommissionRate
          : isDiesel(fuelType)
          ? commissionSettings.diesel
          : commissionSettings.petrol;

      return {
        commission: liters * commissionRate,
        rateUsed: commissionRate,
      };
    };

    // Track orders that need to be updated with commission rate
    const ordersToUpdate: Array<{
      orderId: string;
      commissionRateUsed: number;
    }> = [];

    // Transform orders to operations format
    const operations = filteredOrders.map((order) => {
      const fuelType = extractFuelType(order);
      const totalLitre = order.totalLitre || 0;

      // Check if order already has a stored commission rate
      const storedCommissionRate =
        order.commissionRateUsed !== undefined &&
        order.commissionRateUsed !== null
          ? order.commissionRateUsed
          : undefined;

      // Calculate commission (will use stored rate if available, otherwise current settings)
      const { commission, rateUsed } = calculateCommission(
        fuelType,
        totalLitre,
        storedCommissionRate
      );

      // If order doesn't have stored commission rate, mark it for update
      if (storedCommissionRate === undefined && order.id) {
        ordersToUpdate.push({
          orderId: order.id,
          commissionRateUsed: rateUsed,
        });
      }

      return {
        id: order.id || Date.now().toString(),
        // رقم العملية (Operation Number) - from refId or refDocId or id
        operationNumber: order.refId || order.refDocId || order.id || "-",
        // اسم المحطة (Station Name) - from carStation.name
        stationName: order.carStation?.name || "غير محدد",
        // التاريخ والوقت (Date and Time) - from createdDate
        dateTime: formatDateTime(order.createdDate || order.orderDate),
        // نوع الوقود (Fuel Type) - from service.options.name with fallbacks
        fuelType: fuelType,
        // عدد اللترات (Liters) - from totalLitre
        liters: formatNumber(totalLitre),
        // إجمالي العملية (Total Operation) - from totalPrice
        totalOperation: formatNumber(order.totalPrice),
        // إجمالي العمولة (Total Commission) - calculated based on fuel type and liters
        totalCommission: formatNumber(commission),
        // Keep original order for reference
        originalOrder: order,
      };
    });

    // Update orders that don't have commissionRateUsed field (batch write for efficiency)
    if (ordersToUpdate.length > 0) {
      console.log(
        `💾 Updating ${ordersToUpdate.length} orders with commission rates...`
      );
      try {
        // Firestore batch limit is 500 operations
        const batchSize = 500;
        const batches: Array<
          Array<{ orderId: string; commissionRateUsed: number }>
        > = [];

        // Split into batches
        for (let i = 0; i < ordersToUpdate.length; i += batchSize) {
          batches.push(ordersToUpdate.slice(i, i + batchSize));
        }

        // Process each batch
        for (const batch of batches) {
          const batchWrite = writeBatch(db);
          for (const { orderId, commissionRateUsed } of batch) {
            const orderDocRef = doc(db, "stationscompany-orders", orderId);
            batchWrite.update(orderDocRef, {
              commissionRateUsed: commissionRateUsed,
            });
          }
          await batchWrite.commit();
        }

        console.log(
          `✅ Successfully updated ${ordersToUpdate.length} orders with commission rates`
        );
      } catch (error) {
        // Log error but don't fail the entire operation
        console.error(
          "⚠️ Error updating orders with commission rates (non-critical):",
          error
        );
      }
    }

    console.log("✅ Operations data transformed:", operations.length);

    return operations;
  } catch (error) {
    console.error("❌ Error fetching operations data:", error);
    throw error;
  }
};

/**
 * Generate invoices for all existing orders grouped by month
 * @returns Promise with array of created invoice IDs
 */
export const generateAllServiceDistributerMonthlyInvoices = async (): Promise<
  string[]
> => {
  try {
    // Wait for auth state
    const currentUser = await waitForAuthState();
    if (!currentUser || !currentUser.email) {
      throw new Error("No authenticated user found");
    }

    const serviceDistributerEmail = currentUser.email;

    // Fetch all orders from stationscompany-orders
    const ordersRef = collection(db, "stationscompany-orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot = await getDocs(q);

    const allOrders: any[] = [];
    querySnapshot.forEach((doc) => {
      allOrders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Filter orders by current user's stations
    const userOrders = allOrders.filter((order) => {
      const carStationCreatedUserId = order.carStation?.createdUserId;
      return (
        carStationCreatedUserId &&
        carStationCreatedUserId.toLowerCase() ===
          serviceDistributerEmail.toLowerCase()
      );
    });

    if (userOrders.length === 0) {
      console.log(
        `No orders found for service distributer ${serviceDistributerEmail}`
      );
      return [];
    }

    // Group orders by month
    const ordersByMonth = new Map<string, any[]>();

    userOrders.forEach((order) => {
      const orderDate = order.orderDate?.toDate
        ? order.orderDate.toDate()
        : order.createdDate?.toDate
        ? order.createdDate.toDate()
        : new Date(order.orderDate || order.createdDate || 0);

      const monthKey = `${orderDate.getFullYear()}-${String(
        orderDate.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!ordersByMonth.has(monthKey)) {
        ordersByMonth.set(monthKey, []);
      }
      ordersByMonth.get(monthKey)!.push(order);
    });

    // Fetch existing invoices
    const { fetchInvoices } = await import("./invoiceService");
    const existingInvoices = await fetchInvoices({
      type: "Service Distributer Monthly Invoice",
      serviceDistributerEmail: serviceDistributerEmail,
    });

    // Create a set of existing month keys
    const existingMonthKeys = new Set<string>();
    existingInvoices.forEach((inv) => {
      if (inv.monthName) {
        // Extract year-month from monthName (e.g., "January 2025" -> "2025-01")
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        const parts = inv.monthName.split(" ");
        if (parts.length === 2) {
          const monthName = parts[0];
          const year = parts[1];
          const monthIndex = monthNames.indexOf(monthName);
          if (monthIndex !== -1) {
            const monthKey = `${year}-${String(monthIndex + 1).padStart(
              2,
              "0"
            )}`;
            existingMonthKeys.add(monthKey);
          }
        }
      }
    });

    // Generate invoices for months that don't have invoices yet
    const createdInvoiceIds: string[] = [];
    const { generateServiceDistributerMonthlyInvoice, getMonthName } =
      await import("./invoiceService");

    const serviceDistributerData = {
      email: serviceDistributerEmail,
      uid: currentUser.uid,
    };

    for (const [monthKey, orders] of ordersByMonth.entries()) {
      // Skip if invoice already exists for this month
      if (existingMonthKeys.has(monthKey)) {
        console.log(
          `Invoice already exists for month ${monthKey}, skipping...`
        );
        continue;
      }

      // Parse month key to create Date object
      const [year, month] = monthKey.split("-");
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);

      try {
        const invoice = await generateServiceDistributerMonthlyInvoice(
          serviceDistributerEmail,
          monthDate,
          orders,
          serviceDistributerData
        );
        createdInvoiceIds.push(invoice.id);
        console.log(`✅ Created invoice for ${getMonthName(monthDate)}`);
      } catch (error) {
        console.error(`Error creating invoice for ${monthKey}:`, error);
      }
    }

    return createdInvoiceIds;
  } catch (error) {
    console.error(
      "Error generating all service distributer monthly invoices:",
      error
    );
    throw error;
  }
};

/**
 * Generate commission invoices for all existing orders grouped by month
 * @returns Promise with array of created invoice IDs
 */
export const generateAllServiceDistributerCommissionInvoices =
  async (): Promise<string[]> => {
    try {
      // Wait for auth state
      const currentUser = await waitForAuthState();
      if (!currentUser || !currentUser.email) {
        throw new Error("No authenticated user found");
      }

      const serviceDistributerEmail = currentUser.email;

      // Fetch all orders from stationscompany-orders
      const ordersRef = collection(db, "stationscompany-orders");
      const q = query(ordersRef, orderBy("orderDate", "desc"));
      const querySnapshot = await getDocs(q);

      const allOrders: any[] = [];
      querySnapshot.forEach((doc) => {
        allOrders.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Filter orders by current user's stations
      const userOrders = allOrders.filter((order) => {
        const carStationCreatedUserId = order.carStation?.createdUserId;
        return (
          carStationCreatedUserId &&
          carStationCreatedUserId.toLowerCase() ===
            serviceDistributerEmail.toLowerCase()
        );
      });

      if (userOrders.length === 0) {
        console.log(
          `No orders found for service distributer ${serviceDistributerEmail}`
        );
        return [];
      }

      // Group orders by month
      const ordersByMonth = new Map<string, any[]>();

      userOrders.forEach((order) => {
        const orderDate = order.orderDate?.toDate
          ? order.orderDate.toDate()
          : order.createdDate?.toDate
          ? order.createdDate.toDate()
          : new Date(order.orderDate || order.createdDate || 0);

        const monthKey = `${orderDate.getFullYear()}-${String(
          orderDate.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!ordersByMonth.has(monthKey)) {
          ordersByMonth.set(monthKey, []);
        }
        ordersByMonth.get(monthKey)!.push(order);
      });

      // Fetch existing commission invoices
      const { fetchInvoices } = await import("./invoiceService");
      const existingInvoices = await fetchInvoices({
        type: "Service Distributer Commission Invoice",
        serviceDistributerEmail: serviceDistributerEmail,
      });

      // Create a set of existing month keys
      const existingMonthKeys = new Set<string>();
      existingInvoices.forEach((inv) => {
        if (inv.monthName) {
          // Extract year-month from monthName (e.g., "January 2025" -> "2025-01")
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          const parts = inv.monthName.split(" ");
          if (parts.length === 2) {
            const monthName = parts[0];
            const year = parts[1];
            const monthIndex = monthNames.indexOf(monthName);
            if (monthIndex !== -1) {
              const monthKey = `${year}-${String(monthIndex + 1).padStart(
                2,
                "0"
              )}`;
              existingMonthKeys.add(monthKey);
            }
          }
        }
      });

      // Generate invoices for months that don't have invoices yet
      const createdInvoiceIds: string[] = [];
      const { generateServiceDistributerCommissionInvoice, getMonthName } =
        await import("./invoiceService");

      const serviceDistributerData = {
        email: serviceDistributerEmail,
        uid: currentUser.uid,
      };

      for (const [monthKey, orders] of ordersByMonth.entries()) {
        // Skip if invoice already exists for this month
        if (existingMonthKeys.has(monthKey)) {
          console.log(
            `Commission invoice already exists for month ${monthKey}, skipping...`
          );
          continue;
        }

        // Parse month key to create Date object
        const [year, month] = monthKey.split("-");
        const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);

        try {
          const invoice = await generateServiceDistributerCommissionInvoice(
            serviceDistributerEmail,
            monthDate,
            orders,
            serviceDistributerData
          );
          createdInvoiceIds.push(invoice.id);
          console.log(
            `✅ Created commission invoice for ${getMonthName(monthDate)}`
          );
        } catch (error: any) {
          // If error is "No commission items to invoice", skip silently
          if (error.message && error.message.includes("No commission items")) {
            console.log(`⚠️ No commission items for ${monthKey}, skipping...`);
            continue;
          }
          console.error(
            `Error creating commission invoice for ${monthKey}:`,
            error
          );
        }
      }

      return createdInvoiceIds;
    } catch (error) {
      console.error(
        "Error generating all service distributer commission invoices:",
        error
      );
      throw error;
    }
  };

/**
 * Process monthly sales invoice for current service distributer
 * @param targetMonth - Target month date (defaults to previous month)
 * @returns Promise with created invoice ID or null if already exists
 */
export const processServiceDistributerMonthlyInvoice = async (
  targetMonth?: Date
): Promise<string | null> => {
  try {
    // Wait for auth state
    const currentUser = await waitForAuthState();
    if (!currentUser || !currentUser.email) {
      throw new Error("No authenticated user found");
    }

    const serviceDistributerEmail = currentUser.email;

    // Default to previous month if not specified
    const month =
      targetMonth ||
      (() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() - 1, 1);
      })();

    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    // Import getMonthName from invoiceService
    const { getMonthName } = await import("./invoiceService");
    const monthName = getMonthName(month);

    // Fetch all orders from stationscompany-orders
    const ordersRef = collection(db, "stationscompany-orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot = await getDocs(q);

    const allOrders: any[] = [];
    querySnapshot.forEach((doc) => {
      allOrders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Filter orders by current user's stations and month
    const filteredOrders = allOrders.filter((order) => {
      // Check if order belongs to current user's stations
      const carStationCreatedUserId = order.carStation?.createdUserId;
      const belongsToUser =
        carStationCreatedUserId &&
        carStationCreatedUserId.toLowerCase() ===
          serviceDistributerEmail.toLowerCase();

      if (!belongsToUser) return false;

      // Check if order is in the target month
      const orderDate = order.orderDate?.toDate
        ? order.orderDate.toDate()
        : order.createdDate?.toDate
        ? order.createdDate.toDate()
        : new Date(order.orderDate || order.createdDate || 0);

      return orderDate >= monthStart && orderDate <= monthEnd;
    });

    if (filteredOrders.length === 0) {
      console.log(
        `No orders found for service distributer ${serviceDistributerEmail} in ${monthName}`
      );
      return null;
    }

    // Fetch service distributer data (you may need to create a collection for this)
    // For now, use basic data from auth
    const serviceDistributerData = {
      email: serviceDistributerEmail,
      uid: currentUser.uid,
      // Add more fields if you have a service distributers collection
    };

    // Generate invoice
    const { generateServiceDistributerMonthlyInvoice } = await import(
      "./invoiceService"
    );
    const invoice = await generateServiceDistributerMonthlyInvoice(
      serviceDistributerEmail,
      month,
      filteredOrders,
      serviceDistributerData
    );

    return invoice.id;
  } catch (error) {
    console.error(
      "Error processing service distributer monthly invoice:",
      error
    );
    throw error;
  }
};

/**
 * Fetch worker transactions from stationscompany-orders collection
 * Filters by fuelStationWorker.email matching the provided worker email
 * @param workerEmail - The email of the worker
 * @returns Promise with array of worker transaction data
 */
export const fetchWorkerTransactions = async (
  workerEmail: string
): Promise<any[]> => {
  try {
    console.log("👷 Fetching worker transactions for email:", workerEmail);

    if (!workerEmail) {
      console.error("❌ No worker email provided");
      return [];
    }

    // Fetch all orders from stationscompany-orders collection
    const ordersRef = collection(db, "stationscompany-orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot = await getDocs(q);

    const allOrders: any[] = [];

    querySnapshot.forEach((doc) => {
      allOrders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log("📋 Total orders found:", allOrders.length);

    // Filter orders by worker email
    const filteredOrders = allOrders.filter((order) => {
      const workerEmailInOrder =
        order.fuelStationWorker?.email || order.fuelStationsWorker?.email;

      const match =
        workerEmailInOrder &&
        workerEmailInOrder.toLowerCase() === workerEmail.toLowerCase();

      return match;
    });

    console.log("✅ Filtered orders for worker:", filteredOrders.length);

    // Transform orders to match the WorkerRecord interface
    const transformedOrders = filteredOrders.map((order) => {
      // Format date
      const formatDate = (date: any): string => {
        if (!date) return "غير محدد";
        try {
          const dateObj = date.toDate ? date.toDate() : new Date(date);
          const day = String(dateObj.getDate()).padStart(2, "0");
          const year = dateObj.getFullYear();
          const hoursNum = dateObj.getHours();
          const minutes = String(dateObj.getMinutes()).padStart(2, "0");
          const ampm = hoursNum >= 12 ? "م" : "ص";
          const displayHours = hoursNum % 12 || 12;

          const monthNames = [
            "يناير",
            "فبراير",
            "مارس",
            "أبريل",
            "مايو",
            "يونيو",
            "يوليو",
            "أغسطس",
            "سبتمبر",
            "أكتوبر",
            "نوفمبر",
            "ديسمبر",
          ];

          return `${day} ${
            monthNames[dateObj.getMonth()]
          } ${year} - ${displayHours}:${minutes} ${ampm}`;
        } catch (error) {
          return "غير محدد";
        }
      };

      // Calculate total price (totalLitre * price per liter)
      const totalLitre = order.totalLitre || 0;
      const pricePerLitre = order.selectedOption?.price || 0;
      const totalPrice = (totalLitre * pricePerLitre).toFixed(2);

      return {
        id: order.id,
        transactionNumber: order.refId || order.refDocId || order.id,
        stationName: order.carStation?.name || "غير محدد",
        clientName: order.client?.name || "غير محدد",
        fuelType:
          order.selectedOption?.title?.ar ||
          order.selectedOption?.title?.en ||
          "غير محدد",
        totalLiters: totalLitre.toString(),
        totalPrice: totalPrice,
        creationDate: formatDate(order.orderDate),
      };
    });

    console.log(
      "✅ Worker transactions transformed:",
      transformedOrders.length
    );

    return transformedOrders;
  } catch (error) {
    console.error("❌ Error fetching worker transactions:", error);
    throw error;
  }
};

/**
 * Fetch top clients by consumption from stationscompany-orders collection
 * Groups orders by client email and calculates total consumption
 * Returns top 5 clients by total consumption
 * @returns Promise with array of top client data
 */
export const fetchTopClientsByConsumption = async (): Promise<any[]> => {
  try {
    console.log("📊 Fetching top clients by consumption...");

    // Wait for auth state to be ready
    console.log("⏳ Waiting for auth state...");
    const currentUser = await waitForAuthState();
    console.log("✅ Auth state ready, current user:", currentUser.email);

    if (!currentUser || !currentUser.email) {
      throw new Error("No authenticated user found");
    }

    const currentUserEmail = currentUser.email;

    // Fetch all orders from stationscompany-orders collection
    const ordersRef = collection(db, "stationscompany-orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot = await getDocs(q);

    const allOrders: any[] = [];

    querySnapshot.forEach((doc) => {
      allOrders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log("📋 Total orders found:", allOrders.length);

    // Filter orders by current user (service distributer)
    // Check if carStation.createdUserId matches current user's email
    const filteredOrders = allOrders.filter((order) => {
      const carStationCreatedUserId = order.carStation?.createdUserId;

      const match =
        carStationCreatedUserId &&
        carStationCreatedUserId.toLowerCase() ===
          currentUserEmail.toLowerCase();

      return match;
    });

    console.log("✅ Filtered orders for current user:", filteredOrders.length);

    // Group orders by client email and sum up consumption
    const clientConsumptionMap = new Map<
      string,
      {
        email: string;
        name: string;
        phone: string;
        totalCost: number;
        totalFuel: number;
        orders: any[];
      }
    >();

    filteredOrders.forEach((order) => {
      const clientEmail = order.client?.email || "";
      const clientName = order.client?.name || "غير محدد";
      const clientPhone = order.client?.phoneNumber || "";
      const totalPrice = order.totalPrice || 0;
      const totalLitre = order.totalLitre || 0;

      if (clientEmail) {
        if (clientConsumptionMap.has(clientEmail)) {
          const existing = clientConsumptionMap.get(clientEmail)!;
          existing.totalCost += totalPrice;
          existing.totalFuel += totalLitre;
          existing.orders.push(order);
        } else {
          clientConsumptionMap.set(clientEmail, {
            email: clientEmail,
            name: clientName,
            phone: clientPhone,
            totalCost: totalPrice,
            totalFuel: totalLitre,
            orders: [order],
          });
        }
      }
    });

    // Convert map to array and sort by total cost
    const topClients = Array.from(clientConsumptionMap.values())
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5) // Get top 5
      .map((client, index) => ({
        name: client.name,
        phone: client.email || "-", // Use email as subtitle
        cost: Math.round(client.totalCost), // Round to nearest integer
        fuel: Math.round(client.totalFuel).toString(), // Convert to string for display
        type: getMostUsedFuelType(client.orders),
        rank: index + 1,
      }));

    console.log("✅ Top clients aggregated:", topClients.length);

    return topClients;
  } catch (error) {
    console.error("❌ Error fetching top clients by consumption:", error);
    throw error;
  }
};

/**
 * Helper function to determine the most used fuel type from client orders
 */
const getMostUsedFuelType = (orders: any[]): string => {
  const fuelTypeCount = new Map<string, number>();

  orders.forEach((order) => {
    const fuelType =
      order.selectedOption?.title?.ar || order.selectedOption?.title?.en || "";
    if (fuelType) {
      fuelTypeCount.set(fuelType, (fuelTypeCount.get(fuelType) || 0) + 1);
    }
  });

  let maxCount = 0;
  let mostUsedFuel = "غير محدد";

  fuelTypeCount.forEach((count, fuelType) => {
    if (count > maxCount) {
      maxCount = count;
      mostUsedFuel = fuelType;
    }
  });

  return mostUsedFuel;
};

/**
 * Fetch top stations by consumption from stationscompany-orders collection
 * Groups orders by station (carStation) and calculates total consumption
 * Returns top 5 stations by total consumption
 * @returns Promise with array of top station data
 */
export const fetchTopStationsByConsumption = async (): Promise<any[]> => {
  try {
    console.log("🛣️ Fetching top stations by consumption...");

    // Wait for auth state to be ready
    console.log("⏳ Waiting for auth state...");
    const currentUser = await waitForAuthState();
    console.log("✅ Auth state ready, current user:", currentUser.email);

    if (!currentUser || !currentUser.email) {
      throw new Error("No authenticated user found");
    }

    const currentUserEmail = currentUser.email;

    // Fetch all orders from stationscompany-orders collection
    const ordersRef = collection(db, "stationscompany-orders");
    const q = query(ordersRef, orderBy("orderDate", "desc"));
    const querySnapshot = await getDocs(q);

    const allOrders: any[] = [];

    querySnapshot.forEach((doc) => {
      allOrders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log("📋 Total orders found:", allOrders.length);

    // Filter orders by current user (service distributer)
    // Check if carStation.createdUserId matches current user's email
    const filteredOrders = allOrders.filter((order) => {
      const carStationCreatedUserId = order.carStation?.createdUserId;

      const match =
        carStationCreatedUserId &&
        carStationCreatedUserId.toLowerCase() ===
          currentUserEmail.toLowerCase();

      return match;
    });

    console.log("✅ Filtered orders for current user:", filteredOrders.length);

    // Group orders by station email/name and sum up consumption
    const stationConsumptionMap = new Map<
      string,
      {
        name: string;
        email: string;
        address: string;
        totalPrice: number;
        totalFuel: number;
        orders: any[];
      }
    >();

    filteredOrders.forEach((order) => {
      const stationEmail = order.carStation?.email || "";
      const stationName = order.carStation?.name || "غير محدد";
      const stationAddress = order.carStation?.address || "";
      const totalPrice = order.totalPrice || 0;
      const totalLitre = order.totalLitre || 0;

      if (stationEmail) {
        if (stationConsumptionMap.has(stationEmail)) {
          const existing = stationConsumptionMap.get(stationEmail)!;
          existing.totalPrice += totalPrice;
          existing.totalFuel += totalLitre;
          existing.orders.push(order);
        } else {
          stationConsumptionMap.set(stationEmail, {
            name: stationName,
            email: stationEmail,
            address: stationAddress,
            totalPrice: totalPrice,
            totalFuel: totalLitre,
            orders: [order],
          });
        }
      }
    });

    // Convert map to array and sort by total price
    const topStations = Array.from(stationConsumptionMap.values())
      .sort((a, b) => b.totalPrice - a.totalPrice)
      .slice(0, 5) // Get top 5
      .map((station, index) => ({
        name: station.name,
        address: station.email || "-", // Use email as subtitle
        price: Math.round(station.totalPrice), // Round to nearest integer
        fuel: Math.round(station.totalFuel).toString(), // Convert to string for display
        type: getMostUsedFuelType(station.orders),
        rank: index + 1,
      }));

    console.log("✅ Top stations aggregated:", topStations.length);

    return topStations;
  } catch (error) {
    console.error("❌ Error fetching top stations by consumption:", error);
    throw error;
  }
};

/**
 * Interface for communication policies data
 */
export interface CommunicationPoliciesData {
  platformPolicy: string;
  whatsappLink: string;
  instagramLink: string;
  tiktokLink: string;
  facebookLink: string;
  xPlatformLink: string;
  emailLink: string;
}

/**
 * Default dummy data for communication policies
 */
const defaultCommunicationPoliciesData: CommunicationPoliciesData = {
  platformPolicy: `نحن نجمع المعلومات لتقديم خدمات ذات مستوى أفضل المستخدمينا جميعًا. نحن نستخدم المعلومات التي نجمعها من جميع خدماتنا (مثل تطبيقاتك ومتصفحاتك وأجهزتك) لتقديم خدماتنا وصيانتها وتحسينها وتطوير خدمات جديدة وقياس الأداء والتواصل معك.

المعلومات التي تجمعها Google
نستخدم المعلومات التي نجمعها من جميع خدماتنا لتقديم خدماتنا وصيانتها وتحسينها وتطوير خدمات جديدة وقياس الأداء والتواصل معك.

عناصر تنشئها أو تقدمها لنا
عندما تنشئ حساب Google أو تضيف معلومات إلى حسابك، فإنك تزودنا بمعلومات شخصية تتضمن اسمك وكلمة المرور.

المعلومات التي تجمعها أثناء استخدامك لخدماتنا
نحن نجمع المعلومات حول الطريقة التي تستخدم بها خدماتنا، مثل نوع المحتوى الذي تبحث عنه أو تعرضه أو تشتريه، والمواقع التي تزورها، والتفاعلات مع المحتوى والخدمات.

تطبيقاتك ومتصفحاتك وأجهزتك
نحن نجمع معلومات محددة حول تطبيقاتك ومتصفحاتك وأجهزتك التي تستخدمها للوصول إلى خدمات Google، والتي تساعدنا في توفير ميزات مثل تحديثات المنتج تلقائيًا وتقليل معدل الأعطال.`,
  whatsappLink: "https://wa.me/966500000000",
  instagramLink: "https://www.instagram.com/petrolife",
  tiktokLink: "https://www.tiktok.com/@petrolife",
  facebookLink: "https://www.facebook.com/petrolife",
  xPlatformLink: "https://www.x.com/petrolife",
  emailLink: "info@petrolife.com",
};

/**
 * Fetch communication policies data from Firestore
 * Returns default dummy data if document doesn't exist
 * @returns Promise with communication policies data
 */
export const fetchCommunicationPolicies =
  async (): Promise<CommunicationPoliciesData> => {
    try {
      console.log("📋 Fetching communication policies from Firestore...");

      const docRef = doc(db, "communication-policies", "settings");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("✅ Communication policies data fetched successfully");
        return {
          platformPolicy:
            data.platformPolicy ||
            defaultCommunicationPoliciesData.platformPolicy,
          whatsappLink:
            data.whatsappLink || defaultCommunicationPoliciesData.whatsappLink,
          instagramLink:
            data.instagramLink ||
            defaultCommunicationPoliciesData.instagramLink,
          tiktokLink:
            data.tiktokLink || defaultCommunicationPoliciesData.tiktokLink,
          facebookLink:
            data.facebookLink || defaultCommunicationPoliciesData.facebookLink,
          xPlatformLink:
            data.xPlatformLink ||
            defaultCommunicationPoliciesData.xPlatformLink,
          emailLink:
            data.emailLink || defaultCommunicationPoliciesData.emailLink,
        };
      } else {
        console.log(
          "⚠️ Communication policies document not found, using default data"
        );
        // Create document with default data
        await setDoc(docRef, defaultCommunicationPoliciesData);
        return defaultCommunicationPoliciesData;
      }
    } catch (error) {
      console.error("❌ Error fetching communication policies:", error);
      // Return default data on error
      return defaultCommunicationPoliciesData;
    }
  };

/**
 * Save communication policies data to Firestore
 * @param data - Communication policies data to save
 * @returns Promise<boolean> - Success status
 */
export const saveCommunicationPolicies = async (
  data: CommunicationPoliciesData
): Promise<boolean> => {
  try {
    console.log("💾 Saving communication policies to Firestore...");

    const docRef = doc(db, "communication-policies", "settings");
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Communication policies saved successfully");
    return true;
  } catch (error) {
    console.error("❌ Error saving communication policies:", error);
    throw error;
  }
};

/**
 * Commission Settings Interface
 */
export interface CommissionSettings {
  id?: string;
  petrol: number; // Commission rate for بنزين (SAR per liter)
  diesel: number; // Commission rate for ديزيل (SAR per liter)
  lastUpdated?: Timestamp;
  updatedBy?: string; // Admin email
}

/**
 * Fetch commission settings from Firestore
 * @returns Promise with commission settings data
 */
export const fetchCommissionSettings =
  async (): Promise<CommissionSettings> => {
    try {
      console.log("📊 Fetching commission settings from Firestore...");

      const docRef = doc(db, "commission-settings", "rates");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("✅ Commission settings found:", data);
        return {
          id: docSnap.id,
          petrol: data.petrol || 0,
          diesel: data.diesel || 0,
          lastUpdated: data.lastUpdated,
          updatedBy: data.updatedBy,
        };
      } else {
        // Return default values if document doesn't exist
        console.log("⚠️ Commission settings not found, returning defaults");
        return {
          petrol: 0,
          diesel: 0,
        };
      }
    } catch (error) {
      console.error("❌ Error fetching commission settings:", error);
      throw error;
    }
  };

/**
 * Update commission settings in Firestore
 * @param petrol - Commission rate for بنزين (SAR per liter)
 * @param diesel - Commission rate for ديزيل (SAR per liter)
 * @returns Promise<boolean> - Success status
 */
export const updateCommissionSettings = async (
  petrol: number,
  diesel: number
): Promise<boolean> => {
  try {
    console.log("💾 Updating commission settings in Firestore...");
    console.log(`Petrol: ${petrol} SAR/liter, Diesel: ${diesel} SAR/liter`);

    // Wait for auth state to get current user
    const currentUser = await waitForAuthState();
    if (!currentUser || !currentUser.email) {
      throw new Error("No authenticated user found");
    }

    const docRef = doc(db, "commission-settings", "rates");
    await setDoc(
      docRef,
      {
        petrol: Number(petrol),
        diesel: Number(diesel),
        lastUpdated: serverTimestamp(),
        updatedBy: currentUser.email,
      },
      { merge: true }
    );

    console.log("✅ Commission settings updated successfully");
    return true;
  } catch (error) {
    console.error("❌ Error updating commission settings:", error);
    throw error;
  }
};

// FAQ Types
export interface FAQQuestion {
  id?: string;
  question: string;
  answer: string;
  userType:
    | "company"
    | "user"
    | "distributer"
    | "driver"
    | "all"
    | "admin"
    | "superAdmin";
  createdBy: string;
  createdAt?: any;
}

/**
 * Fetch user data from users collection by email
 * @param email - User email address
 * @returns Promise with user data including user_type, or null if not found
 */
export const fetchUserByEmail = async (email: string): Promise<any | null> => {
  try {
    if (!email) return null;

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      return {
        id: querySnapshot.docs[0].id,
        ...userData,
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Error fetching user by email:", error);
    return null;
  }
};

/**
 * Map user_type from users collection to FAQ userType
 * @param userType - user_type from users collection
 * @returns Mapped FAQ userType
 */
const mapUserTypeToFAQType = (
  userType: string | undefined | null
): FAQQuestion["userType"] => {
  if (!userType) return "all";

  const typeMap: Record<string, FAQQuestion["userType"]> = {
    company: "company",
    "service-provider": "distributer",
    "service-distributer": "distributer",
    station: "distributer",
    driver: "driver",
    user: "user",
    individual: "user",
    admin: "admin",
    superadmin: "superAdmin",
  };

  return typeMap[userType.toLowerCase()] || "all";
};

/**
 * Fetch all FAQ questions from Firestore
 * @returns Promise with array of FAQ questions
 */
export const fetchFAQQuestions = async (): Promise<FAQQuestion[]> => {
  try {
    console.log("📋 Fetching FAQ questions from Firestore...");

    const faqRef = collection(db, "faq");
    const q = query(faqRef, orderBy("createdAt", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    const faqData: FAQQuestion[] = [];

    querySnapshot.forEach((doc) => {
      faqData.push({
        id: doc.id,
        ...doc.data(),
      } as FAQQuestion);
    });

    console.log(
      `✅ FAQ questions fetched successfully: ${faqData.length} questions`
    );
    return faqData;
  } catch (error) {
    console.error("❌ Error fetching FAQ questions:", error);
    throw error;
  }
};

/**
 * Get FAQ userType from user data
 * Checks isAdmin/isSuperAdmin first, then falls back to user_type
 * @param userData - User data from users collection
 * @returns FAQ userType
 */
const getUserTypeFromUserData = (userData: any): FAQQuestion["userType"] => {
  if (!userData) {
    return "all";
  }

  // First check for admin flags
  if (userData.isSuperAdmin === true) {
    return "superAdmin";
  }

  if (userData.isAdmin === true) {
    return "admin";
  }

  // If not admin, check user_type field
  const userTypeFromDB = userData.user_type;
  if (userTypeFromDB) {
    return mapUserTypeToFAQType(userTypeFromDB);
  }

  // Default fallback
  return "all";
};

/**
 * Add a new FAQ question to Firestore
 * @param data - FAQ question data (userType will be overridden by logged-in user's type)
 * @returns Promise with the created FAQ question including document ID
 */
export const addFAQQuestion = async (
  data: Omit<FAQQuestion, "id" | "createdAt" | "userType" | "createdBy"> & {
    userType?: string;
  }
): Promise<FAQQuestion> => {
  try {
    console.log("💾 Adding new FAQ question to Firestore...");

    const currentUser = auth.currentUser;
    const userEmail = currentUser?.email;

    if (!userEmail) {
      throw new Error("No logged-in user found");
    }

    // Fetch user data from users collection
    const userData = await fetchUserByEmail(userEmail);

    if (!userData) {
      console.warn(
        "⚠️ User not found in users collection, using default values"
      );
    }

    // Get userType from user data (checks isAdmin/isSuperAdmin first, then user_type)
    const finalUserType = getUserTypeFromUserData(userData);

    const createdBy = userEmail;

    console.log("📋 User data:", {
      email: userEmail,
      isAdmin: userData?.isAdmin,
      isSuperAdmin: userData?.isSuperAdmin,
      user_type: userData?.user_type,
      finalUserType: finalUserType,
    });

    const faqRef = collection(db, "faq");
    const docRef = await addDoc(faqRef, {
      question: data.question,
      answer: data.answer,
      userType: finalUserType,
      createdBy: createdBy,
      createdAt: serverTimestamp(),
    });

    const newQuestion: FAQQuestion = {
      id: docRef.id,
      question: data.question,
      answer: data.answer,
      userType: finalUserType,
      createdBy: createdBy,
    };

    console.log("✅ FAQ question added successfully:", docRef.id);
    console.log(`   User: ${createdBy}, FAQ Type: ${finalUserType}`);
    return newQuestion;
  } catch (error) {
    console.error("❌ Error adding FAQ question:", error);
    throw error;
  }
};

/**
 * Update an existing FAQ question in Firestore
 * @param id - Document ID of the FAQ question
 * @param data - Updated FAQ question data
 * @returns Promise<boolean> - Success status
 */
export const updateFAQQuestion = async (
  id: string,
  data: Partial<Omit<FAQQuestion, "id" | "createdAt" | "createdBy">>
): Promise<boolean> => {
  try {
    console.log("💾 Updating FAQ question in Firestore...", id);

    const docRef = doc(db, "faq", id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ FAQ question updated successfully:", id);
    return true;
  } catch (error) {
    console.error("❌ Error updating FAQ question:", error);
    throw error;
  }
};

/**
 * Delete an FAQ question from Firestore
 * @param id - Document ID of the FAQ question
 * @returns Promise<boolean> - Success status
 */
export const deleteFAQQuestion = async (id: string): Promise<boolean> => {
  try {
    console.log("🗑️ Deleting FAQ question from Firestore...", id);

    const docRef = doc(db, "faq", id);
    await deleteDoc(docRef);

    console.log("✅ FAQ question deleted successfully:", id);
    return true;
  } catch (error) {
    console.error("❌ Error deleting FAQ question:", error);
    throw error;
  }
};

/**
 * Seed dummy FAQ questions to Firestore
 * This function can be called once to populate initial data
 */
export const seedFAQQuestions = async (): Promise<void> => {
  try {
    console.log("🌱 Seeding FAQ questions to Firestore...");

    const currentUser = auth.currentUser;
    const userEmail = currentUser?.email;

    if (!userEmail) {
      throw new Error("No logged-in user found for seeding");
    }

    // Fetch user data to get user_type
    const userData = await fetchUserByEmail(userEmail);
    const userTypeFromDB = userData?.user_type || "all";
    const createdBy = userEmail;

    const dummyQuestions: Omit<FAQQuestion, "id" | "createdAt">[] = [
      {
        question: "كيف يمكنني التسجيل في المنصة؟",
        answer:
          "يمكنك التسجيل في المنصة من خلال الضغط على زر التسجيل وإدخال بياناتك الشخصية مثل الاسم والبريد الإلكتروني ورقم الهاتف. بعد إتمام التسجيل، ستحصل على رسالة تأكيد عبر البريد الإلكتروني.",
        userType: "all",
        createdBy: createdBy,
      },
      {
        question: "ما هي طرق الدفع المتاحة؟",
        answer:
          "نوفر عدة طرق للدفع تشمل الدفع النقدي عند الاستلام، والدفع عبر البطاقات الائتمانية، والدفع الإلكتروني عبر المحفظة الرقمية. يمكنك اختيار الطريقة التي تناسبك أثناء إتمام الطلب.",
        userType: "all",
        createdBy: createdBy,
      },
      {
        question: "كيف يمكن للشركات التسجيل في النظام؟",
        answer:
          "يمكن للشركات التسجيل من خلال قسم الشركات في الموقع. ستحتاج إلى تقديم الوثائق القانونية للشركة مثل السجل التجاري ورخصة العمل. بعد مراجعة الطلب، سيتم تفعيل حساب الشركة.",
        userType: "company",
        createdBy: createdBy,
      },
      {
        question: "ما هي متطلبات التسجيل للشركات؟",
        answer:
          "للشركات، نحتاج إلى السجل التجاري، رخصة العمل، هوية المدير المسؤول، وبطاقة ضريبية. يجب أن تكون جميع الوثائق سارية المفعول.",
        userType: "company",
        createdBy: createdBy,
      },
      {
        question: "كيف يمكن للأفراد استخدام الخدمة؟",
        answer:
          "يمكن للأفراد التسجيل بسهولة من خلال التطبيق أو الموقع. بعد التسجيل، يمكنك طلب الخدمات المتاحة مثل توصيل الوقود أو الصيانة. يمكنك تتبع طلباتك من خلال لوحة التحكم.",
        userType: "user",
        createdBy: createdBy,
      },
      {
        question: "ما هي الخدمات المتاحة للأفراد؟",
        answer:
          "نوفر للأفراد خدمات متعددة تشمل توصيل الوقود، صيانة المركبات، تغيير الزيوت، وخدمات الطوارئ على الطريق. يمكنك طلب أي خدمة من خلال التطبيق.",
        userType: "user",
        createdBy: createdBy,
      },
      {
        question: "كيف يمكن لمزودي الخدمة التسجيل؟",
        answer:
          "يمكن لمزودي الخدمة التسجيل من خلال قسم مزودي الخدمة. يجب تقديم الوثائق المطلوبة مثل رخصة مزود الخدمة، شهادات التأهيل، وبطاقة الهوية. بعد الموافقة، سيتم تفعيل الحساب.",
        userType: "distributer",
        createdBy: createdBy,
      },
      {
        question: "ما هي متطلبات مزودي الخدمة؟",
        answer:
          "يجب أن يكون مزود الخدمة حاصلاً على رخصة مزاولة المهنة، شهادات التأهيل المطلوبة، ووثائق التأمين. كما يجب أن يكون لديه فريق عمل مدرب ومعدات مناسبة.",
        userType: "distributer",
        createdBy: createdBy,
      },
      {
        question: "كيف يمكن للسائقين استخدام التطبيق؟",
        answer:
          "يمكن للسائقين تحميل تطبيق السائق من متجر التطبيقات. بعد التسجيل وإدخال بيانات المركبة ورخصة القيادة، سيتم تفعيل الحساب. يمكن للسائقين بعد ذلك استقبال الطلبات وتنفيذها.",
        userType: "driver",
        createdBy: createdBy,
      },
      {
        question: "ما هي متطلبات التسجيل للسائقين؟",
        answer:
          "يجب أن يكون السائق حاصلاً على رخصة قيادة سارية المفعول، وثيقة تأمين المركبة، وبطاقة الهوية. كما يجب أن تكون المركبة في حالة جيدة ومطابقة للمواصفات المطلوبة.",
        userType: "driver",
        createdBy: createdBy,
      },
    ];

    const faqRef = collection(db, "faq");
    const promises = dummyQuestions.map((question) =>
      addDoc(faqRef, {
        ...question,
        createdBy: createdBy, // Override with actual user email
        createdAt: serverTimestamp(),
      })
    );

    await Promise.all(promises);
    console.log(
      `✅ Successfully seeded ${dummyQuestions.length} FAQ questions`
    );
    console.log(
      `   Seeded by: ${createdBy} (user_type from users collection: ${userTypeFromDB})`
    );
  } catch (error) {
    console.error("❌ Error seeding FAQ questions:", error);
    throw error;
  }
};

/**
 * Fetch all companies from Firestore companies collection
 * @returns Promise with array of all company documents
 */
export const fetchAllCompanies = async (): Promise<any[]> => {
  try {
    const companiesRef = collection(db, "companies");
    const q = query(companiesRef, orderBy("createdDate", "desc"));
    const querySnapshot = await getDocs(q);

    const companiesData: any[] = [];

    querySnapshot.forEach((doc) => {
      companiesData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return companiesData;
  } catch (error) {
    console.error("❌ Error fetching all companies:", error);
    throw error;
  }
};

/**
 * Fetch orders within a date range
 * @param startDate - Start date for the range
 * @param endDate - End date for the range
 * @returns Promise with array of orders within the date range
 */
export const fetchOrdersByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<any[]> => {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("orderDate", ">=", Timestamp.fromDate(startDate)),
      where("orderDate", "<=", Timestamp.fromDate(endDate)),
      orderBy("orderDate", "desc")
    );
    const querySnapshot = await getDocs(q);

    const ordersData: any[] = [];

    querySnapshot.forEach((doc) => {
      ordersData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return ordersData;
  } catch (error) {
    console.error("❌ Error fetching orders by date range:", error);
    throw error;
  }
};

// ============================================================================
// WALLET CHARGE REQUEST MANAGEMENT
// ============================================================================

/**
 * Helper: Generate unique 8-digit refid for wallet requests
 * @returns Promise with unique 8-digit refid string
 */
const generateUniqueRefid = async (): Promise<string> => {
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    const refid = Math.floor(10000000 + Math.random() * 90000000).toString();

    // Check uniqueness in companies-wallets-requests collection
    const requestsRef = collection(db, "companies-wallets-requests");
    const q = query(requestsRef, where("refid", "==", refid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`✅ Generated unique refid: ${refid}`);
      return refid;
    }
    console.log(`⚠️ Refid ${refid} already exists, retrying...`);
  }
  throw new Error("Failed to generate unique refid after 20 attempts");
};

/**
 * Helper: Upload transfer image to Firebase Storage
 * @param file - Image file to upload
 * @param userId - User ID for organizing storage
 * @returns Promise with download URL
 */
const uploadTransferImage = async (
  file: File,
  userId: string
): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileName = `wallet-transfers/${userId}/${timestamp}-${file.name}`;
    const storageRef = ref(storage, fileName);

    console.log(`📤 Uploading transfer image: ${fileName}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    console.log(`✅ Image uploaded successfully: ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error("❌ Error uploading transfer image:", error);
    throw new Error("Failed to upload transfer image");
  }
};

/**
 * Submit a manual wallet charge request
 * SECURITY: Does NOT modify balance - only creates request with "pending" status
 * @param requestData - Request form data from user
 * @returns Promise with created request ID
 */
export const submitWalletChargeRequest = async (requestData: {
  transferAmount: number;
  bankName: string;
  accountNumber: string;
  transferImage?: File;
}): Promise<string> => {
  try {
    console.log("\n💰 ========================================");
    console.log("📝 SUBMITTING WALLET CHARGE REQUEST");
    console.log("========================================");

    // Validate user authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    console.log("👤 User:", currentUser.email);

    // Validate amount
    if (requestData.transferAmount <= 0) {
      throw new Error("Transfer amount must be greater than 0");
    }
    console.log("💵 Amount:", requestData.transferAmount);

    // Get current company data
    const company = await fetchCurrentCompany();
    if (!company) {
      throw new Error("Company not found");
    }
    console.log("🏢 Company:", company.name);
    console.log("💰 Current Balance:", company.balance || 0);

    // Generate unique 8-digit refid
    const refid = await generateUniqueRefid();

    // Upload image if provided
    let transferImageUrl: string | undefined;
    if (requestData.transferImage) {
      transferImageUrl = await uploadTransferImage(
        requestData.transferImage,
        currentUser.uid
      );
    }

    // Create request document
    const requestsRef = collection(db, "companies-wallets-requests");
    const newRequest = {
      refid,
      companyId: company.id, // Store company document ID for easy lookup
      requestedUser: {
        uid: currentUser.uid,
        email: currentUser.email!,
        name: company.name,
        balance: company.balance || 0, // Current balance at time of request
      },
      value: requestData.transferAmount,
      type: "manual",
      transferDetails: {
        bankName: requestData.bankName,
        accountNumber: requestData.accountNumber,
        transferImage: transferImageUrl,
      },
      status: "pending",
      createdDate: serverTimestamp(),
      requestDate: serverTimestamp(),
    };

    const docRef = await addDoc(requestsRef, newRequest);

    console.log("✅ Wallet charge request created successfully");
    console.log("📋 Request ID:", docRef.id);
    console.log("🔢 Refid:", refid);
    console.log("========================================\n");

    return docRef.id;
  } catch (error: any) {
    console.error("❌ Error submitting wallet charge request:", error);
    throw error;
  }
};

/**
 * Approve wallet charge request (ATOMIC TRANSACTION)
 * SECURITY: Uses Firestore transaction for atomicity
 * Updates request status to "approved" AND increments company balance
 * @param requestId - Request document ID
 * @param adminUser - Admin processing the request
 * @returns Promise with success boolean
 */
export const approveWalletChargeRequest = async (
  requestId: string,
  adminUser: { uid: string; email: string; name: string }
): Promise<boolean> => {
  try {
    console.log("\n✅ ========================================");
    console.log("📝 APPROVING WALLET CHARGE REQUEST");
    console.log("========================================");
    console.log("📋 Request ID:", requestId);
    console.log("👤 Admin:", adminUser.email);

    // STEP 1: Fetch request and find company BEFORE transaction
    const requestRef = doc(db, "companies-wallets-requests", requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      throw new Error("Request not found");
    }

    const requestData = requestSnap.data();
    console.log("💵 Request Amount:", requestData.value);

    // Find company document ID
    let companyDocId: string;

    if (requestData.companyId) {
      // New requests: Use stored company ID
      console.log("🏢 Using stored Company ID:", requestData.companyId);
      companyDocId = requestData.companyId;
    } else {
      // Old requests: Query by UID or email (fallback for legacy data)
      console.log("🔍 Searching for company by UID/email...");
      const companiesRef = collection(db, "companies");

      // Try by UID
      let qByUid = query(
        companiesRef,
        where("uid", "==", requestData.requestedUser.uid)
      );
      let companySnapshot = await getDocs(qByUid);

      // If not found, try by email
      if (companySnapshot.empty && requestData.requestedUser.email) {
        console.log("🔍 Not found by UID, trying email...");
        const qByEmail = query(
          companiesRef,
          where("email", "==", requestData.requestedUser.email)
        );
        companySnapshot = await getDocs(qByEmail);
      }

      // If still not found, try by createdUserId
      if (companySnapshot.empty && requestData.requestedUser.email) {
        console.log("🔍 Not found by email, trying createdUserId...");
        const qByCreatedUserId = query(
          companiesRef,
          where("createdUserId", "==", requestData.requestedUser.email)
        );
        companySnapshot = await getDocs(qByCreatedUserId);
      }

      if (companySnapshot.empty) {
        throw new Error("Company not found");
      }

      companyDocId = companySnapshot.docs[0].id;
      console.log("✓ Found Company ID:", companyDocId);
    }

    // STEP 2: Run atomic transaction
    const result = await runTransaction(db, async (transaction) => {
      // Re-read request inside transaction to ensure consistency
      const requestSnap = await transaction.get(requestRef);

      if (!requestSnap.exists()) {
        throw new Error("Request not found");
      }

      const requestData = requestSnap.data();

      // Validate request status
      if (requestData.status !== "pending") {
        throw new Error(`Request already ${requestData.status}`);
      }
      console.log("✓ Request status is pending");

      // Get company document
      const companyDocRef = doc(db, "companies", companyDocId);
      const companySnap = await transaction.get(companyDocRef);

      if (!companySnap.exists()) {
        throw new Error("Company not found");
      }

      const companyData = companySnap.data();
      const currentBalance = companyData.balance || 0;
      const newBalance = currentBalance + requestData.value;

      console.log("💰 Current Balance:", currentBalance);
      console.log("➕ Adding:", requestData.value);
      console.log("💰 New Balance:", newBalance);

      // Update request status
      transaction.update(requestRef, {
        status: "approved",
        processedAt: serverTimestamp(),
        processedBy: adminUser,
      });

      // Update company balance
      transaction.update(companyDocRef, {
        balance: newBalance,
      });

      console.log("✅ Transaction completed successfully");
      return true;
    });

    console.log("========================================\n");
    return result;
  } catch (error: any) {
    console.error("❌ Error approving wallet request:", error);
    throw error;
  }
};

// ============================================================================
// COMPANY-TO-COMPANY TRANSFER MANAGEMENT
// ============================================================================

/**
 * Submit a company-to-company transfer request
 * Deducts money from sender's balance immediately and creates pending request
 * @param transferData - Transfer data including recipient phone, amount
 * @returns Promise with created transfer request ID
 */
export const submitCompanyTransferRequest = async (transferData: {
  recipientPhoneNumber: string;
  recipientName: string;
  amount: number;
}): Promise<string> => {
  try {
    console.log("\n💸 ========================================");
    console.log("📝 SUBMITTING COMPANY TRANSFER REQUEST");
    console.log("========================================");

    // Validate user authentication
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new Error("User not authenticated");
    }
    console.log("👤 User:", currentUser.email);

    // Validate amount
    if (transferData.amount <= 0) {
      throw new Error("Transfer amount must be greater than 0");
    }
    console.log("💵 Amount:", transferData.amount);

    // Find recipient company by phone number
    const recipientCompany = await findCompanyByPhoneNumber(
      transferData.recipientPhoneNumber
    );
    if (!recipientCompany) {
      throw new Error("الشركة المستقبلة غير موجودة. يرجى التحقق من رقم الجوال");
    }
    console.log("🏢 Recipient Company:", recipientCompany.name);

    // Get sender company data
    const senderCompany = await fetchCurrentCompany();
    if (!senderCompany) {
      throw new Error("Company not found");
    }
    console.log("🏢 Sender Company:", senderCompany.name);
    console.log("💰 Current Balance:", senderCompany.balance || 0);

    // Validate sufficient balance
    if ((senderCompany.balance || 0) < transferData.amount) {
      throw new Error(
        `رصيد غير كافٍ. الرصيد الحالي: ${senderCompany.balance || 0} ر.س`
      );
    }

    // Find sender company document ID
    const companiesRef = collection(db, "companies");
    let senderCompanyDocId: string;

    // Try to find by email (document ID is usually email)
    const senderCompanyDocRef = doc(db, "companies", senderCompany.email);
    const senderCompanyDoc = await getDoc(senderCompanyDocRef);

    if (senderCompanyDoc.exists()) {
      senderCompanyDocId = senderCompanyDoc.id;
    } else {
      // Try by UID
      const qByUid = query(companiesRef, where("uId", "==", currentUser.uid));
      const snapshot = await getDocs(qByUid);
      if (!snapshot.empty) {
        senderCompanyDocId = snapshot.docs[0].id;
      } else {
        // Try by email field
        const qByEmail = query(
          companiesRef,
          where("email", "==", currentUser.email)
        );
        const emailSnapshot = await getDocs(qByEmail);
        if (!emailSnapshot.empty) {
          senderCompanyDocId = emailSnapshot.docs[0].id;
        } else {
          throw new Error("Sender company document not found");
        }
      }
    }

    // Find recipient company document ID
    const recipientCompanyDocRef = doc(db, "companies", recipientCompany.id);
    const recipientCompanyDoc = await getDoc(recipientCompanyDocRef);
    if (!recipientCompanyDoc.exists()) {
      throw new Error("Recipient company document not found");
    }
    const recipientCompanyDocId = recipientCompanyDoc.id;

    // Use atomic transaction to deduct from sender, add to recipient, and create transfer record
    const result = await runTransaction(db, async (transaction) => {
      // Re-read sender company to get latest balance
      const senderDocRef = doc(db, "companies", senderCompanyDocId);
      const senderDoc = await transaction.get(senderDocRef);

      if (!senderDoc.exists()) {
        throw new Error("Sender company not found");
      }

      const senderData = senderDoc.data();
      const currentSenderBalance = senderData.balance || 0;

      // Validate balance again inside transaction
      if (currentSenderBalance < transferData.amount) {
        throw new Error(
          `رصيد غير كافٍ. الرصيد الحالي: ${currentSenderBalance} ر.س`
        );
      }

      // Re-read recipient company to get latest balance
      const recipientDocRef = doc(db, "companies", recipientCompanyDocId);
      const recipientDoc = await transaction.get(recipientDocRef);

      if (!recipientDoc.exists()) {
        throw new Error("Recipient company not found");
      }

      const recipientData = recipientDoc.data();
      const currentRecipientBalance = recipientData.balance || 0;

      const newSenderBalance = currentSenderBalance - transferData.amount;
      const newRecipientBalance = currentRecipientBalance + transferData.amount;

      console.log("💰 Sender Current Balance:", currentSenderBalance);
      console.log("➖ Deducting from sender:", transferData.amount);
      console.log("💰 Sender New Balance:", newSenderBalance);
      console.log("💰 Recipient Current Balance:", currentRecipientBalance);
      console.log("➕ Adding to recipient:", transferData.amount);
      console.log("💰 Recipient New Balance:", newRecipientBalance);

      // Deduct from sender balance
      transaction.update(senderDocRef, {
        balance: newSenderBalance,
      });

      // Add to recipient balance
      transaction.update(recipientDocRef, {
        balance: newRecipientBalance,
      });

      // Create transfer record with completed status
      const transfersRef = collection(db, "companies-transfers");
      const transferDocRef = doc(transfersRef);

      const transferRequest = {
        type: "company-to-company",
        fromCompany: {
          id: senderCompanyDocId,
          name: senderCompany.name || senderData.name || senderData.brandName,
          email: senderCompany.email || senderData.email,
          uid: senderCompany.uid || senderData.uId || currentUser.uid,
        },
        toCompany: {
          id: recipientCompanyDocId,
          name: recipientCompany.name,
          email: recipientCompany.email,
          phoneNumber: recipientCompany.phoneNumber,
        },
        amount: transferData.amount,
        status: "completed", // Changed from "pending" to "completed"
        requestDate: serverTimestamp(),
        completedAt: serverTimestamp(), // Add completion timestamp
        createdUserId: currentUser.email,
        companyId: senderCompanyDocId, // For easy lookup
        recipientCompanyId: recipientCompanyDocId,
      };

      transaction.set(transferDocRef, transferRequest);

      console.log("✅ Transfer completed with ID:", transferDocRef.id);
      return transferDocRef.id;
    });

    // Send notification to recipient (outside transaction)
    try {
      await sendTransferNotification(
        recipientCompanyDocId,
        senderCompany.name || "شركة",
        transferData.amount
      );
      console.log("✅ Notification sent to recipient");
    } catch (notifError) {
      console.error("⚠️ Failed to send notification:", notifError);
      // Don't throw - transfer is already completed
    }

    console.log("========================================\n");
    return result;
  } catch (error: any) {
    console.error("❌ Error submitting company transfer request:", error);
    throw error;
  }
};

/**
 * Approve company-to-company transfer request
 * Adds money to recipient balance and sends notification
 * @param requestId - Transfer request document ID
 * @param adminUser - Admin processing the request
 * @returns Promise with success boolean
 */
export const approveCompanyTransferRequest = async (
  requestId: string,
  adminUser: { uid: string; email: string; name: string }
): Promise<boolean> => {
  try {
    console.log("\n✅ ========================================");
    console.log("📝 APPROVING COMPANY TRANSFER REQUEST");
    console.log("========================================");
    console.log("📋 Request ID:", requestId);
    console.log("👤 Admin:", adminUser.email);

    const requestRef = doc(db, "companies-transfers", requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      throw new Error("Transfer request not found");
    }

    const initialRequestData = requestSnap.data();

    if (initialRequestData.status !== "pending") {
      throw new Error(`Request already ${initialRequestData.status}`);
    }

    console.log("💵 Transfer Amount:", initialRequestData.amount);
    console.log("🏢 From Company:", initialRequestData.fromCompany.name);
    console.log("🏢 To Company:", initialRequestData.toCompany.name);

    // Store data for notification (before transaction)
    const recipientCompanyId = initialRequestData.recipientCompanyId;
    const fromCompanyName = initialRequestData.fromCompany.name;
    const transferAmount = initialRequestData.amount;

    // Use atomic transaction to add balance and update request
    const result = await runTransaction(db, async (transaction) => {
      // Re-read request inside transaction
      const requestSnap = await transaction.get(requestRef);
      if (!requestSnap.exists()) {
        throw new Error("Transfer request not found");
      }

      const requestData = requestSnap.data();

      // Validate status again
      if (requestData.status !== "pending") {
        throw new Error(`Request already ${requestData.status}`);
      }

      // Get recipient company document
      const recipientCompanyDocRef = doc(
        db,
        "companies",
        requestData.recipientCompanyId
      );
      const recipientCompanySnap = await transaction.get(recipientCompanyDocRef);

      if (!recipientCompanySnap.exists()) {
        throw new Error("Recipient company not found");
      }

      const recipientCompanyData = recipientCompanySnap.data();
      const currentBalance = recipientCompanyData.balance || 0;
      const newBalance = currentBalance + requestData.amount;

      console.log("💰 Recipient Current Balance:", currentBalance);
      console.log("➕ Adding:", requestData.amount);
      console.log("💰 Recipient New Balance:", newBalance);

      // Update request status
      transaction.update(requestRef, {
        status: "approved",
        processedAt: serverTimestamp(),
        processedBy: adminUser,
      });

      // Add to recipient balance
      transaction.update(recipientCompanyDocRef, {
        balance: newBalance,
      });

      console.log("✅ Transaction completed successfully");
      return true;
    });

    // Send notification to recipient company (outside transaction)
    try {
      await sendTransferNotification(
        recipientCompanyId,
        fromCompanyName,
        transferAmount
      );
      console.log("✅ Notification sent to recipient");
    } catch (notifError) {
      console.error("⚠️ Failed to send notification:", notifError);
      // Don't throw - notification failure shouldn't fail the approval
    }

    console.log("========================================\n");
    return result;
  } catch (error: any) {
    console.error("❌ Error approving company transfer:", error);
    throw error;
  }
};

/**
 * Reject company-to-company transfer request
 * Refunds money back to sender and updates request status
 * @param requestId - Transfer request document ID
 * @param adminUser - Admin processing the request
 * @param reason - Optional rejection reason
 * @returns Promise with success boolean
 */
export const rejectCompanyTransferRequest = async (
  requestId: string,
  adminUser: { uid: string; email: string; name: string },
  reason?: string
): Promise<boolean> => {
  try {
    console.log("\n❌ ========================================");
    console.log("📝 REJECTING COMPANY TRANSFER REQUEST");
    console.log("========================================");
    console.log("📋 Request ID:", requestId);
    console.log("👤 Admin:", adminUser.email);
    if (reason) console.log("📝 Reason:", reason);

    const requestRef = doc(db, "companies-transfers", requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      throw new Error("Transfer request not found");
    }

    const requestData = requestSnap.data();

    if (requestData.status !== "pending") {
      throw new Error(`Request already ${requestData.status}`);
    }

    console.log("💵 Transfer Amount:", requestData.amount);
    console.log("🏢 From Company:", requestData.fromCompany.name);
    console.log("🏢 To Company:", requestData.toCompany.name);

    // Use atomic transaction to refund balance and update request
    const result = await runTransaction(db, async (transaction) => {
      // Re-read request inside transaction
      const requestSnap = await transaction.get(requestRef);
      if (!requestSnap.exists()) {
        throw new Error("Transfer request not found");
      }

      const requestData = requestSnap.data();

      // Validate status again
      if (requestData.status !== "pending") {
        throw new Error(`Request already ${requestData.status}`);
      }

      // Get sender company document to refund the money
      const senderCompanyDocRef = doc(db, "companies", requestData.companyId);
      const senderCompanySnap = await transaction.get(senderCompanyDocRef);

      if (!senderCompanySnap.exists()) {
        throw new Error("Sender company not found");
      }

      const senderCompanyData = senderCompanySnap.data();
      const currentBalance = senderCompanyData.balance || 0;
      const refundAmount = requestData.amount;
      const newBalance = currentBalance + refundAmount;

      console.log("💰 Sender Current Balance:", currentBalance);
      console.log("➕ Refunding:", refundAmount);
      console.log("💰 Sender New Balance:", newBalance);

      // Update request status
      transaction.update(requestRef, {
        status: "rejected",
        processedAt: serverTimestamp(),
        processedBy: adminUser,
        rejectionReason: reason || "لم يتم تحديد سبب",
      });

      // Refund to sender balance
      transaction.update(senderCompanyDocRef, {
        balance: newBalance,
      });

      console.log("✅ Transaction completed successfully");
      return true;
    });

    console.log("========================================\n");
    return result;
  } catch (error: any) {
    console.error("❌ Error rejecting company transfer:", error);
    throw error;
  }
};

/**
 * Send transfer notification to recipient company
 * @param recipientCompanyId - Company document ID
 * @param fromCompanyName - Name of sending company
 * @param amount - Transfer amount
 * @returns Promise with notification ID
 */
export const sendTransferNotification = async (
  recipientCompanyId: string,
  fromCompanyName: string,
  amount: number
): Promise<string> => {
  try {
    // Get recipient company email for notification targeting
    const recipientCompanyDoc = await getDoc(
      doc(db, "companies", recipientCompanyId)
    );
    if (!recipientCompanyDoc.exists()) {
      throw new Error("Recipient company not found");
    }

    const recipientCompanyData = recipientCompanyDoc.data();
    const recipientEmail = recipientCompanyData.email;

    if (!recipientEmail) {
      throw new Error("Recipient company email not found");
    }

    // Create notification using notificationService
    const { createNotification } = await import("./notificationService");
    const notificationId = await createNotification({
      title: "تحويل أموال",
      body: `تم استلام ${amount} ر.س من شركة ${fromCompanyName}`,
      targetedUsers: {
        companies: [recipientEmail], // Target specific company by email
      },
    });

    console.log("✅ Transfer notification created:", notificationId);
    return notificationId;
  } catch (error) {
    console.error("❌ Error sending transfer notification:", error);
    throw error;
  }
};

/**
 * Fetch all company-to-company transfer requests
 * @returns Promise with array of transfer requests
 */
export const fetchCompanyTransferRequests = async (): Promise<any[]> => {
  try {
    console.log("🔍 Fetching company transfer requests...");

    const transfersRef = collection(db, "companies-transfers");
    const q = query(transfersRef, orderBy("requestDate", "desc"));
    const querySnapshot = await getDocs(q);

    const transfers: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transfers.push({
        id: doc.id,
        type: data.type || "company-to-company",
        fromCompany: data.fromCompany,
        toCompany: data.toCompany,
        amount: data.amount,
        status: data.status || "pending",
        requestDate: data.requestDate,
        processedAt: data.processedAt,
        processedBy: data.processedBy,
        createdUserId: data.createdUserId,
        companyId: data.companyId,
        recipientCompanyId: data.recipientCompanyId,
      });
    });

    console.log(`✅ Found ${transfers.length} company transfer requests`);
    return transfers;
  } catch (error: any) {
    console.error("❌ Error fetching company transfer requests:", error);
    throw error;
  }
};

/**
 * Fetch company transfers for a specific company (both sent and received)
 * @param companyId - The company document ID
 * @param companyEmail - The company email (optional, for fallback lookup)
 * @returns Promise with array of transfer requests
 */
export const fetchCompanyTransfersForCompany = async (
  companyId?: string,
  companyEmail?: string
): Promise<any[]> => {
  try {
    console.log("🔍 Fetching company transfers for company...");
    console.log("Company ID:", companyId);
    console.log("Company Email:", companyEmail);

    const transfersRef = collection(db, "companies-transfers");
    const querySnapshot = await getDocs(transfersRef);

    const transfers: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transfers.push({
        id: doc.id,
        type: data.type || "company-to-company",
        fromCompany: data.fromCompany,
        toCompany: data.toCompany,
        amount: data.amount,
        status: data.status || "pending",
        requestDate: data.requestDate,
        processedAt: data.processedAt,
        processedBy: data.processedBy,
        createdUserId: data.createdUserId,
        companyId: data.companyId,
        recipientCompanyId: data.recipientCompanyId,
      });
    });

    // Filter transfers where company is either sender or recipient
    const filteredTransfers = transfers.filter((transfer) => {
      const isSender = 
        transfer.companyId === companyId ||
        transfer.fromCompany?.id === companyId ||
        transfer.fromCompany?.email === companyEmail ||
        transfer.createdUserId === companyEmail;
      
      const isRecipient =
        transfer.recipientCompanyId === companyId ||
        transfer.toCompany?.id === companyId ||
        transfer.toCompany?.email === companyEmail;

      return isSender || isRecipient;
    });

    // Sort by date descending
    filteredTransfers.sort((a, b) => {
      const dateA = a.requestDate?.toDate
        ? a.requestDate.toDate()
        : a.requestDate
        ? new Date(a.requestDate)
        : new Date(0);
      const dateB = b.requestDate?.toDate
        ? b.requestDate.toDate()
        : b.requestDate
        ? new Date(b.requestDate)
        : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(`✅ Found ${filteredTransfers.length} transfers for company`);
    return filteredTransfers;
  } catch (error: any) {
    console.error("❌ Error fetching company transfers:", error);
    throw error;
  }
};

/**
 * Reject wallet charge request
 * SECURITY: Only updates request status, does NOT modify balance
 * @param requestId - Request document ID
 * @param adminUser - Admin processing the request
 * @param reason - Optional rejection reason
 * @returns Promise with success boolean
 */
export const rejectWalletChargeRequest = async (
  requestId: string,
  adminUser: { uid: string; email: string; name: string },
  reason?: string
): Promise<boolean> => {
  try {
    console.log("\n❌ ========================================");
    console.log("📝 REJECTING WALLET CHARGE REQUEST");
    console.log("========================================");
    console.log("📋 Request ID:", requestId);
    console.log("👤 Admin:", adminUser.email);
    if (reason) console.log("📝 Reason:", reason);

    const requestRef = doc(db, "companies-wallets-requests", requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      throw new Error("Request not found");
    }

    const requestData = requestSnap.data();

    if (requestData.status !== "pending") {
      throw new Error(`Request already ${requestData.status}`);
    }

    await updateDoc(requestRef, {
      status: "rejected",
      processedAt: serverTimestamp(),
      processedBy: adminUser,
      rejectionReason: reason || "لم يتم تحديد سبب",
    });

    console.log("✅ Request rejected successfully");
    console.log("========================================\n");
    return true;
  } catch (error: any) {
    console.error("❌ Error rejecting wallet request:", error);
    throw error;
  }
};

// WALLET WITHDRAWAL/REFUND REQUEST MANAGEMENT
// ============================================================================

/**
 * Helper: Generate unique 8-digit refid for withdrawal requests
 * @returns Promise with unique 8-digit refid string
 */
const generateUniqueWithdrawalRefid = async (): Promise<string> => {
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    const refid = Math.floor(10000000 + Math.random() * 90000000).toString();

    // Check uniqueness in companies-wallets-withdrawals collection
    const requestsRef = collection(db, "companies-wallets-withdrawals");
    const q = query(requestsRef, where("refid", "==", refid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`✅ Generated unique withdrawal refid: ${refid}`);
      return refid;
    }
    console.log(`⚠️ Withdrawal refid ${refid} already exists, retrying...`);
  }
  throw new Error(
    "Failed to generate unique withdrawal refid after 20 attempts"
  );
};

/**
 * Helper: Upload IBAN image to Firebase Storage
 * @param file - Image file to upload
 * @param userId - User ID for organizing storage
 * @returns Promise with download URL
 */
const uploadIbanImage = async (file: File, userId: string): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileName = `wallet-withdrawals/${userId}/${timestamp}-${file.name}`;
    const storageRef = ref(storage, fileName);

    console.log(`📤 Uploading IBAN image: ${fileName}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    console.log(`✅ IBAN image uploaded successfully: ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error("❌ Error uploading IBAN image:", error);
    throw new Error("Failed to upload IBAN image");
  }
};

/**
 * Submit a wallet withdrawal/refund request
 * SECURITY: Does NOT modify balance - only creates request with "pending" status
 * @param requestData - Request form data from user
 * @returns Promise with created request ID
 */
export const submitWalletWithdrawalRequest = async (requestData: {
  accountNumber: string;
  companyIban: string;
  bankName: string;
  withdrawalAmount: number;
  withdrawalType: "all" | "custom";
  refundReason: string;
  ibanImage?: File;
}): Promise<string> => {
  try {
    console.log("\n💸 ========================================");
    console.log("📝 SUBMITTING WALLET WITHDRAWAL REQUEST");
    console.log("========================================");

    // Validate user authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    console.log("👤 User:", currentUser.email);

    // Validate amount
    if (requestData.withdrawalAmount <= 0) {
      throw new Error("Withdrawal amount must be greater than 0");
    }
    console.log("💵 Withdrawal Amount:", requestData.withdrawalAmount);

    // Get current company data
    const company = await fetchCurrentCompany();
    if (!company) {
      throw new Error("Company not found");
    }
    console.log("🏢 Company:", company.name);
    console.log("💰 Current Balance:", company.balance || 0);

    // Check sufficient balance (pre-validation)
    const currentBalance = company.balance || 0;
    if (currentBalance < requestData.withdrawalAmount) {
      throw new Error(`رصيد غير كافٍ. الرصيد الحالي: ${currentBalance} ر.س`);
    }

    // Generate unique 8-digit refid
    const refid = await generateUniqueWithdrawalRefid();

    // Upload IBAN image if provided
    let ibanImageUrl: string | undefined;
    if (requestData.ibanImage) {
      ibanImageUrl = await uploadIbanImage(
        requestData.ibanImage,
        currentUser.uid
      );
    }

    // Create withdrawal request document
    const requestsRef = collection(db, "companies-wallets-withdrawals");
    const newRequest = {
      refid,
      companyId: company.id, // Store company document ID for easy lookup
      requestedUser: {
        uid: currentUser.uid,
        email: currentUser.email!,
        name: company.name,
        balance: currentBalance, // Current balance at time of request
      },
      accountNumber: requestData.accountNumber,
      companyIban: requestData.companyIban,
      bankName: requestData.bankName,
      withdrawalAmount: requestData.withdrawalAmount,
      withdrawalType: requestData.withdrawalType,
      refundReason: requestData.refundReason,
      ibanImageUrl: ibanImageUrl,
      status: "pending",
      createdDate: serverTimestamp(),
      requestDate: serverTimestamp(),
    };

    const docRef = await addDoc(requestsRef, newRequest);

    console.log("✅ Wallet withdrawal request created successfully");
    console.log("📋 Request ID:", docRef.id);
    console.log("🔢 Refid:", refid);
    console.log("========================================\n");

    return docRef.id;
  } catch (error: any) {
    console.error("❌ Error submitting wallet withdrawal request:", error);
    throw error;
  }
};

/**
 * Approve wallet withdrawal request (ATOMIC TRANSACTION)
 * SECURITY: Uses Firestore transaction for atomicity
 * Updates request status to "approved" AND decrements company balance
 * VALIDATES sufficient balance before deduction
 * @param requestId - Request document ID
 * @param adminUser - Admin processing the request
 * @returns Promise with success boolean
 */
export const approveWalletWithdrawalRequest = async (
  requestId: string,
  adminUser: { uid: string; email: string; name: string }
): Promise<boolean> => {
  try {
    console.log("\n✅ ========================================");
    console.log("📝 APPROVING WALLET WITHDRAWAL REQUEST");
    console.log("========================================");
    console.log("📋 Request ID:", requestId);
    console.log("👤 Admin:", adminUser.email);

    // STEP 1: Fetch request and find company BEFORE transaction
    const requestRef = doc(db, "companies-wallets-withdrawals", requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      throw new Error("Request not found");
    }

    const requestData = requestSnap.data();
    console.log("💵 Withdrawal Amount:", requestData.withdrawalAmount);

    // Find company document ID
    let companyDocId: string;

    if (requestData.companyId) {
      // New requests: Use stored company ID
      console.log("🏢 Using stored Company ID:", requestData.companyId);
      companyDocId = requestData.companyId;
    } else {
      // Old requests: Query by UID or email (fallback for legacy data)
      console.log("🔍 Searching for company by UID/email...");
      const companiesRef = collection(db, "companies");

      // Try by UID
      let qByUid = query(
        companiesRef,
        where("uid", "==", requestData.requestedUser.uid)
      );
      let companySnapshot = await getDocs(qByUid);

      // If not found, try by email
      if (companySnapshot.empty && requestData.requestedUser.email) {
        console.log("🔍 Not found by UID, trying email...");
        const qByEmail = query(
          companiesRef,
          where("email", "==", requestData.requestedUser.email)
        );
        companySnapshot = await getDocs(qByEmail);
      }

      // If still not found, try by createdUserId
      if (companySnapshot.empty && requestData.requestedUser.email) {
        console.log("🔍 Not found by email, trying createdUserId...");
        const qByCreatedUserId = query(
          companiesRef,
          where("createdUserId", "==", requestData.requestedUser.email)
        );
        companySnapshot = await getDocs(qByCreatedUserId);
      }

      if (companySnapshot.empty) {
        throw new Error("Company not found");
      }

      companyDocId = companySnapshot.docs[0].id;
      console.log("✓ Found Company ID:", companyDocId);
    }

    // STEP 2: Run atomic transaction
    const result = await runTransaction(db, async (transaction) => {
      // Re-read request inside transaction to ensure consistency
      const requestSnap = await transaction.get(requestRef);

      if (!requestSnap.exists()) {
        throw new Error("Request not found");
      }

      const requestData = requestSnap.data();

      // Validate request status
      if (requestData.status !== "pending") {
        throw new Error(`Request already ${requestData.status}`);
      }
      console.log("✓ Request status is pending");

      // Get company document
      const companyDocRef = doc(db, "companies", companyDocId);
      const companySnap = await transaction.get(companyDocRef);

      if (!companySnap.exists()) {
        throw new Error("Company not found");
      }

      const companyData = companySnap.data();
      const currentBalance = companyData.balance || 0;
      const withdrawalAmount = requestData.withdrawalAmount;

      // CRITICAL: Validate sufficient balance
      if (currentBalance < withdrawalAmount) {
        throw new Error(
          `رصيد غير كافٍ. الرصيد الحالي: ${currentBalance} ر.س، المبلغ المطلوب: ${withdrawalAmount} ر.س`
        );
      }

      const newBalance = currentBalance - withdrawalAmount;

      console.log("💰 Current Balance:", currentBalance);
      console.log("➖ Withdrawing:", withdrawalAmount);
      console.log("💰 New Balance:", newBalance);

      // Update request status
      transaction.update(requestRef, {
        status: "approved",
        processedAt: serverTimestamp(),
        processedBy: adminUser,
      });

      // Update company balance (DEDUCTION)
      transaction.update(companyDocRef, {
        balance: newBalance,
      });

      console.log("✅ Transaction completed successfully");
      return true;
    });

    console.log("========================================\n");
    return result;
  } catch (error: any) {
    console.error("❌ Error approving withdrawal request:", error);
    throw error;
  }
};

/**
 * Reject wallet withdrawal request
 * SECURITY: Only updates request status, does NOT modify balance
 * @param requestId - Request document ID
 * @param adminUser - Admin processing the request
 * @param reason - Optional rejection reason
 * @returns Promise with success boolean
 */
export const rejectWalletWithdrawalRequest = async (
  requestId: string,
  adminUser: { uid: string; email: string; name: string },
  reason?: string
): Promise<boolean> => {
  try {
    console.log("\n❌ ========================================");
    console.log("📝 REJECTING WALLET WITHDRAWAL REQUEST");
    console.log("========================================");
    console.log("📋 Request ID:", requestId);
    console.log("👤 Admin:", adminUser.email);
    if (reason) console.log("📝 Reason:", reason);

    const requestRef = doc(db, "companies-wallets-withdrawals", requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      throw new Error("Request not found");
    }

    const requestData = requestSnap.data();

    if (requestData.status !== "pending") {
      throw new Error(`Request already ${requestData.status}`);
    }

    await updateDoc(requestRef, {
      status: "rejected",
      processedAt: serverTimestamp(),
      processedBy: adminUser,
      rejectionReason: reason || "لم يتم تحديد سبب",
    });

    console.log("✅ Withdrawal request rejected successfully");
    console.log("========================================\n");
    return true;
  } catch (error: any) {
    console.error("❌ Error rejecting withdrawal request:", error);
    throw error;
  }
};

/**
 * Fetch all withdrawal requests for admin dashboard
 * @returns Promise with all withdrawal requests data
 */
export const fetchAllAdminWithdrawalRequests = async () => {
  try {
    console.log(
      "\n🔄 Fetching admin withdrawal requests from companies-wallets-withdrawals..."
    );

    const requestsRef = collection(db, "companies-wallets-withdrawals");
    const querySnapshot = await getDocs(requestsRef);

    const allRequestsData: any[] = [];

    const formatDate = (timestamp: any): string => {
      if (!timestamp) return "-";
      try {
        if (timestamp.toDate && typeof timestamp.toDate === "function") {
          return new Date(timestamp.toDate()).toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
        if (timestamp instanceof Date) {
          return timestamp.toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
        return new Date(timestamp).toLocaleString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (error) {
        return String(timestamp);
      }
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Get date from multiple possible fields
      const dateToUse = data.createdDate || data.actionDate || data.requestDate;

      // Get status from correct location (support both old and new structures)
      const status = data.status || data.requestedUser?.status || "pending";

      // Get responsible person
      const responsible =
        data.processedBy?.name || data.actionUser?.name || "-";

      allRequestsData.push({
        id: doc.id,
        requestNumber: data.refid || doc.id,
        clientName: data.requestedUser?.name || "-",
        oldBalance: data.requestedUser?.balance || "-",
        withdrawalAmount: data.withdrawalAmount || "-",
        companyIban: data.companyIban || "-",
        bankName: data.bankName || "-",
        ibanImage: data.ibanImageUrl || "-",
        requestDate: formatDate(dateToUse),
        status: status,
        responsible: responsible,
        rawDate: dateToUse,
      });
    });

    // Sort by date descending (newest first)
    allRequestsData.sort((a, b) => {
      const dateA = a.rawDate?.toDate
        ? a.rawDate.toDate()
        : new Date(a.rawDate || 0);
      const dateB = b.rawDate?.toDate
        ? b.rawDate.toDate()
        : new Date(b.rawDate || 0);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(
      `✅ Total admin withdrawal requests found: ${allRequestsData.length}`
    );
    return allRequestsData;
  } catch (error) {
    console.error("❌ Error fetching admin withdrawal requests:", error);
    throw error;
  }
};

/**
 * Fetch user's own withdrawal requests
 * @returns Promise with user's withdrawal requests
 */
export const fetchUserWithdrawalRequests = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    console.log("\n🔄 Fetching user withdrawal requests...");
    console.log("👤 Current User UID:", currentUser.uid);

    // Get current company to also search by companyId
    const company = await fetchCurrentCompany();

    const requestsRef = collection(db, "companies-wallets-withdrawals");

    // Try multiple query strategies for maximum compatibility
    let userRequests: any[] = [];

    // Strategy 1: Query by requestedUser.uid
    const qByUid = query(
      requestsRef,
      where("requestedUser.uid", "==", currentUser.uid)
    );
    const snapshotByUid = await getDocs(qByUid);

    snapshotByUid.forEach((doc) => {
      const data = doc.data();
      userRequests.push({
        id: doc.id,
        ...data,
      });
    });

    // Strategy 2: If company exists and no results, try by companyId
    if (userRequests.length === 0 && company) {
      console.log("🔍 No results by UID, trying by companyId:", company.id);
      const qByCompanyId = query(
        requestsRef,
        where("companyId", "==", company.id)
      );
      const snapshotByCompanyId = await getDocs(qByCompanyId);

      snapshotByCompanyId.forEach((doc) => {
        const data = doc.data();
        userRequests.push({
          id: doc.id,
          ...data,
        });
      });
    }

    // Sort by date descending
    userRequests.sort((a, b) => {
      const dateA = a.createdDate?.toDate
        ? a.createdDate.toDate()
        : new Date(a.createdDate || 0);
      const dateB = b.createdDate?.toDate
        ? b.createdDate.toDate()
        : new Date(b.createdDate || 0);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(`✅ Found ${userRequests.length} withdrawal requests for user`);
    return userRequests;
  } catch (error) {
    console.error("❌ Error fetching user withdrawal requests:", error);
    throw error;
  }
};

/**
 * Upload banks data to Firestore
 * @param banks - Array of bank objects with Arabic and English names
 * @returns Promise with upload result
 */
export const uploadBanksToFirestore = async (
  banks: Array<{ arabic: string; english: string }>
): Promise<{ created: number; skipped: number }> => {
  try {
    console.log("\n🏦 ========================================");
    console.log("📝 UPLOADING BANKS TO FIRESTORE");
    console.log("========================================");

    const banksRef = collection(db, "banks");
    let created = 0;
    let skipped = 0;

    // Fetch all existing banks to check for duplicates
    const existingBanksSnapshot = await getDocs(banksRef);
    const existingArabicNames = new Set<string>();
    existingBanksSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.arabic) {
        existingArabicNames.add(data.arabic.trim().toLowerCase());
      }
    });

    // Filter out duplicates and empty banks
    const newBanks = banks.filter((bank) => {
      const arabic = bank.arabic.trim();
      const english = bank.english.trim();

      if (!arabic && !english) {
        skipped++;
        return false;
      }

      if (existingArabicNames.has(arabic.toLowerCase())) {
        skipped++;
        return false;
      }

      existingArabicNames.add(arabic.toLowerCase());
      return true;
    });

    // Use batch write for better performance
    const batchSize = 500; // Firestore batch limit
    let currentBatch = writeBatch(db);
    let batchCount = 0;

    for (const bank of newBanks) {
      // Create new bank document
      const bankDocRef = doc(banksRef);
      currentBatch.set(bankDocRef, {
        arabic: bank.arabic.trim(),
        english: bank.english.trim(),
        createdAt: serverTimestamp(),
      });

      created++;
      batchCount++;

      // Commit batch if it reaches the limit and create a new batch
      if (batchCount >= batchSize) {
        await currentBatch.commit();
        currentBatch = writeBatch(db);
        batchCount = 0;
      }
    }

    // Commit remaining documents
    if (batchCount > 0) {
      await currentBatch.commit();
    }

    console.log(`✅ Uploaded ${created} banks, skipped ${skipped} duplicates`);
    console.log("========================================\n");

    return { created, skipped };
  } catch (error: any) {
    console.error("❌ Error uploading banks:", error);
    throw error;
  }
};

/**
 * Fetch all banks from Firestore
 * @returns Promise with array of banks
 */
export const fetchBanksFromFirestore = async (): Promise<
  Array<{ id: string; arabic: string; english: string }>
> => {
  try {
    const banksRef = collection(db, "banks");
    const q = query(banksRef, orderBy("arabic", "asc"));
    const querySnapshot = await getDocs(q);

    const banks: Array<{ id: string; arabic: string; english: string }> = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      banks.push({
        id: doc.id,
        arabic: data.arabic || "",
        english: data.english || "",
      });
    });

    return banks;
  } catch (error: any) {
    console.error("❌ Error fetching banks:", error);
    throw error;
  }
};

// ============================================================================
// WALLET BANK ACCOUNTS MANAGEMENT
// ============================================================================

/**
 * Fetch all bank accounts from Firestore wallet-bank-accounts collection
 * @returns Promise with array of bank account objects
 */
export const fetchBankAccountsFromFirestore = async (): Promise<
  Array<{
    id: string;
    bankName: { ar: string; en?: string };
    accountNumber: string;
    ibanNumber: string;
    logoUrl: string;
    order: number;
    isActive: boolean;
  }>
> => {
  try {
    const bankAccountsRef = collection(db, "wallet-bank-accounts");
    const q = query(bankAccountsRef, orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);

    const bankAccounts: Array<{
      id: string;
      bankName: { ar: string; en?: string };
      accountNumber: string;
      ibanNumber: string;
      logoUrl: string;
      order: number;
      isActive: boolean;
    }> = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      bankAccounts.push({
        id: doc.id,
        bankName: data.bankName || { ar: "", en: "" },
        accountNumber: data.accountNumber || "",
        ibanNumber: data.ibanNumber || "",
        logoUrl: data.logoUrl || "",
        order: data.order || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      });
    });

    return bankAccounts;
  } catch (error: any) {
    console.error("❌ Error fetching bank accounts:", error);
    throw error;
  }
};

/**
 * Create a new bank account in Firestore wallet-bank-accounts collection
 * @param bankAccountData - Bank account data to create
 * @returns Promise with the created bank account document ID
 */
export const createBankAccount = async (bankAccountData: {
  bankName: { ar: string; en?: string };
  accountNumber: string;
  ibanNumber: string;
  logoUrl: string;
  order: number;
  isActive?: boolean;
}): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    const bankAccountsRef = collection(db, "wallet-bank-accounts");

    const bankAccountDocument = {
      bankName: bankAccountData.bankName,
      accountNumber: bankAccountData.accountNumber,
      ibanNumber: bankAccountData.ibanNumber,
      logoUrl: bankAccountData.logoUrl,
      order: bankAccountData.order,
      isActive: bankAccountData.isActive !== undefined ? bankAccountData.isActive : true,
      createdDate: serverTimestamp(),
      createdUserId: currentUser?.email || currentUser?.uid || null,
    };

    const docRef = await addDoc(bankAccountsRef, bankAccountDocument);
    console.log("✅ Bank account created successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error("❌ Error creating bank account:", error);
    throw error;
  }
};

/**
 * Update an existing bank account in Firestore wallet-bank-accounts collection
 * @param bankAccountId - Bank account document ID
 * @param bankAccountData - Updated bank account data
 * @returns Promise<void>
 */
export const updateBankAccount = async (
  bankAccountId: string,
  bankAccountData: {
    bankName?: { ar: string; en?: string };
    accountNumber?: string;
    ibanNumber?: string;
    logoUrl?: string;
    order?: number;
    isActive?: boolean;
  }
): Promise<void> => {
  try {
    const bankAccountRef = doc(db, "wallet-bank-accounts", bankAccountId);
    const updateData: any = {};

    if (bankAccountData.bankName !== undefined) {
      updateData.bankName = bankAccountData.bankName;
    }
    if (bankAccountData.accountNumber !== undefined) {
      updateData.accountNumber = bankAccountData.accountNumber;
    }
    if (bankAccountData.ibanNumber !== undefined) {
      updateData.ibanNumber = bankAccountData.ibanNumber;
    }
    if (bankAccountData.logoUrl !== undefined) {
      updateData.logoUrl = bankAccountData.logoUrl;
    }
    if (bankAccountData.order !== undefined) {
      updateData.order = bankAccountData.order;
    }
    if (bankAccountData.isActive !== undefined) {
      updateData.isActive = bankAccountData.isActive;
    }

    await updateDoc(bankAccountRef, updateData);
    console.log("✅ Bank account updated successfully:", bankAccountId);
  } catch (error: any) {
    console.error("❌ Error updating bank account:", error);
    throw error;
  }
};

// ============================================================================
// PETROLIFE AGENTS MANAGEMENT
// ============================================================================

/**
 * Check if a phone number already exists in petrolife-agents collection
 * @param phone - Phone number to check
 * @returns Promise with boolean indicating if phone exists
 */
export const checkAgentPhoneExists = async (
  phone: string
): Promise<boolean> => {
  try {
    const agentsRef = collection(db, "petrolife-agents");
    const q = query(agentsRef, where("phone", "==", phone));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("❌ Error checking agent phone:", error);
    throw error;
  }
};

/**
 * Add a new petrolife agent to Firestore
 * @param agentData - Agent form data
 * @returns Promise with the created agent document
 */
export const addPetrolifeAgent = async (agentData: AddPetrolifeAgentData) => {
  try {
    console.log("👤 Adding new petrolife agent...");
    console.log("Agent data:", agentData);

    // 1. Get current user (admin)
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new Error("No authenticated user found");
    }
    const adminEmail = currentUser.email;

    // 2. Check phone uniqueness
    const phoneExists = await checkAgentPhoneExists(agentData.phone);
    if (phoneExists) {
      throw new Error("رقم الهاتف مستخدم بالفعل. يرجى استخدام رقم آخر.");
    }

    // 3. Upload profile image if provided
    let imageUrl = "";
    if (agentData.imageFile) {
      const fileName = `petrolife-agents/profiles/${Date.now()}_${
        agentData.imageFile.name
      }`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, agentData.imageFile);
      imageUrl = await getDownloadURL(storageRef);
      console.log("✅ Profile image uploaded:", imageUrl);
    }

    // 4. Generate unique agent code if not provided
    let agentCode = agentData.agentCode?.trim() || "";
    if (!agentCode) {
      // Generate 8-digit code
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        const randomCode = Math.floor(10000000 + Math.random() * 90000000);
        agentCode = randomCode.toString();

        const agentsRef = collection(db, "petrolife-agents");
        const q = query(agentsRef, where("agentCode", "==", agentCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          isUnique = true;
        } else {
          attempts++;
        }
      }

      if (!isUnique || !agentCode) {
        throw new Error("فشل في إنشاء كود المندوب. يرجى المحاولة مرة أخرى.");
      }
    } else {
      // Check if provided agent code is unique
      const agentsRef = collection(db, "petrolife-agents");
      const q = query(agentsRef, where("agentCode", "==", agentCode));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error("كود المندوب مستخدم بالفعل. يرجى استخدام كود آخر.");
      }
    }

    console.log("✅ Generated unique agent code:", agentCode);

    // 5. Prepare agent document
    const agentDocument = {
      name: agentData.name.trim(),
      email: agentData.email.trim(),
      phone: agentData.phone.trim(),
      city: agentData.city,
      address: agentData.address?.trim() || "",
      agentCode: agentCode,
      commissionValue: parseFloat(agentData.commissionValue) || 0,
      imageUrl: imageUrl,
      joinDate: serverTimestamp(),
      isActive: true,
      companies: [] as string[],
      createdDate: serverTimestamp(),
      createdUserId: adminEmail,
    };

    console.log("📄 Agent document prepared:", agentDocument);

    // 6. Add document to Firestore
    console.log("💾 Adding agent document to petrolife-agents collection...");
    const agentsRef = collection(db, "petrolife-agents");
    const docRef = await addDoc(agentsRef, agentDocument);
    console.log("✅ Agent document added with ID:", docRef.id);

    return {
      id: docRef.id,
      ...agentDocument,
    };
  } catch (error) {
    console.error("❌ Error creating agent:", error);
    throw error;
  }
};

/**
 * Get all petrolife agents from Firestore
 * @returns Promise with array of agents
 */
export const getAllPetrolifeAgents = async (): Promise<PetrolifeAgent[]> => {
  try {
    const agentsRef = collection(db, "petrolife-agents");
    const q = query(agentsRef, orderBy("createdDate", "desc"));
    const querySnapshot = await getDocs(q);

    const agents: PetrolifeAgent[] = [];

    querySnapshot.forEach((doc) => {
      agents.push({
        id: doc.id,
        ...doc.data(),
      } as PetrolifeAgent);
    });

    return agents;
  } catch (error) {
    console.error("❌ Error fetching petrolife agents:", error);
    throw error;
  }
};

/**
 * Get a single petrolife agent by ID
 * @param agentId - Agent document ID
 * @returns Promise with agent data including associated companies
 */
export const getPetrolifeAgentById = async (
  agentId: string
): Promise<PetrolifeAgent | null> => {
  try {
    const agentRef = doc(db, "petrolife-agents", agentId);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      return null;
    }

    return {
      id: agentSnap.id,
      ...agentSnap.data(),
    } as PetrolifeAgent;
  } catch (error) {
    console.error("❌ Error fetching agent by ID:", error);
    throw error;
  }
};

/**
 * Add a company to an agent's companies array
 * @param agentId - Agent document ID
 * @param companyId - Company document ID
 * @returns Promise<void>
 */
export const addCompanyToAgent = async (
  agentId: string,
  companyId: string
): Promise<void> => {
  try {
    const agentRef = doc(db, "petrolife-agents", agentId);

    // Check if company already exists in agent's companies array
    const agentSnap = await getDoc(agentRef);
    if (!agentSnap.exists()) {
      throw new Error("Agent not found");
    }

    const agentData = agentSnap.data();
    const companies = agentData.companies || [];

    if (companies.includes(companyId)) {
      throw new Error("الشركة مضافة بالفعل لهذا المندوب");
    }

    await updateDoc(agentRef, {
      companies: arrayUnion(companyId),
    });

    console.log("✅ Company added to agent:", companyId);
  } catch (error) {
    console.error("❌ Error adding company to agent:", error);
    throw error;
  }
};

/**
 * Remove a company from an agent's companies array
 * @param agentId - Agent document ID
 * @param companyId - Company document ID
 * @returns Promise<void>
 */
export const removeCompanyFromAgent = async (
  agentId: string,
  companyId: string
): Promise<void> => {
  try {
    const agentRef = doc(db, "petrolife-agents", agentId);
    await updateDoc(agentRef, {
      companies: arrayRemove(companyId),
    });

    console.log("✅ Company removed from agent:", companyId);
  } catch (error) {
    console.error("❌ Error removing company from agent:", error);
    throw error;
  }
};

/**
 * Delete a petrolife agent from Firestore
 * @param agentId - Agent document ID
 * @returns Promise<void>
 */
export const deletePetrolifeAgent = async (agentId: string): Promise<void> => {
  try {
    const agentRef = doc(db, "petrolife-agents", agentId);
    await deleteDoc(agentRef);
    console.log("✅ Agent deleted:", agentId);
  } catch (error) {
    console.error("❌ Error deleting agent:", error);
    throw error;
  }
};
