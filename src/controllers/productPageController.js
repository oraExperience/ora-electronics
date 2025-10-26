
/**
 * Product Controller for Server-Side Rendering
 * Handles individual product page rendering with pre-loaded content for better SEO
 */
const db = require('../config/db');

/**
 * Render product page with server-side rendered SEO head + original products.html body
 */
async function renderProductPage(req, res) {
  try {
    const productName = req.params.productName;
    
    if (!productName) {
      return res.status(404).send('Product not found');
    }

    // Get product data from database
    let productData = null;
    try {
      const query = `
        SELECT
          p.*,
          v.name as vertical_name,
          c.name as category_name,
          (SELECT COUNT(*) FROM store_product_mapping spm WHERE spm.product_id = p.id) as store_count
        FROM products p
        LEFT JOIN vertical v ON p.vertical_id = v.id
        LEFT JOIN category c ON p.parent_category_id = c.id
        WHERE p.key_name = $1
        LIMIT 1
      `;
      
      const result = await db.query(query, [productName]);
      
      if (result.rows.length > 0) {
        productData = result.rows[0];
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
    }

    // If product not found, serve original products.html
    if (!productData) {
      return res.sendFile('products.html', { root: '.' });
    }

    // Read the original products.html file
    const fs = require('fs');
    const path = require('path');
    const originalHtml = fs.readFileSync(path.join(__dirname, '../../products.html'), 'utf8');

    // Generate dynamic SEO head content
    const dynamicHead = generateSEOHead(productData);
    
    // Replace the original head section with our dynamic one
    const updatedHtml = originalHtml.replace(
      /<head>[\s\S]*?<\/head>/i,
      dynamicHead
    );

    // Set proper headers for SEO
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate', // Same as original
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.send(updatedHtml);

  } catch (error) {
    console.error('Error rendering product page:', error);
    res.status(500).send('Internal Server Error');
  }
}

/**
 * Generate SEO head section with dynamic product data
 */
function generateSEOHead(product) {
  const pageTitle = `${product.name} - Price, Specs & Reviews | ora`;
  const pageDescription = `Get best price for ${product.name}. Compare specifications, read reviews and buy from verified stores in India. Starting from ₹${product.mrp ? Number(product.mrp).toLocaleString('en-IN') : 'N/A'}.`;
  const keywords = `${product.name}, ${product.name} price, ${product.name} specifications, ${product.name} reviews, buy ${product.name} online India, ${product.vertical_name || 'mobile'} price`;
  const canonicalUrl = `https://electronics-63ec.onrender.com/product/${product.key_name}`;

  // Generate structured data for the product
  const structuredData = generateProductStructuredData(product);

  return `<head>
    <!-- Essential Meta Tags -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
    <meta name="theme-color" content="#ea2832">
    
    <!-- SEO Meta Tags (dynamically updated by SSR) -->
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(pageDescription)}">
    <meta name="keywords" content="${escapeHtml(keywords)}">
    <meta name="author" content="ora">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">
    
    <!-- Open Graph Tags (dynamically updated by SSR) -->
    <meta property="og:site_name" content="ora">
    <meta property="og:type" content="product">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(pageDescription)}">
    <meta property="og:image" content="${product.image || 'https://electronics-63ec.onrender.com/product-default.jpg'}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:locale" content="en_IN">
    <meta property="product:price:amount" content="${product.mrp || '0'}">
    <meta property="product:price:currency" content="INR">
    
    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
    <meta name="twitter:description" content="${escapeHtml(pageDescription)}">
    <meta name="twitter:image" content="${product.image || 'https://electronics-63ec.onrender.com/product-default.jpg'}">
    
    <!-- Mobile App Tags -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="${escapeHtml(product.name)}">

    <!-- Preload Critical Resources -->
    <link rel="preload" href="/ora-favicon.png" as="image">
    <link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin="">
    <link rel="dns-prefetch" href="//fonts.googleapis.com">

    <link
      rel="stylesheet"
      as="style"
      onload="this.rel='stylesheet'"
      href="https://fonts.googleapis.com/css2?display=swap&family=Lexend%3Awght%40400%3B500%3B700%3B900&family=Noto+Sans%3Awght%40400%3B500%3B700%3B900"
    />

    <link rel="icon" type="image/png" href="/ora-favicon.png" />
    
    <!-- Structured Data for Product -->
    <script type="application/ld+json">
    ${JSON.stringify(structuredData, null, 2)}
    </script>

        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <script src="/src/api-cache-service.js"></script>
        <script src="/seo/scripts/seo-optimizer.js"></script>
    <script src="/src/product-data.js" defer></script>
    <script src="/src/product-images.js" defer></script>
    <script src="/src/product-variants.js" defer></script>
    <script src="/src/product-stores.js" defer></script>

    <script src="/src/product-page.js" defer></script>
    <script>
      // Update page title when product data is loaded
      document.addEventListener('DOMContentLoaded', () => {
        // Wait for product data to be available
        window.productDataModule.addEventListener('product-loaded', (data) => {
          if (data && data.name) {
            // Update page title with product name
            document.title = \`ora | \${data.name}\`;
          }
        });
      });
    </script>

    <script src="/src/search-transition.js" defer></script>

    <style>

      html, body {
        scroll-behavior: smooth !important;
      }

      #section-tabs {
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE and Edge */
      }
      #section-tabs::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
      }
      
    </style>

    <style>
      @media (max-width: 640px) {
  input[type="text"] {
    font-size: 12px !important;
  }
}
    </style>
    <style>
      body {
        visibility: hidden;
      }
    </style>
    
    <!-- Server-side data injection -->
    <script>
      window.serverProductData = ${JSON.stringify(product)};
      window.productKeyName = "${escapeHtml(product.key_name)}";
    </script>
  </head>`;
}

/**
 * Generate structured data for product page
 */
function generateProductStructuredData(product) {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": `${product.name} - Get best price, specifications, and reviews. Buy from verified stores in India.`,
      "image": product.image || "https://electronics-63ec.onrender.com/product-default.jpg",
      "url": `https://electronics-63ec.onrender.com/product/${product.key_name}`,
      "brand": {
        "@type": "Brand",
        "name": product.name.split(' ')[0] // First word as brand
      },
      "category": product.category_name || product.vertical_name || "Mobile Phone",
      "offers": {
        "@type": "Offer",
        "price": product.mrp || "0",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "ora"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.5",
        "reviewCount": "100"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://electronics-63ec.onrender.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Search",
          "item": "https://electronics-63ec.onrender.com/search"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": product.vertical_name || product.name,
          "item": `https://electronics-63ec.onrender.com/product/${product.key_name}`
        }
      ]
    }
  ];

  return structuredData;
}

/**
 * Utility function to escape HTML
 */
function escapeHtml(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

module.exports = {
  renderProductPage
};
