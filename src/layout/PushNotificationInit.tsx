"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications"; 
import { db, auth } from "@/firebase/Firebase"; 
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PushNotificationInit() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const platform = Capacitor.getPlatform();
      
      const initializePush = async (userId: string) => {
        try {
          // Native bridge setup ka thora wait taake plugins load ho jayein
          await new Promise(resolve => setTimeout(resolve, 2000));

          // STEP 1: Channel Create karein (Android ke liye lazmi hai)
          if (platform === 'android') {
            await PushNotifications.createChannel({
              id: 'rbs_notifications',
              name: 'RBS Alerts',
              importance: 5,
              visibility: 1,
              vibration: true,
            });
          }

          // STEP 2: Permission check aur Request
          let permStatus = await PushNotifications.checkPermissions();
          
          if (permStatus.receive !== 'granted') {
            permStatus = await PushNotifications.requestPermissions();
          }

          // STEP 3: Agar permission mil gayi toh register karein
          if (permStatus.receive === "granted") {
            await PushNotifications.register();
          } else {
            console.error("RBS_DEBUG: User denied permissions");
            return;
          }

          // --- Listeners ---

          // Registration Success (Token yahan milega)
          await PushNotifications.addListener("registration", async (token) => {
            console.log("RBS_DEBUG: FCM Token Found:", token.value);
            const userRef = doc(db, "users", userId); 
            await setDoc(userRef, {
              fcmToken: token.value,
              platform: platform,
              lastTokenUpdate: serverTimestamp(),
            }, { merge: true });
          });

          // Foreground Notification Display
          await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: notification.title || "RBS Update",
                  body: notification.body || "Tap to check details",
                  id: Math.floor(Math.random() * 10000),
                  channelId: 'rbs_notifications',
                  smallIcon: 'ic_stat_name', // Ye res/drawable mein hona chahiye
                  extra: notification.data
                }
              ]
            });
          });

          // Registration Error check
          await PushNotifications.addListener("registrationError", (err) => {
            console.error("RBS_DEBUG: Registration Error:", err.error);
          });

        } catch (error) {
          console.error("RBS_DEBUG: Init Process Error:", error);
        }
      };

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          initializePush(user.uid);
        }
      });

      return () => {
        unsubscribe();
        PushNotifications.removeAllListeners();
      };
    }
  }, []);

  return null; 
}