/**
 * Professional Card Component
 * Reusable card with consistent styling and variants
 */
export default function Card({ 
  children, 
  className = '', 
  variant = 'default',
  hover = false,
  onClick = null
}) {
  const baseClasses = 'bg-white rounded-2xl shadow-soft border border-secondary-100'
  
  const variantClasses = {
    default: '',
    elevated: 'shadow-medium',
    bordered: 'border-2',
    gradient: 'bg-gradient-to-br from-white to-secondary-50'
  }

  const hoverClasses = hover ? 'hover:shadow-medium hover:-translate-y-1 transition-all duration-300' : ''
  const clickableClasses = onClick ? 'cursor-pointer' : ''

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

/* UNUSED CODE - Card component sub-components not being used anywhere in the codebase
/**
 * Card Header Component
 */
/*
export function CardHeader({ children, className = '' }) {
  return (
    <div className={`p-6 border-b border-secondary-100 ${className}`}>
      {children}
    </div>
  )
}
*/

/* UNUSED CODE - Card body component not being used
/**
 * Card Body Component
 */
/*
export function CardBody({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}
*/

/* UNUSED CODE - Card footer component not being used
/**
 * Card Footer Component
 */
/*
export function CardFooter({ children, className = '' }) {
  return (
    <div className={`p-6 border-t border-secondary-100 ${className}`}>
      {children}
    </div>
  )
}
*/

/* UNUSED CODE - Card actions component not being used
/**
 * Card Actions Component
 */
/*
export function CardActions({ children, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {children}
    </div>
  )
}
*/

