import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDJA3ndXJ05NYDKCUI7sTttoZL1E-tN1wM",
  authDomain: "mess-management-62b32.firebaseapp.com",
  projectId: "mess-management-62b32",
  storageBucket: "mess-management-62b32.firebasestorage.app",
  messagingSenderId: "72179753747",
  appId: "1:72179753747:web:29e83c55a175ca518ef0w6",
  measurementId: "G-MBQ34EPW90"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with robust local offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager()
  })
});

export default app;
