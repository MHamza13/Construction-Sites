import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { Capacitor } from "@capacitor/core";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

/** * IMPORTANT: Mobile (Android/iOS) par 'firebase/messaging' use NAHI hota.
 * Hum sirf Web Browser ke liye isko initialize kar rahe hain.
 */
export const messaging: Messaging | null = 
  typeof window !== "undefined" && !Capacitor.isNativePlatform() && ("serviceWorker" in navigator)
    ? getMessaging(app) 
    : null;

// --- Token function (SIRF WEB KE LIYE) ---
export const getFCMToken = async () => {
  if (Capacitor.isNativePlatform()) {
    console.log("RBS_DEBUG: Skipping Web FCM Token because this is Native Platform.");
    return null; 
  }

  try {
    if (!messaging) return null;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return "permission-denied";

    return await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
  } catch (error) {
    console.error("❌ FCM Web Error:", error);
    return null;
  }
};

// --- Foreground Listener (SIRF WEB KE LIYE) ---
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    }
  });