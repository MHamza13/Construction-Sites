// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { Capacitor } from "@capacitor/core"; // 👈 Ye import karein

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Messaging initialize sirf Web par karein
export const messaging = (typeof window !== "undefined" && !Capacitor.isNativePlatform()) 
  ? getMessaging(app) 
  : null;

export const getFCMToken = async () => {
  // 🛑 AGAR ANDROID/iOS HAI TO YAHAN SE WAPAS CHALE JAYEIN
  if (Capacitor.isNativePlatform()) {
    console.log("📱 Mobile Platform detected: Skipping Web FCM logic.");
    return "mobile-native-mode";
  }

  if (typeof window === "undefined") return "no-token";

  try {
    // Ye code ab sirf browser/web par chalega
    console.log("🪄 Registering Service Worker...");
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return "no-token";

    if (!messaging) return "no-token";

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    }); 

    return token || "no-token";
  } catch (error) {
    console.error("❌ Web FCM Error:", error);
    return "no-token";
  }
};