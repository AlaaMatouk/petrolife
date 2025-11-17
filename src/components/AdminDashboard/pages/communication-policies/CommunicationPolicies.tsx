import React, { useState, useEffect } from "react";
import { useForm } from "../../../../hooks/useForm";
import { Input } from "../../../../components/shared/Form";
import { Globe, Loader2 } from "lucide-react";
import { fetchCommunicationPolicies, saveCommunicationPolicies } from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";

const initialValues = {
  platformPolicy: `نحن نجمع المعلومات لتقديم خدمات ذات مستوى أفضل المستخدمينا جميعًا. نحن نستخدم المعلومات التي نجمعها من جميع خدماتنا (مثل تطبيقاتك ومتصفحاتك وأجهزتك) لتقديم خدماتنا وصيانتها وتحسينها وتطوير خدمات جديدة وقياس الأداء والتواصل معك.

المعلومات التي تجمعها Google
نستخدم المعلومات التي نجمعها من جميع خدماتنا لتقديم خدماتنا وصيانتها وتحسينها وتطوير خدمات جديدة وقياس الأداء والتواصل معك.

عناصر تنشئها أو تقدمها لنا
عندما تنشئ حساب Google أو تضيف معلومات إلى حسابك، فإنك تزودنا بمعلومات شخصية تتضمن اسمك وكلمة المرور.

المعلومات التي تجمعها أثناء استخدامك لخدماتنا
نحن نجمع المعلومات حول الطريقة التي تستخدم بها خدماتنا، مثل نوع المحتوى الذي تبحث عنه أو تعرضه أو تشتريه، والمواقع التي تزورها، والتفاعلات مع المحتوى والخدمات.

تطبيقاتك ومتصفحاتك وأجهزتك
نحن نجمع معلومات محددة حول تطبيقاتك ومتصفحاتك وأجهزتك التي تستخدمها للوصول إلى خدمات Google، والتي تساعدنا في توفير ميزات مثل تحديثات المنتج تلقائيًا وتقليل معدل الأعطال.`,
  whatsappLink: "",
  instagramLink: "",
  tiktokLink: "",
  facebookLink: "",
  xPlatformLink: "",
  emailLink: "",
};

const CommunicationPolicies = () => {
  const [activeTab, setActiveTab] = useState<"policy" | "communication">("policy");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const form = useForm(initialValues);
  const { addToast } = useToast();

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCommunicationPolicies();
        // Update form values with fetched data
        Object.keys(data).forEach((key) => {
          form.setFieldValue(key, data[key as keyof typeof data]);
        });
      } catch (error) {
        console.error("Error loading communication policies:", error);
        addToast({
          title: "خطأ",
          message: "فشل في تحميل البيانات",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If not in edit mode, toggle to edit mode
    if (!isEditMode) {
      setIsEditMode(true);
      return;
    }

    // If in edit mode, save the data
    form.setIsSubmitting(true);

    try {
      await saveCommunicationPolicies(form.values);
      
      addToast({
        title: "نجح",
        message: "تم حفظ البيانات بنجاح",
        type: "success",
      });

      // Exit edit mode after successful save
      setIsEditMode(false);
    } catch (error: any) {
      console.error("Error saving communication policies:", error);
      addToast({
        title: "خطأ",
        message: "فشل في حفظ البيانات",
        type: "error",
      });
    } finally {
      form.setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5" dir="rtl">
          <Globe className="w-5 h-5 text-gray-500" />
          <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
            وسائل التواصل & السياسة
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 w-full justify-end">
        <button
          onClick={() => setActiveTab("communication")}
          className={`px-6 py-3 font-medium text-sm transition-colors rounded-lg border ${
            activeTab === "communication"
              ? "text-purple-900 bg-purple-50 border-purple-600"
              : "text-gray-400 bg-white border-gray-300 hover:border-gray-400"
          }`}
        >
          وسائل التواصل
        </button>
        <button
          onClick={() => setActiveTab("policy")}
          className={`px-6 py-3 font-medium text-sm transition-colors rounded-lg border ${
            activeTab === "policy"
              ? "text-purple-900 bg-purple-50 border-purple-600"
              : "text-gray-400 bg-white border-gray-300 hover:border-gray-400"
          }`}
        >
          سياسة المنصة
        </button>
      </div>

      {/* Tab Content */}
      <form
        className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]"
        onSubmit={handleSubmit}
      >
        {activeTab === "policy" && (
          <div className="w-full flex flex-col gap-4">
            <label className="text-sm font-medium text-[var(--form-active-label-color)] [direction:rtl] text-right">
              محتوى سياسة المنصة
            </label>
            <div className="relative w-full">
              <div className={`flex items-start justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] min-h-[400px] ${
                isEditMode ? "border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder" : ""
              }`}>
                <div className="flex items-start justify-end pt-[3px] pb-0 px-0 relative flex-1 grow h-full">
                  <textarea
                    value={form.values.platformPolicy}
                    onChange={(e) => form.setFieldValue("platformPolicy", e.target.value)}
                    placeholder="أدخل محتوى سياسة المنصة هنا"
                    className="relative w-full h-full mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] placeholder-[var(--form-active-placeholder-color)] text-[length:var(--body-body-2-font-size)] text-right tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)] bg-transparent border-none outline-none resize-none"
                    rows={15}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "communication" && (
          <div className="w-full flex flex-col gap-5">
            <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              {/* Right Column */}
              <div className="flex flex-col gap-5 flex-1">
                {isEditMode ? (
                  <Input
                    label="رابط واتساب"
                    value={form.values.whatsappLink}
                    onChange={(value) => form.setFieldValue("whatsappLink", value)}
                    placeholder="أدخل رابط واتساب"
                    type="text"
                  />
                ) : (
                  <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                    <label className="self-stretch font-normal text-[var(--form-readonly-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                      <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                        رابط واتساب
                      </span>
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal w-full">
                      {form.values.whatsappLink || "www.whatsapp.com"}
                    </div>
                  </div>
                )}
                {isEditMode ? (
                  <Input
                    label="رابط انستجرام"
                    value={form.values.instagramLink}
                    onChange={(value) => form.setFieldValue("instagramLink", value)}
                    placeholder="أدخل رابط انستجرام"
                    type="text"
                  />
                ) : (
                  <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                    <label className="self-stretch font-normal text-[var(--form-readonly-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                      <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                        رابط انستجرام
                      </span>
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal w-full">
                      {form.values.instagramLink || "www.instagram.com"}
                    </div>
                  </div>
                )}
                {isEditMode ? (
                  <Input
                    label="رابط تيك توك"
                    value={form.values.tiktokLink}
                    onChange={(value) => form.setFieldValue("tiktokLink", value)}
                    placeholder="أدخل رابط تيك توك"
                    type="text"
                  />
                ) : (
                  <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                    <label className="self-stretch font-normal text-[var(--form-readonly-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                      <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                        رابط تيك توك
                      </span>
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal w-full">
                      {form.values.tiktokLink || "www.ticktock.com"}
                    </div>
                  </div>
                )}
              </div>

              {/* Left Column */}
              <div className="flex flex-col gap-5 flex-1">
                {isEditMode ? (
                  <Input
                    label="رابط فيسبوك"
                    value={form.values.facebookLink}
                    onChange={(value) => form.setFieldValue("facebookLink", value)}
                    placeholder="أدخل رابط فيسبوك"
                    type="text"
                  />
                ) : (
                  <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                    <label className="self-stretch font-normal text-[var(--form-readonly-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                      <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                        رابط فيسبوك
                      </span>
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal w-full">
                      {form.values.facebookLink || "www.facebook.com"}
                    </div>
                  </div>
                )}
                {isEditMode ? (
                  <Input
                    label="رابط منصة X"
                    value={form.values.xPlatformLink}
                    onChange={(value) => form.setFieldValue("xPlatformLink", value)}
                    placeholder="أدخل رابط منصة X"
                    type="text"
                  />
                ) : (
                  <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                    <label className="self-stretch font-normal text-[var(--form-readonly-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                      <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                        رابط منصة X
                      </span>
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal w-full">
                      {form.values.xPlatformLink || "www.x.com"}
                    </div>
                  </div>
                )}
                {isEditMode ? (
                  <Input
                    label="رابط البريد"
                    value={form.values.emailLink}
                    onChange={(value) => form.setFieldValue("emailLink", value)}
                    placeholder="أدخل رابط البريد الإلكتروني"
                    type="text"
                  />
                ) : (
                  <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
                    <label className="self-stretch font-normal text-[var(--form-readonly-label-color)] [direction:rtl] relative mt-[-1.00px] [font-family:'Tajawal',Helvetica] text-sm leading-[22.4px]">
                      <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
                        رابط البريد
                      </span>
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal w-full">
                      {form.values.emailLink || "www.email.com"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit/Save Button */}
        <div className="w-full flex items-center justify-end mt-4">
          {isLoading ? (
            <div className="inline-flex items-center gap-2 px-8 py-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري التحميل...</span>
            </div>
          ) : (
            <button
              type="submit"
              disabled={form.isSubmitting}
              className={`inline-flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-colors border ${
                form.isSubmitting
                  ? "bg-gray-200 cursor-not-allowed border-gray-300 text-gray-400"
                  : "bg-yellow-50 border-orange-500 text-orange-500 hover:bg-yellow-100"
              }`}
            >
              {form.isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {isEditMode ? "حفظ البيانات" : "تعديل البيانات"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CommunicationPolicies;

