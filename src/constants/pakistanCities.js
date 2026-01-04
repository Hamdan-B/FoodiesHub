/**
 * List of major Pakistani cities
 * Used for store location selection and filtering
 */
export const PAKISTAN_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Sukkur',
  'Larkana',
  'Abbottabad',
  'Bahawalpur',
  'Sargodha',
  'Sheikhupura',
  'Rahim Yar Khan',
  'Mardan',
  'Swat',
  'Gwadar',
  'Turbat',
  'Khuzdar',
  'Kasur',
  'Sahiwal',
  'Okara',
  'Gujrat',
  'Jhelum',
  'Sadiqabad',
  'Chiniot',
  'Kamoke',
  'Kohat',
  'Khanpur',
  'Jacobabad',
  'Shikarpur',
  'Muzaffargarh',
  'Khanewal',
  'Jhang',
  'Hafizabad',
  'Pakpattan',
  'Daska',
  'Gojra',
  'Sambrial',
  'Nawabshah',
  'Chishtian',
  'Kot Addu',
  'Haveli Lakha',
  'Chakwal',
  'Badin',
  'Other',
];

/**
 * Check if a city is in the predefined list
 * @param {string} city - City name to check
 * @returns {boolean}
 */
export function isValidCity(city) {
  return PAKISTAN_CITIES.includes(city);
}

/**
 * Get display name for city (handles "Other" for unknown cities)
 * @param {string} city - City name
 * @returns {string}
 */
export function getCityDisplayName(city) {
  if (!city) return 'Not specified';
  return isValidCity(city) ? city : 'Other';
}

