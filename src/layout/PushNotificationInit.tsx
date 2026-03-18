"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications"; // 1. Ye install karein
import { db, auth } from "@/firebase/Firebase"; 
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PushNotificationInit() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      
      const initializePush = async (userId: string) => {
        try {
          // 2. Android Channel Setup
          if (Capacitor.getPlatform() === 'android') {
            await PushNotifications.createChannel({
              id: 'fcm_default_channel', 
              name: 'RBS Updates',
              description: 'Critical notifications for RBS app',
              importance: 5,    
              visibility: 1,    
              vibration: true,  
              sound: 'jackhammer', // res/raw/jackhammer.mp3 hona zaroori hai
            });
          }

          // 3. Presentation Options
          await (PushNotifications as any).setPresentationOptions({
            presentationOptions: ["badge", "sound", "alert"],
          });

          // 4. Register & Permissions
          let permStatus = await PushNotifications.requestPermissions();

          if (permStatus.receive === "granted") {
            await PushNotifications.register();
          }

          // 5. Listener for Foreground (Jab App Khuli ho)
          PushNotifications.addListener("pushNotificationReceived", async (notification) => {
            console.log("Notification Received:", notification);

            // Force Display in Notification Bar using LocalNotifications
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: notification.title || "New Message",
                  body: notification.body || "",
                  id: new Date().getTime(),
                  extra: notification.data,
                  channelId: 'fcm_default_channel',
                  smallIcon: 'ic_launcher', // App icon check karein
                  sound: 'jackhammer.mp3'
                }
              ]
            });
          });

          // Token Saving Logic
          PushNotifications.addListener("registration", async (token) => {
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