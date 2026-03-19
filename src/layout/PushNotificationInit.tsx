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
    const platform = Capacitor.getPlatform();
    
    // Check if running on Native (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      
      const initializePush = async (userId: string) => {
        try {
          // STEP 0: Native Bridge initialization ka thora wait
          await new Promise(resolve => setTimeout(resolve, 3000));

          if (platform === 'android') {
            // STEP 1: Channel Creation (Consistent ID use karein)
            const channelConfig = {
              id: 'rbs_notifications', // Isko hamesha same rakhein
              name: 'RBS Notifications', 
              description: 'Notifications for RBS Construction System',
              importance: 5, 
              visibility: 1,
              vibration: true,
              // Sound file 'res/raw' mein honi chahiye extensions ke baghair
              sound: 'jackhammer', 
            };

            await PushNotifications.createChannel(channelConfig);
            await LocalNotifications.createChannel(channelConfig);
            console.log("RBS_DEBUG: Channels Configured");
          }

          // STEP 2: Permissions Check
          let permStatus = await PushNotifications.checkPermissions();
          
          if (permStatus.receive !== 'granted') {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive === "granted") {
            // STEP 3: Register device to FCM
            await PushNotifications.register();
          } else {
            console.error("RBS_DEBUG: Push Permission Denied");
          }

          // STEP 4: Token Listener (Iske bagair bar mein nahi aayega)
          PushNotifications.addListener("registration", async (token) => {
            console.log("RBS_DEBUG: Token Received:", token.value);
            
            // Vercel Database Sync
            const userRef = doc(db, "users", userId); 
            await setDoc(userRef, {
              fcmToken: token.value,
              platform: platform,
              lastTokenUpdate: serverTimestamp(),
              status: "active"
            }, { merge: true });
          });

          // STEP 5: Foreground Notification Handling
          // Jab app khuli ho tab bhi top bar mein dikhane ke liye
          PushNotifications.addListener("pushNotificationReceived", async (notification) => {
            console.log("RBS_DEBUG: Push Received in Foreground", notification);
            
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: notification.title || "RBS Update",
                  body: notification.body || "New update from RBS System",
                  id: Date.now(),
                  channelId: 'rbs_notifications', // Match with Step 1
                  smallIcon: 'ic_stat_name', // Ensure this exists in Android Studio res/drawable
                  actionTypeId: "",
                  extra: notification.data
                }
              ]
            });
          });

          PushNotifications.addListener("registrationError", (error) => {
            console.error("RBS_DEBUG: Registration Error:", error);
          });

        } catch (error) {
          console.error("RBS_DEBUG: Critical Error:", error);
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