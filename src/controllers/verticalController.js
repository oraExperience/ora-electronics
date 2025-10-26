
/**
 * Controller for verticals.
 * Calls verticalModel for DB work, processes results.
 */
const { getAllVerticals } = require('../models/verticalModel');

/**
 * GET /api/verticals
 * Returns all verticals.
 */
async function getAllVerticalsController(req, res) {
  try {
    const rows = await getAllVerticals();
    res.json(rows);
  } catch (err) {
    console.error('[verticalController] getAllVerticals error:', err.message);
    res.status(500).json({ error: 'Failed to fetch verticals' });
  }
}

module.exports = {
  getAllVerticalsController,
};
