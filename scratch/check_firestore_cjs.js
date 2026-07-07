const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "REDACTED",
  authDomain: "mess-management-62b32.firebaseapp.com",
  projectId: "mess-management-62b32",
  storageBucket: "mess-management-62b32.firebasestorage.app",
  messagingSenderId: "REDACTED",
  appId: "REDACTED",
  measurementId: "REDACTED"
};

const app = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(app);

async function checkCloudDb() {
  console.log('Connecting to Firebase Firestore (CommonJS)...');
  try {
    const snapshot = await getDocs(collection(firestoreDb, 'customers'));
    console.log(`Cloud DB customers count: ${snapshot.size}`);
    snapshot.forEach(doc => {
      const c = doc.data();
      console.log(`- ID: ${doc.id}, Name: "${c.name}", Phone: "${c.phone}", Branch: "${c.branch || 'None'}", Category: "${c.category || 'None'}", Status: "${c.status || 'None'}"`);
    });
  } catch (err) {
    console.error('Error reading from Cloud Firestore:', err);
  }
}

checkCloudDb();

