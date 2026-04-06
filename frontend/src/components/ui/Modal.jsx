import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useLayout } from '../../contexts/LayoutContext'

/**
 * Professional Modal Component
 * Reusable modal with professional styling and accessibility features
 */
export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'default',
  closeOnBackdrop = true,
  showCloseButton = true,
  className = ''
}) {
  const { isIconNavigation } = useLayout()

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Handle body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    default: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl',
    full: 'max-w-full mx-4'
  }

  // Dynamic classes based on sidebar state
  const modalContainerClasses = `
    fixed inset-0 z-[99999] flex items-center justify-center p-4
    ${isIconNavigation ? 'lg:pl-20' : 'lg:pl-72'}
    transition-all duration-300 ease-in-out
  `

  return (
    <div className={modalContainerClasses}>
      {/* Backdrop with higher z-index */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 z-[99998]"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      
      {/* Modal with highest z-index */}
      <div 
        className={`
          relative w-full ${sizeClasses[size]} 
          bg-white rounded-2xl shadow-2xl border border-secondary-200/50
          transform transition-all duration-300 scale-100 opacity-100
          max-h-[85vh] overflow-hidden flex flex-col
          z-[99999]
          ${className}
        `}
        style={{
          animation: isOpen ? 'modalSlideIn 0.3s ease-out' : undefined
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-secondary-200 bg-white rounded-t-2xl">
            {title && (
              <h3 className="text-xl font-bold text-secondary-900">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${title || showCloseButton ? '' : 'p-6'}`}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* UNUSED CODE - Modal component exports not being used anywhere in the codebase
/**
 * Modal Actions Component
 * Pre-styled action buttons for modal footers
 */
/*
export function ModalActions({ children, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-secondary-200 ${className}`}>
      {children}
    </div>
  )
}
*/

/* UNUSED CODE - Modal body component not being used
/**
 * Modal Body Component
 * Content wrapper with consistent spacing
 */
/*
export function ModalBody({ children, className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
    </div>
  )
}
*/

