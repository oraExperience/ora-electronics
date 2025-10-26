
/**
 * Search Controller for Server-Side Rendering
 * Handles search page rendering with pre-loaded content for better SEO
 */
const productController = require('./productController');

/**
 * Render search page with server-side rendered content
 */
async function renderSearchPage(req, res) {
  try {
    const query = req.query.q || '';
    const category = req.query.category || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 20;

    // Get initial products for SSR
    let initialProducts = [];
    let totalCount = 0;
    let popularPills = [];

    try {
      // If there's a search query, get search results
      if (query || category) {
        const searchReq = {
          query: {
            q: query,
            category: category,
            page: page,
            limit: limit
          }
        };
        
        const mockRes = {
          json: (data) => data,
          status: () => mockRes
        };

        initialProducts = await new Promise((resolve) => {
          productController.searchProducts(searchReq, {
            json: resolve,
            status: () => ({ json: resolve })
          });
        });

        totalCount = initialProducts.length;
      } else {
        // Get popular products for homepage
        const allProductsReq = { query: { page: 1, limit: limit } };
        const mockRes = { json: (data) => data, status: () => mockRes };
        
        initialProducts = await new Promise((resolve) => {
          productController.searchProducts(allProductsReq, {
            json: resolve,
            status: () => ({ json: resolve })
          });
        });
      }

      // Get popular search pills
      try {
        popularPills = await new Promise((resolve) => {
          productController.getPopularPills({ query: {} }, {
            json: resolve,
            status: () => ({ json: resolve })
          });
        });
      } catch (e) {
        console.error('Error fetching popular pills:', e);
        popularPills = [];
      }

    } catch (error) {
      console.error('Error fetching search data:', error);
      initialProducts = [];
    }

    // Generate the HTML with server-side rendered content
    const html = generateSearchHTML({
      query,
      category,
      initialProducts: Array.isArray(initialProducts) ? initialProducts : [],
      popularPills: Array.isArray(popularPills) ? popularPills : [],
      totalCount,
      currentPage: page
    });

    // Set proper headers for SEO
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300', // 5 minutes cache for search results
      'Vary': 'Accept-Encoding'
    });

    res.send(html);

  } catch (error) {
    console.error('Error rendering search page:', error);
    res.status(500).send('Internal Server Error');
  }
}

/**
 * Generate complete HTML with server-side rendered content
 */
function generateSearchHTML({ query, category, initialProducts, popularPills, totalCount, currentPage }) {
  const pageTitle = query
    ? `${capitalizeFirst(query)} - Search Results | ora`
    : category
    ? `${capitalizeFirst(category)} - Browse Category | ora`
    : 'Search Mobiles - Compare Prices from Verified Stores | ora';

  const pageDescription = query
    ? `Search results for "${query}" - Find ${query} at best prices from verified stores in India. Compare specifications, reviews and deals.`
    : category
    ? `Browse ${category} category - Compare prices, specifications and reviews from trusted sellers in India.`
    : 'Search and compare mobile phone prices from verified stores in India. Find best deals on latest smartphones with reviews and specifications.';

  const keywords = query
    ? `${query}, ${query} price, ${query} specifications, ${query} reviews, buy ${query} online India`
    : category
    ? `${category}, ${category} prices, ${category} deals, ${category} online India`
    : 'mobile search India, compare mobile prices, smartphone deals, mobile phone search, best mobile offers';

  const canonicalUrl = query
    ? `https://electronics-63ec.onrender.com/search?q=${encodeURIComponent(query)}`
    : category
    ? `https://electronics-63ec.onrender.com/search?category=${encodeURIComponent(category)}`
    : 'https://electronics-63ec.onrender.com/search';

  // Generate structured data for the search page
  const structuredData = generateSearchStructuredData({ query, category, initialProducts, totalCount });

  // Generate popular pills HTML matching the original format
  const popularPillsHTML = popularPills.slice(0, 4).map(pill => `
    <button type="button" class="popular-search-tab rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm  px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]">
      ${escapeHtml(pill.name)}
    </button>
  `).join('');

  return `
<html lang="en-IN">
  <head>
    <!-- Essential Meta Tags -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
    <meta name="theme-color" content="#ea2832">
    
    <!-- SEO Meta Tags -->
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(pageDescription)}">
    <meta name="keywords" content="${escapeHtml(keywords)}">
    <meta name="author" content="ora">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">
    
    <!-- Open Graph Tags -->
    <meta property="og:site_name" content="ora">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(pageDescription)}">
    <meta property="og:image" content="https://electronics-63ec.onrender.com/ora-search-social.jpg">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:locale" content="en_IN">
    
    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
    <meta name="twitter:description" content="${escapeHtml(pageDescription)}">
    <meta name="twitter:image" content="https://electronics-63ec.onrender.com/ora-search-social.jpg">
    
    <!-- Mobile App Tags -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="ora Search">
    
    <!-- Preload Critical Resources -->
    <link rel="preload" href="ora-favicon.png" as="image">
    <link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin="">
    <link rel="dns-prefetch" href="//fonts.googleapis.com">

    <link
      rel="stylesheet"
      as="style"
      onload="this.rel='stylesheet'"
      href="https://fonts.googleapis.com/css2?display=swap&family=Lexend%3Awght%40400%3B500%3B700%3B900&family=Noto+Sans%3Awght%40400%3B500%3B700%3B900"
    />

    <link rel="icon" type="image/png" href="ora-favicon.png" />
    
    <!-- Structured Data - WebSite Search -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "ora",
      "url": "https://electronics-63ec.onrender.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://electronics-63ec.onrender.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
    </script>
    
    <!-- FAQ Structured Data for Voice Search -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [{
        "@type": "Question",
        "name": "What is the best mobile phone under 50000 in India?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Top mobiles under ₹50,000 in India include Samsung Galaxy S23, OnePlus 11, iPhone 14, and Google Pixel 7. These phones offer flagship features, excellent cameras, and reliable performance."
        }
      }, {
        "@type": "Question",
        "name": "Which mobile has the best camera under 30000?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "For best camera phones under ₹30,000, consider Samsung Galaxy A54, OnePlus Nord 3, and Xiaomi 13 Lite. These phones offer excellent photography features including night mode and AI enhancement."
        }
      }, {
        "@type": "Question",
        "name": "Where can I buy mobiles online in India?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can buy mobiles online from verified stores on ora. We connect you with trusted sellers offering competitive prices, genuine products, and reliable service across India."
        }
      }]
    }
    </script>

    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <script src="seo/scripts/seo-optimizer.js"></script>

    <style>
      .no-scrollbar {
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
      }
      .no-scrollbar::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera*/
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
  </head>

  </head>
  <body>

    <body>
      <div
        class="relative flex size-full min-h-screen flex-col bg-[#fcf8f8] justify-between group/design-root overflow-x-hidden"
        style='font-family: Lexend, "Noto Sans", sans-serif;'
      >
        <div>
  <div class="relative overflow-visible mx-auto max-w-[1320px] px-2 sm:px-8 xl:px-16">

        <div class="flex items-center bg-[#fcf8f8] pt-4 pb-2 gap-2 sticky top-0 z-50 ">
          <!-- Left: Logo Only -->
                    <a href="/search" class="flex items-center cursor-pointer">
            <img src="ora-favicon.png" alt="ora logo" class="h-7 w-auto mr-1 align-middle inline-block" />
            <span class="hidden sm:inline-block text-[#1b0e0e] text-lg font-bold leading-tight tracking-[-0.015em] min-w-max align-middle inline-block">ora</span></a>
          <!-- Responsive Search Bar -->
          <div class="flex-1 flex items-center">
                          <div class="relative w-full">
                <input
                  type="text"

autofocus

                  placeholder="Search for mobiles"
                  class="w-full rounded-lg border border-[#e7d0d1] pl-10 pr-10 py-2 text-sm bg-white focus:outline-none focus:ring-0 focus:border-black text-[#1b0e0e]"
                  style="font-family: inherit;"
                  value="${escapeHtml(query)}"
                />
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#994d51]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                  </svg>
                </span>

                <button id="clear-search" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"></path></svg>
                </button>

              </div>
          </div>
        </div>
        <h3 class="font-semibold text-sm sm:text-lg text-gray-900 leading-tight tracking-[-0.015em]  pt-2">Your recent searches</h3>
        <div class="flex flex-row flex-wrap gap-2  pb-2 pt-2" id="recent-searches-tabs">
          <button type="button" class="recent-search-tab rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm  px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]">
            iPhone 14 Pro Max
          </button>
          <button type="button" class="recent-search-tab rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm  px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]">
            Samsung Galaxy S23 Ultra
          </button>
          <button type="button" class="recent-search-tab rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm  px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]">
            OnePlus 11
          </button>
          <button type="button" class="recent-search-tab rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm  px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]">
            Google Pixel 7 Pro
          </button>
        </div>
        <h3 class="font-semibold text-sm sm:text-lg text-gray-900 leading-tight tracking-[-0.015em] pt-2">Popular searches near you</h3>
        <div class="flex flex-row flex-wrap gap-2  pb-4 pt-2" id="popular-searches-tabs">
          ${popularPillsHTML || `
          <button type="button" class="popular-search-tab rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm  px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]">
            iPhone under 50k near you
          </button>
          <button type="button" class="popular-search-tab rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm  px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]">
            Samsung phones with best camera
          </button>
          <button type="button" class="popular-search-tag rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm  px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]">
            OnePlus phones with fast charging
          </button>
          <button type="button" class="popular-search-tab rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm  px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]">
            Google Pixel phones with best battery
          </button>`}
        </div>
        <!-- Include recent-searches.js script -->
        <script src="src/recent-searches.js"></script>
        <script src="src/search.js"></script>

<!-- Recommended Pills Bar -->
<div class="flex flex-row flex-wrap gap-2 pb-2 pt-2" id="recommended-pills-bar" style="display:none;">
  <button type="button" class="recent-search-tab rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm  px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]">
    Best under 50k
  </button>
  <button type="button" class="recent-search-tab rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm  px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]">
    Flagship Camera
  </button>
  <button type="button" class="recent-search-tab rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm  px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]">
    Long Battery Life
  </button>
  <button type="button" class="recent-search-tab rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm  px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]">
    Best Gaming Phones
  </button>
</div>
<!-- Search Results Text -->
<h3 id="search-results-text" class="font-semibold text-sm sm:text-lg text-gray-900 leading-tight tracking-[-0.015em] pt-2 pb-4" style="display:none;">Showing results for ""</h3>

        <div id="search-results-grid" class="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(158px,1fr))] md:grid-cols-5 gap-2 sm:gap-4 max-w-[1250px] mx-auto"></div>

        <!-- Blank space at the end of the page -->
        <div class="w-full h-32 bg-[#fcf8f8]"></div>

      <script>
        // Function to update page title based on search term
        function updatePageTitle(searchTerm) {
          document.title = searchTerm ? \`ora | Buy \${searchTerm}\` : 'ora | Buy Mobiles';
        }
        
        document.addEventListener('DOMContentLoaded', () => {
          const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]');
          const clearButton = document.getElementById('clear-search');

          const urlParams = new URLSearchParams(window.location.search);
          const query = urlParams.get('q');

          if (query) {
            searchInput.value = query;
            clearButton.style.display = 'block';
            searchInput.focus();
            // Move cursor to the end of the input
            const end = searchInput.value.length;
            searchInput.setSelectionRange(end, end);
            // Update title with search term
            updatePageTitle(query);
          }

          // Update title when search input changes
          searchInput.addEventListener('input', (e) => {
            const term = e.target.value.trim();
            updatePageTitle(term);
          });

          clearButton.addEventListener('click', () => {
            updatePageTitle(''); // Reset title when search is cleared
            window.history.back();
          });
        });
      </script>
      
      <!-- Initialize with server-side data -->
      <script>
        window.initialSearchData = {
          query: "${escapeHtml(query)}",
          category: "${escapeHtml(category)}",
          products: ${JSON.stringify(initialProducts)},
          popularPills: ${JSON.stringify(popularPills)},
          totalCount: ${totalCount}
        };
      </script>

          </div>
        </div>

        </div>
      </div>
    </div>
  </body>
</html>`;
}

/**
 * Generate structured data for search page
 */
function generateSearchStructuredData({ query, category, initialProducts, totalCount }) {
  const baseStructuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "ora",
      "url": "https://electronics-63ec.onrender.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://electronics-63ec.onrender.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "ora",
      "url": "https://electronics-63ec.onrender.com",
      "logo": "https://electronics-63ec.onrender.com/ora-favicon.png"
    }
  ];

  if (query && initialProducts.length > 0) {
    // Add SearchResultsPage structured data
    baseStructuredData.push({
      "@context": "https://schema.org",
      "@type": "SearchResultsPage",
      "name": `Search results for "${query}"`,
      "description": `Find ${query} at best prices from verified stores`,
      "url": `https://electronics-63ec.onrender.com/search?q=${encodeURIComponent(query)}`,
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": totalCount,
        "itemListElement": initialProducts.slice(0, 10).map((product, index) => ({
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
    });
  }

  return baseStructuredData;
}

/**
 * Utility functions
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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
  renderSearchPage
};
