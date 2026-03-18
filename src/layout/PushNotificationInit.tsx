"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications"; 
import { db, auth } from "@/firebase/Firebase"; 
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PushNotificationInit() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      
      const initializePush = async (userId: string) => {
        try {
          // 1. Android Channel Setup
          if (Capacitor.getPlatform() === 'android') {
            await PushNotifications.createChannel({
              id: 'fcm_default_channel', 
              name: 'RBS Updates',
              description: 'Critical notifications for RBS app',
              importance: 5,    
              visibility: 1,    
              vibration: true,  
              sound: 'jackhammer', // 👈 Extension (.mp3) mat likhein yahan
            });
          }

          // 2. Presentation Options (Foreground mein bar dikhane ke liye)
          await PushNotifications.setPresentationOptions({
            presentationOptions: ["badge", "sound", "alert"],
          });

          // 3. Register & Permissions
          let permStatus = await PushNotifications.requestPermissions();
          if (permStatus.receive === "granted") {
            await PushNotifications.register();
          }

          // 4. Foreground Listener (App khuli ho tab bhi bar dikhaye)
          PushNotifications.addListener("pushNotificationReceived", async (notification) => {
            console.log("Push Received:", notification);

            // Local Notification trigger karein taake bar mein show ho
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: notification.title || "RBS Update",
                  body: notification.body || "",
                  id: Math.floor(Math.random() * 10000), // Unique ID
                  channelId: 'fcm_default_channel',
                  smallIcon: 'ic_launcher', 
                  // Sound file check karein res/raw mein honi chahiye
                  sound: Capacitor.getPlatform() === 'android' ? 'jackhammer' : 'jackhammer.mp3'
                }
              ]
            });
          });

          // Token Saving
          PushNotifications.addListener("registration", async (token) => {
            console.log("Device Token:", token.value); // 👈 Isay console mein check karein
            const userRef = doc(db, "users", userId); 
            await setDoc(userRef, {
              fcmToken: token.value,
              lastUpdated: new Date(),
              platform: Capacitor.getPlatform()
            }, { merge: true });
          });

        } catch (error) {
          console.error("Initialization error:", error);
        }
      };

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) initializePush(user.uid);
      });

      return () => {
        unsubscribe();
        PushNotifications.removeAllListeners();
      };
    }
  }, []);

  return null; 
}