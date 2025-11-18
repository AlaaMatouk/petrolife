import React, { ReactNode, useState, useRef, useEffect } from "react";
import { Sun, Moon, Search, User, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../config/firebase";
import { signOutUser } from "../../../services/auth";
import { useGlobalState } from "../../../context/GlobalStateContext";
import { useUI } from "../../../hooks/useGlobalState";
import { NotificationDropdown } from "../Notification";
import { CartDropdown } from "../Cart";
import { ROUTES } from "../../../constants/routes";

// Breadcrumb route mapping
const breadcrumbRoutes: Record<string, string> = {
  "لوحة التحكم": "/dashboard",
  التقــــــــــــــــارير: "/financialreports",
  محفظــــــــــــــتي: "/wallet",
  السيــــــــــــــارات: "/cars",
  الســـــــــــــــائقين: "/drivers",
  الاشتراكـــــــــــات: "/subscriptions",
  المشرفين: "/supervisors",
};

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export interface HeaderProps {
  title: string;
  titleIconSrc?: React.ReactNode;
  showSearch?: boolean;
  searchProps?: SearchBarProps;
  extraContent?: ReactNode;
  className?: string;
  admin?: boolean;
  serviceDistributer?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "البحث...",
  onSearch,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
    console.log("Search query:", searchQuery);
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className={`flex items-center h-[46px] w-full min-w-[300px] sm:min-w-[400px] lg:min-w-[500px] rounded-full border border-[color:var(--border-subtle)] bg-[var(--surface-control)] px-4 shadow-sm transition-colors duration-300 ${className}`}
      role="search"
    >
      {/* Input */}
      <input
        type="search"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder={placeholder}
        dir="rtl"
        className="flex-1 text-sm text-[var(--text-primary)] bg-transparent border-none outline-none placeholder:text-[var(--text-placeholder)] text-right pr-2 transition-colors duration-300"
      />
      {/* Icon */}
      <button
        type="submit"
        className="flex items-center justify-center text-[var(--text-secondary)] hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-[var(--ring-primary)] rounded-full transition-opacity p-1"
        aria-label="Submit search"
      >
        <Search className="w-4 h-4" />
      </button>
    </form>
  );
};

// Profile Dropdown Component
const ProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { dispatch } = useGlobalState();
  const currentUser = auth.currentUser;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOutUser();

      // Clear global state
      dispatch({ type: "SET_USER", payload: null });
      dispatch({ type: "SET_AUTHENTICATED", payload: false });

      console.log("Logout successful ✅");
      navigate("/");
    } catch (error: any) {
      console.error("Logout error ❌:", error.message);
    }
  };

  // If no user is logged in, don't show the profile dropdown
  if (!currentUser) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 bg-color-mode-surface-primary-blue rounded-full border-2 border-[var(--surface-navbar)] hover:border-[var(--border-medium)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-primary)] transition-all duration-200"
        aria-label="User profile menu"
      >
        {currentUser.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt="Profile"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-[var(--surface-popover)] rounded-lg shadow-lg border border-[color:var(--border-subtle)] z-50 transition-colors duration-300">
          <div className="p-4 border-b border-[color:var(--border-subtle)]">
            <p className="text-sm font-semibold text-[var(--text-primary)] text-right transition-colors duration-300">
              {currentUser.displayName || "مستخدم"}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] text-right truncate transition-colors duration-300">
              {currentUser.email}
            </p>
          </div>

          <div className="py-2">
            <button
              onClick={() => {
                navigate(ROUTES.PROFILE);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-right text-sm text-[var(--text-primary)] hover:bg-[var(--surface-control-muted)] transition-colors duration-150 flex items-center justify-end gap-2"
            >
              <span>الملف الشخصي</span>
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-right text-sm text-red-500 hover:bg-red-500/10 transition-colors duration-150 flex items-center justify-end gap-2"
            >
              <span>تسجيل الخروج</span>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Breadcrumb Component
const Breadcrumb: React.FC<{ title: string; titleIconSrc?: ReactNode }> = ({
  title,
  titleIconSrc,
}) => {
  const navigate = useNavigate();

  // Split title by "/" to create breadcrumbs
  const parts = title.split("/").map((part) => part.trim());

  const handleBreadcrumbClick = (part: string, index: number) => {
    // First part (index 0) is the parent (clickable)
    // Last part is the current page (not clickable)
    if (index < parts.length - 1) {
      const route = breadcrumbRoutes[part];
      if (route) {
        navigate(route);
      }
    }
  };

  return (
    <div className="flex items-center gap-2" dir="rtl">
      {titleIconSrc && <span>{titleIconSrc}</span>}
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-[var(--header-breadcrumb-color)]">/</span>
          )}
          <button
            onClick={() => handleBreadcrumbClick(part, index)}
            className={`text-lg font-normal ${
              index === parts.length - 1
                ? "text-[var(--header-breadcrumb-active)] cursor-default"
                : "text-[var(--header-breadcrumb-color)] hover:text-color-mode-text-icons-t-blue cursor-pointer transition-colors"
            }`}
            disabled={index === parts.length - 1}
          >
            {part}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({
  title,
  titleIconSrc,
  showSearch = false,
  searchProps,
  extraContent,
  className = "",
  admin = false,
  serviceDistributer = false,
  
}) => {
  const { theme, setTheme } = useUI();
  const isDark = theme === "dark";

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <header
      className={`w-full bg-[var(--surface-navbar)] shadow-sm border-b border-[color:var(--border-subtle)] transition-colors duration-300 ${className}`}
      role="banner"
    >
      <div className="flex flex-wrap w-full max-w-7xl mx-auto items-center justify-between px-4 lg:px-8 md:px-4 sm:px-2 py-4 gap-3">
        {/* Navigation Icons ثابتة */}
        <nav
          className="flex items-center gap-3"
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Profile Dropdown - First on the left (hidden for service distributer) */}
          {!serviceDistributer && <ProfileDropdown />}

          {/* Notification Dropdown - Hide for admin */}
          {!admin && <NotificationDropdown />}

          {/* Cart Dropdown - Hide for admin or service distributer */}
          {!admin && !serviceDistributer && <CartDropdown />}

          <button
            onClick={handleThemeToggle}
            className={`flex items-center justify-center w-10 h-10 rounded-md border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--ring-primary)] ${
              isDark
                ? "bg-[var(--surface-control)] border-[color:var(--border-medium)] hover:bg-[var(--surface-control-hover)]"
                : "bg-[var(--surface-control)] border-[color:var(--border-subtle)] hover:bg-[var(--surface-control-hover)]"
            }`}
            aria-pressed={isDark}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[var(--text-secondary)]" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--text-secondary)]" />
            )}
          </button>

          <button className="flex items-center justify-center w-10 h-10 rounded-md border bg-[var(--surface-control)] border-[color:var(--border-subtle)] hover:bg-[var(--surface-control-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-primary)] transition-colors duration-200">
            <span className="font-medium text-[var(--text-secondary)] text-sm transition-colors duration-300">
              EN
            </span>
          </button>
        </nav>

        {/* Right Section */}
        <div className="flex flex-wrap items-center justify-end gap-2 w-auto sm:w-auto flex-1 sm:flex-none">
          {/* Search Bar */}
          {showSearch && (
            <div className="w-full sm:w-auto mr-2 flex-1 max-w-[600px]">
              <SearchBar {...searchProps} />
            </div>
          )}

          {/* Breadcrumb Title + Icon */}
          <Breadcrumb title={title} titleIconSrc={titleIconSrc} />

          {/* Extra Content */}
          {extraContent && (
            <div className="flex items-center">{extraContent}</div>
          )}
        </div>
      </div>
    </header>
  );
};
