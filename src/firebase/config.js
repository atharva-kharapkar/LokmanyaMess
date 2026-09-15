// Firebase configuration loader
// Prefer setting these via environment variables at build time (Vite: VITE_FIREBASE_*).
// Standard fallback values ensure production packaged builds work reliably.

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDJA3ndXJ05NYDKCUI7sTttoZL1E-tN1wM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mess-management-62b32.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mess-management-62b32",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mess-management-62b32.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "72179753747",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:72179753747:web:29e83c55a175ca518ef0w6",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MBQ34EPW90"
};
