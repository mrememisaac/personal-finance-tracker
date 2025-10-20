// Accessibility testing utilities
export interface AccessibilityTestResult {
  name: string;
  passed: boolean;
  message: string;
  element?: Element;
  severity: 'error' | 'warning' | 'info';
}

export class AccessibilityTester {
  private results: AccessibilityTestResult[] = [];

  // Test for proper heading hierarchy
  testHeadingHierarchy(): AccessibilityTestResult[] {
    const results: AccessibilityTestResult[] = [];
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (index === 0 && level !== 1) {
        results.push({
          name: 'First heading should be h1',
          passed: false,
          message: `First heading is ${heading.tagName}, should be H1`,
          element: heading,
          severity: 'error'
        });
      }

      if (level > previousLevel + 1) {
        results.push({
          name: 'Heading hierarchy',
          passed: false,
          message: `Heading level jumps from H${previousLevel} to H${level}`,
          element: heading,
          severity: 'warning'
        });
      }

      previousLevel = level;
    });

    if (results.length === 0) {
      results.push({
        name: 'Heading hierarchy',
        passed: true,
        message: 'Heading hierarchy is properly structured',
        severity: 'info'
      });
    }

    return results;
  }

  // Test for images without alt text
  testImageAltText(): AccessibilityTestResult[] {
    const results: AccessibilityTestResult[] = [];
    const images = document.querySelectorAll('img');

    images.forEach(img => {
      if (!img.hasAttribute('alt')) {
        results.push({
          name: 'Image alt text',
          passed: false,
          message: 'Image missing alt attribute',
          element: img,
          severity: 'error'
        });
      } else if (img.getAttribute('alt') === '') {
        // Empty alt is okay for decorative images
        results.push({
          name: 'Image alt text',
          passed: true,
          message: 'Decorative image with empty alt text',
          element: img,
          severity: 'info'
        });
      }
    });

    if (results.length === 0) {
      results.push({
        name: 'Image alt text',
        passed: true,
        message: 'All images have appropriate alt text',
        severity: 'info'
      });
    }

    return results;
  }

  // Test for form labels
  testFormLabels(): AccessibilityTestResult[] {
    const results: AccessibilityTestResult[] = [];
    const inputs = document.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (!label && !ariaLabel && !ariaLabelledBy) {
          results.push({
            name: 'Form labels',
            passed: false,
            message: `Input with id="${id}" has no associated label`,
            element: input,
            severity: 'error'
          });
        }
      } else if (!ariaLabel && !ariaLabelledBy) {
        results.push({
          name: 'Form labels',
          passed: false,
          message: 'Input has no id, aria-label, or aria-labelledby',
          element: input,
          severity: 'error'
        });
      }
    });

    if (results.length === 0) {
      results.push({
        name: 'Form labels',
        passed: true,
        message: 'All form inputs have proper labels',
        severity: 'info'
      });
    }

    return results;
  }

  // Test for keyboard navigation
  testKeyboardNavigation(): AccessibilityTestResult[] {
    const results: AccessibilityTestResult[] = [];
    const focusableElements = document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    let hasTabIndex = false;
    focusableElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex && parseInt(tabIndex) > 0) {
        hasTabIndex = true;
        results.push({
          name: 'Keyboard navigation',
          passed: false,
          message: `Element has positive tabindex (${tabIndex}), which can disrupt tab order`,
          element: element,
          severity: 'warning'
        });
      }
    });

    if (!hasTabIndex) {
      results.push({
        name: 'Keyboard navigation',
        passed: true,
        message: 'No positive tabindex values found',
        severity: 'info'
      });
    }

    return results;
  }

  // Test for color contrast (basic check)
  testColorContrast(): AccessibilityTestResult[] {
    const results: AccessibilityTestResult[] = [];
    
    // This is a simplified test - in a real app you'd use a proper contrast checker
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
    let lowContrastCount = 0;

    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Simple check for very light text on light backgrounds
      if (color.includes('rgb(255') && backgroundColor.includes('rgb(255')) {
        lowContrastCount++;
      }
    });

    if (lowContrastCount > 0) {
      results.push({
        name: 'Color contrast',
        passed: false,
        message: `${lowContrastCount} elements may have insufficient color contrast`,
        severity: 'warning'
      });
    } else {
      results.push({
        name: 'Color contrast',
        passed: true,
        message: 'No obvious color contrast issues detected',
        severity: 'info'
      });
    }

    return results;
  }

  // Test for ARIA roles and properties
  testAriaUsage(): AccessibilityTestResult[] {
    const results: AccessibilityTestResult[] = [];
    const elementsWithAria = document.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby]');

    let validAriaCount = 0;
    elementsWithAria.forEach(element => {
      const role = element.getAttribute('role');
      if (role) {
        const validRoles = [
          'alert', 'button', 'checkbox', 'dialog', 'grid', 'gridcell', 'link', 'log', 'marquee',
          'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'progressbar', 'radio',
          'scrollbar', 'slider', 'spinbutton', 'status', 'tab', 'tabpanel', 'textbox', 'timer',
          'tooltip', 'treeitem', 'combobox', 'group', 'listbox', 'menu', 'menubar', 'radiogroup',
          'tablist', 'tree', 'treegrid', 'application', 'article', 'banner', 'complementary',
          'contentinfo', 'form', 'main', 'navigation', 'region', 'search'
        ];
        
        if (validRoles.includes(role)) {
          validAriaCount++;
        } else {
          results.push({
            name: 'ARIA usage',
            passed: false,
            message: `Invalid ARIA role: "${role}"`,
            element: element,
            severity: 'error'
          });
        }
      }
    });

    if (results.length === 0) {
      results.push({
        name: 'ARIA usage',
        passed: true,
        message: `${validAriaCount} elements using ARIA correctly`,
        severity: 'info'
      });
    }

    return results;
  }

  // Test for skip links
  testSkipLinks(): AccessibilityTestResult[] {
    const results: AccessibilityTestResult[] = [];
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    
    let hasSkipToMain = false;
    skipLinks.forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent?.toLowerCase() || '';
      
      if (text.includes('skip') && (text.includes('main') || text.includes('content'))) {
        hasSkipToMain = true;
        
        // Check if target exists
        const target = document.querySelector(href || '');
        if (!target) {
          results.push({
            name: 'Skip links',
            passed: false,
            message: `Skip link target "${href}" not found`,
            element: link,
            severity: 'error'
          });
        }
      }
    });

    if (!hasSkipToMain) {
      results.push({
        name: 'Skip links',
        passed: false,
        message: 'No "skip to main content" link found',
        severity: 'warning'
      });
    }

    if (results.length === 0) {
      results.push({
        name: 'Skip links',
        passed: true,
        message: 'Skip links are properly implemented',
        severity: 'info'
      });
    }

    return results;
  }

  // Run all accessibility tests
  runAllTests(): AccessibilityTestResult[] {
    this.results = [];
    
    this.results.push(...this.testHeadingHierarchy());
    this.results.push(...this.testImageAltText());
    this.results.push(...this.testFormLabels());
    this.results.push(...this.testKeyboardNavigation());
    this.results.push(...this.testColorContrast());
    this.results.push(...this.testAriaUsage());
    this.results.push(...this.testSkipLinks());

    return this.results;
  }

  // Get summary of test results
  getSummary(): { total: number; passed: number; failed: number; warnings: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed && r.severity === 'error').length;
    const warnings = this.results.filter(r => !r.passed && r.severity === 'warning').length;

    return { total, passed, failed, warnings };
  }
}

// Keyboard navigation helper
export class KeyboardNavigationHelper {
  private focusableElements: Element[] = [];
  private currentIndex = -1;

  constructor() {
    this.updateFocusableElements();
  }

  updateFocusableElements() {
    this.focusableElements = Array.from(document.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
  }

  focusNext() {
    this.updateFocusableElements();
    this.currentIndex = (this.currentIndex + 1) % this.focusableElements.length;
    (this.focusableElements[this.currentIndex] as HTMLElement)?.focus();
  }

  focusPrevious() {
    this.updateFocusableElements();
    this.currentIndex = this.currentIndex <= 0 ? this.focusableElements.length - 1 : this.currentIndex - 1;
    (this.focusableElements[this.currentIndex] as HTMLElement)?.focus();
  }

  focusFirst() {
    this.updateFocusableElements();
    this.currentIndex = 0;
    (this.focusableElements[0] as HTMLElement)?.focus();
  }

  focusLast() {
    this.updateFocusableElements();
    this.currentIndex = this.focusableElements.length - 1;
    (this.focusableElements[this.currentIndex] as HTMLElement)?.focus();
  }
}

// Screen reader announcements helper
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}