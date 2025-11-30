import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Invoice } from "../types/invoice";

/**
 * Generate HTML for fuel invoice (Client or Company Monthly Invoice)
 */
const generateFuelInvoiceHTML = (invoice: Invoice): string => {
  const invoiceDate =
    invoice.createdAt instanceof Date
      ? invoice.createdAt
      : invoice.createdAt?.toDate
      ? invoice.createdAt.toDate()
      : new Date();

  const formattedDate = `${invoiceDate.getDate()}-${String(invoiceDate.getMonth() + 1).padStart(2, "0")}-${invoiceDate.getFullYear()}`;

  const companyData = invoice.companyData || {};
  const customerData = invoice.clientData || invoice.companyData || {};

  // Get refId
  let refId = "غير محدد";
  if (invoice.type === "Client" && invoice.clientData) {
    refId =
      customerData.refId ||
      customerData.refid ||
      customerData.clientRefId ||
      customerData.id ||
      customerData.uid ||
      "غير محدد";
  } else if (invoice.orders && invoice.orders.length > 0) {
    refId = invoice.orders[0]?.refId || invoice.orders[0]?.refid || "غير محدد";
  } else if (invoice.refId) {
    refId = invoice.refId;
  } else if (invoice.orderId) {
    refId = invoice.orderId;
  }

  const itemsHTML = invoice.items
    .map((item) => {
      const total = Number(item.total || 0);
      const vat = Number(item.vat || 0);
      const amountBeforeTax = Number(item.amountBeforeTax || 0);
      const pricePerUnit = Number(item.pricePerUnit || 0);
      const quantity = Number(item.quantity || 0);
      const product = item.product || "غير محدد";

      return `
        <tr>
          <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb; direction: rtl; font-family: Arial, sans-serif;">
            ${product}
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb; direction: rtl; font-family: Arial, sans-serif;">
            ${quantity.toLocaleString("en-US")}
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb; direction: ltr; font-family: Arial, sans-serif;">
            <span style="display: flex; align-items: center; gap: 4px; justify-content: center;">
              <img src="/img/Group 33.svg" alt="SAR" style="width: 16px; height: 16px;" />
              ${pricePerUnit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb; direction: ltr; font-family: Arial, sans-serif;">
            <span style="display: flex; align-items: center; gap: 4px; justify-content: center;">
              <img src="/img/Group 33.svg" alt="SAR" style="width: 16px; height: 16px;" />
              ${amountBeforeTax.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb; direction: ltr; font-family: Arial, sans-serif;">
            <span style="display: flex; align-items: center; gap: 4px; justify-content: center;">
              <img src="/img/Group 33.svg" alt="SAR" style="width: 16px; height: 16px;" />
              ${vat.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb; direction: ltr; font-family: Arial, sans-serif;">
            <span style="display: flex; align-items: center; gap: 4px; justify-content: center;">
              <img src="/img/Group 33.svg" alt="SAR" style="width: 16px; height: 16px;" />
              ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          direction: rtl;
          background: white;
          padding: 20px;
        }
        .invoice-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 48px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .invoice-details {
          flex: 1;
          padding-right: 16px;
          padding-left: 16px;
        }
        .company-info {
          flex: 1;
          text-align: right;
        }
        .logos {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .section-title {
          color: #2C346C;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .customer-info {
          display: flex;
          gap: 32px;
        }
        .customer-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background: #2C346C;
          color: white;
          padding: 12px;
          text-align: center;
          border: 1px solid #e5e7eb;
          font-weight: 600;
        }
        td {
          padding: 12px;
          text-align: center;
          border: 1px solid #e5e7eb;
        }
        .financial-summary {
          display: flex;
          justify-content: space-between;
          gap: 32px;
          margin-top: 24px;
        }
        .qr-section {
          flex-shrink: 0;
        }
        .qr-box {
          width: 128px;
          height: 128px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #9ca3af;
        }
        .financial-details {
          flex: 1;
          text-align: right;
        }
        .financial-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        .total-row {
          background: #2C346C;
          color: white;
          padding: 12px 16px;
          border-radius: 4px;
          margin-top: 12px;
        }
        .total-row span {
          color: white;
        }
        .currency-icon {
          width: 16px;
          height: 16px;
        }
        .contact-info {
          text-align: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <div class="company-info">
            <div class="logos">
              <img src="/img/logo-2.png" alt="Logo 2" style="height: 80px;" />
              <img src="/img/logo-3.png" alt="Logo 3" style="height: 80px;" />
            </div>
            <div style="color: #2C346C; font-weight: 600; margin-top: 8px;">
              شركة إنجازات الحلول التقنية المعلومات
            </div>
            <div style="margin-top: 4px;">الرياض - طريق خريص 12245</div>
            <div style="margin-top: 4px;">السجل التجاري: 105525211551</div>
            <div style="margin-top: 4px;">الرقم الضريبي: 300000000000003</div>
          </div>
          <div class="invoice-details">
            <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 12px;">فاتورة ضريبية</h1>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <span>رقم الفاتورة: ${invoice.invoiceNumber}</span>
              <span>تاريخ الفاتورة: ${formattedDate}</span>
              <span>فترة الفاتورة: ${invoice.monthName || formattedDate}</span>
            </div>
          </div>
        </div>

        <!-- Customer Information -->
        <div class="section">
          <h3 class="section-title">معلومات العميل</h3>
          <div class="customer-info">
            <div class="customer-col" style="flex: 1;">
              <span>العميل: ${customerData.name || customerData.brandName || "غير محدد"}</span>
              <span>رقم العميل: ${refId}</span>
              <span>العنوان: ${customerData.address || customerData.location || "غير محدد"}</span>
            </div>
            <div class="customer-col" style="padding-right: 16px; padding-left: 16px;">
              <span>الهاتف: ${customerData.phoneNumber || customerData.phone || "غير محدد"}</span>
              <span>البريد الإلكتروني: ${customerData.email || "غير محدد"}</span>
              <span>الرقم الضريبي: ${customerData.taxNumber || customerData.vatNumber || "غير محدد"}</span>
            </div>
          </div>
        </div>

        <!-- Invoice Details Table -->
        <div class="section">
          <h3 class="section-title">تفاصيل الفاتورة</h3>
          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الكمية (لتر)</th>
                <th>سعر اللتر (ريال)</th>
                <th>المبلغ قبل الضريبة</th>
                <th>الضريبة</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
        </div>

        <!-- Financial Summary -->
        <div class="section">
          <div class="financial-summary">
            <div class="financial-details">
              <h3 class="section-title">الملخص المالي</h3>
              <div>
                <div class="financial-row">
                  <span>المبلغ قبل الضريبة:</span>
                  <span style="direction: ltr; display: flex; align-items: center; gap: 4px;">
                    <img src="/img/Group 33.svg" alt="SAR" class="currency-icon" />
                    ${invoice.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div class="financial-row">
                  <span>إجمالي الضريبة (15%):</span>
                  <span style="direction: ltr; display: flex; align-items: center; gap: 4px;">
                    <img src="/img/Group 33.svg" alt="SAR" class="currency-icon" />
                    ${invoice.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div class="total-row">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: white; font-weight: 600;">الإجمالي الكلي:</span>
                    <span style="direction: ltr; display: flex; align-items: center; gap: 4px; color: white;">
                      <img src="/img/Group 33.svg" alt="SAR" class="currency-icon" style="filter: brightness(0) invert(1);" />
                      ${invoice.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="qr-section">
              <h3 class="section-title">رمز الاستجابة السريعة</h3>
              <div class="qr-box">QR Code</div>
            </div>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="contact-info">
          <span>8001240513 info@petrolife.sa</span>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate HTML for subscription invoice
 */
const generateSubscriptionInvoiceHTML = (invoice: Invoice): string => {
  const invoiceDate =
    invoice.createdAt instanceof Date
      ? invoice.createdAt
      : invoice.createdAt?.toDate
      ? invoice.createdAt.toDate()
      : new Date();

  const formattedDate = `${invoiceDate.getDate()} - ${invoiceDate.getMonth() + 1} - ${invoiceDate.getFullYear()}`;

  const customerData = invoice.clientData || invoice.companyData || {};
  const subscriptionData = invoice.items[0] || {};

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          direction: rtl;
          background: white;
          padding: 20px;
        }
        .invoice-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 48px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .invoice-details {
          flex: 1;
          padding-right: 16px;
          padding-left: 16px;
        }
        .company-info {
          flex: 1;
          text-align: right;
        }
        .logos {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .section-title {
          color: #2C346C;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .customer-info {
          display: flex;
          gap: 32px;
        }
        .customer-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background: #2C346C;
          color: white;
          padding: 12px;
          text-align: center;
          border: 1px solid #e5e7eb;
          font-weight: 600;
        }
        td {
          padding: 12px;
          text-align: center;
          border: 1px solid #e5e7eb;
        }
        .financial-summary {
          display: flex;
          justify-content: space-between;
          gap: 32px;
          margin-top: 24px;
        }
        .qr-section {
          flex-shrink: 0;
        }
        .qr-box {
          width: 128px;
          height: 128px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #9ca3af;
        }
        .financial-details {
          flex: 1;
          text-align: right;
        }
        .financial-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        .total-row {
          background: #2C346C;
          color: white;
          padding: 12px 16px;
          border-radius: 4px;
          margin-top: 12px;
        }
        .total-row span {
          color: white;
        }
        .currency-icon {
          width: 16px;
          height: 16px;
        }
        .terms {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .terms-title {
          color: #2C346C;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .thank-you {
          text-align: center;
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <div class="company-info">
            <div class="logos">
              <img src="/img/logo-2.png" alt="Logo 2" style="height: 80px;" />
              <img src="/img/logo-3.png" alt="Logo 3" style="height: 80px;" />
            </div>
            <div style="color: #2C346C; font-weight: 600; margin-top: 8px;">
              شركة انجازات الحلول لتقنية المعلومات
            </div>
            <div style="margin-top: 4px;">الرياض المملكة العربية السعودية</div>
            <div style="margin-top: 4px;">الرقم الضريبي 300012345600003</div>
          </div>
          <div class="invoice-details">
            <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 12px;">فاتورة ضريبية</h1>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <span>رقم الفاتورة: ${invoice.invoiceNumber}</span>
              <span>تاريخ الفاتورة: ${formattedDate}</span>
            </div>
          </div>
        </div>

        <!-- Customer Information -->
        <div class="section">
          <h3 class="section-title">بيانات العميل</h3>
          <div class="customer-info">
            <div class="customer-col" style="flex: 1;">
              <span>العميل: ${customerData.name || customerData.brandName || "غير محدد"}</span>
              <span>رقم العميل: ${invoice.refId || customerData.id || customerData.uid || "غير محدد"}</span>
              <span>العنوان: ${customerData.address || customerData.location || "غير محدد"}</span>
            </div>
            <div class="customer-col" style="padding-right: 16px; padding-left: 16px;">
              <span>الهاتف: ${customerData.phoneNumber || customerData.phone || "غير محدد"}</span>
              <span>البريد الإلكتروني: ${customerData.email || "غير محدد"}</span>
              <span>الرقم الضريبي: ${customerData.taxNumber || customerData.vatNumber || "غير محدد"}</span>
            </div>
          </div>
        </div>

        <!-- Subscription Details -->
        <div class="section">
          <h3 class="section-title">تفاصيل الاشتراك</h3>
          <table>
            <thead>
              <tr>
                <th>تاريخ النهاية</th>
                <th>تاريخ البداية</th>
                <th>مدة الاشتراك</th>
                <th>اسم الباقة</th>
                <th>الوصف</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${subscriptionData.endDate || "غير محدد"}</td>
                <td>${subscriptionData.startDate || "غير محدد"}</td>
                <td>${subscriptionData.period || "غير محدد"}</td>
                <td>${subscriptionData.packageName || "غير محدد"}</td>
                <td>${subscriptionData.product || subscriptionData.description || "اشتراك نظام إدارة الأسطول"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Financial Summary -->
        <div class="section">
          <div class="financial-summary">
            <div class="financial-details">
              <h3 class="section-title">الملخص المالي</h3>
              <div>
                <div class="financial-row">
                  <span>قيمة الاشتراك (بدون الضريبة)</span>
                  <span style="direction: ltr; display: flex; align-items: center; gap: 4px;">
                    <img src="/img/Group 33.svg" alt="SAR" class="currency-icon" />
                    ${invoice.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div class="financial-row">
                  <span>ضريبة القيمة المضافة (15%)</span>
                  <span style="direction: ltr; display: flex; align-items: center; gap: 4px;">
                    <img src="/img/Group 33.svg" alt="SAR" class="currency-icon" />
                    ${invoice.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div class="total-row">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: white; font-weight: 600;">الإجمالي شامل الضريبة</span>
                    <span style="direction: ltr; display: flex; align-items: center; gap: 4px; color: white;">
                      <img src="/img/Group 33.svg" alt="SAR" class="currency-icon" style="filter: brightness(0) invert(1);" />
                      ${invoice.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="qr-section">
              <h3 class="section-title">رمز الاستجابة السريعة</h3>
              <div class="qr-box">QR Code</div>
              <div style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 8px;">
                متوافق مع الزكاة والضريبية
              </div>
            </div>
          </div>
        </div>

        <!-- Terms and Conditions -->
        <div class="terms">
          <h3 class="terms-title">الشروط والأحكام</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <p>هذه الفاتورة صادرة الكترونياً ولا تحتاج إلى توقيع</p>
            <p>جميع الأسعار بالريال السعودي وشاملة ضريبة القيمة المضافة</p>
          </div>
          <p class="thank-you">شكراً لثقتكم في خدماتنا</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Export invoice detail UI to PDF
 * Renders the actual invoice UI (without print/back buttons) and exports as PDF
 */
export const exportInvoiceToPDF = async (invoice: Invoice): Promise<void> => {
  try {
    // Determine invoice type
    const isSubscription = invoice.type === "Subscription";
    const isFuelInvoice =
      invoice.type === "Client" || invoice.type === "Company Monthly Invoice";

    if (!isFuelInvoice && !isSubscription) {
      throw new Error("نوع الفاتورة غير مدعوم");
    }

    // Generate HTML based on invoice type
    const htmlContent = isSubscription
      ? generateSubscriptionInvoiceHTML(invoice)
      : generateFuelInvoiceHTML(invoice);

    // Create an iframe to render the HTML
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.style.top = "0";
    iframe.style.width = "210mm";
    iframe.style.height = "297mm";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    // Wait for iframe to load
    await new Promise((resolve) => {
      iframe.onload = resolve;
      iframe.src = "about:blank";
    });

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      throw new Error("فشل في إنشاء إطار PDF");
    }

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // Ensure RTL direction is set on the iframe document
    if (iframeDoc.documentElement) {
      iframeDoc.documentElement.setAttribute("dir", "rtl");
    }
    if (iframeDoc.body) {
      iframeDoc.body.style.direction = "rtl";
    }

    const tempDiv = iframeDoc.body;

    // Wait for images and fonts to load
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Convert HTML to canvas
    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
        windowWidth: tempDiv.scrollWidth,
        windowHeight: tempDiv.scrollHeight,
        x: 0,
        y: 0,
      });
    } catch (canvasError) {
      document.body.removeChild(iframe);
      console.error("html2canvas error:", canvasError);
      throw new Error("فشل في تحويل الفاتورة إلى صورة");
    }

    // Remove temporary element
    document.body.removeChild(iframe);

    // Create PDF
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4"); // Portrait orientation for invoices

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate filename and save
    const invoiceNumber = invoice.invoiceNumber || invoice.id || "invoice";
    const filename = `invoice-${invoiceNumber}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error("Error exporting invoice to PDF:", error);
    throw error;
  }
};

