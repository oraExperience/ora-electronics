/**
 * Product Variants Handler
 * 
 * This script handles fetching product variants based on the current product's vertical,
 * updating the UI with storage and color options, and handling click events for variant selection.
 */

// Store the current product data
let currentProduct = null;
// Track selected variant ID
let selectedVariantId = null;
// Store all variants fetched from API
let allVariants = [];

/**
 * Initialize the variants functionality once the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async function() {
  // Wait for the main product data to be loaded by the existing script
  await waitForProductLoad();
  
  // Once product is loaded, fetch variants and setup UI
  initVariants();
});

/**
 * Wait for the main product script to load the product data
 */
function waitForProductLoad() {
  return new Promise((resolve) => {
    // Check if product data is already available
    if (window.productLoaded) {
      resolve();return;
    }
    
    // Create or use existing event for product loaded
    const checkInterval = setInterval(() => {
      // Try to find the main product information
      const productNameEl = document.querySelector('h2.text-xl, h2.text-2xl, h2.text-3xl');
      const productPriceEl = document.querySelector('span.text-lg.font-bold.text-gray-900, span.text-xl.font-bold.text-gray-900');
      if (productNameEl && productPriceEl && productNameEl.textContent.trim()) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
    
    // Safety timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 5000);
  });
}

/**
 * Initialize variants functionality
 */
async function initVariants() {
  try {
    // Get current product ID and data - support both SEO-friendly and query parameter formats
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
    
    if (!keyName) {
      console.error('No product key_name found in URL');
      return;
    }
    
    // Use the shared product data module instead of making a separate API call
    currentProduct = await window.productDataModule.getProductData();
    if (!currentProduct) {
      console.error('Failed to load product data');
      return;
    }
    selectedVariantId = currentProduct.key_name;
  // Update rating in DOM if element exists
  const ratingEl = document.getElementById('product-rating');
  if(ratingEl && currentProduct.rating) ratingEl.innerText = currentProduct.rating;
    
    if (!currentProduct.vertical_id) {
      console.error('Product has no vertical information');
      return;
    }
    
    // Fetch variants for this product's vertical
    const variantsResponse = await fetch(`/api/products/product-variants?vertical_id=${encodeURIComponent(currentProduct.vertical_id)}`);
    if (!variantsResponse.ok) {
      console.error('Failed to fetch product variants');
      return;
    }
    
    allVariants = await variantsResponse.json();
    
    if (!allVariants || allVariants.length === 0) {
      console.log('No variants found for this product');
      return;
    }
    
    // Update the UI with available variants
    updateVariantsUI(allVariants);
  } catch (error) {
    console.error('Error initializing variants:', error);
  }
}

/**
 * Update the UI with available variants
 */
function updateVariantsUI(variants) {
  updateStorageVariants(variants);
  updateRAMVariants(variants);
  updateColorVariants(variants);
}

/**
 * Extract unique storage values and update storage variant elements
 */
function updateStorageVariants(variants) {
  // Extract unique storage values and sort them numerically
  const uniqueStorageValues = [...new Set(variants.filter(v => v.storage).map(v => v.storage))]
    .sort((a, b) => {
      // Extract numeric values from storage strings (e.g., "128GB" -> 128)
      const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
      return numA - numB;
    });
  
  // Find storage container
  const storageContainer = document.querySelector('div.flex.gap-1.sm\\:gap-2.ml-2, div.flex.gap-2.ml-2');
  let storageSection = null;
  
  if (storageContainer) {
    // Find the parent section that contains both the label and container
    storageSection = storageContainer.parentElement;
  }
  
  if (!storageContainer) {
    return;
  }
  
  // If no storage variants exist, hide the entire storage section
  if (uniqueStorageValues.length === 0) {
    if (storageSection) {
      storageSection.style.display = 'none';
    }
    return;
  }
  
  // Show the storage section if it was previously hidden
  if (storageSection) {
    storageSection.style.display = '';
  }
  
  // Clear existing storage options
  storageContainer.innerHTML = '';
  
  // Create and add new storage buttons
  uniqueStorageValues.forEach(storage => {
    // Find variants with this storage
    const storageVariants = variants.filter(v => v.storage === storage);
    // Use the first variant's ID for this storage
    const variantId = storageVariants.length > 0 ? storageVariants[0].key_name : null;
    
    const button = document.createElement('button');
    button.className = 'px-1 py-1 sm:px-2 sm:py-1 border-2 rounded font-semibold text-xs sm:text-base';
    button.textContent = storage;
    button.dataset.variantId = variantId;
    button.dataset.storage = storage;
    
    // Set active state if this is the current product's storage
    if (storage === currentProduct.storage) {
      button.classList.add('border-blue-600', 'text-blue-600', 'bg-blue-50');
    } else {
      button.classList.add('border-gray-200', 'text-gray-700', 'bg-white');
    }// Add click event listener
    button.addEventListener('click', handleStorageVariantClick);
    
    storageContainer.appendChild(button);
  });
}

/**
 * Extract unique RAM values and update RAM variant elements
 */
function updateRAMVariants(variants) {
  // Extract unique RAM values and sort them numerically
  const uniqueRAMValues = [...new Set(variants.filter(v => v.ram).map(v => v.ram))]
    .sort((a, b) => {
      // Extract numeric values from RAM strings (e.g., "8GB" -> 8)
      const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
      return numA - numB;
    });
  
  // Find RAM container - looking for the container after the RAM label
  const ramContainers = document.querySelectorAll('div.flex.gap-1.sm\\:gap-2.ml-2, div.flex.gap-2.ml-2');
  let ramContainer = null;
  let ramSection = null;
  
  // Find the RAM container by looking for the one that comes after "RAM" text
  ramContainers.forEach(container => {
    const prevElement = container.previousElementSibling;
    if (prevElement && prevElement.textContent && prevElement.textContent.includes('RAM')) {
      ramContainer = container;
      // Find the parent section that contains both the label and container
      ramSection = container.parentElement;
    }
  });
  
  if (!ramContainer) {
    return;
  }
  
  // If no RAM variants exist, hide the entire RAM section
  if (uniqueRAMValues.length === 0) {
    if (ramSection) {
      ramSection.style.display = 'none';
    }
    return;
  }
  
  // Show the RAM section if it was previously hidden
  if (ramSection) {
    ramSection.style.display = '';
  }
  
  // Clear existing RAM options
  ramContainer.innerHTML = '';
  
  // Create and add new RAM buttons
  uniqueRAMValues.forEach(ram => {
    // Find variants with this RAM
    const ramVariants = variants.filter(v => v.ram === ram);
    // Use the first variant's ID for this RAM
    const variantId = ramVariants.length > 0 ? ramVariants[0].key_name : null;
    
    const button = document.createElement('button');
    button.className = 'px-1 py-1 sm:px-2 sm:py-1 border-2 rounded font-semibold text-xs sm:text-base';
    button.textContent = ram;
    button.dataset.variantId = variantId;
    button.dataset.ram = ram;
    
    // Set active state if this is the current product's RAM
    if (ram === currentProduct.ram) {
      button.classList.add('border-blue-600', 'text-blue-600', 'bg-blue-50');
    } else {
      button.classList.add('border-gray-200', 'text-gray-700', 'bg-white');
    }
    
    // Add click event listener
    button.addEventListener('click', handleRAMVariantClick);
    
    ramContainer.appendChild(button);
  });
}

/**
 * Extract unique color values and update color variant elements
 */
function updateColorVariants(variants) {
  // Extract unique color values
  const uniqueColorValues = [...new Set(variants.filter(v => v.colour).map(v => v.colour))];
  
  // Find color container
  const colorContainer = document.querySelector('div.flex.gap-1');if (!colorContainer || uniqueColorValues.length === 0) {
    return;
  }
  
  // Clear existing color options
  colorContainer.innerHTML = '';
  
  // Create and add new color buttons
  uniqueColorValues.forEach(color => {
    // Find variants with this color
    const colorVariants = variants.filter(v => v.colour === color);
    // Use the first variant's ID for this color
    const variantId = colorVariants.length > 0 ? colorVariants[0].key_name : null;
    const button = document.createElement('button');
    button.className = 'focus:outline-none border-2 rounded w-6 h-6 sm:w-8 sm:h-8';
    button.dataset.variantId = variantId;
    button.dataset.color = color;
    
        // Set background color based on color hex code
    setButtonBackgroundColor(button, color);
    
    // Set active state if this is the current product's color
    if (color === currentProduct.colour) {
      button.classList.add('border-blue-600');
    } else {
      button.classList.add('border-grey-100', 'border');
    }
    
    // Add click event listener
    button.addEventListener('click', handleColorVariantClick);
    
    colorContainer.appendChild(button);
  });
}

/**
 * Set background color of button based on color hex code
 */
function setButtonBackgroundColor(button, colorHex) {
  if (colorHex && colorHex.match(/^[0-9A-Fa-f]{6}$/)) {
    // If colorHex is a valid 6-digit hex code (without #), use it directly
    button.classList.add(`bg-[#${colorHex}]`);
  } else {
    // Fallback to a neutral gray if color hex is invalid
    button.classList.add('bg-gray-300');
  }
}

/**
 * Handle click on storage variant buttons
 */
function handleStorageVariantClick(event) {
  const button = event.currentTarget;
  const storage = button.dataset.storage;
  
  if (!storage) return;
  
  // Update active styling for all storage buttons
  const storageButtons = document.querySelectorAll('button[data-storage]');
  storageButtons.forEach(btn => {
    if (btn.dataset.storage === storage) {
      btn.classList.remove('border-gray-200', 'text-gray-700');
      btn.classList.add('border-blue-600', 'text-blue-600', 'bg-blue-50');
    } else {
      btn.classList.remove('border-blue-600', 'text-blue-600', 'bg-blue-50');
      btn.classList.add('border-gray-200', 'text-gray-700', 'bg-white');
    }
  });
  
  // First, try to find a variant with the same color and RAM in the selected storage
  const currentColor = currentProduct.colour;
  const currentRAM = currentProduct.ram;
  let selectedVariant = null;
  
  if (currentColor && currentRAM) {
    // Look for a variant with the same color, RAM, and the selected storage
    selectedVariant = allVariants.find(v =>
      v.storage === storage &&
      v.colour === currentColor &&
      v.ram === currentRAM
    );
    if (selectedVariant) {
      console.log(`Found variant with same color (${currentColor}) and RAM (${currentRAM}) in ${storage} storage`);
    } else {
      console.log(`No variant found with color ${currentColor} and RAM ${currentRAM} in ${storage} storage`);
    }
  }
  
  // If no variant with same color and RAM found, try to find one with same color
  if (!selectedVariant && currentColor) {
    selectedVariant = allVariants.find(v =>
      v.storage === storage &&
      v.colour === currentColor
    );
    if (selectedVariant) {
      console.log(`Found variant with same color (${currentColor}) in ${storage} storage`);
    }
  }
  
  // If no variant with same color found, try to find one with same RAM
  if (!selectedVariant && currentRAM) {
    selectedVariant = allVariants.find(v =>
      v.storage === storage &&
      v.ram === currentRAM
    );
    if (selectedVariant) {
      console.log(`Found variant with same RAM (${currentRAM}) in ${storage} storage`);
    }
  }
  
  // If no variant with same color or RAM found, get the first variant of that storage
  if (!selectedVariant) {
    selectedVariant = allVariants.find(v => v.storage === storage);
    if (selectedVariant) {
      console.log(`Using first available variant in ${storage} storage`);
    }
  }
  
  // Update selected variant ID and redirect if a variant was found
  if (selectedVariant) {
    selectedVariantId = selectedVariant.key_name;
    redirectToProductPage(selectedVariant.key_name);
  } else {
    console.error(`No variant found for storage: ${storage}`);
  }
}

/**
 * Handle click on RAM variant buttons
 */
function handleRAMVariantClick(event) {
  const button = event.currentTarget;
  const ram = button.dataset.ram;
  
  if (!ram) return;
  
  // Update active styling for all RAM buttons
  const ramButtons = document.querySelectorAll('button[data-ram]');
  ramButtons.forEach(btn => {
    if (btn.dataset.ram === ram) {
      btn.classList.remove('border-gray-200', 'text-gray-700');
      btn.classList.add('border-blue-600', 'text-blue-600', 'bg-blue-50');
    } else {
      btn.classList.remove('border-blue-600', 'text-blue-600', 'bg-blue-50');
      btn.classList.add('border-gray-200', 'text-gray-700', 'bg-white');
    }
  });
  
  // First, try to find a variant with the same color and storage in the selected RAM
  const currentColor = currentProduct.colour;
  const currentStorage = currentProduct.storage;
  let selectedVariant = null;
  
  if (currentColor && currentStorage) {
    // Look for a variant with the same color, storage, and the selected RAM
    selectedVariant = allVariants.find(v =>
      v.ram === ram &&
      v.colour === currentColor &&
      v.storage === currentStorage
    );
    if (selectedVariant) {
      console.log(`Found variant with same color (${currentColor}) and storage (${currentStorage}) in ${ram} RAM`);
    } else {
      console.log(`No variant found with color ${currentColor} and storage ${currentStorage} in ${ram} RAM`);
    }
  }
  
  // If no variant with same color and storage found, try to find one with same storage
  if (!selectedVariant && currentStorage) {
    selectedVariant = allVariants.find(v =>
      v.ram === ram &&
      v.storage === currentStorage
    );
    if (selectedVariant) {
      console.log(`Found variant with same storage (${currentStorage}) in ${ram} RAM`);
    }
  }
  
  // If no variant with same storage found, try to find one with same color
  if (!selectedVariant && currentColor) {
    selectedVariant = allVariants.find(v =>
      v.ram === ram &&
      v.colour === currentColor
    );
    if (selectedVariant) {
      console.log(`Found variant with same color (${currentColor}) in ${ram} RAM`);
    }
  }
  
  // If no variant with same color found, get the first variant of that RAM
  if (!selectedVariant) {
    selectedVariant = allVariants.find(v => v.ram === ram);
    if (selectedVariant) {
      console.log(`Using first available variant in ${ram} RAM`);
    }
  }
  
  // Update selected variant ID and redirect if a variant was found
  if (selectedVariant) {
    selectedVariantId = selectedVariant.key_name;
    redirectToProductPage(selectedVariant.key_name);
  } else {
    console.error(`No variant found for RAM: ${ram}`);
  }
}

/**
 * Handle click on color variant buttons
 */
function handleColorVariantClick(event) {
  const button = event.currentTarget;
  const color = button.dataset.color;
  
  if (!color) return;
  
  // Update active styling for all color buttons
  const colorButtons = document.querySelectorAll('button[data-color]');
  colorButtons.forEach(btn => {
    if (btn.dataset.color === color) {
      btn.classList.remove('border-transparent');
      btn.classList.add('border-blue-600');
    } else {
      btn.classList.remove('border-blue-600');
      btn.classList.add('border-transparent');
    }
  });
  
  // First, try to find a variant with the same storage and RAM in the selected color
  const currentStorage = currentProduct.storage;
  const currentRAM = currentProduct.ram;
  let selectedVariant = null;
  
  if (currentStorage && currentRAM) {
    // Look for a variant with the same storage, RAM, and the selected color
    selectedVariant = allVariants.find(v =>
      v.colour === color &&
      v.storage === currentStorage &&
      v.ram === currentRAM
    );
    
    if (selectedVariant) {
      console.log(`Found variant with same storage (${currentStorage}) and RAM (${currentRAM}) in ${color} color`);
    } else {
      console.log(`No variant found with storage ${currentStorage} and RAM ${currentRAM} in ${color} color`);
    }
  }
  
  // If no variant with same storage and RAM found, try to find one with same storage
  if (!selectedVariant && currentStorage) {
    selectedVariant = allVariants.find(v =>
      v.colour === color &&
      v.storage === currentStorage
    );
    
    if (selectedVariant) {
      console.log(`Found variant with same storage (${currentStorage}) in ${color} color`);
    }
  }
  
  // If no variant with same storage found, try to find one with same RAM
  if (!selectedVariant && currentRAM) {
    selectedVariant = allVariants.find(v =>
      v.colour === color &&
      v.ram === currentRAM
    );
    
    if (selectedVariant) {
      console.log(`Found variant with same RAM (${currentRAM}) in ${color} color`);
    }
  }
  
  // If no variant with same storage or RAM found, get the first variant of that color
  if (!selectedVariant) {
    selectedVariant = allVariants.find(v => v.colour === color);
    if (selectedVariant) {
      console.log(`Using first available variant in ${color} color`);
    }
  }
  
  // Update selected variant ID and redirect if a variant was found
  if (selectedVariant) {
    selectedVariantId = selectedVariant.key_name;
    redirectToProductPage(selectedVariant.key_name);
  } else {
    console.error(`No variant found for color: ${color}`);
  }
}

/**
 * Redirect to the product page for a given variant ID
 */
function redirectToProductPage(keyName) {
  window.location.href = `/product/${keyName}`;
}