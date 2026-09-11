import { X } from "lucide-react";

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation">
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <h2 id="confirm-modal-title" className="text-lg font-semibold text-slate-950">{title}</h2>
            <p id="confirm-modal-message" className="mt-2 text-sm text-slate-600">{message}</p>
          </div>
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-700" aria-label="Close confirmation dialog">
            <X size={20} />
          </button>
        </div>
        <div className="flex justify-end gap-3 p-5">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}