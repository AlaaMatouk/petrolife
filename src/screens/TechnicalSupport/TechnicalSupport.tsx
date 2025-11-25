import { useState } from "react";
import { Paperclip, Image as ImageIcon, Send, MessageCircle, HelpCircle } from "lucide-react";
import CompanyFAQ from "../FAQ/FAQ";

// Mock messages for chat
const mockMessages = [
  {
    id: 1,
    type: "agent",
    text: "أهلا بك، نحن هنا لمساعدتك ، تفضل",
    time: "10:25 ص",
    sender: null,
  },
  {
    id: 2,
    type: "customer",
    text: "نعم أنا احتاج للمساعدة، هل يمكنك مساعدتي نعم أنا احتاج للمساعدة، هل يمكنك مساعدتي نعم أنا احتاج للمساعدة. هل يمكنك مساعدتي نعم أنا احتاج للمساعدة",
    time: "10:25 ص",
    sender: "الشركة المتحدة العالمية",
  },
];

const ContactUsTab = () => {
  const [messageText, setMessageText] = useState("");

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    // TODO: Send message to support
    console.log("Sending message:", messageText);
    setMessageText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-400px)] bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {mockMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "agent" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex flex-col max-w-[70%] ${message.type === "agent" ? "items-end" : "items-start"}`}>
              <div className="relative flex items-start gap-2">
                {/* Logo for agent messages - on the left */}
                {message.type === "agent" && (
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                      <img src="/img/logo-3.png" alt="Petrolife" className="w-5 h-5" />
                    </div>
                  </div>
                )}
                <div className="relative">
                  <div
                    className={`rounded-lg px-4 py-3 ${
                      message.type === "agent"
                        ? "bg-purple-100 text-gray-900"
                        : "bg-color-mode-surface-primary-blue text-white"
                    }`}
                  >
                    <p className={`text-sm leading-relaxed ${message.type === "customer" ? "text-white" : ""}`}>
                      {message.text}
                    </p>
                  </div>
                  {/* Tail for agent messages */}
                  {message.type === "agent" && (
                    <div 
                      className="absolute bottom-0 right-0"
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid rgb(243 232 255)',
                        borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent',
                        transform: 'translateX(100%) translateY(50%) rotate(45deg)',
                      }}
                    ></div>
                  )}
                  {/* Tail for customer messages */}
                  {message.type === "customer" && (
                    <div 
                      className="absolute bottom-0 left-0"
                      style={{
                        width: 0,
                        height: 0,
                        borderRight: '8px solid rgba(90, 102, 193, 1)',
                        borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent',
                        transform: 'translateX(-100%) translateY(50%) rotate(-45deg)',
                      }}
                    ></div>
                  )}
                </div>
              </div>
              <div className={`flex items-center gap-2 mt-1 ${message.type === "agent" ? "flex-row-reverse" : ""}`}>
                <span className="text-xs text-gray-500">{message.time}</span>
                {message.sender && (
                  <span className="text-xs text-gray-500">{message.sender}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          {/* Send Button - on the left */}
          <button
            onClick={handleSendMessage}
            className="w-10 h-10 rounded-full bg-color-mode-surface-primary-blue hover:opacity-90 flex items-center justify-center transition-colors"
          >
            <Send className="w-5 h-5 text-white stroke-[2]" />
          </button>

          {/* Attachment Icons - on the right */}
          <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <Paperclip className="w-5 h-5 text-gray-600 stroke-[1.5]" />
          </button>
          <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <ImageIcon className="w-5 h-5 text-gray-600 stroke-[1.5]" />
          </button>

          {/* Input Field */}
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            placeholder="اكتب رسالتك هنا"
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-color-mode-surface-primary-blue focus:border-transparent text-sm placeholder-gray-400"
            dir="rtl"
          />
        </div>
      </div>
    </div>
  );
};

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
            <MessageCircle className={`w-5 h-5 ${activeTab === "contact" ? "text-purple-600" : "text-gray-400"}`} />
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
            <HelpCircle className={`w-5 h-5 ${activeTab === "faq" ? "text-purple-600" : "text-gray-400"}`} />
            الأسئلة الشائعة
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full mt-6">
        {activeTab === "contact" ? <ContactUsTab /> : <CompanyFAQ noFrame={true} />}
      </div>
    </div>
  );
};

export default TechnicalSupport;

