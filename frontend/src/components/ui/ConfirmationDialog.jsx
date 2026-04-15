import { AlertTriangle, X } from 'lucide-react'

/**
 * Confirmation Dialog Component
 * A custom confirmation dialog to replace browser alerts
 */
export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // danger, warning, info
  isLoading = false
}) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: 'text-error-600',
      iconBg: 'bg-error-100',
      button: 'bg-error-600 hover:bg-error-700 text-white'
    },
    warning: {
      icon: 'text-warning-600',
      iconBg: 'bg-warning-100',
      button: 'bg-warning-600 hover:bg-warning-700 text-white'
    },
    info: {
      icon: 'text-primary-600',
      iconBg: 'bg-primary-100',
      button: 'bg-primary-600 hover:bg-primary-700 text-white'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-secondary-200 max-w-md w-full mx-4 transform transition-all duration-200 scale-100">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center`}>
            <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 text-center">
            <h3 className="text-lg font-semibold text-secondary-900 mb-2 ">
              {title}
            </h3>
            <div className="text-sm text-secondary-600 break-words whitespace-pre-wrap">
              {message}
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 p-6 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:opacity-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors ${styles.button} focus:ring-${variant === 'danger' ? 'error' : variant === 'warning' ? 'warning' : 'primary'}-500`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}