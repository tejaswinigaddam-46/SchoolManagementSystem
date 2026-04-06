import { clsx } from 'clsx'

/**
 * Loading Spinner Component
 * Displays animated loading indicator
 */
export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary', 
  className = '',
  text = null,
  centered = false
}) {
  const sizeClasses = {
    xs: 'w-3 h-3 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-12 h-12 border-4',
    '2xl': 'w-16 h-16 border-4'
  }

  const colorClasses = {
    primary: 'border-primary-200 border-t-primary-600',
    secondary: 'border-secondary-200 border-t-secondary-600',
    success: 'border-success-200 border-t-success-600',
    warning: 'border-warning-200 border-t-warning-600',
    error: 'border-error-200 border-t-error-600',
    white: 'border-gray-300 border-t-white'
  }

  const spinnerClasses = clsx(
    'animate-spin rounded-full',
    sizeClasses[size],
    colorClasses[color],
    className
  )

  const containerClasses = clsx(
    'inline-flex flex-col items-center gap-2',
    {
      'justify-center min-h-screen': centered
    }
  )

  return (
    <div className={containerClasses}>
      <div className={spinnerClasses} role="status" aria-label="Loading">
        <span className="sr-only">Loading...</span>
      </div>
      {text && (
        <p className="text-sm text-secondary-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}

/**
 * Page Loading Spinner
 * Full page loading indicator
 */
export function PageLoading({ text = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <LoadingSpinner size="xl" text={text} />
    </div>
  )
}

/**
 * Button Loading Spinner
 * Small spinner for buttons
 */
export function ButtonLoading({ size = 'sm', color = 'white' }) {
  return <LoadingSpinner size={size} color={color} />
}

/**
 * Table Loading Spinner
 * Loading state for tables
 */
export function TableLoading({ rows = 5, columns = 4 }) {
  return (
    <div className="animate-pulse">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 py-4">
          {[...Array(columns)].map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-secondary-200 rounded flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Card Loading Spinner
 * Loading state for cards
 */
export function CardLoading() {
  return (
    <div className="card animate-pulse">
      <div className="card-header">
        <div className="h-6 bg-secondary-200 rounded w-1/3" />
      </div>
      <div className="card-body space-y-4">
        <div className="h-4 bg-secondary-200 rounded w-3/4" />
        <div className="h-4 bg-secondary-200 rounded w-1/2" />
        <div className="h-4 bg-secondary-200 rounded w-5/6" />
      </div>
    </div>
  )
}
