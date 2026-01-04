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
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get all stores, optionally filtered by city
 */
export async function getStores(city = null) {
  try {
    let q;
    if (city) {
      q = query(collection(db, 'stores'), where('city', '==', city), where('isActive', '==', true));
    } else {
      q = query(collection(db, 'stores'), where('isActive', '==', true));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      storeId: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting stores:', error);
    throw error;
  }
}

/**
 * Get store by ID
 */
export async function getStoreById(storeId) {
  try {
    const storeDoc = await getDoc(doc(db, 'stores', storeId));
    if (storeDoc.exists()) {
      return {
        storeId: storeDoc.id,
        ...storeDoc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting store:', error);
    throw error;
  }
}

/**
 * Get all food items for a store
 */
export async function getFoodItemsByStore(storeId) {
  try {
    const q = query(
      collection(db, 'foodItems'),
      where('storeId', '==', storeId),
      where('stockStatus', '==', 'in_stock')
    );
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

/**
 * Get all cities with active stores
 */
export async function getCities() {
  try {
    const q = query(collection(db, 'stores'), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    const cities = new Set();
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.city) {
        cities.add(data.city);
      }
    });
    return Array.from(cities).sort();
  } catch (error) {
    console.error('Error getting cities:', error);
    throw error;
  }
}

