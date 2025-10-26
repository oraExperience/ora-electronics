
/**
 * Direct API Service (No Caching)
 * 
 * Removed caching to ensure fresh data is always fetched
 * This prevents304 Not Modified responses and stale data issues
 */

/**
 * Fetch data directly without any caching
 * @param {string} url - The API URL to fetch
 * @param {Object} options - Optional fetch options
 * @returns {Promise<any>} - Promise that resolves with the data
 */
async function fetchWithoutCache(url, options = {}) {
  console.log(`[API Service] Fetching fresh data from: ${url}`);
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[API Service] Error fetching ${url}:`, error);
    throw error;
  }
}

/**
 * Clear cache function (now just logs that no caching is used)
 * @param {string} url - Unused parameter for compatibility
 */
function clearCache(url) {
  console.log(`[API Service] No caching in use - all requests fetch fresh data`);
}

// Export the public API (maintaining compatibility)
window.apiCacheService = {
  fetch: fetchWithoutCache,
  clearCache: clearCache
};
