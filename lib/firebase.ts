
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyApgz01hx86NLH9mofLtUkMhTXaeFOcOg0",
  authDomain: "armoured-mart.firebaseapp.com",
  projectId: "armoured-mart",
  storageBucket: "armoured-mart.firebasestorage.app",
  messagingSenderId: "42754870294",
  appId: "1:42754870294:web:80a89a902be1e7a26d7937",
  measurementId: "G-329QPGQXT6"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { auth };
