/**
 * Recent Searches functionality using localStorage
 * - Stores up to 5 unique recent searches with individual timestamps
 * - Displays recent searches on the search page
 * - Hides recent searches section if no recent searches exist
 * - Follows industry standards for search history management
 */

// Key for storing recent searches in localStorage
const RECENT_SEARCHES_KEY = 'ora_recent_searches';
// Maximum number of recent searches to store
const MAX_RECENT_SEARCHES = 5;
// Cache expiration time in milliseconds (7 days - industry standard)
const CACHE_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Clean up expired individual search items
 * @returns {Array} Array of valid (non-expired) recent search objects
 */
function cleanExpiredSearches() {
  const recentSearches = localStorage.getItem(RECENT_SEARCHES_KEY);
  if (!recentSearches) return [];
  
  let searches = JSON.parse(recentSearches);
  const now = Date.now();
  
  // Filter out expired searches (older than 7 days)
  const validSearches = searches.filter(search => {
    const isValid = (now - search.timestamp) < CACHE_EXPIRATION_TIME;
    if (!isValid) {
      console.log(`🧹 Removed expired search: "${search.term}" (${Math.round((now - search.timestamp) / (24 * 60 * 60 * 1000))} days old)`);
    }
    return isValid;
  });
  
  // Update localStorage if any searches were removed
  if (validSearches.length !== searches.length) {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(validSearches));
    
    // Update UI if we're on the search page
    const recentSearchesContainer = document.getElementById('recent-searches-tabs');
    if (recentSearchesContainer) {
      renderRecentSearches();
    }
  }
  
  return validSearches;
}

/**
 * Get recent searches from localStorage
 * @returns {Array} Array of recent search terms (strings only for backward compatibility)
 */
function getRecentSearches() {
  // Clean expired searches first
  const validSearches = cleanExpiredSearches();
  
  // Return only the search terms for backward compatibility
  return validSearches.map(search => search.term || search);
}

/**
 * Save a search term to recent searches
 * @param {string} searchTerm The search term to save
 */
function saveRecentSearch(searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') return;

  searchTerm = searchTerm.trim();
  const now = Date.now();
  
  // Get existing search objects (clean expired ones first)
  let searchObjects = cleanExpiredSearches();
  
  // Remove the search term if it already exists (to avoid duplicates)
  searchObjects = searchObjects.filter(search =>
    (search.term || search) !== searchTerm
  );
  
  // Add the new search term to the beginning with current timestamp
  searchObjects.unshift({
    term: searchTerm,
    timestamp: now
  });
  
  // Limit to MAX_RECENT_SEARCHES items (LRU - Least Recently Used)
  if (searchObjects.length > MAX_RECENT_SEARCHES) {
    const removed = searchObjects.slice(MAX_RECENT_SEARCHES);
    searchObjects = searchObjects.slice(0, MAX_RECENT_SEARCHES);
    console.log(`🗑️ Removed ${removed.length} oldest search(es) due to limit`);
  }
  
  // Save back to localStorage
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searchObjects));
  
  // If we're on the search page, update the UI immediately
  if (document.getElementById('recent-searches-tabs')) {
    renderRecentSearches();
  }
}

/**
 * Create a recent search pill element
 * @param {string} searchTerm The search term
 * @returns {HTMLElement} Button element representing the search pill
 */
function createRecentSearchPill(searchTerm) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'recent-search-tab rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]';
  button.textContent = searchTerm;
  return button;
}

/**
 * Render recent searches in the UI
 */
function renderRecentSearches() {
  const recentSearches = getRecentSearches();
  const recentSearchesContainer = document.getElementById('recent-searches-tabs');
  
  if (!recentSearchesContainer) return;
  
  // Clear existing content
  recentSearchesContainer.innerHTML = '';
  
  // Create and append pills for each recent search
  recentSearches.forEach(search => {
    const pill = createRecentSearchPill(search);
    recentSearchesContainer.appendChild(pill);
  });

  // Dispatch event to notify search.js that pills have been rendered
  document.dispatchEvent(new Event('recentSearchesRendered'));
  
  // We don't control visibility here anymore
  // That's now handled by search.js based on search input state
}

/**
 * Start periodic cache cleanup (industry standard: check daily)
 */
function startPeriodicCacheCleanup() {
  // Run cleanup immediately on page load
  cleanExpiredSearches();
  
  // Set up interval to run cleanup every 24 hours (like major websites)
  const dailyCleanup = setInterval(() => {
    cleanExpiredSearches();
  }, 24 * 60 * 60 * 1000); // 24 hours
  
  console.log('🕒 Started periodic cache cleanup (daily check for 7-day expiration)');
  
  return dailyCleanup;
}

/**
 * Manually clear all recent searches cache
 */
function clearAllRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
  console.log('🧹 Manually cleared all recent searches');
  
  // Update UI if we're on the search page
  const recentSearchesContainer = document.getElementById('recent-searches-tabs');
  if (recentSearchesContainer) {
    renderRecentSearches();
  }
}

/**
 * Handle storage events from other tabs (industry best practice)
 */
function handleStorageChange(event) {
  if (event.key === RECENT_SEARCHES_KEY && event.newValue !== event.oldValue) {
    // Update UI when recent searches change in another tab
    const recentSearchesContainer = document.getElementById('recent-searches-tabs');
    if (recentSearchesContainer) {
      renderRecentSearches();
    }
  }
}

// Initialize the functionality when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Start periodic cache cleanup
  startPeriodicCacheCleanup();
  
  // Listen for storage changes from other tabs
  window.addEventListener('storage', handleStorageChange);
  
  // Render recent searches on page load (this will also clean expired items)
  renderRecentSearches();
  
  // Note: Event listeners for pills are now managed in search.js
  // to ensure proper state tracking for visibility control
});
