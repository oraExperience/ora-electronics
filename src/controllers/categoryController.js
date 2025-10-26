
/**
 * Category Controller for Server-Side Rendering
 * Handles category pages with pre-loaded content for better SEO
 */
const productController = require('./productController');

/**
 * Render category page with server-side rendered content
 */
async function renderCategoryPage(req, res) {
  try {
    // Extract category from the URL path (e.g., /mobiles -> mobiles)
    const category = req.path.slice(1); // Remove leading slash
    const page = parseInt(req.query.page) || 1;
    const limit = 24;

    // Get category products for SSR
    let categoryProducts = [];
    let totalCount = 0;

    try {
      const searchReq = {
        query: {
          category: category,
          page: page,
          limit: limit
        }
      };

      categoryProducts = await new Promise((resolve) => {
        productController.searchProducts(searchReq, {
          json: resolve,
          status: () => ({ json: resolve })
        });
      });

      totalCount = Array.isArray(categoryProducts) ? categoryProducts.length : 0;
      
    } catch (error) {
      console.error('Error fetching category products:', error);
      categoryProducts = [];
    }

    // Generate category-specific content
    const categoryInfo = getCategoryInfo(category);
    
    // Generate the HTML with server-side rendered content
    const html = generateCategoryHTML({
      category,
      categoryInfo,
      products: Array.isArray(categoryProducts) ? categoryProducts : [],
      totalCount,
      currentPage: page
    });

    // Set proper headers for SEO
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=1800', // 30 minutes cache for category pages
      'Vary': 'Accept-Encoding'
    });

    res.send(html);

  } catch (error) {
    console.error('Error rendering category page:', error);
    res.status(500).send('Internal Server Error');
  }
}

/**
 * Get category-specific information and SEO content
 */
function getCategoryInfo(category) {
  if (!category || typeof category !== 'string') {
    return {
      title: 'Electronics',
      description: 'Explore electronics with best prices and deals from verified stores in India.',
      keywords: 'electronics, electronics price, electronics deals, electronics online India',
      brands: [],
      priceRanges: [],
      features: []
    };
  }
  
  const categoryData = {
    mobiles: {
      title: 'Mobile Phones',
      description: 'Discover the latest mobile phones from top brands like Samsung, Apple, OnePlus, Xiaomi, and more. Compare prices, specifications, and reviews from verified stores across India.',
      keywords: 'mobile phones, smartphones, android phones, iPhone, mobile price comparison, best mobile deals India',
      brands: ['Samsung', 'Apple', 'OnePlus', 'Xiaomi', 'Realme', 'Vivo', 'Oppo', 'Nothing'],
      priceRanges: [
        { label: 'Under ₹10,000', url: '/mobiles-under-10000' },
        { label: 'Under ₹20,000', url: '/mobiles-under-20000' },
        { label: 'Under ₹30,000', url: '/mobiles-under-30000' },
        { label: 'Under ₹50,000', url: '/mobiles-under-50000' }
      ],
      features: [
        'Latest Android and iOS smartphones',
        'Compare prices from verified retailers',
        'Detailed specifications and reviews',
        'Best deals and offers in India',
        'Fast delivery and genuine products'
      ]
    },
    laptops: {
      title: 'Laptops',
      description: 'Find the perfect laptop for work, gaming, or study. Compare prices and specifications from top brands like Dell, HP, Lenovo, Apple MacBook, and more.',
      keywords: 'laptops, gaming laptops, business laptops, MacBook, laptop price comparison, best laptop deals India',
      brands: ['Dell', 'HP', 'Lenovo', 'Apple', 'Asus', 'Acer', 'MSI', 'Alienware'],
      priceRanges: [
        { label: 'Under ₹30,000', url: '/laptops-under-30000' },
        { label: 'Under ₹50,000', url: '/laptops-under-50000' },
        { label: 'Under ₹70,000', url: '/laptops-under-70000' },
        { label: 'Under ₹1,00,000', url: '/laptops-under-100000' }
      ],
      features: [
        'Gaming and business laptops',
        'Compare specifications and prices',
        'Student and professional laptops',
        'MacBook and Windows laptops',
        'Best deals from trusted sellers'
      ]
    },
    tvs: {
      title: 'Smart TVs',
      description: 'Explore the latest smart TVs with 4K, OLED, and LED displays from Samsung, LG, Sony, Mi, and more. Find the best TV deals and compare prices.',
      keywords: 'smart TVs, 4K TVs, OLED TVs, LED TVs, TV price comparison, best TV deals India',
      brands: ['Samsung', 'LG', 'Sony', 'Mi', 'OnePlus', 'TCL', 'Hisense', 'Philips'],
      priceRanges: [
        { label: 'Under ₹15,000', url: '/tvs-under-15000' },
        { label: 'Under ₹25,000', url: '/tvs-under-25000' },
        { label: 'Under ₹50,000', url: '/tvs-under-50000' },
        { label: 'Under ₹1,00,000', url: '/tvs-under-100000' }
      ],
      features: [
        '4K and Full HD smart TVs',
        'OLED and QLED displays',
        'Android TV and webOS',
        'Compare prices and features',
        'Best deals from verified stores'
      ]
    },
    accessories: {
      title: 'Mobile Accessories',
      description: 'Find mobile accessories including cases, chargers, headphones, screen protectors, and more. Compare prices from top brands and retailers.',
      keywords: 'mobile accessories, phone cases, chargers, headphones, screen protectors, mobile accessories online India',
      brands: ['Apple', 'Samsung', 'Boat', 'JBL', 'Realme', 'Mi', 'OnePlus', 'Spigen'],
      priceRanges: [
        { label: 'Under ₹500', url: '/accessories-under-500' },
        { label: 'Under ₹1,000', url: '/accessories-under-1000' },
        { label: 'Under ₹2,000', url: '/accessories-under-2000' },
        { label: 'Under ₹5,000', url: '/accessories-under-5000' }
      ],
      features: [
        'Phone cases and covers',
        'Wireless and wired chargers',
        'Headphones and earbuds',
        'Screen protectors and stands',
        'Genuine accessories with warranty'
      ]
    }
  };

  return categoryData[category.toLowerCase()] || {
    title: capitalizeFirst(category),
    description: `Explore ${category} with best prices and deals from verified stores in India.`,
    keywords: `${category}, ${category} price, ${category} deals, ${category} online India`,
    brands: [],
    priceRanges: [],
    features: []
  };
}

/**
 * Generate complete HTML for category page
 */
function generateCategoryHTML({ category, categoryInfo, products, totalCount, currentPage }) {
  const pageTitle = `${categoryInfo.title} - Best Prices & Deals | ora`;
  const safeCategory = category || 'electronics';
  const canonicalUrl = `https://electronics-63ec.onrender.com/${safeCategory.toLowerCase()}`;

  // Generate structured data
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${categoryInfo.title} Collection`,
      "description": categoryInfo.description,
      "url": canonicalUrl,
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": totalCount,
        "itemListElement": products.slice(0, 12).map((product, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Product",
            "name": product.name,
            "url": `https://electronics-63ec.onrender.com/product/${product.key_name}`,
            "image": product.image,
            "offers": {
              "@type": "Offer",
              "price": product.min_price,
              "priceCurrency": "INR",
              "availability": "https://schema.org/InStock"
            }
          }
        }))
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
          "name": categoryInfo.title,
          "item": canonicalUrl
        }
      ]
    }
  ];

  // Generate products HTML
  const productsHTML = products.map(product => `
    <div class="group bg-white rounded-lg border border-gray-200 shadow-sm hover:border-[#ea2832] hover:bg-[#fdf4f4] hover:shadow-lg hover:shadow-[#ea2832]/40 transition-shadow duration-200 cursor-pointer p-3 grid grid-rows-[auto_1fr] gap-2 relative" onclick="window.location.href='/product/${product.key_name}'">
      <span class="absolute top-3 right-3 px-2 py-1 text-white text-xs font-medium z-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600">
        ₹${product.min_price ? Number(product.min_price).toLocaleString('en-IN') : 'N/A'}
      </span>
      
      <div class="w-full bg-center bg-no-repeat aspect-square bg-contain rounded-lg bg-white transition-colors duration-200 group-hover:bg-[#fdf4f4]" style='background-image: url("${product.image || ''}");' alt="${escapeHtml(product.name)}"></div>

      <div class="grid gap-1">
        <h3 class="text-[#1b0e0e] text-sm font-medium leading-normal line-clamp-2">${escapeHtml(product.name)}</h3>
        <p class="text-[#994d51] text-xs leading-normal">Available in ${product.store_count || 0} stores</p>
      </div>
    </div>
  `).join('');

  // Generate brand links
  const brandLinksHTML = categoryInfo.brands.map(brand => `
    <a href="/search?q=${encodeURIComponent(brand + ' ' + category)}" class="inline-block px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:border-[#ea2832] hover:bg-[#fdf4f4] transition-colors">
      ${brand}
    </a>
  `).join('');

  // Generate price range links
  const priceRangeHTML = categoryInfo.priceRanges.map(range => `
    <a href="${range.url}" class="inline-block px-4 py-2 text-sm bg-[#ea2832] text-white rounded-lg hover:bg-[#d91e28] transition-colors">
      ${range.label}
    </a>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
  <meta name="theme-color" content="#ea2832">
  
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(categoryInfo.description)}">
  <meta name="keywords" content="${escapeHtml(categoryInfo.keywords)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(categoryInfo.description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ora">
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  ${JSON.stringify(structuredData, null, 2)}
  </script>
  
  <link rel="icon" href="/ora-favicon.png">
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  
  <style>
    .line-clamp-2 {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
  </style>
</head>
<body class="bg-[#fcf8f8]" style='font-family: Lexend, "Noto Sans", sans-serif;'>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="bg-white border-b border-[#e7d0d1] px-4 py-3">
      <div class="max-w-[1320px] mx-auto flex items-center justify-between">
        <a href="/" class="flex items-center gap-2 text-[#1b0e0e]">
          <img src="/ora-favicon.png" alt="ora" class="w-8 h-8">
          <h1 class="text-xl font-bold">ora</h1>
        </a>
        <a href="/search" class="px-4 py-2 bg-[#ea2832] text-white rounded-lg hover:bg-[#d91e28]">
          Search Products
        </a>
      </div>
    </header>

    <div class="max-w-[1320px] mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <nav class="mb-6 text-sm">
        <a href="/" class="text-[#994d51] hover:text-[#ea2832]">Home</a>
        <span class="mx-2">›</span>
        <span class="text-[#1b0e0e] font-medium">${escapeHtml(categoryInfo.title)}</span>
      </nav>

      <!-- Hero Section -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-[#1b0e0e] mb-4">${escapeHtml(categoryInfo.title)}</h1>
        <p class="text-lg text-[#994d51] mb-6">${escapeHtml(categoryInfo.description)}</p>
        
        <!-- Key Features -->
        ${categoryInfo.features.length > 0 ? `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          ${categoryInfo.features.map(feature => `
            <div class="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <div class="w-2 h-2 bg-[#ea2832] rounded-full"></div>
              <span class="text-sm text-[#1b0e0e]">${escapeHtml(feature)}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>

      <!-- Popular Brands -->
      ${categoryInfo.brands.length > 0 ? `
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Popular Brands</h2>
        <div class="flex flex-wrap gap-3">
          ${brandLinksHTML}
        </div>
      </div>
      ` : ''}

      <!-- Price Ranges -->
      ${categoryInfo.priceRanges.length > 0 ? `
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Shop by Price</h2>
        <div class="flex flex-wrap gap-3">
          ${priceRangeHTML}
        </div>
      </div>
      ` : ''}

      <!-- Products Grid -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-6">Latest ${escapeHtml(categoryInfo.title)} (${totalCount} products)</h2>
        <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          ${productsHTML}
        </div>
        
        ${products.length === 0 ? `
        <div class="text-center py-12">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p class="text-gray-600">Check back soon for new ${category} products!</p>
        </div>
        ` : ''}
      </div>

      <!-- Load More -->
      ${products.length >= 24 ? `
      <div class="text-center">
        <a href="/search?category=${encodeURIComponent(category)}" class="inline-block px-6 py-3 bg-[#ea2832] text-white rounded-lg hover:bg-[#d91e28] transition-colors">
          View All ${escapeHtml(categoryInfo.title)}
        </a>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
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
  renderCategoryPage
};
