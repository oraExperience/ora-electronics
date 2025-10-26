
/**
 * Controller for image-related operations.
 * Calls image model for DB work, processes results.
 */
const imageModel = require('../models/imageModel');

/**
 * GET /api/images/gallery/:productId
 * Returns vertical image gallery for a specific product
 */
async function getProductVerticalGallery(req, res) {
  try {
    const { keyName } = req.params;
    if (!keyName) {
      return res.status(400).json({ error: 'Valid product key_name is required' });
    }
    
    const images = await imageModel.getProductVerticalGallery(keyName);
    res.json(images);
  } catch (err) {
    console.error('[imageController] getProductVerticalGallery error:', err.message);
    res.status(500).json({ error: 'Failed to fetch product image gallery' });
  }
}

module.exports = {
  getProductVerticalGallery
};
