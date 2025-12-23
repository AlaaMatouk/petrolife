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
        <div className="w-fit h-fit flex-shrink-0 bg-white rounded-lg border-2 border-gray-400 p-5">
          <div className="flex flex-col gap-[var(--corner-radius-small)]">
            {settingsTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-3 pt-[var(--corner-radius-small)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-large)] rounded-[var(--corner-radius-small)] transition-colors text-right ${
                    isActive
                      ? "border-[0.7px] border-solid border-color-mode-text-icons-t-blue"
                      : "bg-white border-0 hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  {/* Dark blue top-left corner accent */}
                  {isActive && (
                    <img
                      className="absolute top-0 left-0 w-3.5 h-3.5"
                      alt="Selected"
                      src="/img/rectangle-22DI.svg"
                    />
                  )}
                  <span className={isActive ? "text-color-mode-text-icons-t-blue" : "text-color-mode-text-icons-t-sec"}>
                    {tab.icon}
                  </span>
                  <span
                    className={`relative w-fit text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] font-body-body-2 font-[number:var(--body-body-2-font-weight)] [font-style:var(--body-body-2-font-style)] ${
                      isActive
                        ? "text-[var(--text-primary)]"
                        : "text-color-mode-text-icons-t-sec"
                    }`}
                  >
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
