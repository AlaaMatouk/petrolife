import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Clock,
  Wallet,
  Percent,
  SlidersHorizontal,
  Paperclip,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { SummaryCard } from "../../components/shared/SummaryCard/SummaryCard";
import { Tabs } from "../../components/shared/Tabs/Tabs";
import { DateInput } from "../../components/shared/DateInput/DateInput";
import { RTLSelect } from "../../components/shared/Form/RTLSelect";
import { FuelTypeIcon } from "../../components/shared/FuelTypeIcon/FuelTypeIcon";
import { Table } from "../../components/shared/Table/Table";
import { Pagination } from "../../components/shared/Pagination/Pagination";
import { fetchOperationsData, processServiceDistributerMonthlyInvoice, generateAllServiceDistributerMonthlyInvoices, generateAllServiceDistributerCommissionInvoices, waitForAuthState, fetchCurrentStationsCompany, updateStationsCompanyBalance, calculateStationsCompanyTotalCommissions, calculateStationsCompanyBalanceChange, fetchServiceDistributerTransfers, ServiceDistributerTransferRequest } from "../../services/firestore";
import { LoadingSpinner } from "../../components/shared/Spinner/LoadingSpinner";
import { OrderDetailsModal } from "./components/OrderDetailsModal";
import { fetchInvoices, convertMonthNameToArabic } from "../../services/invoiceService";
import { Invoice } from "../../types/invoice";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { useToast } from "../../context/ToastContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

// Operation interface
interface Operation {
  id: string;
  operationNumber: string;
  stationName: string;
  dateTime: string;
  fuelType: string;
  liters: string;
  totalOperation: string;
  totalCommission: string;
  originalOrder?: any; // Full order data from Firestore
}

// Sales Invoice interface
interface SalesInvoice {
  id: string;
  reportNumber: string;
  invoiceNumber: string;
  reportPeriod: string;
  monthName?: string;
  hasAttachment: boolean;
  attachmentUrl?: string;
  createdAt?: Date | any; // For sorting
}

// Purchase Invoice interface
interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  invoicePeriod: string;
  commissionValue: number;
  status: "paid" | "under_review";
}

// Payment interface (matching ServiceDistributerTransferRequest)
interface Payment {
  id: string;
  transferNumber: string;
  transferDate: string;
  transferValue: number;
  status: "pending" | "transferred";
  receiptUrl?: string;
}

// Mock data
const mockOperations: Operation[] = [
  {
    id: "1",
    operationNumber: "2024001567",
    stationName: "محطة الشرق",
    dateTime: "2024/03/15 - 14:30",
    fuelType: "بنزين 91",
    liters: "45.5",
    totalOperation: "98.50",
    totalCommission: "2.46",
  },
  {
    id: "2",
    operationNumber: "2024001566",
    stationName: "محطة الغرب",
    dateTime: "2024/03/15 - 14:00",
    fuelType: "بنزين 95",
    liters: "38.2",
    totalOperation: "95.00",
    totalCommission: "2.39",
  },
  {
    id: "3",
    operationNumber: "2024001565",
    stationName: "محطة الشمال",
    dateTime: "2024/03/15 - 14:30",
    fuelType: "بنزين 98",
    liters: "53.8",
    totalOperation: "132.00",
    totalCommission: "3.30",
  },
  {
    id: "4",
    operationNumber: "2024001564",
    stationName: "محطة الشرق",
    dateTime: "2024/03/15 - 14:30",
    fuelType: "ديزل",
    liters: "68.5",
    totalOperation: "115.20",
    totalCommission: "2.88",
  },
  {
    id: "5",
    operationNumber: "2024001563",
    stationName: "محطة الغرب",
    dateTime: "2024/03/15 - 14:30",
    fuelType: "بنزين 91",
    liters: "41.3",
    totalOperation: "89.50",
    totalCommission: "2.24",
  },
  {
    id: "6",
    operationNumber: "2024001562",
    stationName: "محطة الشمال",
    dateTime: "2024/03/15 - 14:30",
    fuelType: "بنزين 95",
    liters: "36.7",
    totalOperation: "91.75",
    totalCommission: "2.29",
  },
  {
    id: "7",
    operationNumber: "2024001561",
    stationName: "محطة الشرق",
    dateTime: "2024/03/15 - 14:30",
    fuelType: "ديزل",
    liters: "55.2",
    totalOperation: "110.40",
    totalCommission: "2.76",
  },
  {
    id: "8",
    operationNumber: "2024001560",
    stationName: "محطة الغرب",
    dateTime: "2024/03/15 - 14:30",
    fuelType: "بنزين 91",
    liters: "48.9",
    totalOperation: "105.90",
    totalCommission: "2.65",
  },
];


// Sales invoices will be loaded from Firestore

// Mock purchase invoices data
const mockPurchaseInvoices: PurchaseInvoice[] = [
  { id: "1", invoiceNumber: "#INV-PL-2024-3", invoicePeriod: "2024 مارس", commissionValue: 2345.75, status: "paid" },
  { id: "2", invoiceNumber: "#INV-PL-2024-2", invoicePeriod: "2024 فبراير", commissionValue: 3125.45, status: "paid" },
  { id: "3", invoiceNumber: "#INV-PL-2024-1", invoicePeriod: "2024 يناير", commissionValue: 2890.20, status: "under_review" },
  { id: "4", invoiceNumber: "#INV-PL-2023-12", invoicePeriod: "2023 ديسمبر", commissionValue: 3456.80, status: "paid" },
  { id: "5", invoiceNumber: "#INV-PL-2023-11", invoicePeriod: "2023 نوفمبر", commissionValue: 2789.30, status: "paid" },
  { id: "6", invoiceNumber: "#INV-PL-2023-10", invoicePeriod: "2023 أكتوبر", commissionValue: 3210.15, status: "paid" },
  { id: "7", invoiceNumber: "#INV-PL-2023-9", invoicePeriod: "2023 سبتمبر", commissionValue: 2987.60, status: "paid" },
  { id: "8", invoiceNumber: "#INV-PL-2023-8", invoicePeriod: "2023 أغسطس", commissionValue: 2678.90, status: "paid" },
];

// Mock payments data
// mockPayments removed - using real data from Firestore

function ServiceDistributerFinancialReports() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    // Get tab from URL params, default to "operations"
    return searchParams.get("tab") || "operations";
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [salesInvoicePage, setSalesInvoicePage] = useState(1);
  const [purchaseInvoicePage, setPurchaseInvoicePage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [operationNumberSearch, setOperationNumberSearch] = useState("");
  const [selectedStation, setSelectedStation] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoadingOperations, setIsLoadingOperations] = useState(true);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [isLoadingSalesInvoices, setIsLoadingSalesInvoices] = useState(false);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [isLoadingPurchaseInvoices, setIsLoadingPurchaseInvoices] = useState(false);
  const [stationOptions, setStationOptions] = useState<Array<{ value: string; label: string }>>([
    { value: "all", label: "جميع المحطات" },
  ]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [totalCommissions, setTotalCommissions] = useState<number | null>(null);
  const [isLoadingCommissions, setIsLoadingCommissions] = useState(true);
  const [balanceChange, setBalanceChange] = useState<{
    currentBalance: number;
    lastMonthBalance: number;
    percentageChange: number;
    absoluteDifference: number;
    isIncrease: boolean;
  } | null>(null);
  const [isLoadingBalanceChange, setIsLoadingBalanceChange] = useState(true);

  const itemsPerPage = 8;
  const totalSalesInvoices = salesInvoices.length;
  const totalPurchaseInvoices = purchaseInvoices.length;
  const [transfers, setTransfers] = useState<ServiceDistributerTransferRequest[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true);
  const totalPayments = transfers.length;

  // Fetch current balance on component mount and sync it
  useEffect(() => {
    const loadBalance = async () => {
      try {
        setIsLoadingBalance(true);
        const currentUser = await waitForAuthState();
        if (!currentUser || !currentUser.email) {
          setCurrentBalance(0);
          return;
        }

        // Sync balance in background (non-blocking)
        updateStationsCompanyBalance(currentUser.email).catch((error) => {
          console.error("Error syncing balance:", error);
          // Don't show error to user, just log it
        });

        // Fetch current balance from document
        const company = await fetchCurrentStationsCompany();
        if (company) {
          const balance = company.balance ?? 0;
          setCurrentBalance(balance);
        } else {
          setCurrentBalance(0);
        }
      } catch (error) {
        console.error("Error loading balance:", error);
        setCurrentBalance(0);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    loadBalance();
  }, []);

  // Fetch total commissions on component mount
  useEffect(() => {
    const loadTotalCommissions = async () => {
      try {
        setIsLoadingCommissions(true);
        const currentUser = await waitForAuthState();
        if (!currentUser || !currentUser.email) {
          setTotalCommissions(0);
          return;
        }

        const total = await calculateStationsCompanyTotalCommissions(currentUser.email);
        setTotalCommissions(total);
      } catch (error) {
        console.error("Error loading total commissions:", error);
        setTotalCommissions(0);
        addToast({
          title: "خطأ",
          message: "فشل في تحميل إجمالي العمولات المخصومة",
          type: "error",
        });
      } finally {
        setIsLoadingCommissions(false);
      }
    };

    loadTotalCommissions();
  }, [addToast]);

  // Fetch balance change data on component mount
  useEffect(() => {
    const loadBalanceChange = async () => {
      try {
        setIsLoadingBalanceChange(true);
        const currentUser = await waitForAuthState();
        if (!currentUser || !currentUser.email) {
          setBalanceChange({
            currentBalance: 0,
            lastMonthBalance: 0,
            percentageChange: 0,
            absoluteDifference: 0,
            isIncrease: false,
          });
          return;
        }

        const changeData = await calculateStationsCompanyBalanceChange(currentUser.email);
        setBalanceChange(changeData);
      } catch (error) {
        console.error("Error loading balance change:", error);
        setBalanceChange({
          currentBalance: 0,
          lastMonthBalance: 0,
          percentageChange: 0,
          isIncrease: false,
        });
        addToast({
          title: "خطأ",
          message: "فشل في تحميل بيانات تغيير الرصيد",
          type: "error",
        });
      } finally {
        setIsLoadingBalanceChange(false);
      }
    };

    loadBalanceChange();
  }, [addToast]);

  // Fetch transfers data on component mount
  useEffect(() => {
    const loadTransfers = async () => {
      try {
        setIsLoadingTransfers(true);
        const currentUser = await waitForAuthState();
        if (!currentUser || !currentUser.email) {
          setTransfers([]);
          return;
        }

        const fetchedTransfers = await fetchServiceDistributerTransfers(currentUser.email);
        setTransfers(fetchedTransfers);
      } catch (error) {
        console.error("Error loading transfers:", error);
        setTransfers([]);
        addToast({
          title: "خطأ",
          message: "فشل في تحميل بيانات التحويلات",
          type: "error",
        });
      } finally {
        setIsLoadingTransfers(false);
      }
    };

    loadTransfers();
  }, [addToast]);

  // Fetch operations data on component mount
  useEffect(() => {
    const loadOperations = async () => {
      try {
        setIsLoadingOperations(true);
        const fetchedOperations = await fetchOperationsData();
        setOperations(fetchedOperations);

        // Extract unique station names from operations
        const uniqueStations = Array.from(
          new Set(
            fetchedOperations
              .map((op) => op.stationName)
              .filter((name) => name && name !== "غير محدد")
          )
        ).sort();

        // Update station options
        setStationOptions([
          { value: "all", label: "جميع المحطات" },
          ...uniqueStations.map((station) => ({
            value: station,
            label: station,
          })),
        ]);
      } catch (error) {
        console.error("Error loading operations:", error);
        setOperations([]);
      } finally {
        setIsLoadingOperations(false);
      }
    };

    loadOperations();
  }, []);

  // Fetch sales invoices on component mount and when tab changes
  useEffect(() => {
    const loadSalesInvoices = async () => {
      if (activeTab !== "sales-invoices") return;
      
      try {
        setIsLoadingSalesInvoices(true);
        const currentUser = await waitForAuthState();
        if (!currentUser || !currentUser.email) {
          setSalesInvoices([]);
          return;
        }

        // Automatically generate invoices for any missing months
        try {
          await generateAllServiceDistributerMonthlyInvoices();
        } catch (error) {
          console.error("Error auto-generating invoices:", error);
          // Don't show error to user, just log it - invoices will be loaded anyway
        }

        // Then fetch all invoices
        const invoices = await fetchInvoices({
          type: "Service Distributer Monthly Invoice",
          serviceDistributerEmail: currentUser.email,
        });

        // Transform invoices to SalesInvoice format
        const transformedInvoices: SalesInvoice[] = invoices.map((invoice: Invoice) => ({
          id: invoice.id,
          reportNumber: `INV-${invoice.invoiceNumber}`,
          invoiceNumber: invoice.invoiceNumber,
          reportPeriod: invoice.monthName 
            ? convertMonthNameToArabic(invoice.monthName) 
            : "غير محدد",
          monthName: invoice.monthName,
          hasAttachment: !!(invoice as any).attachmentUrl, // Check if attachment URL exists
          attachmentUrl: (invoice as any).attachmentUrl,
          createdAt: invoice.createdAt, // Store original date for sorting
        }));

        // Sort by date (newest first) - using createdAt date
        transformedInvoices.sort((a, b) => {
          const dateA = a.createdAt instanceof Date 
            ? a.createdAt 
            : a.createdAt?.toDate 
            ? a.createdAt.toDate() 
            : new Date(a.createdAt || 0);
          
          const dateB = b.createdAt instanceof Date 
            ? b.createdAt 
            : b.createdAt?.toDate 
            ? b.createdAt.toDate() 
            : new Date(b.createdAt || 0);
          
          // Sort descending (newest first)
          return dateB.getTime() - dateA.getTime();
        });

        setSalesInvoices(transformedInvoices);
      } catch (error) {
        console.error("Error loading sales invoices:", error);
        addToast({
          title: "خطأ",
          message: "فشل في تحميل فواتير البيع",
          type: "error",
        });
        setSalesInvoices([]);
      } finally {
        setIsLoadingSalesInvoices(false);
      }
    };

    loadSalesInvoices();
  }, [activeTab, addToast]);

  // Fetch purchase invoices (commission invoices) on component mount and when tab changes
  useEffect(() => {
    const loadPurchaseInvoices = async () => {
      if (activeTab !== "purchase-invoices") return;
      
      try {
        setIsLoadingPurchaseInvoices(true);
        const currentUser = await waitForAuthState();
        if (!currentUser || !currentUser.email) {
          setPurchaseInvoices([]);
          return;
        }

        // Automatically generate invoices for any missing months
        try {
          await generateAllServiceDistributerCommissionInvoices();
        } catch (error) {
          console.error("Error auto-generating commission invoices:", error);
          // Don't show error to user, just log it - invoices will be loaded anyway
        }

        // Then fetch all commission invoices
        const invoices = await fetchInvoices({
          type: "Service Distributer Commission Invoice",
          serviceDistributerEmail: currentUser.email,
        });

        // Transform invoices to PurchaseInvoice format
        const transformedInvoices: PurchaseInvoice[] = invoices.map((invoice: Invoice) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoicePeriod: invoice.monthName 
            ? convertMonthNameToArabic(invoice.monthName) 
            : "غير محدد",
          commissionValue: invoice.subtotal, // Commission value is the subtotal (before VAT)
          status: "under_review" as const, // Default status, can be updated later
        }));

        // Sort by date (newest first) - using createdAt date
        transformedInvoices.sort((a, b) => {
          const invoiceA = invoices.find(inv => inv.id === a.id);
          const invoiceB = invoices.find(inv => inv.id === b.id);
          
          const dateA = invoiceA?.createdAt instanceof Date 
            ? invoiceA.createdAt 
            : invoiceA?.createdAt?.toDate 
            ? invoiceA.createdAt.toDate() 
            : new Date(invoiceA?.createdAt || 0);
          
          const dateB = invoiceB?.createdAt instanceof Date 
            ? invoiceB.createdAt 
            : invoiceB?.createdAt?.toDate 
            ? invoiceB.createdAt.toDate() 
            : new Date(invoiceB?.createdAt || 0);
          
          // Sort descending (newest first)
          return dateB.getTime() - dateA.getTime();
        });

        setPurchaseInvoices(transformedInvoices);
      } catch (error) {
        console.error("Error loading purchase invoices:", error);
        addToast({
          title: "خطأ",
          message: "فشل في تحميل فواتير الشراء",
          type: "error",
        });
        setPurchaseInvoices([]);
      } finally {
        setIsLoadingPurchaseInvoices(false);
      }
    };

    loadPurchaseInvoices();
  }, [activeTab, addToast]);

  const tabs = [
    { id: "operations", label: "العمليات" },
    { id: "sales-invoices", label: "فواتير البيع" },
    { id: "purchase-invoices", label: "فواتير الشراء" },
    { id: "payments", label: "الدفعات" },
  ];

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab) {
      setSearchParams({ tab: activeTab });
    }
  }, [activeTab, setSearchParams]);

  // Filter operations
  const filteredOperations = useMemo(() => {
    let filtered = [...operations];

    if (searchQuery) {
      filtered = filtered.filter(
        (op) =>
          op.stationName.includes(searchQuery) ||
          op.operationNumber.includes(searchQuery)
      );
    }

    if (operationNumberSearch) {
      filtered = filtered.filter((op) =>
        op.operationNumber.includes(operationNumberSearch)
      );
    }

    if (selectedStation !== "all") {
      filtered = filtered.filter(
        (op) => op.stationName === selectedStation
      );
    }

    return filtered;
  }, [operations, searchQuery, operationNumberSearch, selectedStation]);

  const totalOperations = filteredOperations.length;

  // Paginate operations
  const paginatedOperations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOperations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOperations, currentPage]);

  const totalPages = Math.ceil(filteredOperations.length / itemsPerPage);

  // Paginate sales invoices
  const paginatedSalesInvoices = useMemo(() => {
    const startIndex = (salesInvoicePage - 1) * itemsPerPage;
    return salesInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [salesInvoices, salesInvoicePage]);

  const totalSalesInvoicePages = Math.ceil(totalSalesInvoices / itemsPerPage);

  // Paginate purchase invoices
  const paginatedPurchaseInvoices = useMemo(() => {
    const startIndex = (purchaseInvoicePage - 1) * itemsPerPage;
    return purchaseInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [purchaseInvoices, purchaseInvoicePage]);

  const totalPurchaseInvoicePages = Math.ceil(totalPurchaseInvoices / itemsPerPage);

  // Paginate payments (convert transfers to Payment format)
  const paginatedPayments = useMemo(() => {
    const startIndex = (paymentPage - 1) * itemsPerPage;
    const payments: Payment[] = transfers.map((transfer) => {
      // Format date
      let transferDate = "غير محدد";
      if (transfer.createdAt) {
        try {
          const dateObj = transfer.createdAt.toDate
            ? transfer.createdAt.toDate()
            : new Date(transfer.createdAt);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          transferDate = `${year}/${month}/${day}`;
        } catch (error) {
          console.error("Error formatting date:", error);
        }
      }

      return {
        id: transfer.id,
        transferNumber: transfer.transferNumber,
        transferDate: transferDate,
        transferValue: transfer.transferAmount,
        status: transfer.status,
        receiptUrl: transfer.receiptUrl,
      };
    });

    return payments.slice(startIndex, startIndex + itemsPerPage);
  }, [transfers, paymentPage]);

  const totalPaymentPages = Math.ceil(totalPayments / itemsPerPage);

  // Calculate pending transfers data
  const pendingTransfersData = useMemo(() => {
    const pending = transfers.filter((t) => t.status === "pending");
    const totalAmount = pending.reduce((sum, t) => sum + (t.transferAmount || 0), 0);
    const count = pending.length;
    return { totalAmount, count };
  }, [transfers]);

  const handleReset = () => {
    setSearchQuery("");
    setOperationNumberSearch("");
    setSelectedStation("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const handleViewDetails = (operationId: string) => {
    const operation = operations.find((op) => op.id === operationId);
    if (operation) {
      setSelectedOrder(operation);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleViewReport = (invoiceId: string) => {
    navigate(`${ROUTES.FUEL_INVOICE_DETAIL.replace(":id", invoiceId)}?tab=${activeTab}`);
  };

  const handleViewCommissionInvoice = (invoiceId: string) => {
    navigate(`${ROUTES.COMMISSION_INVOICE_DETAIL.replace(":id", invoiceId)}?tab=${activeTab}`);
  };

  const handleViewAttachment = (invoiceId: string) => {
    const invoice = salesInvoices.find((inv) => inv.id === invoiceId);
    if (invoice?.attachmentUrl) {
      window.open(invoice.attachmentUrl, "_blank");
    } else {
      addToast({
        title: "خطأ",
        message: "المرفق غير متاح",
        type: "error",
      });
    }
  };

  const handleUploadAttachment = async (invoiceId: string) => {
    try {
      // Create a hidden file input element
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/pdf";
      input.style.display = "none";

      // Handle file selection
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) {
          return;
        }

        // Validate file type
        if (file.type !== "application/pdf") {
          addToast({
            title: "خطأ",
            message: "يجب أن يكون الملف بصيغة PDF فقط",
            type: "error",
          });
          return;
        }

        // Validate file size (e.g., max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          addToast({
            title: "خطأ",
            message: "حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت",
            type: "error",
          });
          return;
        }

        try {
          setUploadingInvoiceId(invoiceId);
          
          // Get current user for organizing storage
          const currentUser = await waitForAuthState();
          if (!currentUser || !currentUser.email) {
            throw new Error("المستخدم غير مسجل الدخول");
          }

          // Create storage path
          const timestamp = Date.now();
          const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const storagePath = `service-distributer-invoices/${currentUser.email}/${invoiceId}/${timestamp}-${sanitizedFileName}`;
          
          // Upload to Firebase Storage
          const storageRef = ref(storage, storagePath);
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);

          // Update invoice document in Firestore
          const invoiceRef = doc(db, "invoices", invoiceId);
          await updateDoc(invoiceRef, {
            attachmentUrl: downloadURL,
          });

          // Update local state
          setSalesInvoices((prev) =>
            prev.map((inv) =>
              inv.id === invoiceId
                ? { ...inv, hasAttachment: true, attachmentUrl: downloadURL }
                : inv
            )
          );

          addToast({
            title: "نجح",
            message: "تم رفع المرفق بنجاح",
            type: "success",
          });
        } catch (error: any) {
          console.error("Error uploading attachment:", error);
          addToast({
            title: "خطأ",
            message: error.message || "فشل في رفع المرفق",
            type: "error",
          });
        } finally {
          setUploadingInvoiceId(null);
        }
      };

      // Trigger file input click
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    } catch (error: any) {
      console.error("Error setting up file upload:", error);
      addToast({
        title: "خطأ",
        message: "حدث خطأ أثناء إعداد رفع الملف",
        type: "error",
      });
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log("Download invoice:", invoiceId);
    // TODO: Download invoice file
  };

  const handleDownloadReceipt = (paymentId: string) => {
    console.log("Download receipt for payment:", paymentId);
    // TODO: Download receipt file
  };

  // Helper function to format currency
  const formatCurrency = (value: number): string => {
    const formatted = new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return `ر.س ${formatted}`;
  };

  // Helper function to format balance for display
  const formatBalance = (value: number): string => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  // Sales Invoice table columns
  const salesInvoiceColumns = [
    {
      key: "attachment",
      label: "المرفق",
      width: "w-48 min-w-[180px]",
      render: (_: any, row: SalesInvoice) => (
        <div className="flex items-center justify-center">
          {row.hasAttachment ? (
            <button
              onClick={() => handleViewAttachment(row.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
              aria-label="عرض المرفق"
            >
              <Paperclip className="w-4 h-4" />
              <span>عرض المرفق</span>
            </button>
          ) : (
            <button
              onClick={() => handleUploadAttachment(row.id)}
              disabled={uploadingInvoiceId === row.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors ${
                uploadingInvoiceId === row.id ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label="رفع المرفق"
            >
              {uploadingInvoiceId === row.id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الرفع...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>رفع المرفق</span>
                </>
              )}
            </button>
          )}
        </div>
      ),
    },
    {
      key: "viewReport",
      label: "عرض التقرير",
      width: "w-48 min-w-[180px]",
      headerRender: () => (
        <div className="flex items-center justify-start gap-2">
          <span>عرض التقرير</span>
          <div className="flex flex-col">
            <ChevronUp className="w-3 h-3 text-gray-600" />
            <ChevronDown className="w-3 h-3 text-gray-600 -mt-1" />
          </div>
        </div>
      ),
      render: (_: any, row: SalesInvoice) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => handleViewReport(row.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-sm font-medium transition-colors"
            aria-label="عرض التقرير"
          >
            <Eye className="w-4 h-4" />
            <span>عرض التقرير</span>
          </button>
        </div>
      ),
    },
    {
      key: "reportPeriod",
      label: "فترة التقرير",
      width: "flex-1 grow min-w-[180px]",
      headerRender: () => (
        <div className="flex items-center justify-start gap-2">
          <span>فترة التقرير</span>
          <div className="flex flex-col">
            <ChevronUp className="w-3 h-3 text-gray-600" />
            <ChevronDown className="w-3 h-3 text-gray-600 -mt-1" />
          </div>
        </div>
      ),
      render: (_: any, row: SalesInvoice) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          {row.reportPeriod}
        </span>
      ),
    },
    {
      key: "reportNumber",
      label: "رقم التقرير",
      width: "flex-1 grow min-w-[200px]",
      render: (_: any, row: SalesInvoice) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          {row.reportNumber}
        </span>
      ),
    },
  ];

  // Purchase Invoice table columns
  const purchaseInvoiceColumns = [
    {
      key: "viewInvoice",
      label: "عرض الفاتورة",
      width: "w-48 min-w-[180px]",
      render: (_: any, row: PurchaseInvoice) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => handleViewCommissionInvoice(row.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-sm font-medium transition-colors"
            aria-label="عرض الفاتورة"
          >
            <Eye className="w-4 h-4" />
            <span>عرض الفاتورة</span>
          </button>
        </div>
      ),
    },
    {
      key: "commissionValue",
      label: "قيمة العمولات",
      width: "flex-1 grow min-w-[180px]",
      headerRender: () => (
        <div className="flex items-center justify-start gap-2">
          <span>قيمة العمولات</span>
          <div className="flex flex-col">
            <ChevronUp className="w-3 h-3 text-gray-600" />
            <ChevronDown className="w-3 h-3 text-gray-600 -mt-1" />
          </div>
        </div>
      ),
      render: (_: any, row: PurchaseInvoice) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          {formatCurrency(row.commissionValue)}
        </span>
      ),
    },
    {
      key: "invoicePeriod",
      label: "فترة الفاتورة",
      width: "flex-1 grow min-w-[180px]",
      headerRender: () => (
        <div className="flex items-center justify-start gap-2">
          <span>فترة الفاتورة</span>
          <div className="flex flex-col">
            <ChevronUp className="w-3 h-3 text-gray-600" />
            <ChevronDown className="w-3 h-3 text-gray-600 -mt-1" />
          </div>
        </div>
      ),
      render: (_: any, row: PurchaseInvoice) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          {row.invoicePeriod}
        </span>
      ),
    },
    {
      key: "invoiceNumber",
      label: "رقم الفاتورة",
      width: "flex-1 grow min-w-[200px]",
      headerRender: () => (
        <div className="flex items-center justify-start gap-2">
          <span>رقم الفاتورة</span>
          <div className="flex flex-col">
            <ChevronUp className="w-3 h-3 text-gray-600" />
            <ChevronDown className="w-3 h-3 text-gray-600 -mt-1" />
          </div>
        </div>
      ),
      render: (_: any, row: PurchaseInvoice) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          {row.invoiceNumber}
        </span>
      ),
    },
  ];

  // Payment table columns
  const paymentColumns = [
    {
      key: "receipt",
      label: "إيصال التحويل",
      width: "w-40 min-w-[160px]",
      render: (_: any, row: Payment) => (
        <div className="flex items-center justify-center">
          {row.receiptUrl ? (
            <button
              onClick={() => window.open(row.receiptUrl, "_blank")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              aria-label="تحميل الإيصال"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">تحميل الإيصال</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">غير متاح</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "حالة التحويل",
      width: "w-40 min-w-[160px]",
      render: (_: any, row: Payment) => (
        <div className="flex items-center justify-center">
          {row.status === "transferred" ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-green-700 text-sm font-medium">تم التحويل</span>
            </div>
          ) : row.status === "pending" ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700 text-sm font-medium">قيد المعالجة</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700 text-sm font-medium">غير محدد</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "transferValue",
      label: "قيمة التحويل",
      width: "flex-1 grow min-w-[180px]",
      headerRender: () => (
        <div className="flex items-center justify-start gap-2">
          <span>قيمة التحويل</span>
          <div className="flex flex-col">
            <ChevronUp className="w-3 h-3 text-gray-600" />
            <ChevronDown className="w-3 h-3 text-gray-600 -mt-1" />
          </div>
        </div>
      ),
      render: (_: any, row: Payment) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          {formatCurrency(row.transferValue)}
        </span>
      ),
    },
    {
      key: "transferDate",
      label: "تاريخ التحويل",
      width: "flex-1 grow min-w-[180px]",
      headerRender: () => (
        <div className="flex items-center justify-start gap-2">
          <span>تاريخ التحويل</span>
          <div className="flex flex-col">
            <ChevronUp className="w-3 h-3 text-gray-600" />
            <ChevronDown className="w-3 h-3 text-gray-600 -mt-1" />
          </div>
        </div>
      ),
      render: (_: any, row: Payment) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          {row.transferDate}
        </span>
      ),
    },
    {
      key: "transferNumber",
      label: "رقم التحويل",
      width: "flex-1 grow min-w-[200px]",
      headerRender: () => (
        <div className="flex items-center justify-start gap-2">
          <span>رقم التحويل</span>
          <div className="flex flex-col">
            <ChevronUp className="w-3 h-3 text-gray-600" />
            <ChevronDown className="w-3 h-3 text-gray-600 -mt-1" />
          </div>
        </div>
      ),
      render: (_: any, row: Payment) => (
        <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          {row.transferNumber}
        </span>
      ),
    },
  ];

  // Operations table columns
  const columns = [
    {
      key: "actions",
      label: "إجراءات",
      render: (_: any, row: Operation) => (
        <button
          onClick={() => handleViewDetails(row.id)}
          className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded transition-colors"
          aria-label="عرض التفاصيل"
        >
          <Eye className="w-4 h-4 text-color-mode-text-icons-t-sec" />
        </button>
      ),
    },
    {
      key: "totalCommission",
      label: "إجمالي العمولة",
      render: (_: any, row: Operation) => (
        <span className="text-orange-600">{row.totalCommission} ر.س</span>
      ),
    },
    {
      key: "totalOperation",
      label: "إجمالي العملية",
      render: (_: any, row: Operation) => (
        <span className="text-color-mode-text-icons-t-blue">
          {row.totalOperation} ر.س
        </span>
      ),
    },
    {
      key: "liters",
      label: "عدد اللترات",
      render: (_: any, row: Operation) => (
        <span className="text-color-mode-text-icons-t-blue">{row.liters}</span>
      ),
    },
    {
      key: "fuelType",
      label: "نوع الوقود",
      render: (_: any, row: Operation) => (
        <FuelTypeIcon fuelType={row.fuelType} />
      ),
    },
    {
      key: "dateTime",
      label: "التاريخ والوقت",
      render: (_: any, row: Operation) => (
        <span className="text-color-mode-text-icons-t-blue">
          {row.dateTime}
        </span>
      ),
    },
    {
      key: "stationName",
      label: "اسم المحطة",
      render: (_: any, row: Operation) => (
        <span className="text-color-mode-text-icons-t-blue">
          {row.stationName}
        </span>
      ),
    },
    {
      key: "operationNumber",
      label: "رقم العملية",
      render: (_: any, row: Operation) => (
        <span className="text-color-mode-text-icons-t-blue">
          {row.operationNumber}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full items-start gap-6" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <div className="p-2 rounded-xl border border-solid border-gray-200 bg-gray-50">
          <SummaryCard
            title="رصيد المحفظة الحالي"
            value={
              isLoadingBalance
                ? "..."
                : currentBalance !== null
                ? formatBalance(currentBalance)
                : "0"
            }
            currency="ر.س"
            icon={
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
            }
          />
        </div>
        <div className="p-2 rounded-xl border border-solid border-gray-200 bg-gray-50">
          <SummaryCard
            title="الدفعات الجاري تحويلها"
            value={
              isLoadingTransfers
                ? "..."
                : formatBalance(pendingTransfersData.totalAmount)
            }
            currency="ر.س"
            icon={
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            }
            additionalInfo={
              isLoadingTransfers
                ? "..."
                : pendingTransfersData.count > 0
                ? `${pendingTransfersData.count} ${pendingTransfersData.count === 1 ? "دفعة" : "دفعات"} قيد المعالجة`
                : "لا توجد دفعات قيد المعالجة"
            }
          />
        </div>
        <div className="p-2 rounded-xl border border-solid border-gray-200 bg-gray-50">
          <SummaryCard
            title="إجمالي رصيد المحفظة"
            value={
              isLoadingBalanceChange
                ? "..."
                : balanceChange !== null
                ? formatBalance(balanceChange.currentBalance)
                : "0"
            }
            currency="ر.س"
            icon={
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            }
            additionalInfo={
              isLoadingBalanceChange
                ? "..."
                : balanceChange !== null
                ? balanceChange.lastMonthBalance === 0 && balanceChange.currentBalance === 0
                  ? "بدون بيانات"
                  : balanceChange.lastMonthBalance === 0 && balanceChange.currentBalance > 0
                  ? "بدون بيانات سابقة"
                  : `${balanceChange.isIncrease ? "+" : ""}${formatBalance(Math.abs(balanceChange.absoluteDifference))} ر.س (${balanceChange.isIncrease ? "+" : ""}${balanceChange.percentageChange.toFixed(1)} %) عن الشهر الماضي`
                : "0 ر.س (0 %) عن الشهر الماضي"
            }
            additionalInfoIcon={
              isLoadingBalanceChange ? undefined : balanceChange !== null && balanceChange.lastMonthBalance > 0 ? (
                balanceChange.isIncrease ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : balanceChange.percentageChange < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : undefined
              ) : undefined
            }
          />
        </div>
        <div className="p-2 rounded-xl border border-solid border-gray-200 bg-gray-50">
          <SummaryCard
            title="إجمالي العمولات المخصومة"
            value={
              isLoadingCommissions
                ? "..."
                : totalCommissions !== null
                ? formatBalance(totalCommissions)
                : "0"
            }
            currency="ر.س"
            icon={
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Percent className="w-5 h-5 text-orange-600" />
              </div>
            }
          />
        </div>
      </div>

      {/* Content Section with Border Frame */}
      <div className="w-full rounded-xl border border-solid border-gray-200 bg-white overflow-hidden">
        {/* Tabs */}
        <div className="w-full">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        {/* Divider line under tabs */}
        <div className="w-full h-[1px] bg-gray-200"></div>

        {/* Filter Bar - Only show in operations tab */}
        {activeTab === "operations" && (
          <>
        <div className="w-full p-4">
          <div className="flex flex-col gap-4">
            {/* First row: All filter inputs (reversed) */}
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <DateInput
                  label="إلى تاريخ"
                  value={toDate}
                  onChange={setToDate}
                  placeholder="mm/dd/yyyy"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <DateInput
                  label="من تاريخ"
                  value={fromDate}
                  onChange={setFromDate}
                  placeholder="mm/dd/yyyy"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <RTLSelect
                  label="اسم المحطة"
                  value={selectedStation}
                  onChange={setSelectedStation}
                  options={stationOptions}
                  placeholder="جميع المحطات"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-color-mode-text-icons-t-placeholder mb-1">
                  ابحث برقم العملية
                </label>
                <input
                  type="text"
                  value={operationNumberSearch}
                  onChange={(e) => setOperationNumberSearch(e.target.value)}
                  placeholder="ابحث برقم العملية..."
                  className="w-full h-[46px] px-4 rounded-lg border border-solid border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus:border-color-mode-text-icons-t-blue focus:outline-none text-sm text-color-mode-text-icons-t-blue"
                  dir="rtl"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-color-mode-text-icons-t-placeholder mb-1">
                  بحث عام
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-color-mode-text-icons-t-sec" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث..."
                    className="w-full h-[46px] pl-10 pr-4 rounded-lg border border-solid border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus:border-color-mode-text-icons-t-blue focus:outline-none text-sm text-color-mode-text-icons-t-blue"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            {/* Second row: Buttons (reversed and left-aligned) */}
            <div className="flex items-center gap-2 justify-start">
                  <button className="flex items-center gap-2 h-[46px] px-4 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-sm transition-colors">
                <span>تطبيق الفلاتر</span>
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 h-[46px] px-4 rounded-lg border border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec bg-white text-color-mode-text-icons-t-blue text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة تعيين</span>
              </button>
            </div>
          </div>
        </div>
        <div className="w-full h-px bg-gray-200"></div>
          </>
        )}

        {/* Data Table */}
        <div className="w-full p-4 border-b border-gray-200">
          {activeTab === "sales-invoices" ? (
            isLoadingSalesInvoices ? (
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner message="جاري تحميل فواتير البيع..." />
              </div>
            ) : (
              <Table
                columns={salesInvoiceColumns}
                data={paginatedSalesInvoices}
                loading={false}
                emptyMessage="لا توجد فواتير بيع"
              />
            )
          ) : activeTab === "purchase-invoices" ? (
            isLoadingPurchaseInvoices ? (
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner message="جاري تحميل فواتير الشراء..." />
              </div>
            ) : (
              <Table
                columns={purchaseInvoiceColumns}
                data={paginatedPurchaseInvoices}
                loading={false}
                emptyMessage="لا توجد فواتير شراء"
              />
            )
          ) : activeTab === "payments" ? (
            <Table
              columns={paymentColumns}
              data={paginatedPayments}
              loading={isLoadingTransfers}
              emptyMessage="لا توجد دفعات"
            />
          ) : activeTab === "operations" ? (
            isLoadingOperations ? (
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner message="جاري تحميل العمليات..." />
              </div>
            ) : (
          <Table
            columns={columns}
            data={paginatedOperations}
            loading={false}
            emptyMessage="لا توجد عمليات"
          />
            )
          ) : null}
        </div>

        {/* Pagination */}
        <div className="w-full flex items-center justify-between flex-wrap gap-4 p-4">
          {activeTab === "sales-invoices" ? (
            <>
              <div className="text-sm text-color-mode-text-icons-t-sec">
                عرض {paginatedSalesInvoices.length} من {totalSalesInvoices}
              </div>
              <Pagination
                currentPage={salesInvoicePage}
                totalPages={totalSalesInvoicePages}
                onPageChange={setSalesInvoicePage}
                previousLabel=""
                nextLabel=""
                useEasternArabic={true}
                showArrowOnly={true}
                maxVisiblePages={3}
              />
            </>
          ) : activeTab === "purchase-invoices" ? (
            <>
              <div className="text-sm text-color-mode-text-icons-t-sec">
                فاتورة {paginatedPurchaseInvoices.length} من {totalPurchaseInvoices} - {purchaseInvoicePage} عرض
              </div>
              <Pagination
                currentPage={purchaseInvoicePage}
                totalPages={totalPurchaseInvoicePages}
                onPageChange={setPurchaseInvoicePage}
                previousLabel=""
                nextLabel=""
                useEasternArabic={true}
                showArrowOnly={true}
                maxVisiblePages={3}
              />
            </>
          ) : activeTab === "payments" ? (
            <>
              <div className="text-sm text-color-mode-text-icons-t-sec">
                دفعة {paginatedPayments.length} من {totalPayments} - {paymentPage} عرض
              </div>
              <Pagination
                currentPage={paymentPage}
                totalPages={totalPaymentPages}
                onPageChange={setPaymentPage}
                previousLabel=""
                nextLabel=""
                useEasternArabic={true}
                showArrowOnly={true}
                maxVisiblePages={3}
              />
            </>
          ) : activeTab === "operations" ? (
            <>
          <div className="text-sm text-color-mode-text-icons-t-sec">
                عرض {paginatedOperations.length} من {filteredOperations.length} عملية
          </div>
          <Pagination
            currentPage={currentPage}
                totalPages={Math.ceil(filteredOperations.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            previousLabel=""
            nextLabel=""
                useEasternArabic={true}
                showArrowOnly={true}
                maxVisiblePages={3}
      />
            </>
          ) : null}
    </div>
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        open={isModalOpen}
        order={selectedOrder}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default ServiceDistributerFinancialReports;
