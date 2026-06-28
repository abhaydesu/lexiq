import { useState, useEffect } from 'react';
import { Pencil, X } from 'lucide-react';

interface RenameDialogProps {
  isOpen: boolean;
  initialValue: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

export function RenameDialog({
  isOpen,
  initialValue,
  onConfirm,
  onCancel,
}: RenameDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <form 
        onSubmit={handleSubmit}
        className="relative bg-ink-bg border border-ink-border rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200"
      >
        <button 
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 text-ink-text-muted hover:text-ink-text transition-colors"
        >
          <X size={18} />
        </button>
        
        <div className="mb-6 mt-2">
          <h2 className="text-xl font-serif font-medium text-ink-text mb-2 flex items-center gap-2">
            <Pencil size={18} className="text-ink-accent" />
            Rename Book
          </h2>
          <p className="text-xs text-ink-text-muted leading-relaxed mb-4">
            Enter a new name for the book.
          </p>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-ink-surface border border-ink-border rounded-lg px-3 py-2 text-sm text-ink-text focus:outline-none focus:border-ink-accent transition-colors"
            placeholder="Book name"
            autoFocus
          />
        </div>
        
        <div className="flex items-center justify-end gap-3">
          <button 
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-ink-text-muted hover:text-ink-text transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={!value.trim()}
            className="px-4 py-2 text-sm font-medium bg-ink-text text-ink-bg hover:bg-ink-text/90 rounded-lg transition-colors disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
