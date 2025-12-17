import React from "react";
import { createPortal } from "react-dom";
import { X, MapPin, Phone, Mail, User, Car, Building2, Fuel, Calendar, Hash, DollarSign, Package } from "lucide-react";

interface OrderDetailsModalProps {
  open: boolean;
  order: any | null;
  onClose: () => void;
}

// Helper function to format date
const formatDate = (date: any): string => {
  if (!date) return "غير محدد";
  try {
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    return `${year}/${month}/${day} - ${hours}:${minutes}`;
  } catch (error) {
    return "غير محدد";
  }
};

// Helper function to format currency
const formatCurrency = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return "0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
};

// Helper function to get text (Arabic or English)
const getText = (obj: any): string => {
  if (!obj) return "غير محدد";
  if (typeof obj === "string") return obj;
  return obj.ar || obj.en || "غير محدد";
};

// Helper function to format location
const formatLocation = (location: any): string => {
  if (!location) return "غير محدد";
  if (typeof location === "string") return location;
  
  const parts: string[] = [];
  if (location.address?.city) parts.push(location.address.city);
  if (location.address?.state) parts.push(location.address.state);
  if (location.address?.road) parts.push(location.address.road);
  if (location.address?.postcode) parts.push(location.address.postcode);
  if (location.name) parts.push(location.name);
  
  return parts.length > 0 ? parts.join(", ") : "غير محدد";
};

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  open,
  order,
  onClose,
}) => {
  if (!open || !order) return null;

  const originalOrder = order.originalOrder || order;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div
        dir="rtl"
        className="fixed top-1/2 left-1/2 z-50 w-full max-w-4xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">
            تفاصيل العملية
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Order Information */}
            <section className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5 text-blue-600" />
                معلومات العملية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">رقم العملية:</span>
                  <p className="text-base font-medium text-gray-900">
                    {originalOrder.refId || originalOrder.refDocId || originalOrder.id || "غير محدد"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">التاريخ والوقت:</span>
                  <p className="text-base font-medium text-gray-900">
                    {formatDate(originalOrder.createdDate || originalOrder.orderDate)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">الحالة:</span>
                  <p className="text-base font-medium text-gray-900">
                    {originalOrder.status === "done" ? "مكتملة" : originalOrder.status || "غير محدد"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">إجمالي العملية:</span>
                  <p className="text-base font-medium text-blue-600">
                    {formatCurrency(originalOrder.totalPrice)} ر.س
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">عدد اللترات:</span>
                  <p className="text-base font-medium text-gray-900">
                    {formatCurrency(originalOrder.totalLitre)} لتر
                  </p>
                </div>
              </div>
            </section>

            {/* Station Details */}
            <section className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                معلومات المحطة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">اسم المحطة:</span>
                  <p className="text-base font-medium text-gray-900">
                    {getText(originalOrder.carStation?.name) || "غير محدد"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">العنوان:</span>
                  <p className="text-base font-medium text-gray-900">
                    {originalOrder.carStation?.address || "غير محدد"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    الموقع:
                  </span>
                  <p className="text-base font-medium text-gray-900 mt-1">
                    {formatLocation(originalOrder.carStation?.formattedLocation)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    رقم الهاتف:
                  </span>
                  <p className="text-base font-medium text-gray-900 mt-1">
                    {originalOrder.carStation?.phoneNumber || "غير محدد"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    البريد الإلكتروني:
                  </span>
                  <p className="text-base font-medium text-gray-900 mt-1">
                    {originalOrder.carStation?.email || "غير محدد"}
                  </p>
                </div>
              </div>
            </section>

            {/* Selected Option */}
            {originalOrder.selectedOption && (
              <section className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-blue-600" />
                  نوع الوقود المختار
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">النوع:</span>
                    <p className="text-base font-medium text-gray-900">
                      {originalOrder.selectedOption.name?.ar || 
                       originalOrder.selectedOption.name?.en || 
                       originalOrder.selectedOption.title?.ar || 
                       originalOrder.selectedOption.title?.en || 
                       "غير محدد"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">رقم المنتج:</span>
                    <p className="text-base font-medium text-gray-900">
                      {originalOrder.selectedOption.refId || originalOrder.selectedOption.onyxProductId || "غير محدد"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">السعر:</span>
                    <p className="text-base font-medium text-blue-600">
                      {formatCurrency(originalOrder.selectedOption.price)} ر.س
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">سعر الشركة:</span>
                    <p className="text-base font-medium text-gray-900">
                      {formatCurrency(originalOrder.selectedOption.companyPrice)} ر.س
                    </p>
                  </div>
                  {originalOrder.selectedOption.desc && (
                    <div className="md:col-span-2">
                      <span className="text-sm text-gray-600">الوصف:</span>
                      <p className="text-base font-medium text-gray-900">
                        {getText(originalOrder.selectedOption.desc)}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* All Available Options */}
            {originalOrder.service?.options && Array.isArray(originalOrder.service.options) && originalOrder.service.options.length > 0 && (
              <section className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  جميع الخيارات المتاحة
                </h3>
                <div className="space-y-3">
                  {originalOrder.service.options.map((option: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        originalOrder.selectedOption?.id === option.id ||
                        originalOrder.selectedOption?.refId === option.refId
                          ? "bg-blue-100 border-blue-300"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <span className="text-xs text-gray-600">النوع:</span>
                          <p className="text-sm font-medium text-gray-900">
                            {option.name?.ar || 
                             option.name?.en || 
                             option.title?.ar || 
                             option.title?.en || 
                             "غير محدد"}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-600">السعر:</span>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(option.price)} ر.س
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-600">سعر الشركة:</span>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(option.companyPrice)} ر.س
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Client Information */}
            {originalOrder.client && (
              <section className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  معلومات العميل
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">اسم العميل:</span>
                    <p className="text-base font-medium text-gray-900">
                      {getText(originalOrder.client.name) || "غير محدد"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      البريد الإلكتروني:
                    </span>
                    <p className="text-base font-medium text-gray-900 mt-1">
                      {originalOrder.client.email || "غير محدد"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      رقم الهاتف:
                    </span>
                    <p className="text-base font-medium text-gray-900 mt-1">
                      {originalOrder.client.phoneNumber || "غير محدد"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">الرصيد:</span>
                    <p className="text-base font-medium text-gray-900">
                      {formatCurrency(originalOrder.client.balance)} ر.س
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Car Information */}
            {originalOrder.clientCar && (
              <section className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-orange-600" />
                  معلومات السيارة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">اسم السيارة:</span>
                    <p className="text-base font-medium text-gray-900">
                      {getText(originalOrder.clientCar.name) || "غير محدد"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">نوع السيارة:</span>
                    <p className="text-base font-medium text-gray-900">
                      {getText(originalOrder.clientCar.carType?.name) || "غير محدد"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">رقم اللوحة:</span>
                    <p className="text-base font-medium text-gray-900">
                      {getText(originalOrder.clientCar.plateNumber) || "غير محدد"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">سنة الصنع:</span>
                    <p className="text-base font-medium text-gray-900">
                      {originalOrder.clientCar.carType?.year || "غير محدد"}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Worker Information */}
            {originalOrder.fuelStationsWorker && (
              <section className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-600" />
                  معلومات العامل
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">اسم العامل:</span>
                    <p className="text-base font-medium text-gray-900">
                      {originalOrder.fuelStationsWorker.name || "غير محدد"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      البريد الإلكتروني:
                    </span>
                    <p className="text-base font-medium text-gray-900 mt-1">
                      {originalOrder.fuelStationsWorker.email || "غير محدد"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      رقم الهاتف:
                    </span>
                    <p className="text-base font-medium text-gray-900 mt-1">
                      {originalOrder.fuelStationsWorker.phoneNumber || "غير محدد"}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Company Information */}
            {originalOrder.stationsCompany && (
              <section className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-600" />
                  معلومات الشركة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">اسم الشركة:</span>
                    <p className="text-base font-medium text-gray-900">
                      {originalOrder.stationsCompany.name || "غير محدد"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">العنوان:</span>
                    <p className="text-base font-medium text-gray-900">
                      {originalOrder.stationsCompany.address || "غير محدد"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      رقم الهاتف:
                    </span>
                    <p className="text-base font-medium text-gray-900 mt-1">
                      {originalOrder.stationsCompany.phoneNumber || "غير محدد"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      البريد الإلكتروني:
                    </span>
                    <p className="text-base font-medium text-gray-900 mt-1">
                      {originalOrder.stationsCompany.email || "غير محدد"}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            إغلاق
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

