import { Timestamp } from "firebase/firestore";

export interface InvoiceItem {
  product: string;
  quantity: number;
  pricePerUnit: number;
  amountBeforeTax: number;
  vat: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: "Client" | "Company Monthly Invoice" | "Subscription";
  createdAt: Date | Timestamp;
  // For clients
  clientData?: any;
  orderId?: string;
  refId?: string;
  // For companies
  companyData?: any;
  monthName?: string;
  orders?: any[];
  // Common
  items: InvoiceItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
}

