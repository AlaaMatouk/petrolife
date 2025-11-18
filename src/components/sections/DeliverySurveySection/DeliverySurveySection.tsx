import { DeliverySurveyCard } from "./DeliverySurveyCard";

export const DeliverySurveySection = (): JSX.Element => {
  return (
    <section className="mb-8 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DeliverySurveyCard title="تقرير طلبات التوصيل" />
        <DeliverySurveyCard title="تقرير الطلبـــــــــــــــــــات" />
      </div>
    </section>
  );
};
