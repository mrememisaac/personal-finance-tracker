// Accessibility utilities and helpers

export interface AccessibilityOptions {
  announceChanges?: boolean;
  focusManagement?: boolean;
  keyboardNavigation?: boolean;
  screenReaderSupport?: boolean;
}

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private announcer: HTMLElement | null = null;
  private options: AccessibilityOptions;

  constructor(options: AccessibilityOptions = {}) {
    this.options = {
      announceChanges: true,
      focusManagement: true,
      keyboardNavigation: true,
      screenReaderSupport: true,
      ...options
    };
    
    this.initializeAnnouncer();
  }

  static getInstance(options?: AccessibilityOptions): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager(options);
    }
    return AccessibilityManager.instance;
  }

  // Initialize screen reader announcer
  private initializeAnnouncer(): void {
    if (typeof document === 'undefined' || !this.options.screenReaderSupport) return;

    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.setAttribute('class', 'sr-only');
    this.announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    
    document.body.appendChild(this.announcer);
  }

  // Announce message to screen readers
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcer || !this.options.announceChanges) return;

    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = '';
      }
    }, 1000);
  }

  // Focus management
  focusElement(element: HTMLElement | null, options?: FocusOptions): void {
    if (!element || !this.options.focusManagement) return;

    // Ensure element is focusable
    if (!element.hasAttribute('tabindex') && !this.isFocusable(element)) {
      element.setAttribute('tabindex', '-1');
    }

    element.focus(options);
  }

  // Check if element is naturally focusable
  private isFocusable(element: HTMLElement): boolean {
    const focusableElements = [
      'a[href]',
      'button',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])'
    ];

    return focusableElements.some(selector => element.matches(selector));
  }

  // Trap focus within container
  trapFocus(container: HTMLElement): () => void {
    if (!this.options.focusManagement) return () => {};

    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  // Get all focusable elements within container
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(element => {
        const htmlElement = element as HTMLElement;
        return htmlElement.offsetWidth > 0 && 
               htmlElement.offsetHeight > 0 && 
               !htmlElement.hidden;
      }) as HTMLElement[];
  }

  // Add keyboard navigation support
  addKeyboardNavigation(
    container: HTMLElement, 
    options: {
      arrowKeys?: boolean;
      enterKey?: boolean;
      escapeKey?: boolean;
      onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void;
      onActivate?: (element: HTMLElement) => void;
      onEscape?: () => void;
    } = {}
  ): () => void {
    if (!this.options.keyboardNavigation) return () => {};

    const handleKeyDown = (e: KeyboardEvent) => {
      const { arrowKeys = true, enterKey = true, escapeKey = true } = options;

      if (arrowKeys && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
        options.onNavigate?.(direction);
      }

      if (enterKey && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && container.contains(activeElement)) {
          options.onActivate?.(activeElement);
        }
      }

      if (escapeKey && e.key === 'Escape') {
        e.preventDefault();
        options.onEscape?.();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  // Generate unique IDs for accessibility
  generateId(prefix: string = 'a11y'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if user prefers reduced motion
  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Check if user prefers high contrast
  prefersHighContrast(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  // Validate ARIA attributes
  validateAriaAttributes(element: HTMLElement): string[] {
    const issues: string[] = [];
    const ariaAttributes = Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('aria-'));

    ariaAttributes.forEach(attr => {
      // Check for empty aria-label
      if (attr.name === 'aria-label' && !attr.value.trim()) {
        issues.push('Empty aria-label attribute');
      }

      // Check for invalid aria-labelledby references
      if (attr.name === 'aria-labelledby') {
        const ids = attr.value.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            issues.push(`aria-labelledby references non-existent element: ${id}`);
          }
        });
      }

      // Check for invalid aria-describedby references
      if (attr.name === 'aria-describedby') {
        const ids = attr.value.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            issues.push(`aria-describedby references non-existent element: ${id}`);
          }
        });
      }
    });

    return issues;
  }

  // Add skip link functionality
  addSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLElement {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
      border-radius: 4px;
      transition: top 0.3s;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
    return skipLink;
  }

  // Cleanup
  destroy(): void {
    if (this.announcer && this.announcer.parentNode) {
      this.announcer.parentNode.removeChild(this.announcer);
    }
    AccessibilityManager.instance = null as any;
  }
}

// React hook for accessibility
export function useAccessibility(options?: AccessibilityOptions) {
  const manager = AccessibilityManager.getInstance(options);

  return {
    announce: (message: string, priority?: 'polite' | 'assertive') => 
      manager.announce(message, priority),
    focusElement: (element: HTMLElement | null, options?: FocusOptions) => 
      manager.focusElement(element, options),
    trapFocus: (container: HTMLElement) => manager.trapFocus(container),
    addKeyboardNavigation: (container: HTMLElement, options?: any) => 
      manager.addKeyboardNavigation(container, options),
    generateId: (prefix?: string) => manager.generateId(prefix),
    prefersReducedMotion: () => manager.prefersReducedMotion(),
    prefersHighContrast: () => manager.prefersHighContrast(),
    validateAriaAttributes: (element: HTMLElement) => 
      manager.validateAriaAttributes(element),
    addSkipLink: (targetId: string, text?: string) => 
      manager.addSkipLink(targetId, text)
  };
}

// Utility functions for common accessibility patterns
export const a11yUtils = {
  // Create accessible button props
  button: (label: string, options: { 
    describedBy?: string; 
    expanded?: boolean; 
    pressed?: boolean;
    disabled?: boolean;
  } = {}) => ({
    'aria-label': label,
    'aria-describedby': options.describedBy,
    'aria-expanded': options.expanded,
    'aria-pressed': options.pressed,
    'disabled': options.disabled,
    'type': 'button' as const
  }),

  // Create accessible form field props
  formField: (label: string, options: {
    required?: boolean;
    invalid?: boolean;
    describedBy?: string;
    errorId?: string;
  } = {}) => {
    const id = AccessibilityManager.getInstance().generateId('field');
    return {
      field: {
        id,
        'aria-label': label,
        'aria-required': options.required,
        'aria-invalid': options.invalid,
        'aria-describedby': [options.describedBy, options.errorId].filter(Boolean).join(' ') || undefined
      },
      label: {
        htmlFor: id
      },
      error: options.errorId ? {
        id: options.errorId,
        role: 'alert',
        'aria-live': 'polite' as const
      } : {}
    };
  },

  // Create accessible modal props
  modal: (title: string) => {
    const titleId = AccessibilityManager.getInstance().generateId('modal-title');
    return {
      modal: {
        role: 'dialog',
        'aria-modal': true,
        'aria-labelledby': titleId,
        tabIndex: -1
      },
      title: {
        id: titleId
      },
      backdrop: {
        'aria-hidden': true
      }
    };
  },

  // Create accessible table props
  table: (caption: string) => {
    const captionId = AccessibilityManager.getInstance().generateId('table-caption');
    return {
      table: {
        'aria-labelledby': captionId,
        role: 'table'
      },
      caption: {
        id: captionId
      }
    };
  }
};