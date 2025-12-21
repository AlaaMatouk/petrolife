import { useState } from "react";
import { MessageCircle, HelpCircle } from "lucide-react";
import CompanyFAQ from "../FAQ/FAQ";
import ZaiaChatWidget from "./ZaiaChatWidget";

const TechnicalSupport = () => {
  const [activeTab, setActiveTab] = useState<"contact" | "faq">("contact");

  return (
    <div
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
      dir="rtl"
    >
      {/* Header with Title on Left and Tabs on Right */}
      <div className="flex items-center justify-between w-full border-b border-gray-200 pb-4">
        {/* Title on the Left */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">الدعم الفني</h1>
          <MessageCircle className="w-5 h-5 text-purple-600" />
        </div>

        {/* Tabs on the Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("contact")}
            className={`px-6 py-3 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === "contact"
                ? "text-purple-900 bg-purple-50 border-2 border-purple-600"
                : "text-gray-400 bg-white border-2 border-transparent hover:text-gray-600"
            }`}
          >
            <MessageCircle
              className={`w-5 h-5 ${
                activeTab === "contact" ? "text-purple-600" : "text-gray-400"
              }`}
            />
            تواصل معنا
          </button>
          <button
            onClick={() => setActiveTab("faq")}
            className={`px-6 py-3 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === "faq"
                ? "text-purple-900 bg-purple-50 border-2 border-purple-600"
                : "text-gray-400 bg-white border-2 border-transparent hover:text-gray-600"
            }`}
          >
            <HelpCircle
              className={`w-5 h-5 ${
                activeTab === "faq" ? "text-purple-600" : "text-gray-400"
              }`}
            />
            الأسئلة الشائعة
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full mt-6">
        {activeTab === "contact" ? (
          <ZaiaChatWidget />
        ) : (
          <CompanyFAQ noFrame={true} />
        )}
      </div>
    </div>
  );
};

export default TechnicalSupport;
