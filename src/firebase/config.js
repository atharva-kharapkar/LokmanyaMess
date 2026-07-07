// Firebase configuration loader
// Prefer setting these via environment variables at build time (Vite: VITE_FIREBASE_*).
// Fall back to the legacy values to avoid breaking existing installs.

export const firebaseConfig = {
  // Require env variables for keys. Fallbacks removed to avoid accidental exposure.
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mess-management-62b32.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mess-management-62b32",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mess-management-62b32.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};
