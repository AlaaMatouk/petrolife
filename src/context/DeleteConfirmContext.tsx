import React, { createContext, useCallback, useContext, useState } from "react";
import { ConfirmDialog } from "../components/shared/ConfirmDialog/ConfirmDialog";

type ConfirmOptions = {
	title?: string;
	message?: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => Promise<void> | void;
};

type DeleteConfirmContextType = {
	confirmDelete: (opts: ConfirmOptions) => void;
};

const DeleteConfirmContext = createContext<DeleteConfirmContextType | undefined>(undefined);

export const useDeleteConfirm = (): DeleteConfirmContextType => {
	const ctx = useContext(DeleteConfirmContext);
	if (!ctx) {
		throw new Error("useDeleteConfirm must be used within DeleteConfirmProvider");
	}
	return ctx;
};

export const DeleteConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [open, setOpen] = useState(false);
	const [options, setOptions] = useState<ConfirmOptions | null>(null);
	const [busy, setBusy] = useState(false);

	const confirmDelete = useCallback((opts: ConfirmOptions) => {
		setOptions(opts);
		setOpen(true);
	}, []);

	const handleConfirm = async () => {
		if (!options || busy) return;
		try {
			setBusy(true);
			await options.onConfirm();
			setOpen(false);
			setOptions(null);
		} finally {
			setBusy(false);
		}
	};

	const handleCancel = () => {
		if (busy) return;
		setOpen(false);
		setOptions(null);
	};

	return (
		<DeleteConfirmContext.Provider value={{ confirmDelete }}>
			{children}
			<ConfirmDialog
				open={open}
				title={options?.title}
				message={options?.message}
				confirmText={busy ? "جاري الحذف..." : options?.confirmText}
				cancelText={options?.cancelText}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
			/>
		</DeleteConfirmContext.Provider>
	);
};


