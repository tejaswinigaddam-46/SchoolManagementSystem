/**
 * Professional Badge Component
 * Reusable badge with multiple variants and colors
 */

export default function Badge({ 
  children, 
  variant = 'default', 
  color = 'secondary',
  size = 'default',
  className = '' 
}) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    default: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  }

  // Define colors for each variant
  const colorMap = {
    primary: {
      default: 'bg-primary-100 text-primary-800',
      soft: 'bg-primary-50 text-primary-700 border border-primary-100',
      solid: 'bg-primary-600 text-white',
      outline: 'border border-primary-300 text-primary-700'
    },
    secondary: {
      default: 'bg-secondary-100 text-secondary-800',
      soft: 'bg-secondary-50 text-secondary-700 border border-secondary-100',
      solid: 'bg-secondary-600 text-white',
      outline: 'border border-secondary-300 text-secondary-700'
    },
    success: {
      default: 'bg-success-100 text-success-800',
      soft: 'bg-success-50 text-success-700 border border-success-100',
      solid: 'bg-success-600 text-white',
      outline: 'border border-success-300 text-success-700'
    },
    warning: {
      default: 'bg-warning-100 text-warning-800',
      soft: 'bg-warning-50 text-warning-700 border border-warning-100',
      solid: 'bg-warning-600 text-white',
      outline: 'border border-warning-300 text-warning-700'
    },
    error: {
      default: 'bg-error-100 text-error-800',
      soft: 'bg-error-50 text-error-700 border border-error-100',
      solid: 'bg-error-600 text-white',
      outline: 'border border-error-300 text-error-700'
    },
    accent: {
      default: 'bg-accent-100 text-accent-800',
      soft: 'bg-accent-50 text-accent-700 border border-accent-100',
      solid: 'bg-accent-600 text-white',
      outline: 'border border-accent-300 text-accent-700'
    }
  }

  // Fallback if variant or color is missing
  const selectedColor = colorMap[color] || colorMap.secondary;
  const variantClass = selectedColor[variant] || selectedColor.default;

  const classes = `${baseClasses} ${sizeClasses[size] || sizeClasses.default} ${variantClass} ${className}`

  return (
    <span className={classes}>
      {children}
    </span>
  )
}
