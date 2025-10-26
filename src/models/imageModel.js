
/**
 * Model layer for 'entity_image'.
 * Handles direct DB queries for image data.
 */
const pool = require('../config/db');

/**
 * Get vertical image gallery for a specific product
 * @param {number|string} productId - ID of the product
 * @returns {Promise<Array>} - Array of image data objects
 */
async function getProductVerticalGallery(keyName) {
  if (!keyName) return [];
  
  try {
    // Query entity_image table for vertical gallery images
    const { rows } = await pool.query(
      `SELECT ei.image_url FROM entity_image ei
       JOIN products p ON p.id = ei.entity_id
       WHERE ei.entity_type = 'product'
       AND ei.image_type = 'vertical_image_gallery'
       AND p.key_name = $1
       ORDER BY ei.id ASC`,
      [keyName]
    );
    
    return rows;
  } catch (error) {
    console.error('[imageModel] getProductVerticalGallery error:', error.message);
    return [];
  }
}

module.exports = {
  getProductVerticalGallery
};
