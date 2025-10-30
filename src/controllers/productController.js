
/**
 * Controller for product-related operations.
 * Calls product model for DB work, processes results.
 */
const productModel = require('../models/productModel');

/**
 * GET /api/product-variants
 * Returns variants for a product based on the provided vertical
 */
async function getPopularPills(req, res) {
  try {
    const pills = await productModel.getPopularPills();
    res.json(pills);
  } catch (err) {
    console.error('[productController] getPopularPills error:', err.message);
    res.status(500).json({ error: 'Failed to fetch popular pills' });
  }
}

async function getProductVariants(req, res) {
  try {
    const { vertical_id } = req.query;if (!vertical_id || isNaN(Number(vertical_id))) {
    return res.status(400).json({ error: 'vertical_id parameter is required and must be a valid number' });
  }
  const variants = await productModel.getProductVariants(Number(vertical_id));
    res.json(variants);
  } catch (err) {
    console.error('[productController] getProductVariants error:', err.message);
    res.status(500).json({ error: 'Failed to fetch product variants' });
  }
}

/**
 * GET /api/products/top
 * Responds with a list of top products (name and price only).
 */
async function getTopProducts(req, res) {
  try {
    const products = await productModel.getTopProducts();
    res.json(products);
  } catch (err) {
    console.error('[productController] getTopProducts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
}

/**
 * GET /api/products/category/:categoryName
 * Responds with a canonical category name and product array.
 */
async function getProductsByCategory(req, res) {
  try {
    const { categoryName } = req.params;
    const { products, categoryDisplayName } = await productModel.getProductsByCategoryWithName(categoryName);
    res.json({ category: categoryDisplayName, products });
  } catch (err) {
    console.error('[productController] getProductsByCategory error:', err.message);
    res.status(500).json({ error: 'Failed to fetch products for category' });
  }
}

/**
 * GET /api/home-rails
 * Responds with all homepage rails and their products
 */
async function getHomeRailsWithProducts(req, res) {
  try {
    const rails = await productModel.getHomeRailsWithProducts();
    console.log('[getHomeRailsWithProducts] rails returned:', rails.length, rails.map(r => r.header));
    res.json(rails);
  } catch (err) {
    const errorObj = err || {};
    console.error('[productController] getHomeRailsWithProducts error:', errorObj.message, errorObj.stack);
    res.status(500).json({
      error: 'Failed to fetch home rails',
      detail: errorObj.message || 'Unknown error',
      stack: errorObj.stack || 'No stack'
    });
  }
}

/**
 * GET /api/products/rails-by-category/:categoryName
 * Return all homepage rails, but filter products within each rail to the given category.
 */

/**
 * GET /api/products/:id
 * Responds with full info for a single product.
 */
async function getProductByKeyName(req, res) {
  try {
    const { keyName } = req.params;
    const product = await productModel.getProductByKeyName(keyName);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error('[productController] getProductByKeyName error:', err.message);
    res.status(500).json({ error: 'Failed to fetch product by key name' });
  }
}

/**
 * GET /api/products/similar/:keyName
 * Returns similar products from different verticals in a single API call
 * This consolidated endpoint prevents multiple API calls and makes it harder to scrape data
 */
async function getSimilarProducts(req, res) {
  try {
    const { keyName } = req.params;
    if (!keyName) {
      return res.status(400).json({ error: 'Valid product key_name is required' });
    }

    // Step 1: Get the current product to determine its vertical_id
    const product = await productModel.getProductByKeyName(keyName);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const currentVerticalId = product.vertical_id;
    if (!currentVerticalId) {
      return res.status(400).json({ error: 'Product has no vertical_id' });
    }

    // Step 2: Get similar products from other verticals using an optimized query
    // This query finds the product with minimum price for each vertical (excluding current vertical)
    const pool = require('../config/db');
    const { rows: similarProducts } = await pool.query(
      `WITH vertical_min_prices AS (
        SELECT
          v.id as vertical_id,
          v.name as vertical_name,
          p.id as product_id,
          p.name as product_name,
          p.key_name,
          p.image as product_image,
          MIN(spm.price) as min_price,
          ROW_NUMBER() OVER (PARTITION BY v.id ORDER BY MIN(spm.price) ASC) as rn
        FROM vertical v
        INNER JOIN products p ON v.id = p.vertical_id
        INNER JOIN store_product_mapping spm ON p.id = spm.product_id
        WHERE v.id != $1
        GROUP BY v.id, v.name, p.id, p.name, p.key_name, p.image
      )
      SELECT
        vertical_name,
        product_name,
        key_name,
        product_image,
        min_price as price
      FROM vertical_min_prices
      WHERE rn = 1
      ORDER BY vertical_id ASC`,
      [currentVerticalId]
    );

    // Transform the results to match the expected format
    const result = similarProducts.map(row => ({
      verticalName: row.vertical_name,
      productName: row.product_name,
      key_name: row.key_name,
      productImage: row.product_image || "https://via.placeholder.com/160x160?text=No+Image",
      price: row.price
    }));

    res.json(result);
  } catch (err) {
    console.error('[productController] getSimilarProducts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch similar products' });
  }
}

async function searchProducts(req, res) {
  try {
    const { q = "", entityid, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const validLimit = Number.isInteger(parseInt(limit)) && parseInt(limit) > 0 ? parseInt(limit) : 20;
    const validOffset = Number.isInteger(parseInt(offset)) && parseInt(offset) >= 0 ? parseInt(offset) : 0;

    let results;
    if (entityid) {
      results = await productModel.getProductsByEntityId(entityid, validLimit, validOffset);
    } else {
      results = await productModel.searchProducts(q, validLimit, validOffset);
    }
    console.log('searchProducts results:', results);
    res.json(results);
  } catch (err) {
    console.error('[productController] searchProducts error:', err.message);
    res.status(500).json({ error: 'Failed to search for products' });
  }
}

module.exports = {
  getPopularPills,
  searchProducts,
  getTopProducts,
  getProductsByCategory,
  getHomeRailsWithProducts,
  getProductByKeyName,
  getProductVariants,
  getSimilarProducts,
};

/**
 * GET /api/reviews/:productId
 * Returns all reviews for a given product ID.
 */
async function getReviewsByProductId(req, res) {
  try {
    const { keyName } = req.params;
    if (!keyName) {
      return res.status(400).json({ error: "Invalid keyName" });
    }
    const product = await productModel.getProductByKeyName(keyName);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    const reviews = await productModel.getProductReviews(product.id);
    res.json(reviews || []);
  } catch (err) {
    console.error('[productController] getReviewsByProductId error:', err.message);
    res.status(500).json({ error: 'Failed to fetch reviews by keyName' });
  }
}

// Add to exports:
module.exports.getReviewsByProductId = getReviewsByProductId;
