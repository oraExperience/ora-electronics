
/**
 * Model for 'vertical' entities.
 * Handles direct DB queries for verticals data.
 */
const pool = require('../config/db');

/**
 * Get all verticals.
 * Returns: [{id, name}]
 */
async function getAllVerticals() {
  const { rows } = await pool.query(
    'SELECT id, name FROM vertical ORDER BY id ASC'
  );
  return rows;
}

module.exports = {
  getAllVerticals,
};
