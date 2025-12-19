import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import { fetchInvoiceById } from "../../services/invoiceService";
import { Invoice } from "../../types/invoice";
import { LoadingSpinner } from "../../components/shared";
import { useToast } from "../../context/ToastContext";
import { generateZatcaQrFromInvoice } from "../../utils/zatcaQr";

export const InvoiceDetail = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const fetchedInvoice = await fetchInvoiceById(id);
        if (!fetchedInvoice) {
          addToast({
            title: "خطأ",
            message: "الفاتورة غير موجودة",
            type: "error",
          });
          navigate(-1);
          return;
        }
        setInvoice(fetchedInvoice);
      } catch (error) {
        console.error("Error loading invoice:", error);
        addToast({
          title: "خطأ في التحميل",
          message: "فشل في تحميل الفاتورة",
          type: "error",
        });
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoice();
  }, [id, navigate, addToast]);

  // Generate QR code when invoice is loaded
  useEffect(() => {
    const generateQrCode = async () => {
      if (invoice) {
        const qrCode = await generateZatcaQrFromInvoice(invoice, invoice.createdAt);
        setQrCodeBase64(qrCode);
      }
    };
    generateQrCode();
  }, [invoice]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <LoadingSpinner size="lg" message="جاري تحميل الفاتورة..." />
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  // Map invoice data to component format
  const invoiceDate = invoice.createdAt instanceof Date
    ? invoice.createdAt
    : invoice.createdAt?.toDate
    ? invoice.createdAt.toDate()
    : new Date();

  const formattedDate = `${invoiceDate.getDate()} - ${invoiceDate.getMonth() + 1} - ${invoiceDate.getFullYear()}`;

  const customerData = invoice.clientData || invoice.companyData || {};
  const subscriptionItem = invoice.items[0] || {};
  
  // Calculate dates from invoice createdAt if not available in item
  let subscriptionStartDate = subscriptionItem.startDate;
  let subscriptionEndDate = subscriptionItem.endDate;
  
  if (!subscriptionStartDate || !subscriptionEndDate) {
    // If dates are not in item, calculate from invoice date and period
    const invoiceDate = invoice.createdAt instanceof Date
      ? invoice.createdAt
      : invoice.createdAt?.toDate
      ? invoice.createdAt.toDate()
      : new Date();
    
    const periodValueInDays = subscriptionItem.periodValueInDays || 365;
    subscriptionStartDate = `${String(invoiceDate.getDate()).padStart(2, '0')}/${String(invoiceDate.getMonth() + 1).padStart(2, '0')}/${invoiceDate.getFullYear()}`;
    
    const endDateCalc = new Date(invoiceDate);
    endDateCalc.setDate(endDateCalc.getDate() + periodValueInDays);
    subscriptionEndDate = `${String(endDateCalc.getDate()).padStart(2, '0')}/${String(endDateCalc.getMonth() + 1).padStart(2, '0')}/${endDateCalc.getFullYear()}`;
  }

  // Determine period display - use "شهري" or "سنوي"
  // PRIORITIZE periodValueInDays first, as it's the most reliable indicator
  let periodDisplay = subscriptionItem.period;
  
  // First check periodValueInDays (most reliable)
  if (subscriptionItem.periodValueInDays === 30) {
    periodDisplay = "شهري";
  } else if (subscriptionItem.periodValueInDays === 365 || subscriptionItem.periodValueInDays === 360) {
    periodDisplay = "سنوي";
  } else if (!periodDisplay) {
    // Fallback: determine from periodValueInDays (if not 30 or 365)
    if (subscriptionItem.periodValueInDays && subscriptionItem.periodValueInDays <= 31) {
      periodDisplay = "شهري";
    } else {
      periodDisplay = "سنوي";
    }
  } else {
    // Normalize period display string
    const periodStr = String(periodDisplay).toLowerCase();
    if (periodStr.includes("شهري") || periodStr.includes("monthly")) {
      periodDisplay = "شهري";
    } else if (periodStr.includes("سنوي") || periodStr.includes("yearly") || periodStr.includes("annual")) {
      periodDisplay = "سنوي";
    }
    // Otherwise keep the original value
  }

  const subscriptionData = {
    description: subscriptionItem.description || subscriptionItem.product || "اشتراك نظام إدارة الأسطول",
    packageName: subscriptionItem.packageName || subscriptionItem.product || "غير محدد",
    period: periodDisplay, // "شهري" or "سنوي"
    startDate: subscriptionStartDate,
    endDate: subscriptionEndDate,
  };

  const invoiceData = {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: formattedDate,
    customer: {
      name: customerData.name || customerData.brandName || "غير محدد",
      customerId: customerData.id || customerData.uid || "غير محدد",
      address: customerData.address || customerData.location || "غير محدد",
      phone: customerData.phoneNumber || customerData.phone || "غير محدد",
      email: customerData.email || "غير محدد",
      taxNumber: customerData.taxNumber || customerData.vatNumber || "غير محدد",
    },
    subscription: subscriptionData,
    financial: {
      subtotal: invoice.subtotal,
      vat: 15,
      vatAmount: invoice.vatAmount,
      total: invoice.total,
    },
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col w-full items-center justify-center gap-5 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="self-start mr-auto mb-2 flex items-center gap-2 px-4 py-2 text-color-mode-text-icons-t-primary-gray hover:bg-color-mode-surface-secondary-gray rounded-[var(--corner-radius-small)] transition-colors print:hidden"
        title="العودة"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-[number:var(--body-body-2-font-weight)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
          العودة
        </span>
      </button>
      {/* Invoice Container - 70% width frame */}
      <div className="flex flex-col items-start gap-6 relative w-[70%] max-w-5xl flex-[0_0_auto] bg-white rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder px-12 py-8 print:p-0 print:border-0 print:w-full">
        {/* Top Section: Title, Invoice Details, and Company Info */}
        <div className="flex items-start justify-between gap-8 relative self-stretch w-full">
          {/* Left Side: Title and Invoice Details */}
          <div className="flex flex-col items-start gap-3 flex-1 pr-4 pl-4">
            <h1 className="relative w-fit text-right font-[number:var(--headline-h6-m-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--headline-h6-m-font-size)] tracking-[var(--headline-h6-m-letter-spacing)] leading-[var(--headline-h6-m-line-height)] [direction:rtl] font-headline-h6-m [font-style:var(--headline-h6-m-font-style)]">
              فاتورة ضريبية
            </h1>
            <div className="flex flex-col gap-2 w-fit">
              <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                رقم الفاتورة: {invoiceData.invoiceNumber}
              </span>
              <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                تاريخ الفاتورة: {invoiceData.invoiceDate}
              </span>
            </div>
          </div>

          {/* Right Side: Company Info with Logos */}
          <div className="flex flex-col items-end gap-3 flex-1">
            <div className="flex items-center gap-2">
              <img
                src="/img/logo-2.png"
                alt="Logo 2"
                className="h-20 object-contain block"
              />
              <img
                src="/img/logo-3.png"
                alt="Logo 3"
                className="h-20 object-contain block"
              />
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-[number:var(--subtitle-subtitle-2-font-weight)] text-[#2C346C] text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] font-subtitle-subtitle-2 [font-style:var(--subtitle-subtitle-2-font-style)]">
                لجميع احتياجات سيارتك
              </span>
              <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                الرياض-طريق خريص-14221
              </span>
              <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                رقم السجل التجاري: 1009204448
              </span>
              <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                الرقم الضريبي: 312894850300003
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information Section */}
        <div className="flex flex-col items-end gap-4 relative self-stretch w-full pt-6 border-t border-color-mode-text-icons-t-placeholder">
          <h3 className="relative w-fit font-[number:var(--headline-h7-font-weight)] text-[#2C346C] text-[length:var(--headline-h7-font-size)] tracking-[var(--headline-h7-letter-spacing)] leading-[var(--headline-h7-line-height)] [direction:rtl] font-headline-h7 [font-style:var(--headline-h7-font-style)]">
            بيانات العميل
          </h3>
          <div className="flex items-start gap-8 w-full">
            {/* Left Column */}
            <div className="flex flex-col gap-2 w-fit pr-4 pl-4">
              <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                الهاتف: {invoiceData.customer.phone}
              </span>
              <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                البريد الإلكتروني: {invoiceData.customer.email}
              </span>
              <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                الرقم الضريبي: {invoiceData.customer.taxNumber}
              </span>
            </div>
            {/* Right Column */}
            <div className="flex flex-col gap-2 flex-1">
              <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                العميل: {invoiceData.customer.name}
              </span>
              <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                رقم العميل: {invoiceData.customer.customerId}
              </span>
              <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                العنوان: {invoiceData.customer.address}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Details Section */}
        <div className="flex flex-col items-end gap-4 relative self-stretch w-full pt-6 border-t border-color-mode-text-icons-t-placeholder">
          <h3 className="relative w-fit font-[number:var(--headline-h7-font-weight)] text-[#2C346C] text-[length:var(--headline-h7-font-size)] tracking-[var(--headline-h7-letter-spacing)] leading-[var(--headline-h7-line-height)] [direction:rtl] font-headline-h7 [font-style:var(--headline-h7-font-style)]">
            تفاصيل الاشتراك
          </h3>
          <div className="relative self-stretch w-full overflow-x-auto">
            <table className="w-full border-collapse table-auto">
              <thead>
                <tr className="bg-[#2C346C]">
                  <th className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--subtitle-subtitle-3-font-weight)] text-white text-[length:var(--subtitle-subtitle-3-font-size)] tracking-[var(--subtitle-subtitle-3-letter-spacing)] leading-[var(--subtitle-subtitle-3-line-height)] [direction:rtl] font-subtitle-subtitle-3 [font-style:var(--subtitle-subtitle-3-font-style)]">
                    تاريخ النهاية
                  </th>
                  <th className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--subtitle-subtitle-3-font-weight)] text-white text-[length:var(--subtitle-subtitle-3-font-size)] tracking-[var(--subtitle-subtitle-3-letter-spacing)] leading-[var(--subtitle-subtitle-3-line-height)] [direction:rtl] font-subtitle-subtitle-3 [font-style:var(--subtitle-subtitle-3-font-style)]">
                    تاريخ البداية
                  </th>
                  <th className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--subtitle-subtitle-3-font-weight)] text-white text-[length:var(--subtitle-subtitle-3-font-size)] tracking-[var(--subtitle-subtitle-3-letter-spacing)] leading-[var(--subtitle-subtitle-3-line-height)] [direction:rtl] font-subtitle-subtitle-3 [font-style:var(--subtitle-subtitle-3-font-style)]">
                    مدة الاشتراك
                  </th>
                  <th className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--subtitle-subtitle-3-font-weight)] text-white text-[length:var(--subtitle-subtitle-3-font-size)] tracking-[var(--subtitle-subtitle-3-letter-spacing)] leading-[var(--subtitle-subtitle-3-line-height)] [direction:rtl] font-subtitle-subtitle-3 [font-style:var(--subtitle-subtitle-3-font-style)]">
                    اسم الباقة
                  </th>
                  <th className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--subtitle-subtitle-3-font-weight)] text-white text-[length:var(--subtitle-subtitle-3-font-size)] tracking-[var(--subtitle-subtitle-3-letter-spacing)] leading-[var(--subtitle-subtitle-3-line-height)] [direction:rtl] font-subtitle-subtitle-3 whitespace-nowrap [font-style:var(--subtitle-subtitle-3-font-style)]">
                    الوصف
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                    {invoiceData.subscription.endDate}
                  </td>
                  <td className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                    {invoiceData.subscription.startDate}
                  </td>
                  <td className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                    {invoiceData.subscription.period}
                  </td>
                  <td className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                    {invoiceData.subscription.packageName}
                  </td>
                  <td className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                    <div className="max-w-md mx-auto text-right">
                      {invoiceData.subscription.description}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary and QR Code Row */}
        <div className="flex items-start justify-between gap-8 relative self-stretch w-full pt-6 border-t border-color-mode-text-icons-t-placeholder">
          {/* QR Code - Left Side */}
          <div className="flex flex-col items-start gap-3 flex-shrink-0">
            <h3 className="relative w-fit font-[number:var(--headline-h7-font-weight)] text-[#2C346C] text-[length:var(--headline-h7-font-size)] tracking-[var(--headline-h7-letter-spacing)] leading-[var(--headline-h7-line-height)] [direction:rtl] font-headline-h7 [font-style:var(--headline-h7-font-style)]">
              رمز الاستجابة السريعة
            </h3>
            <div className="w-32 h-32 bg-gray-100 border border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] flex items-center justify-center">
              {qrCodeBase64 ? (
                <img 
                  src={qrCodeBase64} 
                  alt="ZATCA QR Code" 
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-center text-xs text-gray-400">QR Code</div>
              )}
            </div>
            <span className="font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] [direction:rtl] font-caption-caption-1 text-center [font-style:var(--caption-caption-1-font-style)]">
              متوافق مع الزكاة والضريبية
            </span>
          </div>

          {/* Financial Summary - Right Side */}
          <div className="flex flex-col items-end gap-4 flex-1">
            <h3 className="relative w-fit font-[number:var(--headline-h7-font-weight)] text-[#2C346C] text-[length:var(--headline-h7-font-size)] tracking-[var(--headline-h7-letter-spacing)] leading-[var(--headline-h7-line-height)] [direction:rtl] font-headline-h7 [font-style:var(--headline-h7-font-style)]">
              الملخص المالي
            </h3>
            <div className="flex flex-col items-end gap-3 w-full">
              <div className="flex items-center justify-between w-full py-2">
                <span className="flex items-center gap-1 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:ltr] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                  <img src="/img/Group 33.svg" alt="SAR" className="w-4 h-4" />
                  {invoiceData.financial.subtotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                  قيمة الاشتراك (بدون الضريبة)
                </span>
              </div>
              <div className="flex items-center justify-between w-full py-2">
                <span className="flex items-center gap-1 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:ltr] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                  <img src="/img/Group 33.svg" alt="SAR" className="w-4 h-4" />
                  {invoiceData.financial.vatAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                  ضريبة القيمة المضافة ({invoiceData.financial.vat}%)
                </span>
              </div>
              <div className="flex items-center justify-between w-full py-3 bg-[#2C346C] px-4 rounded-[var(--corner-radius-small)]">
                <span className="flex items-center gap-1 font-[number:var(--subtitle-subtitle-2-font-weight)] text-white text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:ltr] font-subtitle-subtitle-2 [font-style:var(--subtitle-subtitle-2-font-style)]">
                  <img src="/img/Group 33.svg" alt="SAR" className="w-4 h-4 brightness-0 invert" />
                  {invoiceData.financial.total.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="font-[number:var(--subtitle-subtitle-2-font-weight)] text-white text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] font-subtitle-subtitle-2 [font-style:var(--subtitle-subtitle-2-font-style)]">
                  الإجمالي شامل الضريبة
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="flex flex-col items-end gap-3 relative self-stretch w-full pt-6 border-t border-color-mode-text-icons-t-placeholder">
          <h3 className="relative w-fit font-[number:var(--headline-h7-font-weight)] text-[#2C346C] text-[length:var(--headline-h7-font-size)] tracking-[var(--headline-h7-letter-spacing)] leading-[var(--headline-h7-line-height)] [direction:rtl] font-headline-h7 [font-style:var(--headline-h7-font-style)]">
            الشروط والأحكام
          </h3>
          <div className="flex flex-col items-end gap-2">
            <p className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
              هذه الفاتورة صادرة الكترونياً ولا تحتاج إلى توقيع
            </p>
            <p className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
              جميع الأسعار بالريال السعودي وشاملة ضريبة القيمة المضافة
            </p>
          </div>
          <p className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 mt-2 text-center w-full [font-style:var(--body-body-2-font-style)]">
            شكراً لثقتكم في خدماتنا
          </p>
        </div>

        {/* Print Button */}
        <div className="flex items-center justify-center w-full pt-6 print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2C346C] text-white rounded-[var(--corner-radius-small)] hover:opacity-90 transition-opacity font-[number:var(--subtitle-subtitle-3-font-weight)] text-[length:var(--subtitle-subtitle-3-font-size)] tracking-[var(--subtitle-subtitle-3-letter-spacing)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]"
          >
            <Printer className="w-5 h-5" />
            طباعة الفاتورة
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
