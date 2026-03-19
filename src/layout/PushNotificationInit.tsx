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
          // Native bridge setup ka thora wait
          await new Promise(resolve => setTimeout(resolve, 1500));

          // STEP 1: Pehle check karein permission hai ya nahi
          let permStatus = await PushNotifications.checkPermissions();
          console.log("RBS_DEBUG: Current Permission Status:", permStatus.receive);

          // STEP 2: Agar granted nahi hai toh foran popup dikhao
          if (permStatus.receive !== 'granted') {
            console.log("RBS_DEBUG: Requesting Permissions...");
            permStatus = await PushNotifications.requestPermissions();
          }

          // STEP 3: Agar user ne Allow kar diya, tab register karein
          if (permStatus.receive === "granted") {
            console.log("RBS_DEBUG: Permission Granted, Registering...");
            await PushNotifications.register();
            
            // Android ke liye channel setup (Taake notification top pe pop up ho)
            if (platform === 'android') {
              await PushNotifications.createChannel({
                id: 'rbs_notifications',
                name: 'RBS Notifications',
                importance: 5, 
                visibility: 1,
                vibration: true,
              });
            }
          } else {
            console.warn("RBS_DEBUG: User denied notification permissions.");
          }

          // --- Listeners ---
          
          // Token update in Firestore
          await PushNotifications.addListener("registration", async (token) => {
            const userRef = doc(db, "users", userId); 
            await setDoc(userRef, {
              fcmToken: token.value,
              platform: platform,
              lastTokenUpdate: serverTimestamp(),
            }, { merge: true });
          });

          // Foreground handling
          await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: notification.title || "RBS Update",
                  body: notification.body || "New notification",
                  id: Math.floor(Math.random() * 10000),
                  channelId: 'rbs_notifications',
                  smallIcon: 'ic_stat_name',
                }
              ]
            });
          });

        } catch (error) {
          console.error("RBS_DEBUG: Error in initialization:", error);
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