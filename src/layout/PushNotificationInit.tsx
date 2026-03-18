"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications, Importance, Visibility } from "@capacitor/push-notifications";
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
            const channelConfig = {
              id: 'fcm_default_channel', 
              name: 'RBS', // Aapki request ke mutabiq sirf RBS
              description: 'Critical notifications for RBS app',
              importance: 5 as Importance, // Type casting se error solve ho jayega
              visibility: 1 as Visibility,    
              vibration: true,  
              sound: 'jackhammer', 
            };

            await PushNotifications.createChannel(channelConfig);
            await LocalNotifications.createChannel(channelConfig);
          }

          // 2. Presentation Options
            await (PushNotifications as any).setPresentationOptions({
            presentationOptions: ["badge", "sound", "alert"],
          });

          // 3. Permissions & Registration
          let permStatus = await PushNotifications.requestPermissions();
          if (permStatus.receive === "granted") {
            await PushNotifications.register();
          }

          // 4. Foreground Listener
          PushNotifications.addListener("pushNotificationReceived", async (notification) => {
            console.log("Push Received in Foreground:", notification);

            await LocalNotifications.schedule({
              notifications: [
                {
                  title: notification.title || "",
                  body: notification.body || "",
                  id: Math.floor(Math.random() * 10000),
                  channelId: 'fcm_default_channel',
                  smallIcon: 'ic_launcher', 
                  sound: 'jackhammer.mp3' 
                }
              ]
            });
          });

          // 5. Token Saving to Firestore
          PushNotifications.addListener("registration", async (token) => {
            console.log("Device Token:", token.value);
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