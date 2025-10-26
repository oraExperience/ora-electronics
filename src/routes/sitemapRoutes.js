
/**
 * Sitemap Routes for Dynamic SEO Sitemap Generation
 * Generates XML sitemaps with actual product data from database
 */
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

/**
 * Generate main sitemap index
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://electronics-63ec.onrender.com/sitemap-main.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://electronics-63ec.onrender.com/sitemap-products.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://electronics-63ec.onrender.com/sitemap-categories.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://electronics-63ec.onrender.com/sitemap-search.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
</sitemapindex>`;

    res.set({
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    });
    res.send(sitemapIndex);
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * Generate main pages sitemap
 */
router.get('/sitemap-main.xml', (req, res) => {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const mainSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://electronics-63ec.onrender.com/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://electronics-63ec.onrender.com/search</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://electronics-63ec.onrender.com/mobiles</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://electronics-63ec.onrender.com/laptops</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://electronics-63ec.onrender.com/tvs</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://electronics-63ec.onrender.com/accessories</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(mainSitemap);
});

/**
 * Generate comprehensive products sitemap with ALL products from database
 */
router.get('/sitemap-products.xml', async (req, res) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const db = require('../config/db');
    
    // Get ALL products directly from database
    const query = `
      SELECT
        p.key_name,
        p.name,
        p.image,
        p.mrp,
        p.rating,
        pc.name as parent_category_name,
        sc.name as sub_category_name,
        CURRENT_DATE as created_at
      FROM products p
      LEFT JOIN category pc ON p.parent_category_id = pc.id
      LEFT JOIN category sc ON p.sub_category_id = sc.id
      WHERE p.key_name IS NOT NULL
      ORDER BY p.rating DESC NULLS LAST, p.mrp ASC NULLS LAST
      LIMIT 10000
    `;
    
    const result = await db.query(query);
    const products = result.rows || [];
    
    console.log(`Generating sitemap for ${products.length} products`);

    let productUrls = '';
    if (Array.isArray(products) && products.length > 0) {
      productUrls = products.map(product => {
        const priority = calculateProductPriority(product);
        const changefreq = getChangeFrequency(product);
        
        return `
  <url>
    <loc>https://electronics-63ec.onrender.com/product/${encodeURIComponent(product.key_name)}</loc>
    <lastmod>${product.created_at ? new Date(product.created_at).toISOString().split('T')[0] : currentDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    ${product.image ? `
    <image:image>
      <image:loc>${escapeXml(product.image)}</image:loc>
      <image:title>${escapeXml(product.name)}</image:title>
      <image:caption>${escapeXml(product.name)} - ${product.parent_category_name || 'Electronics'}</image:caption>
    </image:image>` : ''}
  </url>`;
      }).join('');
    }

    const productsSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${productUrls}
</urlset>`;

    res.set({
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });
    res.send(productsSitemap);
    
  } catch (error) {
    console.error('Error generating products sitemap:', error);
    
    // Fallback to API-based approach if database query fails
    try {
      const fallbackCurrentDate = new Date().toISOString().split('T')[0];
      const fallbackProductsReq = { query: { limit: 5000 } };
      const fallbackProducts = await new Promise((resolve) => {
        productController.searchProducts(fallbackProductsReq, {
          json: resolve,
          status: () => ({ json: resolve })
        });
      });

      let fallbackUrls = '';
      if (Array.isArray(fallbackProducts)) {
        fallbackUrls = fallbackProducts.map(product => `
  <url>
    <loc>https://electronics-63ec.onrender.com/product/${encodeURIComponent(product.key_name)}</loc>
    <lastmod>${fallbackCurrentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    ${product.image ? `
    <image:image>
      <image:loc>${escapeXml(product.image)}</image:loc>
      <image:title>${escapeXml(product.name)}</image:title>
    </image:image>` : ''}
  </url>`).join('');
      }

      const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${fallbackUrls}
</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.send(fallbackSitemap);
      
    } catch (fallbackError) {
      console.error('Fallback sitemap generation also failed:', fallbackError);
      res.status(500).send('Error generating products sitemap');
    }
  }
});

/**
 * Calculate SEO priority based on product data
 */
function calculateProductPriority(product) {
  let priority = 0.6; // Base priority
  
  // Higher priority for products with ratings
  if (product.rating) {
    const rating = parseFloat(product.rating);
    if (rating >= 4.5) priority += 0.2;
    else if (rating >= 4.0) priority += 0.15;
    else if (rating >= 3.5) priority += 0.1;
  }
  
  // Higher priority for products with competitive prices
  if (product.mrp) {
    const price = parseFloat(product.mrp);
    if (price < 20000) priority += 0.1; // Budget phones
    else if (price < 50000) priority += 0.05; // Mid-range phones
  }
  
  // Higher priority for popular categories
  if (product.parent_category_name === 'Mobiles') priority += 0.1;
  
  // Cap at 0.9 (reserve 1.0 for homepage)
  return Math.min(priority, 0.9).toFixed(1);
}

/**
 * Get change frequency based on product category
 */
function getChangeFrequency(product) {
  if (product.parent_category_name === 'Mobiles') return 'daily';
  if (product.parent_category_name === 'Laptops') return 'weekly';
  return 'weekly';
}

/**
 * Generate categories sitemap
 */
router.get('/sitemap-categories.xml', (req, res) => {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const categoriesSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- SEO Landing Pages -->
  <url>
    <loc>https://electronics-63ec.onrender.com/seo/pages/mobiles-under-20000.html</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://electronics-63ec.onrender.com/seo/pages/mobiles-under-30000.html</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://electronics-63ec.onrender.com/seo/pages/mobiles-under-50000.html</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://electronics-63ec.onrender.com/seo/pages/samsung-mobiles.html</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://electronics-63ec.onrender.com/seo/pages/apple-mobiles.html</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://electronics-63ec.onrender.com/seo/pages/oneplus-mobiles.html</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://electronics-63ec.onrender.com/seo/pages/xiaomi-mobiles.html</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://electronics-63ec.onrender.com/seo/pages/mobiles-delhi.html</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://electronics-63ec.onrender.com/seo/pages/mobiles-mumbai.html</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(categoriesSitemap);
});

/**
 * Generate search patterns sitemap
 */
router.get('/sitemap-search.xml', (req, res) => {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const searchPatterns = [
    'samsung', 'iphone', 'oneplus', 'xiaomi', 'realme', 'oppo', 'vivo',
    'samsung galaxy', 'iphone 15', 'oneplus 12', 'xiaomi 14',
    'mobile under 20000', 'mobile under 30000', 'mobile under 50000',
    'best mobile', 'latest mobile', '5g mobile', 'gaming mobile'
  ];

  const searchUrls = searchPatterns.map(query => `
  <url>
    <loc>https://electronics-63ec.onrender.com/search?q=${encodeURIComponent(query)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('');

  const searchSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${searchUrls}
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(searchSitemap);
});

/**
 * Escape XML special characters
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

module.exports = router;
