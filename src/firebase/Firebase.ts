import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { Capacitor } from "@capacitor/core";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (Avoid duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);

export const getFCMToken = async () => {
  try {
    // 1. Check if Mobile
    if (Capacitor.isNativePlatform()) {
      console.log("📱 Mobile Platform: Use Capacitor Push Notifications plugin instead.");
      return "mobile-native-mode";
    }

    // 2. Check if SSR (Server Side Rendering)
    if (typeof window === "undefined") return "no-token";

    // 4. Register Service Worker
    // Make sure 'firebase-messaging-sw.js' is in your /public folder
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("🪄 Service Worker registered with scope:", registration.scope);

    // 5. Get Messaging Instance
    const messaging = getMessaging(app);

    // 6. Get Token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("✅ Web FCM Token:", token);
      return token;
    } else {
      console.warn("⚠️ No registration token available. Request permission to generate one.");
      return "no-token";
    }
  } catch (error) {
    console.error("❌ Web FCM Error detailed:", error);
    return "error-getting-token";
  }
};