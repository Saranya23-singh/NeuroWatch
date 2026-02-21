import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.apiKey !== undefined &&
    firebaseConfig.apiKey !== ""
  );
};

const firebaseConfig = {
  apiKey: "AIzaSyD7_0CxSGUwYqAIHNHtSQgqzjU5JqDYT_M",
  authDomain: "neurowatch-b3b08.firebaseapp.com",
  databaseURL: "https://neurowatch-b3b08-default-rtdb.firebaseio.com",
  projectId: "neurowatch-b3b08",
  storageBucket: "neurowatch-b3b08.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
};

// Initialize Firebase only if properly configured
let app;
let database;

try {
  if (isFirebaseConfigured()) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    database = getDatabase(app);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase is not properly configured. Using mock data mode.");
    database = null;
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
  database = null;
}

export { database };
