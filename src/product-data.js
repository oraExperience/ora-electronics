
/**
 * Shared Product Data Module
 *
 * This module handles fetching and caching the product data to avoid duplicate API calls.
 * It provides a centralized way for other modules to access product data.
 */

// Cache for the product data
let productData = null;
let productDataPromise = null;
let keyName = null;

// Event system
const eventListeners = {
  'product-loaded': []
};

/**
 * Add event listener
 * @param {string} event - Event name
 * @param {Function} callback - Function to call when event is triggered
 */
function addEventListener(event, callback) {
  if (!eventListeners[event]) {
    eventListeners[event] = [];
  }
  eventListeners[event].push(callback);
}

/**
 * Remove event listener
 * @param {string} event - Event name
 * @param {Function} callback - Function to remove
 */
function removeEventListener(event, callback) {
  if (!eventListeners[event]) return;
  const index = eventListeners[event].indexOf(callback);
  if (index !== -1) {
    eventListeners[event].splice(index, 1);
  }
}

/**
 * Trigger an event
 * @param {string} event - Event name
 * @param {any} data - Data to pass to listeners
 */
function triggerEvent(event, data) {
  if (!eventListeners[event]) return;
  eventListeners[event].forEach(callback => {
    try {
      callback(data);
    } catch (err) {
      console.error(`Error in ${event} listener:`, err);
    }
  });
}

/**
 * Initialize the product data
 * This should be called as early as possible when the page loads
 */
function initProductData() {
  // Get keyName from URL - support both SEO-friendly and query parameter formats
  let newKeyName;
  
  // Check if it's a SEO-friendly URL format: /product/product-name
  const pathSegments = window.location.pathname.split('/');
  if (pathSegments.length >= 3 && pathSegments[1] === 'product') {
    newKeyName = pathSegments[2];
  } else {
    // Fallback to old query parameter format: products.html?name=product-name
    const params = new URLSearchParams(window.location.search);
    newKeyName = params.get('name');
  }
  
  // Only fetch new data if product key_name changed or we don't have data yet
  if (keyName !== newKeyName || !productData) {
    keyName = newKeyName;
    if (keyName) {
      fetchProductData(keyName);
    }
  }
}

/**
 * Fetch product data from the API
 * @param {string|number} id - Product ID
 * @returns {Promise} - Promise that resolves with product data
 */
function fetchProductData(keyName) {
  // If we're already fetching this product, return the existing promise
  if (productDataPromise) {
    return productDataPromise;
  }
  
    console.log(`[product-data] Fetching product data for: ${keyName}`);
    // Create and store the promise
    productDataPromise = fetch(`/api/products/${keyName}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch product data');
      }
      return response.json();
    })
    .then(data => {
      productData = data;
      console.log('[product-data] Product data fetched successfully');
      
      // Optimize SEO when product data is loaded
      if (window.SEOOptimizer && productData) {
        const seoOptimizer = new window.SEOOptimizer();
        seoOptimizer.optimizeProductPage(productData);
      }
      
      triggerEvent('product-loaded', productData);
      document.body.style.visibility = 'visible';
      return data;
    })
    .catch(err => {
      console.error('[product-data] Error fetching product data:', err);
      productDataPromise = null; // Clear promise to allow retrying
      throw err;
    });
  
  return productDataPromise;
}

/**
 * Get the product data
 * @returns {Promise} - Promise that resolves with product data
 */
function getProductData() {
  // If we already have the data, return it immediately
  if (productData) {
    return Promise.resolve(productData);
  }
  
  // If we're in the process of fetching, return that promise
  if (productDataPromise) {
    return productDataPromise;
  }
  
  // Otherwise, initialize and fetch
  initProductData();
  return productDataPromise;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initProductData);

// Export the public API
window.productDataModule = {
  getProductData,
  addEventListener,
  removeEventListener
};
