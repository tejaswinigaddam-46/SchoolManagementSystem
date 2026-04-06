/* UNUSED CODE - Badge component not being imported or used anywhere in the codebase
// The badge styling is being done through CSS classes instead of this component

/**
 * Professional Badge Component
 * Reusable badge with multiple variants and colors
 */
/*
export default function Badge({ 
  children, 
  variant = 'default', 
  color = 'secondary',
  size = 'default',
  className = '' 
}) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    default: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const variantClasses = {
    default: {
      primary: 'bg-primary-100 text-primary-800',
      secondary: 'bg-secondary-100 text-secondary-800',
      success: 'bg-success-100 text-success-800',
      warning: 'bg-warning-100 text-warning-800',
      error: 'bg-error-100 text-error-800',
      accent: 'bg-accent-100 text-accent-800',
      pink: 'bg-pink-100 text-pink-800'
    },
    solid: {
      primary: 'bg-primary-600 text-white',
      secondary: 'bg-secondary-600 text-white',
      success: 'bg-success-600 text-white',
      warning: 'bg-warning-600 text-white',
      error: 'bg-error-600 text-white',
      accent: 'bg-accent-600 text-white',
      pink: 'bg-pink-600 text-white'
    },
    outline: {
      primary: 'border border-primary-300 text-primary-700',
      secondary: 'border border-secondary-300 text-secondary-700',
      success: 'border border-success-300 text-success-700',
      warning: 'border border-warning-300 text-warning-700',
      error: 'border border-error-300 text-error-700',
      accent: 'border border-accent-300 text-accent-700',
      pink: 'border border-pink-300 text-pink-700'
    }
  }

  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant][color]} ${className}`

  return (
    <span className={classes}>
      {children}
    </span>
  )
}
*/

