"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications"; 
import { db, auth } from "@/firebase/Firebase"; 
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PushNotificationInit() {
  const isInitialized = useRef(false);

  useEffect(() => {
    // --- 1. Manifest injection (Sirf Web ke liye) ---
    if (!Capacitor.isNativePlatform()) {
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);
      return; // Web par native push ki zaroorat nahi
    }

    // --- 2. Purane Web Service Worker hatayein (Sirf Mobile) ---
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
          console.log("RBS_DEBUG: Purana SW khatam kiya");
        }
      });
    }

    if (isInitialized.current) return;
    isInitialized.current = true;

    const platform = Capacitor.getPlatform();

    const initializePush = async (userId: string) => {
      try {
        await PushNotifications.removeAllListeners();

        // Registration Success
        await PushNotifications.addListener("registration", async (token) => {
          console.log("RBS_DEBUG: Token Mil Gaya =>", token.value);
          const userRef = doc(db, "users", userId); 
          await setDoc(userRef, {
            fcmToken: token.value,
            platform: platform,
            lastTokenUpdate: serverTimestamp(),
            status: "active"
          }, { merge: true });
        });

        // Foreground Notification
        await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
          await LocalNotifications.schedule({
            notifications: [{
              title: notification.title || "RBS Update",
              body: notification.body || "Check updates",
              id: Date.now(),
              channelId: 'rbs_notifications',
              smallIcon: 'ic_stat_name', 
            }]
          });
        });

        // Android Channel
        if (platform === 'android') {
          await PushNotifications.createChannel({
            id: 'rbs_notifications',
            name: 'RBS Alerts',
            importance: 5,
            vibration: true,
          });
        }

        // Permissions & Registration
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive !== 'granted') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === "granted") {
          await PushNotifications.register();
        }
      } catch (error) {
        console.error("RBS_DEBUG: Error:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setTimeout(() => initializePush(user.uid), 2000);
      }
    });

    return () => {
      unsubscribe();
      if (Capacitor.isNativePlatform()) PushNotifications.removeAllListeners();
    };
  }, []);

  return null; 
}