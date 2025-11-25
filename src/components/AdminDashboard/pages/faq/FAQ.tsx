import { useState, useMemo, useEffect } from "react";
import { Pagination, ExportButton } from "../../../shared";
import { CirclePlus, ChevronDown, ChevronUp, Edit, Trash2, X, HelpCircle, Loader2, AlertCircle } from "lucide-react";
import { createPortal } from "react-dom";
import { Input } from "../../../shared/Form";
import { useForm } from "../../../../hooks/useForm";
import { fetchFAQQuestions, addFAQQuestion, updateFAQQuestion, deleteFAQQuestion, seedFAQQuestions, FAQQuestion, fetchUserDisplayNameByEmail } from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";

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

  // Update form values when initialData changes (for edit mode)
  useEffect(() => {
    if (isOpen && initialData) {
      form.setFieldValue("question", initialData.question || "");
      form.setFieldValue("answer", initialData.answer || "");
    } else if (isOpen && !isEdit) {
      // Reset form for add mode
      form.setFieldValue("question", "");
      form.setFieldValue("answer", "");
    }
  }, [isOpen, initialData, isEdit]);

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<FAQQuestion | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<FAQQuestion | null>(null);
  const [faqData, setFaqData] = useState<FAQQuestion[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const itemsPerPage = 10;

  // Fetch FAQ questions on component mount and seed if empty
  useEffect(() => {
    const loadFAQQuestions = async () => {
      try {
        setIsLoading(true);
        let questions = await fetchFAQQuestions();
        
        // If no questions exist, seed dummy data
        if (questions.length === 0) {
          try {
            await seedFAQQuestions();
            // Fetch again after seeding
            questions = await fetchFAQQuestions();
            addToast({
              title: "تم",
              message: "تم إضافة أسئلة تجريبية بنجاح",
              type: "success",
            });
          } catch (seedError) {
            console.error("Error seeding FAQ questions:", seedError);
            // Continue even if seeding fails
          }
        }
        
        setFaqData(questions);
      } catch (error) {
        console.error("Error loading FAQ questions:", error);
        addToast({
          title: "خطأ",
          message: "فشل تحميل الأسئلة الشائعة. يرجى المحاولة مرة أخرى.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFAQQuestions();
  }, [addToast]);

  // Calculate category counts dynamically
  const categories = useMemo(() => {
    return [
      { id: "all", name: "الأسئلة الشائعة", count: faqData.length },
      { id: "companies", name: "الشركات", count: faqData.filter(q => q.userType === "company").length },
      { id: "individuals", name: "الأفراد", count: faqData.filter(q => q.userType === "user").length },
      { id: "providers", name: "مزودو الخدمة", count: faqData.filter(q => q.userType === "distributer").length },
      { id: "driver", name: "تطبيق السائق", count: faqData.filter(q => q.userType === "driver").length },
    ];
  }, [faqData]);

  // Filter FAQ by userType
  const filteredFAQ = useMemo(() => {
    if (activeCategory === "all") {
      return faqData;
    }
    const categoryMap: Record<string, string> = {
      companies: "company",
      individuals: "user",
      providers: "distributer",
      driver: "driver",
    };
    return faqData.filter((q) => q.userType === categoryMap[activeCategory]);
  }, [faqData, activeCategory]);

  const handleAddQuestion = async (data: { question: string; answer: string }) => {
    try {
      // userType and createdBy will be automatically set from logged-in user's data
      const newQuestion = await addFAQQuestion({
        question: data.question,
        answer: data.answer,
      });

      setFaqData([newQuestion, ...faqData]);
      addToast({
        title: "نجح",
        message: "تم إضافة السؤال بنجاح",
        type: "success",
      });
    } catch (error) {
      console.error("Error adding question:", error);
      addToast({
        title: "خطأ",
        message: "فشل إضافة السؤال. يرجى المحاولة مرة أخرى.",
        type: "error",
      });
      throw error;
    }
  };

  const handleEditQuestion = async (data: { question: string; answer: string }) => {
    if (!editingQuestion || !editingQuestion.id) return;

    try {
      await updateFAQQuestion(editingQuestion.id, {
        question: data.question,
        answer: data.answer,
      });

      const updatedData = faqData.map((item) =>
        item.id === editingQuestion.id
          ? { ...item, question: data.question, answer: data.answer }
          : item
      );

      setFaqData(updatedData);
      setEditingQuestion(null);
      addToast({
        title: "نجح",
        message: "تم تحديث السؤال بنجاح",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating question:", error);
      addToast({
        title: "خطأ",
        message: "فشل تحديث السؤال. يرجى المحاولة مرة أخرى.",
        type: "error",
      });
      throw error;
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deletingQuestion || !deletingQuestion.id) return;

    try {
      await deleteFAQQuestion(deletingQuestion.id);
      setFaqData(faqData.filter((q) => q.id !== deletingQuestion.id));
      setDeletingQuestion(null);
      addToast({
        title: "نجح",
        message: "تم حذف السؤال بنجاح",
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting question:", error);
      addToast({
        title: "خطأ",
        message: "فشل حذف السؤال. يرجى المحاولة مرة أخرى.",
        type: "error",
      });
    }
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
              onEdit={() => openEditModal(item)}
              onDelete={() => openDeleteModal(item)}
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
