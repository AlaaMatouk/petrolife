import { User, ArrowLeft, History, Wallet, MessageCircle, Mail, Phone } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { DataTableSection } from "../../../sections/DataTableSection";
import exportIcon from "../../../../assets/imgs/icons/export-icon.svg";
import { fetchOrdersForClient } from "../../../../services/firestore";

// Columns configuration for individual activity log (Financial Transactions)
const activityColumns = [
  {
    key: "export",
    priority: "high",
    render: (value: any) => (
      <div className="flex items-center gap-2">
        <img src={exportIcon} alt="export" className="w-4 h-4" />
        <span>{value}</span>
      </div>
    ),
  },
  {
    key: "operationStatus",
    label: "تراكمي العمليات (ر.س)",
    priority: "low",
  },
  {
    key: "operationCost",
    label: "قيمة العملية",
    priority: "medium",
  },
  {
    key: "operationDate",
    label: "تاريخ العملية",
    priority: "high",
  },
  {
    key: "driverName",
    label: "اسم السائق",
    priority: "medium",
  },
  {
    key: "operationType",
    label: "نوع العملية",
    priority: "high",
  },
  {
    key: "operationNumber",
    label: "رقم العملية",
    priority: "high",
  },
];

// Fetch real orders data for the specific client
const fetchIndividualActivities = async (clientId: string) => {
  try {
    console.log("\n🔄 ========================================");
    console.log("INDIVIDUALS INFO - FETCHING ACTIVITIES");
    console.log("========================================");
    console.log("🔄 Fetching orders for client:", clientId);
    console.log("🔄 Client ID type:", typeof clientId);
    console.log("🔄 Client ID value:", JSON.stringify(clientId));

    // Fetch orders from Firestore filtered by client ID/email
    const orders = await fetchOrdersForClient(clientId);

    // Map orders data to table format
    const mappedActivities = orders.map((order, index) => {
      // Calculate cumulative cost (sum of all previous orders + current)
      const cumulativeCost = orders
        .slice(0, index + 1)
        .reduce((sum, o) => sum + (parseFloat(o.totalPrice) || 0), 0);

      // Format date
      const formatDate = (date: any) => {
        if (!date) return "-";

        try {
          // Handle Firestore Timestamp
          if (date?.toDate && typeof date.toDate === "function") {
            return date.toDate().toLocaleDateString("ar-SA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          }

          // Handle Date object
          if (date instanceof Date) {
            return date.toLocaleDateString("ar-SA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          }

          // Handle string date
          if (typeof date === "string") {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toLocaleDateString("ar-SA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            }
          }

          return String(date);
        } catch (error) {
          console.error("Error formatting date:", error);
          return "-";
        }
      };

      // Get service type/operation type
      const getOperationType = (order: any) => {
        if (order.service?.title) return order.service.title;
        if (order.selectedOption?.name?.ar) return order.selectedOption.name.ar;
        if (order.selectedOption?.name) {
          // Handle case where name is an object with ar/en
          if (typeof order.selectedOption.name === "object") {
            return (
              order.selectedOption.name.ar ||
              order.selectedOption.name.en ||
              "خدمة غير محددة"
            );
          }
          return order.selectedOption.name;
        }
        if (order.fuelType) return order.fuelType;
        if (order.category) return order.category;
        return "خدمة غير محددة";
      };

      // Helper function to safely extract string values from objects
      const safeStringValue = (value: any): string => {
        if (!value) return "-";
        if (typeof value === "string") return value;
        if (typeof value === "object") {
          // Handle localized objects like {ar: "text", en: "text"}
          if (value.ar) return value.ar;
          if (value.en) return value.en;
          // If it's an object but no ar/en, convert to string
          return JSON.stringify(value);
        }
        return String(value);
      };

      return {
        id: order.id,
        operationNumber: order.refId || order.id,
        operationType: getOperationType(order),
        driverName: safeStringValue(
          order.driverName || order.assignedDriver?.name
        ),
        operationDate: formatDate(order.orderDate || order.createdAt),
        operationCost: parseFloat(order.totalPrice) || 0,
        operationStatus: cumulativeCost,
        export: "تصدير",
      };
    });

    console.log(
      `✅ Mapped ${mappedActivities.length} activities for client ${clientId}`
    );

    // Additional validation to ensure all values are strings
    const validatedActivities = mappedActivities.map((activity) => ({
      ...activity,
      operationNumber: String(activity.operationNumber || ""),
      operationType: String(activity.operationType || ""),
      driverName: String(activity.driverName || ""),
      operationDate: String(activity.operationDate || ""),
      operationCost: Number(activity.operationCost) || 0,
      operationStatus: Number(activity.operationStatus) || 0,
      export: String(activity.export || ""),
    }));

    return validatedActivities;
  } catch (error) {
    console.error("❌ Error fetching individual activities:", error);
    return [];
  }
};

export const IndividualsInfo = ({
  individualData,
}: {
  individualData: any;
}) => {
  const navigate = useNavigate();
  const [isContactMenuOpen, setIsContactMenuOpen] = useState(false);
  const contactButtonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Debug logging for individual data
  console.log("\n👤 ========================================");
  console.log("INDIVIDUALS INFO - COMPONENT RENDERED");
  console.log("========================================");
  console.log("👤 Individual Data:", individualData);
  console.log("👤 Individual ID:", individualData?.id);
  console.log("👤 Individual Code:", individualData?.individualCode);
  console.log("👤 Individual Name:", individualData?.individualName);
  console.log("👤 Individual Email:", individualData?.email);

  // Determine which identifier to use for fetching orders
  const clientIdentifier =
    individualData.email || individualData.id || individualData.individualCode;
  console.log("👤 Using identifier for orders:", clientIdentifier);

  // Helper function to get value or dash
  const getValueOrDash = (value: any) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    // Handle objects with ar/en properties
    if (typeof value === "object" && value !== null) {
      if (value.ar) return value.ar;
      if (value.en) return value.en;
      // If it's an object but no ar/en, convert to string
      return JSON.stringify(value);
    }

    return String(value);
  };

  // Helper function to format Firestore Timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";

    try {
      // Handle Firestore Timestamp
      if (timestamp?.toDate && typeof timestamp.toDate === "function") {
        return timestamp.toDate().toLocaleDateString("ar-SA", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      // Handle Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString("ar-SA", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      // Handle string date
      if (typeof timestamp === "string") {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
      }

      return String(timestamp);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  // Extract individual information from Firestore data
  const individualInfo = {
    name: getValueOrDash(individualData.individualName || individualData.name),
    phone: getValueOrDash(individualData.phone || individualData.phoneNumber),
    email: getValueOrDash(individualData.email),
    city: getValueOrDash(
      individualData.city?.name?.ar ||
        individualData.city?.name?.en ||
        individualData.city
    ),
    address: getValueOrDash(individualData.address || individualData.location),
    createdAt: formatDate(
      individualData.createdDate ||
        individualData.createdAt ||
        individualData.accountCreationDate
    ),
    image:
      individualData.profilePhoto ||
      individualData.image ||
      individualData.profileImage ||
      individualData.photo,
  };

  // Define all fields to display in 3-column layout
  const fields = [
    { label: "البريد الإلكتروني", value: individualInfo.email },
    { label: "رقم الهاتف", value: individualInfo.phone },
    { label: "اسم العميل", value: individualInfo.name },
    { label: "تاريخ انشاء الحساب", value: individualInfo.createdAt },
    { label: "العنوان", value: individualInfo.address },
    { label: "المدينه", value: individualInfo.city },
  ];

  // Helper function to render field
  const renderField = (field: any) => (
    <div className="flex flex-col gap-2 flex-1">
      <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
        {field.label}
      </label>
      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
        {field.value}
      </div>
    </div>
  );

  // Helper function to render rows of 3 columns
  const renderFieldRows = () => {
    const rows: React.ReactNode[] = [];
    for (let i = 0; i < fields.length; i += 3) {
      const rowFields = fields.slice(i, i + 3);
      rows.push(
        <div
          key={i}
          className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]"
        >
          {rowFields.map((field, index) => (
            <React.Fragment key={index}>{renderField(field)}</React.Fragment>
          ))}
          {/* Fill remaining columns if less than 3 */}
          {rowFields.length < 3 &&
            Array.from({ length: 3 - rowFields.length }).map((_, index) => (
              <div key={`empty-${index}`} className="flex-1" />
            ))}
        </div>
      );
    }
    return rows;
  };

  // Update menu position when opened
  const updateMenuPosition = () => {
    if (!contactButtonRef.current) return;
    
    const rect = contactButtonRef.current.getBoundingClientRect();
    const menuWidth = 200;
    const viewportWidth = window.innerWidth;
    
    let left = rect.right - menuWidth;
    
    if (left < 4) {
      left = 4;
    }
    if (left + menuWidth > viewportWidth - 4) {
      left = viewportWidth - menuWidth - 4;
    }
    
    setMenuPosition({
      top: rect.bottom + 8,
      left: left
    });
  };

  // Handle contact menu toggle
  const handleContactMenuToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsContactMenuOpen(!isContactMenuOpen);
    if (!isContactMenuOpen) {
      setTimeout(updateMenuPosition, 0);
    }
  };

  // Handle contact option click
  const handleContactOption = (option: string) => {
    setIsContactMenuOpen(false);
    
    if (option === 'email') {
      const email = individualData.email || individualInfo.email;
      if (email && email !== '-') {
        window.location.href = `mailto:${email}`;
      } else {
        alert('لا يوجد بريد إلكتروني متاح للعميل');
      }
    } else if (option === 'whatsapp') {
      const phone = individualData.phone || individualData.phoneNumber || individualInfo.phone;
      if (phone && phone !== '-') {
        let cleanPhone = phone.replace(/\D/g, '');
        
        if (cleanPhone.startsWith('0')) {
          cleanPhone = cleanPhone.substring(1);
        }
        
        if (!cleanPhone.startsWith('966') && cleanPhone.length > 0) {
          cleanPhone = '966' + cleanPhone;
        }
        
        const whatsappUrl = `https://wa.me/${cleanPhone}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('لا يوجد رقم هاتف متاح للعميل');
      }
    } else if (option === 'internal-chat') {
      console.log('Internal chat selected');
    }
  };

  // Update menu position on scroll/resize
  useEffect(() => {
    if (isContactMenuOpen) {
      updateMenuPosition();
      
      const handleScroll = () => updateMenuPosition();
      const handleResize = () => updateMenuPosition();
      
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isContactMenuOpen]);

  return (
    <div>
      <main
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
        data-model-id="individual-info"
      >
        <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
          <nav className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]"
              aria-label="العودة"
            >
              <div className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </div>
            </button>

            <div className="flex w-[134px] items-center justify-end gap-1.5 relative">
              <h1 className="w-[145px] h-5 mt-[-1.00px] ml-[-35.00px] font-bold text-[var(--form-section-title-color)] text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap relative [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
                معلومات العميل
              </h1>
              <User className="w-5 h-5 text-gray-500" />
            </div>
          </nav>
        </header>

        <section className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-end gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
            <form className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              {/* Client Image Section - Full Width Row */}
              <div className="flex mt-[-20px] items-center justify-end relative self-stretch w-full flex-[0_0_auto]">
                {individualInfo.image ? (
                  <img
                    src={individualInfo.image}
                    alt="صورة العميل"
                    className="w-32 h-32 object-cover rounded-full border-4 border-blue-500 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center bg-gray-200 rounded-full border-4 border-gray-300 shadow-lg">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Dynamic fields in 3-column layout */}
              {renderFieldRows()}

              {/* Contact Button */}
              <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative">
                  <button
                    type="button"
                    ref={contactButtonRef}
                    onClick={handleContactMenuToggle}
                    className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] hover:opacity-90 transition-opacity"
                    style={{ border: "0.5px solid #A9B4BE" }}
                    aria-label="تواصل مع العميل"
                  >
                    <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                      <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-[#5B738B] text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
                        تواصل مع العميل
                      </div>
                    </div>
                  </button>

                  {/* Contact Menu Dropdown */}
                  {isContactMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsContactMenuOpen(false)}
                      />
                      {createPortal(
                        <div
                          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 w-[220px]"
                          style={{
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`
                          }}
                        >
                          {/* Internal Chat Option */}
                          <button
                            onClick={() => handleContactOption('internal-chat')}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors [direction:rtl] text-right"
                          >
                            <span className="text-sm text-gray-700 font-medium flex-1">دردشة داخلية</span>
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <MessageCircle className="w-4 h-4 text-blue-500" />
                            </div>
                          </button>

                          {/* Email Message Option */}
                          <button
                            onClick={() => handleContactOption('email')}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors [direction:rtl] text-right border-t border-gray-100"
                          >
                            <span className="text-sm text-gray-700 font-medium flex-1">رسالة ايميل</span>
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <Mail className="w-4 h-4 text-purple-500" />
                            </div>
                          </button>

                          {/* Via WhatsApp Option */}
                          <button
                            onClick={() => handleContactOption('whatsapp')}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors [direction:rtl] text-right border-t border-gray-100"
                          >
                            <span className="text-sm text-gray-700 font-medium flex-1">عبر الواتساب</span>
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                              <Phone className="w-4 h-4 text-white" />
                            </div>
                          </button>
                        </div>,
                        document.body
                      )}
                    </>
                  )}
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* Individual Activity Log Section - Using DataTableSection */}
      <div className="mt-[var(--corner-radius-large)]">
        <DataTableSection
          title="المعاملات المالية"
          entityName="نشاط"
          entityNamePlural="أنشطة"
          icon={Wallet}
          columns={activityColumns}
          fetchData={() => fetchIndividualActivities(clientIdentifier)}
          addNewRoute=""
          viewDetailsRoute={(id: number | string) =>
            `/individual-activity/${id}`
          }
          loadingMessage="جاري تحميل سجل الفرد..."
          itemsPerPage={5}
          showTimeFilter={false}
          showAddButton={false}
        />
      </div>
    </div>
  );
};
