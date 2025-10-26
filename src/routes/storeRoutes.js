/**
 * Routes for store-related API endpoints.
 * Mounts on /api/stores
 */
const express = require('express');
const router = express.Router();

const storeController = require('../controllers/storeController');

// GET /api/stores/for-product/:keyName
// Returns all stores that sell a specific product with pricing info
router.get('/for-product/:keyName', storeController.getStoresForProduct);

module.exports = router;
