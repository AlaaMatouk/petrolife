import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input, Select } from "../../shared/Form";

// Form field types
export type FormFieldType = 'text' | 'email' | 'tel' | 'number' | 'password' | 'select' | 'file' | 'textarea';

// Select option interface
export interface SelectOption {
  value: string;
  label: string;
}

// Form field configuration interface
export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  span?: 1 | 2 | 3 | 4 | 5 | 6; // Grid span property (1-6 columns)
  options?: SelectOption[]; // For select fields
  icon?: React.ReactNode; // For fields with icons
  accept?: string; // For file fields
  className?: string;
}

// AddForm component props
export interface AddFormProps {
  title: string;
  titleIcon?: React.ReactNode;
  fields: FormField[];
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  submitButtonText?: string;
  showBackButton?: boolean;
  backButtonAction?: () => void;
  validationSchema?: (values: Record<string, any>) => Record<string, string>;
  isLoading?: boolean;
  showCancelButton?: boolean;
  cancelButtonText?: string;
  cancelButtonAction?: () => void;
}

export const AddForm = ({
  title,
  titleIcon = <Plus className="w-5 h-5 text-gray-500" />,
  fields,
  initialValues,
  onSubmit,
  submitButtonText = "إضافة",
  showBackButton = true,
  backButtonAction,
  validationSchema,
  isLoading = false,
  showCancelButton = false,
  cancelButtonText = "الغاء",
  cancelButtonAction
}: AddFormProps): JSX.Element => {
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync values when initialValues change (for edit mode)
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  // Helper function to get grid column span class
  const getGridSpanClass = (span: number = 1) => {
    switch (span) {
      case 1: return 'col-span-1';
      case 2: return 'col-span-2';
      case 3: return 'col-span-3';
      case 4: return 'col-span-4';
      case 5: return 'col-span-5';
      case 6: return 'col-span-6';
      default: return 'col-span-1';
    }
  };

  // Handle field value changes
  const handleChange = (fieldKey: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldKey]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldKey]) {
      setErrors(prev => ({ ...prev, [fieldKey]: '' }));
    }
  };

  // Handle field blur for validation
  const handleFieldBlur = (fieldKey: string) => {
    if (validationSchema) {
      const fieldErrors = validationSchema(values);
      if (fieldErrors[fieldKey]) {
        setErrors(prev => ({ ...prev, [fieldKey]: fieldErrors[fieldKey] }));
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (fieldKey: string, accept?: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept || "*/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleChange(fieldKey, file);
      }
    };
    input.click();
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form if validation schema is provided
    if (validationSchema) {
      const formErrors = validationSchema(values);
      const hasErrors = Object.keys(formErrors).length > 0;
      
      if (hasErrors) {
        setErrors(formErrors);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      // Reset form after successful submission
      setValues(initialValues);
      setErrors({});
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render form field based on type
  const renderField = (field: FormField) => {
    const gridSpanClass = getGridSpanClass(field.span);
    const fieldError = errors[field.key];

    switch (field.type) {
      case 'select':
        return (
          <div key={field.key} className={`flex flex-col gap-2 ${gridSpanClass}`}>
            <Select
              label={field.label}
              name={field.key}
              value={values[field.key] || ''}
              onChange={(value) => handleChange(field.key, value)}
              onBlur={() => handleFieldBlur(field.key)}
              options={field.options || []}
              error={fieldError}
              icon={field.icon}
              required={field.required}
            />
          </div>
        );

      case 'file':
        return (
          <div key={field.key} className={`flex flex-col gap-2 ${gridSpanClass}`}>
            <label className="text-sm font-normal text-[var(--form-active-label-color)] [direction:rtl] text-right">
              {field.label}
              {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>
            <button
              type="button"
              onClick={() => handleFileUpload(field.key, field.accept)}
              className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder bg-transparent cursor-pointer hover:bg-color-mode-surface-bg-icon-gray transition-colors"
              aria-label={`رفع ${field.label}`}
            >
              {field.icon}
              <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                <div className="w-fit font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] tracking-[var(--body-body-2-letter-spacing)] whitespace-nowrap relative mt-[-1.00px] font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [font-style:var(--body-body-2-font-style)] [direction:rtl]">
                  {values[field.key]?.name || field.placeholder || `ارفع ${field.label} هنا`}
                </div>
              </div>
            </button>
            {fieldError && (
              <p className="text-red-500 text-xs font-medium [direction:rtl] text-right">
                {fieldError}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.key} className={`flex flex-col gap-2 ${gridSpanClass}`}>
            <label className="text-sm font-normal text-[var(--form-active-label-color)] [direction:rtl] text-right">
              {field.label}
              {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>
            <textarea
              value={values[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              onBlur={() => handleFieldBlur(field.key)}
              placeholder={field.placeholder}
              className={`px-3 py-2 bg-white border rounded-lg text-[var(--form-active-input-text-color)] [direction:rtl] text-right font-normal min-h-[100px] resize-vertical ${
                fieldError
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none"
              }`}
              required={field.required}
            />
            {fieldError && (
              <p className="text-red-500 text-xs font-medium [direction:rtl] text-right">
                {fieldError}
              </p>
            )}
          </div>
        );

      default: // text, email, tel, number, password
        return (
          <div key={field.key} className={`flex flex-col gap-2 ${gridSpanClass}`}>
            <Input
              label={field.label}
              type={field.type}
              name={field.key}
              value={values[field.key] || ''}
              onChange={(value) => handleChange(field.key, value)}
              onBlur={() => handleFieldBlur(field.key)}
              placeholder={field.placeholder}
              error={fieldError}
              required={field.required}
              icon={field.icon}
            />
          </div>
        );
    }
  };

  return (
    <main
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
    >
      {/* Header */}
      <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
        <nav className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
          {showBackButton ? (
            <button
              onClick={backButtonAction || (() => navigate(-1))}
              className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]"
              aria-label="العودة"
            >
              <div className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </div>
            </button>
          ) : (
            <div className="flex-[0_0_auto]"></div>
          )}

          <div className="flex w-[134px] items-center justify-end gap-1.5 relative">
            <h1 className="w-[145px] h-5 mt-[-1.00px] ml-[-35.00px] font-bold text-[var(--form-section-title-color)] text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] whitespace-nowrap relative [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
              {title}
            </h1>
            {titleIcon}
          </div>
        </nav>
      </header>

      {/* Form */}
      <section className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-end gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
          <form 
            onSubmit={handleSubmit}
            className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]"
          >
            {/* Render fields using CSS Grid - 6 column grid for flexible layouts */}
            <div className="grid grid-cols-6 gap-5 w-full" dir="rtl">
              {fields.map((field) => renderField(field))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              {showCancelButton && (
                <button
                  type="button"
                  onClick={cancelButtonAction}
                  disabled={isSubmitting || isLoading}
                  className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] transition-opacity bg-gray-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={cancelButtonText}
                >
                  <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                    <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-white text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
                      {cancelButtonText}
                    </div>
                  </div>
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className={`inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] transition-opacity ${
                  isSubmitting || isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-color-mode-surface-primary-blue hover:opacity-90"
                }`}
                aria-label={submitButtonText}
              >
                <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                  {(isSubmitting || isLoading) && (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  )}
                  <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-color-mode-text-icons-t-btn-negative text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
                    {isSubmitting || isLoading ? "جاري الإضافة..." : submitButtonText}
                  </div>
                </div>
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
};

