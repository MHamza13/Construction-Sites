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
    // 1. Sakhti se check karein ke sirf Native Android/iOS par chale
    if (!Capacitor.isNativePlatform()) {
      console.log("RBS_DEBUG: Web platform detected, skipping Native Push Init.");
      return;
    }

    if (isInitialized.current) return;
    isInitialized.current = true;

    const platform = Capacitor.getPlatform();

    const initializePush = async (userId: string) => {
      try {
        console.log("RBS_DEBUG: Starting Native Push Initialization for user:", userId);

        // 2. Pehle purane listeners saaf karein
        await PushNotifications.removeAllListeners();

        // Registration Success Listener
        await PushNotifications.addListener("registration", async (token) => {
          console.log("RBS_DEBUG: FCM Token Found =>", token.value);
          
          try {
            const userRef = doc(db, "users", userId); 
            await setDoc(userRef, {
              fcmToken: token.value,
              platform: platform,
              lastTokenUpdate: serverTimestamp(),
              status: "active"
            }, { merge: true });
            console.log("RBS_DEBUG: Token successfully saved to Firestore");
          } catch (fsError) {
            console.error("RBS_DEBUG: Firestore Save Error:", fsError);
          }
        });

        // Error Listener
        await PushNotifications.addListener("registrationError", (err) => {
          console.error("RBS_DEBUG: FCM Registration Error Details:", err.error);
        });

        // Foreground Notification Listener
        await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
          console.log("RBS_DEBUG: Foreground Notification Received:", notification.title);
          
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

        // 3. Android Notification Channel (Oreo aur us se upar ke liye lazmi hai)
        if (platform === 'android') {
          await PushNotifications.createChannel({
            id: 'rbs_notifications',
            name: 'RBS Alerts',
            description: 'Construction project updates',
            importance: 5, // High Importance
            visibility: 1,
            vibration: true,
          });
        }

        // 4. Permissions Request
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive !== 'granted') {
          permStatus = await PushNotifications.requestPermissions();
        }

        // 5. Final Step: Register Device to FCM
        if (permStatus.receive === "granted") {
          console.log("RBS_DEBUG: Permissions granted, calling register()...");
          await PushNotifications.register();
        } else {
          console.warn("RBS_DEBUG: Push permissions denied");
        }

      } catch (error) {
        console.error("RBS_DEBUG: Global Push Init Exception:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        initializePush(user.uid);
      } else {
        console.log("RBS_DEBUG: No user logged in, waiting for auth...");
      }
    });

    return () => {
      unsubscribe();
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, []);

  return null; 
}