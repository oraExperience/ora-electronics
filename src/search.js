// Function to update page title based on search term
function updatePageTitle(searchTerm) {document.title = searchTerm ? `ora | Buy ${searchTerm}` : 'ora | Buy Mobiles';
}
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]');
  const searchResultsContainer = document.getElementById('search-results-grid');
  const recentSearchesContainer = document.getElementById('recent-searches-tabs');
  const recentSearchesHeader = document.querySelector('h3.font-semibold:first-of-type');
  const popularSearchesContainer = document.getElementById('popular-searches-tabs');
  const popularSearchesHeader = document.querySelectorAll('h3.font-semibold')[1];
  const recommendationPillsBar = document.getElementById('recommended-pills-bar');
  const searchResultsText = document.getElementById('search-results-text');
  const clearButton = document.getElementById('clear-search');
  // Track if any pill has been clicked during the current search session
  let pillClicked = false;
  
  // Pagination state
  let currentPage = 1;
  let currentQuery = "";
  let isLoading = false;
  let hasMoreResults = true;
  const ITEMS_PER_PAGE = 20;

  async function searchProducts(query, page = 1, append = false, entityId = null) {
    console.log(`🚀 Searching for: "${query}", Page: ${page}`);
    // If new search or empty query, reset pagination state
    if (!append || page === 1) {
      currentPage = 1;
      currentQuery = query;
      hasMoreResults = true;
    }
    
    // Handle empty search query
    if ((!query || query.length < 2) && !entityId) {
      if (query.length === 0) {
        try {
          isLoading = true;
                    // For empty query, fetch products sorted by ID
                    const response = await fetch(`/api/products/search?page=${page}&limit=${ITEMS_PER_PAGE}`);
          
          if (!response.ok) {
            throw new Error('Search request failed');
          }
          
          const products = await response.json();
          renderSearchResults(products, append);
          
          // Update pagination state
          hasMoreResults = products.length === ITEMS_PER_PAGE;
          updateUIVisibility(true, false);
        } catch (error) {
          console.error('❌ Error in searchProducts:', error);
          if (!append) {
            searchResultsContainer.innerHTML = '<p class="col-span-2 text-center text-red-500 p-4">Failed to load search results. Please try again.</p>';
          }
        } finally {
          isLoading = false;
        }
        return;
      } else {
        // For very short queries (<2 chars), just clear and show initial UI
        searchResultsContainer.innerHTML = '';
        updateUIVisibility(true, false);
        return;
      }
    }

    try {
      isLoading = true;
      // Show loading indicator when loading more pages
      if (append) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (!loadingIndicator) {
          searchResultsContainer.insertAdjacentHTML('beforeend',
            '<div id="loading-indicator" class="col-span-2 text-center p-4">Loading more products...</div>'
          );
        }
            }
            
            const url = entityId
              ? `/api/products/search?entityid=${entityId}&page=${page}&limit=${ITEMS_PER_PAGE}`
              : `/api/products/search?q=${encodeURIComponent(query)}&page=${page}&limit=${ITEMS_PER_PAGE}`;
            const response = await fetch(url);
            
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      
      const products = await response.json();
      console.log('✅ Received products:', products);
      
      // Update pagination state based on results
      hasMoreResults = products.length === ITEMS_PER_PAGE;
      
      renderSearchResults(products, append);
      
            // Show recommended pills only if pill hasn't been clicked
      // Update recommended pills
      if (!pillClicked && products.length > 0 && recommendationPillsBar) {
        updateRecommendedPills(products);
      }

      // Update search results text directly
      if (searchResultsText && query && query.trim().length > 0) {
        // Check if products are empty and show appropriate message
        if (!products || products.length === 0) {
          searchResultsText.textContent = `No results for "${query.trim()}"`;
        } else {
          searchResultsText.textContent = `Showing results for "${query.trim()}"`;
        }
        searchResultsText.style.display = "";
      }

      updateUIVisibility(false, !pillClicked);
      
      if (query && query.trim().length > 0) {
        if (typeof saveRecentSearch === 'function') {
          saveRecentSearch(query.trim());
        }
      }
    } catch (error) {
      console.error('❌ Error in searchProducts:', error);
      if (!append) {
        searchResultsContainer.innerHTML = '<p class="col-span-2 text-center text-red-500 p-4">Failed to load search results. Please try again.</p>';
      }
    } finally {
      isLoading = false;
      // Remove loading indicator
      const loadingIndicator = document.getElementById('loading-indicator');
      if (loadingIndicator) {
        loadingIndicator.remove();
      }
    }
  }

  function renderSearchResults(products, append = false) {
    document.body.style.visibility = 'visible';
    // Remove loading indicator if present
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
    
    // Clear container only if not appending results
    if (!append) {
      searchResultsContainer.innerHTML = '';
    }
    
    if (!products || products.length === 0) {
      if (!append) {
        // When no products found for a search query, fetch and display all products
        if (currentQuery && currentQuery.trim().length > 0) {
          // Keep the "No results" message visible (set by searchProducts function)
          // and load all products as if no search query was made
          fetchAllProducts();
          return;
        } else {
          searchResultsContainer.innerHTML = ''; // Remove default "No products found" message
        }
      } else {
        // If appending and no new results, show end of results message
        searchResultsContainer.insertAdjacentHTML('beforeend',
          '<p id="end-of-results" class="col-span-2 text-center p-4 text-gray-500">No more products to load.</p>'
        );
      }
      return;
    }
    
    products.forEach(product => {
      const productCard = `
<div class="group bg-white rounded-lg border border-gray-200 shadow-sm hover:border-[#ea2832] hover:bg-[#fdf4f4] hover:shadow-lg hover:shadow-[#ea2832]/40 transition-shadow duration-200 cursor-pointer p-2 sm:p-3 grid grid-rows-[auto_1fr] gap-1 sm:gap-2 relative" onclick="window.location.href='/product/${product.key_name}'">
  
  <span class="absolute top-3 sm:top-5 px-1 sm:px-2 py-1 text-white text-xs font-medium z-10 rounded-r" style="background-image: linear-gradient(to right, rgb(112, 161, 245), rgb(64, 119, 233), rgb(36, 89, 225));">
    From &#8377;${product.min_price ? Number(product.min_price).toLocaleString('en-IN') : 'N/A'}
  </span>
  
  <div
    class="w-full bg-center bg-no-repeat aspect-[3/4.3] bg-contain rounded-lg bg-white transition-colors duration-200 group-hover:bg-[#fdf4f4]"
    style='background-image: url("${product.image || ''}");'
  ></div>

          <div class="grid gap-1">
            <p class="text-[#1b0e0e] text-xs sm:text-base font-medium leading-normal">${product.name}</p>
            <p class="text-[#994d51] text-xs sm:text-sm font-normal leading-normal">Available in ${product.store_count || 0} ${Number(product.store_count || 0) === 1 ? 'store' : 'stores'}</p>
          </div>
        </div>
      `;
      searchResultsContainer.insertAdjacentHTML('beforeend', productCard);
    });
  }

  // Function to fetch all products when no search results are found
  async function fetchAllProducts() {
    try {
      const response = await fetch(`/api/products/search?page=1&limit=${ITEMS_PER_PAGE}`);
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      const products = await response.json();
      
      // Render the products (don't pass the append flag)
      products.forEach(product => {
        const productCard = `
<div class="group bg-white rounded-lg border border-gray-200 shadow-sm hover:border-[#ea2832] hover:bg-[#fdf4f4] hover:shadow-lg hover:shadow-[#ea2832]/40 transition-shadow duration-200 cursor-pointer p-2 sm:p-3 grid grid-rows-[auto_1fr] gap-1 sm:gap-2 relative" onclick="window.location.href='/product/${product.key_name}'">
  
  <span class="absolute top-3 sm:top-5 px-1 sm:px-2 py-1 text-white text-xs font-medium z-10 rounded-r" style="background-image: linear-gradient(to right, rgb(112, 161, 245), rgb(64, 119, 233), rgb(36, 89, 225));">
    From &#8377;${product.min_price ? Number(product.min_price).toLocaleString('en-IN') : 'N/A'}
  </span>
  
  <div
    class="w-full bg-center bg-no-repeat aspect-[3/4.3] bg-contain rounded-lg bg-white transition-colors duration-200 group-hover:bg-[#fdf4f4]"
    style='background-image: url("${product.image || ''}");'
  ></div>

            <div class="grid gap-1">
              <p class="text-[#1b0e0e] text-xs sm:text-base font-medium leading-normal">${product.name}</p>
              <p class="text-[#994d51] text-xs sm:text-sm font-normal leading-normal">Available in ${product.store_count || 0} ${Number(product.store_count || 0) === 1 ? 'store' : 'stores'}</p>
            </div>
          </div>
        `;
        searchResultsContainer.insertAdjacentHTML('beforeend', productCard);
      });// Set up pagination for these results
      hasMoreResults = products.length === ITEMS_PER_PAGE;
      // We maintain the current query (which had no results) but reset the page number
      // so that scrolling will load more of the default products
      currentPage = 1;
    } catch (error) {
      console.error('Error fetching all products:', error);
      searchResultsContainer.innerHTML = '<p class="col-span-2 text-center text-red-500 p-4">Failed to load products. Please try again.</p>';
    }
  }


  // New function to update UI visibility based on current state
  function updateUIVisibility(isInputEmpty, showRecommendedPills) {
    // Get recent searches from localStorage
    const recentSearches = localStorage.getItem('ora_recent_searches');
    const hasRecentSearches = recentSearches && JSON.parse(recentSearches).length > 0;
    
    // Your recent searches - show only when input is empty and there are recent searches
    if (recentSearchesHeader) {
      recentSearchesHeader.style.display = isInputEmpty && hasRecentSearches ? "" : "none";
    }
    if (recentSearchesContainer) {
      recentSearchesContainer.style.display = isInputEmpty && hasRecentSearches ? "" : "none";
    }
    
    // Popular searches near you - show only when input is empty
    if (popularSearchesHeader) {
      popularSearchesHeader.style.display = isInputEmpty ? "" : "none";
    }
    if (popularSearchesContainer) {
      popularSearchesContainer.style.display = isInputEmpty ? "" : "none";
    }
    
    // Recommended pills bar - show only when input has text and no pill has been clicked
    if (recommendationPillsBar) {
      recommendationPillsBar.style.display = !isInputEmpty && showRecommendedPills ? "" : "none";
    }
    
        // Search results text - show only when input has text
    // Don't set the content here; let searchProducts handle that
    if (searchResultsText) {
      searchResultsText.style.display = !isInputEmpty ? "" : "none";}
  }

    // Function to update recommended pills with unique vertical names from search results
  function updateRecommendedPills(products) {
    if (!recommendationPillsBar || !products || !products.length) return;
    
    // Extract unique vertical names from products
    const verticalNames = [];
    const uniqueVerticals = new Set();
    products.forEach(product => {
      if (product.vertical_name && !uniqueVerticals.has(product.vertical_name)) {
        uniqueVerticals.add(product.vertical_name);
        verticalNames.push(product.vertical_name);
      }
    });// Clear existing pills
    recommendationPillsBar.innerHTML = '';// Create new pills for each vertical name
    verticalNames.forEach(verticalName => {
      const pillButton = document.createElement('button');
      pillButton.type = 'button';
      pillButton.className = 'recent-search-tab rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]';
      pillButton.textContent = verticalName;
      recommendationPillsBar.appendChild(pillButton);
    });
    // Setup event listeners for the new pills
    setupPillEventListeners();
  }

  // Function to fetch and render popular search pills
  async function renderPopularPills() {
    try {
      const response = await fetch('/api/products/popular-pills');
      if (!response.ok) {
        throw new Error('Failed to fetch popular pills');
      }
      const pills = await response.json();
      popularSearchesContainer.innerHTML = ''; // Clear hardcoded pills
      pills.forEach(pill => {
        const pillButton = document.createElement('button');
        pillButton.type = 'button';
        pillButton.className = 'popular-search-tab rounded-full border border-[#e7d0d1] bg-white text-[#1b0e0e] font-medium text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 leading-tight sm:leading-normal transition hover:bg-[#f3e7e8] hover:border-[#ea2832] focus:outline-none focus:ring-2 focus:ring-[#ea2832]';
        pillButton.textContent = pill.header;
        pillButton.dataset.entityId = pill.id;
        popularSearchesContainer.appendChild(pillButton);
      });
      // Re-setup event listeners for the newly created pills
      setupPillEventListeners();
    } catch (error) {
      console.error('❌ Error in renderPopularPills:', error);
    }
  }

  // Setup event listeners for pill clicks
  function setupPillEventListeners() {
    // Function to handle pill click
        const handlePillClick = (searchTerm) => {
      if (searchInput) {
        searchInput.value = searchTerm;
        searchInput.focus();
        pillClicked = true;
        // Update page title with search term
        updatePageTitle(searchTerm);

if (clearButton) {
  clearButton.style.display = 'block';
}
if (clearButton) {
  clearButton.style.display = 'block';
}

        
        if (typeof saveRecentSearch === 'function') {
          saveRecentSearch(searchTerm);
        }
        // Update UI visibility
        // Don't update searchResultsText here, let searchProducts handle it
        if (searchResultsText) {
          searchResultsText.style.display = "";}
        updateUIVisibility(false, false);
        searchProducts(searchTerm);
      }
    };// Set up event listeners for recent search pills
    const recentSearchPills = document.querySelectorAll('.recent-search-tab');
    recentSearchPills.forEach(pill => {
      // Remove existing event listeners (to avoid duplicates)
      const newPill = pill.cloneNode(true);
      pill.parentNode.replaceChild(newPill, pill);
      
      newPill.addEventListener('click', () => {
        const searchTerm = newPill.innerText.trim();
        handlePillClick(searchTerm);
      });
    });
    
    // Set up event listeners for popular search pills
    const popularSearchPills = document.querySelectorAll('.popular-search-tab');
    popularSearchPills.forEach(pill => {
      // Remove existing event listeners (to avoid duplicates)
      const newPill = pill.cloneNode(true);
      pill.parentNode.replaceChild(newPill, pill);
      
      newPill.addEventListener('click', (e) => {
        e.stopPropagation();
        const searchTerm = newPill.innerText.trim();
        const entityId = newPill.dataset.entityId;
                if (entityId) {
          pillClicked = true;
          searchInput.value = searchTerm;
          // Update page title with search term
          updatePageTitle(searchTerm);if (clearButton) {
            clearButton.style.display = 'block';}
          searchProducts(null, 1, false, entityId);
          if (searchResultsText) {
            searchResultsText.textContent = `Showing results for "${searchTerm}"`;
            searchResultsText.style.display = "";
          }
          updateUIVisibility(false, false);
        } else {
          handlePillClick(searchTerm);
        }
      });
    });
    
    // Set up event listeners for recommended pills
    const recommendedPills = document.querySelectorAll('#recommended-pills-bar button');
    recommendedPills.forEach(pill => {
      // Remove existing event listeners (to avoid duplicates)
      const newPill = pill.cloneNode(true);
      pill.parentNode.replaceChild(newPill, pill);
      
      newPill.addEventListener('click', () => {
        const searchTerm = newPill.innerText.trim();
        handlePillClick(searchTerm);
      });
    });
  }

  // Setup intersection observer for infinite scroll
  function setupInfiniteScroll() {
    // Create a sentinel element that will be observed
    const sentinel = document.createElement('div');
    sentinel.id = 'scroll-sentinel';
    sentinel.style.height = '1px'; // Nearly invisible
    
    // Append it to the results container
    if (searchResultsContainer.parentElement) {
      searchResultsContainer.parentElement.appendChild(sentinel);
    }
    
    // Create an intersection observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isLoading && hasMoreResults) {
          // Load the next page of results
          currentPage++;
          searchProducts(currentQuery, currentPage, true);
        }
      });
    }, {
      rootMargin: '100px', // Start loading before reaching the end
    });
    
    // Start observing the sentinel
    observer.observe(sentinel);
    
    return observer;
  }

  if (searchInput) {
    let debounceTimeout;
    // Setup input event listener
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        const query = e.target.value.trim();
        
const isEmpty = query.length === 0;
if (clearButton) {
  clearButton.style.display = isEmpty ? 'none' : 'block';
}
// Update page title based on search term
updatePageTitle(isEmpty ? '' : query);

        // Reset pillClicked flag when input is cleared
        if (isEmpty) {
          // Hide search results text when input is emptied
          if (searchResultsText) {
            searchResultsText.style.display = "none";
          }
          pillClicked = false;
        } else {
          // Don't update the searchResultsText yet, let searchProducts handle it
          // Just make sure it's visible
          if (searchResultsText) {
            searchResultsText.style.display = "";
          }
        }
        
        searchProducts(query);
      }, 300);
    });
    
    // Setup Enter key event listener
        searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        // Update page title on Enter key
        updatePageTitle(query);
        searchProducts(query);
        
        const url = new URL(window.location.href);
        url.searchParams.set('q', query);
        window.history.pushState({}, '', url);
      }
    });
  }

    // Setup clear button event listener
  if (clearButton) {
        clearButton.addEventListener('click', () => {
      searchInput.value = '';
      searchResultsContainer.innerHTML = '';
      pillClicked = false;
      // Update page title when search is cleared
      updatePageTitle('');
      updateUIVisibility(true, false);// Hide search results text
      if (searchResultsText) {
        searchResultsText.style.display = "none";
      }
      
      const url = new URL(window.location.href);
      url.searchParams.delete('q');
      window.history.pushState({}, '', url);
      
      // Load initial products when search is cleared
      searchProducts("");

if (clearButton) {
  clearButton.style.display = 'none';
}

    });
  }

  // Initialize UI
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q') || "";
  // Set initial page title based on URL query parameter
  updatePageTitle(query);
  if (searchInput) {
    searchInput.value = query;

if (clearButton) {
  clearButton.style.display = query ? 'block' : 'none';
}

    searchProducts(query);
  } else {
    // If no query, show initial state and load first page of products
    updateUIVisibility(true, false);
    searchProducts("");
  }
  
  // Initial setup of pill event listeners
  renderPopularPills();
  
  // Setup infinite scrolling
  const observer = setupInfiniteScroll();
  
  // Listen for custom event when recent searches are rendered
  document.addEventListener('recentSearchesRendered', () => {
    setupPillEventListeners();
  });
});

