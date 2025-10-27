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
  arrayUnion,
  where,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth, storage } from "../config/firebase";

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
export const fetchCarStationsWithConsumption = async (): Promise<any[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user");
      return [];
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

    // Step 2: Fetch orders filtered by current user
    const orders = await fetchOrders();
    console.log("\n📦 Orders fetched for current user:", orders.length);

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

    console.log("\n📊 Processing Financial Report Data");
    console.log("===================================");
    console.log("Total orders:", orders.length);

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

      // Extract driver code from assignedDriver.id
      const driverCode =
        order.assignedDriver?.id ||
        order.assignedDriver?.email ||
        order.assignedDriver?.uId ||
        "-";

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
export const calculateFuelConsumptionByCities = async () => {
  try {
    console.log("\n🏙️ ========================================");
    console.log("📊 CALCULATING FUEL CONSUMPTION BY CITIES");
    console.log("📍 Using fetchCarStationsWithConsumption()");
    console.log("========================================\n");

    // Fetch car stations WITH consumption calculated from orders
    // This function matches orders to stations and calculates totalLitersConsumed
    const stations = await fetchCarStationsWithConsumption();

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
    // console.log('Fetching products from Firestore...');

    const productsCollection = collection(db, "products");
    const q = query(productsCollection, orderBy("createdDate", "desc"));
    const productsSnapshot = await getDocs(q);

    const products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // console.log('Fetched products:', products.length);
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
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
 * Fetch companies-wallets-requests data from Firestore
 * Filtered by requestedUser.email matching current user's email
 * Uses requestedUser.balance as old balance
 * @returns Promise with filtered wallet requests data
 */
export const fetchWalletChargeRequests = async () => {
  try {
    // console.log('\n🔄 Fetching companies-wallets-requests...');

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

    // console.log('✅ Total requests found:', allRequestsData.length);

    // Get current user
    const currentUser = auth.currentUser;

    if (!currentUser) {
      // console.log('⚠️ No user logged in. Returning all data.');
      return allRequestsData;
    }

    const userEmail = currentUser.email;

    // Filter requests where requestedUser.email matches current user's email
    const filteredRequests = allRequestsData.filter((request) => {
      const requestedUserEmail = request.requestedUser?.email;

      const emailMatch =
        requestedUserEmail &&
        userEmail &&
        requestedUserEmail.toLowerCase() === userEmail.toLowerCase();

      return emailMatch;
    });

    // console.log('✅ Filtered requests:', filteredRequests.length);

    // Add oldBalance from requestedUser.balance
    const enrichedRequests = filteredRequests.map((request) => ({
      ...request,
      oldBalance: request.requestedUser?.balance || 0,
    }));

    // console.log('✅ Requests with balance:', enrichedRequests.length);

    return enrichedRequests;
  } catch (error) {
    console.error("❌ Error fetching wallet charge requests:", error);
    throw error;
  }
};

/**
 * Fetch admin wallet reports data from wallets-requests collection
 * @returns Promise with admin wallet reports data
 */
export const fetchAdminWalletReports = async () => {
  try {
    console.log("\n🔄 Fetching admin wallet reports from wallets-requests...");

    const requestsRef = collection(db, "wallets-requests");
    const q = query(requestsRef, orderBy("actionDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

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
      allRequestsData.push({
        id: doc.id, // رقم العملية
        date: formatDate(data.actionDate), // التاريخ (formatted)
        clientType: data.requestedUser?.type || "-", // نوع العميل
        clientName: data.requestedUser?.name || "-", // اسم العميل
        operationNumber: doc.id, // رقم العملية (document ID)
        operationType: "-", // نوع العملية (leave as "-" for now)
        debit: data.value || "-", // مدين
        credit: "-", // دائن (leave as "-" for now)
        balance: data.requestedUser?.balance || "-", // الرصيد (ر.س)
        rawDate: data.actionDate, // Store raw date for sorting
      });
    });

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
    const q = query(requestsRef, orderBy("actionDate", "desc"));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

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
      allRequestsData.push({
        id: doc.id,
        requestNumber: doc.id, // رقم العملية
        clientName: data.requestedUser?.name || "-", // العميل
        orderType: "-", // نوع الشحن
        oldBalance: data.requestedUser?.balance || "-", // الرصيد القديم
        addedBalance: data.value || "-", // الرصيد المضاف
        requestDate: formatDate(data.actionDate), // تاريخ الانشاء
        status: data.requestedUser?.status || "-", // حالة الطلب
        responsible: data.actionUser?.name || "-", // المسؤول
      });
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
          supervisorCode: data.uid || data.id || doc.id || "-",
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
        companyCode: companyData.id || companyDoc.id || "-",
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
      phone: driverData.phone,
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
 * Fetch notifications from Firestore notifications collection
 * Filtered by current company ID in the companies array
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

    // First, get the current company data
    const companyData = await fetchCurrentCompany();

    if (!companyData || !companyData.id) {
      console.log("❌ No company found for current user.");
      return [];
    }

    const companyId = companyData.id;
    console.log("✅ Current Company ID:", companyId);

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

    // Filter notifications where companies array contains current company ID
    const filteredNotifications = allNotifications.filter((notification) => {
      const companies = notification.companies || [];
      const isForCompany = companies.includes(companyId);

      if (isForCompany) {
        console.log("✅ Notification matched for company:", {
          id: notification.id,
          body: notification.body?.substring(0, 50),
          createdDate: notification.createdDate,
        });
      }

      return isForCompany;
    });

    console.log(
      "✅ Filtered notifications for current company:",
      filteredNotifications.length
    );

    // Sort by createdDate (most recent first)
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
export const fetchFuelStationById = async (stationId: string): Promise<FuelStation | null> => {
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
      phoneNumber: data.phoneNumber
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
          (tireChangeStats as any)?.sizes?.find((s: any) => s.name === "صغيرة")?.count || 0,
        medium:
          (tireChangeStats as any)?.sizes?.find((s: any) => s.name === "متوسطة")?.count || 0,
        large:
          (tireChangeStats as any)?.sizes?.find((s: any) => s.name === "كبيرة")?.count || 0,
        vip: (tireChangeStats as any)?.sizes?.find((s: any) => s.name === "VIP")?.count || 0,
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
        id: data.id || doc.id,
        clientCode: data.id || data.uId || doc.id,
        providerName: data.name || "غير محدد",
        type: data.type || "غير محدد",
        phoneNumber: data.phoneNumber || data.phone || "-",
        email: data.email || "-",
        status: data.status || "نشط",
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
        clientCode: data.id || data.uId || docSnap.id,
        providerName: data.name || "غير محدد",
        type: data.type || "غير محدد",
        phoneNumber: data.phoneNumber || data.phone || "-",
        email: data.email || "-",
        status: data.status || "نشط",
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
        clientCode: data.id || data.uId || doc.id,
        providerName: data.name || "غير محدد",
        type: data.type || "غير محدد",
        phoneNumber: data.phoneNumber || data.phone || "-",
        email: data.email || "-",
        status: data.status || "نشط",
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
    return [];
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
export const fetchFuelStationOrderById = async (orderId: string): Promise<any | null> => {
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
const waitForAuthState = (): Promise<any> => {
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
    console.error("❌ Error calculating service distributer statistics:", error);
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
export const fetchFuelStationWorkerByEmail = async (workerUid: string): Promise<any | null> => {
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
      
      const match = carStationCreatedUserId && 
        carStationCreatedUserId.toLowerCase() === currentUserEmail.toLowerCase();

      return match;
    });

    console.log("✅ Filtered workers for current user:", filteredWorkers.length);
    console.log(`📊 Efficiency: Fetched ${allWorkers.length} workers, filtered to ${filteredWorkers.length} (${filteredWorkers.length > 0 ? Math.round((filteredWorkers.length / allWorkers.length) * 100) : 0}% match rate)`);

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
          text: worker.isActive === true ? "مفعل" : "معطل"
        },
        // Keep original worker data for details page
        originalWorker: worker,
      };
    });

    console.log("✅ Fuel stations workers transformed:", transformedWorkers.length);

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
export const fetchFuelStationWorkersByStationEmail = async (stationEmail: string): Promise<any[]> => {
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
      
      const match = workerStationEmail && 
        workerStationEmail.toLowerCase() === stationEmail.toLowerCase();

      return match;
    });

    console.log("✅ Filtered workers for station:", filteredWorkers.length);
    console.log(`📊 Efficiency: Fetched ${allWorkers.length} workers, filtered to ${filteredWorkers.length} (${filteredWorkers.length > 0 ? Math.round((filteredWorkers.length / allWorkers.length) * 100) : 0}% match rate)`);

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
          text: worker.isActive === true ? "مفعل" : "معطل"
        },
        // Keep original worker data for details page
        originalWorker: worker,
      };
    });

    console.log("✅ Fuel stations workers transformed:", transformedWorkers.length);

    return transformedWorkers;
  } catch (error) {
    console.error("❌ Error fetching fuel station workers by station email:", error);
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
 * Fetch worker transactions from stationscompany-orders collection
 * Filters by fuelStationWorker.email matching the provided worker email
 * @param workerEmail - The email of the worker
 * @returns Promise with array of worker transaction data
 */
export const fetchWorkerTransactions = async (workerEmail: string): Promise<any[]> => {
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
      const workerEmailInOrder = order.fuelStationWorker?.email || order.fuelStationsWorker?.email;
      
      const match = workerEmailInOrder && 
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
        fuelType: order.selectedOption?.title?.ar || order.selectedOption?.title?.en || "غير محدد",
        totalLiters: totalLitre.toString(),
        totalPrice: totalPrice,
        creationDate: formatDate(order.orderDate),
      };
    });

    console.log("✅ Worker transactions transformed:", transformedOrders.length);

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
      
      const match = carStationCreatedUserId && 
        carStationCreatedUserId.toLowerCase() === currentUserEmail.toLowerCase();

      return match;
    });

    console.log("✅ Filtered orders for current user:", filteredOrders.length);

    // Group orders by client email and sum up consumption
    const clientConsumptionMap = new Map<string, {
      email: string;
      name: string;
      phone: string;
      totalCost: number;
      totalFuel: number;
      orders: any[];
    }>();

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
            orders: [order]
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
        rank: index + 1
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
    const fuelType = order.selectedOption?.title?.ar || order.selectedOption?.title?.en || "";
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
      
      const match = carStationCreatedUserId && 
        carStationCreatedUserId.toLowerCase() === currentUserEmail.toLowerCase();

      return match;
    });

    console.log("✅ Filtered orders for current user:", filteredOrders.length);

    // Group orders by station email/name and sum up consumption
    const stationConsumptionMap = new Map<string, {
      name: string;
      email: string;
      address: string;
      totalPrice: number;
      totalFuel: number;
      orders: any[];
    }>();

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
            orders: [order]
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
        rank: index + 1
      }));

    console.log("✅ Top stations aggregated:", topStations.length);

    return topStations;
  } catch (error) {
    console.error("❌ Error fetching top stations by consumption:", error);
    throw error;
  }
};
