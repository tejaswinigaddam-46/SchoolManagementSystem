import { Edit, Trash2, Loader2 } from 'lucide-react';

/**
 * Reusable Edit Button component
 */
export const EditButton = ({ 
  onClick, 
  title = "Edit", 
  className = "", 
  disabled = false,
  iconSize = "h-4 w-4",
  ...props 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 text-primary-900 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={title}
      type="button"
      {...props}
    >
      <Edit className={iconSize} />
    </button>
  );
};

/**
 * Reusable Delete Button component
 */
export const DeleteButton = ({ 
  onClick, 
  isDeleting = false, 
  title = "Delete", 
  className = "", 
  disabled = false,
  iconSize = "h-4 w-4",
  ...props 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isDeleting}
      className={`p-2 text-error-500 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={title}
      type="button"
      {...props}
    >
      {isDeleting ? (
        <Loader2 className={`${iconSize} animate-spin`} />
      ) : (
        <Trash2 className={iconSize} />
      )}
    </button>
  );
};

/**
 * A container for grouping action buttons
 */
export const ActionButtonGroup = ({ children, className = "" }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {children}
    </div>
  );
};
