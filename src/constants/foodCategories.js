/**
 * Predefined food categories
 * Used for food item categorization and filtering
 */
export const FOOD_CATEGORIES = [
  'Fast Food',
  'Home Made',
  'Pakistani',
  'Chinese',
  'BBQ',
  'Pizza',
  'Burger',
  'Desi',
  'Biryani',
  'Karahi',
  'Beverages',
  'Desserts',
  'Snacks',
  'Healthy',
  'Vegetarian',
  'Bakery',
  'Seafood',
  'Continental',
  'Italian',
  'Thai',
  'Other',
];

/**
 * Check if a category is in the predefined list
 * @param {string} category - Category name to check
 * @returns {boolean}
 */
export function isValidCategory(category) {
  return FOOD_CATEGORIES.includes(category);
}

/**
 * Get display name for category (handles "Other" for unknown categories)
 * @param {string} category - Category name
 * @returns {string}
 */
export function getCategoryDisplayName(category) {
  if (!category) return 'Not specified';
  return isValidCategory(category) ? category : 'Other';
}

