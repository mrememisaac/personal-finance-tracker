// Animation utilities with accessibility considerations

export interface AnimationOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  respectMotionPreference?: boolean;
}

export interface TransitionConfig {
  property: string;
  duration: number;
  easing: string;
  delay?: number;
}

export class AnimationManager {
  private static instance: AnimationManager;
  private prefersReducedMotion: boolean = false;
  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    this.initializeMotionPreference();
  }

  static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  private initializeMotionPreference(): void {
    if (typeof window === 'undefined') return;

    this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = this.mediaQuery.matches;

    // Listen for changes
    this.mediaQuery.addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
    });
  }

  // Get animation duration based on user preference
  getDuration(duration: number, respectPreference: boolean = true): number {
    if (respectPreference && this.prefersReducedMotion) {
      return 0; // No animation for users who prefer reduced motion
    }
    return duration;
  }

  // Create CSS transition string
  createTransition(configs: TransitionConfig[], respectMotionPreference: boolean = true): string {
    if (respectMotionPreference && this.prefersReducedMotion) {
      return 'none';
    }

    return configs
      .map(config => {
        const delay = config.delay ? ` ${config.delay}ms` : '';
        return `${config.property} ${config.duration}ms ${config.easing}${delay}`;
      })
      .join(', ');
  }

  // Animate element with JavaScript
  animate(
    element: HTMLElement,
    keyframes: Keyframe[],
    options: AnimationOptions = {}
  ): Animation | null {
    if (typeof element.animate !== 'function') return null;

    const {
      duration = 300,
      easing = 'ease-out',
      delay = 0,
      respectMotionPreference = true
    } = options;

    const actualDuration = this.getDuration(duration, respectMotionPreference);
    
    if (actualDuration === 0) {
      // Apply final state immediately
      const finalFrame = keyframes[keyframes.length - 1];
      Object.assign(element.style, finalFrame);
      return null;
    }

    return element.animate(keyframes, {
      duration: actualDuration,
      easing,
      delay,
      fill: 'forwards'
    });
  }

  // Fade in animation
  fadeIn(element: HTMLElement, options: AnimationOptions = {}): Animation | null {
    return this.animate(element, [
      { opacity: 0 },
      { opacity: 1 }
    ], { duration: 200, ...options });
  }

  // Fade out animation
  fadeOut(element: HTMLElement, options: AnimationOptions = {}): Animation | null {
    return this.animate(element, [
      { opacity: 1 },
      { opacity: 0 }
    ], { duration: 200, ...options });
  }

  // Slide in from top
  slideInFromTop(element: HTMLElement, options: AnimationOptions = {}): Animation | null {
    return this.animate(element, [
      { transform: 'translateY(-100%)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration: 300, easing: 'ease-out', ...options });
  }

  // Slide out to top
  slideOutToTop(element: HTMLElement, options: AnimationOptions = {}): Animation | null {
    return this.animate(element, [
      { transform: 'translateY(0)', opacity: 1 },
      { transform: 'translateY(-100%)', opacity: 0 }
    ], { duration: 300, easing: 'ease-in', ...options });
  }

  // Scale in animation
  scaleIn(element: HTMLElement, options: AnimationOptions = {}): Animation | null {
    return this.animate(element, [
      { transform: 'scale(0.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 200, easing: 'ease-out', ...options });
  }

  // Scale out animation
  scaleOut(element: HTMLElement, options: AnimationOptions = {}): Animation | null {
    return this.animate(element, [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(0.8)', opacity: 0 }
    ], { duration: 200, easing: 'ease-in', ...options });
  }

  // Bounce animation
  bounce(element: HTMLElement, options: AnimationOptions = {}): Animation | null {
    return this.animate(element, [
      { transform: 'translateY(0)' },
      { transform: 'translateY(-10px)' },
      { transform: 'translateY(0)' }
    ], { duration: 400, easing: 'ease-in-out', ...options });
  }

  // Shake animation (for errors)
  shake(element: HTMLElement, options: AnimationOptions = {}): Animation | null {
    return this.animate(element, [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0)' }
    ], { duration: 500, easing: 'ease-in-out', ...options });
  }

  // Pulse animation
  pulse(element: HTMLElement, options: AnimationOptions = {}): Animation | null {
    return this.animate(element, [
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' }
    ], { duration: 600, easing: 'ease-in-out', ...options });
  }

  // Check if animations are enabled
  areAnimationsEnabled(): boolean {
    return !this.prefersReducedMotion;
  }

  // Get safe animation classes (empty if reduced motion preferred)
  getSafeAnimationClasses(classes: string): string {
    return this.prefersReducedMotion ? '' : classes;
  }
}

// Predefined animation configurations
export const animations = {
  // Transitions
  transitions: {
    fast: { duration: 150, easing: 'ease-out' },
    normal: { duration: 300, easing: 'ease-out' },
    slow: { duration: 500, easing: 'ease-out' },
    bounce: { duration: 400, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
    smooth: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
  },

  // CSS transition strings
  css: {
    all: 'all 300ms ease-out',
    opacity: 'opacity 200ms ease-out',
    transform: 'transform 300ms ease-out',
    colors: 'background-color 200ms ease-out, border-color 200ms ease-out, color 200ms ease-out',
    shadow: 'box-shadow 200ms ease-out',
    size: 'width 300ms ease-out, height 300ms ease-out'
  },

  // Keyframe animations
  keyframes: {
    fadeIn: [
      { opacity: 0 },
      { opacity: 1 }
    ],
    fadeOut: [
      { opacity: 1 },
      { opacity: 0 }
    ],
    slideUp: [
      { transform: 'translateY(20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ],
    slideDown: [
      { transform: 'translateY(-20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ],
    scaleIn: [
      { transform: 'scale(0.9)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ],
    scaleOut: [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(0.9)', opacity: 0 }
    ]
  }
};

// React hook for animations
export function useAnimations() {
  const manager = AnimationManager.getInstance();

  return {
    animate: (element: HTMLElement, keyframes: Keyframe[], options?: AnimationOptions) =>
      manager.animate(element, keyframes, options),
    fadeIn: (element: HTMLElement, options?: AnimationOptions) =>
      manager.fadeIn(element, options),
    fadeOut: (element: HTMLElement, options?: AnimationOptions) =>
      manager.fadeOut(element, options),
    slideInFromTop: (element: HTMLElement, options?: AnimationOptions) =>
      manager.slideInFromTop(element, options),
    slideOutToTop: (element: HTMLElement, options?: AnimationOptions) =>
      manager.slideOutToTop(element, options),
    scaleIn: (element: HTMLElement, options?: AnimationOptions) =>
      manager.scaleIn(element, options),
    scaleOut: (element: HTMLElement, options?: AnimationOptions) =>
      manager.scaleOut(element, options),
    bounce: (element: HTMLElement, options?: AnimationOptions) =>
      manager.bounce(element, options),
    shake: (element: HTMLElement, options?: AnimationOptions) =>
      manager.shake(element, options),
    pulse: (element: HTMLElement, options?: AnimationOptions) =>
      manager.pulse(element, options),
    getDuration: (duration: number, respectPreference?: boolean) =>
      manager.getDuration(duration, respectPreference),
    createTransition: (configs: TransitionConfig[], respectMotionPreference?: boolean) =>
      manager.createTransition(configs, respectMotionPreference),
    areAnimationsEnabled: () => manager.areAnimationsEnabled(),
    getSafeAnimationClasses: (classes: string) => manager.getSafeAnimationClasses(classes)
  };
}

// Utility function to create responsive animations
export function createResponsiveAnimation(
  element: HTMLElement,
  mobileKeyframes: Keyframe[],
  desktopKeyframes: Keyframe[],
  options: AnimationOptions = {}
): Animation | null {
  const manager = AnimationManager.getInstance();
  const isMobile = window.innerWidth < 768;
  const keyframes = isMobile ? mobileKeyframes : desktopKeyframes;
  
  return manager.animate(element, keyframes, options);
}

// Utility to stagger animations
export function staggerAnimations(
  elements: HTMLElement[],
  keyframes: Keyframe[],
  options: AnimationOptions = {},
  staggerDelay: number = 100
): Animation[] {
  const manager = AnimationManager.getInstance();
  const animations: Animation[] = [];

  elements.forEach((element, index) => {
    const animation = manager.animate(element, keyframes, {
      ...options,
      delay: (options.delay || 0) + (index * staggerDelay)
    });
    if (animation) {
      animations.push(animation);
    }
  });

  return animations;
}