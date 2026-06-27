import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmDialog
 * A modal confirmation dialog for destructive actions.
 *
 * Props:
 *   open      - boolean
 *   title     - string
 *   message   - string
 *   confirmLabel - string (default 'Confirm')
 *   danger    - boolean (makes confirm button red)
 *   onConfirm - () => void
 *   onCancel  - () => void
 *   loading   - boolean
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[fadeIn_0.15s_ease]">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 text-slate-500 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            danger ? 'bg-red-900/40' : 'bg-yellow-900/40'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-yellow-400'}`} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 mb-1">{title}</h3>
            <p className="text-sm text-slate-400">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary py-2 px-4 text-sm" disabled={loading}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`btn py-2 px-4 text-sm ${danger ? 'btn-danger' : 'btn-primary'}`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing…
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
