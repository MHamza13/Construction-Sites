"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { db, auth } from "@/firebase/Firebase"; 
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PushNotificationInit() {
  useEffect(() => {
    // Sirf Mobile (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      
      const initializePush = async (userId: string) => {
        try {
          // 1. Android Channel Setup (High Importance taake Tray mein aaye)
          if (Capacitor.getPlatform() === 'android') {
            await PushNotifications.createChannel({
              id: 'fcm_default_channel',
              name: 'Default',
              description: 'Workly Notifications',
              importance: 5, // High
              visibility: 1,
              sound: 'beep.wav'
            });
          }

          // 2. Presentation Options (Foreground banner)
          await (PushNotifications as any).setPresentationOptions({
            presentationOptions: ["badge", "sound", "alert"],
          });

          // 3. Permission Flow
          let permStatus = await PushNotifications.checkPermissions();
          
          if (permStatus.receive === "prompt") {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive !== "granted") {
            console.warn("User denied permissions!");
            // Agar user ne mana kar diya to bar mein notification nahi aayega
            return;
          }

          // 4. Register Device
          await PushNotifications.register();

          // 5. Registration Success Listener
          PushNotifications.addListener("registration", async (token) => {
            console.log("Push Token:", token.value);
            const userRef = doc(db, "users", userId); 
            await setDoc(userRef, {
              fcmToken: token.value,
              lastUpdated: new Date(),
              platform: Capacitor.getPlatform()
            }, { merge: true });
            console.log("Token saved successfully");
          });

          // 6. Registration Error
          PushNotifications.addListener("registrationError", (err) => {
            alert("Registration Error: " + JSON.stringify(err));
          });

          // 7. Jab App Background mein ho aur message aaye (Notification Bar ke liye)
          PushNotifications.addListener("pushNotificationReceived", (notification) => {
            console.log("Notification Received:", notification);
          });

          PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
            console.log("Notification Clicked:", notification);
          });

        } catch (error) {
          console.error("Initialization error:", error);
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