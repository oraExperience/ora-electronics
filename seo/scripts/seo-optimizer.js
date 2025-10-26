
// SEO Optimizer - Dynamic Meta Tags and Structured Data Updates
class SEOOptimizer {
  constructor() {
    this.baseUrl = 'https://electronics-63ec.onrender.com';
  }

  // Update page title dynamically
  updateTitle(title) {
    document.title = title;
    this.updateMetaTag('og:title', title);
    this.updateMetaTag('twitter:title', title);
  }

  // Update meta description
  updateDescription(description) {
    this.updateMetaTag('description', description);
    this.updateMetaTag('og:description', description);
    this.updateMetaTag('twitter:description', description);
  }

  // Update canonical URL
  updateCanonical(url) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.href = url;
    } else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = url;
      document.head.appendChild(canonical);
    }
    this.updateMetaTag('og:url', url);
  }

  // Update meta tag helper
  updateMetaTag(name, content) {
    let selector = `meta[name="${name}"]`;
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      selector = `meta[property="${name}"], meta[name="${name}"]`;
    }
    
    let meta = document.querySelector(selector);
    if (meta) {
      meta.content = content;
    } else {
      meta = document.createElement('meta');
      if (name.startsWith('og:')) {
        meta.property = name;
      } else {
        meta.name = name;
      }
      meta.content = content;
      document.head.appendChild(meta);
    }
  }

  // Update product structured data
  updateProductSchema(product) {
    const schema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name || "Mobile Phone",
      "image": product.image || `${this.baseUrl}/product-default.jpg`,
      "description": product.description || `${product.name} - Latest specifications, price comparison, and reviews from verified stores in India.`,
      "brand": {
        "@type": "Brand",
        "name": product.brand || "Brand Name"
      },
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": product.min_price || "10000",
        "highPrice": product.max_price || product.min_price || "10000",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "Ora"
        }
      }
    };

    // Add rating if available
    if (product.rating && product.review_count) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.review_count
      };
    }

    // Add specifications if available
    if (product.specifications) {
      try {
        const specs = typeof product.specifications === 'string' 
          ? JSON.parse(product.specifications) 
          : product.specifications;
        
        schema.additionalProperty = Object.entries(specs).map(([key, value]) => ({
          "@type": "PropertyValue",
          "name": key,
          "value": value
        }));
      } catch (e) {
        console.warn('Could not parse product specifications for schema');
      }
    }

    this.updateSchemaScript('product-schema', schema);
  }

  // Update breadcrumb structured data
  updateBreadcrumbSchema(breadcrumbs) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        ...(crumb.url && { "item": crumb.url })
      }))
    };

    this.updateSchemaScript('breadcrumb-schema', schema);
  }

  // Update schema script helper
  updateSchemaScript(id, schema) {
    let script = document.getElementById(id);
    if (script) {
      script.textContent = JSON.stringify(schema, null, 2);
    } else {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema, null, 2);
      document.head.appendChild(script);
    }
  }

  // Optimize product page SEO
  optimizeProductPage(product) {
    if (!product) return;

    // Update title
    const title = `${product.name} - Price ₹${product.min_price ? Number(product.min_price).toLocaleString('en-IN') : 'N/A'}, Specs & Reviews | Buy from Verified Stores | Ora`;
    this.updateTitle(title);

    // Update description
    const description = `${product.name} at best price ₹${product.min_price ? Number(product.min_price).toLocaleString('en-IN') : 'N/A'} in India. Check specifications, reviews, and buy from verified stores near you. EMI options available.`;
    this.updateDescription(description);

    // Update canonical URL
    const canonicalUrl = `${this.baseUrl}/products?name=${product.key_name}`;
    this.updateCanonical(canonicalUrl);

    // Update Open Graph image
    if (product.image) {
      this.updateMetaTag('og:image', product.image);
      this.updateMetaTag('twitter:image', product.image);
    }

    // Update product schema
    this.updateProductSchema(product);

    // Update breadcrumb schema
    const breadcrumbs = [
      { name: "Home", url: `${this.baseUrl}/` },
      { name: product.parent_category_name || "Mobiles", url: `${this.baseUrl}/mobiles` },
      { name: product.sub_category_name || "Smartphones", url: `${this.baseUrl}/smartphones` },
      { name: product.vertical_name || product.name }
    ];
    this.updateBreadcrumbSchema(breadcrumbs);

    // Update keywords
    const keywords = [
      product.name,
      `${product.name} price`,
      `${product.name} specifications`,
      `${product.name} reviews`,
      `buy ${product.name} online`,
      product.brand,
      `${product.brand} mobiles`,
      'mobile phone India',
      'smartphone deals',
      'verified mobile stores'
    ].join(', ');
    this.updateMetaTag('keywords', keywords);
  }

  // Add hreflang tags for multi-language support
  addHreflangTags() {
    const hreflangs = [
      { lang: 'en-IN', url: window.location.href },
      { lang: 'hi-IN', url: window.location.href + '?lang=hi' }
    ];

    hreflangs.forEach(({ lang, url }) => {
      let link = document.querySelector(`link[hreflang="${lang}"]`);
      if (!link) {
        link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = lang;
        link.href = url;
        document.head.appendChild(link);
      }
    });
  }

  // Add critical performance hints
  addPerformanceHints() {
    // Add DNS prefetch for external domains
    const domains = ['fonts.googleapis.com', 'fonts.gstatic.com'];
    domains.forEach(domain => {
      if (!document.querySelector(`link[href="//${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = `//${domain}`;
        document.head.appendChild(link);
      }
    });

    // Add preload for critical images
    const criticalImages = document.querySelectorAll('img[loading="eager"], img.hero-image');
    criticalImages.forEach(img => {
      if (img.src && !document.querySelector(`link[href="${img.src}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = img.src;
        document.head.appendChild(link);
      }
    });
  }

  // Initialize SEO optimizations
  init() {
    // Add performance hints
    this.addPerformanceHints();
    
    // Add hreflang tags
    this.addHreflangTags();

    // Optimize images with lazy loading and proper alt text
    this.optimizeImages();

    // Add viewport meta if missing
    if (!document.querySelector('meta[name="viewport"]')) {
      this.updateMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=5');
    }
  }

  // Optimize images for SEO
  optimizeImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Add lazy loading for non-critical images
      if (!img.hasAttribute('loading') && !img.classList.contains('hero-image')) {
        img.loading = 'lazy';
      }

      // Improve alt text if missing or generic
      if (!img.alt || img.alt === 'image' || img.alt === 'photo') {
        const src = img.src;
        if (src.includes('mobile') || src.includes('phone')) {
          img.alt = 'Mobile Phone - Best Price and Specifications';
        } else if (src.includes('laptop')) {
          img.alt = 'Laptop - Compare Prices and Features';
        } else if (src.includes('tv')) {
          img.alt = 'TV - Latest Models and Deals';
        } else {
          img.alt = 'Electronics Product - Best Deals Online';
        }
      }
    });
  }
}

// Export for use in other scripts
window.SEOOptimizer = SEOOptimizer;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const seoOptimizer = new SEOOptimizer();
    seoOptimizer.init();
  });
} else {
  const seoOptimizer = new SEOOptimizer();
  seoOptimizer.init();
}
