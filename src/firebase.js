import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// ⚙️ ВСТАВЬ СВОЙ FIREBASE CONFIG ЗДЕСЬ
const firebaseConfig = {
  apiKey: "AIzaSyDx8eo6i8tf2T4axmcwg0xk0FxeHqM3RaA",
  authDomain: "wanttobegigachad.firebaseapp.com",
  projectId: "wanttobegigachad",
  storageBucket: "wanttobegigachad.firebasestorage.app",
  messagingSenderId: "322160466583",
  appId: "1:322160466583:web:84d7f366b3702518c627d2",
  measurementId: "G-7C073MHM5F",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const isConfigured = () => firebaseConfig.apiKey !== "YOUR_API_KEY";
