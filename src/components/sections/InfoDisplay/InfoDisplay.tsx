import { UserRound, ArrowLeft, Upload, User, Camera, Download } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

interface InfoDisplayProps {
  data: any;
  title: string;
  titleIcon?: React.ReactNode;
  fields: Array<{
    key: string;
    label: string;
    type?: 'text' | 'image' | 'logo' | 'phone' | 'email' | 'address' | 'empty' | 'document';
    className?: string;
    span?: 1 | 2 | 3 | 4 | 5 | 6; // Grid span property (1-6 columns)
    onChangeLogo?: () => void; // Callback for logo change button
    onDownload?: () => void; // Callback for document download
    onUpdate?: () => void; // Callback for document update
  }>;
  onEdit?: () => void;
  showEditButton?: boolean;
  editButtonText?: string;
  showBackButton?: boolean;
  editRoute?: string; // Route to navigate to for edit mode (e.g., "/service-distributer-stations/add")
  entityId?: string | number; // Current entity ID for edit mode
}

export const InfoDisplay = ({ 
  data, 
  title, 
  titleIcon, 
  fields, 
  onEdit,
  showEditButton = true,
  editButtonText = "تعديل البيانات",
  showBackButton = true,
  editRoute,
  entityId
}: InfoDisplayProps): JSX.Element => {
  const navigate = useNavigate();

  // Handle edit button click
  const handleEditClick = () => {
    if (editRoute && entityId !== undefined) {
      // Navigate to edit route with query parameter
      navigate(`${editRoute}?edit=${entityId}`);
    } else if (onEdit) {
      // Fall back to callback if provided
      onEdit();
    }
  };
  
  // Helper function to get value or dash
  const getValueOrDash = (value: any): string => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  };

  // Helper function to format different field types
  const formatFieldValue = (field: any, value: any): string => {
    switch (field.type) {
      case 'image':
        return value ? (value.split('/').pop() || value) : '-';
      case 'phone':
        return getValueOrDash(value);
      case 'email':
        return getValueOrDash(value);
      case 'address':
        return getValueOrDash(value);
      default:
        return getValueOrDash(value);
    }
  };

  // Helper function to render field based on type
  const renderField = (field: any, value: any) => {
    // Calculate grid column span class
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

    const gridSpanClass = getGridSpanClass(field.span);

    if (field.type === 'empty') {
      // Empty spacer field
      return <div className={gridSpanClass} />;
    }

    if (field.type === 'logo') {
      // Logo field with circular photo and change button
      const logoUrl = value || '/img/default-logo.png'; // Use placeholder or actual image
      return (
        <div className={`flex items-end gap-3 ${gridSpanClass}`} dir="rtl">
          {/* Change Logo Button */}
          <button
            onClick={field.onChangeLogo || (() => console.log('Change logo clicked'))}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors"
          >
            <Camera className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-normal text-gray-700">تغيير اللوجو</span>
          </button>
          
          {/* Circular Photo */}
          <div className="flex flex-col gap-2">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
              {logoUrl && logoUrl !== '/img/default-logo.png' ? (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      );
    }

    if (field.type === 'image') {
      return (
        <div className={`flex items-end gap-2 ${gridSpanClass}`}>
          <div className="relative w-[38px] h-[38px]">
            <div className="absolute top-1 left-[5px] w-[38px] h-[38px] rounded-[var(--corner-radius-small)] bg-gray-100 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
            <div className="absolute top-0 left-0 w-3 h-3">
              <div className="absolute -top-px -left-px w-3.5 h-3.5 bg-white rounded-[7px] border border-solid border-gray-200" />
              <Upload className="absolute top-0.5 left-0.5 w-2 h-2 text-gray-400" />
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">{field.label}</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
              {formatFieldValue(field, value)}
            </div>
          </div>
        </div>
      );
    }

    if (field.type === 'document') {
      // Document field with image preview, download button, and update button
      const imageUrl = value || '/img/document-placeholder.jpg'; // Use placeholder or actual image
      return (
        <div className={`flex flex-col gap-3 ${gridSpanClass}`} dir="rtl">
          {/* Field Title */}
          <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
            {field.label}
          </label>
          
          {/* Image with dashed border and download button */}
          <div className="relative w-full">
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-[14px]">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                {imageUrl && imageUrl !== '/img/document-placeholder.jpg' ? (
                  <img 
                    src={imageUrl} 
                    alt={field.label} 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
                    <User className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                
                {/* Download button on bottom-left corner */}
                <button
                  onClick={field.onDownload || (() => console.log('Download clicked'))}
                  className="absolute bottom-[6px] left-[6px] w-8 h-8 bg-white hover:bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center transition-colors shadow-sm"
                  aria-label="تحميل"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Update button */}
          <button
            onClick={field.onUpdate || (() => console.log('Update clicked'))}
            className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center gap-2 transition-colors"
            dir="rtl"
          >
            <Upload className="w-4 h-4 text-gray-700" />
            <span className="text-sm font-medium text-gray-700">
              تحديث {field.label}
            </span>
          </button>
        </div>
      );
    }

    return (
      <div className={`flex flex-col gap-2 ${gridSpanClass}`}>
        <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">{field.label}</label>
        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
          {formatFieldValue(field, value)}
        </div>
      </div>
    );
  };

  // No need for row grouping - CSS Grid will handle layout automatically

  return (
    <main
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
      data-model-id="1:15191"
    >
      <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
        <nav className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
          {showBackButton ? (
            <button
              onClick={() => navigate(-1)}
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
            {titleIcon || <UserRound className="w-5 h-5 text-gray-500" />}
          </div>
        </nav>
      </header>

      <section className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-end gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
          <form className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            {/* Render fields using CSS Grid - 6 column grid for flexible layouts */}
            <div className="grid grid-cols-6 gap-5 w-full" dir="rtl">
              {fields.map((field) => (
                <React.Fragment key={field.key}>
                  {renderField(field, data[field.key])}
                </React.Fragment>
              ))}
            </div>

            {/* Edit Button */}
            {showEditButton && (
              <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                <button
                  onClick={handleEditClick}
                  className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#FFFCEC' }}
                  aria-label={editButtonText}
                >
                  <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                    <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-color-mode-text-icons-t-orange text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
                      {editButtonText}
                    </div>
                  </div>
                </button>
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
};
