import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {

    apiKey: "AIzaSyCOA1hAteNRZmgDb-7UI9k8fbON8iLcakg",
  
    authDomain: "dev-rlb.firebaseapp.com",
  
    projectId: "dev-rlb",
  
    storageBucket: "dev-rlb.firebasestorage.app",
  
    messagingSenderId: "196607024813",
  
    appId: "1:196607024813:web:3b20af83c1c65607007024"
  
  };
  
  

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);