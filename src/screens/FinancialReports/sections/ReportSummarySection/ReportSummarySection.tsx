import React from "react";

export const ReportSummarySection = (): JSX.Element => {
  const toolbarIcons = [
    { src: "/img/component-1.svg", alt: "Component" },
    { src: "/img/component-1-1.svg", alt: "Component" },
    {
      src: null,
      alt: "Vector Icons",
      vectors: [
        {
          src: "/img/vector.svg",
          className:
            "absolute w-[41.67%] h-[41.67%] top-[26.04%] left-[26.04%]",
        },
        {
          src: "/img/vector-1.svg",
          className: "absolute w-[83.33%] h-[83.33%] top-[5.21%] left-[5.21%]",
        },
      ],
    },
    { src: null, alt: "Language", text: "En" },
  ];

  return (
    <header
      className="absolute top-0 left-[calc(50.00%_-_720px)] w-[1440px] h-[72px] flex bg-color-mode-surface-bg-screen shadow-[0px_4px_10px_#0000000a]"
      data-color-mode-mode="dark"
      role="banner"
    >
      <div className="flex mt-[15px] w-[1066px] h-11 ml-[61px] relative items-center justify-between">
        <nav
          className="inline-flex items-center gap-[var(--dimensions-size-x-large)] relative flex-[0_0_auto]"
          role="navigation"
          aria-label="Toolbar"
        >
          <div className="inline-flex items-center gap-[var(--dimensions-size-medium)] relative flex-[0_0_auto]">
            {toolbarIcons.map((icon, index) => (
              <button
                key={index}
                className="relative w-10 h-10 bg-color-mode-surface-bg-icon-gray rounded-[var(--dimensions-size-x-small)] overflow-hidden border-[0.25px] border-solid border-color-mode-text-icons-t-placeholder aspect-[1] hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-color-mode-surface-primary-blue transition-opacity"
                aria-label={icon.alt}
                type="button"
              >
                {icon.src ? (
                  <img
                    className="absolute top-[calc(50.00%_-_10px)] left-[calc(50.00%_-_10px)] w-5 h-5 aspect-[1]"
                    alt={icon.alt}
                    src={icon.src}
                  />
                ) : icon.vectors ? (
                  <div className="relative top-[calc(50.00%_-_10px)] left-[calc(50.00%_-_10px)] w-5 h-5">
                    {icon.vectors.map((vector, vectorIndex) => (
                      <img
                        key={vectorIndex}
                        className={vector.className}
                        alt="Vector"
                        src={vector.src}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="absolute top-[calc(50.00%_-_9px)] left-[calc(50.00%_-_10px)] font-body-body-1 font-[number:var(--body-body-1-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--body-body-1-font-size)] text-right tracking-[var(--body-body-1-letter-spacing)] leading-[var(--body-body-1-line-height)] whitespace-nowrap [font-style:var(--body-body-1-font-style)]">
                    {icon.text}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        <div className="inline-flex items-center justify-end gap-2.5 relative flex-[0_0_auto]">
          <div className="flex flex-col w-[378px] items-end justify-center gap-2.5 pr-[var(--dimensions-size-base)] pl-[var(--dimensions-size-base)] py-2.5 relative bg-color-mode-surface-bg-icon-gray rounded-[var(--dimensions-size-XXXX-large)] border-[0.25px] border-solid border-color-mode-text-icons-t-placeholder">
            <div className="inline-flex items-center justify-end gap-[var(--dimensions-size-small)] relative flex-[0_0_auto]">
              <label className="relative w-fit mt-[-1.00px] font-fine-print-small-medium-underline font-[number:var(--fine-print-small-medium-underline-font-weight)] text-color-mode-text-icons-t-placeholder text-[length:var(--fine-print-small-medium-underline-font-size)] tracking-[var(--fine-print-small-medium-underline-letter-spacing)] leading-[var(--fine-print-small-medium-underline-line-height)] underline whitespace-nowrap [direction:rtl] [font-style:var(--fine-print-small-medium-underline-font-style)]">
                بحث برقم العميل/العملية/ السجل التجاري / رقم الهاتف
              </label>

              <button
                className="relative w-4 h-4 aspect-[1] hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-color-mode-surface-primary-blue transition-opacity"
                aria-label="Search"
                type="button"
              >
                <img
                  className="absolute w-[16.67%] h-[16.67%] top-[67.71%] left-[67.71%]"
                  alt="Vector"
                  src="/img/vector-2.svg"
                />

                <img
                  className="absolute w-[66.67%] h-[66.67%] top-[9.38%] left-[9.38%]"
                  alt="Vector"
                  src="/img/vector-3.svg"
                />
              </button>
            </div>
          </div>

          <div className="inline-flex flex-col items-end gap-2.5 pt-[var(--dimensions-size-medium)] pb-[var(--dimensions-size-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--dimensions-size-medium)]">
            <div className="inline-flex items-center justify-end gap-[var(--dimensions-size-small)] relative flex-[0_0_auto]">
              <div className="inline-flex h-[17px] justify-end pl-2.5 pr-0 pt-[13px] pb-2.5 flex-[0_0_auto] items-center gap-2.5 relative">
                <h1 className="relative w-fit mt-[-14.00px] mb-[-12.00px] font-headings-h1-h6-heading-5 font-[number:var(--headings-h1-h6-heading-5-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--headings-h1-h6-heading-5-font-size)] tracking-[var(--headings-h1-h6-heading-5-letter-spacing)] leading-[var(--headings-h1-h6-heading-5-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--headings-h1-h6-heading-5-font-style)]">
                  التقــــــــــــــــارير / تقارير المشتريات
                </h1>
              </div>

              <img
                className="relative w-[18px] h-[18px] aspect-[1]"
                alt="Side icons"
                src="/img/side-icons.svg"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
