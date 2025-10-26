
class ImageOptimizer {
  constructor() {
    this.observer = null;
    this.loadedImages = new Set();
    this.retryCount = new Map();
    this.maxRetries = 3;
    this.init();
  }

  init() {
    this.setupLazyLoading();
    this.optimizeExistingImages();
    this.setupImageErrorHandling();
    this.preloadCriticalImages();
  }

  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      // Observe all images with data-src
      document.querySelectorAll('img[data-src]').forEach(img => {
        this.observer.observe(img);
      });
    } else {
      // Fallback for older browsers
      this.loadAllImages();
    }
  }

  loadImage(img) {
    const src = img.dataset.src;
    if (!src || this.loadedImages.has(src)) return;

    // Create a new image to test loading
    const imageLoader = new Image();
    
    imageLoader.onload = () => {
      img.src = src;
      img.classList.add('loaded');
      this.loadedImages.add(src);
      
      // Remove data-src to prevent reprocessing
      delete img.dataset.src;
      
      // Add fade-in animation
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease-in-out';
      
      requestAnimationFrame(() => {
        img.style.opacity = '1';
      });
    };

    imageLoader.onerror = () => {
      this.handleImageError(img, src);
    };

    imageLoader.src = src;
  }

  handleImageError(img, src) {
    const retries = this.retryCount.get(src) || 0;
    
    if (retries < this.maxRetries) {
      this.retryCount.set(src, retries + 1);
      
      // Retry after a delay
      setTimeout(() => {
        this.loadImage(img);
      }, Math.pow(2, retries) * 1000); // Exponential backoff
    } else {
      // Use placeholder image
      img.src = this.getPlaceholderImage(img);
      img.alt = 'Image not available';
      img.classList.add('error');
    }
  }

  getPlaceholderImage(img) {
    const width = img.dataset.width || 300;
    const height = img.dataset.height || 300;
    
    // Create a simple SVG placeholder
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">
          Image not available
        </text>
      </svg>
    `)}`;
  }

  optimizeExistingImages() {
    document.querySelectorAll('img:not([data-src])').forEach(img => {
      this.addImageOptimizations(img);
    });
  }

  addImageOptimizations(img) {
    // Add loading="lazy" if not present
    if (!img.hasAttribute('loading')) {
      img.loading = 'lazy';
    }

    // Add proper alt text if missing
    if (!img.alt || img.alt.trim() === '') {
      img.alt = this.generateAltText(img);
    }

    // Add proper dimensions if missing
    if (!img.width && !img.height) {
      this.addDimensions(img);
    }

    // Convert to WebP if supported
    this.maybeConvertToWebP(img);
  }

  generateAltText(img) {
    const src = img.src || img.dataset.src || '';
    const filename = src.split('/').pop().split('.')[0];
    
    // Try to extract meaningful text from filename
    const altText = filename
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    return altText || 'Product image';
  }

  addDimensions(img) {
    // Set default dimensions for better CLS
    if (img.classList.contains('product-image')) {
      img.width = 300;
      img.height = 300;
    } else if (img.classList.contains('logo')) {
      img.width = 120;
      img.height = 40;
    }
  }

  maybeConvertToWebP(img) {
    if (this.supportsWebP() && img.src && !img.src.includes('.webp')) {
      const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      
      // Test if WebP version exists
      const testImg = new Image();
      testImg.onload = () => {
        img.src = webpSrc;
      };
      testImg.onerror = () => {
        // WebP version doesn't exist, keep original
      };
      testImg.src = webpSrc;
    }
  }

  supportsWebP() {
    if (this._webpSupport !== undefined) {
      return this._webpSupport;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    this._webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    return this._webpSupport;
  }

  preloadCriticalImages() {
    // Preload above-the-fold images
    const criticalImages = [
      '/ora-favicon.png',
      // Add other critical images here
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  loadAllImages() {
    // Fallback for browsers without IntersectionObserver
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.loadImage(img);
    });
  }

  // Public method to optimize new images added dynamically
  optimizeNewImages(container = document) {
    container.querySelectorAll('img[data-src]').forEach(img => {
      if (this.observer) {
        this.observer.observe(img);
      } else {
        this.loadImage(img);
      }
    });

    container.querySelectorAll('img:not([data-src])').forEach(img => {
      this.addImageOptimizations(img);
    });
  }

  // Method to get image performance metrics
  getPerformanceMetrics() {
    return {
      loadedImages: this.loadedImages.size,
      retryAttempts: Array.from(this.retryCount.values()).reduce((a, b) => a + b, 0),
      webpSupported: this.supportsWebP(),
      observerSupported: 'IntersectionObserver' in window
    };
  }
}

// Initialize image optimizer when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.imageOptimizer = new ImageOptimizer();
  });
} else {
  window.imageOptimizer = new ImageOptimizer();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageOptimizer;
}
