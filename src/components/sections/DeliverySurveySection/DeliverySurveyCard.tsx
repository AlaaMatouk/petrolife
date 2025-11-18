interface DeliverySurveyCardProps {
  title?: string;
}

export const DeliverySurveyCard = ({ title = "تقرير طلبات التوصيل" }: DeliverySurveyCardProps): JSX.Element => {
    const fuelData = [
      {
        id: 1,
        name: "بنزين 95",
        color: "#ee3939",
        current: 50,
        total: 200,
      },
      {
        id: 2,
        name: "ديزل",
        color: "#e76500",
        current: 15,
        total: 200,
      },
      {
        id: 3,
        name: "بنزين 91",
        color: "#00c850",
        current: 15,
        total: 200,
      },
    ];
  
    return (
      <div className="relative w-full h-[255px]">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-white rounded-2xl border border-gray-300 shadow-sm" />
  
          <div className="flex items-end justify-between absolute top-5 left-5 right-5">
            <div className="[font-family:'Tajawal-Regular',Helvetica] font-normal text-[#5b738b] text-base tracking-[0.20px] leading-6 relative w-fit whitespace-nowrap [direction:rtl]">
              {" "}
              اجمالي الطلبات&nbsp;&nbsp;80
            </div>
  
            <h1 className="mt-[-0.20px] [font-family:'Tajawal-Bold',Helvetica] font-bold text-[#5a66c1] text-xl text-left tracking-[0] leading-7 relative w-fit whitespace-nowrap [direction:rtl]">
              {title}
            </h1>
          </div>
  
          <div className="flex flex-col items-start gap-6 absolute top-[70px] left-5 right-5">
            {fuelData.map((fuel, index) => (
              <div
                key={fuel.id}
                className={`relative w-full ${
                  index === 1
                    ? "h-[34px]"
                    : index === 0
                      ? "h-[33.07px]"
                      : "h-[34px]"
                }`}
              >
                {/* Background bar (light gray) */}
                <div
                  className={`${index === 0 ? "top-7" : "top-[29px]"} left-0 right-0 h-[5px] absolute rounded-full`}
                  style={{ backgroundColor: '#f3f4f6' }}
                />
  
                <div className="flex w-full h-[22px] items-center justify-between absolute top-0 left-0">
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Tajawal-Medium',Helvetica] font-medium text-[#223548] text-sm text-right tracking-[0.10px] leading-[22.4px] whitespace-nowrap">
                    {fuel.total} / {fuel.current}
                  </div>
  
                  <div className="inline-flex items-center justify-center gap-1 relative flex-[0_0_auto]">
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Tajawal-Regular',Helvetica] font-normal text-[#223548] text-sm text-left tracking-[0.25px] leading-[22.4px] whitespace-nowrap [direction:rtl]">
                      {fuel.name}
                    </div>
  
                    <div className="inline-flex h-[22px] items-center gap-2.5 pt-0 pb-0.5 px-0 relative flex-[0_0_auto]">
                      <div
                        className="relative w-1.5 h-1.5 rounded-[3px]"
                        style={{ backgroundColor: fuel.color }}
                      />
                    </div>
                  </div>
                </div>
  
                {/* Progress bar fill */}
                <div
                  className={`${index === 0 ? "top-7" : "top-[29px]"} absolute h-[5px] rounded-full`}
                  style={{
                    backgroundColor: fuel.color,
                    width: `${(fuel.current / fuel.total) * 100}%`,
                    right: 0,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };