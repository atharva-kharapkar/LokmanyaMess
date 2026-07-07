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

