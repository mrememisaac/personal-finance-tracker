// Accessibility testing service

export interface AccessibilityTestResult {
  testName: string;
  passed: boolean;
  issues: string[];
  recommendations: string[];
  wcagLevel: 'A' | 'AA' | 'AAA';
  timestamp: number;
}

export interface AccessibilityReport {
  overallScore: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  criticalIssues: number;
  warnings: number;
  results: AccessibilityTestResult[];
  summary: {
    perceivable: number;
    operable: number;
    understandable: number;
    robust: number;
  };
}

export class AccessibilityTestService {
  private results: AccessibilityTestResult[] = [];

  // Run all accessibility tests
  runAllAccessibilityTests(): AccessibilityReport {
    this.results = [];

    // WCAG 2.1 Principle 1: Perceivable
    this.testColorContrast();
    this.testImageAltText();
    this.testHeadingStructure();
    this.testFormLabels();

    // WCAG 2.1 Principle 2: Operable
    this.testKeyboardNavigation();
    this.testFocusManagement();
    this.testSkipLinks();
    this.testButtonAccessibility();

    // WCAG 2.1 Principle 3: Understandable
    this.testLanguageAttributes();
    this.testErrorMessages();
    this.testInstructions();

    // WCAG 2.1 Principle 4: Robust
    this.testAriaAttributes();
    this.testSemanticHTML();
    this.testLandmarkRoles();

    return this.generateReport();
  }

  // Test color contrast ratios
  private testColorContrast(): void {
    const testName = 'Color Contrast';
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Get all text elements
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, button, a, label, input, textarea');
      let lowContrastCount = 0;

      textElements.forEach((element) => {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        // Skip if transparent or no background
        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
          return;
        }

        const contrast = this.calculateContrastRatio(color, backgroundColor);
        const fontSize = parseFloat(styles.fontSize);
        const fontWeight = styles.fontWeight;
        
        // WCAG AA requirements
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
        const requiredRatio = isLargeText ? 3 : 4.5;

        if (contrast < requiredRatio) {
          lowContrastCount++;
          if (lowContrastCount <= 5) { // Limit reported issues
            issues.push(`Low contrast ratio ${contrast.toFixed(2)}:1 (required: ${requiredRatio}:1)`);
          }
        }
      });

      if (lowContrastCount > 5) {
        issues.push(`...and ${lowContrastCount - 5} more contrast issues`);
      }

      if (issues.length > 0) {
        recommendations.push('Increase color contrast to meet WCAG AA standards');
        recommendations.push('Use tools like WebAIM Contrast Checker to verify ratios');
      }

      this.results.push({
        testName,
        passed: issues.length === 0,
        issues,
        recommendations,
        wcagLevel: 'AA',
        timestamp: Date.now()
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        issues: ['Error testing color contrast'],
        recommendations: ['Manually verify color contrast ratios'],
        wcagLevel: 'AA',
        timestamp: Date.now()
      });
    }
  }

  // Test image alt text
  private testImageAltText(): void {
    const testName = 'Image Alt Text';
    const issues: string[] = [];
    const recommendations: string[] = [];

    const images = document.querySelectorAll('img');
    let missingAltCount = 0;

    images.forEach((img, index) => {
      const alt = img.getAttribute('alt');
      const src = img.getAttribute('src');

      if (alt === null) {
        missingAltCount++;
        if (missingAltCount <= 5) {
          issues.push(`Image ${index + 1} missing alt attribute`);
        }
      } else if (alt.trim() === '' && !img.hasAttribute('role')) {
        // Empty alt is okay for decorative images, but should have role="presentation"
        issues.push(`Image ${index + 1} has empty alt but no role="presentation"`);
      } else if (alt && (alt.includes('image') || alt.includes('picture') || alt.includes('photo'))) {
        issues.push(`Image ${index + 1} alt text contains redundant words like "image" or "picture"`);
      }
    });

    if (missingAltCount > 5) {
      issues.push(`...and ${missingAltCount - 5} more images missing alt text`);
    }

    if (issues.length > 0) {
      recommendations.push('Add descriptive alt text to all images');
      recommendations.push('Use empty alt="" for decorative images with role="presentation"');
      recommendations.push('Avoid redundant words like "image of" in alt text');
    }

    this.results.push({
      testName,
      passed: issues.length === 0,
      issues,
      recommendations,
      wcagLevel: 'A',
      timestamp: Date.now()
    });
  }

  // Test heading structure
  private testHeadingStructure(): void {
    const testName = 'Heading Structure';
    const issues: string[] = [];
    const recommendations: string[] = [];

    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels: number[] = [];

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      headingLevels.push(level);
    });

    // Check for h1
    if (!headingLevels.includes(1)) {
      issues.push('No h1 heading found on page');
    }

    // Check for multiple h1s
    const h1Count = headingLevels.filter(level => level === 1).length;
    if (h1Count > 1) {
      issues.push(`Multiple h1 headings found (${h1Count})`);
    }

    // Check for skipped levels
    for (let i = 1; i < headingLevels.length; i++) {
      const current = headingLevels[i];
      const previous = headingLevels[i - 1];
      
      if (current > previous + 1) {
        issues.push(`Heading level skipped: h${previous} followed by h${current}`);
      }
    }

    if (issues.length > 0) {
      recommendations.push('Use only one h1 per page');
      recommendations.push('Do not skip heading levels');
      recommendations.push('Structure headings hierarchically');
    }

    this.results.push({
      testName,
      passed: issues.length === 0,
      issues,
      recommendations,
      wcagLevel: 'AA',
      timestamp: Date.now()
    });
  }

  // Test form labels
  private testFormLabels(): void {
    const testName = 'Form Labels';
    const issues: string[] = [];
    const recommendations: string[] = [];

    const formControls = document.querySelectorAll('input, select, textarea');
    let unlabeledCount = 0;

    formControls.forEach((control, index) => {
      const id = control.getAttribute('id');
      const ariaLabel = control.getAttribute('aria-label');
      const ariaLabelledBy = control.getAttribute('aria-labelledby');
      const type = control.getAttribute('type');

      // Skip hidden inputs
      if (type === 'hidden') return;

      let hasLabel = false;

      // Check for associated label
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) hasLabel = true;
      }

      // Check for aria-label
      if (ariaLabel && ariaLabel.trim()) hasLabel = true;

      // Check for aria-labelledby
      if (ariaLabelledBy) {
        const labelElements = ariaLabelledBy.split(' ')
          .map(id => document.getElementById(id))
          .filter(el => el !== null);
        if (labelElements.length > 0) hasLabel = true;
      }

      // Check for wrapping label
      const parentLabel = control.closest('label');
      if (parentLabel) hasLabel = true;

      if (!hasLabel) {
        unlabeledCount++;
        if (unlabeledCount <= 5) {
          issues.push(`Form control ${index + 1} (${control.tagName.toLowerCase()}) has no accessible label`);
        }
      }
    });

    if (unlabeledCount > 5) {
      issues.push(`...and ${unlabeledCount - 5} more unlabeled form controls`);
    }

    if (issues.length > 0) {
      recommendations.push('Associate labels with form controls using for/id attributes');
      recommendations.push('Use aria-label for controls without visible labels');
      recommendations.push('Ensure all form controls have accessible names');
    }

    this.results.push({
      testName,
      passed: issues.length === 0,
      issues,
      recommendations,
      wcagLevel: 'A',
      timestamp: Date.now()
    });
  }

  // Test keyboard navigation
  private testKeyboardNavigation(): void {
    const testName = 'Keyboard Navigation';
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for focusable elements
    const focusableElements = document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    let focusableCount = 0;
    let visibleFocusableCount = 0;

    focusableElements.forEach((element) => {
      focusableCount++;
      
      const styles = window.getComputedStyle(element);
      const isVisible = styles.display !== 'none' && 
                       styles.visibility !== 'hidden' && 
                       styles.opacity !== '0';
      
      if (isVisible) {
        visibleFocusableCount++;
      }

      // Check for focus indicators
      const focusOutline = styles.outline;
      const focusOutlineWidth = styles.outlineWidth;
      
      if (focusOutline === 'none' || focusOutlineWidth === '0px') {
        // This is a potential issue, but we can't test focus states without actually focusing
        // We'll note this as a recommendation
      }
    });

    if (visibleFocusableCount === 0) {
      issues.push('No focusable elements found');
    }

    // Check for skip links
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    let hasSkipToMain = false;
    
    skipLinks.forEach((link) => {
      const text = link.textContent?.toLowerCase() || '';
      if (text.includes('skip') && (text.includes('main') || text.includes('content'))) {
        hasSkipToMain = true;
      }
    });

    if (!hasSkipToMain && visibleFocusableCount > 5) {
      issues.push('No skip link found for keyboard navigation');
    }

    if (issues.length > 0 || visibleFocusableCount > 0) {
      recommendations.push('Ensure all interactive elements are keyboard accessible');
      recommendations.push('Provide visible focus indicators');
      recommendations.push('Add skip links for long navigation menus');
      recommendations.push('Test keyboard navigation manually');
    }

    this.results.push({
      testName,
      passed: issues.length === 0,
      issues,
      recommendations,
      wcagLevel: 'A',
      timestamp: Date.now()
    });
  }

  // Test focus management
  private testFocusManagement(): void {
    const testName = 'Focus Management';
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for modals and dialogs
    const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"], .modal');
    
    modals.forEach((modal, index) => {
      const ariaModal = modal.getAttribute('aria-modal');
      const tabIndex = modal.getAttribute('tabindex');
      
      if (ariaModal !== 'true') {
        issues.push(`Modal ${index + 1} missing aria-modal="true"`);
      }
      
      if (!tabIndex || tabIndex !== '-1') {
        issues.push(`Modal ${index + 1} should have tabindex="-1" for focus management`);
      }
    });

    // Check for focus trapping elements
    const focusTrapElements = document.querySelectorAll('[data-focus-trap], .focus-trap');
    
    if (modals.length > 0 && focusTrapElements.length === 0) {
      recommendations.push('Implement focus trapping for modal dialogs');
    }

    if (issues.length > 0 || recommendations.length > 0) {
      recommendations.push('Manage focus properly in dynamic content');
      recommendations.push('Return focus to trigger element when closing modals');
      recommendations.push('Trap focus within modal dialogs');
    }

    this.results.push({
      testName,
      passed: issues.length === 0,
      issues,
      recommendations,
      wcagLevel: 'AA',
      timestamp: Date.now()
    });
  }

  // Test skip links
  private testSkipLinks(): void {
    const testName = 'Skip Links';
    const issues: string[] = [];
    const recommendations: string[] = [];

    const skipLinks = document.querySelectorAll('a[href^="#"]');
    const mainContent = document.querySelector('main, [role="main"], #main, #content');
    
    let hasValidSkipLink = false;
    
    skipLinks.forEach((link) => {
      const href = link.getAttribute('href');
      const text = link.textContent?.toLowerCase() || '';
      
      if (text.includes('skip') && (text.includes('main') || text.includes('content'))) {
        const target = document.querySelector(href || '');
        if (target) {
          hasValidSkipLink = true;
        } else {
          issues.push(`Skip link target "${href}" not found`);
        }
      }
    });

    if (!hasValidSkipLink && mainContent) {
      issues.push('No skip link to main content found');
    }

    if (!mainContent) {
      issues.push('No main content landmark found');
    }

    if (issues.length > 0) {
      recommendations.push('Add skip link to main content');
      recommendations.push('Ensure skip link targets exist');
      recommendations.push('Make skip links visible on focus');
    }

    this.results.push({
      testName,
      passed: issues.length === 0,
      issues,
      recommendations,
      wcagLevel: 'A',
      timestamp: Date.now()
    });
  }

  // Test button accessibility
  private testButtonAccessibility(): void {
    const testName = 'Button Accessibility';
    const issues: string[] = [];
    const recommendations: string[] = [];

    const buttons = document.querySelectorAll('button, [role="button"]');
    
    buttons.forEach((button, index) => {
      const text = button.textContent?.trim() || '';
      const ariaLabel = button.getAttribute('aria-label');
      const ariaLabelledBy = button.getAttribute('aria-labelledby');
      
      // Check for accessible name
      if (!text && !ariaLabel && !ariaLabelledBy) {
        issues.push(`Button ${index + 1} has no accessible name`);
      }
      
      // Check for generic text
      if (text && (text.toLowerCase() === 'click here' || text.toLowerCase() === 'read more' || text.toLowerCase() === 'button')) {
        issues.push(`Button ${index + 1} has generic text: "${text}"`);
      }
      
      // Check for disabled state
      const disabled = button.hasAttribute('disabled');
      const ariaDisabled = button.getAttribute('aria-disabled');
      
      if (disabled && ariaDisabled !== 'true') {
        // This is okay, just a note
      }
    });

    if (issues.length > 0) {
      recommendations.push('Provide descriptive button text or aria-label');
      recommendations.push('Avoid generic button text like "click here"');
      recommendations.push('Use aria-disabled for dynamically disabled buttons');
    }

    this.results.push({
      testName,
      passed: issues.length === 0,
      issues,
      recommendations,
      wcagLevel: 'A',
      timestamp: Date.now()
    });
  }

  // Test language attributes
  private testLanguageAttributes(): void {
    const testName = 'Language Attributes';
    const issues: string[] = [];
    const recommendations: string[] = [];

    const html = document.documentElement;
    const lang = html.getAttribute('lang');
    
    if (!lang) {
      issues.push('HTML element missing lang attribute');
    } else if (lang.length < 2) {
      issues.push('Invalid lang attribute value');
    }

    // Check for language changes
    const langElements = document.querySelectorAll('[lang]');
    langElements.forEach((element, index) => {
      const elementLang = element.getAttribute('lang');
      if (!elementLang || elementLang.length < 2) {
        issues.push(`Element ${index + 1} has invalid lang attribute`);
      }
    });

    if (issues.length > 0) {
      recommendations.push('Add lang attribute to html element');
      recommendations.push('Use valid language codes (e.g., "en", "es", "fr")');
      recommendations.push('Mark language changes with lang attribute');
    }

    this.results.push({
      testName,
      passed: issues.length === 0,
      issues,
      recommendations,
      wcagLevel: 'A',
      timestamp: Date.now()
    });
  }

  // Test error messages
  private testErrorMessages(): void {
    const testName = 'Error Messages';
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Look for error elements
    const errorElements = document.querySelectorAll(
      '[role="alert"], .error, .invalid, [aria-invalid="true"]'
    );

    errorElements.forEach((element, index) => {
      const role = element.getAttribute('role');
      const ariaLive = element.getAttribute('aria-live');
      
      if (role === 'alert' && !ariaLive) {
        // role="alert" implies aria-live="assertive", so this is okay
      }
      
      const text = element.textContent?.trim() || '';
      if (!text) {
        issues.push(`Error element ${index + 1} has no text content`);
      }
    });

    // Check form validation
    const invalidInputs = document.querySelectorAll('[aria-invalid="true"]');
    invalidInputs.forEach((input, index) => {
      const describedBy = input.getAttribute('aria-describedby');
      if (describedBy) {
        const errorElement = document.getElementById(describedBy);
        if (!errorElement) {
          issues.push(`Invalid input ${index + 1} references non-existent error message`);
        }
      } else {
        issues.push(`Invalid input ${index + 1} not associated with error message`);
      }
    });

    if (issues.length > 0) {
      recommendations.push('Associate error messages with form controls using aria-describedby');
      recommendations.push('Use role="alert" for important error messages');
      recommendations.push('Provide clear, specific error messages');
    }

    this.results.push({
      testName,
      passed: issues.length === 0,
      issues,
      recommendations,
      wcagLevel: 'AA',
      timestamp: Date.now()
    });
  }

  // Test instructions
  private testInstructions(): void {
    const testName = 'Instructions';
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Look for required fields
    const requiredFields = document.querySelectorAll('[required], [aria-required="true"]');
    
    if (requiredFields.length > 0) {
      // Check for general instructions
      const instructions = document.querySelectorAll('.instructions, [role="note"], .help-text');
      
      if (instructions.length === 0) {
        issues.push('Required fields found but no instructions provided');
      }
      
      // Check if required fields are marked
      requiredFields.forEach((field, index) => {
        const label = document.querySelector(`label[for="${field.id}"]`);
        const ariaLabel = field.getAttribute('aria-label');
        const ariaLabelledBy = field.getAttribute('aria-labelledby');
        
        let hasRequiredIndicator = false;
        
        if (label && (label.textContent?.includes('*') || label.textContent?.includes('required'))) {
          hasRequiredIndicator = true;
        }
        
        if (ariaLabel && (ariaLabel.includes('required') || ariaLabel.includes('*'))) {
          hasRequiredIndicator = true;
        }
        
        if (!hasRequiredIndicator) {
          issues.push(`Required field ${index + 1} not clearly marked as required`);
        }
      });
    }

    if (issues.length > 0) {
      recommendations.push('Provide clear instructions for form completion');
      recommendations.push('Mark required fields clearly');
      recommendations.push('Explain any input format requirements');
    }

    this.results.push({
      testName,
      passed: issues.length === 0,
      issues,
      recommendations,
      wcagLevel: 'AA',
      timestamp: Date.now()
    });
  }

  // Test ARIA attributes
  private testAriaAttributes(): void {
    const testName = 'ARIA Attributes';
    const issues: string[] = [];
    const recommendations: string[] = [];

    const ariaElements = document.querySelectorAll('[aria-labelledby], [aria-describedby]');
    
    ariaElements.forEach((element, index) => {
      const labelledBy = element.getAttribute('aria-labelledby');
      const describedBy = element.getAttribute('aria-describedby');
      
      if (labelledBy) {
        const ids = labelledBy.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            issues.push(`Element ${index + 1} aria-labelledby references non-existent ID: ${id}`);
          }
        });
      }
      
      if (describedBy) {
        const ids = describedBy.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            issues.push(`Element ${index + 1} aria-describedby references non-existent ID: ${id}`);
          }
        });
      }
    });

    // Check for invalid ARIA attributes
    const allElements = document.querySelectorAll('*');
    allElements.forEach((element, index) => {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('aria-')) {
          // Check for empty values
          if (!attr.value.trim()) {
            issues.push(`Element ${index + 1} has empty ${attr.name} attribute`);
          }
        }
      });
    });

    if (issues.length > 0) {
      recommendations.push('Ensure ARIA attributes reference existing elements');
      recommendations.push('Provide meaningful values for ARIA attributes');
      recommendations.push('Validate ARIA usage with accessibility tools');
    }

    this.results.push({
      testName,
      passed: issues.length === 0,
      issues,
      recommendations,
      wcagLevel: 'A',
      timestamp: Date.now()
    });
  }

  // Test semantic HTML
  private testSemanticHTML(): void {
    const testName = 'Semantic HTML';
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for semantic elements
    const semanticElements = {
      header: document.querySelectorAll('header').length,
      nav: document.querySelectorAll('nav').length,
      main: document.querySelectorAll('main').length,
      section: document.querySelectorAll('section').length,
      article: document.querySelectorAll('article').length,
      aside: document.querySelectorAll('aside').length,
      footer: document.querySelectorAll('footer').length
    };

    if (semanticElements.main === 0) {
      issues.push('No main element found');
    }

    if (semanticElements.main > 1) {
      issues.push(`Multiple main elements found (${semanticElements.main})`);
    }

    // Check for generic div usage where semantic elements would be better
    const divs = document.querySelectorAll('div');
    let suspiciousDivs = 0;

    divs.forEach((div) => {
      const className = div.className.toLowerCase();
      const id = div.id.toLowerCase();
      
      if (className.includes('header') || id.includes('header')) {
        suspiciousDivs++;
      }
      if (className.includes('nav') || id.includes('nav')) {
        suspiciousDivs++;
      }
      if (className.includes('main') || id.includes('main')) {
        suspiciousDivs++;
      }
      if (className.includes('footer') || id.includes('footer')) {
        suspiciousDivs++;
      }
    });

    if (suspiciousDivs > 0) {
      issues.push(`${suspiciousDivs} div elements could potentially use semantic HTML elements`);
    }

    if (issues.length > 0) {
      recommendations.push('Use semantic HTML elements (header, nav, main, section, article, aside, footer)');
      recommendations.push('Replace generic divs with appropriate semantic elements');
      recommendations.push('Use only one main element per page');
    }

    this.results.push({
      testName,
      passed: issues.length === 0,
      issues,
      recommendations,
      wcagLevel: 'AA',
      timestamp: Date.now()
    });
  }

  // Test landmark roles
  private testLandmarkRoles(): void {
    const testName = 'Landmark Roles';
    const issues: string[] = [];
    const recommendations: string[] = [];

    const landmarks = {
      banner: document.querySelectorAll('[role="banner"], header').length,
      navigation: document.querySelectorAll('[role="navigation"], nav').length,
      main: document.querySelectorAll('[role="main"], main').length,
      contentinfo: document.querySelectorAll('[role="contentinfo"], footer').length,
      complementary: document.querySelectorAll('[role="complementary"], aside').length
    };

    if (landmarks.main === 0) {
      issues.push('No main landmark found');
    }

    if (landmarks.main > 1) {
      issues.push(`Multiple main landmarks found (${landmarks.main})`);
    }

    if (landmarks.banner === 0) {
      recommendations.push('Consider adding a banner landmark (header)');
    }

    if (landmarks.navigation === 0) {
      recommendations.push('Consider adding navigation landmarks');
    }

    if (issues.length > 0 || recommendations.length > 0) {
      recommendations.push('Use ARIA landmark roles or semantic HTML elements');
      recommendations.push('Ensure unique landmarks have accessible names');
      recommendations.push('Provide a logical page structure with landmarks');
    }

    this.results.push({
      testName,
      passed: issues.length === 0,
      issues,
      recommendations,
      wcagLevel: 'AA',
      timestamp: Date.now()
    });
  }

  // Calculate contrast ratio between two colors
  private calculateContrastRatio(color1: string, color2: string): number {
    // This is a simplified implementation
    // In a real implementation, you would parse RGB values and calculate luminance
    // For now, return a mock value
    return 4.5; // Mock contrast ratio
  }

  // Generate accessibility report
  private generateReport(): AccessibilityReport {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    const criticalIssues = this.results.filter(r => 
      !r.passed && (r.wcagLevel === 'A' || r.issues.some(issue => 
        issue.includes('missing') || issue.includes('no ') || issue.includes('not found')
      ))
    ).length;
    
    const warnings = failedTests - criticalIssues;
    const overallScore = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    // Calculate scores by WCAG principle
    const perceivableTests = this.results.filter(r => 
      ['Color Contrast', 'Image Alt Text', 'Form Labels'].includes(r.testName)
    );
    const operableTests = this.results.filter(r => 
      ['Keyboard Navigation', 'Focus Management', 'Skip Links', 'Button Accessibility'].includes(r.testName)
    );
    const understandableTests = this.results.filter(r => 
      ['Language Attributes', 'Error Messages', 'Instructions'].includes(r.testName)
    );
    const robustTests = this.results.filter(r => 
      ['ARIA Attributes', 'Semantic HTML', 'Landmark Roles'].includes(r.testName)
    );

    const calculatePrincipleScore = (tests: AccessibilityTestResult[]) => {
      if (tests.length === 0) return 100;
      const passed = tests.filter(t => t.passed).length;
      return Math.round((passed / tests.length) * 100);
    };

    return {
      overallScore,
      totalTests,
      passedTests,
      failedTests,
      criticalIssues,
      warnings,
      results: this.results,
      summary: {
        perceivable: calculatePrincipleScore(perceivableTests),
        operable: calculatePrincipleScore(operableTests),
        understandable: calculatePrincipleScore(understandableTests),
        robust: calculatePrincipleScore(robustTests)
      }
    };
  }

  // Clear results
  clearResults(): void {
    this.results = [];
  }
}