const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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
