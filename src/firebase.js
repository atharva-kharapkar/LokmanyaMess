import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore';
import { firebaseConfig } from './firebase/config';

const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const hasFirebaseConfig = requiredConfigKeys.every((key) => {
  const value = firebaseConfig[key];
  return typeof value === 'string' && value.trim().length > 0;
});

let app = null;
let db = null;
let firebaseBootError = null;

if (hasFirebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager()
      })
    });
  } catch (error) {
    firebaseBootError = error;
  }
} else {
  firebaseBootError = new Error('Firebase configuration is incomplete.');
}

if (firebaseBootError) {
  console.error('Firebase boot failed. Falling back to local-only mode.', firebaseBootError);
}

export { app, db, firebaseBootError, hasFirebaseConfig };
export default app;
