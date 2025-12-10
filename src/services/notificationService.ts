import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  setDoc,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { fetchAllCompanies, fetchAllClients } from "./firestore";

/**
 * Test basic Firestore connection to notifications collection
 * Returns raw data without any processing for debugging
 */
export const testConnection = async (): Promise<{
  success: boolean;
  count: number;
  sample?: any;
  error?: any;
}> => {
  try {
    console.log(
      "🧪 Testing Firestore connection to 'notifications' collection..."
    );

    const notificationsRef = collection(db, "notifications");
    const querySnapshot = await getDocs(notificationsRef);

    const count = querySnapshot.size;
    console.log(`📊 Found ${count} documents in notifications collection`);

    let sample = null;
    if (!querySnapshot.empty) {
      const firstDoc = querySnapshot.docs[0];
      sample = {
        id: firstDoc.id,
        data: firstDoc.data(),
        fields: Object.keys(firstDoc.data()),
      };
      console.log("📄 Sample document structure:", sample);
    }

    return { success: true, count, sample };
  } catch (error: any) {
    console.error("❌ Connection test failed:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    return {
      success: false,
      count: 0,
      error: {
        code: error.code,
        message: error.message,
        stack: error.stack,
      },
    };
  }
};

/**
 * Fetch all notifications for admin dashboard
 * Simplified version - fetches raw data without complex processing
 */
export const fetchAllNotifications = async (): Promise<any[]> => {
  try {
    console.log("🔔 Fetching all notifications from Firestore...");
    console.log("📍 Collection: notifications");

    const notificationsRef = collection(db, "notifications");

    // Start with simplest possible query - no ordering, no filtering
    let querySnapshot;
    try {
      querySnapshot = await getDocs(notificationsRef);
      console.log(`✅ Successfully fetched ${querySnapshot.size} documents`);
    } catch (error: any) {
      console.error("❌ Failed to fetch documents:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      throw error;
    }

    if (querySnapshot.empty) {
      console.log("⚠️ Collection is empty - no documents found");
      return [];
    }

    const notifications: any[] = [];
    const refIdUpdatePromises: Promise<void>[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const notificationData = {
        id: docSnapshot.id,
        ...data,
      };

      console.log(`📄 Document ${docSnapshot.id} fields:`, Object.keys(data));

      // Check if refId needs to be generated (non-blocking)
      if (
        !notificationData.refId ||
        String(notificationData.refId).length !== 8 ||
        !/^\d{8}$/.test(String(notificationData.refId))
      ) {
        // Update refId in background
        refIdUpdatePromises.push(ensureRefId(docSnapshot.id, notificationData));
      }

      notifications.push(notificationData);
    });

    // Start refId updates in background (don't wait)
    if (refIdUpdatePromises.length > 0) {
      console.log(
        `🔄 Updating refIds for ${refIdUpdatePromises.length} notifications in background...`
      );
      Promise.all(refIdUpdatePromises).catch((err) => {
        console.error("Error updating refIds in background:", err);
      });
    }

    // Sort by createdDate if available
    notifications.sort((a, b) => {
      const dateA = a.createdDate?.toDate?.() || new Date(a.createdDate || 0);
      const dateB = b.createdDate?.toDate?.() || new Date(b.createdDate || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Fetch creator names in parallel (non-blocking for display, but we'll wait for it)
    console.log("👤 Fetching creator names...");
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        try {
          const createdUserId =
            notification.createdUserId ||
            notification.creatorId ||
            notification.userId ||
            "";
          const creatorName = createdUserId
            ? await fetchUserName(createdUserId)
            : "غير معروف";
          return {
            ...notification,
            creatorName,
          };
        } catch (err) {
          console.error(
            `Error fetching creator name for notification ${notification.id}:`,
            err
          );
          return {
            ...notification,
            creatorName: notification.createdUserId || "غير معروف",
          };
        }
      })
    );

    console.log(`📝 Processed ${enrichedNotifications.length} notifications`);
    console.log(
      "📋 First notification raw data:",
      enrichedNotifications[0]
        ? {
            id: enrichedNotifications[0].id,
            fields: Object.keys(enrichedNotifications[0]),
            title: enrichedNotifications[0].title,
            body: enrichedNotifications[0].body,
            createdDate: enrichedNotifications[0].createdDate,
            createdUserId: enrichedNotifications[0].createdUserId,
            creatorName: enrichedNotifications[0].creatorName,
            targetedUsers: enrichedNotifications[0].targetedUsers,
          }
        : "No notifications"
    );

    return enrichedNotifications;
  } catch (error: any) {
    console.error("❌ Error fetching notifications:", error);
    console.error("Error type:", error.constructor.name);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Provide user-friendly error information
    if (error.code === "permission-denied") {
      throw new Error(
        "Permission denied: You don't have access to the notifications collection"
      );
    } else if (error.code === "not-found") {
      throw new Error(
        "Collection not found: The notifications collection doesn't exist"
      );
    } else if (error.code === "unavailable") {
      throw new Error(
        "Service unavailable: Firestore is temporarily unavailable"
      );
    }

    throw error;
  }
};

/**
 * Format date to dd\mm\yyyy 00:00 format
 * Handles Firestore Timestamp objects and various date formats
 */
const formatDate = (date: any): string => {
  if (!date) return "--";

  try {
    let dateObj: Date;
    if (date.toDate && typeof date.toDate === "function") {
      // Firestore Timestamp
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === "string" || typeof date === "number") {
      dateObj = new Date(date);
    } else {
      return "--";
    }

    if (isNaN(dateObj.getTime())) {
      return "--";
    }

    // Format as dd\mm\yyyy 00:00
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");

    return `${day}\\${month}\\${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error("Error formatting date:", error, date);
    return "--";
  }
};

/**
 * Get targeting display text based on targetedUsers map
 * Arrays with users = that type is targeted
 * Multiple types with users = "عام" (all)
 */
const getTargetingText = (targetedUsers: any): string => {
  if (!targetedUsers || typeof targetedUsers !== "object") {
    return "عام";
  }

  const typesWithUsers: string[] = []; // Types that have users in their arrays

  // Check which types have users (non-empty arrays)
  if (
    targetedUsers.clients &&
    Array.isArray(targetedUsers.clients) &&
    targetedUsers.clients.length > 0
  ) {
    typesWithUsers.push("clients");
  }

  if (
    targetedUsers.companies &&
    Array.isArray(targetedUsers.companies) &&
    targetedUsers.companies.length > 0
  ) {
    typesWithUsers.push("companies");
  }

  if (
    targetedUsers["companies-drivers"] &&
    Array.isArray(targetedUsers["companies-drivers"]) &&
    targetedUsers["companies-drivers"].length > 0
  ) {
    typesWithUsers.push("companies-drivers");
  }

  if (
    targetedUsers.fuelStationsWorkers &&
    Array.isArray(targetedUsers.fuelStationsWorkers) &&
    targetedUsers.fuelStationsWorkers.length > 0
  ) {
    typesWithUsers.push("fuelStationsWorkers");
  }

  if (
    targetedUsers.stationscompany &&
    Array.isArray(targetedUsers.stationscompany) &&
    targetedUsers.stationscompany.length > 0
  ) {
    typesWithUsers.push("stationscompany");
  }

  // If no types have users, return "عام"
  if (typesWithUsers.length === 0) {
    return "عام";
  }

  // If multiple types have users, it means "all" (عام)
  if (typesWithUsers.length > 1) {
    return "عام";
  }

  // Single type with users - show that type's name
  const typeMap: Record<string, string> = {
    stationscompany: "مزودو الخدمة",
    fuelStationsWorkers: "عمال المحطة",
    "companies-drivers": "تطبيق السائق",
    companies: "شركات",
    clients: "أفراد",
  };

  return typeMap[typesWithUsers[0]] || "عام";
};

/**
 * Generate unique 8-digit refId for notifications (non-blocking)
 */
const generateUniqueRefId = async (): Promise<string> => {
  try {
    return await runTransaction(db, async (transaction) => {
      const notificationsRef = collection(db, "notifications");
      const maxAttempts = 10;
      let attempts = 0;

      while (attempts < maxAttempts) {
        const randomCode = Math.floor(10000000 + Math.random() * 90000000);
        const refId = randomCode.toString().padStart(8, "0");

        const checkQuery = query(notificationsRef, where("refId", "==", refId));
        const checkSnapshot = await getDocs(checkQuery);

        if (checkSnapshot.empty) {
          return refId;
        }
        attempts++;
      }

      // Fallback
      const timestamp = Date.now();
      return timestamp.toString().slice(-8).padStart(8, "0");
    });
  } catch (error) {
    // Fallback if transaction fails
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    return (
      timestamp.toString().slice(-5) + randomSuffix.toString().padStart(3, "0")
    ).padStart(8, "0");
  }
};

/**
 * Ensure notification has an 8-digit refId (non-blocking update)
 */
const ensureRefId = async (
  notificationId: string,
  notificationData: any
): Promise<void> => {
  if (notificationData.refId) {
    const refIdStr = String(notificationData.refId);
    if (refIdStr.length === 8 && /^\d{8}$/.test(refIdStr)) {
      return; // Already has valid refId
    }
  }

  try {
    const newRefId = await generateUniqueRefId();
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, { refId: newRefId });
    console.log(`✅ Added refId ${newRefId} to notification ${notificationId}`);
  } catch (error) {
    console.error(
      `❌ Failed to update refId for notification ${notificationId}:`,
      error
    );
    // Don't throw - this is non-blocking
  }
};

/**
 * Fetch user name by ID/email from various collections
 * Searches across multiple collections and fields to find the user's name
 */
const fetchUserName = async (userId: string): Promise<string> => {
  if (!userId) return "غير معروف";

  try {
    // Strategy 1: If userId looks like a document ID (long alphanumeric), try direct document lookup
    if (userId.length > 15 && /^[a-zA-Z0-9]+$/.test(userId)) {
      // Try users collection by document ID
      try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const name = data.name || data.fullName || data.displayName;
          if (name) return name;
        }
      } catch (e) {
        // Continue to other methods
      }

      // Try companies collection by document ID
      try {
        const companyDocRef = doc(db, "companies", userId);
        const companyDoc = await getDoc(companyDocRef);
        if (companyDoc.exists()) {
          const data = companyDoc.data();
          const name = data.brandName || data.name;
          if (name) return name;
        }
      } catch (e) {
        // Continue to other methods
      }

      // Try clients collection by document ID
      try {
        const clientDocRef = doc(db, "clients", userId);
        const clientDoc = await getDoc(clientDocRef);
        if (clientDoc.exists()) {
          const data = clientDoc.data();
          const name = data.name || data.fullName;
          if (name) return name;
        }
      } catch (e) {
        // Continue to other methods
      }

      // Try fuelStationsWorkers collection by document ID
      try {
        const workerDocRef = doc(db, "fuelStationsWorkers", userId);
        const workerDoc = await getDoc(workerDocRef);
        if (workerDoc.exists()) {
          const data = workerDoc.data();
          const name =
            data.name || data.fullName || data.displayName || data.workerName;
          if (name) return name;
        }
      } catch (e) {
        // Continue to other methods
      }
    }

    // Strategy 2: Search by email across all collections
    if (userId.includes("@")) {
      // Search in users collection by email
      try {
        const usersRef = collection(db, "users");
        const qUserEmail = query(usersRef, where("email", "==", userId));
        const usersSnapshot = await getDocs(qUserEmail);
        if (!usersSnapshot.empty) {
          const data = usersSnapshot.docs[0].data();
          const name = data.name || data.fullName || data.displayName;
          if (name) return name;
        }
      } catch (e) {
        // Continue
      }

      // Search in companies collection by email
      try {
        const companiesRef = collection(db, "companies");
        const qByEmail = query(companiesRef, where("email", "==", userId));
        const companiesSnapshot = await getDocs(qByEmail);
        if (!companiesSnapshot.empty) {
          const data = companiesSnapshot.docs[0].data();
          const name = data.brandName || data.name;
          if (name) return name;
        }
      } catch (e) {
        // Continue
      }

      // Search in clients collection by email
      try {
        const clientsRef = collection(db, "clients");
        const qClientEmail = query(clientsRef, where("email", "==", userId));
        const clientsSnapshot = await getDocs(qClientEmail);
        if (!clientsSnapshot.empty) {
          const data = clientsSnapshot.docs[0].data();
          const name = data.name || data.fullName;
          if (name) return name;
        }
      } catch (e) {
        // Continue
      }

      // Search in fuelStationsWorkers collection by email
      try {
        const fuelWorkersRef = collection(db, "fuelStationsWorkers");
        const qWorkerEmail = query(
          fuelWorkersRef,
          where("email", "==", userId)
        );
        const workersSnapshot = await getDocs(qWorkerEmail);
        if (!workersSnapshot.empty) {
          const data = workersSnapshot.docs[0].data();
          const name =
            data.name || data.fullName || data.displayName || data.workerName;
          if (name) return name;
        }
      } catch (e) {
        // Continue
      }
    }

    // Strategy 3: Search by uid field (for companies and users)
    try {
      const companiesRef = collection(db, "companies");
      const qByUid = query(companiesRef, where("uid", "==", userId));
      const companiesSnapshot = await getDocs(qByUid);
      if (!companiesSnapshot.empty) {
        const data = companiesSnapshot.docs[0].data();
        const name = data.brandName || data.name;
        if (name) return name;
      }
    } catch (e) {
      // Continue
    }

    try {
      const usersRef = collection(db, "users");
      const qByUid = query(usersRef, where("uid", "==", userId));
      const usersSnapshot = await getDocs(qByUid);
      if (!usersSnapshot.empty) {
        const data = usersSnapshot.docs[0].data();
        const name = data.name || data.fullName || data.displayName;
        if (name) return name;
      }
    } catch (e) {
      // Continue
    }

    // Strategy 4: Search by id field in companies
    try {
      const companiesRef = collection(db, "companies");
      const qById = query(companiesRef, where("id", "==", userId));
      const companiesSnapshot = await getDocs(qById);
      if (!companiesSnapshot.empty) {
        const data = companiesSnapshot.docs[0].data();
        const name = data.brandName || data.name;
        if (name) return name;
      }
    } catch (e) {
      // Continue
    }

    // If we found the user but no name field, return email or userId
    // Otherwise return userId as fallback
    return userId;
  } catch (error) {
    console.error(`Error fetching user name for ${userId}:`, error);
    return userId;
  }
};

/**
 * Map notification data to table format
 * Handles missing fields gracefully and includes all features
 */
export const mapNotificationToTableFormat = (notification: any) => {
  try {
    // Use document ID as fallback for number if refId doesn't exist
    const refId =
      notification.refId ||
      notification.id?.slice(0, 8).padStart(8, "0") ||
      "00000000";

    // Try multiple possible field names
    const title =
      notification.title ||
      notification.Title ||
      notification.notificationTitle ||
      "--";
    const body =
      notification.body ||
      notification.Body ||
      notification.description ||
      notification.message ||
      "--";
    const createdDate =
      notification.createdDate || notification.createdAt || notification.date;
    const createdUserId =
      notification.createdUserId ||
      notification.creatorId ||
      notification.userId ||
      "";
    const targetedUsers =
      notification.targetedUsers ||
      notification.targetUsers ||
      notification.targeting;

    return {
      id: notification.id || "unknown",
      number: refId,
      title: title,
      description: body,
      creator: {
        name: notification.creatorName || createdUserId || "غير معروف",
        avatar: undefined,
      },
      targeting: getTargetingText(targetedUsers),
      lastSendDate: formatDate(createdDate),
      creationDate: formatDate(createdDate),
      // Keep original data for debugging
      originalData: notification,
    };
  } catch (error) {
    console.error(
      "Error mapping notification to table format:",
      error,
      notification
    );
    return {
      id: notification.id || "error",
      number: "00000000",
      title: "خطأ في البيانات",
      description: "فشل في تحميل بيانات الاشعار",
      creator: {
        name: "غير معروف",
        avatar: undefined,
      },
      targeting: "عام",
      lastSendDate: "--",
      creationDate: "--",
      originalData: notification,
    };
  }
};

/**
 * User item interface for notification targeting
 */
export interface UserItem {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  userType: "driver" | "service-provider" | "company" | "client";
}

/**
 * Fetch all drivers from companies-drivers collection for notification targeting
 */
export const fetchAllDriversForNotification = async (): Promise<UserItem[]> => {
  try {
    const driversRef = collection(db, "companies-drivers");
    const q = query(driversRef, orderBy("createdDate", "desc"));
    const querySnapshot = await getDocs(q);

    const drivers: UserItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const email = data.email || data.createdUserId || "";
      const name =
        data.name || data.fullName || data.displayName || email || doc.id;

      drivers.push({
        id: doc.id,
        email: email || doc.id, // Use email as primary identifier, fallback to doc ID
        name: name,
        avatar: data.avatar || data.profileImage || undefined,
        userType: "driver",
      });
    });

    return drivers;
  } catch (error) {
    console.error("Error fetching drivers for notification:", error);
    throw error;
  }
};

/**
 * Fetch all service providers from stationscompany collection for notification targeting
 */
export const fetchAllServiceProvidersForNotification = async (): Promise<
  UserItem[]
> => {
  try {
    const serviceProvidersRef = collection(db, "stationscompany");
    const q = query(serviceProvidersRef, orderBy("createdDate", "desc"));
    const querySnapshot = await getDocs(q);

    const serviceProviders: UserItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const email = data.email || data.createdUserId || "";
      const name =
        data.name || data.brandName || data.providerName || email || doc.id;

      serviceProviders.push({
        id: doc.id,
        email: email || doc.id,
        name: name,
        avatar: data.avatar || data.logo || data.profileImage || undefined,
        userType: "service-provider",
      });
    });

    return serviceProviders;
  } catch (error) {
    console.error("Error fetching service providers for notification:", error);
    throw error;
  }
};

/**
 * Fetch all companies from companies collection for notification targeting
 */
export const fetchAllCompaniesForNotification = async (): Promise<
  UserItem[]
> => {
  try {
    // Fetch companies directly without orderBy to avoid excluding companies without createdDate
    const companiesRef = collection(db, "companies");
    const querySnapshot = await getDocs(companiesRef);

    const companies: UserItem[] = [];
    querySnapshot.forEach((doc) => {
      const companyData = doc.data();
      if (!doc.id) {
        console.warn("Skipping company with no document ID");
        return;
      }

      const email =
        companyData.email || companyData.createdUserId || doc.id || "";
      const name =
        companyData.name ||
        companyData.brandName ||
        email ||
        doc.id ||
        "غير محدد";

      companies.push({
        id: doc.id,
        email: email,
        name: name,
        avatar:
          companyData.avatar ||
          companyData.logo ||
          companyData.profileImage ||
          undefined,
        userType: "company" as const,
      });
    });

    console.log(`✅ Fetched ${companies.length} companies for notification`);
    return companies;
  } catch (error) {
    console.error("Error fetching companies for notification:", error);
    throw error;
  }
};

/**
 * Fetch all clients from clients collection for notification targeting
 */
export const fetchAllClientsForNotification = async (): Promise<UserItem[]> => {
  try {
    const clients = await fetchAllClients();

    return clients.map((client: any) => {
      const email = client.email || client.createdUserId || "";
      const name =
        client.name ||
        client.fullName ||
        client.displayName ||
        email ||
        client.id;

      return {
        id: client.id,
        email: email || client.id,
        name: name,
        avatar: client.avatar || client.profileImage || undefined,
        userType: "client" as const,
      };
    });
  } catch (error) {
    console.error("Error fetching clients for notification:", error);
    throw error;
  }
};

/**
 * Get all client identifiers (emails/IDs) for notification targeting
 */
export const getAllClientIdentifiers = async (): Promise<string[]> => {
  try {
    const clients = await fetchAllClientsForNotification();
    return clients.map((client) => client.email || client.id).filter(Boolean);
  } catch (error) {
    console.error("Error getting client identifiers:", error);
    return [];
  }
};

/**
 * Get all company identifiers (emails/IDs) for notification targeting
 */
export const getAllCompanyIdentifiers = async (): Promise<string[]> => {
  try {
    const companies = await fetchAllCompaniesForNotification();
    return companies
      .map((company) => company.email || company.id)
      .filter(Boolean);
  } catch (error) {
    console.error("Error getting company identifiers:", error);
    return [];
  }
};

/**
 * Get all driver identifiers (emails/IDs) for notification targeting
 */
export const getAllDriverIdentifiers = async (): Promise<string[]> => {
  try {
    const drivers = await fetchAllDriversForNotification();
    return drivers.map((driver) => driver.email || driver.id).filter(Boolean);
  } catch (error) {
    console.error("Error getting driver identifiers:", error);
    return [];
  }
};

/**
 * Get all service provider identifiers (emails/IDs) for notification targeting
 */
export const getAllServiceProviderIdentifiers = async (): Promise<string[]> => {
  try {
    const serviceProviders = await fetchAllServiceProvidersForNotification();
    return serviceProviders.map((sp) => sp.email || sp.id).filter(Boolean);
  } catch (error) {
    console.error("Error getting service provider identifiers:", error);
    return [];
  }
};

/**
 * Create a new notification in Firestore
 * SIMPLIFIED: Directly save targetedUsers as provided - no transformations
 */
export const createNotification = async (notificationData: {
  title: string;
  body: string;
  targetedUsers: {
    clients?: string[];
    companies?: string[];
    "companies-drivers"?: string[];
    fuelStationsWorkers?: string[];
    stationscompany?: string[];
  };
}): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    // Generate refId
    const refId = await generateUniqueRefId();

    // SIMPLIFIED: Use targetedUsers directly - no transformations, no filtering
    // Empty arrays are valid and mean "all users of that type"
    const targetedUsers = notificationData.targetedUsers || {};

    // Build notification document - match existing structure exactly
    const notificationDoc = {
      title: notificationData.title,
      body: notificationData.body,
      targetedUsers: targetedUsers, // Direct assignment - no modifications
      createdUserId: currentUser.email || currentUser.uid,
      createdDate: Timestamp.now(),
      refId: refId,
      seeingUsers: [], // Initialize empty array for users who have seen the notification
    };

    // Add to Firestore
    const notificationsRef = collection(db, "notifications");
    const docRef = await addDoc(notificationsRef, notificationDoc);

    console.log("✅ Notification created with ID:", docRef.id);
    console.log("📄 Saved targetedUsers:", {
      keys: Object.keys(targetedUsers),
      clients: targetedUsers.clients,
      companies: targetedUsers.companies,
      "companies-drivers": targetedUsers["companies-drivers"],
      stationscompany: targetedUsers.stationscompany,
    });

    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw error;
  }
};
