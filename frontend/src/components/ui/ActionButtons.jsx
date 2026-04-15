import React, { useState } from 'react';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';

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
 * Reusable Delete Button component with built-in confirmation
 */
export const DeleteButton = ({ 
  onClick, 
  isDeleting = false, 
  title = "Delete", 
  className = "", 
  disabled = false,
  iconSize = "h-4 w-4",
  confirmTitle = "Confirm Delete",
  confirmMessage = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  requireConfirmation = true,
  ...props 
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (requireConfirmation) {
      setShowConfirm(true);
    } else {
      onClick();
    }
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onClick();
  };

  return (
    <>
      <button
        onClick={handleClick}
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

      {requireConfirmation && (
        <ConfirmationDialog
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
          title={confirmTitle}
          message={confirmMessage}
          confirmText={confirmText}
          cancelText={cancelText}
          variant={variant}
          isLoading={isDeleting}
        />
      )}
    </>
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
