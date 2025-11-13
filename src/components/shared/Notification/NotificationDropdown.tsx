import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { fetchNotifications } from "../../../services/firestore";

interface NotificationItem {
  id: string;
  body: string;
  createdDate: any;
  companies: string[];
  title?: string;
  [key: string]: any;
}

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err: any) {
      console.error("Error loading notifications:", err);
      setError("فشل تحميل الإشعارات");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    try {
      // Handle Firestore Timestamp
      const jsDate = date?.toDate ? date.toDate() : new Date(date);
      
      const now = new Date();
      const diffMs = now.getTime() - jsDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return "الآن";
      } else if (diffMins < 60) {
        return `منذ ${diffMins} دقيقة`;
      } else if (diffHours < 24) {
        return `منذ ${diffHours} ساعة`;
      } else if (diffDays < 7) {
        return `منذ ${diffDays} يوم`;
      } else {
        return jsDate.toLocaleDateString("ar-SA", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return "تاريخ غير متاح";
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center w-10 h-10 rounded-md border bg-[var(--surface-control)] border-[color:var(--border-subtle)] hover:bg-[var(--surface-control-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-primary)] transition-colors duration-200"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-[var(--text-secondary)]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-[var(--surface-popover)] rounded-lg shadow-xl border border-[color:var(--border-subtle)] z-50 max-h-[500px] overflow-hidden flex flex-col transition-colors duration-300">
          {/* Header */}
          <div className="p-4 border-b border-[color:var(--border-subtle)] bg-[var(--surface-control-muted)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                الإشعارات
              </h3>
              {notifications.length > 0 && (
                <span className="text-xs text-[var(--text-tertiary)]">
                  {notifications.length} إشعار
                </span>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-[var(--text-tertiary)] mt-2">
                  جاري التحميل...
                </p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-sm text-red-500">{error}</p>
                <button
                  onClick={loadNotifications}
                  className="mt-2 text-xs text-blue-500 hover:underline"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-[var(--text-tertiary)]/40 mx-auto mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">
                  لا توجد إشعارات جديدة
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[color:var(--border-subtle)]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-[var(--surface-control-muted)] transition-colors duration-150 cursor-pointer"
                  >
                    {notification.title && (
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1 text-right transition-colors duration-300">
                        {notification.title}
                      </h4>
                    )}
                    <p className="text-sm text-[var(--text-secondary)] text-right mb-2 leading-relaxed transition-colors duration-300">
                      {notification.body}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] text-right transition-colors duration-300">
                      {formatDate(notification.createdDate)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Optional refresh button */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-[color:var(--border-subtle)] bg-[var(--surface-control-muted)]">
              <button
                onClick={loadNotifications}
                className="w-full text-xs text-blue-500 hover:text-blue-400 font-medium py-1 transition-colors duration-200"
              >
                تحديث
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

