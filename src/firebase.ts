// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAlieSuzEbk4HQoh6Q7ktd7uZSsIU73I04",
  authDomain: "attendance-tracker-ffdb5.firebaseapp.com",
  projectId: "attendance-tracker-ffdb5",
  storageBucket: "attendance-tracker-ffdb5.firebasestorage.app",
  messagingSenderId: "411330688167",
  appId: "1:411330688167:web:6701139231abff77edd782",
  measurementId: "G-JXYPTCNNPD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure auth settings
auth.useDeviceLanguage();