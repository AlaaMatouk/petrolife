import { useEffect, useRef, useState } from "react";

// Global flag to prevent multiple initializations
declare global {
  interface Window {
    __ZAIA_INITIALIZED__?: boolean;
    __ZAIA_WIDGET_MOUNTED__?: boolean;
  }
}

/**
 * ZAIA Chatbot Widget Component - Embedded Mode
 * Ensures single instance across all renders
 */
const ZaiaChatWidget = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Guard: Prevent duplicate initialization
    if (window.__ZAIA_INITIALIZED__ || initializingRef.current) {
      setIsLoading(false);
      return;
    }

    initializingRef.current = true;

    const initializeWidget = async () => {
      try {
        // Check if script already exists
        let script = document.querySelector(
          'script[src="https://chatbot.zaiasystems.com/widget/zaia-chat.js"]'
        ) as HTMLScriptElement;

        if (!script) {
          // Create script only if it doesn't exist
          script = document.createElement("script");
          script.src = "https://chatbot.zaiasystems.com/widget/zaia-chat.js";
          script.setAttribute(
            "data-bot-id",
            "931448e3-41ae-4919-8289-ab529085bcdd"
          );
          script.async = true;

          // Wait for script to load
          await new Promise<void>((resolve, reject) => {
            script.onerror = () => {
              console.error("Failed to load ZAIA chatbot widget");
              reject(new Error("Script load failed"));
            };
            script.onload = () => resolve();
            document.body.appendChild(script);
          });
        }

        // Wait for widget to render in DOM
        await waitForWidget();

        // Embed the widget into our container
        embedWidget();

        // Mark as initialized globally
        window.__ZAIA_INITIALIZED__ = true;
        setIsLoading(false);
      } catch (error) {
        console.error("Widget initialization failed:", error);
        setHasError(true);
        setIsLoading(false);
        initializingRef.current = false;
      }
    };

    initializeWidget();

    // Cleanup only on unmount (not on re-render)
    return () => {
      // Intentionally minimal - don't cleanup global state on re-render
    };
  }, []); // Empty deps - run once only

  const waitForWidget = (): Promise<void> => {
    return new Promise((resolve) => {
      const checkWidget = setInterval(() => {
        const zaiaElements = document.querySelectorAll(
          '[class*="zaia"], [id*="zaia"]'
        );
        if (zaiaElements.length > 0) {
          clearInterval(checkWidget);
          resolve();
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkWidget);
        resolve();
      }, 5000);
    });
  };

  const embedWidget = () => {
    if (!containerRef.current || window.__ZAIA_WIDGET_MOUNTED__) return;

    const zaiaElements = Array.from(
      document.querySelectorAll(
        '[class*="zaia"], [id*="zaia"], [class*="ZAIA"], [id*="ZAIA"]'
      )
    ) as HTMLElement[];

    // Find the root widget container (fixed position)
    const rootWidget = zaiaElements.find((el) => {
      const styles = window.getComputedStyle(el);
      return (
        (styles.position === "fixed" || styles.position === "absolute") &&
        el.tagName === "DIV" &&
        !el.hasAttribute("data-embedded")
      );
    });

    if (!rootWidget) return;

    // Mark as embedded and mounted
    rootWidget.setAttribute("data-embedded", "true");
    window.__ZAIA_WIDGET_MOUNTED__ = true;

    try {
      containerRef.current.appendChild(rootWidget);
      applyEmbeddedStyles();
    } catch (e) {
      console.error("Failed to embed widget:", e);
      window.__ZAIA_WIDGET_MOUNTED__ = false;
    }
  };

  const applyEmbeddedStyles = () => {
    // Guard: Only inject styles once
    if (document.head.querySelector('style[data-zaia-embedded="true"]')) {
      return;
    }

    const styles = document.createElement("style");
    styles.setAttribute("data-zaia-embedded", "true");
    styles.textContent = `
      /* Embedded ZAIA Container */
      [data-embedded="true"] {
        position: relative !important;
        top: auto !important;
        left: auto !important;
        right: auto !important;
        bottom: auto !important;
        transform: none !important;
        margin: 0 !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 600px !important;
        display: block !important;
      }

      /* Toggle button - bottom-right corner of container */
      [data-embedded="true"] > button,
      [data-embedded="true"] > div > button {
        position: absolute !important;
        bottom: 16px !important;
        right: 16px !important;
        margin: 0 !important;
        z-index: 10 !important;
      }

      /* Chat window - fills container when open */
      [data-embedded="true"] iframe,
      [data-embedded="true"] [class*="chat-window"],
      [data-embedded="true"] [class*="conversation"] {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        max-height: 100% !important;
        border-radius: 8px !important;
      }
    `;

    document.head.appendChild(styles);
  };

  if (hasError) {
    return (
      <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center gap-4 bg-red-50 rounded-lg border border-red-200 p-8">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold mb-2">فشل تحميل الدعم الفني</p>
          <p className="text-sm">
            يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[600px] relative bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg flex items-center justify-center"
      id="zaia-chat-container"
    >
      {isLoading && (
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <div className="text-gray-500 text-sm">
              جاري تحميل الدعم الفني...
            </div>
          </div>
        </div>
      )}
      {!isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              مرحباً بك في الدعم الفني
            </h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              نحن هنا لمساعدتك! للبدء في المحادثة، اضغط على الزر في الزاوية
              السفلية اليمنى
            </p>
            <div className="flex items-center justify-center gap-2 text-purple-600">
              <span className="text-2xl animate-bounce">↘</span>
              <span className="text-sm font-medium">اضغط هنا للمحادثة</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZaiaChatWidget;
