
/**
 * Product Images Handler
 * 
 * This script is responsible for loading and displaying the main product image
 * and vertical image gallery from the product API data.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('[product-images] Initializing product image handler');
  initProductImages();
});

/**
 * Initialize product images functionality
 */
async function initProductImages() {
  try {
    // Get the product data using the shared product data module
    const productData = await window.productDataModule.getProductData();
    
    // Log the product data to understand its structure
    console.log('[product-images] Product data received:', productData);
    // Check for different possible image URL properties in the API response
    const imageUrl = getImageUrlFromProduct(productData);
    if (imageUrl) {
      console.log('[product-images] Image URL found, updating main image');
      updateMainImage(imageUrl);
      
      // After setting main image, try to load the vertical image gallery
      if (productData && productData.key_name) {
        loadVerticalImageGallery(productData.key_name);
      }
    } else {
      console.warn('[product-images] No image URL found in product data');
    }
  } catch (error) {
    console.error('[product-images] Error loading product images:', error);
  }
}

/**
 * Extract image URL from product data, handling different possible property names
 * @param {Object} productData - The product data from the API
 * @return {string|null} - The image URL or null if not found
 */
function getImageUrlFromProduct(productData) {
  if (!productData) return null;
  
  // Check various possible property names for the image URL
  const possibleImageProps = ['image_url', 'imageUrl', 'image', 'imgUrl', 'img', 'thumbnail', 'main_image'];
  
  for (const prop of possibleImageProps) {
    if (productData[prop]) {
      console.log(`[product-images] Found image URL in product.${prop}`);
      return productData[prop];
    }
  }
  
  // If we have an images array, try to get the first image
  if (Array.isArray(productData.images) && productData.images.length > 0) {
    console.log('[product-images] Found image URL in product.images[0]');
    // Handle both string arrays and object arrays with url property
    return typeof productData.images[0] === 'string'
      ? productData.images[0] 
      : productData.images[0].url || productData.images[0].src || null;
  }
  return null;
}

/**
 * Update the main product image with the provided URL
 * @param {string} imageUrl - URL of the main product image
 */
function updateMainImage(imageUrl) {
  // Find the main image element
  const mainImageElement = document.getElementById('main-image');
  
  if (!mainImageElement) {
    console.error('[product-images] Main image element not found');
    return;
  }
  
  console.log(`[product-images] Updating main image src to: ${imageUrl}`);
  // Update the src attribute
  mainImageElement.src = imageUrl;
}

/**
 * Fetch vertical image gallery for a product
 * @param {string|number} productId - ID of the product
 */
async function loadVerticalImageGallery(keyName) {
  if (!keyName) {
    console.warn('[product-images] No product key_name provided for vertical gallery');
    return;
  }
  // Add a visible indicator to the page to show we're attempting to load the gallery
  console.log(`[product-images] ATTEMPTING TO FETCH vertical image gallery for product key_name: ${keyName}`);
  // Define the URL we're going to fetch from
  const apiUrl = `/api/images/gallery/${keyName}`;
  console.log('[product-images] API URL:', apiUrl);
  
  try {
    // Make the API request directly without caching
    console.log('[product-images] Fetching fresh gallery images...');
    const response = await fetch(apiUrl);
    console.log('[product-images] Fetch response received:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch vertical gallery: ${response.status} ${response.statusText}`);
    }
    
    // Parse the JSON response
    const images = await response.json();
    console.log('[product-images] Vertical gallery images received:', images);
    if (Array.isArray(images) && images.length > 0) {
      displayVerticalGallery(images);
    } else {
      console.log('[product-images] No vertical gallery images found for this product');
    }
  } catch (error) {
    console.error('[product-images] Error fetching vertical gallery:', error);
    // Show the error in a more visible way for debugging
    const mainImage = document.getElementById('main-image');
    if (mainImage && mainImage.parentNode) {
      const errorDiv = document.createElement('div');
      errorDiv.textContent = `Error: ${error.message}`;
      errorDiv.style.color = 'red';
      errorDiv.style.backgroundColor = 'rgba(255,0,0,0.1)';
      errorDiv.style.padding = '5px';
      errorDiv.style.marginTop = '5px';
      mainImage.parentNode.appendChild(errorDiv);
    }
  }
}

/**
 * Display the vertical image gallery in the UI
 * @param {Array} images - Array of image data from the entity_image table
 */
function displayVerticalGallery(images) {
  console.log('[product-images] Starting to display vertical gallery with', images.length, 'images');
  
  // Find all potential gallery containers to understand the DOM structure
  const allContainers = document.querySelectorAll('.gallery-container, .thumbnail-container, [class*="gallery"], [class*="thumbnail"]');
  console.log('[product-images] Found potential gallery containers:', allContainers.length);
  
  // Try to find the most appropriate container
  // First look for the div at line 110 in the products.html
  const galleryContainer = document.querySelector('.flex.flex-row.md\\:flex-col.gap-2.w-full.md\\:w-16');
  
  if (!galleryContainer) {
    console.warn('[product-images] Primary gallery container not found, looking for alternatives');
    // Try alternate selectors if the primary one fails
    const alternativeContainer = document.querySelector('.gallery-container, .thumbnail-container');
    if (!alternativeContainer) {
      console.error('[product-images] No suitable gallery container found in the DOM');
      // Create a visible error message on the page
      const mainImage = document.getElementById('main-image');
      if (mainImage && mainImage.parentNode) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'Gallery container not found';
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '5px';
        mainImage.parentNode.appendChild(errorDiv);
      }
      return;
    }
    console.log('[product-images] Using alternative container:', alternativeContainer);
    return displayGalleryInContainer(images, alternativeContainer);
  }
  console.log('[product-images] Using primary gallery container:', galleryContainer);
  return displayGalleryInContainer(images, galleryContainer);
}

/**
 * Helper function to display gallery in a specific container
 */
function displayGalleryInContainer(images, container) {
  // Log the current content before clearing
  console.log('[product-images] Container before clearing:', container.innerHTML);
  
  // Clear existing thumbnails if any
  container.innerHTML = '';
  // Add each image to the gallery
  images.forEach((image, index) => {
    // Create thumbnail container
    const thumbContainer = document.createElement('div');
    thumbContainer.className = 'thumbnail border hover:border-2 hover:border-blue-500 p-1 mb-2 shrink-0';
    if (index === 0) {
      thumbContainer.classList.add('border-2', 'border-blue-500');
      thumbContainer.classList.remove('hover:border-2', 'hover:border-blue-500');
    }
    // Create thumbnail image
    const thumbImg = document.createElement('img');
    thumbImg.className = 'gallery-thumb w-12 h-16 object-cover rounded';
    thumbImg.src = image.image_url;
    thumbImg.alt = `API Gallery Thumb ${index + 1}`;
    thumbImg.dataset.index = index;
    thumbImg.dataset.source = 'api';
    
    // Add click event to update main image
    thumbImg.addEventListener('click', function() {
      updateMainImage(image.image_url);
      // Update active thumbnail styling
      document.querySelectorAll('.thumbnail').forEach(div => {
        div.classList.remove('border-blue-500');
        div.classList.add('hover:border-2', 'hover:border-blue-500');
        div.classList.remove('border-2');
      });
      
      thumbContainer.classList.add('border-2', 'border-blue-500');
      thumbContainer.classList.remove('hover:border-2', 'hover:border-blue-500');
      });
    
    // Append to container
    thumbContainer.appendChild(thumbImg);
    container.appendChild(thumbContainer);
  });
  console.log('[product-images] Vertical gallery displayed with', images.length, 'images');
  console.log('[product-images] Container after update:', container.innerHTML);
}

/**
 * Set up listener for product data changes
 * (in case product variants are selected)
 */
if (window.productDataModule && typeof window.productDataModule.addEventListener === 'function') {
  window.productDataModule.addEventListener('product-loaded', (productData) => {
    console.log('[product-images] Product data updated event received');
    const imageUrl = getImageUrlFromProduct(productData);
    if (imageUrl) {
      updateMainImage(imageUrl);
      // Also update the vertical image gallery when the product changes
      if (productData && productData.key_name) {
        loadVerticalImageGallery(productData.key_name);
      }
    }
  });
}

