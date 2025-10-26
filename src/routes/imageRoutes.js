
/**
 * Routes for image-related API endpoints.
 * Mounts on /api/images
 */
const express = require('express');
const router = express.Router();

const imageController = require('../controllers/imageController');

/**
 * GET /api/images/gallery/:keyName
 * Returns vertical image gallery for a product
 */
router.get('/gallery/:keyName', imageController.getProductVerticalGallery);

module.exports = router;
