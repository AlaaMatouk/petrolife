import { useState, useMemo, useEffect } from "react";
import { Pagination } from "../../components/shared";
import { ChevronDown, ChevronUp, HelpCircle, Loader2 } from "lucide-react";
import { fetchFAQQuestions, FAQQuestion, fetchUserDisplayNameByEmail } from "../../services/firestore";

// User type options for display (mapping userType to Arabic labels)
const userTypeOptions = [
  { value: "all", label: "الأسئلة الشائعة" },
  { value: "company", label: "الشركات" },
  { value: "user", label: "الأفراد" },
  { value: "distributer", label: "مزودو الخدمة" },
  { value: "driver", label: "تطبيق السائق" },
  { value: "admin", label: "مدير" },
  { value: "superAdmin", label: "مدير عام" },
];

// FAQ Item Component (Read-only)
interface FAQItemProps {
  item: FAQQuestion;
  isExpanded: boolean;
  onToggle: () => void;
}

const FAQItem = ({ item, isExpanded, onToggle }: FAQItemProps) => {
  const [creatorName, setCreatorName] = useState<string | null>(null);

  // Fetch creator name on mount
  useEffect(() => {
    const loadCreatorName = async () => {
      if (item.createdBy) {
        const name = await fetchUserDisplayNameByEmail(item.createdBy);
        setCreatorName(name);
      }
    };
    loadCreatorName();
  }, [item.createdBy]);

  // Format creation date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {/* Question Text (Right) - Clickable */}
        <div 
          className="flex items-center gap-2 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onToggle}
        >
          <span className="text-gray-700 font-medium">
            {item.question}
          </span>
        </div>

        {/* Dropdown Arrow (Left) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label={isExpanded ? "إخفاء" : "إظهار"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Answer Section (Expandable) */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          <p className="text-gray-700 text-sm leading-relaxed mb-2">
            {item.answer}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
            <span>نوع المستخدم: {userTypeOptions.find(opt => opt.value === item.userType)?.label || item.userType}</span>
            {item.createdAt && <span>تاريخ الإنشاء: {formatDate(item.createdAt)}</span>}
            {item.createdBy && (
              <span>أنشأ بواسطة: {creatorName || item.createdBy}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [faqData, setFaqData] = useState<FAQQuestion[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  // Fetch FAQ questions on component mount - filter for company and all types
  useEffect(() => {
    const loadFAQQuestions = async () => {
      try {
        setIsLoading(true);
        const questions = await fetchFAQQuestions();
        
        // Filter to show only "company" and "all" userType questions
        const filteredQuestions = questions.filter(
          (q) => q.userType === "company" || q.userType === "all"
        );
        
        setFaqData(filteredQuestions);
      } catch (error) {
        console.error("Error loading FAQ questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFAQQuestions();
  }, []);

  // Calculate category counts dynamically (only for company and all)
  const categories = useMemo(() => {
    return [
      { id: "all", name: "الأسئلة الشائعة", count: faqData.filter(q => q.userType === "all").length },
      { id: "companies", name: "الشركات", count: faqData.filter(q => q.userType === "company").length },
    ];
  }, [faqData]);

  // Filter FAQ by userType
  const filteredFAQ = useMemo(() => {
    if (activeCategory === "all") {
      return faqData.filter((q) => q.userType === "all");
    }
    return faqData.filter((q) => q.userType === "company");
  }, [faqData, activeCategory]);

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const paginatedData = useMemo(
    () =>
      filteredFAQ.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [currentPage, filteredFAQ]
  );

  return (
    <div
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        {/* Category Tabs (Right) */}
        <div className="flex items-center gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors border flex items-center gap-2 ${
                activeCategory === category.id
                  ? "text-gray-700 bg-purple-50 border-purple-600"
                  : "text-gray-400 bg-white border-gray-300 hover:border-gray-400"
              }`}
            >
              {category.name} ({category.count})
              {activeCategory === category.id && category.id === "all" && (
                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center mr-1">
                  <HelpCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Items List */}
      <div className="w-full flex flex-col gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="mr-3 text-gray-600">جاري التحميل...</span>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-gray-500">لا توجد أسئلة متاحة</span>
          </div>
        ) : (
          paginatedData.map((item) => (
            <FAQItem
              key={item.id}
              item={item}
              isExpanded={expandedItems.has(item.id || "")}
              onToggle={() => toggleExpanded(item.id || "")}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredFAQ.length / itemsPerPage) || 1}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default FAQ;

