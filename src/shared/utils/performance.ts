// Performance monitoring utilities

export interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage?: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure component render time
  measureRender<T>(componentName: string, renderFn: () => T): T {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    
    this.recordMetric({
      renderTime: endTime - startTime,
      componentCount: 1,
      timestamp: Date.now()
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render time: ${(endTime - startTime).toFixed(2)}ms`);
    }

    return result;
  }

  // Start performance observation
  startObserving(entryTypes: string[] = ['measure', 'navigation', 'paint']) {
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Performance: ${entry.name} - ${entry.duration?.toFixed(2)}ms`);
          }
        });
      });

      try {
        observer.observe({ entryTypes });
        this.observers.set('main', observer);
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  // Stop performance observation
  stopObserving() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }

  // Record custom metric
  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  // Get performance summary
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // Get average render time
  getAverageRenderTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const totalTime = this.metrics.reduce((sum, metric) => sum + metric.renderTime, 0);
    return totalTime / this.metrics.length;
  }

  // Check if performance is degraded
  isPerformanceDegraded(threshold: number = 16): boolean {
    const avgRenderTime = this.getAverageRenderTime();
    return avgRenderTime > threshold;
  }

  // Get memory usage (if available)
  getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    measureRender: <T>(renderFn: () => T): T => 
      monitor.measureRender(componentName, renderFn),
    recordMetric: (metric: Partial<PerformanceMetrics>) => 
      monitor.recordMetric({
        renderTime: 0,
        componentCount: 1,
        timestamp: Date.now(),
        ...metric
      }),
    getMetrics: () => monitor.getMetrics(),
    isPerformanceDegraded: (threshold?: number) => 
      monitor.isPerformanceDegraded(threshold)
  };
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memoization utility
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Prevent memory leaks by limiting cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
}