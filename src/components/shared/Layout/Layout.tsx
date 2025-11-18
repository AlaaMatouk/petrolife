import React, { ReactNode } from "react";
import { Header, HeaderProps } from "../Header/Header";
import { Footer } from "../Footer/Footer";
import { SidebarNav, SidebarNavProps } from "../SidebarNav/SidebarNav";
import { useUI } from "../../../hooks/useGlobalState";

export interface LayoutProps {
  children: ReactNode;
  headerProps: HeaderProps;
  sidebarProps: SidebarNavProps;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  headerProps,
  sidebarProps,
  className = "",
}) => {
  const { sidebarCollapsed } = useUI();
  
  return (
    <div
      className={`min-h-screen w-full flex flex-row-reverse transition-colors duration-300 bg-[var(--surface-page)] text-[var(--text-primary)] ${className}`}
    >
      {/* Sidebar - Full height on the right */}
      <aside
        className={`${
          sidebarCollapsed ? "w-16" : "w-72 md:w-60 sm:w-52"
        } bg-[var(--surface-sidebar)] border-l border-[color:var(--border-subtle)] flex-shrink-0 hidden md:block shadow-sm transition-all duration-300`}
      >
        <SidebarNav {...sidebarProps} />
      </aside>

      {/* Page content: Header + Main + Footer */}
      <div className="flex flex-col flex-1 min-h-screen">
        {/* Header - Starts after the sidebar */}
        <header className="w-full bg-[var(--surface-navbar)] shadow-sm border-b border-[color:var(--border-subtle)] z-50 transition-colors duration-300">
          <Header {...headerProps} />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-[var(--surface-page)] transition-colors duration-300">
          <div className="p-4 lg:p-6 md:p-4 sm:p-3 max-w-7xl mx-auto text-[var(--text-primary)] transition-colors duration-300">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full bg-[var(--surface-navbar)] border-t border-[color:var(--border-subtle)] z-50 transition-colors duration-300">
          <Footer />
        </footer>
      </div>
    </div>
  );
};
