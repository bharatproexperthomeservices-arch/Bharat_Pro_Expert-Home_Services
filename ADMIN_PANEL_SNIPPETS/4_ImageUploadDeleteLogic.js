/**
 * Bharat Pro Expert — Firebase Storage & Firestore Image Utility Snippet
 * Location: ADMIN_PANEL_SNIPPETS/4_ImageUploadDeleteLogic.js
 *
 * Use this module in your Google AI Studio / React Admin Panel to upload images to
 * Firebase Storage, get public download URLs, update Firestore documents, and
 * automatically delete old/replaced images from Firebase Storage to save storage space.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

// Replace with your Firebase configuration object in Google AI Studio
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyB1GbzmsTs4Uspa4m8h-zYCNbqupfI-L9s",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "bharatproexpert-homeservices.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "bharatproexpert-homeservices",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "bharatproexpert-homeservices.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "11342758143",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:11342758143:web:1c23b2f9cb5c55715e0cca"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * 1. Uploads an Image file to Firebase Storage and returns its public Download URL.
 * @param {File} file - HTML File object from <input type="file">
 * @param {string} folderPath - Path in storage (e.g., 'sliders', 'services', 'categories')
 * @returns {Promise<string>} Public HTTPS Download URL
 */
export async function uploadImageAndGetURL(file, folderPath = 'uploads') {
  if (!file) return '';
  try {
    const timeStamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const storageRef = ref(storage, `${folderPath}/${timeStamp}_${cleanFileName}`);

    // Upload image bytes
    const snapshot = await uploadBytes(storageRef, file);

    // Get public URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`[Storage] Image uploaded successfully to ${folderPath}:`, downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('[Storage] Error uploading image:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * 2. Deletes an existing image from Firebase Storage using its download URL or Storage path.
 * @param {string} imageUrl - The Firebase Storage download URL
 * @returns {Promise<boolean>} True if deleted or false if skipped/invalid
 */
export async function deleteImageFromStorage(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.includes('firebasestorage.googleapis.com')) {
    console.log('[Storage] Skip delete: URL is empty or not a Firebase Storage URL');
    return false;
  }
  try {
    // Extract path from Firebase Storage URL
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
    console.log('[Storage] Successfully deleted old image from Storage:', imageUrl);
    return true;
  } catch (error) {
    // If object was already deleted or doesn't exist, log warning without throwing
    if (error.code === 'storage/object-not-found') {
      console.warn('[Storage] Image object not found in Storage (already deleted):', imageUrl);
      return false;
    }
    console.error('[Storage] Error deleting image from Storage:', error);
    return false;
  }
}

/**
 * 3. Saves or Updates a Firestore Document with optional image replacement logic.
 *    If a new image File is provided, it uploads it, saves doc, and deletes the old image from Storage.
 *
 * @param {string} collectionName - 'sliders', 'categories', 'services', or 'site_settings'
 * @param {string} docId - Document ID (e.g., '1bhk', 'deep', 'h1', or 'main')
 * @param {Object} data - Document fields
 * @param {File|null} newImageFile - New image file to upload (optional)
 * @param {string} [oldImageUrl] - URL of previous image to replace/delete
 * @returns {Promise<Object>} Updated data object saved to Firestore
 */
export async function saveDocWithImage(collectionName, docId, data, newImageFile = null, oldImageUrl = '') {
  try {
    let finalPhotoUrl = data.photo || data.imageUrl || data.image || oldImageUrl || '';

    // If new image file is provided, upload it first
    if (newImageFile) {
      console.log(`[CMS] Uploading new image for ${collectionName}/${docId}...`);
      const newUrl = await uploadImageAndGetURL(newImageFile, collectionName);

      // Delete old image from Storage if it exists and differs from new URL
      if (oldImageUrl && oldImageUrl !== newUrl) {
        await deleteImageFromStorage(oldImageUrl);
      }

      finalPhotoUrl = newUrl;
    }

    const payload = {
      ...data,
      photo: finalPhotoUrl,
      imageUrl: finalPhotoUrl,
      image: finalPhotoUrl,
      updatedAt: new Date().toISOString()
    };

    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firestore] Document saved in '${collectionName}/${docId}':`, payload);
    return payload;
  } catch (error) {
    console.error(`[Firestore] Error saving document ${collectionName}/${docId}:`, error);
    throw error;
  }
}

/**
 * 4. Deletes a Firestore document and its associated image from Firebase Storage.
 *
 * @param {string} collectionName - Collection name ('sliders', 'categories', 'services')
 * @param {string} docId - Document ID to delete
 * @param {string} [imageUrl] - Associated image URL to clean up from Storage
 */
export async function deleteDocAndAssociatedImage(collectionName, docId, imageUrl = '') {
  try {
    // 1. Delete image from Storage
    if (imageUrl) {
      await deleteImageFromStorage(imageUrl);
    } else {
      // Fetch doc to check if image field exists
      const docRef = doc(db, collectionName, docId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const d = snap.data();
        const existingImg = d.photo || d.imageUrl || d.image;
        if (existingImg) {
          await deleteImageFromStorage(existingImg);
        }
      }
    }

    // 2. Delete document from Firestore
    await deleteDoc(doc(db, collectionName, docId));
    console.log(`[Firestore] Document deleted '${collectionName}/${docId}'`);
    return true;
  } catch (error) {
    console.error(`[Firestore] Error deleting ${collectionName}/${docId}:`, error);
    throw error;
  }
}
