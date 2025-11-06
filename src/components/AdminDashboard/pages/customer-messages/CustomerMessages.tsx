import { useState, useMemo } from "react";
import { MessageCircle, Building2, User, Car, Paperclip, Image as ImageIcon, Send, MoreVertical } from "lucide-react";

// Mock data for chat conversations
const generateMockConversations = () => {
  const conversations = [];
  const companyNames = ["شركة النصر الدولية"];
  const icons = [Building2, User, Car, Building2, User, Car, Building2, User];
  const lastMessages = [
    "أهلا بك، نحن هنا لمساعدتك ، تفضل!",
    "نعم أنا احتاج للمساعدة، هل يمكنك مساعدتي",
    "شكرا لك على المساعدة",
    "هل يمكنك توضيح المزيد؟",
  ];
  
  for (let i = 1; i <= 145; i++) {
    const IconComponent = icons[i % icons.length];
    const unreadCount = i <= 14 ? Math.floor(Math.random() * 3) + 1 : 0;
    const isRead = i > 14;
    const lastMessage = i === 1 
      ? "أهلا بك، نحن هنا لمساعدتك ، تفضل!"
      : lastMessages[Math.floor(Math.random() * lastMessages.length)];
    
    conversations.push({
      id: i,
      name: companyNames[0],
      icon: IconComponent,
      unreadCount: unreadCount > 0 ? unreadCount : 0,
      isRead,
      isActive: i === 1,
      lastMessage,
      lastMessageTime: "10:25 ص",
    });
  }
  
  return conversations;
};

const mockConversations = generateMockConversations();

// Mock messages for active conversation
const mockMessages = [
  {
    id: 1,
    type: "agent",
    text: "أهلا بك، نحن هنا لمساعدتك ، تفضل!",
    time: "10:25 ص",
    sender: null,
  },
  {
    id: 2,
    type: "customer",
    text: "نعم أنا احتاج للمساعدة، هل يمكنك مساعدتي نعم أنا احتاج للمساعدة، هل يمكنك مساعدتي نعم أنا احتاج للمساعدة، هل يمكنك مساعدتي نعم أنا احتاج للمساعدة، هل يمكنك مساعدتي",
    time: "10:25 ص",
    sender: "محمد أحمد",
  },
  {
    id: 3,
    type: "agent",
    text: "بالطبع، أنا هنا لمساعدتك. ما هي المشكلة التي تواجهها؟",
    time: "10:26 ص",
    sender: null,
  },
  {
    id: 4,
    type: "customer",
    text: "أحتاج إلى مساعدة في إضافة حساب جديد",
    time: "10:27 ص",
    sender: "محمد أحمد",
  },
];

const CustomerMessages = () => {
  const [activeFilter, setActiveFilter] = useState<"all" | "read" | "unread">("all");
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [messageText, setMessageText] = useState("");

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (activeFilter === "all") {
      return mockConversations;
    } else if (activeFilter === "read") {
      return mockConversations.filter((c) => c.isRead);
    } else {
      return mockConversations.filter((c) => !c.isRead && c.unreadCount > 0);
    }
  }, [activeFilter]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    // TODO: Send message
    console.log("Sending message:", messageText);
    setMessageText("");
  };

  const filterTabs = [
    { id: "all", name: "الكل", count: 145 },
    { id: "unread", name: "الغير مقروء", count: 14 },
    { id: "read", name: "المقروء", count: 131 },
  ];

  return (
    <div
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
      dir="rtl"
    >
      <div className="flex flex-row gap-4 w-full h-[calc(100vh-300px)]">
        {/* Left Column - Chat List */}
        <div className="flex flex-col w-1/3 bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-end gap-2 p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">رسائل العملاء</h2>
          <MessageCircle className="w-5 h-5 text-purple-600" />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-200">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors border ${
                activeFilter === tab.id
                  ? "text-purple-900 bg-purple-50 border-purple-600"
                  : "text-gray-400 bg-white border-gray-300 hover:border-gray-400"
              }`}
            >
              {tab.name} ({tab.count})
            </button>
          ))}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => {
            const IconComponent = conversation.icon;
            return (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-gray-100 relative ${
                  selectedConversation.id === conversation.id
                    ? "bg-purple-50 border-r-4 border-purple-600"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-gray-600" />
                  </div>
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {conversation.unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-white">
                          {conversation.unreadCount}
                        </span>
                      </div>
                    )}
                    <p className={`text-sm truncate ${
                      conversation.unreadCount > 0 
                        ? "font-semibold text-gray-900" 
                        : "font-medium text-gray-700"
                    }`}>
                      {conversation.name}
                    </p>
                  </div>
                  <p className={`text-xs truncate ${
                    conversation.unreadCount > 0 
                      ? "font-medium text-gray-700" 
                      : "font-normal text-gray-500"
                  }`}>
                    {conversation.lastMessage}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{conversation.lastMessageTime}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column - Active Chat */}
      <div className="flex flex-col flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Conversation Header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-semibold text-gray-900">{selectedConversation.name}</h3>
              <span className="text-xs text-gray-500">{selectedConversation.lastMessageTime}</span>
            </div>
          </div>
          <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {mockMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "agent" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex flex-col max-w-[70%] ${message.type === "agent" ? "items-end" : "items-start"}`}>
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
                  {/* Tail for agent messages (pointing down-right from bottom-right corner) */}
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
                  {/* Tail for customer messages (pointing down-left from bottom-left corner) */}
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
            {/* Attachment Icons */}
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
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-color-mode-surface-primary-blue focus:border-transparent text-sm placeholder-gray-400"
              dir="rtl"
            />

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              className="w-10 h-10 rounded-full bg-color-mode-surface-primary-blue hover:opacity-90 flex items-center justify-center transition-colors"
            >
              <Send className="w-5 h-5 text-white stroke-[2]" />
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default CustomerMessages;

