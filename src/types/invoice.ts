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
  type: "Client" | "Company Monthly Invoice" | "Subscription" | "Service Distributer Monthly Invoice" | "Service Distributer Commission Invoice";
  createdAt: Date | Timestamp;
  // For clients
  clientData?: any;
  orderId?: string;
  refId?: string;
  // For companies
  companyData?: any;
  monthName?: string;
  orders?: any[];
  // For service distributers
  serviceDistributerData?: any;
  // Common
  items: InvoiceItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
}

