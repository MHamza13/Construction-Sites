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

// Token function for WEB only
export const getFCMToken = async () => {
  try {
    // 1. Agar Mobile (Native) hai to ye function skip karein (Kyunki Capacitor khud handle karta hai)
    if (Capacitor.isNativePlatform()) return null;

    // 2. Browser check
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;

    const messaging = getMessaging(app);

    // Permission check
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return "permission-denied";

    // Get Token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    return token || null;
  } catch (error) {
    console.error("❌ FCM Web Error:", error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (typeof window !== "undefined" && !Capacitor.isNativePlatform()) {
      const messaging = getMessaging(app);
      onMessage(messaging, (payload) => resolve(payload));
    }
  });