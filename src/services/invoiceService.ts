import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  getDoc,
  doc,
  Timestamp,
  runTransaction,
  limit,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Invoice, InvoiceItem } from "../types/invoice";
import {
  fetchOrdersForClient,
  fetchOrdersForCompany,
  fetchAllClients,
} from "./firestore";

/**
 * Calculate VAT amount
 * @param amount - Amount before tax
 * @param vatRate - VAT rate (default 15%)
 * @returns VAT amount
 */
export const calculateVAT = (amount: number, vatRate: number = 15): number => {
  return (amount * vatRate) / 100;
};

/**
 * Get the first day of a given month
 * @param date - Date object
 * @returns Date object representing the first day of the month
 */
const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Get the last day of a given month
 * @param date - Date object
 * @returns Date object representing the last day of the month
 */
export const getLastDayOfMonth = (date: Date): Date => {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month + 1, 0);
};

/**
 * Get the last day of a given month (end of month)
 * @param date - Date object
 * @returns Date object representing the last day of the month
 */
const endOfMonth = (date: Date): Date => {
  return getLastDayOfMonth(date);
};

/**
 * Get formatted month name (e.g., "November 2025")
 * @param date - Date object
 * @returns Formatted month name string
 */
export const getMonthName = (date: Date): string => {
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
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

/**
 * Get formatted month name in Arabic (e.g., "نوفمبر 2025")
 * @param date - Date object
 * @returns Formatted month name string in Arabic
 */
export const getMonthNameArabic = (date: Date): string => {
  const monthNamesArabic = [
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
  return `${monthNamesArabic[date.getMonth()]} - ${date.getFullYear()}`;
};

/**
 * Convert English month name to Arabic
 * @param englishMonthName - English month name (e.g., "January 2025")
 * @returns Arabic month name (e.g., "يناير - 2025")
 */
export const convertMonthNameToArabic = (englishMonthName: string): string => {
  const monthMap: { [key: string]: string } = {
    "January": "يناير",
    "February": "فبراير",
    "March": "مارس",
    "April": "أبريل",
    "May": "مايو",
    "June": "يونيو",
    "July": "يوليو",
    "August": "أغسطس",
    "September": "سبتمبر",
    "October": "أكتوبر",
    "November": "نوفمبر",
    "December": "ديسمبر",
  };

  // Extract month and year from "Month Year" format
  const parts = englishMonthName.trim().split(" ");
  if (parts.length >= 2) {
    const month = parts[0];
    const year = parts[parts.length - 1];
    const arabicMonth = monthMap[month] || month;
    return `${arabicMonth} - ${year}`;
  }
  
  // If format is different, try to find and replace month name
  for (const [english, arabic] of Object.entries(monthMap)) {
    if (englishMonthName.includes(english)) {
      return englishMonthName.replace(english, arabic);
    }
  }
  
  return englishMonthName; // Return as-is if no match found
};

/**
 * Identify if a companyUid belongs to a company or client
 * @param companyUid - The UID to check
 * @returns "company" | "client" | null
 */
export const identifyUserType = async (
  companyUid: string
): Promise<"company" | "client" | null> => {
  try {
    // Check companies collection by uid
    const companiesRef = collection(db, "companies");
    const companyQueryByUid = query(
      companiesRef,
      where("uid", "==", companyUid)
    );
    const companySnapshotByUid = await getDocs(companyQueryByUid);

    if (!companySnapshotByUid.empty) {
      return "company";
    }

    // Check companies collection by email
    const companyQueryByEmail = query(
      companiesRef,
      where("email", "==", companyUid)
    );
    const companySnapshotByEmail = await getDocs(companyQueryByEmail);

    if (!companySnapshotByEmail.empty) {
      return "company";
    }

    // Check clients collection by email
    const clientsRef = collection(db, "clients");
    const clientQueryByEmail = query(
      clientsRef,
      where("email", "==", companyUid)
    );
    const clientSnapshotByEmail = await getDocs(clientQueryByEmail);

    if (!clientSnapshotByEmail.empty) {
      return "client";
    }

    // Check clients collection by uid
    const clientQueryByUid = query(clientsRef, where("uid", "==", companyUid));
    const clientSnapshotByUid = await getDocs(clientQueryByUid);

    if (!clientSnapshotByUid.empty) {
      return "client";
    }

    return null;
  } catch (error) {
    console.error("Error identifying user type:", error);
    return null;
  }
};

/**
 * Generate unique 8-digit invoice number
 * @returns Promise with the generated invoice number
 */
export const generateInvoiceNumber = async (): Promise<string> => {
  try {
    return await runTransaction(db, async (transaction) => {
      const invoicesRef = collection(db, "invoices");
      const maxAttempts = 10;
      let attempts = 0;

      while (attempts < maxAttempts) {
        // Generate random 8-digit number (10000000 to 99999999)
        const randomCode = Math.floor(10000000 + Math.random() * 90000000);
        const invoiceNumber = randomCode.toString().padStart(8, "0");

        // Check if this invoice number already exists
        const checkQuery = query(
          invoicesRef,
          where("invoiceNumber", "==", invoiceNumber)
        );
        const checkSnapshot = await getDocs(checkQuery);

        if (checkSnapshot.empty) {
          // Unique invoice number found
          return invoiceNumber;
        }

        attempts++;
      }

      // Fallback: use timestamp-based 8-digit number if all attempts failed
      const timestamp = Date.now();
      const fallbackNumber = timestamp.toString().slice(-8).padStart(8, "0");
      console.warn(
        `Failed to generate unique invoice number after ${maxAttempts} attempts, using fallback: ${fallbackNumber}`
      );
      return fallbackNumber;
    });
  } catch (error) {
    console.error("Error generating invoice number:", error);
    // Fallback: use timestamp-based 8-digit number
    const timestamp = Date.now();
    return timestamp.toString().slice(-8).padStart(8, "0");
  }
};

/**
 * Extract product/service information from order
 * @param order - Order document
 * @returns Product name, quantity, price per unit, and amount before tax
 */
const extractOrderProductInfo = (
  order: any
): {
  product: string;
  quantity: number;
  pricePerUnit: number;
  amountBeforeTax: number;
} => {
  // Try different possible field names for product
  const product =
    order.selectedOption?.title?.ar ||
    order.selectedOption?.title ||
    order.product?.title?.ar ||
    order.product?.title ||
    order.productName ||
    order.service?.title?.ar ||
    order.service?.title ||
    order.category ||
    "منتج غير محدد";

  // Try different possible field names for quantity
  const quantity =
    order.quantity || order.totalLitre || order.liters || order.amount || 0;

  // Try different possible field names for price
  const totalPrice = order.totalPrice || order.totalCost || order.amount || 0;
  const pricePerUnit = quantity > 0 ? totalPrice / quantity : 0;
  const amountBeforeTax = totalPrice / 1.15; // Assuming total includes VAT

  return {
    product,
    quantity: Number(quantity),
    pricePerUnit: Number(pricePerUnit.toFixed(2)),
    amountBeforeTax: Number(amountBeforeTax.toFixed(2)),
  };
};

/**
 * Generate invoice for a single client order
 * @param order - Order document
 * @param clientData - Client data from clients collection
 * @returns Promise with the created invoice
 */
export const generateClientInvoice = async (
  order: any,
  clientData: any
): Promise<Invoice> => {
  try {
    const orderDate = order.orderDate?.toDate
      ? order.orderDate.toDate()
      : new Date(order.orderDate || Date.now());

    const invoiceNumber = await generateInvoiceNumber();

    const productInfo = extractOrderProductInfo(order);
    const vat = calculateVAT(productInfo.amountBeforeTax);
    const total = productInfo.amountBeforeTax + vat;

    const invoiceItem: InvoiceItem = {
      product: productInfo.product,
      quantity: productInfo.quantity,
      pricePerUnit: productInfo.pricePerUnit,
      amountBeforeTax: productInfo.amountBeforeTax,
      vat: Number(vat.toFixed(2)),
      total: Number(total.toFixed(2)),
    };

    // Clean clientData to remove undefined values
    const cleanClientData = Object.fromEntries(
      Object.entries(clientData || {}).filter(([_, v]) => v !== undefined)
    );

    // Get refId from client data (preferred) or from order (fallback)
    const clientRefId = 
      clientData.refId || 
      clientData.refid || 
      clientData.clientRefId ||
      order.refId || 
      order.refid || 
      undefined;

    const invoice: Omit<Invoice, "id"> = {
      invoiceNumber,
      type: "Client",
      createdAt: Timestamp.fromDate(orderDate),
      clientData: cleanClientData,
      orderId: order.id || order.docId,
      refId: clientRefId,
      items: [invoiceItem],
      subtotal: productInfo.amountBeforeTax,
      vatAmount: Number(vat.toFixed(2)),
      total: Number(total.toFixed(2)),
    };

    // Remove any undefined values from invoice before saving
    const cleanInvoice = Object.fromEntries(
      Object.entries(invoice).filter(([_, v]) => v !== undefined)
    ) as Omit<Invoice, "id">;

    const invoicesRef = collection(db, "invoices");
    const docRef = await addDoc(invoicesRef, cleanInvoice);

    return {
      id: docRef.id,
      ...cleanInvoice,
    };
  } catch (error) {
    console.error("Error generating client invoice:", error);
    throw error;
  }
};

/**
 * Generate monthly invoice for a company
 * @param companyId - Company ID or email
 * @param month - Target month date
 * @param orders - Array of orders for the month
 * @param companyData - Company data from companies collection
 * @returns Promise with the created invoice
 */
export const generateCompanyMonthlyInvoice = async (
  companyId: string,
  month: Date,
  orders: any[],
  companyData: any
): Promise<Invoice> => {
  try {
    const monthName = getMonthName(month);
    const lastDayOfMonth = getLastDayOfMonth(month);
    
    // Check for duplicate invoice before creating
    // Get company identifier from companyData (prefer uid, then email, then id)
    const companyIdentifier = 
      companyData?.uid || 
      companyData?.email || 
      companyData?.id || 
      companyId;
    
    // Fetch existing invoices for this company
    const existingInvoices = await fetchInvoices({
      type: "Company Monthly Invoice",
      companyUid: companyIdentifier,
    });
    
    // Check if invoice already exists for this month
    const year = month.getFullYear();
    const monthIndex = month.getMonth(); // 0-11
    
    const duplicateInvoice = existingInvoices.find((inv) => {
      // First check by monthName
      if (inv.monthName !== monthName) return false;
      
      // Verify by checking the createdAt date month/year
      const invDate = inv.createdAt instanceof Date
        ? inv.createdAt
        : inv.createdAt?.toDate
        ? inv.createdAt.toDate()
        : new Date(inv.createdAt || 0);
      
      const invYear = invDate.getFullYear();
      const invMonth = invDate.getMonth();
      
      if (invYear !== year || invMonth !== monthIndex) return false;
      
      // Double-check by comparing company identifiers
      const invCompanyId = 
        inv.companyData?.uid || 
        inv.companyData?.email || 
        inv.companyData?.id;
      
      return (
        invCompanyId === companyIdentifier ||
        invCompanyId === companyId ||
        companyData?.uid === invCompanyId ||
        companyData?.email === invCompanyId
      );
    });
    
    if (duplicateInvoice) {
      console.log(
        `⚠️ Invoice already exists for company ${companyIdentifier} for ${monthName}. Returning existing invoice.`
      );
      return duplicateInvoice;
    }
    
    const invoiceNumber = await generateInvoiceNumber();

    // Group orders by product
    const productMap = new Map<string, InvoiceItem>();

    orders.forEach((order) => {
      const productInfo = extractOrderProductInfo(order);
      const productKey = productInfo.product;

      if (productMap.has(productKey)) {
        const existing = productMap.get(productKey)!;
        existing.quantity += productInfo.quantity;
        existing.amountBeforeTax += productInfo.amountBeforeTax;
        existing.vat += calculateVAT(productInfo.amountBeforeTax);
        existing.total +=
          productInfo.amountBeforeTax +
          calculateVAT(productInfo.amountBeforeTax);
      } else {
        const vat = calculateVAT(productInfo.amountBeforeTax);
        const total = productInfo.amountBeforeTax + vat;
        productMap.set(productKey, {
          product: productInfo.product,
          quantity: productInfo.quantity,
          pricePerUnit: productInfo.pricePerUnit,
          amountBeforeTax: Number(productInfo.amountBeforeTax.toFixed(2)),
          vat: Number(vat.toFixed(2)),
          total: Number(total.toFixed(2)),
        });
      }
    });

    // Convert map to array and recalculate totals
    const items: InvoiceItem[] = Array.from(productMap.values()).map(
      (item) => ({
        ...item,
        amountBeforeTax: Number(item.amountBeforeTax.toFixed(2)),
        vat: Number(item.vat.toFixed(2)),
        total: Number(item.total.toFixed(2)),
      })
    );

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amountBeforeTax, 0);
    const vatAmount = items.reduce((sum, item) => sum + item.vat, 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);

    // Clean companyData to remove undefined values
    const cleanCompanyData = Object.fromEntries(
      Object.entries(companyData || {}).filter(([_, v]) => v !== undefined)
    );

    // Clean orders to remove undefined values and ensure id exists
    const cleanOrders = orders.map((o) => {
      const orderId = o.id || o.docId;
      const cleaned = Object.fromEntries(
        Object.entries({ ...o, id: orderId }).filter(
          ([_, v]) => v !== undefined
        )
      );
      return cleaned;
    });

    const invoice: Omit<Invoice, "id"> = {
      invoiceNumber,
      type: "Company Monthly Invoice",
      createdAt: Timestamp.fromDate(lastDayOfMonth),
      companyData: cleanCompanyData,
      monthName,
      orders: cleanOrders,
      items,
      subtotal: Number(subtotal.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };

    // Remove any undefined values from invoice before saving
    const cleanInvoice = Object.fromEntries(
      Object.entries(invoice).filter(([_, v]) => v !== undefined)
    ) as Omit<Invoice, "id">;

    const invoicesRef = collection(db, "invoices");
    const docRef = await addDoc(invoicesRef, cleanInvoice);

    return {
      id: docRef.id,
      ...cleanInvoice,
    };
  } catch (error) {
    console.error("Error generating company monthly invoice:", error);
    throw error;
  }
};

/**
 * Generate monthly sales invoice for a service distributer
 * @param serviceDistributerEmail - Service distributer email
 * @param month - Target month date
 * @param orders - Array of orders for the month from stationscompany-orders
 * @param serviceDistributerData - Service distributer data
 * @returns Promise with the created invoice
 */
export const generateServiceDistributerMonthlyInvoice = async (
  serviceDistributerEmail: string,
  month: Date,
  orders: any[],
  serviceDistributerData: any
): Promise<Invoice> => {
  try {
    const monthName = getMonthName(month);
    const lastDayOfMonth = getLastDayOfMonth(month);
    
    // Check for duplicate invoice before creating
    const existingInvoices = await fetchInvoices({
      type: "Service Distributer Monthly Invoice",
    });
    
    // Check if invoice already exists for this month
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    const duplicateInvoice = existingInvoices.find((inv) => {
      if (inv.monthName !== monthName) return false;
      
      const invDate = inv.createdAt instanceof Date
        ? inv.createdAt
        : inv.createdAt?.toDate
        ? inv.createdAt.toDate()
        : new Date(inv.createdAt || 0);
      
      const invYear = invDate.getFullYear();
      const invMonth = invDate.getMonth();
      
      if (invYear !== year || invMonth !== monthIndex) return false;
      
      const invServiceDistributerEmail = 
        inv.serviceDistributerData?.email ||
        inv.serviceDistributerData?.uid;
      
      return invServiceDistributerEmail === serviceDistributerEmail;
    });
    
    if (duplicateInvoice) {
      console.log(
        `⚠️ Invoice already exists for service distributer ${serviceDistributerEmail} for ${monthName}. Returning existing invoice.`
      );
      return duplicateInvoice;
    }
    
    const invoiceNumber = await generateInvoiceNumber();

    // Group orders by product (fuel type)
    const productMap = new Map<string, InvoiceItem>();

    orders.forEach((order) => {
      // Extract fuel type
      const fuelType = 
        order.selectedOption?.name?.ar ||
        order.selectedOption?.name?.en ||
        order.selectedOption?.title?.ar ||
        order.selectedOption?.title?.en ||
        order.service?.options?.find((opt: any) => 
          opt.id === order.selectedOption?.id || opt.refId === order.selectedOption?.refId
        )?.name?.ar ||
        order.service?.options?.find((opt: any) => 
          opt.id === order.selectedOption?.id || opt.refId === order.selectedOption?.refId
        )?.name?.en ||
        "غير محدد";
      
      const quantity = order.totalLitre || 0;
      const totalPrice = order.totalPrice || 0;
      
      // Calculate price per liter (before VAT)
      const pricePerUnit = quantity > 0 ? totalPrice / quantity / 1.15 : 0;
      const amountBeforeTax = totalPrice / 1.15; // Assuming total includes VAT
      
      if (productMap.has(fuelType)) {
        const existing = productMap.get(fuelType)!;
        existing.quantity += quantity;
        existing.amountBeforeTax += amountBeforeTax;
        existing.vat += calculateVAT(amountBeforeTax);
        existing.total += amountBeforeTax + calculateVAT(amountBeforeTax);
        // Recalculate price per unit for aggregated items
        existing.pricePerUnit = existing.quantity > 0 
          ? existing.amountBeforeTax / existing.quantity 
          : 0;
      } else {
        const vat = calculateVAT(amountBeforeTax);
        const total = amountBeforeTax + vat;
        productMap.set(fuelType, {
          product: fuelType,
          quantity: Number(quantity),
          pricePerUnit: Number(pricePerUnit.toFixed(2)),
          amountBeforeTax: Number(amountBeforeTax.toFixed(2)),
          vat: Number(vat.toFixed(2)),
          total: Number(total.toFixed(2)),
        });
      }
    });

    // Convert map to array
    const items: InvoiceItem[] = Array.from(productMap.values()).map(
      (item) => ({
        ...item,
        amountBeforeTax: Number(item.amountBeforeTax.toFixed(2)),
        vat: Number(item.vat.toFixed(2)),
        total: Number(item.total.toFixed(2)),
      })
    );

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amountBeforeTax, 0);
    const vatAmount = items.reduce((sum, item) => sum + item.vat, 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);

    // Clean service distributer data
    const cleanServiceDistributerData = Object.fromEntries(
      Object.entries(serviceDistributerData || {}).filter(([_, v]) => v !== undefined)
    );

    // Clean orders
    const cleanOrders = orders.map((o) => {
      const orderId = o.id || o.docId;
      return Object.fromEntries(
        Object.entries({ ...o, id: orderId }).filter(
          ([_, v]) => v !== undefined
        )
      );
    });

    const invoice: Omit<Invoice, "id"> = {
      invoiceNumber,
      type: "Service Distributer Monthly Invoice",
      createdAt: Timestamp.fromDate(lastDayOfMonth),
      serviceDistributerData: cleanServiceDistributerData,
      monthName,
      orders: cleanOrders,
      items,
      subtotal: Number(subtotal.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };

    // Remove any undefined values
    const cleanInvoice = Object.fromEntries(
      Object.entries(invoice).filter(([_, v]) => v !== undefined)
    ) as Omit<Invoice, "id">;

    const invoicesRef = collection(db, "invoices");
    const docRef = await addDoc(invoicesRef, cleanInvoice);

    return {
      id: docRef.id,
      ...cleanInvoice,
    };
  } catch (error) {
    console.error("Error generating service distributer monthly invoice:", error);
    throw error;
  }
};

/**
 * Generate monthly commission invoice for a service distributer
 * @param serviceDistributerEmail - Service distributer email
 * @param month - Target month date
 * @param orders - Array of orders for the month from stationscompany-orders
 * @param serviceDistributerData - Service distributer data
 * @returns Promise with the created invoice
 */
export const generateServiceDistributerCommissionInvoice = async (
  serviceDistributerEmail: string,
  month: Date,
  orders: any[],
  serviceDistributerData: any
): Promise<Invoice> => {
  try {
    const monthName = getMonthName(month);
    const lastDayOfMonth = getLastDayOfMonth(month);
    
    // Check for duplicate invoice before creating
    const existingInvoices = await fetchInvoices({
      type: "Service Distributer Commission Invoice",
    });
    
    // Check if invoice already exists for this month
    const invoiceYear = month.getFullYear();
    const monthIndex = month.getMonth();
    
    const duplicateInvoice = existingInvoices.find((inv) => {
      if (inv.monthName !== monthName) return false;
      
      const invDate = inv.createdAt instanceof Date
        ? inv.createdAt
        : inv.createdAt?.toDate
        ? inv.createdAt.toDate()
        : new Date(inv.createdAt || 0);
      
      const invYear = invDate.getFullYear();
      const invMonth = invDate.getMonth();
      
      if (invYear !== invoiceYear || invMonth !== monthIndex) return false;
      
      const invServiceDistributerEmail = 
        inv.serviceDistributerData?.email ||
        inv.serviceDistributerData?.uid;
      
      return invServiceDistributerEmail === serviceDistributerEmail;
    });
    
    if (duplicateInvoice) {
      console.log(
        `⚠️ Commission invoice already exists for service distributer ${serviceDistributerEmail} for ${monthName}. Returning existing invoice.`
      );
      return duplicateInvoice;
    }

    // Import commission settings helper
    const { fetchCommissionSettings } = await import("./firestore");
    let commissionSettings;
    try {
      commissionSettings = await fetchCommissionSettings();
    } catch (error) {
      console.warn("⚠️ Could not fetch commission settings, using defaults:", error);
      commissionSettings = { petrol: 0, diesel: 0 };
    }

    // Helper function to determine if fuel type is diesel
    const isDiesel = (fuelType: string): boolean => {
      const normalized = fuelType.toLowerCase().trim();
      return normalized.includes("ديزل") || normalized.includes("ديزيل") || normalized.includes("diesel");
    };

    // Helper function to normalize fuel type to standard categories
    const normalizeFuelType = (fuelType: string): string => {
      const normalized = fuelType.toLowerCase().trim();
      if (normalized.includes("ديزل") || normalized.includes("ديزيل") || normalized.includes("diesel")) {
        return "ديزل";
      } else if (normalized.includes("95")) {
        return "بنزين 95";
      } else if (normalized.includes("91")) {
        return "بنزين 91";
      }
      // Default to petrol if can't determine
      return "بنزين 91";
    };

    // Helper function to extract fuel type from order
    const extractFuelType = (order: any): string => {
      if (order.selectedOption?.name?.ar) {
        return order.selectedOption.name.ar;
      }
      if (order.selectedOption?.name?.en) {
        return order.selectedOption.name.en;
      }
      if (order.selectedOption?.title?.ar) {
        return order.selectedOption.title.ar;
      }
      if (order.selectedOption?.title?.en) {
        return order.selectedOption.title.en;
      }
      if (order.service?.title?.ar) {
        return order.service.title.ar;
      }
      if (order.service?.title?.en) {
        return order.service.title.en;
      }
      return "غير محدد";
    };

    // Group orders by normalized fuel type and calculate commission
    const fuelTypeMap = new Map<string, {
      quantity: number;
      totalCommission: number;
      commissionRate: number;
      productName: string;
    }>();

    orders.forEach((order) => {
      const fuelType = extractFuelType(order);
      const normalizedType = normalizeFuelType(fuelType);
      const liters = parseFloat(order.totalLitre || 0);
      
      if (isNaN(liters) || liters <= 0) return;

      // Get commission rate from order (stored at time of order) or use current settings
      const storedCommissionRate = order.commissionRateUsed;
      const commissionRate = storedCommissionRate !== undefined && storedCommissionRate !== null
        ? storedCommissionRate
        : isDiesel(fuelType)
        ? commissionSettings.diesel
        : commissionSettings.petrol;

      const commission = liters * commissionRate;

      if (fuelTypeMap.has(normalizedType)) {
        const existing = fuelTypeMap.get(normalizedType)!;
        existing.quantity += liters;
        existing.totalCommission += commission;
        // Use weighted average for commission rate if different rates were used
        const totalLiters = existing.quantity;
        existing.commissionRate = existing.totalCommission / totalLiters;
      } else {
        const productName = `خدمة تسويق ${normalizedType}`;
        fuelTypeMap.set(normalizedType, {
          quantity: liters,
          totalCommission: commission,
          commissionRate: commissionRate,
          productName: productName,
        });
      }
    });

    // Convert to invoice items
    const items: InvoiceItem[] = Array.from(fuelTypeMap.values()).map((item) => {
      const amountBeforeTax = item.totalCommission;
      const vat = calculateVAT(amountBeforeTax);
      const total = amountBeforeTax + vat;

      return {
        product: item.productName,
        quantity: Number(item.quantity.toFixed(2)),
        pricePerUnit: Number(item.commissionRate.toFixed(4)), // Commission rate per liter
        amountBeforeTax: Number(amountBeforeTax.toFixed(2)),
        vat: Number(vat.toFixed(2)),
        total: Number(total.toFixed(2)),
      };
    });

    // If no items, return null (no commission to invoice)
    if (items.length === 0) {
      console.log(`No commission items found for service distributer ${serviceDistributerEmail} for ${monthName}`);
      throw new Error("No commission items to invoice");
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amountBeforeTax, 0);
    const vatAmount = items.reduce((sum, item) => sum + item.vat, 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);

    // Generate invoice number in format COM-YYYY-XXX
    const year = month.getFullYear();
    const invoiceNumberBase = `COM-${year}-`;
    
    // Find the next available number for this year
    let invoiceNumber = "";
    let attempt = 1;
    const maxAttempts = 1000;
    
    while (attempt <= maxAttempts) {
      const candidateNumber = `${invoiceNumberBase}${String(attempt).padStart(3, "0")}`;
      
      // Check if this invoice number already exists
      const checkQuery = query(
        collection(db, "invoices"),
        where("invoiceNumber", "==", candidateNumber)
      );
      const checkSnapshot = await getDocs(checkQuery);
      
      if (checkSnapshot.empty) {
        invoiceNumber = candidateNumber;
        break;
      }
      
      attempt++;
    }
    
    if (!invoiceNumber) {
      // Fallback to timestamp-based number
      const timestamp = Date.now();
      invoiceNumber = `COM-${year}-${timestamp.toString().slice(-3)}`;
    }

    // Clean service distributer data
    const cleanServiceDistributerData = Object.fromEntries(
      Object.entries(serviceDistributerData || {}).filter(([_, v]) => v !== undefined)
    );

    // Clean orders
    const cleanOrders = orders.map((o) => {
      const orderId = o.id || o.docId;
      return Object.fromEntries(
        Object.entries({ ...o, id: orderId }).filter(
          ([_, v]) => v !== undefined
        )
      );
    });

    const invoice: Omit<Invoice, "id"> = {
      invoiceNumber,
      type: "Service Distributer Commission Invoice",
      createdAt: Timestamp.fromDate(lastDayOfMonth),
      serviceDistributerData: cleanServiceDistributerData,
      monthName,
      orders: cleanOrders,
      items,
      subtotal: Number(subtotal.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };

    // Remove any undefined values
    const cleanInvoice = Object.fromEntries(
      Object.entries(invoice).filter(([_, v]) => v !== undefined)
    ) as Omit<Invoice, "id">;

    const invoicesRef = collection(db, "invoices");
    const docRef = await addDoc(invoicesRef, cleanInvoice);

    console.log(`✅ Created commission invoice ${invoiceNumber} for ${monthName}`);

    return {
      id: docRef.id,
      ...cleanInvoice,
    };
  } catch (error) {
    console.error("Error generating service distributer commission invoice:", error);
    throw error;
  }
};

/**
 * Create invoice in Firestore
 * @param invoiceData - Invoice data to save
 * @returns Promise with the created invoice document ID
 */
export const createInvoice = async (
  invoiceData: Omit<Invoice, "id">
): Promise<string> => {
  try {
    const invoicesRef = collection(db, "invoices");
    const docRef = await addDoc(invoicesRef, invoiceData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
};

/**
 * Fetch invoices with optional filters
 * @param filters - Optional filters for type, companyUid, clientId, or serviceDistributerEmail
 * @returns Promise with array of invoices
 */
export const fetchInvoices = async (filters?: {
  type?: string;
  companyUid?: string;
  clientId?: string;
  serviceDistributerEmail?: string;
}): Promise<Invoice[]> => {
  try {
    const invoicesRef = collection(db, "invoices");
    let invoices: Invoice[] = [];

    // Avoid composite index issues by fetching all and filtering in memory
    // This is more reliable and doesn't require index setup
    try {
      const q = query(invoicesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      snapshot.forEach((doc) => {
        const data = doc.data();
        invoices.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt || Date.now()),
        } as Invoice);
      });
    } catch (error: any) {
      // If orderBy fails, try without it
      if (error.code === "failed-precondition") {
        console.warn("Index not found, fetching all invoices without ordering");
        const snapshot = await getDocs(invoicesRef);
        snapshot.forEach((doc) => {
          const data = doc.data();
          invoices.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt || Date.now()),
          } as Invoice);
        });
        // Sort in memory
        invoices.sort((a, b) => {
          const dateA =
            a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB =
            b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
      } else {
        throw error;
      }
    }

    // Apply all filters in memory to avoid index issues
    if (filters) {
      if (filters.type) {
        invoices = invoices.filter((inv) => inv.type === filters.type);
      }
      if (filters.companyUid) {
        invoices = invoices.filter(
          (inv) =>
            inv.companyData?.uid === filters.companyUid ||
            inv.companyData?.email === filters.companyUid ||
            inv.companyData?.id === filters.companyUid
        );
      }
      if (filters.clientId) {
        invoices = invoices.filter(
          (inv) =>
            inv.clientData?.email === filters.clientId ||
            inv.clientData?.uid === filters.clientId
        );
      }
      if (filters.serviceDistributerEmail) {
        invoices = invoices.filter(
          (inv) =>
            inv.serviceDistributerData?.email === filters.serviceDistributerEmail ||
            inv.serviceDistributerData?.uid === filters.serviceDistributerEmail
        );
      }
    }

    return invoices;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
};

/**
 * Fetch single invoice by ID
 * @param invoiceId - Invoice document ID
 * @returns Promise with invoice or null if not found
 */
export const fetchInvoiceById = async (
  invoiceId: string
): Promise<Invoice | null> => {
  try {
    // First, try to fetch from invoices collection
    const invoiceRef = doc(db, "invoices", invoiceId);
    const invoiceSnap = await getDoc(invoiceRef);

    if (invoiceSnap.exists()) {
      const data = invoiceSnap.data();
      return {
        id: invoiceSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date(data.createdAt || Date.now()),
      } as Invoice;
    }

    // If not found in invoices collection, check if it's a subscription payment
    // Import fetchAllSubscriptionPayments dynamically to avoid circular dependencies
    const { fetchAllSubscriptionPayments } = await import("./firestore");
    const subscriptionPayments = await fetchAllSubscriptionPayments();
    const subscriptionPayment = subscriptionPayments.find(sp => sp.id === invoiceId);

    if (subscriptionPayment) {
      // Helper function to extract text from language objects
      const extractText = (value: any): string => {
        if (!value) return "-";
        if (typeof value === "string") return value;
        if (typeof value === "object") {
          if (value.ar && value.ar.trim() !== "") return value.ar;
          if (value.en && value.en.trim() !== "") return value.en;
          if (value.name) {
            if (typeof value.name === "string" && value.name.trim() !== "") return value.name;
            if (value.name.ar && value.name.ar.trim() !== "") return value.name.ar;
            if (value.name.en && value.name.en.trim() !== "") return value.name.en;
          }
          return "-";
        }
        return String(value);
      };

      const createdAt = subscriptionPayment.createdDate?.toDate 
        ? subscriptionPayment.createdDate.toDate() 
        : subscriptionPayment.createdDate instanceof Date 
        ? subscriptionPayment.createdDate 
        : new Date();

      // Transform subscription payment to invoice format
      return {
        id: subscriptionPayment.id,
        type: "Subscription",
        createdAt,
        companyData: subscriptionPayment.company || {},
        clientData: null,
        items: [{
          product: extractText(subscriptionPayment.selectedSubscription?.title) || "اشتراك",
          packageName: extractText(subscriptionPayment.selectedSubscription?.title) || "اشتراك",
          period: extractText(subscriptionPayment.selectedSubscription?.periodName) || "شهري",
          periodValueInDays: subscriptionPayment.selectedSubscription?.periodValueInDays || 30,
          startDate: subscriptionPayment.subscriptionStartDate?.toDate 
            ? subscriptionPayment.subscriptionStartDate.toDate().toLocaleDateString('ar-SA')
            : subscriptionPayment.subscriptionStartDate instanceof Date
            ? subscriptionPayment.subscriptionStartDate.toLocaleDateString('ar-SA')
            : "",
          endDate: subscriptionPayment.subscriptionEndDate?.toDate 
            ? subscriptionPayment.subscriptionEndDate.toDate().toLocaleDateString('ar-SA')
            : subscriptionPayment.subscriptionEndDate instanceof Date
            ? subscriptionPayment.subscriptionEndDate.toLocaleDateString('ar-SA')
            : "",
          description: extractText(subscriptionPayment.selectedSubscription?.description) || "اشتراك نظام إدارة الأسطول",
        }],
        subtotal: (subscriptionPayment.totalPrice || 0) - (subscriptionPayment.vat || 0),
        vatAmount: subscriptionPayment.vat || 0,
        total: subscriptionPayment.totalPrice || 0,
        subscriptionPaymentId: subscriptionPayment.id,
        invoiceNumber: `SUB-${subscriptionPayment.id.substring(0, 8)}`,
        refId: subscriptionPayment.id,
      } as Invoice;
    }

    // If not found in either collection, return null
    return null;
  } catch (error) {
    console.error("Error fetching invoice by ID:", error);
    throw error;
  }
};

/**
 * Process invoices for a specific client
 * @param clientId - Client ID or email
 * @returns Promise with array of created invoice IDs
 */
export const processClientOrders = async (
  clientId: string
): Promise<string[]> => {
  try {
    const orders = await fetchOrdersForClient(clientId);
    const clients = await fetchAllClients();
    const client = clients.find(
      (c) => c.email === clientId || c.uid === clientId || c.id === clientId
    );

    if (!client) {
      console.warn(`Client not found: ${clientId}`);
      return [];
    }

    const createdInvoiceIds: string[] = [];

    // Check existing invoices for this client
    const existingInvoices = await fetchInvoices({ clientId });
    const existingOrderIds = new Set(
      existingInvoices
        .filter((inv) => inv.type === "Client")
        .map((inv) => inv.orderId)
        .filter(Boolean)
    );

    for (const order of orders) {
      // Skip if invoice already exists for this order
      if (existingOrderIds.has(order.id)) {
        continue;
      }

      try {
        const invoice = await generateClientInvoice(order, client);
        createdInvoiceIds.push(invoice.id);
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
      }
    }

    return createdInvoiceIds;
  } catch (error) {
    console.error("Error processing client orders:", error);
    throw error;
  }
};

/**
 * Process monthly invoice for a specific company
 * @param companyId - Company ID or email
 * @param targetMonth - Target month date
 * @returns Promise with created invoice ID or null if already exists
 */
export const processCompanyMonthlyInvoices = async (
  companyId: string,
  targetMonth: Date
): Promise<string | null> => {
  try {
    // Check if invoice already exists for this month
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);

    const existingInvoices = await fetchInvoices({
      type: "Company Monthly Invoice",
      companyUid: companyId,
    });

    const monthName = getMonthName(targetMonth);
    const existingInvoice = existingInvoices.find(
      (inv) => inv.monthName === monthName
    );

    if (existingInvoice) {
      console.log(
        `Invoice already exists for company ${companyId} for ${monthName}`
      );
      return null;
    }

    // Fetch company data
    const companiesRef = collection(db, "companies");
    const companyQuery = query(
      companiesRef,
      where("uid", "==", companyId).or(where("email", "==", companyId))
    );
    const companySnapshot = await getDocs(companyQuery);

    if (companySnapshot.empty) {
      console.warn(`Company not found: ${companyId}`);
      return null;
    }

    const companyData = {
      id: companySnapshot.docs[0].id,
      ...companySnapshot.docs[0].data(),
    };

    // Fetch orders for the month
    const allOrders = await fetchOrdersForCompany(companyId);
    const monthOrders = allOrders.filter((order) => {
      const orderDate = order.orderDate?.toDate
        ? order.orderDate.toDate()
        : new Date(order.orderDate || 0);
      return orderDate >= monthStart && orderDate <= monthEnd;
    });

    if (monthOrders.length === 0) {
      console.log(`No orders found for company ${companyId} in ${monthName}`);
      return null;
    }

    const invoice = await generateCompanyMonthlyInvoice(
      companyId,
      targetMonth,
      monthOrders,
      companyData
    );

    return invoice.id;
  } catch (error) {
    console.error("Error processing company monthly invoices:", error);
    throw error;
  }
};

/**
 * Process invoices for all clients
 * @returns Promise with total number of invoices created
 */
export const processAllClientInvoices = async (): Promise<number> => {
  try {
    const clients = await fetchAllClients();
    let totalCreated = 0;

    for (const client of clients) {
      const clientId = client.email || client.uid || client.id;
      if (clientId) {
        try {
          const createdIds = await processClientOrders(clientId);
          totalCreated += createdIds.length;
        } catch (error) {
          console.error(`Error processing client ${clientId}:`, error);
        }
      }
    }

    return totalCreated;
  } catch (error) {
    console.error("Error processing all client invoices:", error);
    throw error;
  }
};

/**
 * Process monthly invoices for all companies
 * @param targetMonth - Target month date
 * @returns Promise with total number of invoices created
 */
export const processAllCompanyMonthlyInvoices = async (
  targetMonth: Date
): Promise<number> => {
  try {
    const companiesRef = collection(db, "companies");
    const companiesSnapshot = await getDocs(companiesRef);
    let totalCreated = 0;

    companiesSnapshot.forEach(async (companyDoc) => {
      const companyData = companyDoc.data();
      const companyId = companyData.uid || companyData.email || companyDoc.id;

      if (companyId) {
        try {
          const invoiceId = await processCompanyMonthlyInvoices(
            companyId,
            targetMonth
          );
          if (invoiceId) {
            totalCreated++;
          }
        } catch (error) {
          console.error(`Error processing company ${companyId}:`, error);
        }
      }
    });

    return totalCreated;
  } catch (error) {
    console.error("Error processing all company monthly invoices:", error);
    throw error;
  }
};

/**
 * Delete duplicate monthly invoices, keeping only one per company per month
 * Keeps the most recent invoice (by createdAt date) for each company/month combination
 * @returns Promise with summary of deleted invoices
 */
export const deleteDuplicateMonthlyInvoices = async (): Promise<{
  totalDuplicates: number;
  deletedCount: number;
  errors: string[];
  details: Array<{
    companyId: string;
    monthName: string;
    keptInvoiceId: string;
    deletedInvoiceIds: string[];
  }>;
}> => {
  try {
    console.log("🔄 Starting duplicate monthly invoice cleanup...");

    // Fetch all monthly invoices
    const allInvoices = await fetchInvoices({
      type: "Company Monthly Invoice",
    });

    console.log(`📊 Found ${allInvoices.length} monthly invoices`);

    // Group invoices by company and month
    // Use a more flexible grouping that handles different company identifier formats
    const invoiceGroups = new Map<string, Invoice[]>();

    for (const invoice of allInvoices) {
      // Get all possible company identifiers
      const companyUid = invoice.companyData?.uid;
      const companyEmail = invoice.companyData?.email;
      const companyId = invoice.companyData?.id;
      
      // Primary identifier (prefer uid, then email, then id)
      const primaryCompanyId = companyUid || companyEmail || companyId || "unknown";

      // Get month key (YYYY-MM format) from createdAt date
      const invoiceDate =
        invoice.createdAt instanceof Date
          ? invoice.createdAt
          : invoice.createdAt?.toDate
          ? invoice.createdAt.toDate()
          : new Date(invoice.createdAt || 0);

      const year = invoiceDate.getFullYear();
      const month = invoiceDate.getMonth() + 1; // 1-12
      const monthKey = `${year}-${month.toString().padStart(2, "0")}`;

      // Create group key using primary identifier and month
      // Also include monthName for additional verification
      const groupKey = `${primaryCompanyId}_${monthKey}_${invoice.monthName || ""}`;

      if (!invoiceGroups.has(groupKey)) {
        invoiceGroups.set(groupKey, []);
      }
      invoiceGroups.get(groupKey)!.push(invoice);
    }

    // Second pass: Merge groups that represent the same company/month but with different identifiers
    // This handles cases where some invoices have uid and others have email for the same company
    const mergedGroups = new Map<string, Invoice[]>();
    
    invoiceGroups.forEach((invoices, groupKey) => {
      if (invoices.length === 0) return;
      
      // Try to find an existing group with matching company data
      let merged = false;
      for (const [existingKey, existingInvoices] of mergedGroups.entries()) {
        const firstExisting = existingInvoices[0];
        const firstNew = invoices[0];
        
        // Check if they're for the same company (by comparing all identifiers)
        const sameCompany =
          (firstExisting.companyData?.uid && firstExisting.companyData?.uid === firstNew.companyData?.uid) ||
          (firstExisting.companyData?.email && firstExisting.companyData?.email === firstNew.companyData?.email) ||
          (firstExisting.companyData?.id && firstExisting.companyData?.id === firstNew.companyData?.id) ||
          (firstExisting.companyData?.uid === firstNew.companyData?.email) ||
          (firstExisting.companyData?.email === firstNew.companyData?.uid);
        
        // Check if same month
        const existingDate = firstExisting.createdAt instanceof Date
          ? firstExisting.createdAt
          : firstExisting.createdAt?.toDate
          ? firstExisting.createdAt.toDate()
          : new Date(firstExisting.createdAt || 0);
        const newDate = firstNew.createdAt instanceof Date
          ? firstNew.createdAt
          : firstNew.createdAt?.toDate
          ? firstNew.createdAt.toDate()
          : new Date(firstNew.createdAt || 0);
        
        const sameMonth = 
          existingDate.getFullYear() === newDate.getFullYear() &&
          existingDate.getMonth() === newDate.getMonth();
        
        if (sameCompany && sameMonth) {
          // Merge into existing group
          existingInvoices.push(...invoices);
          merged = true;
          break;
        }
      }
      
      if (!merged) {
        // Create new group
        mergedGroups.set(groupKey, invoices);
      }
    });

    // Find duplicates and prepare for deletion
    const duplicatesToDelete: Array<{
      companyId: string;
      monthName: string;
      keptInvoice: Invoice;
      duplicates: Invoice[];
    }> = [];

    mergedGroups.forEach((invoices, groupKey) => {
      if (invoices.length > 1) {
        // Sort by createdAt date (most recent first)
        invoices.sort((a, b) => {
          const dateA =
            a.createdAt instanceof Date
              ? a.createdAt
              : a.createdAt?.toDate
              ? a.createdAt.toDate()
              : new Date(a.createdAt || 0);
          const dateB =
            b.createdAt instanceof Date
              ? b.createdAt
              : b.createdAt?.toDate
              ? b.createdAt.toDate()
              : new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

        // Keep the first one (most recent), mark others for deletion
        const keptInvoice = invoices[0];
        const duplicates = invoices.slice(1);

        const companyId =
          keptInvoice.companyData?.uid ||
          keptInvoice.companyData?.email ||
          keptInvoice.companyData?.id ||
          "unknown";

        duplicatesToDelete.push({
          companyId,
          monthName: keptInvoice.monthName || "unknown",
          keptInvoice,
          duplicates,
        });
      }
    });

    console.log(
      `🔍 Found ${duplicatesToDelete.length} groups with duplicates`
    );

    // Delete duplicates
    const deletedInvoiceIds: string[] = [];
    const errors: string[] = [];
    const details: Array<{
      companyId: string;
      monthName: string;
      keptInvoiceId: string;
      deletedInvoiceIds: string[];
    }> = [];

    for (const group of duplicatesToDelete) {
      const groupDeletedIds: string[] = [];

      for (const duplicate of group.duplicates) {
        try {
          const invoiceRef = doc(db, "invoices", duplicate.id);
          await deleteDoc(invoiceRef);
          deletedInvoiceIds.push(duplicate.id);
          groupDeletedIds.push(duplicate.id);
          console.log(
            `✅ Deleted duplicate invoice ${duplicate.id} (${duplicate.invoiceNumber}) for company ${group.companyId}, month ${group.monthName}`
          );
        } catch (error: any) {
          const errorMsg = `Error deleting invoice ${duplicate.id}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      details.push({
        companyId: group.companyId,
        monthName: group.monthName,
        keptInvoiceId: group.keptInvoice.id,
        deletedInvoiceIds: groupDeletedIds,
      });
    }

    const totalDuplicates = duplicatesToDelete.reduce(
      (sum, group) => sum + group.duplicates.length,
      0
    );

    console.log("\n✅ Duplicate cleanup completed!");
    console.log(`📊 Summary:`);
    console.log(`   - Total duplicate invoices found: ${totalDuplicates}`);
    console.log(`   - Successfully deleted: ${deletedInvoiceIds.length}`);
    console.log(`   - Errors: ${errors.length}`);

    return {
      totalDuplicates,
      deletedCount: deletedInvoiceIds.length,
      errors,
      details,
    };
  } catch (error: any) {
    console.error("❌ Error deleting duplicate monthly invoices:", error);
    throw error;
  }
};
