import { Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div 
        className="relative bg-ink-bg border border-ink-border rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-ink-text-muted hover:text-ink-text transition-colors"
        >
          <X size={18} />
        </button>
        
        <div className="mb-6 mt-2">
          <h2 className="text-xl font-serif font-medium text-ink-text mb-2">
            {title}
          </h2>
          <p className="text-sm text-ink-text-muted leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="flex items-center justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-ink-text-muted hover:text-ink-text transition-colors"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
