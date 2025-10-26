/**
 * Model layer for'stores'.
 * Handles direct DB queries for store data.
 */
const pool = require('../config/db');

/**
 * Get all stores for a specific product.
 * Returns an array of store data with pricing information.
 */
async function getStoresForProduct(keyName) {
  if (!keyName) return [];
  
  try {
    // SQL query joining store and store_product_mapping tables
    const { rows: results } = await pool.query(
      `SELECT
        s.name, s.image, s.rating, s.latitude, s.longitude, s.city,
        spm.price, spm.offers, spm.affiliate_link
      FROM
        store s
      JOIN
        store_product_mapping spm ON s.id = spm.store_id
      JOIN
        products p ON spm.product_id = p.id
      WHERE
        p.key_name = $1
      ORDER BY
        spm.price asc`,
      [keyName]
    );
    
    // Format the results
    return results.map(store => {
      // Parse offers from JSON string if needed, with proper error handling
      let offers = [];
      if (store.offers) {
        try {
          if (typeof store.offers === 'string') {
            // Try to parse as JSON
            offers = JSON.parse(store.offers);
          } else if (Array.isArray(store.offers)) {
            offers = store.offers;
          }
        } catch (error) {
          console.error('[storeModel] Error parsing offers JSON:', error.message);
          
          // If it's a string but JSON parsing failed, try to normalize common errors
          if (typeof store.offers === 'string' && store.offers.trim().startsWith('[') && store.offers.trim().endsWith(']')) {
            try {
              // Fix missing commas between array elements
              const fixedJson = store.offers.replace(/"\s+"/g, '", "');
              offers = JSON.parse(fixedJson);
              console.log('[storeModel] Successfully fixed and parsed malformed JSON offers');
            } catch (fixError) {
              console.error('[storeModel] Failed to fix malformed JSON:', fixError.message);
              // Default offers if all parsing attempts fail
              offers = ["Service center replacement/repair", "GST invoice available"];
            }
          } else if (typeof store.offers === 'string' && store.offers.trim().startsWith('{') && store.offers.trim().endsWith('}')) {
            try {
              // Handle curly brace format with quoted strings
              // Example: {"7 days service center replacement / repair","GST invoice available"}
              const content = store.offers.trim().substring(1, store.offers.trim().length - 1);
              const matches = content.match(/"([^"]*)"/g);
              if (matches) {
                offers = matches.map(match => match.substring(1, match.length - 1));
                console.log('[storeModel] Successfully extracted offers from curly brace format');
              } else {
                offers = ["Service center replacement/repair", "GST invoice available"];
              }
            } catch (fixError) {
              console.error('[storeModel] Failed to fix curly brace format:', fixError.message);
              offers = ["Service center replacement/repair", "GST invoice available"];
            }
          } else {
            // Default offers if parsing fails and can't be fixed
            offers = ["Service center replacement/repair", "GST invoice available"];
          }
        }
      }
      
      // Calculate distance (using geolocation would be implemented in a real app)
      // For now just using a random distance as placeholder
      const distance = (Math.random() * 3+ 1).toFixed(1);
      
return {
  
  name: store.name,
  image: store.image,
  rating: store.rating,
  latitude: store.latitude,
  longitude: store.longitude,
  city: store.city || "Local Area",
  price: store.price,
  offers: offers,
  distance: distance,
  affiliate_link: store.affiliate_link  // Add this line
};
    });
  } catch (error) {
    console.error('[storeModel] getStoresForProduct error:', error.message);
    return [];
  }
}

/**
 * Generate mock store data for development/testing
 */
function generateMockStores() {
  const mockStores = [
    {
      id: 1,
      name: "Electronics Store 1",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBg4HKvF49kpdo5dTFBlZucUfZGS-6IxcYq98Nq4UjW3cdUMVD_xhAxiJwTh0eVzZnmNAX1sI0chBeCqt1w7x0wn3GtZrE-6Mu1_La0lB6jjSiqamLzFQ4IFzJi4SY2NHgV_69uUGVaEWodVh80ecCnXNP8vSrNGbF2uDQvoLQglu_32XTrbRcuHZFmmmdPFTTntqmUwZNAoXhJSNYmm5uyiMogZnUU-lto7HsmkJ9-qJxAxH2MHS1sqoJz829NTcuHUzjF60mP-A",
      rating: 4.5,
      price: 74900,
      distance: "1.2",
      offers: ["7 days service center replacement/repair", "GST invoice available"]
    },
    {
      id: 2,
      name: "Electronics Store 2",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0-E6SmVwoQzdaa436Y4vQzdPSBRfKNndm1UTWTFOknM-WNeqsD575TExNjP8bQaJtWn_RhBrN7xygxGxZ8kdKe0TPI1pOQGwQPNJR2KQIFHSYsPEcH0cnCfwW1ptJm-cIHIkPPm1jwCfFMket55GSxQ4nHbMv6QGy4efBy7l9lu4TEJprydn9IumUUF7ZCXpQdQomXEe-7x8Qpbv5u5BPfvhgPjWB_qGNrniAqUuVKCqj1DG48hhgg3hv69WdKUWoJRTDIbwgZw",
      rating: 4.2,
      price: 69900, // Changed price to be lower for sorting demonstration
      distance: "2.5",
      offers: ["10 days service center replacement/repair", "GST invoice available"]
    },
    {
      id: 3,
      name: "Electronics Store 3",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKtO7KvGXRg8CUc30p_lFyp86bdmE8U5AQh1JMQ00puRh8Uo1UFcz7uaIjF0exfCKHbBOQeDFhMdjRkB9qrcCWCD0ZF4W1StlWBYXbgRByNocvXAsOv8LEVJ4h1t6XILQqnPH3651hkWbTFWILuE-RY8qMau5kNU6ZKl434jc6js1W2ypti8uiRPBEHlomVZ4tNPmLV48YmB4sztPviqJtKxZLR0v6P6DKwgWEl4gis79_-1j3OD2BJaP163r7lbjR9POXN6lZ-A",
      rating: 4.7,
      price: 72900, // Changed price to be in the middle for sorting demonstration
      distance: "1.8",
      offers: ["1 day service center replacement/repair", "GST invoice available"]
    }
  ];
  
  // Sort by price in ascending order
  return mockStores.sort((a, b) => a.price - b.price);
}

module.exports = { getStoresForProduct, generateMockStores };
