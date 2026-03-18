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
    // Check if we are on Android or iOS
    const platform = Capacitor.getPlatform();
    
    if (platform === 'android' || platform === 'ios') {
      
      const initializePush = async (userId: string) => {
        try {
          // STEP 0: Thora wait taake native plugins fully load ho jayein
          await new Promise(resolve => setTimeout(resolve, 2000));

          if (platform === 'android') {
            // STEP 1: Purane channels ko list karke delete karein (Cache Refresh)
            const { channels } = await PushNotifications.listChannels();
            for (let channel of channels) {
                await PushNotifications.deleteChannel({ id: channel.id });
            }

            // STEP 2: Naya RBS Channel banayein
            const channelConfig = {
              id: 'fcm_default_channel', // Manifest ke sath match hona chahiye
              name: 'RBS', 
              description: 'RBS System Notifications',
              importance: 5 as any, // 5 = High/Max Importance
              visibility: 1 as any, // 1 = Public
              vibration: true,  
              sound: 'jackhammer', // Extension ke baghair folder mein sound hona chahiye
            };

            await PushNotifications.createChannel(channelConfig);
            await LocalNotifications.createChannel(channelConfig);
            console.log("RBS_DEBUG: Channel Created Successfully");
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

          // STEP 5: Foreground Listener
          PushNotifications.addListener("pushNotificationReceived", async (notification) => {
            console.log("RBS_DEBUG: Push Received:", notification);
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

          // STEP 6: Token Saving
          PushNotifications.addListener("registration", async (token) => {
            console.log("RBS_DEBUG: FCM Token Generated");
            const userRef = doc(db, "users", userId); 
            await setDoc(userRef, {
              fcmToken: token.value,
              lastUpdated: new Date(),
              platform: platform
            }, { merge: true });
          });

        } catch (error) {
          console.error("RBS_DEBUG: Critical Push Error:", error);
        }
      };

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          initializePush(user.uid);
        } else {
          console.log("RBS_DEBUG: No authenticated user found");
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