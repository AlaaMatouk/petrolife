import React from "react";

export interface FooterProps {
  logo?: string;
  privacyText?: string;
  copyrightText?: string;
  privacyLink?: string;
  className?: string;
  showDivider?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  logo = "/img/frame-60.svg",
  privacyText = "سياسة الخصوصية",
  copyrightText = "جميع الحقوق محفوظة لموقع بترولايف @2025",
  privacyLink = "/privacy-policy",
  className = "",
  showDivider = true,
}) => {
  return (
    <footer
      className={`w-full h-12 bg-[var(--surface-navbar)] text-[var(--text-secondary)] transition-colors duration-300 ${className}`}
      role="contentinfo"
    >
      <div className="flex w-full max-w-[1059px] items-center justify-between relative top-2 left-[60px] px-4 lg:px-8 md:px-4 sm:px-2">
        <div className="inline-flex items-center gap-6 relative flex-[0_0_auto]">
          <img
            className="relative flex-[0_0_auto]"
            alt="Company Logo"
            src={logo}
          />

          {showDivider && (
            <img
              className="relative w-px h-6"
              alt="Divider"
              src="/img/line-204.svg"
              role="separator"
            />
          )}

          <a
            href={privacyLink}
            className="relative w-fit font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)] hover:text-color-mode-text-icons-t-blue transition-colors duration-200"
          >
            {privacyText}
          </a>
        </div>

        <p className="relative w-fit font-caption-caption-1 font-[number:var(--caption-caption-1-font-weight)] text-color-mode-text-icons-t-sec text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--caption-caption-1-font-style)]">
          {copyrightText}
        </p>
      </div>
    </footer>
  );
};
