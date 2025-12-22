import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeft, User, Banknote, Phone, CircleAlert, CheckCircle } from "lucide-react";
import { useAuth } from "../../hooks/useGlobalState";
import { useToast } from "../../context/ToastContext";
import { ROUTES } from "../../constants/routes";
import { findCompanyByPhoneNumber, submitCompanyTransferRequest, fetchCompanyTransfersForCompany, fetchCurrentCompany } from "../../services/firestore";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog/ConfirmDialog";

export const TransferMoney = (): JSX.Element => {
  const navigate = useNavigate();
  const { company } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    recipientName: "",
    phoneNumber: "",
    amount: "0.00",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);
  const [foundCompany, setFoundCompany] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format number with thousands separator
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const walletBalance = company?.balance || 0;

  // Fetch company transfers on mount and after submission
  useEffect(() => {
    const loadTransfers = async () => {
      setIsLoadingTransfers(true);
      try {
        // Use company from context or fetch it
        const companyId = company?.id;
        const companyEmail = company?.email;
        
        if (companyId || companyEmail) {
          const companyTransfers = await fetchCompanyTransfersForCompany(
            companyId,
            companyEmail
          );
          setTransfers(companyTransfers);
        } else {
          // Fallback: fetch current company
          const currentCompany = await fetchCurrentCompany();
          if (currentCompany) {
            const companyTransfers = await fetchCompanyTransfersForCompany(
              currentCompany.id || currentCompany.email,
              currentCompany.email
            );
            setTransfers(companyTransfers);
          }
        }
      } catch (error) {
        console.error('Error loading transfers:', error);
      } finally {
        setIsLoadingTransfers(false);
      }
    };

    loadTransfers();
  }, [company, isSubmitting]);

  // Search for company when phone number changes (debounced)
  useEffect(() => {
    const searchCompany = async () => {
      const phoneValue = formData.phoneNumber.trim();
      if (phoneValue.length >= 8) {
        setIsSearchingCompany(true);
        try {
          // Search with the phone number as entered (supports +966 56 190 4021 format)
          const company = await findCompanyByPhoneNumber(phoneValue);
          if (company) {
            setFoundCompany({
              id: company.id,
              name: company.name,
              email: company.email,
            });
            // Auto-fill recipient name if empty
            if (!formData.recipientName.trim()) {
              setFormData(prev => ({ ...prev, recipientName: company.name }));
            }
          } else {
            setFoundCompany(null);
          }
        } catch (error) {
          console.error('Error searching company:', error);
          setFoundCompany(null);
        } finally {
          setIsSearchingCompany(false);
        }
      } else {
        setFoundCompany(null);
      }
    };

    const timeoutId = setTimeout(searchCompany, 500); // Debounce 500ms
    return () => clearTimeout(timeoutId);
  }, [formData.phoneNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.recipientName.trim()) {
      addToast({
        title: 'خطأ في البيانات',
        message: 'يرجى إدخال اسم المستقبل',
        type: 'error',
      });
      return;
    }

    if (!formData.phoneNumber.trim()) {
      addToast({
        title: 'خطأ في البيانات',
        message: 'يرجى إدخال رقم الجوال',
        type: 'error',
      });
      return;
    }

    // Validate company exists
    if (!foundCompany) {
      addToast({
        title: 'خطأ في البيانات',
        message: 'الشركة المستقبلة غير موجودة. يرجى التحقق من رقم الجوال',
        type: 'error',
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      addToast({
        title: 'خطأ في المبلغ',
        message: 'يرجى إدخال مبلغ صحيح',
        type: 'error',
      });
      return;
    }

    if (amount > walletBalance) {
      addToast({
        title: 'خطأ في المبلغ',
        message: `المبلغ المدخل يتجاوز الرصيد المتاح (${formatNumber(walletBalance)} ر.س)`,
        type: 'error',
      });
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmTransfer = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    
    const amount = parseFloat(formData.amount);
    
    try {
      // Submit transfer - money is transferred immediately
      await submitCompanyTransferRequest({
        recipientPhoneNumber: formData.phoneNumber.trim(),
        recipientName: formData.recipientName,
        amount: amount,
      });
      
      addToast({
        title: 'نجح التحويل',
        message: `تم تحويل ${formatNumber(amount)} ر.س إلى ${formData.recipientName} بنجاح.`,
        type: 'success',
      });
      
      // Reset form
      setFormData({
        recipientName: "",
        phoneNumber: "",
        amount: "0.00",
      });
      setFoundCompany(null);
      
      // Refresh transfers table
      const currentCompany = await fetchCurrentCompany();
      if (currentCompany) {
        const companyTransfers = await fetchCompanyTransfersForCompany(
          currentCompany.id || currentCompany.email,
          currentCompany.email
        );
        setTransfers(companyTransfers);
      }
      
      // Navigate back to wallet after 2 seconds
      setTimeout(() => {
        navigate(ROUTES.WALLET);
      }, 2000);
      
    } catch (error: any) {
      console.error('Transfer error:', error);
      addToast({
        title: 'فشل التحويل',
        message: error.message || 'حدث خطأ أثناء تحويل الأموال',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.WALLET);
  };

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto gap-6 pb-8">
      {/* Balance Banner Section */}
      <div className="flex-1 bg-color-mode-surface-primary-blue rounded-xl border border-color-mode-text-icons-t-placeholder p-6 relative overflow-hidden text-white" style={{
        background: 'linear-gradient(135deg, #4F5BB3 0%, #5A66C1 100%)',
        position: 'relative'
      }}>
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20,20 Q30,10 40,20 T60,20 T80,20' stroke='white' stroke-width='0.5' fill='none' opacity='0.3'/%3E%3Cpath d='M10,40 Q20,30 30,40 T50,40 T70,40 T90,40' stroke='white' stroke-width='0.3' fill='none' opacity='0.2'/%3E%3Cpath d='M0,60 Q10,50 20,60 T40,60 T60,60 T80,60 T100,60' stroke='white' stroke-width='0.4' fill='none' opacity='0.25'/%3E%3Cpath d='M15,80 Q25,70 35,80 T55,80 T75,80 T95,80' stroke='white' stroke-width='0.3' fill='none' opacity='0.2'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          backgroundPosition: 'bottom left',
          backgroundRepeat: 'repeat'
        }}></div>
        
        {/* Paper money illustration */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <img 
            src="/img/paper-money-or-dollar-bills-and-blue-credit-card-3d-illustration.png" 
            alt="Paper money and credit card illustration"
            className="w-64 h-64 object-contain opacity-90"
          />
        </div>
        
        <div className="flex flex-col items-end text-right relative z-10">
          <h3 className="text-lg mb-2">الرصيد الحالي</h3>
          <p className="text-4xl font-bold mb-2">
            <span className="text-base">ريال</span> {formatNumber(walletBalance)}
          </p>
          <p className="text-base opacity-90">متاح لتحويل</p>
        </div>
      </div>

      {/* Transfer Details Form Section */}
      <div className="bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder p-8">
        <h2 className="text-xl font-semibold text-color-mode-text-icons-t-sec mb-6 [direction:rtl] text-right">
          بيانات التحويل
        </h2>

        {/* Security Warning Banner */}
        <div className="mb-6 p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: '#FFF4E6' }}>
          <div className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: '#FF6B35' }}>
            <CircleAlert className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 [direction:rtl] text-right">
            <p className="font-semibold text-sm mb-1" style={{ color: '#FF6B35' }}>
              تنبيه امني
            </p>
            <p className="text-sm" style={{ color: '#8B4513' }}>
              تاكد من صحة بيانات المستقبل قبل اتمام التحويلات محميه باعلي معايير الامان
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Recipient Name */}
          <div className="flex flex-col gap-2 [direction:rtl]">
            <label className="text-sm font-medium text-color-mode-text-icons-t-sec text-right">
              اسم الشخص او الشركة المراد التحويل اليه
            </label>
            <div className="relative">
              <input
                type="text"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleInputChange}
                placeholder="ادخل اسم المستقبل"
                required
                className="w-full px-4 py-3 pr-12 bg-white border border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] text-right [direction:rtl] focus:outline-none focus:border-color-mode-text-icons-t-blue"
              />
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-2 [direction:rtl]">
            <label className="text-sm font-medium text-color-mode-text-icons-t-sec text-right">
              رقم الجوال
            </label>
            <div className="relative">
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => {
                  // Allow +, digits, and spaces for international format like "+966 56 190 4021"
                  let value = e.target.value;
                  // Keep +, digits, and spaces only
                  value = value.replace(/[^\d\s\+]/g, '');
                  // Auto-format: if starts with +966, format as "+966 XX XXX XXXX"
                  if (value.startsWith('+966')) {
                    const afterCode = value.substring(5).replace(/\s/g, '');
                    if (afterCode.length <= 2) {
                      value = `+966 ${afterCode}`;
                    } else if (afterCode.length <= 5) {
                      value = `+966 ${afterCode.substring(0, 2)} ${afterCode.substring(2)}`;
                    } else {
                      value = `+966 ${afterCode.substring(0, 2)} ${afterCode.substring(2, 5)} ${afterCode.substring(5, 9)}`;
                    }
                  }
                  setFormData(prev => ({ ...prev, phoneNumber: value }));
                  setFoundCompany(null); // Reset found company when phone changes
                }}
                placeholder="+966 56 190 4021"
                required
                maxLength={18}
                className="w-full px-4 py-3 pr-12 bg-white border border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] text-right [direction:rtl] focus:outline-none focus:border-color-mode-text-icons-t-blue"
              />
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {/* Company search status */}
            {isSearchingCompany && (
              <p className="text-xs text-color-mode-text-icons-t-sec text-right">
                جاري البحث عن الشركة...
              </p>
            )}
            {foundCompany && !isSearchingCompany && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-right">تم العثور على: {foundCompany.name}</span>
              </div>
            )}
            {formData.phoneNumber.replace(/[\s\+]/g, '').length >= 8 && !foundCompany && !isSearchingCompany && (
              <p className="text-xs text-red-500 text-right">
                الشركة غير موجودة. يرجى التحقق من رقم الجوال
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-2 [direction:rtl]">
            <label className="text-sm font-medium text-color-mode-text-icons-t-sec text-right">
              المبلغ المراد تحويله
            </label>
            <div className="relative">
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                onFocus={(e) => {
                  if (e.target.value === "0.00" || e.target.value === "0") {
                    e.target.value = "";
                    setFormData(prev => ({ ...prev, amount: "" }));
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === "" || e.target.value === "0") {
                    setFormData(prev => ({ ...prev, amount: "0.00" }));
                  }
                }}
                placeholder="0.00"
                required
                min="0"
                step="0.01"
                max={walletBalance}
                className="w-full px-4 py-3 pr-20 pl-4 bg-white border border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] text-right [direction:rtl] focus:outline-none focus:border-color-mode-text-icons-t-blue"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-color-mode-text-icons-t-sec text-sm pointer-events-none">
                ريال
              </span>
              <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-xs text-color-mode-text-icons-t-sec text-right">
              الحد الاقصي {formatNumber(walletBalance)} ريال
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-[var(--corner-radius-small)] bg-color-mode-text-icons-t-blue text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              style={{ backgroundColor: '#5A66C1' }}
            >
              {isSubmitting ? 'جاري التحويل...' : 'تحويل الان'}
            </button>
          </div>
        </form>
      </div>

      {/* Transfers History Table */}
      <div className="bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder p-8">
        <h2 className="text-xl font-semibold text-color-mode-text-icons-t-sec mb-6 [direction:rtl] text-right">
          سجل التحويلات
        </h2>

        {isLoadingTransfers ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-color-mode-text-icons-t-sec">جاري التحميل...</p>
          </div>
        ) : transfers.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-color-mode-text-icons-t-sec">لا توجد تحويلات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 [direction:rtl]">
                    الحالة
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 [direction:rtl]">
                    المبلغ
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 [direction:rtl]">
                    من الشركة
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 [direction:rtl]">
                    إلى الشركة
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 [direction:rtl]">
                    التاريخ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transfers.map((transfer) => {
                  const requestDate = transfer.requestDate?.toDate
                    ? transfer.requestDate.toDate().toLocaleDateString("ar-SA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : transfer.requestDate
                    ? new Date(transfer.requestDate).toLocaleDateString("ar-SA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-";

                  const isSent = transfer.companyId === company?.id || 
                                 transfer.fromCompany?.email === company?.email ||
                                 transfer.createdUserId === company?.email;

                  return (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transfer.status === "completed" || transfer.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : transfer.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {transfer.status === "completed"
                            ? "مكتمل"
                            : transfer.status === "approved"
                            ? "موافق عليه"
                            : transfer.status === "rejected"
                            ? "مرفوض"
                            : "قيد الانتظار"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right [direction:rtl]">
                        <span className={isSent ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                          {isSent ? "-" : "+"} {new Intl.NumberFormat("ar-SA").format(transfer.amount || 0)} ر.س
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right [direction:rtl]">
                        {transfer.fromCompany?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right [direction:rtl]">
                        {transfer.toCompany?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right [direction:rtl]">
                        {requestDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        title="تأكيد التحويل"
        message={`هل أنت متأكد من تحويل ${formatNumber(parseFloat(formData.amount) || 0)} ر.س إلى ${formData.recipientName}؟\n\nسيتم خصم المبلغ من رصيدك فوراً وإضافته إلى رصيد الشركة المستقبلة.`}
        confirmText="تأكيد التحويل"
        cancelText="إلغاء"
        onConfirm={handleConfirmTransfer}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
};


