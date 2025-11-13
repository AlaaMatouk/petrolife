import React from 'react';

interface LogoutButtonProps {
  onLogout?: () => void;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout }) => {
  if (!onLogout) return null;

  return (
    <button
      onClick={onLogout}
      className="flex items-center justify-end gap-3 w-full py-3 px-4 rounded-lg transition-all duration-200 hover:bg-red-500/10"
      role="menuitem"
      tabIndex={0}
      aria-label="تسجيل الخروج"
    >
      <span className="flex-1 text-sm font-medium text-red-500 text-right whitespace-nowrap">
        تسجيل الخروج
      </span>
      <img
        className="w-5 h-5 flex-shrink-0"
        alt="Logout icon"
        src="/img/side-icons-13.svg"
      />
    </button>
  );
};
