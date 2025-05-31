
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your_project_id", // Fallback to prevent build error
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate essential Firebase config
if (!firebaseConfig.apiKey) {
  console.warn("Firebase Configuration Warning: NEXT_PUBLIC_FIREBASE_API_KEY is not defined. Some Firebase services might not work as expected.");
}

// Check for placeholder or undefined Project ID
if (!firebaseConfig.projectId || firebaseConfig.projectId === "your_project_id") {
  console.error(
    "Firebase Configuration Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not defined or is a placeholder. This is a required field for Firestore. Please set it in your .env.local file with your actual Firebase Project ID."
  );
}

// Validate databaseURL format if it exists, but don't throw if it's not set (since we use Firestore)
if (firebaseConfig.databaseURL && firebaseConfig.databaseURL !== "your_database_url") {
  try {
    const url = new URL(firebaseConfig.databaseURL);
    if (!url.protocol.startsWith("https")) {
      console.warn(`Firebase Configuration Warning: NEXT_PUBLIC_FIREBASE_DATABASE_URL ("${firebaseConfig.databaseURL}") protocol is not https. Ensure this is intended.`);
    }
    if (!(url.hostname.endsWith(".firebaseio.com") || url.hostname.endsWith(".firebasedatabase.app"))) {
       console.warn(`Firebase Configuration Warning: NEXT_PUBLIC_FIREBASE_DATABASE_URL ("${firebaseConfig.databaseURL}") does not look like a standard Firebase Realtime Database URL. If you are only using Firestore, this might be okay, but ensure it's correctly configured if Realtime Database functionality is ever needed.`);
    }
  } catch (e) {
    console.error(
      `Firebase Configuration Error: The provided NEXT_PUBLIC_FIREBASE_DATABASE_URL ("${firebaseConfig.databaseURL}") is not a valid URL. Please check its value in your .env.local file or remove it if Realtime Database is not used.`
    );
  }
}

// Initialize Firebase App
const _app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize and export Firestore service
export const firestore: Firestore = getFirestore(_app);
export const app = _app; // Export the app instance itself
