import { ArrowLeft, Edit, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateService } from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../../config/firebase";

interface Service {
  id: string | number;
  image?: string;
  title?: string | { ar: string; en: string };
  description?: string;
  desc?: string | { ar: string; en: string };
  unit?: string | { ar: string; en: string };
  status?: "active" | "inactive";
  serviceId?: string;
  options?: any[];
}

interface ServiceInfoProps {
  serviceData: any;
  isAddMode?: boolean;
}

// Helper function to extract string from multilingual object or return string
const extractString = (value: any, fallback: string = ""): string => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (value.ar) return value.ar;
    if (value.en) return value.en;
    const firstValue = Object.values(value)[0];
    if (typeof firstValue === "string") return firstValue;
  }
  return fallback;
};

export const ServiceInfo = ({
  serviceData,
  isAddMode = false,
}: ServiceInfoProps) => {
  const navigate = useNavigate();

  // Extract and format service data for editing
  const [editedService, setEditedService] = useState<Service>({
    id: serviceData.id || "",
    image: typeof serviceData.image === "string" ? serviceData.image : "",
    title: extractString(serviceData.title),
    description: extractString(serviceData.desc || serviceData.description),
    unit: extractString(serviceData.unit),
    status:
      serviceData.status === "active" || serviceData.isActive
        ? "active"
        : "inactive",
    serviceId: serviceData.serviceId || serviceData.id || "",
  });

  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get options from serviceData and make them editable
  const [serviceOptions, setServiceOptions] = useState<any[]>(
    serviceData.options || []
  );

  const handleInputChange = (field: keyof Service, value: string) => {
    setEditedService((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    const updatedOptions = [...serviceOptions];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value,
    };
    setServiceOptions(updatedOptions);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Handle image upload if it's base64
      let imageUrl = editedService.image || "";
      if (editedService.image && editedService.image.startsWith("data:image")) {
        try {
          addToast({ message: "جاري رفع الصورة...", type: "info" });
          const response = await fetch(editedService.image);
          const blob = await response.blob();
          const timestamp = Date.now();
          const fileName = `services/${timestamp}_${Math.random()
            .toString(36)
            .substring(7)}.png`;
          const storageRef = ref(storage, fileName);
          await uploadBytes(storageRef, blob);
          imageUrl = await getDownloadURL(storageRef);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          addToast({
            message: "فشل في رفع الصورة. سيتم حفظ الخدمة بدون صورة",
            type: "warning",
          });
        }
      }

      // Prepare service data for Firestore
      const serviceUpdateData: any = {
        title:
          typeof editedService.title === "object"
            ? editedService.title
            : { ar: editedService.title, en: editedService.title },
        desc:
          typeof editedService.description === "object"
            ? editedService.description
            : { ar: editedService.description, en: editedService.description },
        unit:
          typeof editedService.unit === "object"
            ? editedService.unit
            : { ar: editedService.unit, en: editedService.unit },
        image: imageUrl,
        status: editedService.status || "active",
        isActive: editedService.status === "active",
        ...(serviceOptions.length > 0 && { options: serviceOptions }),
      };

      await updateService(String(editedService.id), serviceUpdateData);
      addToast({ message: "تم حفظ التعديلات بنجاح!", type: "success" });
      // Redirect to services table after successful save
      setTimeout(() => {
        navigate("/application-services");
      }, 500);
    } catch (error) {
      console.error("Error updating service:", error);
      addToast({
        message: "فشل في حفظ التعديلات. يرجى المحاولة مرة أخرى",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOption = (index: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الخيار؟")) {
      const updatedOptions = serviceOptions.filter((_, i) => i !== index);
      setServiceOptions(updatedOptions);
      addToast({ message: "تم حذف الخيار بنجاح", type: "success" });
    }
  };

  // Helper function to get value or dash
  const getValueOrDash = (value: any) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    return String(value);
  };

  // Extract service information
  const serviceInfo = {
    id: getValueOrDash(editedService.serviceId || editedService.id),
    title: getValueOrDash(editedService.title),
    description: getValueOrDash(editedService.description),
    unit: getValueOrDash(editedService.unit),
    status: editedService.status,
    image: editedService.image,
  };

  // Define all fields to display in 3-column layout
  const fields: FieldType[] = [
    {
      label: "صورة الخدمة",
      value: serviceInfo.image,
      editable: true,
      field: "image" as keyof Service,
      type: "image" as const,
    },
    {
      label: "الرقم التعريفي",
      value: serviceInfo.id,
      editable: false,
      field: "id" as keyof Service,
    },
    {
      label: "الوحدة",
      value: serviceInfo.unit,
      editable: true,
      field: "unit" as keyof Service,
    },
  ];

  // Define field type
  interface FieldType {
    label: string;
    value: string;
    editable: boolean;
    field: keyof Service;
    type?: "image";
  }

  // Helper function to render field
  const renderField = (field: FieldType) => (
    <div className="flex flex-col gap-2 flex-1">
      <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
        {field.label}
      </label>
      {field.type === "image" ? (
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  handleInputChange(
                    field.field,
                    event.target?.result as string
                  );
                };
                reader.readAsDataURL(file);
              }
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal focus:outline-none focus:ring-2 focus:ring-[#5A66C1] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#5A66C1] file:text-white hover:file:bg-[#4A56B1]"
            dir="rtl"
          />
          {editedService[field.field] && (
            <div className="mt-2">
              <img
                src={String(editedService[field.field])}
                alt="صورة الخدمة"
                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      ) : field.field === "unit" ? (
        <select
          value={editedService[field.field]}
          onChange={(e) => handleInputChange(field.field, e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal focus:outline-none focus:ring-2 focus:ring-[#5A66C1] focus:border-transparent"
          dir="rtl"
        >
          <option value="لتر">لتر</option>
          <option value="حبة">حبة</option>
          <option value="كيلو">كيلو</option>
          <option value="متر">متر</option>
        </select>
      ) : (
        <input
          type="text"
          value={editedService[field.field]}
          onChange={(e) => handleInputChange(field.field, e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal focus:outline-none focus:ring-2 focus:ring-[#5A66C1] focus:border-transparent"
          dir="rtl"
          disabled={!field.editable}
          placeholder={`أدخل ${field.label.toLowerCase()}`}
        />
      )}
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

  return (
    <div>
      <main
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
        data-model-id="service-info"
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

            <div className="flex items-center justify-end gap-1.5 relative">
              <h1 className="w-[145px] h-5 mt-[-1.00px] font-bold text-[var(--form-section-title-color)] text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap relative [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
                {isAddMode ? "إضافة خدمة جديدة" : "تعديل الخدمة"}
              </h1>
              {isAddMode ? (
                <Plus className="w-5 h-5 text-gray-500" />
              ) : (
                <Edit className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </nav>
        </header>

        <section className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-end gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
            <form className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              {/* Service Name Input - Full Width */}
              <div className="flex flex-col gap-2 relative self-stretch w-full flex-[0_0_auto]">
                <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                  اسم الخدمة
                </label>
                <input
                  type="text"
                  value={editedService.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal focus:outline-none focus:ring-2 focus:ring-[#5A66C1] focus:border-transparent"
                  dir="rtl"
                  placeholder="أدخل اسم الخدمة"
                />
              </div>

              {/* Service Description Input - Full Width */}
              <div className="flex flex-col gap-2 relative self-stretch w-full flex-[0_0_auto]">
                <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                  وصف الخدمة
                </label>
                <textarea
                  value={editedService.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal focus:outline-none focus:ring-2 focus:ring-[#5A66C1] focus:border-transparent"
                  rows={3}
                  dir="rtl"
                  placeholder="أدخل وصف الخدمة"
                />
              </div>

              {/* Dynamic fields in 3-column layout */}
              {renderFieldRows()}

              {/* Submit Button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-[10px] py-3 bg-[#F5F6F766] text-[#5B738B] rounded-[8px] font-medium disabled:opacity-50"
                >
                  {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* Second Main Section - Options */}
      <main
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder mt-6"
        data-model-id="service-additional-info"
      >
        <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
          <nav className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/application-services/add-choice")}
                className="px-[10px] py-[8px] bg-[#F5F6F766] text-[#5B738B] rounded-[8px] font-normal text-[14px] hover:bg-[#E8E9EA] transition-colors flex items-center gap-2"
                style={{ border: "0.8px solid #A9B4BE" }}
              >
                إضافة خيار جديد <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-1.5 relative">
              <h1 className="w-[145px] h-5 mt-[-1.00px] font-bold text-[var(--form-section-title-color)] text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap relative [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
                خيارات
              </h1>
              <Edit className="w-5 h-5 text-gray-500" />
            </div>
          </nav>
        </header>

        <section className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
          {/* Options List - Editable */}
          {serviceOptions.length > 0 ? (
            serviceOptions.map((option: any, index: number) => (
              <div
                key={index}
                className="flex flex-col border-[0.3px] border-[#A9B4BE] rounded-[12px] p-3 items-start gap-5 relative self-stretch w-full"
                style={{ border: "0.3px solid #A9B4BE" }}
              >
                <form className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                  {/* Top Row - Title */}
                  <div className="flex flex-col gap-2 relative self-stretch w-full flex-[0_0_auto]">
                    <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                      التصنيف الفرعي
                    </label>
                    <input
                      type="text"
                      value={
                        typeof option.title === "object"
                          ? option.title.ar
                          : option.title || ""
                      }
                      onChange={(e) =>
                        handleOptionChange(index, "title", {
                          ar: e.target.value,
                          en: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal focus:outline-none focus:ring-2 focus:ring-[#5A66C1] focus:border-transparent"
                      dir="rtl"
                      placeholder="أدخل التصنيف الفرعي"
                    />
                  </div>

                  {/* Category Display */}
                  {option.category && (
                    <div className="flex flex-col gap-2 relative self-stretch w-full flex-[0_0_auto]">
                      <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                        الفئة الرئيسية
                      </label>
                      <input
                        type="text"
                        value={
                          typeof option.category.name === "object"
                            ? option.category.name.ar || option.category.name.en
                            : option.category.name ||
                              option.category.label ||
                              ""
                        }
                        disabled
                        className="px-3 py-2 border border-gray-300 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal bg-gray-100 cursor-not-allowed"
                        dir="rtl"
                      />
                    </div>
                  )}

                  {/* Middle Row - Prices */}
                  <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col gap-2 flex-1">
                      <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                        السعر للشركات
                      </label>
                      <input
                        type="number"
                        value={option.companyPrice || 0}
                        onChange={(e) =>
                          handleOptionChange(
                            index,
                            "companyPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal focus:outline-none focus:ring-2 focus:ring-[#5A66C1] focus:border-transparent w-full"
                        dir="rtl"
                        placeholder="أدخل السعر للشركات"
                      />
                    </div>

                    <div className="flex flex-col gap-2 flex-1">
                      <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                        السعر
                      </label>
                      <input
                        type="number"
                        value={option.price || 0}
                        onChange={(e) =>
                          handleOptionChange(
                            index,
                            "price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal focus:outline-none focus:ring-2 focus:ring-[#5A66C1] focus:border-transparent w-full"
                        dir="rtl"
                        placeholder="أدخل السعر"
                      />
                    </div>
                  </div>

                  {/* Bottom Row - Description */}
                  <div className="flex flex-col gap-2 relative self-stretch w-full flex-[0_0_auto]">
                    <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                      الوصف
                    </label>
                    <input
                      type="text"
                      value={
                        typeof option.desc === "object"
                          ? option.desc.ar
                          : option.desc || ""
                      }
                      onChange={(e) =>
                        handleOptionChange(index, "desc", {
                          ar: e.target.value,
                          en: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal focus:outline-none focus:ring-2 focus:ring-[#5A66C1] focus:border-transparent"
                      dir="rtl"
                      placeholder="أدخل الوصف"
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="flex justify-end w-full mt-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(index)}
                      className="px-[10px] py-[10px] bg-white text-[#EE3939] rounded-[8px] font-medium transition-colors flex items-center gap-2"
                      style={{ border: "0.5px solid #EE3939" }}
                    >
                      حذف الخيار
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            ))
          ) : (
            <div className="w-full text-center py-8 text-gray-500">
              لا توجد خيارات لهذه الخدمة
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
