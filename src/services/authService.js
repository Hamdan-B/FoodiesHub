import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * Check if user is admin based on email
 */
export function isAdmin(user) {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  return user && user.email === adminEmail;
}

/**
 * Sign up new user with role selection
 */
export async function signUp(email, password, displayName, roles) {
  try {
    // 1. Validate and normalize roles
    const validRoles = ['buyer', 'seller', 'rider'];
    let selectedRoles = roles.filter(role => validRoles.includes(role));
    
    // Check if seller or rider is selected, and ensure buyer is included
    if (selectedRoles.includes('seller') || selectedRoles.includes('rider')) {
      if (!selectedRoles.includes('buyer')) {
        selectedRoles.push('buyer');
      }
    }

    if (selectedRoles.length === 0) {
      throw new Error('Please select at least one role');
    }

    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Create user document in Firestore
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || '',
      roles: selectedRoles, // Now includes 'buyer' automatically for staff
      sellerApproved: selectedRoles.includes('seller') ? false : null,
      riderApproved: selectedRoles.includes('rider') ? false : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    // If rider, create rider document
    if (selectedRoles.includes('rider')) {
      await setDoc(doc(db, 'riders', user.uid), {
        riderId: user.uid,
        status: 'offline',
        availability: 'available',
        totalDeliveries: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return { user, userData };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

/**
 * Sign in existing user
 */
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Get user data from Firestore
 */
export async function getUserData(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Get user data error:', error);
    throw error;
  }
}

