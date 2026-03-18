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
    // Sirf Mobile par chalega
    if (Capacitor.isNativePlatform()) {
      
      const initializePush = async (userId: string) => {
        try {
          if (Capacitor.getPlatform() === 'android') {
            // STEP 1: Purane channels delete karein (Force Refresh)
            const existingChannels = await PushNotifications.listChannels();
            for (let channel of existingChannels.channels) {
                await PushNotifications.deleteChannel({ id: channel.id });
            }

            // STEP 2: Naya RBS Channel banayein
            const channelConfig = {
              id: 'fcm_default_channel', 
              name: 'RBS', // Ab settings mein sirf RBS nazar aayega
              description: 'RBS System Notifications',
              importance: Importance.High, 
              visibility: Visibility.Public, 
              vibration: true,  
              sound: 'jackhammer', 
            };

            await PushNotifications.createChannel(channelConfig);
            await LocalNotifications.createChannel(channelConfig);
            
            console.log("RBS Channel Re-created Successfully!");
          }

          // STEP 3: Presentation Options
          await PushNotifications.setPresentationOptions({
            presentationOptions: ["badge", "sound", "alert"],
          });

          // STEP 4: Permissions & Registration
          let permStatus = await PushNotifications.requestPermissions();
          if (permStatus.receive === "granted") {
            await PushNotifications.register();
          }

          // STEP 5: Foreground Listener (App khuli ho tab bhi bar dikhaye)
          PushNotifications.addListener("pushNotificationReceived", async (notification) => {
            console.log("Push Received:", notification);

            await LocalNotifications.schedule({
              notifications: [
                {
                  title: notification.title || "RBS Update",
                  body: notification.body || "",
                  id: Math.floor(Math.random() * 10000),
                  channelId: 'fcm_default_channel',
                  smallIcon: 'ic_launcher', 
                  sound: 'jackhammer.mp3' 
                }
              ]
            });
          });

          // STEP 6: Token Saving to Firestore
          PushNotifications.addListener("registration", async (token) => {
            console.log("FCM Token:", token.value);
            const userRef = doc(db, "users", userId); 
            await setDoc(userRef, {
              fcmToken: token.value,
              lastUpdated: new Date(),
              platform: Capacitor.getPlatform()
            }, { merge: true });
          });

        } catch (error) {
          console.error("Critical Push Error:", error);
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