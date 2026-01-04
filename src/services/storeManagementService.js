import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Create a new store (seller can only have one)
 */
export async function createStore(storeData) {
  try {
    // Check if seller already has a store
    const existingStoreQuery = query(
      collection(db, 'stores'),
      where('sellerId', '==', storeData.sellerId)
    );
    const existingStore = await getDocs(existingStoreQuery);
    
    if (!existingStore.empty) {
      throw new Error('You can only create one store');
    }

    const storeRef = await addDoc(collection(db, 'stores'), {
      ...storeData,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return storeRef.id;
  } catch (error) {
    console.error('Error creating store:', error);
    throw error;
  }
}

/**
 * Get store by seller ID
 */
export async function getStoreBySellerId(sellerId) {
  try {
    const q = query(collection(db, 'stores'), where('sellerId', '==', sellerId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        storeId: doc.id,
        ...doc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting store:', error);
    throw error;
  }
}

/**
 * Update store
 */
export async function updateStore(storeId, updateData) {
  try {
    await updateDoc(doc(db, 'stores', storeId), {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating store:', error);
    throw error;
  }
}

/**
 * Create food item
 */
export async function createFoodItem(foodData) {
  try {
    const foodRef = await addDoc(collection(db, 'foodItems'), {
      ...foodData,
      averageRating: 0,
      totalReviews: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return foodRef.id;
  } catch (error) {
    console.error('Error creating food item:', error);
    throw error;
  }
}

/**
 * Update food item
 */
export async function updateFoodItem(foodId, updateData) {
  try {
    await updateDoc(doc(db, 'foodItems', foodId), {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating food item:', error);
    throw error;
  }
}

/**
 * Delete food item
 */
export async function deleteFoodItem(foodId) {
  try {
    await deleteDoc(doc(db, 'foodItems', foodId));
  } catch (error) {
    console.error('Error deleting food item:', error);
    throw error;
  }
}

/**
 * Get all food items for a store
 */
export async function getStoreFoodItems(storeId) {
  try {
    const q = query(collection(db, 'foodItems'), where('storeId', '==', storeId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      foodId: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting food items:', error);
    throw error;
  }
}

