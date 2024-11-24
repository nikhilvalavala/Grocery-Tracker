import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
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
let app;
let auth;
let provider;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();

  // Configure Google Sign-in
  provider.addScope('profile');
  provider.addScope('email');
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  db = getFirestore(app);

  // Verify initialization
  console.log('Firebase initialized successfully');
  console.log('Current domain:', window.location.hostname);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { auth, provider, db }; 