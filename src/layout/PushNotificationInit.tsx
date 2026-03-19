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
    if (!Capacitor.isNativePlatform() || isInitialized.current) return;
    isInitialized.current = true;

    const platform = Capacitor.getPlatform();

    const initializePush = async (userId: string) => {
      try {
        console.log("RBS_DEBUG: Initializing Native Push for:", userId);

        await PushNotifications.removeAllListeners();

        // Registration Success
        await PushNotifications.addListener("registration", async (token) => {
          console.log("RBS_DEBUG: FCM Token Found =>", token.value);
          const userRef = doc(db, "users", userId); 
          await setDoc(userRef, {
            fcmToken: token.value,
            platform: platform,
            lastTokenUpdate: serverTimestamp(),
            status: "active"
          }, { merge: true });
          console.log("RBS_DEBUG: Token saved to Firestore");
        });

        // Error Listener
        await PushNotifications.addListener("registrationError", (err) => {
          console.error("RBS_DEBUG: Registration Error:", err.error);
        });

        // Foreground Notification
        await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
          await LocalNotifications.schedule({
            notifications: [{
              title: notification.title || "RBS Update",
              body: notification.body || "Nayi update check karein",
              id: Date.now(),
              channelId: 'rbs_notifications',
              smallIcon: 'ic_stat_name', 
              extra: notification.data
            }]
          });
        });

        // Android Channel Setup
        if (platform === 'android') {
          await PushNotifications.createChannel({
            id: 'rbs_notifications',
            name: 'RBS Alerts',
            importance: 5,
            visibility: 1,
            vibration: true,
          });
        }

        // Permission & Register
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive !== 'granted') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === "granted") {
          await PushNotifications.register();
        }

      } catch (error) {
        console.error("RBS_DEBUG: Push Init Error:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Thoda wait karke init karein taake bridge fully ready ho
        setTimeout(() => initializePush(user.uid), 2000);
      } else {
        console.log("RBS_DEBUG: Waiting for login...");
      }
    });

    return () => {
      unsubscribe();
      if (Capacitor.isNativePlatform()) PushNotifications.removeAllListeners();
    };
  }, []);

  return null; 
}