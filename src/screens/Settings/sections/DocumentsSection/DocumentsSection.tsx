import React, { useState } from "react";
import { Camera, Download } from "lucide-react";

interface DocumentCardProps {
  title: string;
  imageUrl?: string;
  onUpdate: () => void;
  onDownload?: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ title, imageUrl, onUpdate, onDownload }) => {
  return (
    <div className="flex flex-col gap-4 bg-white rounded-lg border border-[color:var(--border-subtle)] p-4" dir="rtl">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      
      <div className="relative w-full">
        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-4">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-400" />
                </div>
              </div>
            )}
            
            {imageUrl && onDownload && (
              <button
                onClick={onDownload}
                className="absolute bottom-2 right-2 w-8 h-8 bg-white hover:bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center transition-colors shadow-sm"
                aria-label="تحميل"
              >
                <Download className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onUpdate}
        className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <Camera className="w-4 h-4 text-gray-700" />
        <span className="text-sm font-medium text-gray-700">تحديث {title}</span>
      </button>
    </div>
  );
};

export const DocumentsSection = (): JSX.Element => {
  const [documents, setDocuments] = useState({
    commercialRegister: null as string | null,
    taxCertificate: null as string | null,
    addressFile: null as string | null,
  });

  const handleDocumentUpdate = (documentType: keyof typeof documents) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocuments((prev) => ({
            ...prev,
            [documentType]: reader.result as string,
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleDownload = (documentType: keyof typeof documents) => {
    console.log("Downloading:", documentType);
    // TODO: Implement download functionality
  };

  return (
    <div className="flex flex-col gap-6 bg-white rounded-lg border border-[color:var(--border-subtle)] p-6" dir="rtl">
      <div className="relative flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)] relative z-10 flex items-center gap-2">
          <span>الوثائق</span>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DocumentCard
          title="السجل التجاري"
          imageUrl={documents.commercialRegister || undefined}
          onUpdate={() => handleDocumentUpdate("commercialRegister")}
          onDownload={documents.commercialRegister ? () => handleDownload("commercialRegister") : undefined}
        />
        
        <DocumentCard
          title="شهادة الضرائب"
          imageUrl={documents.taxCertificate || undefined}
          onUpdate={() => handleDocumentUpdate("taxCertificate")}
          onDownload={documents.taxCertificate ? () => handleDownload("taxCertificate") : undefined}
        />
        
        <DocumentCard
          title="ملف العنوان"
          imageUrl={documents.addressFile || undefined}
          onUpdate={() => handleDocumentUpdate("addressFile")}
          onDownload={documents.addressFile ? () => handleDownload("addressFile") : undefined}
        />
      </div>
    </div>
  );
};
