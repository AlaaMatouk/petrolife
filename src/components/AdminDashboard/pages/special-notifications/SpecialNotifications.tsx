import { useState, useMemo, useEffect } from "react";
import { Table, Pagination, ExportButton, LoadingSpinner } from "../../../shared";
import { Bell, MoreVertical, Send, Edit, Trash2, CirclePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { exportDataTable } from "../../../../services/exportService";
import { useToast } from "../../../../context/ToastContext";
import { fetchAllNotifications, mapNotificationToTableFormat } from "../../../../services/notificationService";

// Action Menu Component for each row
interface ActionMenuProps {
  item: any;
  navigate: any;
}

const ActionMenu = ({ item, navigate }: ActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const updateMenuPosition = () => {
    if (!buttonRef) return;
    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 192;
    let left = rect.right + 4;
    if (left + menuWidth > window.innerWidth) {
      left = rect.left - menuWidth - 4;
    }
    setMenuPosition({
      top: rect.bottom + 4,
      left: Math.max(4, left),
    });
  };

  const handleAction = (action: string) => {
    if (action === "resend") {
      console.log("Resend notification:", item.id);
      // TODO: Implement resend notification logic
    } else if (action === "edit") {
      navigate(`/special-notifications/${item.id}`);
    } else if (action === "delete") {
      console.log("Delete notification:", item.id);
      // TODO: Show confirmation dialog and handle delete
    }
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      updateMenuPosition();
      const handleScroll = () => updateMenuPosition();
      const handleResize = () => updateMenuPosition();
      window.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isOpen, buttonRef]);

  return (
    <div className="relative">
      <button
        ref={setButtonRef}
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(updateMenuPosition, 0);
        }}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="إجراءات"
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          {createPortal(
            <div
              className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <div className="py-1">
                <button
                  onClick={() => handleAction("resend")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>إعادة ارسال الاشعار</span>
                  <Send className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleAction("edit")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>تعديل الاشعار</span>
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleAction("delete")}
                  className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>حذف الاشعار</span>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
};

const SpecialNotifications = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Fetch notifications from Firestore
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("🔄 Starting to load notifications...");
        
        // Fetch notifications
        const fetchedNotifications = await fetchAllNotifications();
        console.log("📊 Fetched notifications:", fetchedNotifications.length);
        
        // Map to table format
        const mappedNotifications = fetchedNotifications.map(mapNotificationToTableFormat);
        console.log("📋 Mapped notifications:", mappedNotifications.length);
        
        setNotifications(mappedNotifications);
        console.log("✅ Notifications state updated with", mappedNotifications.length, "items");
      } catch (error: any) {
        console.error("❌ Error loading notifications:", error);
        console.error("Error type:", error?.constructor?.name);
        console.error("Error message:", error?.message);
        console.error("Error stack:", error?.stack);
        
        const errorMessage = error?.message || "فشل في تحميل الاشعارات المخصصة";
        setError(errorMessage);
        addToast({
          type: "error",
          title: "خطأ في تحميل البيانات",
          message: errorMessage + ". يرجى التحقق من وحدة التحكم للمزيد من التفاصيل.",
        });
        setNotifications([]);
      } finally {
        setLoading(false);
        console.log("🏁 Loading completed");
      }
    };

    loadNotifications();
  }, [addToast]);

  const columns = useMemo(
    () => [
      {
        key: "actions",
        label: "",
        width: "w-16",
        priority: "high",
        render: (_: any, row: any) => (
          <div className="flex items-center justify-center">
            <ActionMenu item={row} navigate={navigate} />
          </div>
        ),
      },
      {
        key: "lastSendDate",
        label: "اخر تاريخ للارسال",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "targeting",
        label: "التوجيه",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "creator",
        label: "المنشئ",
        width: "min-w-[150px]",
        priority: "high",
        render: (value: { name: string; avatar?: string }) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold text-sm">
              {value.avatar ? (
                <img
                  src={value.avatar}
                  alt={value.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                value.name.charAt(0)
              )}
            </div>
            <span className="font-medium text-gray-900">{value.name}</span>
          </div>
        ),
      },
      {
        key: "description",
        label: "نص الاعلان",
        width: "min-w-[200px]",
        priority: "medium",
      },
      {
        key: "title",
        label: "عنوان الاعلان",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "number",
        label: "الرقم",
        width: "min-w-[80px]",
        priority: "high",
      },
    ],
    [navigate]
  );

  const paginatedData = useMemo(
    () =>
      notifications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [currentPage, notifications]
  );

  const handleExport = async (format: string) => {
    try {
      const exportColumns = [
        { key: "number", label: "الرقم" },
        { key: "title", label: "عنوان الاعلان" },
        { key: "description", label: "نص الاعلان" },
        { key: "targeting", label: "التوجيه" },
        { key: "creator", label: "المنشئ" },
        { key: "lastSendDate", label: "اخر تاريخ للارسال" },
        { key: "creationDate", label: "تاريخ الانشاء" },
      ];

      const exportData = notifications.map((item) => ({
        ...item,
        creator: item.creator?.name || "-",
      }));

      await exportDataTable(
        exportData,
        exportColumns,
        "special-notifications",
        format as "excel" | "pdf",
        "تقرير الاشعارات المخصصة"
      );

      addToast({
        type: "success",
        title: "نجح التصدير",
        message: `تم تصدير البيانات بنجاح كـ ${format === "excel" ? "Excel" : "PDF"}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      addToast({
        type: "error",
        title: "فشل التصدير",
        message: "حدث خطأ أثناء تصدير البيانات",
      });
    }
  };

  return (
    <div
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        {/* Title on right with icon */}
        <div className="flex items-center justify-end gap-1.5" dir="rtl">
          <Bell className="w-5 h-5 text-gray-500" />
          <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
            الاشعارات المخصصة ({notifications.length})
          </h1>
        </div>
        {/* Buttons on left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/special-notifications/add")}
            className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
          >
            <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                  إضافة اشعار جديد
                </span>
              </div>
              <CirclePlus className="w-4 h-4 text-gray-500" />
            </div>
          </button>
          <ExportButton onExport={handleExport} buttonText="تصدير" />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="w-full p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-800 font-semibold">خطأ:</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Table Section */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Bell className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">لا توجد اشعارات مخصصة</p>
          <p className="text-gray-400 text-sm mt-2">لم يتم العثور على أي اشعارات في قاعدة البيانات</p>
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <Table columns={columns} data={paginatedData} />
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(notifications.length / itemsPerPage) || 1}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default SpecialNotifications;

