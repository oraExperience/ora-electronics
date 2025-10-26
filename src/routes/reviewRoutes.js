
/**
 * Routes for review-related API endpoints.
 * Mounts on /api/reviews
 */
const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');

// GET /api/reviews/:keyName
router.get('/:keyName', productController.getReviewsByProductId);

module.exports = router;
