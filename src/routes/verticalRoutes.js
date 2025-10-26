
/**
 * Routes for verticals.
 */
const express = require('express');
const router = express.Router();
const { getAllVerticalsController } = require('../controllers/verticalController');

/**
 * GET /api/verticals
 */
router.get('/', getAllVerticalsController);

module.exports = router;
