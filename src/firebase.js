import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth/web-extension";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDaK9bOf_6uggBHcVmu5yqbmAm5yE-tTxk",
    authDomain: "cal-tool-alpha.firebaseapp.com",
    projectId: "cal-tool-alpha",
    storageBucket: "cal-tool-alpha.firebasestorage.app",
    messagingSenderId: "506852190093",
    appId: "1:506852190093:web:52fdd8d10931820337ffc4",
    measurementId: "G-0KT2E0DWRC"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const db = getFirestore(app);
  
  // 🔹 Add Google Calendar API Scope
  provider.addScope("https://www.googleapis.com/auth/calendar.readonly");
  
  export { auth, provider, db };