/**
 * Similar Products Module
 * 
 * Uses the new consolidated API endpoint to fetch similar products
 * with a single API call instead of multiple requests
 */

(async function() {
  // Get current product ID from URL path or query param (for backward compatibility)
  let keyName;
  
  // First try to get from URL path (/product/product-name)
  const pathMatch = window.location.pathname.match(/\/product\/([^\/]+)/);
  if (pathMatch) {
    keyName = pathMatch[1];
  } else {
    // Fallback to query parameter for backward compatibility (?name=product-name)
    const params = new URLSearchParams(window.location.search);
    keyName = params.get('name');
  }
  
  if (!keyName) return;

  // Container for similar products
  const simContainer = document.querySelector('#section-similar + div > div.flex.items-stretch.px-0.sm\\:px-4.py-4.gap-3');
  if (!simContainer) return;

  try {
    // Use our consolidated API endpoint through the API cache service
    const similarUrl = `/api/products/similar/${encodeURIComponent(keyName)}`;
    const similarProducts = await fetch(similarUrl).then(res => res.ok ? res.json() : []);
    console.log('Similar products from consolidated API:', similarProducts);// Clear container
    simContainer.innerHTML = '';
    
    // Render each similar product
    for (const product of similarProducts) {
      const div = document.createElement('div');
      div.className = 'flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40 cursor-pointer';
      div.innerHTML = `
        <div
          class="w-full bg-center bg-no-repeat aspect-[3/4.3] bg-contain rounded-lg bg-[#fcf8f8]"
          style='background-image: url("${product.productImage || "https://via.placeholder.com/160x160?text=No+Image"}");'
        ></div>
        <div>
          <p class="text-[#1b0e0e] text-base font-medium leading-normal">${product.verticalName}</p>
          <p class="text-[#994d51] text-sm font-normal leading-normal">From ₹${product.price ? Number(product.price).toLocaleString('en-IN') : 'N/A'}</p>
        </div>
      `;
      div.addEventListener('click', () => {
        window.location.href = `/product/${product.key_name}`;
      });
      simContainer.appendChild(div);
    }
    
    // Show message if no similar products
    if (similarProducts.length === 0) {
      simContainer.innerHTML = "<div class='px-2'>No similar products found.</div>";
    }
  } catch (error) {
    console.error('Error fetching similar products:', error);
    simContainer.innerHTML = "<div class='px-2'>Error loading similar products.</div>";
  }
})();