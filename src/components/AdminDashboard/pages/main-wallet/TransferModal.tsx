import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Building2, Wallet as WalletIcon, CheckCircle } from "lucide-react";
import { ServiceProviderWallet } from "./MainWallet";
import { approveServiceDistributerTransfer } from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";
import { useAuth } from "../../../../hooks/useGlobalState";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../../config/firebase";

interface TransferModalProps {
  open: boolean;
  wallet: ServiceProviderWallet | null;
  transferRequestId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  open,
  wallet,
  transferRequestId,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [transferAmount, setTransferAmount] = useState("0.00");
  const [transferFullBalance, setTransferFullBalance] = useState(false);
  const [transferImage, setTransferImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open || !wallet) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ar-SA").format(num);
  };

  const handleFullBalanceToggle = () => {
    setTransferFullBalance(!transferFullBalance);
    if (!transferFullBalance) {
      setTransferAmount(wallet.availableBalance.toFixed(2));
    } else {
      setTransferAmount("0.00");
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setTransferAmount(value);
    setTransferFullBalance(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          type: "error",
          message: "حجم الملف يجب أن يكون أقل من 5 ميجابايت",
          duration: 3000,
        });
        return;
      }
      setTransferImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          type: "error",
          message: "حجم الملف يجب أن يكون أقل من 5 ميجابايت",
          duration: 3000,
        });
        return;
      }
      setTransferImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `transfer-receipts/${wallet.id}/${timestamp}-${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleConfirm = async () => {
    const amount = parseFloat(transferAmount);
    
    if (amount <= 0) {
      addToast({
        type: "error",
        message: "يرجى إدخال مبلغ صحيح",
        duration: 3000,
      });
      return;
    }

    if (amount > wallet.availableBalance) {
      addToast({
        type: "error",
        message: "المبلغ المدخل أكبر من الرصيد المتاح",
        duration: 3000,
      });
      return;
    }

    if (!transferRequestId) {
      addToast({
        type: "error",
        message: "معرف طلب التحويل غير موجود",
        duration: 3000,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload image if provided
      let imageUrl: string | undefined;
      if (transferImage) {
        imageUrl = await uploadImageToStorage(transferImage);
      }

      // Get admin user info
      if (!user) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      const adminUser = {
        uid: user.id || user.uid || "",
        email: user.email || "",
        name: user.name || user.email || "Admin",
      };

      // Approve the transfer request
      await approveServiceDistributerTransfer(transferRequestId, adminUser);

      // Update transfer with image and notes if provided
      if (imageUrl || notes) {
        const { doc, updateDoc } = await import("firebase/firestore");
        const { db } = await import("../../../../config/firebase");
        const transferRef = doc(db, "service-distributer-transfers", transferRequestId);
        await updateDoc(transferRef, {
          ...(imageUrl && { bankReceiptImageUrl: imageUrl }),
          ...(notes && { notes }),
        });
      }

      addToast({
        type: "success",
        message: "تم تأكيد التحويل بنجاح",
        duration: 3000,
      });

      // Reset form
      setTransferAmount("0.00");
      setTransferFullBalance(false);
      setTransferImage(null);
      setImagePreview(null);
      setNotes("");

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error confirming transfer:", error);
      addToast({
        type: "error",
        message: error.message || "حدث خطأ أثناء تأكيد التحويل",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const transferFees = 0; // No fees for now
  const total = parseFloat(transferAmount) + transferFees;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div
        dir="rtl"
        className="fixed top-1/2 left-1/2 z-50 w-full max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1e3a8a] text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-white/80">التحويل إلى</p>
              <p className="text-lg font-semibold">{wallet.providerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Wallet Information */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WalletIcon className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">رقم المحفظة</p>
                <p className="font-medium text-gray-900">{wallet.walletNumber}</p>
                <p className="text-sm text-gray-600 mt-1">الرصيد المتاح</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold text-green-600">
                {formatNumber(wallet.availableBalance)} ر.س
              </p>
            </div>
          </div>

          {/* Transfer Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              المبلغ المراد تحويله
            </label>
            <div className="relative">
              <input
                type="text"
                value={transferAmount}
                onChange={handleAmountChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-right text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                disabled={transferFullBalance}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                ر.س
              </span>
            </div>
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={transferFullBalance}
                onChange={handleFullBalanceToggle}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">تحويل كامل الرصيد</span>
            </label>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              إرفاق صورة التحويل (اختياري)
            </label>
            <label
              htmlFor="transfer-receipt-upload"
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors block"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                id="transfer-receipt-upload"
                type="file"
                accept="image/*,.pdf"
                onChange={handleImageUpload}
                className="hidden"
              />
              {imagePreview ? (
                <div className="space-y-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTransferImage(null);
                      setImagePreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    إزالة الصورة
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    اضغط لرفع الصورة أو اسحبها هنا
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF 5 MB</p>
                </div>
              )}
            </label>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              ملاحظات إضافية (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="أضف أي ملاحظات أو تفاصيل إضافية..."
            />
          </div>

          {/* Transfer Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">ملخص التحويل</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">المبلغ المحول</span>
                <span className="font-medium text-gray-900">
                  {formatNumber(parseFloat(transferAmount) || 0)} ر.س
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">رسوم التحويل</span>
                <span className="font-medium text-gray-900">
                  {formatNumber(transferFees)} ر.س
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                <span className="font-semibold text-gray-900">الإجمالي</span>
                <span className="font-bold text-lg text-gray-900">
                  {formatNumber(total)} ر.س
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || parseFloat(transferAmount) <= 0}
            className="flex items-center gap-2 px-6 py-3 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#1e3a8a]/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري التحويل...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                تأكيد التحويل
              </>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

