import { supabase } from './supabaseClient';

// Supabase bucket name (defaults to 'public' if not specified in env)
const SUPABASE_BUCKET_NAME = import.meta.env.VITE_SUPABASE_BUCKET_NAME || 'public';

/**
 * Upload image to Supabase Storage
 * @param {File} file - File to upload
 * @param {string} folderPath - Folder path in bucket (e.g., 'stores', 'foods', 'riders')
 * @param {string} fileName - File name (optional, will generate if not provided)
 * @returns {Promise<string>} Public URL
 */
export async function uploadImage(file, folderPath, fileName = null) {
  try {
    // Generate unique filename if not provided
    if (!fileName) {
      const timestamp = Date.now();
      const randomId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      fileName = `${timestamp}_${randomId}.${fileExtension}`;
    }

    // Construct full path in bucket
    const filePath = `${folderPath}/${fileName}`;

    // Upload file to Supabase Storage (public bucket)
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Upload store logo
 * @param {File} file - Logo file
 * @param {string} storeId - Store ID for unique filename
 * @returns {Promise<string>} Public URL
 */
export async function uploadStoreLogo(file, storeId) {
  const fileName = `${storeId}_${Date.now()}_${file.name}`;
  return uploadImage(file, 'stores', fileName);
}

/**
 * Upload food image
 * @param {File} file - Food image file
 * @param {string} foodId - Food ID for unique filename
 * @returns {Promise<string>} Public URL
 */
export async function uploadFoodImage(file, foodId) {
  const fileName = `${foodId}_${Date.now()}_${file.name}`;
  return uploadImage(file, 'foods', fileName);
}

/**
 * Upload rider profile image
 * @param {File} file - Profile image file
 * @param {string} riderId - Rider ID for unique filename
 * @returns {Promise<string>} Public URL
 */
export async function uploadRiderProfileImage(file, riderId) {
  const fileName = `${riderId}_${Date.now()}_${file.name}`;
  return uploadImage(file, 'riders', fileName);
}
