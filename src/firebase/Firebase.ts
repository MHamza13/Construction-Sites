// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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

// ✅ Initialize Messaging (browser only)
export const messaging =
  typeof window !== "undefined" ? getMessaging(app) : null;

// ✅ Function to get FCM Token
export const getFCMToken = async () => {
  if (typeof window === "undefined") {
    console.warn("❌ Window is undefined (server-side)");
    return "no-token";
  }

  try {
    console.log("🪄 Registering Service Worker...");
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    console.log("✅ Service Worker registered:", registration);

    console.log("🔔 Requesting Notification permission...");
    const permission = await Notification.requestPermission();
    console.log("🔔 Permission:", permission);

    if (permission !== "granted") {
      console.warn("❌ Notification permission denied");
      return "no-token";
    }

    console.log("🎯 Getting FCM token...");
    const token = await getToken(messaging!, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn("⚠️ No token generated.");
      return "no-token";
    }

    console.log("🔥 Successfully generated FCM token:", token);
    return token;
  } catch (error) {
    console.error("❌ Error while generating FCM token:", error);
    return "no-token";
  }
};


// ✅ Optional: Listen to foreground messages
export const listenToForegroundMessages = () => {
  if (!messaging) return;
  onMessage(messaging, (payload) => {
    console.log("📬 Foreground message received:", payload);
  });
};
