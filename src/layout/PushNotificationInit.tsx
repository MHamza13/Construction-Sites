"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications"; 
import { db, auth } from "@/firebase/Firebase"; 
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PushNotificationInit() {
  // Is ref se hum double execution rokenge (Next.js Strict Mode fix)
  const isInitialized = useRef(false);

  useEffect(() => {
    // Sirf Mobile (Android/iOS) par chale
    if (!Capacitor.isNativePlatform() || isInitialized.current) return;
    
    isInitialized.current = true;
    const platform = Capacitor.getPlatform();

    const initializePush = async (userId: string) => {
      try {
        console.log("RBS_DEBUG: Starting Push Initialization...");

        // 1. Listeners pehle set karein taake register hote hi catch ho jayein
        await PushNotifications.removeAllListeners();

        // Registration Success Listener
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

        // Foreground Notification Listener
        await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
          console.log("RBS_DEBUG: Notification Received in Foreground");
          
          await LocalNotifications.schedule({
            notifications: [{
              title: notification.title || "RBS Update",
              body: notification.body || "Nayi update check karein",
              id: Date.now(),
              channelId: 'rbs_notifications',
              smallIcon: 'ic_stat_name', 
              actionTypeId: "",
              extra: notification.data
            }]
          });
        });

        // 2. Android Channel Setup
        if (platform === 'android') {
          await PushNotifications.createChannel({
            id: 'rbs_notifications',
            name: 'RBS Alerts',
            importance: 5,
            visibility: 1,
            vibration: true,
          });
        }

        // 3. Permissions Check & Request
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive !== 'granted') {
          permStatus = await PushNotifications.requestPermissions();
        }

        // 4. Final Step: Register
        if (permStatus.receive === "granted") {
          await PushNotifications.register();
        } else {
          console.warn("RBS_DEBUG: Notification permissions denied by user");
        }

      } catch (error) {
        console.error("RBS_DEBUG: Critical Init Error:", error);
      }
    };

    // Auth state check karke init karein
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        initializePush(user.uid);
      }
    });

    return () => {
      unsubscribe();
      // Listeners cleanup agar component unmount ho
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, []);

  return null; 
}