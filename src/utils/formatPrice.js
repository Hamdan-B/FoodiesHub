/**
 * Format price in Pakistani Rupees (PKR)
 * @param {number|string} price - Price value
 * @returns {string} Formatted price string (e.g., "Rs 350")
 */
export function formatPrice(price) {
  if (price === null || price === undefined || price === '') {
    return 'Rs 0';
  }

  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return 'Rs 0';
  }

  // Format with commas for thousands
  const formatted = numPrice.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `Rs ${formatted}`;
}

