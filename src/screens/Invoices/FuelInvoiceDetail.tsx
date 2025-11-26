import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";

export const FuelInvoiceDetail = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Sample invoice data - in real app, this would come from API
  const invoiceData = {
    invoiceNumber: "INV-2024-001",
    invoiceDate: "30-01-2025",
    invoicePeriod: "يناير - 2025",
    company: {
      name: "شركة إنجازات الحلول التقنية المعلومات",
      address: "الرياض - طريق خريص 12245",
      commercialRegistration: "105525211551",
      taxNumber: "300000000000003",
    },
    customer: {
      name: "شركة النقل المتطورة",
      customerId: "أحمد محمد العلي",
      address: "جدة، المملكة العربية السعودية",
      phone: "+966 12 987 6543",
      email: "billing@transport-co.com",
      taxNumber: "312456789000003",
    },
    items: [
      {
        product: "بنزين ٩١",
        quantity: 5000,
        pricePerLiter: 2.0,
        amountBeforeTax: 10000.0,
        tax: 1500.0,
        total: 11500.0,
      },
      {
        product: "بنزين ٩٥",
        quantity: 2000,
        pricePerLiter: 2.2,
        amountBeforeTax: 4400.0,
        tax: 660.0,
        total: 5060.0,
      },
      {
        product: "ديزل",
        quantity: 3000,
        pricePerLiter: 1.8,
        amountBeforeTax: 5480.0,
        tax: 810.0,
        total: 6210.0,
      },
    ],
    financial: {
      subtotal: 19800.0,
      vat: 15,
      vatAmount: 2970.0,
      total: 22770.0,
    },
    contact: {
      phone: "8001240513",
      email: "info@petrolife.sa",
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
        {/* Top Section: Company Info and Invoice Details */}
        <div className="flex items-start justify-between gap-8 relative self-stretch w-full">
          {/* Right Side: Invoice Details */}
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
              <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                فترة الفاتورة: {invoiceData.invoicePeriod}
              </span>
            </div>
          </div>
          {/* Left Side: Company Info */}
          <div className="flex flex-col items-end gap-2 flex-1">
            <div className="flex items-center gap-2">
              <img src="/img/logo-2.png" alt="Logo 2" className="h-20 block" />
              <img src="/img/logo-3.png" alt="Logo 3" className="h-20 block" />
            </div>
            <span className="font-[number:var(--body-body-2-font-weight)] text-[#2C346C] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
              {invoiceData.company.name}
            </span>
            <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
              {invoiceData.company.address}
            </span>
            <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
              السجل التجاري: {invoiceData.company.commercialRegistration}
            </span>
            <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
              الرقم الضريبي: {invoiceData.company.taxNumber}
            </span>
          </div>
        </div>

        {/* Customer Information Section */}
        <div className="flex flex-col items-end gap-4 relative self-stretch w-full pt-6 border-t border-color-mode-text-icons-t-placeholder">
          <h3 className="relative w-fit font-[number:var(--headline-h7-font-weight)] text-[#2C346C] text-[length:var(--headline-h7-font-size)] tracking-[var(--headline-h7-letter-spacing)] leading-[var(--headline-h7-line-height)] [direction:rtl] font-headline-h7 [font-style:var(--headline-h7-font-style)]">
            معلومات العميل
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

        {/* Invoice Details Table */}
        <div className="flex flex-col items-end gap-4 relative self-stretch w-full pt-6 border-t border-color-mode-text-icons-t-placeholder">
          <h3 className="relative w-fit font-[number:var(--headline-h7-font-weight)] text-[#2C346C] text-[length:var(--headline-h7-font-size)] tracking-[var(--headline-h7-letter-spacing)] leading-[var(--headline-h7-line-height)] [direction:rtl] font-headline-h7 [font-style:var(--headline-h7-font-style)]">
            تفاصيل الفاتورة
          </h3>
          <div className="relative w-full overflow-x-auto">
            <table className="table-auto w-full border-collapse">
              <thead>
                <tr className="bg-[#2C346C]">
                  <th className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--subtitle-subtitle-3-font-weight)] text-white text-[length:var(--subtitle-subtitle-3-font-size)] tracking-[var(--subtitle-subtitle-3-letter-spacing)] leading-[var(--subtitle-subtitle-3-line-height)] [direction:rtl] font-subtitle-subtitle-3 [font-style:var(--subtitle-subtitle-3-font-style)]">
                    الإجمالي
                  </th>
                  <th className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--subtitle-subtitle-3-font-weight)] text-white text-[length:var(--subtitle-subtitle-3-font-size)] tracking-[var(--subtitle-subtitle-3-letter-spacing)] leading-[var(--subtitle-subtitle-3-line-height)] [direction:rtl] font-subtitle-subtitle-3 [font-style:var(--subtitle-subtitle-3-font-style)]">
                    الضريبة
                  </th>
                  <th className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--subtitle-subtitle-3-font-weight)] text-white text-[length:var(--subtitle-subtitle-3-font-size)] tracking-[var(--subtitle-subtitle-3-letter-spacing)] leading-[var(--subtitle-subtitle-3-line-height)] [direction:rtl] font-subtitle-subtitle-3 [font-style:var(--subtitle-subtitle-3-font-style)]">
                    المبلغ قبل الضريبة
                  </th>
                  <th className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--subtitle-subtitle-3-font-weight)] text-white text-[length:var(--subtitle-subtitle-3-font-size)] tracking-[var(--subtitle-subtitle-3-letter-spacing)] leading-[var(--subtitle-subtitle-3-line-height)] [direction:rtl] font-subtitle-subtitle-3 [font-style:var(--subtitle-subtitle-3-font-style)]">
                    سعر اللتر (ريال)
                  </th>
                  <th className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--subtitle-subtitle-3-font-weight)] text-white text-[length:var(--subtitle-subtitle-3-font-size)] tracking-[var(--subtitle-subtitle-3-letter-spacing)] leading-[var(--subtitle-subtitle-3-line-height)] [direction:rtl] font-subtitle-subtitle-3 [font-style:var(--subtitle-subtitle-3-font-style)]">
                    الكمية (لتر)
                  </th>
                  <th className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--subtitle-subtitle-3-font-weight)] text-white text-[length:var(--subtitle-subtitle-3-font-size)] tracking-[var(--subtitle-subtitle-3-letter-spacing)] leading-[var(--subtitle-subtitle-3-line-height)] [direction:rtl] font-subtitle-subtitle-3 [font-style:var(--subtitle-subtitle-3-font-style)]">
                    المنتج
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:ltr] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                      <span className="flex items-center gap-1 justify-center">
                        <img
                          src="/img/Group 33.svg"
                          alt="SAR"
                          className="w-4 h-4"
                        />
                        {item.total.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:ltr] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                      <span className="flex items-center gap-1 justify-center">
                        <img
                          src="/img/Group 33.svg"
                          alt="SAR"
                          className="w-4 h-4"
                        />
                        {item.tax.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:ltr] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                      <span className="flex items-center gap-1 justify-center">
                        <img
                          src="/img/Group 33.svg"
                          alt="SAR"
                          className="w-4 h-4"
                        />
                        {item.amountBeforeTax.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:ltr] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                      <span className="flex items-center gap-1 justify-center">
                        <img
                          src="/img/Group 33.svg"
                          alt="SAR"
                          className="w-4 h-4"
                        />
                        {item.pricePerLiter.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                      {item.quantity.toLocaleString("en-US")}
                    </td>
                    <td className="px-4 py-3 text-center border border-color-mode-text-icons-t-placeholder font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 [font-style:var(--body-body-2-font-style)]">
                      {item.product}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="flex items-start justify-between gap-8 relative self-stretch w-full pt-6 border-t border-color-mode-text-icons-t-placeholder">
          <div className="flex flex-col items-start gap-3 flex-shrink-0">
            {/* QR Code Placeholder */}
            <div className="flex flex-col items-center gap-2">
              <h3 className="relative w-fit font-[number:var(--headline-h7-font-weight)] text-[#2C346C] text-[length:var(--headline-h7-font-size)] tracking-[var(--headline-h7-letter-spacing)] leading-[var(--headline-h7-line-height)] [direction:rtl] font-headline-h7 [font-style:var(--headline-h7-font-style)]">
                رمز الاستجابة السريعة
              </h3>
              <div className="w-32 h-32 bg-color-mode-surface-secondary-gray border border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] flex items-center justify-center">
                <span className="text-color-mode-text-icons-t-placeholder text-xs">
                  QR Code
                </span>
              </div>
            </div>
          </div>
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
                  المبلغ قبل الضريبة :
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
                  إجمالي الضريبة (15%) :
                </span>
              </div>
              <div className="flex items-center justify-between w-full py-3 bg-[#2C346C] px-4 rounded-[var(--corner-radius-small)]">
                <span className="flex items-center gap-1 font-[number:var(--subtitle-subtitle-2-font-weight)] text-white text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:ltr] font-subtitle-subtitle-2 [font-style:var(--subtitle-subtitle-2-font-style)]">
                  <img
                    src="/img/Group 33.svg"
                    alt="SAR"
                    className="w-4 h-4 brightness-0 invert"
                  />
                  {invoiceData.financial.total.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="font-[number:var(--subtitle-subtitle-2-font-weight)] text-white text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] [direction:rtl] font-subtitle-subtitle-2 [font-style:var(--subtitle-subtitle-2-font-style)]">
                  الإجمالي الكلي:
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info and Print Button */}
        <div className="flex flex-col items-center justify-center w-full pt-6 border-t border-color-mode-text-icons-t-placeholder gap-3 print:hidden">
          <span className="font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-primary-gray text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] font-body-body-2 text-center [font-style:var(--body-body-2-font-style)]">
            {invoiceData.contact.phone} {invoiceData.contact.email}
          </span>
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2C346C] text-white rounded-[var(--corner-radius-small)] hover:opacity-90 transition-opacity font-[number:var(--subtitle-subtitle-3-font-weight)] text-[length:var(--subtitle-subtitle-3-font-size)] tracking-[var(--subtitle-subtitle-3-letter-spacing)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]"
          >
            <Printer className="w-5 h-5" />
            <span>طباعة الفاتورة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
