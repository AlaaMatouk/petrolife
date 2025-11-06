import React, { useState } from "react";
import { useForm } from "../../../../hooks/useForm";
import { Input } from "../../../../components/shared/Form";
import { Globe, Loader2 } from "lucide-react";

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
  const form = useForm(initialValues);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Form values:", form.values);

    form.setIsSubmitting(true);

    try {
      // TODO: Save communication policies data
      // await saveCommunicationPolicies(form.values);

      console.log("Submitting communication policies data:", form.values);

      setTimeout(() => {
        form.setIsSubmitting(false);
        // TODO: Show success toast
      }, 1000);
    } catch (error: any) {
      console.error("Error saving communication policies:", error);
      form.setIsSubmitting(false);
      // TODO: Show error toast
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
              <div className="flex items-start justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] min-h-[400px]">
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
              </div>

              {/* Left Column */}
              <div className="flex flex-col gap-5 flex-1">
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
              </div>
            </div>
          </div>
        )}

        {/* Edit Button */}
        <div className="w-full flex items-center justify-end mt-4">
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
            تعديل البيانات
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommunicationPolicies;

