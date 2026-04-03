import { useUiStore } from '@/store/ui.store';
import { X } from 'lucide-react';

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const removeToast = useUiStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            t.type === 'success'
              ? 'flex items-center justify-between gap-3 rounded-lg bg-green-600 px-4 py-3 text-sm text-white shadow-lg'
              : 'flex items-center justify-between gap-3 rounded-lg bg-red-600 px-4 py-3 text-sm text-white shadow-lg'
          }
          role="status"
        >
          <span>{t.message}</span>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="rounded p-0.5 hover:bg-white/20"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
