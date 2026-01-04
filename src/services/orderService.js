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
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Create a new order
 */
export async function createOrder(orderData) {
  try {
    const orderRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      riderId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return orderRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Get orders for a buyer
 */
export async function getBuyerOrders(buyerId) {
  try {
    const q = query(collection(db, 'orders'), where('buyerId', '==', buyerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      orderId: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting buyer orders:', error);
    throw error;
  }
}

/**
 * Get orders for a store
 */
export async function getStoreOrders(storeId) {
  try {
    const q = query(collection(db, 'orders'), where('storeId', '==', storeId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      orderId: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting store orders:', error);
    throw error;
  }
}

/**
 * Get available orders for riders
 */
export async function getAvailableOrders() {
  try {
    const q = query(
      collection(db, 'orders'),
      where('orderStatus', '==', 'ready'),
      where('riderId', '==', null)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      orderId: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting available orders:', error);
    throw error;
  }
}

/**
 * Get orders for a rider
 */
export async function getRiderOrders(riderId) {
  try {
    const q = query(collection(db, 'orders'), where('riderId', '==', riderId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      orderId: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting rider orders:', error);
    throw error;
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId) {
  try {
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (orderDoc.exists()) {
      return {
        orderId: orderDoc.id,
        ...orderDoc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
}

/**
 * Update order status (seller)
 */
export async function updateOrderStatus(orderId, status) {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      orderStatus: status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

/**
 * Accept order (seller)
 */
export async function acceptOrder(orderId) {
  return updateOrderStatus(orderId, 'accepted');
}

/**
 * Reject order (seller)
 */
export async function rejectOrder(orderId) {
  return updateOrderStatus(orderId, 'rejected');
}

/**
 * Assign rider to order
 */
export async function assignRiderToOrder(orderId, riderId) {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      riderId,
      orderStatus: 'picked_up',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error assigning rider:', error);
    throw error;
  }
}

/**
 * Update order status (rider)
 */
export async function updateOrderStatusByRider(orderId, status, otp = null) {
  try {
    const updateData = {
      orderStatus: status,
      updatedAt: serverTimestamp(),
    };
    if (otp) {
      updateData.deliveryOTP = otp;
    }
    if (status === 'delivered') {
      updateData.deliveredAt = serverTimestamp();
    }
    await updateDoc(doc(db, 'orders', orderId), updateData);
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

/**
 * Listen to order changes in real-time
 */
export function subscribeToOrder(orderId, callback) {
  const q = query(
    collection(db, 'orders'),
    where('orderStatus', '==', 'ready'),
    where('riderId', '==', null)
  );

  return onSnapshot(q, (querySnapshot) => {
    const orders = querySnapshot.docs.map((doc) => ({
      orderId: doc.id,
      ...doc.data(),
    }));
    callback(orders);
  }, (error) => {
    console.error("Error listening to orders:", error);
  });
}

