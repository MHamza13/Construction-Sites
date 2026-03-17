import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
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

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);

export const getFCMToken = async () => {
  try {
    // 1. Mobile Check
    if (Capacitor.isNativePlatform()) {
      return "mobile-native-mode";
    }

    // 2. Browser/SSR Check
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return "no-token";
    }

    // 3. Check Notification Permission (Bina permission ke token mil hi nahi sakta)
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.warn("❌ Notification permission denied");
      return "permission-denied";
    }

    // 4. Register Service Worker and Wait for it
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    // 5. Get Messaging & Token
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, // Ensure this is in Vercel Env
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("✅ FCM Token Generated:", token);
      return token;
    } else {
      return "no-token-available";
    }
  } catch (error) {
    console.error("❌ FCM Error Details:", error);
    return "error-getting-token";
  }
};

// Foreground message listener (Optional)
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (typeof window !== "undefined" && !Capacitor.isNativePlatform()) {
      const messaging = getMessaging(app);
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    }
  });