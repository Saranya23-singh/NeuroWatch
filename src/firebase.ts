import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "neurowatch-b3b08.firebaseapp.com",
  databaseURL: "https://neurowatch-b3b08-default-rtdb.firebaseio.com",
  projectId: "neurowatch-b3b08",
  storageBucket: "neurowatch-b3b08.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
