/**
 * Product Stores Module
 * Fetches and renders store data for a specific product
 */
// Global variable to store user's location
let userLocation = null;
let storesLoaded = false;
let loadedStores = [];document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  // Start loading product data immediately without waiting for location
  setTimeout(() => {
    // Get keyName from URL - support both SEO-friendly and query parameter formats
    let keyName;
    
    // Check if it's a SEO-friendly URL format: /product/product-name
    const pathSegments = window.location.pathname.split('/');
    if (pathSegments.length >= 3 && pathSegments[1] === 'product') {
      keyName = pathSegments[2];
    } else {
      // Fallback to old query parameter format: products.html?name=product-name
      const params = new URLSearchParams(window.location.search);
      keyName = params.get('name');
    }
    
    if (keyName) {
      fetchStoresForProduct(keyName);
    } else {
      console.error('No product key_name found in URL for fetching stores.');
    }
  }, 100); // Short delay to ensure DOM is fully rendered
  // Check if we already have permission stored
  const storedLocationPermission = localStorage.getItem('locationPermissionStatus');
  const lastLocationTime = localStorage.getItem('locationTimestamp');
  const currentTime = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  // If we have stored location that's less than 24 hours old, use it
  if (storedLocationPermission === 'granted' && lastLocationTime && 
      (currentTime - parseInt(lastLocationTime, 10)) < oneDayMs) {
    const storedLat = localStorage.getItem('userLatitude');
    const storedLng = localStorage.getItem('userLongitude');
    
    if (storedLat && storedLng) {
      userLocation = {
        latitude: parseFloat(storedLat),
        longitude: parseFloat(storedLng)
      };
      console.log('Using stored location:', userLocation);
      
      // If stores are already loaded, update their distances
      if (storesLoaded && loadedStores.length > 0) {
        updateStoreDistancesInUI(loadedStores);
      }
      return;
    }
  }
  
  // Only request permission if we don't have a recent stored location
  // or if permission was not explicitly denied before
  if (storedLocationPermission !== 'denied') {
    getUserLocation()
      .then(location => {
        console.log('User location obtained:', location);
        userLocation = location;
        
        // Store location permission and coordinates in localStorage
        localStorage.setItem('locationPermissionStatus', 'granted');
        localStorage.setItem('locationTimestamp', Date.now().toString());
        localStorage.setItem('userLatitude', location.latitude.toString());
        localStorage.setItem('userLongitude', location.longitude.toString());
        
        // Store a flag to indicate this is a new permission grant
        const isNewPermission = !localStorage.getItem('hasReloadedAfterPermission');
        
        if (isNewPermission) {
          // Set the flag to avoid multiple reloads
          localStorage.setItem('hasReloadedAfterPermission', 'true');
          // Reload the page immediately to refresh distances
          window.location.reload();
        } else {
          // If we already reloaded after permission or it's a subsequent visit,
          // just update the UI dynamically
          if (storesLoaded && loadedStores.length > 0) {
            updateStoreDistancesInUI(loadedStores);
          }
        }
      })
      .catch(error => {
        console.warn('Failed to get user location:', error.message);
        if (error.message.includes('denied')) {
          // Store denied status to avoid asking again
          localStorage.setItem('locationPermissionStatus', 'denied');
        }
      });
  }
});


/**
 * Request and retrieve the user's geolocation
 * Returns a promise that resolves with the user's coordinates or rejects with an error
 */
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'User denied the request for geolocation';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred';
        }
        reject(new Error(errorMessage));
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}

/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  // If any coordinate is missing, return a default distance
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }
  
  // Earth's radius in kilometers
  const R = 6371;
  
  // Convert latitude and longitude from degrees to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  // Haversine formula
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  // Distance in kilometers (rounded to 1 decimal place)
  const distance = (R * c).toFixed(1);
  return distance;
}

/**
 * Update store distances in the UI after stores are already loaded
 * This function is called when user location becomes available after stores are displayed
 */
function updateStoreDistancesInUI(stores) {
  if (!userLocation) {
    console.log('Cannot update distances: user location not available');
    return;
  }
  
  console.log('Updating store distances in the UI based on user location');// Calculate new distances
  const updatedStores = updateStoreDistances(stores);
  
  // Update distance text in each store card
  updatedStores.forEach(store => {
    // Find the store card by name (could use ID in a real app)
    const storeCards = document.querySelectorAll('.flex.h-full.flex-col.gap-4.rounded-lg');
    
    storeCards.forEach(card => {
      const nameElement = card.querySelector('p.text-\\[\\#1b0e0e\\].text-base');
      if (nameElement && nameElement.textContent === store.name) {
        // Find the distance element
        const distanceElement = card.querySelector('p.text-\\[\\#994d51\\].text-sm');
        if (distanceElement) {
          // Extract current text and replace just the distance part
          const currentText = distanceElement.textContent;
          const ratingPart = currentText.split('•')[0].trim();
          // Update with new distance
          distanceElement.textContent = `${ratingPart} • ${store.distance}km`;
        }
      }
    });
  });
  
  console.log('Store distances updated in the UI');
}

/**
 * Update store distances based on user's location
 */
function updateStoreDistances(stores) {
  if (!userLocation) {
    console.log('User location not available, keeping default distances');
    return stores;
  }
  
  console.log('Updating store distances based on user location');
  return stores.map(store => {
    // Create a copy of the store object to avoid modifying the original
    const updatedStore = { ...store };
    
    // If store has latitude and longitude, calculate actual distance
    if (store.latitude && store.longitude) {
      const calculatedDistance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        store.latitude,
        store.longitude
      );
      // Only update if we have a valid calculated distance
      if (calculatedDistance !== null) {
        updatedStore.distance = calculatedDistance;
      }
    }
    
    return updatedStore;
  });
}



/**
 * Fetch stores data for a specific product from the API
 */
async function fetchStoresForProduct(keyName) {
  try {
        // Use a relative path, which works for both local and deployed environments
        const response = await fetch(`/api/stores/for-product/${keyName}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    let stores = await response.json();
    console.log("Fetched stores data:", JSON.stringify(stores));
    
    // Ensure each store has a city property for display when location isn't available
    stores = stores.map(store => {
      // If store doesn't have city property, extract it from name or set to a default
      if (!store.city) {
        // Try to extract area name from store name or use a nearby landmark
        const nameParts = store.name.split(' ');
        if (nameParts.length > 2) {
          // Assume last part could be area name in many cases
          store.city = nameParts[nameParts.length - 1];
        } else if (store.address) {
          // Try to extract city from address if available
          const addressParts = store.address.split(',');
          if (addressParts.length > 1) {
            store.city = addressParts[addressParts.length - 2].trim();
          } else {
            store.city = "Local Area";
          }
        } else {
          store.city = "Local Area"; // Default if we can't determine
        }
      }
      return store;
    });
    
    // Save original stores for later distance updates
    loadedStores = [...stores];
    storesLoaded = true;
    
    // Update store distances based on user's location if available
    stores = updateStoreDistances(stores);
    
    // Find store with lowest price and update seller info
    if (stores && stores.length > 0) {
      // Sort stores by price (ascending)
      const sortedStores = [...stores].sort((a, b) => a.price - b.price);
      // Get store with lowest price (first in sorted array)
      const lowestPriceStore = sortedStores[0];
      // Update seller information in the product info section
      updateSellerInfo(lowestPriceStore);
      console.log(`Found lowest price store: ${lowestPriceStore.name} with price ${lowestPriceStore.price}`);
    } else {
      // If no seller/store data present, update the seller section with the unavailable message
      const sellerSections = document.querySelectorAll('.my-2');
      let sellerSection = null;
      sellerSections.forEach(section => {
        if (section.textContent.includes('Seller -')) {
          sellerSection = section;
        }
      });
      if (sellerSection) {
        sellerSection.innerHTML = '<span class="font-semibold text-gray-700">Unavailable at stores near you</span>';
      }
    }
    
    // Get the container for store cards
    const storesContainer = document.querySelector('#stores-container');
    if (!storesContainer) {
      console.error('Stores container not found in the DOM');
      return;
    }

    // Get product data from shared module to get MRP
    let productMrp = 0;
    try {
      const product = await window.productDataModule.getProductData();
      if (product && product.mrp && product.mrp !== 0) {
        productMrp = product.mrp;
        console.log('Using product MRP:', productMrp);
      }
    } catch (productError) {
      console.error('Error fetching product MRP:', productError);
    }
    // Clear existing hardcoded store cards
    storesContainer.innerHTML = '';
    
    // Render each store card
    stores.forEach(store => {
      storesContainer.appendChild(createStoreCard(store, productMrp));
    });
  } catch (error) {
    console.error('Error fetching store data:', error);
    // Try using fallback data
    useFallbackMockData();
  }
}

/**
 * Create a store card DOM element from store data
 */
function createStoreCard(store, productMrp = 0) {
  // Format price from integer (e.g., 151000) to display format (e.g., ₹74,900)
  const formattedPrice = formatIndianRupees(store.price);
  
  // Use product MRP if available, otherwise fallback to calculated original price
  let originalPrice;
  if (productMrp && productMrp > 0) {
    originalPrice = productMrp;
  } else {
    // Fallback: Calculate original price (assuming 6% higher for the demo)
    originalPrice = Math.round(store.price / 0.94);
  }
  const formattedOriginalPrice = formatIndianRupees(originalPrice);
  
      // Decide whether to show distance or city based on user location availability
      // Show city only when both latitude and longitude are 0, else show distance when location permission is given
      let locationInfo;
      
      if (store.latitude === 0 && store.longitude === 0) {
        // When coordinates are 0, show city only
        if (store.city) {
          locationInfo = store.city;
        } else {
          locationInfo = "Local Area"; // Always show something meaningful as fallback
        }
      } else if (userLocation && store.distance) {
        // When location permission is given and coordinates are not 0, show distance
        locationInfo = `${store.distance}km`;
      } else if (store.city) {
        locationInfo = store.city;
      } else {
        locationInfo = "Local Area"; // Always show something meaningful as fallback
      }
    
    // Create the card container
    const card = document.createElement('div');
    card.className = 'flex h-full flex-col gap-4 rounded-lg md:w-40 min-w-30';
    card.innerHTML = `
      <div
        class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg flex flex-col"
        style='background-image: url("${store.image}");'></div>
        
      <div>
        <p class="text-[#1b0e0e] text-xs sm:text-base font-medium leading-normal">${store.name}</p>
        <div class="flex flex-col gap-x-2"><p class="text-[#994d51] leading-normal"><span class="md:text-lg font-bold text-gray-900">&#8377;${formattedPrice}</span></p>
    <div class="flex flex-row items-center gap-2">
    ${
            originalPrice > store.price
              ? `
      <span class="text-gray-500 line-through text-sm sm:mb-0">&#8377;${formattedOriginalPrice}</span>
      <span class="text-green-600 font-semibold text-sm">${Math.round((originalPrice - store.price) * 100 / originalPrice)}% off</span>
      `: ""}
    </div>
  </div>
                <p class="text-[#994d51] text-xs sm:text-sm font-normal leading-normal">${store.rating} • ${locationInfo}</p>
      ${generateOffersList(store.offers)}
            ${store.affiliate_link ? `<div class="flex flex-row gap-2 mt-2">
        <a href="${store.affiliate_link}" target="_blank" class="flex-1 bg-white text-[#994d51] py-1.5 rounded-lg text-center font-semibold text-sm shadow hover:bg-red-600 hover:text-white transition border border-[#994d51] flex items-center justify-center gap-1">Buy Now
        </a>
      </div>` : ''}
      <div class="flex flex-row gap-2 mt-2">
        <a href="tel:+1234567890" class="flex-1 bg-white text-[#994d51] py-1.5 rounded-lg text-center font-semibold text-sm shadow hover:bg-red-600 hover:text-white transition border border-[#994d51] flex items-center justify-center gap-1" title="Call Store">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 512 512">
            <path d="M392.29,323.08c-23.39,0-46.31-3.63-67.92-10.74a25.26,25.26,0,0,0-24.34,6l-46.14,34.77A348.11,348.11,0,0,1,158.9,249.87l34.58-45.93a25.22,25.22,0,0,0,6-24.19c-7.14-21.61-10.77-44.53-10.77-67.92a25.26,25.26,0,0,0-25.26-25.26H89.71A25.26,25.26,0,0,0,64.45,112C64.45,305.15,206.85,447.55,400,447.55a25.26,25.26,0,0,0,25.26-25.26V348.34A25.26,25.26,0,0,0,400,323.08Z"/>
          </svg>
        </a>
        <a href="https://maps.google.com/?q=${encodeURIComponent(store.name)}" target="_blank" class="flex-1 bg-white text-[#994d51] py-1.5 rounded-lg text-center font-semibold text-sm shadow hover:bg-red-600 hover:text-white transition border border-[#994d51] flex items-center justify-center gap-1" title="Get Location">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 512 512">
            <path d="M256 32C167.64 32 96 103.64 96 192c0 106.04 144.44 271.83 150.62 278.67a24 24 0 0 0 34.76 0C271.56 463.83 416 298.04 416 192c0-88.36-71.64-160-160-160zm0 240a80 80 0 1 1 0-160 80 80 0 0 1 0 160zm0-32a48 48 0 1 0 0-96 48 48 0 0 0 0 96z" />
          </svg>
        </a>
      </div>
    </div>
  `;
  return card;
}

/**
 * Generate HTML for offers list
 */
function generateOffersList(offers) {
  if (!offers || !Array.isArray(offers) || !offers.length) {
    return '';
  }
  return offers.map(offer => `<p class="text-gray-500 text-xs sm:text-sm">• ${offer}</p>`).join('');
}

/**
 * Format a number as Indian Rupees (no ₹ symbol)
 */
function formatIndianRupees(amount) {
  return amount.toString().replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");
}

/**
 * Update seller information in the product info section with the store that has the lowest price
 */
function updateSellerInfo(store) {
  if (!store) return;
  console.log('Updating seller info with store:', store.name);

  // Use a more specific selector to find the seller section
  // Look specifically for the div with a span containing "Seller -"
  const sellerSections = document.querySelectorAll('.my-2');
  let sellerSection = null;

  // Find the specific section that contains the seller information
  sellerSections.forEach(section => {
    if (section.textContent.includes('Seller -')) {
      sellerSection = section;
    }
  });

  if (!sellerSection) {
    console.error('Seller section not found in the DOM');
    return;
  }

  console.log('Found seller section:', sellerSection);

  // Get all anchor tags in the section to find the seller name
  const sellerNameElement = sellerSection.querySelector('a');
  const sellerOffersList = sellerSection.querySelector('ul');

  console.log('Seller name element:', sellerNameElement);
  console.log('Seller offers list:', sellerOffersList);

  if (sellerNameElement && sellerOffersList) {
    // Update seller name
    sellerNameElement.textContent = store.name;
    sellerNameElement.href = "#"; // Keep href as just "#" without the store ID

    // Update offers list
    if (store.offers && Array.isArray(store.offers) && store.offers.length > 0) {
      sellerOffersList.innerHTML = '';
      store.offers.forEach(offer => {
        const listItem = document.createElement('li');
        listItem.className = 'list-disc';
        listItem.textContent = offer;
        sellerOffersList.appendChild(listItem);
      });
    }
    console.log(`Seller info successfully updated to "${store.name}" with ${store.offers?.length || 0} offers`);
  } else {
    console.error('Seller name element or offers list not found in the DOM');
  }
  
  // Update BUY NOW button with affiliate link if available
  if (store.affiliate_link) {
    console.log("Affiliate link found:", store.affiliate_link);
    // Find the button
    // Use a more reliable selector that targets buttons containing "BUY NOW" text
    const buyNowButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.trim().includes('BUY NOW'));
    console.log("BUY NOW button found:", buyNowButton);
    if (buyNowButton) {
      // Create a new <a> element with attributes and classes of the button
      const buyNowLink = document.createElement('a');
      buyNowLink.href = store.affiliate_link;
      buyNowLink.target = "_blank";
      buyNowLink.rel = "noopener";
      buyNowLink.className = buyNowButton.className;
      buyNowLink.innerHTML = buyNowButton.innerHTML;

      // Swap button for <a>
      buyNowButton.parentNode.replaceChild(buyNowLink, buyNowButton);
    }
  }
}

/**
 * Use fallback mock data when API fails
 */
function useFallbackMockData() {
  // Create basic mock stores
  const mockStores = [
    {
      id: 1,
      name: "iCity Malad",
      image: "https://placehold.co/400x400/png?text=iCity",
      price: 74900,
      rating: "4.2",
      distance: "2.4",
      latitude: 19.1947,
      longitude: 72.8479,
      offers: [
        "10% instant discount with HDFC cards",
        "No cost EMI for 6 months"
      ]
    },
    {
      id: 2,
      name: "MobileWorld Andheri",
      image: "https://placehold.co/400x400/png?text=MobileWorld",
      price: 76490,
      rating: "3.8",
      distance: "5.1",
      latitude: 19.1136,
      longitude: 72.8697,
      offers: [
        "5% cashback on SBI cards"
      ]
    },
    {
      id: 3,
      name: "ElectroHub Bandra",
      image: "https://placehold.co/400x400/png?text=ElectroHub",
      price: 75999,
      rating: "4.5",
      distance: "7.3",
      latitude: 19.0596,
      longitude: 72.8295,
      offers: [
        "Additional ₹2000 off on exchange"
      ]
    }
  ];

  // Process the mock data as if it came from the API
  loadedStores = [...mockStores];
  storesLoaded = true;
  
  // Update store distances based on user's location if available
  const stores = updateStoreDistances(mockStores);
  
  // Find store with lowest price and update seller info
  if (stores && stores.length > 0) {
    // Sort stores by price (ascending)
    const sortedStores = [...stores].sort((a, b) => a.price - b.price);
    // Get store with lowest price (first in sorted array)
    const lowestPriceStore = sortedStores[0];
    // Update seller information in the product info section
    updateSellerInfo(lowestPriceStore);
  }
  
  // Get the container for store cards
  const storesContainer = document.querySelector('#stores-container');
  if (!storesContainer) {
    console.error('Stores container not found in the DOM');
    return;
  }
  
  // Clear existing hardcoded store cards
  storesContainer.innerHTML = '';
  
  // Render each store card
  stores.forEach(store => {
    storesContainer.appendChild(createStoreCard(store));
  });
}
