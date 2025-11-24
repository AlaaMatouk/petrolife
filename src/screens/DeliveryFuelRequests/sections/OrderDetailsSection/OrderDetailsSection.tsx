import React, { useState, useEffect, useRef } from "react";
import { Table, Pagination, LoadingSpinner } from "../../../../components/shared";
import { MoreVertical, ShoppingCart, RotateCcw, Download, X, Edit, Info, FileDown } from "lucide-react";
import { fetchOrders } from "../../../../services/firestore";
import { createPortal } from "react-dom";
import { useToast } from "../../../../context/ToastContext";
import { exportDataTable } from "../../../../services/exportService";

// Helper function to get status text in Arabic
const getStatusText = (status: string): { text: string; type: string } => {
  const statusMap: { [key: string]: { text: string; type: string } } = {
    'done': { text: 'مكتمل', type: 'completed' },
    'completed': { text: 'مكتمل', type: 'completed' },
    'pending': { text: 'بانتظار التوصيل', type: 'pending' },
    'in progress': { text: 'قيد المعالجة', type: 'reviewing' },
    'reviewing': { text: 'جاري المراجعة', type: 'reviewing' },
    'rejected': { text: 'مرفوض', type: 'rejected' },
    'approved': { text: 'موافق عليه', type: 'completed' },
    'cancelled': { text: 'ملغي', type: 'rejected' },
  };
  return statusMap[status?.toLowerCase()] || { text: status || '-', type: 'pending' };
};

// Helper function to format date
const formatDate = (date: any): string => {
  if (!date) return '-';
  
  try {
    if (date.toDate && typeof date.toDate === 'function') {
      return new Date(date.toDate()).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (date instanceof Date) {
      return date.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return new Date(date).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return String(date);
  }
};

// Helper function to format number
const formatNumber = (num: any): string => {
  if (!num && num !== 0) return '-';
  return new Intl.NumberFormat('en-US').format(Number(num));
};

// Helper function to get product name
const getProductName = (order: any): string => {
  if (order.selectedOption?.name?.ar) return order.selectedOption.name.ar;
  if (order.selectedOption?.name?.en) return order.selectedOption.name.en;
  if (order.selectedOption?.title?.ar) return order.selectedOption.title.ar;
  if (order.selectedOption?.title?.en) return order.selectedOption.title.en;
  
  if (order.cartItems && order.cartItems.length > 0) {
    const labels = order.cartItems.map((item: any) => item.label || item.name).filter(Boolean);
    if (labels.length > 0) return labels.join(', ');
  }
  
  if (order.productName) return order.productName;
  if (order.product?.name) return order.product.name;
  
  return '-';
};

// Helper function to get quantity
const getQuantity = (order: any): string => {
  if (order.totalLitre) {
    return `${formatNumber(order.totalLitre)} لتر`;
  }
  
  if (order.cartItems && order.cartItems.length > 0) {
    const total = order.cartItems.reduce((sum: number, item: any) => {
      return sum + (Number(item.quantity) || 0);
    }, 0);
    if (total > 0) return `${formatNumber(total)} لتر`;
  }
  
  return '-';
};

// Helper function to extract address
const getAddress = (order: any): string => {
  // If location exists and is a string, use it
  if (order.location && typeof order.location === 'string') {
    return order.location;
  }
  
  // If location is an object, try to extract address from it
  if (order.location && typeof order.location === 'object') {
    if (order.location.address) return order.location.address;
    if (order.location.description) return order.location.description;
    if (order.location.name) return order.location.name;
  }
  
  // Fallback to city.name
  if (order.city?.name?.ar) return order.city.name.ar;
  if (order.city?.name?.en) return order.city.name.en;
  
  // Fallback to address field
  if (order.address && typeof order.address === 'string') return order.address;
  
  return '-';
};

// Convert Firestore data to table format
const convertOrdersToTableData = (orders: any[]): any[] => {
  return orders.map((order) => ({
    // Order code: refId or document ID
    id: order.refId || order.id || '-',
    
    // Order date
    date: formatDate(order.orderDate || order.createdDate),
    
    // Product name
    product: getProductName(order),
    
    // Quantity
    quantity: getQuantity(order),
    
    // Total value
    totalValue: order.totalPrice ? `${formatNumber(order.totalPrice)} ر.س` : '-',
    
    // Recipient name: order.recipientName first, then enriched driver name
    recipient: order.recipientName || order.enrichedDriverName || order.assignedDriver?.name || '-',
    
    // Phone: order.phone first, then enriched driver phone
    phone: order.phone || order.enrichedDriverPhone || order.assignedDriver?.phoneNumber || '-',
    
    // Address/Location: extract properly to avoid object rendering
    address: getAddress(order),
    
    // Status
    status: getStatusText(order.status),
    
    _raw: order,
  }));
};

export const OrderDetailsSection = (): JSX.Element => {
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const firestoreOrders = await fetchOrders();
        console.log('🔍 Firestore Orders in Component:', firestoreOrders);
        
        // Filter orders to only show Fuel Delivery orders
        const fuelDeliveryOrders = firestoreOrders.filter(order => {
          const serviceTitleAr = order.service?.title?.ar;
          const serviceTitleEn = order.service?.title?.en;
          const serviceDescAr = order.service?.desc?.ar;
          const serviceDescEn = order.service?.desc?.en;
          
          return serviceTitleAr === 'توصيل الوقود' ||
                 serviceTitleEn === 'Fuel Delivery' ||
                 serviceDescAr === 'عند الطلب وفي أي وقت وفي أي مكان' ||
                 serviceDescEn === 'On-demand, anytime anywhere.';
        });
        
        console.log('🚛 Fuel Delivery Orders Filtered:', fuelDeliveryOrders.length, 'out of', firestoreOrders.length);
        
        const convertedOrders = convertOrdersToTableData(fuelDeliveryOrders);
        console.log('📊 Converted Orders:', convertedOrders);
        
        if (convertedOrders.length > 0) {
          console.log('Sample converted order address:', convertedOrders[0].address);
          console.log('Sample raw order:', convertedOrders[0]._raw);
        }
        
        setOrders(convertedOrders);
      } catch (err) {
        console.error('Error loading orders from Firestore:', err);
        setError('فشل في تحميل بيانات الطلبات.');
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Actions Menu Component
  interface ActionsMenuProps {
    order: any;
    statusType: string;
  }

  const ActionsMenu = ({ order, statusType }: ActionsMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const { addToast } = useToast();

    const updateMenuPosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 200;
      let left = rect.right + 4;
      if (left + menuWidth > window.innerWidth) {
        left = rect.left - menuWidth - 4;
      }
      setMenuPosition({
        top: rect.bottom + 4,
        left: Math.max(4, left),
      });
    };

    useEffect(() => {
      if (isOpen) {
        updateMenuPosition();
        const handleScroll = () => setIsOpen(false);
        const handleResize = () => setIsOpen(false);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleResize);
        return () => {
          window.removeEventListener("scroll", handleScroll, true);
          window.removeEventListener("resize", handleResize);
        };
      }
    }, [isOpen]);

    // Get actions based on status
    const getActions = () => {
      switch (statusType) {
        case "completed":
          return [
            {
              label: "إعادة الطلب",
              icon: RotateCcw,
              onClick: () => handleReorder(order),
              color: "text-orange-600 hover:bg-orange-50",
            },
            {
              label: "تصدير البيانات",
              icon: FileDown,
              onClick: () => handleExportData(order),
              color: "text-blue-600 hover:bg-blue-50",
            },
          ];
        case "reviewing":
          return [
            {
              label: "الغاء الطلب",
              icon: X,
              onClick: () => handleCancelRequest(order),
              color: "text-red-600 hover:bg-red-50",
            },
            {
              label: "تعديل البيانات",
              icon: Edit,
              onClick: () => handleEditData(order),
              color: "text-blue-600 hover:bg-blue-50",
            },
          ];
        case "rejected":
          return [
            {
              label: "سبب الرفض",
              icon: Info,
              onClick: () => handleRejectionReason(order),
              color: "text-red-600 hover:bg-red-50",
            },
          ];
        case "pending":
          return [
            {
              label: "تصدير البيانات",
              icon: FileDown,
              onClick: () => handleExportData(order),
              color: "text-blue-600 hover:bg-blue-50",
            },
          ];
        default:
          return [];
      }
    };

    const actions = getActions();

    const handleReorder = (order: any) => {
      setIsOpen(false);
      // TODO: Implement reorder functionality
      addToast({
        title: "إعادة الطلب",
        message: `سيتم إعادة طلب ${order.id}`,
        type: "info",
      });
    };

    const handleExportData = async (order: any) => {
      setIsOpen(false);
      try {
        const exportColumns = [
          { key: "id", label: "كود الطلب" },
          { key: "date", label: "تاريخ الطلب" },
          { key: "product", label: "اسم المنتج" },
          { key: "quantity", label: "الكمية" },
          { key: "totalValue", label: "اجمالي القيمة" },
          { key: "recipient", label: "اسم المستلم" },
          { key: "phone", label: "رقم الهاتف" },
          { key: "address", label: "العنوان" },
          { key: "status", label: "حالة الطلب" },
        ];

        // Format order data for export
        const exportData = {
          id: order.id,
          date: order.date,
          product: order.product,
          quantity: order.quantity,
          totalValue: order.totalValue,
          recipient: order.recipient,
          phone: order.phone,
          address: order.address,
          status: order.status?.text || "-",
        };

        await exportDataTable(
          [exportData],
          exportColumns,
          `fuel-delivery-${order.id}`,
          "excel",
          `تقرير طلب التوصيل - ${order.id}`
        );

        addToast({
          title: "نجح التصدير",
          message: "تم تصدير بيانات الطلب بنجاح",
          type: "success",
        });
      } catch (error) {
        console.error("Export error:", error);
        addToast({
          title: "فشل التصدير",
          message: "حدث خطأ أثناء تصدير البيانات",
          type: "error",
        });
      }
    };

    const handleCancelRequest = (order: any) => {
      setIsOpen(false);
      // TODO: Implement cancel request functionality
      addToast({
        title: "الغاء الطلب",
        message: `سيتم إلغاء طلب ${order.id}`,
        type: "info",
      });
    };

    const handleEditData = (order: any) => {
      setIsOpen(false);
      // TODO: Implement edit data functionality
      addToast({
        title: "تعديل البيانات",
        message: `سيتم فتح نموذج تعديل طلب ${order.id}`,
        type: "info",
      });
    };

    const handleRejectionReason = (order: any) => {
      setIsOpen(false);
      // TODO: Implement show rejection reason functionality
      addToast({
        title: "سبب الرفض",
        message: `عرض سبب رفض طلب ${order.id}`,
        type: "info",
      });
    };

    if (actions.length === 0) return null;

    return (
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(updateMenuPosition, 0);
            }
          }}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="إجراءات"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            {createPortal(
              <div
                className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
                style={{ top: menuPosition.top, left: menuPosition.left }}
              >
                <div className="py-1">
                  {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={action.onClick}
                        className={`w-full px-4 py-2 text-right text-sm flex items-center justify-end gap-2 transition-colors ${action.color}`}
                      >
                        <span>{action.label}</span>
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>,
              document.body
            )}
          </>
        )}
      </div>
    );
  };

  const tableColumns = [
    {
      key: "actions",
      label: "الإجراءات",
      width: "w-[80px] min-w-[80px]",
      render: (_value: any, row: any) => (
        <ActionsMenu order={row} statusType={row.status?.type || "pending"} />
      ),
    },
    {
      key: "status",
      label: "حالة الطلب",
      width: "flex-1 grow min-w-[140px]",
      render: (value: any) => {
        const styles = getStatusStyles(value.type);
        return (
          <div className={`inline-flex items-center justify-center gap-2 px-3 py-1 ${styles.container} rounded-md`}>
            <div className={`w-1.5 h-1.5 ${styles.dot} rounded-full`} />
            <span className={`text-sm font-medium ${styles.text}`}>
              {value.text}
            </span>
          </div>
        );
      },
    },
    {
      key: "address",
      label: "العنوان",
      width: "flex-1 grow min-w-[200px]",
    },
    {
      key: "phone",
      label: "رقم الهاتف",
      width: "w-[120px] min-w-[120px]",
    },
    {
      key: "recipient",
      label: "اسم المستلم",
      width: "w-[110px] min-w-[110px]",
    },
    {
      key: "totalValue",
      label: "اجمالي القيمة",
      width: "w-[100px] min-w-[100px]",
    },
    {
      key: "quantity",
      label: "الكمية",
      width: "w-[70px] min-w-[70px]",
    },
    {
      key: "product",
      label: "اسم المنتج",
      width: "w-[100px] min-w-[100px]",
    },
    {
      key: "date",
      label: "تاريخ الطلب",
      width: "w-[180px] min-w-[180px]",
    },
    {
      key: "id",
      label: "كود الطلب",
      width: "w-[80px] min-w-[80px]",
    },
  ];

  const getStatusStyles = (type: string) => {
    switch (type) {
      case "completed":
        return {
          container: "bg-gray-100",
          text: "text-gray-700",
          dot: "bg-gray-500",
        };
      case "reviewing":
        return {
          container: "bg-orange-100",
          text: "text-orange-700",
          dot: "bg-orange-500",
        };
      case "rejected":
        return {
          container: "bg-red-100",
          text: "text-red-700",
          dot: "bg-red-500",
        };
      case "pending":
        return {
          container: "bg-[#EBF8FF]",
          text: "text-blue-700",
          dot: "bg-blue-500",
        };
      default:
        return {
          container: "bg-gray-100",
          text: "text-gray-700",
          dot: "bg-gray-500",
        };
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate pagination
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOrders = orders.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="flex flex-col items-start gap-7 relative self-stretch w-full flex-[0_0_auto]">
        <LoadingSpinner size="lg" message="جاري التحميل..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-7 relative self-stretch w-full flex-[0_0_auto]">
        <div className="w-full bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 text-center text-lg [direction:rtl]">{error}</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-start gap-7 relative self-stretch w-full flex-[0_0_auto]">
        <div className="w-full bg-white rounded-lg border border-gray-200 p-12">
          <div className="text-center text-gray-500">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold [direction:rtl]">لا توجد طلبات</p>
            <p className="text-sm mt-2 [direction:rtl]">لم يتم العثور على أي طلبات توصيل</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-7 relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex flex-col items-start gap-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto]">
        <Table
          columns={tableColumns}
          data={paginatedOrders}
          className="w-full"
          headerClassName="bg-color-mode-surface-bg-icon-gray"
          rowClassName="hover:bg-gray-50"
          cellClassName="text-right [direction:rtl] whitespace-nowrap"
        />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages || 1}
        onPageChange={handlePageChange}
        className="flex items-center justify-around gap-[46px] relative self-stretch w-full flex-[0_0_auto]"
      />
    </div>
  );
};
