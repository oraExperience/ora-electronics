
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
    this.init();
  }

  init() {
    this.measureCoreWebVitals();
    this.measurePageLoadMetrics();
    this.measureUserInteractions();
    this.setupErrorTracking();
    this.scheduleReporting();
  }

  measureCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    this.measureLCP();
    
    // First Input Delay (FID)
    this.measureFID();
    
    // Cumulative Layout Shift (CLS)
    this.measureCLS();
    
    // First Contentful Paint (FCP)
    this.measureFCP();
    
    // Time to First Byte (TTFB)
    this.measureTTFB();
  }

  measureLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.metrics.lcp = {
          value: lastEntry.startTime,
          rating: this.getRating(lastEntry.startTime, [2500, 4000]),
          element: lastEntry.element?.tagName || 'unknown',
          timestamp: Date.now()
        };
        
        console.log('LCP:', this.metrics.lcp);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    }
  }

  measureFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          this.metrics.fid = {
            value: entry.processingStart - entry.startTime,
            rating: this.getRating(entry.processingStart - entry.startTime, [100, 300]),
            timestamp: Date.now()
          };
          
          console.log('FID:', this.metrics.fid);
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    }
  }

  measureCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      let sessionValue = 0;
      let sessionEntries = [];
      
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];
            
            if (sessionValue && 
                entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }
            
            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              this.metrics.cls = {
                value: clsValue,
                rating: this.getRating(clsValue, [0.1, 0.25]),
                timestamp: Date.now()
              };
              
              console.log('CLS:', this.metrics.cls);
            }
          }
        });
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    }
  }

  measureFCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = {
              value: entry.startTime,
              rating: this.getRating(entry.startTime, [1800, 3000]),
              timestamp: Date.now()
            };
            
            console.log('FCP:', this.metrics.fcp);
          }
        });
      });
      
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    }
  }

  measureTTFB() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const ttfb = entry.responseStart - entry.requestStart;
            this.metrics.ttfb = {
              value: ttfb,
              rating: this.getRating(ttfb, [800, 1800]),
              timestamp: Date.now()
            };
            
            console.log('TTFB:', this.metrics.ttfb);
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    }
  }

  measurePageLoadMetrics() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      
      if (navigation) {
        this.metrics.pageLoad = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart,
          timestamp: Date.now()
        };
        
        console.log('Page Load Metrics:', this.metrics.pageLoad);
      }
    });
  }

  measureUserInteractions() {
    let interactionCount = 0;
    let totalDelay = 0;
    
    ['click', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const startTime = performance.now();
        
        requestAnimationFrame(() => {
          const endTime = performance.now();
          const delay = endTime - startTime;
          
          interactionCount++;
          totalDelay += delay;
          
          this.metrics.userInteractions = {
            count: interactionCount,
            averageDelay: totalDelay / interactionCount,
            lastInteraction: {
              type: eventType,
              delay: delay,
              timestamp: Date.now()
            }
          };
        });
      });
    });
  }

  setupErrorTracking() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now()
      });
    });
    
    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'promise',
        message: event.reason,
        timestamp: Date.now()
      });
    });
    
    // Resource loading errors
    document.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        this.trackError({
          type: 'resource',
          element: event.target.tagName,
          source: event.target.src || event.target.href,
          timestamp: Date.now()
        });
      }
    }, true);
  }

  trackError(error) {
    if (!this.metrics.errors) {
      this.metrics.errors = [];
    }
    
    this.metrics.errors.push(error);
    console.warn('Error tracked:', error);
  }

  getRating(value, thresholds) {
    if (value <= thresholds[0]) return 'good';
    if (value <= thresholds[1]) return 'needs-improvement';
    return 'poor';
  }

  scheduleReporting() {
    // Report metrics when page is about to be unloaded
    window.addEventListener('beforeunload', () => {
      this.reportMetrics();
    });
    
    // Also report periodically for long-running pages
    setInterval(() => {
      this.reportMetrics();
    }, 30000); // Every 30 seconds
  }

  reportMetrics() {
    const report = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      metrics: this.metrics
    };
    
    // Send to analytics service (placeholder)
    this.sendToAnalytics(report);
    
    // Log to console for debugging
    console.log('Performance Report:', report);
  }

  sendToAnalytics(data) {
    // This is a placeholder - implement your analytics service
    if ('navigator' in window && 'sendBeacon' in navigator) {
      navigator.sendBeacon('/api/analytics/performance', JSON.stringify(data));
    } else {
      // Fallback for older browsers
      fetch('/api/analytics/performance', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        },
        keepalive: true
      }).catch(console.error);
    }
  }

  // Public method to get current metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Public method to force a report
  forceReport() {
    this.reportMetrics();
  }

  // Cleanup method
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Initialize performance monitoring
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.performanceMonitor = new PerformanceMonitor();
  });
} else {
  window.performanceMonitor = new PerformanceMonitor();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
}
