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
const db = getFirestore(app);

async function scan() {
  console.log("Scanning old customers collection...");
  try {
    const snap = await getDocs(collection(db, 'customers'));
    snap.forEach(doc => {
      const data = doc.data();
      console.log(`Doc ID (Firestore): ${doc.id}, Field ID: ${data.id}, Name: "${data.name}"`);
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

scan();
