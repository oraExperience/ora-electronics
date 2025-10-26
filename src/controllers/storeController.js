/**
 * Controller for store-related operations.
 * Calls store model for DB work, processes results.
 */
const storeModel = require('../models/storeModel');

/**
 * GET /api/stores/for-product/:productId
 * Returns all stores that sell a specific product with pricing information.
 */
async function getStoresForProduct(req, res) {
  try {
    const { keyName } = req.params;
    
    if (!keyName) {
      return res.status(400).json({ error: "Invalid keyName" });
    }
    
    console.log(`[storeController] Looking for stores with product keyName: ${keyName}`);
    const stores = await storeModel.getStoresForProduct(keyName);
    console.log(`[storeController] Found ${stores.length} stores for product keyName ${keyName}`);
    res.json(stores);
  } catch (err) {
    console.error('[storeController] getStoresForProduct error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stores for product' });
  }
}

module.exports = {
  getStoresForProduct
};
