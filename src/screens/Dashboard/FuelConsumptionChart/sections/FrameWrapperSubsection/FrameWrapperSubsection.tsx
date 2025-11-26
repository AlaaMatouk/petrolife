import React, { useState } from "react";

export const FrameWrapperSubsection = (): JSX.Element => {
  const [selectedPeriod, setSelectedPeriod] = useState("12 شهر");

  const timeperiods = [
    { id: "week", label: "اسبوع", value: "اسبوع" },
    { id: "month", label: "30 يوم", value: "30 يوم" },
    { id: "sixMonths", label: "6 شهور", value: "6 شهور" },
    { id: "year", label: "12 شهر", value: "12 شهر" },
  ];

  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
  };

  return (
    <section
      className="inline-flex items-center gap-[29px] absolute top-[18px] left-[445px]"
      role="region"
      aria-label="Sales time period selector"
    >
      <div
        className="inline-flex items-center gap-[11px] relative flex-[0_0_auto]"
        role="group"
        aria-label="Time period options"
      >
        <button
          className="w-[35px] bg-[#f5f6f766] border-[0.2px] border-solid border-white flex flex-col h-[30px] items-center justify-center gap-2.5 p-4 relative rounded-[5px] hover:bg-[#f5f6f799] focus:outline-none focus:ring-2 focus:ring-[#5a66c1] focus:ring-opacity-50 transition-colors duration-200"
          aria-label="Calendar view"
          type="button"
        >
          <div className="w-[29.17px] gap-[12.5px] mt-[-11.00px] mb-[-11.00px] ml-[-13.08px] mr-[-13.08px] flex items-center justify-center relative flex-[0_0_auto]">
            <div className="relative w-5 h-5 aspect-[1]" aria-hidden="true">
              <img
                className="absolute w-[33.33%] h-[16.67%] top-[5.83%] left-[30.83%]"
                alt=""
                src="/img/vector.svg"
              />
              <img
                className="absolute w-[75.00%] h-[75.00%] top-[14.17%] left-[10.00%]"
                alt=""
                src="/img/vector-1.svg"
              />
              <img
                className="absolute w-[75.00%] h-0 top-[39.17%] left-[10.00%] object-cover"
                alt=""
                src="/img/vector-2.svg"
              />
              <img
                className="absolute w-[33.33%] h-[16.67%] top-[54.17%] left-[29.17%]"
                alt=""
                src="/img/vector-3.svg"
              />
            </div>
          </div>
        </button>

        {timeperiods.map((period) => (
          <button
            key={period.id}
            onClick={() => handlePeriodSelect(period.value)}
            className={`flex flex-col w-[100.98px] h-[30px] items-center justify-center gap-2.5 p-4 relative rounded-[5px] border-[0.2px] border-solid transition-all duration-200 hover:border-[#5a66c1] focus:outline-none focus:ring-2 focus:ring-[#5a66c1] focus:ring-opacity-50 ${
              selectedPeriod === period.value
                ? "border-[#5a66c1] w-[104.97px]"
                : "border-[#a9b4be]"
            }`}
            type="button"
            aria-pressed={selectedPeriod === period.value}
            aria-label={`Select ${period.label} time period`}
          >
            <div
              className={`flex w-[126px] items-center justify-center gap-[15px] relative flex-[0_0_auto] mt-[-9.00px] mb-[-9.00px] ${
                selectedPeriod === period.value
                  ? "ml-[-26.52px] mr-[-26.52px]"
                  : "ml-[-28.51px] mr-[-28.51px]"
              }`}
            >
              <span
                className={`relative flex items-center justify-center h-4 mt-[-1.00px] text-xs tracking-[0.40px] leading-[19.2px] [font-family:'Tajawal',Helvetica] whitespace-nowrap [direction:rtl] ${
                  selectedPeriod === period.value
                    ? "font-bold text-[#5a66c1] w-11"
                    : "opacity-70 font-normal text-[#5b738b]"
                } ${
                  period.id === "week"
                    ? "w-[34px]"
                    : period.id === "month"
                      ? "w-[35px]"
                      : period.id === "sixMonths"
                        ? "w-[41px]"
                        : "w-11"
                }`}
              >
                {period.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      <h1 className="relative w-fit font-extrabold text-[#5a66c1] text-lg text-left tracking-[0.16px] leading-6 whitespace-nowrap [font-family:'Tajawal',Helvetica] [direction:rtl]">
        المشتريات
      </h1>
    </section>
  );
};
