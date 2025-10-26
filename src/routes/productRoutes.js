/**
 * Routes for product-related API endpoints.
 * Mounts on /api/products
 */
const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');

router.get('/popular-pills', productController.getPopularPills);
router.get('/search', productController.searchProducts);

// GET /api/products/top
router.get('/top', productController.getTopProducts);

// GET /api/products/product-variants
router.get('/product-variants', productController.getProductVariants);

/**
 * GET /home-rails
 * Returns all rails for HOME page with products
 */
router.get('/home-rails', productController.getHomeRailsWithProducts);

/**
 * GET /category/:categoryName
 * Returns products for the given category (e.g. Mobiles, Laptops, Accessories)
 */
router.get('/category/:categoryName', productController.getProductsByCategory);


/**
 * GET /similar/:keyName
 * Returns similar products from other verticals with minimum price in one API call
 */
router.get('/similar/:keyName', productController.getSimilarProducts);

// GET /api/products/:keyName (must be after other specific routes)
router.get('/:keyName', productController.getProductByKeyName);
module.exports = router;