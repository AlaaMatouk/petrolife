import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Search, Plus, Building2, Car, CheckCircle2, ArrowRight } from "lucide-react";
import { fetchAllCompanies } from "../../../../services/firestore";

interface Company {
  id: string;
  name: string;
  refid?: string;
  phoneNumber?: string;
  email?: string;
  city?: string;
  logo?: string;
  isActive?: boolean;
  formattedLocation?: {
    address?: {
      city?: string;
    };
  };
}

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (companyId: string) => Promise<void>;
  excludedCompanyIds?: string[]; // Companies already added to agent
}

export const AddCompanyModal = ({
  isOpen,
  onClose,
  onAdd,
  excludedCompanyIds = [],
}: AddCompanyModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyEmail, setSelectedCompanyEmail] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [addedCompanyName, setAddedCompanyName] = useState("");

  // Fetch companies on mount
  useEffect(() => {
    if (isOpen) {
      const fetchCompanies = async () => {
        setLoading(true);
        try {
          const allCompanies = await fetchAllCompanies();
          
          // Get excluded company emails
          // Note: excludedCompanyIds are document IDs, which ARE the emails in Firestore
          const excludedEmails = new Set<string>();
          if (excludedCompanyIds && excludedCompanyIds.length > 0) {
            excludedCompanyIds.forEach((excludedId: string) => {
              // Document ID is the email, so use it directly
              if (excludedId) {
                excludedEmails.add(excludedId.toLowerCase().trim());
              }
            });
          }
          
          // Filter by email/document ID to ensure uniqueness and exclude already added companies
          // Note: In Firestore, companies use email as document ID, so company.id IS the email
          const seenEmails = new Set<string>();
          const filtered = allCompanies.filter((company: any) => {
            // Use document ID (which is the email) as primary identifier
            // Fall back to email field if ID doesn't exist
            const companyEmail = (company.id || company.email || "").toLowerCase().trim();
            
            // Ensure company has a valid email/ID
            if (!companyEmail) {
              console.warn("Company without email/ID found:", company.name || company.id);
              return false;
            }
            
            // Check for duplicate emails (use first occurrence)
            if (seenEmails.has(companyEmail)) {
              console.warn("Duplicate company email found:", companyEmail, company.name);
              return false;
            }
            seenEmails.add(companyEmail);
            
            // Check if excluded
            const isExcluded = excludedEmails.has(companyEmail);
            
            // Only show active companies
            return !isExcluded && (company.isActive !== false);
          });
          
          setCompanies(filtered);
        } catch (error) {
          console.error("Error fetching companies:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchCompanies();
    }
  }, [isOpen, excludedCompanyIds]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedCompanyEmail(null);
      setShowSuccess(false);
      setAddedCompanyName("");
    }
  }, [isOpen]);

  // Filter companies based on search query
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;

    const query = searchQuery.toLowerCase().trim();
    return companies.filter(
      (company) =>
        company.name?.toLowerCase().includes(query) ||
        company.refid?.toLowerCase().includes(query) ||
        company.email?.toLowerCase().includes(query)
    );
  }, [companies, searchQuery]);

  const handleAdd = async () => {
    if (!selectedCompanyEmail) return;

    // Normalize the selected email for comparison
    const normalizedSelectedEmail = selectedCompanyEmail.toLowerCase().trim();
    
    // Find company by email (case-insensitive)
    // Check both the email field and the document ID (since companies use email as document ID)
    const selectedCompany = companies.find((c) => {
      if (!c) return false;
      
      // Check email field
      const emailMatch = c.email && 
        c.email.toLowerCase().trim() === normalizedSelectedEmail;
      
      // Check document ID (which might also be the email)
      const idMatch = c.id && 
        c.id.toLowerCase().trim() === normalizedSelectedEmail;
      
      return emailMatch || idMatch;
    });
    
    if (!selectedCompany) {
      console.error("Selected company not found:", {
        selectedEmail: selectedCompanyEmail,
        normalizedSelectedEmail,
        availableCompanies: companies.map(c => ({
          id: c.id,
          email: c.email,
          name: c.name
        }))
      });
      alert("الشركة المختارة غير موجودة");
      return;
    }
    
    // Use document ID for Firestore operation (document ID is the email)
    const companyId = selectedCompany.id || selectedCompany.email;
    if (!companyId) {
      console.error("Company has no ID or email:", selectedCompany);
      alert("خطأ: الشركة لا تحتوي على معرف صالح");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(companyId);
      setAddedCompanyName(selectedCompany.name || "الشركة");
      setShowSuccess(true);
    } catch (error) {
      console.error("Error adding company:", error);
      alert("حدث خطأ أثناء إضافة الشركة");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setShowSuccess(false);
    setSelectedCompanyEmail(null);
    setSearchQuery("");
  };

  const handleBack = () => {
    onClose();
  };

  if (!isOpen) return null;

  // Success screen
  if (showSuccess) {
    return createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleBack}
        dir="rtl"
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">تم بنجاح!</h2>
          <p className="text-gray-700 text-center mb-8">
            تم إضافة الشركة {addedCompanyName} بنجاح
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 w-full">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span>رجوع</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleAddAnother}
              className="flex-1 px-6 py-3 rounded-lg bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة شركة أخرى</span>
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Main modal
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Dark Blue */}
        <div className="bg-[#5A66C1] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-white" />
            <h2 className="text-xl font-semibold text-white">
              إضافة شركة للمندوب
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Search Section */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            البحث عن الشركة
          </h3>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث بالاسم أو كود الشركة..."
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A66C1] text-right"
              dir="rtl"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Companies List Section */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">
              الشركات المسجلة في المنصة
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">جاري التحميل...</div>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-gray-500 text-lg">
                {searchQuery ? "لا توجد نتائج" : "لا توجد شركات متاحة"}
              </div>
              {searchQuery && (
                <div className="text-gray-400 text-sm mt-2">
                  جرب البحث بكلمات مختلفة
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCompanies.map((company, index) => {
                // Use email for selection (unique identifier)
                // Use email field if available, otherwise use document ID (which is the email)
                const companyEmail = (company.email || company.id || "").toLowerCase().trim();
                const isSelected = selectedCompanyEmail !== null && 
                  selectedCompanyEmail.toLowerCase().trim() === companyEmail;
                const city =
                  company.formattedLocation?.address?.city ||
                  company.city ||
                  "-";
                const companyCode = company.refid || "-";

                const handleCompanyClick = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  e.preventDefault();
                  
                  // Use email field if available, otherwise use document ID (which is the email)
                  const companyEmail = company.email || company.id;
                  if (companyEmail) {
                    const clickedEmail = companyEmail.toLowerCase().trim();
                    // Only update if clicking a different company
                    if (selectedCompanyEmail?.toLowerCase().trim() !== clickedEmail) {
                      setSelectedCompanyEmail(companyEmail);
                    }
                  } else {
                    console.warn("Company has no email or ID:", company);
                  }
                };

                return (
                  <div
                    key={`company-${companyEmail || company.id || index}`}
                    onClick={handleCompanyClick}
                    onMouseDown={(e) => e.preventDefault()}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Radio Button */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-[#5A66C1] bg-[#5A66C1]"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    {/* Company Info */}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">
                        {company.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        کود: {companyCode} - {city}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Car className="w-4 h-4" />
                          <span>سيارات</span>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            company.isActive !== false
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {company.isActive !== false ? "نشطة" : "معطلة"}
                        </span>
                      </div>
                    </div>

                    {/* Company Icon/Logo */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        {company.logo ? (
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedCompanyEmail || isSubmitting}
            className="px-6 py-2 rounded-lg bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة الشركة</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

