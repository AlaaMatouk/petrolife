import { Invoice } from '@axenda/zatca';
import { Timestamp } from 'firebase/firestore';

/**
 * Seller information constants for ZATCA QR code generation
 */
export const SELLER_INFO = {
  name: 'شركة إنجازات الحلول التقنية المعلومات',
  vatRegistrationNumber: '300000000000003',
} as const;

/**
 * Interface for invoice data required for QR code generation
 */
export interface ZatcaInvoiceData {
  sellerName: string;
  vatRegistrationNumber: string;
  invoiceTimestamp: string; // ISO 8601 format
  invoiceTotal: string; // Total amount including VAT
  invoiceVatTotal: string; // VAT amount
}

/**
 * Converts a Date or Firestore Timestamp to ISO 8601 format
 * @param date - Date object or Firestore Timestamp
 * @returns ISO 8601 formatted string (YYYY-MM-DDTHH:mm:ssZ)
 */
export const formatTimestampToISO = (date: Date | Timestamp | undefined): string => {
  if (!date) {
    return new Date().toISOString();
  }

  let dateObj: Date;
  if (date instanceof Date) {
    dateObj = date;
  } else if (date && typeof date === 'object' && 'toDate' in date) {
    dateObj = (date as Timestamp).toDate();
  } else {
    dateObj = new Date();
  }

  return dateObj.toISOString();
};

/**
 * Formats a number to string with 2 decimal places for ZATCA QR code
 * @param amount - Numeric amount
 * @returns Formatted string with 2 decimal places
 */
export const formatAmount = (amount: number | undefined): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0.00';
  }
  return amount.toFixed(2);
};

/**
 * Generates a ZATCA-compliant QR code in Base64 format
 * @param invoiceData - Invoice data containing seller info, VAT details, timestamp, and amounts
 * @returns Promise that resolves to Base64-encoded QR code image data URI, or null on error
 */
export const generateZatcaQr = async (
  invoiceData: Partial<ZatcaInvoiceData>
): Promise<string | null> => {
  try {
    // Validate required fields
    const sellerName = invoiceData.sellerName || SELLER_INFO.name;
    const vatRegistrationNumber = invoiceData.vatRegistrationNumber || SELLER_INFO.vatRegistrationNumber;
    const invoiceTimestamp = invoiceData.invoiceTimestamp;
    const invoiceTotal = invoiceData.invoiceTotal || '0.00';
    const invoiceVatTotal = invoiceData.invoiceVatTotal || '0.00';

    if (!invoiceTimestamp) {
      console.error('ZATCA QR Generation: Missing invoice timestamp');
      return null;
    }

    // Create Invoice instance with ZATCA-compliant data
    const invoice = new Invoice({
      sellerName,
      vatRegistrationNumber,
      invoiceTimestamp,
      invoiceTotal,
      invoiceVatTotal,
    });

    // Generate QR code as Base64 data URI
    const qrCodeDataUri = await invoice.render();
    return qrCodeDataUri;
  } catch (error) {
    console.error('Error generating ZATCA QR code:', error);
    return null;
  }
};

/**
 * Helper function to generate QR code from Invoice object
 * Extracts necessary data from Invoice type and generates QR code
 * @param invoice - Invoice object from the application
 * @param createdAt - Invoice creation date/timestamp
 * @returns Promise that resolves to Base64-encoded QR code image data URI, or null on error
 */
export const generateZatcaQrFromInvoice = async (
  invoice: {
    total: number;
    vatAmount: number;
  },
  createdAt: Date | Timestamp | undefined
): Promise<string | null> => {
  const invoiceTimestamp = formatTimestampToISO(createdAt);
  const invoiceTotal = formatAmount(invoice.total);
  const invoiceVatTotal = formatAmount(invoice.vatAmount);

  return generateZatcaQr({
    sellerName: SELLER_INFO.name,
    vatRegistrationNumber: SELLER_INFO.vatRegistrationNumber,
    invoiceTimestamp,
    invoiceTotal,
    invoiceVatTotal,
  });
};

