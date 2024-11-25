import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyB5GLZFd4-QmG2tLPKmbd5RdojtC5EWb3U",
  authDomain: "smart-grocery-manager-d43a3.firebaseapp.com",
  projectId: "smart-grocery-manager-d43a3",
  storageBucket: "smart-grocery-manager-d43a3.firebasestorage.app",
  messagingSenderId: "805600845627",
  appId: "1:805600845627:web:973d9e61305205235fe11e",
  measurementId: "G-5LCJYV2X1Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Persistence set to LOCAL');
  })
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });

// Configure Google Sign-in
provider.addScope('profile');
provider.addScope('email');
provider.setCustomParameters({
  prompt: 'select_account'
});

console.log('Firebase initialized successfully');
console.log('Current domain:', window.location.hostname);

export { auth, provider, db }; 