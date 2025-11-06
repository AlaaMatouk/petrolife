import { useState, useMemo } from "react";
import { Pagination, ExportButton } from "../../../shared";
import { CirclePlus, ChevronDown, ChevronUp, Edit, Trash2, X, HelpCircle, Loader2, AlertCircle } from "lucide-react";
import { createPortal } from "react-dom";
import { Input } from "../../../shared/Form";
import { useForm } from "../../../../hooks/useForm";

// Mock data for FAQ
const generateMockFAQ = () => {
  const questions = [
    {
      id: 1,
      number: 1,
      question: "نص السؤال",
      answer: "اجابة السؤال",
      category: "الأسئلة الشائعة",
      creationDate: "21 فبراير 2025 - 5:05 ص",
    },
    {
      id: 2,
      number: 2,
      question: "نص السؤال",
      answer: "اجابة السؤال",
      category: "الأسئلة الشائعة",
      creationDate: "20 فبراير 2025 - 3:30 م",
    },
    {
      id: 3,
      number: 3,
      question: "نص السؤال",
      answer: "اجابة السؤال",
      category: "الشركات",
      creationDate: "19 فبراير 2025 - 10:15 ص",
    },
    {
      id: 4,
      number: 4,
      question: "نص السؤال",
      answer: "اجابة السؤال",
      category: "الأفراد",
      creationDate: "18 فبراير 2025 - 2:20 م",
    },
    {
      id: 5,
      number: 5,
      question: "نص السؤال",
      answer: "اجابة السؤال",
      category: "مزودو الخدمة",
      creationDate: "17 فبراير 2025 - 9:00 ص",
    },
  ];

  // Generate more mock data
  for (let i = 6; i <= 25; i++) {
    const categories = ["الأسئلة الشائعة", "الشركات", "الأفراد", "مزودو الخدمة", "تطبيق السائق"];
    questions.push({
      id: i,
      number: i,
      question: `نص السؤال`,
      answer: `اجابة السؤال`,
      category: categories[Math.floor(Math.random() * categories.length)],
      creationDate: `${20 - Math.floor(i / 5)} فبراير 2025 - ${Math.floor(Math.random() * 12) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")} ${Math.random() > 0.5 ? "ص" : "م"}`,
    });
  }

  return questions;
};

const mockFAQ = generateMockFAQ();

// Category filter tabs
const categories = [
  { id: "all", name: "الأسئلة الشائعة", count: mockFAQ.length },
  { id: "companies", name: "الشركات", count: mockFAQ.filter(q => q.category === "الشركات").length },
  { id: "individuals", name: "الأفراد", count: mockFAQ.filter(q => q.category === "الأفراد").length },
  { id: "providers", name: "مزودو الخدمة", count: mockFAQ.filter(q => q.category === "مزودو الخدمة").length },
  { id: "driver", name: "تطبيق السائق", count: mockFAQ.filter(q => q.category === "تطبيق السائق").length },
];

// Delete Confirmation Modal
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal = ({ isOpen, onClose, onConfirm }: DeleteModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 p-6"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-pink-50 border-2 border-red-300 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-4">
          حذف السؤال
        </h2>

        {/* Message */}
        <div className="text-sm text-gray-600 text-center mb-6 space-y-2">
          <p>هل أنت متأكد من رغبتك في حذف السؤال من الموقع ؟ .</p>
          <p>برجاء التأكيد من خلال الضغط على زر "حذف السؤال"</p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            رجوع
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            حذف السؤال
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

// Question Modal Component
interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { question: string; answer: string }) => void;
  initialData?: { question: string; answer: string };
  isEdit?: boolean;
}

const QuestionModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
}: QuestionModalProps) => {
  const form = useForm({
    question: initialData?.question || "",
    answer: initialData?.answer || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.values.question.trim() || !form.values.answer.trim()) {
      return;
    }

    form.setIsSubmitting(true);

    try {
      await onSubmit({
        question: form.values.question,
        answer: form.values.answer,
      });

      setTimeout(() => {
        form.setIsSubmitting(false);
        form.resetForm();
        onClose();
      }, 500);
    } catch (error) {
      console.error("Error submitting question:", error);
      form.setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-xl z-50 p-6"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? "تعديل السؤال" : "إضافة سؤال جديد"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="السؤال"
            value={form.values.question}
            onChange={(value) => form.setFieldValue("question", value)}
            placeholder="أدخل السؤال هنا"
            required
            error={form.errors.question}
          />

          <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
            <label className="self-stretch font-normal text-[var(--form-active-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
              <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                الإجابة <span className="text-red-500 mr-1">*</span>
              </span>
            </label>
            <div className="relative w-full">
              <div
                className={`flex items-start justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid transition-colors min-h-[150px] ${
                  form.errors.answer
                    ? "border-red-500 bg-red-50"
                    : "border-color-mode-text-icons-t-placeholder hover:border-color-mode-text-icons-t-sec focus-within:border-color-mode-text-icons-t-blue"
                }`}
              >
                <div className="flex items-start justify-end pt-[3px] pb-0 px-0 relative flex-1 grow h-full">
                  <textarea
                    value={form.values.answer}
                    onChange={(e) =>
                      form.setFieldValue("answer", e.target.value)
                    }
                    placeholder="أدخل الإجابة هنا"
                    className="relative w-full h-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-[length:var(--body-body-2-font-size)] text-right tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none resize-none"
                    rows={6}
                  />
                </div>
              </div>
              {form.errors.answer && (
                <div className="absolute top-full left-0 right-0 mt-1 px-2">
                  <p className="text-red-500 text-xs font-medium [direction:rtl] text-right">
                    {form.errors.answer}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={form.isSubmitting || !form.values.question.trim() || !form.values.answer.trim()}
              className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                form.isSubmitting ||
                !form.values.question.trim() ||
                !form.values.answer.trim()
                  ? "bg-gray-200 cursor-not-allowed text-gray-400"
                  : "bg-color-mode-text-icons-t-blue text-white hover:bg-blue-600"
              }`}
            >
              {form.isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {isEdit ? "حفظ التعديلات" : "إضافة السؤال"}
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
};

// FAQ Item Component
interface FAQItemProps {
  item: any;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const FAQItem = ({ item, isExpanded, onToggle, onEdit, onDelete }: FAQItemProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {/* Question Text (Right) */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-gray-700 font-medium">
            {item.number}. {item.question}
          </span>
        </div>

        {/* Action Buttons (Left) */}
        <div className="flex items-center gap-2">
          {/* Dropdown Arrow */}
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

          {/* Edit Button */}
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="تعديل"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </button>

          {/* Delete Button */}
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-full bg-red-50 border border-red-300 flex items-center justify-center hover:bg-red-100 transition-colors"
            aria-label="حذف"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Answer Section (Expandable) */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          <p className="text-gray-700 text-sm leading-relaxed">
            {item.answer}
          </p>
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<any>(null);
  const [faqData, setFaqData] = useState(mockFAQ);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [activeCategory, setActiveCategory] = useState("all");
  const itemsPerPage = 10;

  // Filter FAQ by category
  const filteredFAQ = useMemo(() => {
    if (activeCategory === "all") {
      return faqData;
    }
    const categoryMap: Record<string, string> = {
      companies: "الشركات",
      individuals: "الأفراد",
      providers: "مزودو الخدمة",
      driver: "تطبيق السائق",
    };
    return faqData.filter((q) => q.category === categoryMap[activeCategory]);
  }, [faqData, activeCategory]);

  const handleAddQuestion = async (data: { question: string; answer: string }) => {
    const newQuestion = {
      id: faqData.length + 1,
      number: faqData.length + 1,
      question: data.question,
      answer: data.answer,
      category: "الأسئلة الشائعة",
      creationDate: new Date().toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setFaqData([newQuestion, ...faqData]);
    console.log("Added question:", newQuestion);
  };

  const handleEditQuestion = async (data: { question: string; answer: string }) => {
    if (!editingQuestion) return;

    const updatedData = faqData.map((item) =>
      item.id === editingQuestion.id
        ? { ...item, question: data.question, answer: data.answer }
        : item
    );

    setFaqData(updatedData);
    setEditingQuestion(null);
    console.log("Updated question:", editingQuestion.id);
  };

  const handleDeleteQuestion = () => {
    if (!deletingQuestion) return;
    setFaqData(faqData.filter((q) => q.id !== deletingQuestion.id));
    setDeletingQuestion(null);
    console.log("Deleted question:", deletingQuestion.id);
  };

  const openEditModal = (item: any) => {
    setEditingQuestion(item);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (item: any) => {
    setDeletingQuestion(item);
    setIsDeleteModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingQuestion(null);
    setIsEditModalOpen(false);
  };

  const toggleExpanded = (id: number) => {
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

  const handleExport = (format: string) => {
    console.log(`Exporting FAQ as ${format}`);
  };

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

        {/* Add Button (Left) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-700 font-medium">إضافة سؤال جديد</span>
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
              <CirclePlus className="w-4 h-4 text-white" />
            </div>
          </button>
          <ExportButton onExport={handleExport} buttonText="تصدير" />
        </div>
      </div>

      {/* FAQ Items List */}
      <div className="w-full flex flex-col gap-4">
        {paginatedData.map((item) => (
          <FAQItem
            key={item.id}
            item={item}
            isExpanded={expandedItems.has(item.id)}
            onToggle={() => toggleExpanded(item.id)}
            onEdit={() => openEditModal(item)}
            onDelete={() => openDeleteModal(item)}
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredFAQ.length / itemsPerPage) || 1}
        onPageChange={setCurrentPage}
      />

      {/* Add Question Modal */}
      <QuestionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddQuestion}
        isEdit={false}
      />

      {/* Edit Question Modal */}
      <QuestionModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleEditQuestion}
        initialData={
          editingQuestion
            ? {
                question: editingQuestion.question,
                answer: editingQuestion.answer,
              }
            : undefined
        }
        isEdit={true}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingQuestion(null);
        }}
        onConfirm={handleDeleteQuestion}
      />
    </div>
  );
};

export default FAQ;
