
/**
 * Model layer for 'products'.
 * Handles direct DB queries for product data.
 */
const pool = require('../config/db');

/**
 * Get the top N products (for'Top mobiles near you').
 * If you want to filter or join other tables, edit the query here.
 */
async function getTopProducts(limit = 3) {
  // In PostgreSQL, it's safe to use parameters for LIMIT.
  // Always validate limit to prevent excessive data retrieval.
  limit = Number(limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) limit = 3;
  const sql = `SELECT name, image FROM products ORDER BY id LIMIT $1`;
  const { rows } = await pool.query(sql, [limit]);
  // Return as plain array of { name, price, image_url }
  return rows.map(r => ({
    name: r.name,
    price: "See stores for pricing",
    image_url: r.image || null
  }));
}

/**
 * Get all products by category name.
 * categoryName - string ('Mobiles', 'Laptops', etc)
 * Returns: [{name, price, image_url}]
 */
async function getProductsByCategory(categoryName, limit = 10) {
  // Validate input
  if (typeof categoryName !== "string" || !categoryName) {
    return [];
  }
  // Get the category ID
  const { rows: catRows } = await pool.query(
    "SELECT id FROM category WHERE name = $1 LIMIT 1",
    [categoryName]
  );
  if (!catRows.length) return [];
  const categoryId = catRows[0].id;
  // Get products for this category
  limit = Number(limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) limit = 10;
  const { rows } = await pool.query(
    `SELECT name, image FROM products WHERE parent_category_id = $1 ORDER BY id LIMIT $2`,
    [categoryId, limit]
  );
  return rows.map((r) => ({
    name: r.name,price: "See stores for pricing",image_url: r.image || null,}));
}

/**
 * Like getProductsByCategory, but returns {products, categoryDisplayName}
 * - categoryName: input from URL (e.g. "mobiles", "MOBILES", "Mobiles")
 * Returns: { products, categoryDisplayName }
 */
async function getProductsByCategoryWithName(categoryName, limit = 10) {
  if (typeof categoryName !== "string" || !categoryName) {
    return { products: [], categoryDisplayName: "Unknown" };
  }
  // Match category name case-insensitively using ILIKE
  const { rows: catRows } = await pool.query(
    "SELECT id, name FROM category WHERE name ILIKE $1 LIMIT 1",
    [categoryName]
  );
  if (!catRows.length) return { products: [], categoryDisplayName: "Unknown" };
  const categoryId = catRows[0].id;
  const catName = catRows[0].name;
  // Get products for this category
  limit = Number(limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) limit = 10;
  const { rows } = await pool.query(
    `SELECT name, image FROM products WHERE parent_category_id = $1 ORDER BY id LIMIT $2`,
    [categoryId, limit]
  );
  const products = rows.map((r) => ({
    name: r.name,
        price: "See stores for pricing",
    image_url: r.image || null,
  }));
  return { products, categoryDisplayName: catName };
}

/**
 * Get all homepage rails with mapped products, ordered by rank.
 * Returns [{ id, header, products: [{name, price, image_url}] }]
 */
async function getHomeRailsWithProducts(limitPerRail = 12) {
  // Select all rails for the HOME page, entity_type='RAIL', ordered by rank.
  const { rows: rails } = await pool.query(
    `SELECT id, header FROM entity WHERE page = 'HOME' AND entity_type = 'RAIL'
     ORDER BY entity."rank" ASC`
  );
  // For each rail, get its products via entity_product_mapping.
  const railsWithProducts = [];
  for (const rail of rails) {
    const { rows: prods } = await pool.query(
      `SELECT p.name, p.image
       FROM entity_product_mapping m INNER JOIN products p ON m.product_id = p.id
       WHERE m.entity_id = $1 LIMIT $2`,
      [rail.id, limitPerRail]
    );
    railsWithProducts.push({
      id: rail.id,
      header: rail.header,
            products: prods.map(r => ({
        name: r.name,
        // Price will need to be determined from store data, not from product directly
        price: "See stores for pricing",
        image_url: r.image || null
      }))
    });
  }
  return railsWithProducts;
}
/**
 * Get a single product by ID with all columns.
 */

/**
 * Get all reviews for a given product ID from'ratings_reviews'.
 * Returns an array of {id, entity_id, review, rating.}
 */
async function getProductReviews(productId) {
  if (!productId || isNaN(Number(productId))) return [];
  const { rows: reviews } = await pool.query(
    `SELECT rr.review, rr.rating, rr.created_at, rr.images AS review_images, u.name AS user_name, u.user_image FROM ratings_reviews rr
    LEFT JOIN users u ON rr.user_id = u.id
    WHERE rr.entity_type = 'product' AND rr.entity_id = $1`,
    [productId]
  );
  return reviews;
}

async function getProductByKeyName(keyName) {
  if (!keyName) return null;
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.key_name, p.image, p.highlights, p.storage, p.ram, p.colour, p.vertical_id, v.name as vertical_name, p.rating, p.rating_count,
    p.review_count, p.specifications, p.mrp, p.parent_category_id, p.sub_category_id,
    parent_cat.name as parent_category_name, sub_cat.name as sub_category_name
    FROM products p
     LEFT JOIN category parent_cat ON p.parent_category_id = parent_cat.id
     LEFT JOIN category sub_cat ON p.sub_category_id = sub_cat.id
     LEFT JOIN vertical v ON p.vertical_id = v.id
     WHERE p.key_name = $1 LIMIT 1`,
    [keyName]
  );
  if (!rows.length) return null;
  const product = rows[0];
  const reviews = await getProductReviews(product.id);
  return { ...product, reviews };
}

/**
 * Get all homepage rails, but only products of a specific category.
 * Returns [{ id, header, products: [{name, price, image_url}] }]
 */

/**
 * Get product variants based on the product's vertical.
 * Returns an array of variants with storage, colour, id, and price.
 */
async function getPopularPills() {
  const { rows } = await pool.query(
    `SELECT id, header
     FROM entity
     WHERE entity_type = 'POPULAR_PILLS' AND page = 'SEARCH'
     ORDER BY "rank" ASC`
  );
  return rows;
}

async function getProductsByEntityId(entityId, limit = 20, offset = 0) {
  const { rows } = await pool.query(
    `SELECT p.name, p.image, p.key_name, v.name as vertical_name, MIN(spm.price) as min_price, COUNT(DISTINCT spm.store_id) as store_count
     FROM entity_product_mapping epm
     JOIN products p ON epm.product_id = p.id
     JOIN vertical v ON p.vertical_id = v.id
     LEFT JOIN store_product_mapping spm ON p.id = spm.product_id
     WHERE epm.entity_id = $1
     GROUP BY p.id, v.name
     ORDER BY p.id DESC
     LIMIT $2 OFFSET $3`,
    [entityId, limit, offset]
  );
  return rows;
}

async function getProductVariants(vertical_id) {
  if (!vertical_id || isNaN(Number(vertical_id))) return [];
  const { rows } = await pool.query(
    `SELECT storage, ram, colour, key_name
     FROM products
     WHERE vertical_id = $1`,
    [vertical_id]
  );
  return rows;
}


/**
 * Search products with pagination support.
 * If query is empty, returns products sorted by ID DESC.
 *
 * @param {string} query - Search term (optional)
 * @param {number} limit - Number of products per page (default: 5)
 * @param {number} offset - Pagination offset (default: 0)
 * @returns {Array} - Array of product objects
 */
async function searchProducts(query, limit = 5, offset = 0) {
  let params = [limit, offset];
  let whereClause = '';
  if (query) {
    const searchTerms = query.trim().split(/\s+/).filter(term => term.length > 0);
    if (searchTerms.length > 0) {
      whereClause = `WHERE ${searchTerms.map((_, i) => `p.name ILIKE $${i + 3}`).join(' AND ')}`;
      params.push(...searchTerms.map(term => `%${term}%`));
    }
  }
  const searchQuery = `
    SELECT
      p.name,
      p.image,
      p.key_name,
      v.name as vertical_name,
      MIN(spm.price) as min_price,
      COUNT(DISTINCT spm.store_id) as store_count
    FROM products p
    JOIN vertical v ON p.vertical_id = v.id
    LEFT JOIN store_product_mapping spm ON p.id = spm.product_id
    ${whereClause}
    GROUP BY p.id, p.name, p.image, p.key_name, v.name
    ORDER BY p.id DESC
    LIMIT $1 OFFSET $2
  `;
  console.log('searchQuery:', searchQuery);
  console.log('params:', params);
  const { rows } = await pool.query(searchQuery, params);
  return rows;
}


module.exports = { getPopularPills, getProductsByEntityId, searchProducts, getTopProducts, getProductsByCategory, getProductsByCategoryWithName, getHomeRailsWithProducts, getProductByKeyName, getProductVariants, getProductReviews };
