import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get all users
 */
export async function getAllUsers() {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
}

/**
 * Get all stores
 */
export async function getAllStores() {
  try {
    const querySnapshot = await getDocs(collection(db, 'stores'));
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
 * Get all orders
 */
export async function getAllOrders() {
  try {
    const querySnapshot = await getDocs(collection(db, 'orders'));
    return querySnapshot.docs.map((doc) => ({
      orderId: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
}

/**
 * Approve seller
 */
export async function approveSeller(uid) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      sellerApproved: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error approving seller:', error);
    throw error;
  }
}

/**
 * Reject seller
 */
export async function rejectSeller(uid) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      sellerApproved: false,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error rejecting seller:', error);
    throw error;
  }
}

/**
 * Approve rider
 */
export async function approveRider(uid) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      riderApproved: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error approving rider:', error);
    throw error;
  }
}

/**
 * Reject rider
 */
export async function rejectRider(uid) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      riderApproved: false,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error rejecting rider:', error);
    throw error;
  }
}

