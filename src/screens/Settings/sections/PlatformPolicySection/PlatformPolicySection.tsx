import React from "react";

export const PlatformPolicySection = (): JSX.Element => {
  return (
    <div className="flex flex-col gap-6 bg-white rounded-lg border border-[color:var(--border-subtle)] p-6" dir="rtl">
      <div className="flex flex-col gap-4">
        <div className="relative flex items-center gap-2">
          <h2 className="text-xl font-normal text-blue-600 relative z-10 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>سياسة الخصوصية</span>
          </h2>
        </div>
        
        <div className="flex flex-col gap-3 text-[var(--text-primary)] leading-relaxed">
          <div className="space-y-4">
            <p className="text-base">
              نريدك أن تميّز بين أنواع المعلومات التي نجمعها أثناء استخدامك لخدماتنا.
            </p>
            
            <p className="text-base">
              نحن نجمع المعلومات لتقديم خدمات ذات مستوى أفضل لمستخدمينا جميعًا - بدءًا من تحديد الأمور الأساسية، مثل اللغة التي تتحدثها إلى أمور أكثر تعقيدًا ومنها على سبيل المثال الإعلانات التي ستجدها أكثر فائدة، أو الأشخاص الذين يهمك أمرهم بشدة على الإنترنت، أو الفيديوهات التي قد تعجبك على YouTube. وإن المعلومات التي تجمعها Google وكيفية استخدامها تعتمد على كيفية استخدامك لخدماتنا وكيفية إدارتك لعناصر التحكم في الخصوصية.
            </p>
            
            <p className="text-base">
              عند عدم تسجيل الدخول إلى حساب على Google، نخزّن المعلومات التي نجمعها باستخدام معرِّفات فريدة مرتبطة بالمتصفّح أو التطبيق أو الجهاز المستخدَم. وهذا يساعدنا في تنفيذ إجراءات مثل حفظ إعداداتك المفضّلة في مختلف جلسات التصفح. ومن الأمثلة على تلك الإعدادات لغتك المفضّلة أو ما إذا كان المطلوب عرض إعلانات أو نتائج بحث أكثر صلة استنادًا إلى نشاطك.
            </p>
            
            <p className="text-base">
              عندما تسجل الدخول، نجمع أيضًا معلومات ونخزّنها لدى حسابك على Google، حيث نتعامل مع هذه المعلومات على أنها معلومات شخصية.
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-[color:var(--border-subtle)]">
          <p className="text-sm text-[var(--text-secondary)] text-center">
            جميع الحقوق محفوظة لموقع بترولايف @2025
          </p>
        </div>
      </div>
    </div>
  );
};
