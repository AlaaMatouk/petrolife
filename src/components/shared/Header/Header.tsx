import React, { ReactNode, useState, useRef, useEffect } from "react";
import { Sun, Search, User, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../config/firebase";
import { signOutUser } from "../../../services/auth";
import { useGlobalState } from "../../../context/GlobalStateContext";
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
      className={`flex items-center h-[46px] w-full min-w-[300px] sm:min-w-[400px] lg:min-w-[500px] rounded-full border border-gray-300 bg-white px-4 shadow-sm ${className}`}
      role="search"
    >
      {/* Input */}
      <input
        type="search"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder={placeholder}
        dir="rtl"
        className="flex-1 text-sm text-color-mode-text-icons-t-primary-gray bg-transparent border-none outline-none placeholder-color-mode-text-icons-t-placeholder text-right pr-2"
      />
      {/* Icon */}
      <button
        type="submit"
        className="flex items-center justify-center text-gray-500 hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-color-mode-surface-primary-blue rounded-full transition-opacity p-1"
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
        className="flex items-center justify-center w-10 h-10 bg-color-mode-surface-primary-blue rounded-full border-2 border-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
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
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-700 text-right">
              {currentUser.displayName || "مستخدم"}
            </p>
            <p className="text-xs text-gray-500 text-right truncate">
              {currentUser.email}
            </p>
          </div>

          <div className="py-2">
            <button
              onClick={() => {
                navigate(ROUTES.PROFILE);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center justify-end gap-2"
            >
              <span>الملف الشخصي</span>
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center justify-end gap-2"
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
          {index > 0 && <span className="text-[#5B738B]">/</span>}
          <button
            onClick={() => handleBreadcrumbClick(part, index)}
            className={`text-lg font-normal ${
              index === parts.length - 1
                ? "text-[#5B738B] cursor-default"
                : "text-[#5B738B] hover:text-blue-600 cursor-pointer transition-colors"
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
}) => {
  return (
    <header
      className={`w-full bg-white shadow-sm border-b border-gray-200 ${className}`}
      role="banner"
    >
      <div className="flex flex-wrap w-full max-w-7xl mx-auto items-center justify-between px-4 lg:px-8 md:px-4 sm:px-2 py-4 gap-3">
        {/* Navigation Icons ثابتة */}
        <nav
          className="flex items-center gap-3"
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Profile Dropdown - First on the left */}
          <ProfileDropdown />

          {/* Notification Dropdown - Hide for admin */}
          {!admin && <NotificationDropdown />}

          {/* Cart Dropdown - Hide for admin */}
          {!admin && <CartDropdown />}

          <button className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-md border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200">
            <Sun className="w-4 h-4 text-gray-600" />
          </button>

          <button className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-md border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200">
            <span className="font-medium text-gray-600 text-sm">EN</span>
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
