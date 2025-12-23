import { useState } from "react";
import { MessageCircle, HelpCircle, Phone } from "lucide-react";
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
          <div className="space-y-8">
            {/* Title and Subtitle */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                كيف تود التواصل معنا؟
              </h2>
              <p className="text-gray-600">
                فريق الدعم الفني متاح على مدار الساعة. اختر الطريقة الأنسب لك
              </p>
            </div>

            {/* Contact Options Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Live Chat Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#1e40af] flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900">محادثة مباشرة</h3>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600">
                    تحدث مع أحد ممثلي الدعم الآن
                  </p>
                  
                  {/* Button */}
                  <button
                    onClick={() => {
                      // Scroll to chat widget or trigger it
                      const chatWidget = document.querySelector('[data-chat-widget]');
                      if (chatWidget) {
                        chatWidget.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="w-full px-6 py-3 bg-[#1e40af] text-white rounded-lg hover:bg-[#1e3a8a] transition-colors font-medium"
                  >
                    ابدأ المحادثة
                  </button>
                </div>
              </div>

              {/* WhatsApp Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <svg
                      className="w-10 h-10"
                      viewBox="0 0 24 24"
                      fill="white"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                        fill="#25D366"
                      />
                    </svg>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900">واتساب</h3>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600">
                    راسلنا عبر الواتساب بكل سهولة
                  </p>
                  
                  {/* Button */}
                  <a
                    href="https://wa.me/920000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-6 py-3 border-2 border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium text-center"
                  >
                    ابدأ المحادثة
                  </a>
                </div>
              </div>

              {/* Unified Number Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Phone className="w-8 h-8 text-[#1e40af]" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900">الرقم الموحد</h3>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600">
                    اتصل بنا مباشرة لأي استفسار عاجل
                  </p>
                  
                  {/* Button/Phone Number */}
                  <a
                    href="tel:920000000"
                    className="w-full px-6 py-3 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-center"
                  >
                    920000000
                  </a>
                </div>
              </div>
            </div>

            {/* Chat Widget */}
            <div data-chat-widget>
              <ZaiaChatWidget />
            </div>
          </div>
        ) : (
          <CompanyFAQ noFrame={true} />
        )}
      </div>
    </div>
  );
};

export default TechnicalSupport;
