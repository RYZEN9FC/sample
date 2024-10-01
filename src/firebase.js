// Import the functions you need from the Firebase SDKs
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore'; // Added the missing functions

// Firebase configuration for your web app
const firebaseConfig = {
  apiKey: "AIzaSyD8ZuZU4-I98L2LfXmMe3tg7ClNnnjdCqQ",
  authDomain: "ten-thousand-goals.firebaseapp.com",
  projectId: "ten-thousand-goals",
  storageBucket: "ten-thousand-goals.appspot.com",
  messagingSenderId: "1067204901319",
  appId: "1:1067204901319:web:7d8df77b8b4c52798f01e2",
  measurementId: "G-QQD6S8988S"
};

// Initialize Firebase with the provided configuration
const app = initializeApp(firebaseConfig);

// Get the Firestore database instance from the initialized Firebase app
const db = getFirestore(app);

// Export the Firestore functions for use in other parts of your app
export { db, doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs }; // Exporting the necessary functions
