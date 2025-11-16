import React from "react";
import { createPortal } from "react-dom";
import { AlertCircle } from "lucide-react";

interface ConfirmDialogProps {
	open: boolean;
	title?: string;
	message?: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
	open,
	title = "تأكيد الحذف",
	message = "هل أنت متأكد من عملية الحذف؟ لا يمكن التراجع عن هذا الإجراء.",
	confirmText = "حذف",
	cancelText = "إلغاء",
	onConfirm,
	onCancel,
}) => {
	if (!open) return null;

	return createPortal(
		<>
			<div className="fixed inset-0 bg-black/50 z-50" onClick={onCancel} />
			<div
				dir="rtl"
				className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex justify-center mb-4">
					<div className="w-16 h-16 rounded-full bg-pink-50 border-2 border-red-300 flex items-center justify-center">
						<AlertCircle className="w-8 h-8 text-red-500" />
					</div>
				</div>

				<h2 className="text-xl font-semibold text-gray-900 text-center mb-3">
					{title}
				</h2>
				<p className="text-sm text-gray-600 text-center mb-6">
					{message}
				</p>

				<div className="flex items-center justify-center gap-3">
					<button
						onClick={onCancel}
						className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
					>
						{cancelText}
					</button>
					<button
						onClick={onConfirm}
						className="px-6 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors font-medium"
					>
						{confirmText}
					</button>
				</div>
			</div>
		</>,
		document.body
	);
};


