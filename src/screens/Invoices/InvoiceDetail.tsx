import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import { ROUTES } from "../../constants/routes";

export const InvoiceDetail = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Sample invoice data - in real app, this would come from API
  const invoiceData = {
    invoiceNumber: "SUB-2024-001",
    invoiceDate: "12 - 11 - 2025",
    customer: {
      name: "شركة النقل السريع",
      customerId: "CUST-5654656",
      address: "جدة - المملكة العربية السعودية",
      phone: "05123154654",
      email: "contact@innovation-trade.sa",
      taxNumber: "300000000000003",
    },
    subscription: {
      description: "اشتراك نظام إدارة الأسطول",
      packageName: "كلاسيك",
      period: "سنة",
      startDate: "01/01/2024",
      endDate: "31/12/2024",
    },
    financial: {
      subtotal: 15000.0,
      vat: 15,
      vatAmount: 2250.0,
      total: 17250.0,
    },
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col w-full items-center justify-center gap-5 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(ROUTES.INVOICES)}
        className="self-start mr-auto mb-2 flex items-center gap-2 px-4 py-2 text-color-mode-text-icons-t-primary-gray hover:bg-color-mode-surface-secondary-gray rounded-[var(--corner-radius-small)] transition-colors print:hidden"
        title="العودة إلى الفواتير"
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
                شركة انجازات الحلول لتقنية المعلومات
              </span>
              <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                الرياض المملكة العربية السعودية
              </span>
              <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                الرقم الضريبي 300012345600003
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
                  <td className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
                    {invoiceData.subscription.description}
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
              <div className="text-center text-xs text-gray-400">QR Code</div>
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
