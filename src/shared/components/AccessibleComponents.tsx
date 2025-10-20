import React, { forwardRef, useRef, useEffect, useState, ReactNode } from 'react';
import { useAccessibility } from '../utils/accessibility';
import { useAnimations } from '../utils/animations';

// Accessible Button Component
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, loadingText, children, className = '', disabled, ...props }, ref) => {
    const { prefersReducedMotion } = useAccessibility();
    
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    const animationClasses = prefersReducedMotion() ? '' : 'btn-animate';
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${animationClasses} ${className}`;
    
    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span className={loading ? 'sr-only' : ''}>
          {loading ? loadingText || 'Loading...' : children}
        </span>
        {loading && <span aria-hidden="true">{loadingText || 'Loading...'}</span>}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

// Accessible Input Component
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  showLabel?: boolean;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, error, helpText, showLabel = true, className = '', ...props }, ref) => {
    const { generateId } = useAccessibility();
    const [fieldId] = useState(() => generateId('input'));
    const [errorId] = useState(() => generateId('error'));
    const [helpId] = useState(() => generateId('help'));
    
    const describedBy = [
      helpText ? helpId : null,
      error ? errorId : null
    ].filter(Boolean).join(' ') || undefined;
    
    return (
      <div className="space-y-1">
        <label
          htmlFor={fieldId}
          className={`block text-sm font-medium text-gray-700 ${showLabel ? '' : 'sr-only'}`}
        >
          {label}
          {props.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
        
        <input
          ref={ref}
          id={fieldId}
          className={`
            block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500
            ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          {...props}
        />
        
        {helpText && (
          <p id={helpId} className="text-sm text-gray-600">
            {helpText}
          </p>
        )}
        
        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

// Accessible Modal Component
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  const { trapFocus, addKeyboardNavigation, announce, prefersReducedMotion } = useAccessibility();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }
      
      // Announce modal opening
      announce(`${title} dialog opened`);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Set up focus trap and keyboard navigation
      const cleanupFocusTrap = modalRef.current ? trapFocus(modalRef.current) : () => {};
      const cleanupKeyboard = modalRef.current ? addKeyboardNavigation(modalRef.current, {
        escapeKey: true,
        onEscape: onClose
      }) : () => {};
      
      return () => {
        cleanupFocusTrap();
        cleanupKeyboard();
        document.body.style.overflow = '';
        
        // Return focus to previous element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
        
        announce(`${title} dialog closed`);
      };
    }
  }, [isOpen, title, onClose, trapFocus, addKeyboardNavigation, announce]);
  
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  const animationClass = prefersReducedMotion() ? '' : 'animate-scale-in';
  
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div
          ref={modalRef}
          className={`
            inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all
            sm:my-8 sm:align-middle sm:w-full ${sizeClasses[size]} ${animationClass}
          `}
          tabIndex={-1}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3
                  id="modal-title"
                  className="text-lg leading-6 font-medium text-gray-900 mb-4"
                >
                  {title}
                </h3>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Accessible Notification Component
interface AccessibleNotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const AccessibleNotification: React.FC<AccessibleNotificationProps> = ({
  type,
  title,
  message,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  const { announce, prefersReducedMotion } = useAccessibility();
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Announce notification
    const announcement = `${type} notification: ${title}${message ? `. ${message}` : ''}`;
    announce(announcement, type === 'error' ? 'assertive' : 'polite');
    
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for exit animation
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [type, title, message, autoClose, duration, announce, onClose]);
  
  if (!isVisible) return null;
  
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  
  const animationClass = prefersReducedMotion() ? '' : 'notification-enter';
  
  return (
    <div
      className={`
        fixed top-4 right-4 max-w-sm w-full bg-white border-l-4 p-4 shadow-lg rounded-md z-50
        ${typeStyles[type]} ${animationClass}
      `}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex">
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          {message && <p className="mt-1 text-sm">{message}</p>}
        </div>
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(), 300);
            }}
            className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
            aria-label="Close notification"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Accessible Progress Bar Component
interface AccessibleProgressBarProps {
  value: number;
  max?: number;
  label: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export const AccessibleProgressBar: React.FC<AccessibleProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = true,
  size = 'md',
  color = 'blue'
}) => {
  const { generateId, prefersReducedMotion } = useAccessibility();
  const [progressId] = useState(() => generateId('progress'));
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600'
  };
  
  const animationClass = prefersReducedMotion() ? '' : 'animate-progress';
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={progressId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {showValue && (
          <span className="text-sm text-gray-600" aria-hidden="true">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      
      <div
        className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby={progressId}
      >
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ${animationClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="sr-only">
        Progress: {Math.round(percentage)}% complete
      </div>
    </div>
  );
};

// Accessible Tooltip Component
interface AccessibleTooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  content,
  children,
  position = 'top'
}) => {
  const { generateId } = useAccessibility();
  const [tooltipId] = useState(() => generateId('tooltip'));
  const [isVisible, setIsVisible] = useState(false);
  
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-describedby={isVisible ? tooltipId : undefined}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`
            absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg
            tooltip-animate ${positionClasses[position]}
          `}
        >
          {content}
          <div
            className={`
              absolute w-2 h-2 bg-gray-900 transform rotate-45
              ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' : ''}
              ${position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' : ''}
              ${position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' : ''}
              ${position === 'right' ? 'right-full top-1/2 -translate-y-1/2 -mr-1' : ''}
            `}
          />
        </div>
      )}
    </div>
  );
};