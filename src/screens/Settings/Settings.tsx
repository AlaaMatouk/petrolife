import React, { useState } from "react";
import { Layout } from "../../components/shared";
import { navigationMenuData, userInfo } from "../../constants/data";
import { Settings as SettingsIcon, Info, FileText, Lock, Shield } from "lucide-react";
import { GeneralInformationSection } from "./sections/GeneralInformationSection/GeneralInformationSection";
import { DocumentsSection } from "./sections/DocumentsSection/DocumentsSection";
import { SecuritySection } from "./sections/SecuritySection/SecuritySection";
import { PlatformPolicySection } from "./sections/PlatformPolicySection/PlatformPolicySection";

type SettingsTab = "general" | "documents" | "security" | "policy";

export const Settings = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const settingsTabs = [
    {
      id: "general" as SettingsTab,
      label: "المعلومات العامة",
      icon: <Info className="w-5 h-5" />,
    },
    {
      id: "documents" as SettingsTab,
      label: "الوثائق",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: "security" as SettingsTab,
      label: "الحماية والأمان",
      icon: <Lock className="w-5 h-5" />,
    },
    {
      id: "policy" as SettingsTab,
      label: "سياسة المنصة",
      icon: <Shield className="w-5 h-5" />,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralInformationSection />;
      case "documents":
        return <DocumentsSection />;
      case "security":
        return <SecuritySection />;
      case "policy":
        return <PlatformPolicySection />;
      default:
        return <GeneralInformationSection />;
    }
  };

  return (
    <Layout
      headerProps={{
        title: "الإعدادات العامة",
        titleIconSrc: <SettingsIcon className="w-5 h-5 text-gray-500" />,
        showSearch: true,
        searchProps: {
          placeholder: "بحث برقم العميل / العملية السجل التجاري / رقم الهاتف",
        },
      }}
      sidebarProps={{
        sections: navigationMenuData.sections,
        topItems: navigationMenuData.topItems,
        bottomItems: navigationMenuData.bottomItems,
        userInfo: userInfo,
      }}
    >
      <div className="flex w-full gap-6" dir="rtl">
        {/* Settings Navigation Sidebar - Right Side (in RTL) */}
        <div className="w-64 flex-shrink-0 bg-white rounded-lg border border-[color:var(--border-subtle)] p-4">
          <div className="flex flex-col gap-2">
            {settingsTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-right ${
                    isActive
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-white text-[var(--text-primary)] hover:bg-gray-50"
                  }`}
                >
                  {isActive && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                  )}
                  <span className={isActive ? "text-white" : "text-[var(--text-primary)]"}>
                    {tab.icon}
                  </span>
                  <span className={`text-sm font-medium ${isActive ? "text-white" : "text-[var(--text-primary)]"}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area - Left Side (in RTL) */}
        <div className="flex-1 min-w-0">{renderContent()}</div>
      </div>
    </Layout>
  );
};
