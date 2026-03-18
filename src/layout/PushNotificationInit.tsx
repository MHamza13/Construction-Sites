"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { db, auth } from "@/firebase/Firebase"; 
import { doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PushNotificationInit() {
  useEffect(() => {
    // Sirf Mobile par chale
    if (Capacitor.getPlatform() !== "web") {
      
      const initializePush = async (userId: string) => {
        // 1. Android Channel Setup
        if (Capacitor.getPlatform() === 'android') {
          await PushNotifications.createChannel({
            id: 'fcm_default_channel',
            name: 'Default',
            description: 'Workly Notifications',
            importance: 5,
            visibility: 1,
            sound: 'beep.wav'
          });
        }

        // 2. Presentation Options (Banner for Foreground)
        try {
          if ((PushNotifications as any).setPresentationOptions) {
             await (PushNotifications as any).setPresentationOptions({
               presentationOptions: ["badge", "sound", "alert"],
             });
          }
        } catch (e) { console.log("Presentation error:", e); }

        // 3. Permissions & Registration
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === "granted") {
          await PushNotifications.register();
        }

        // 4. Token Ko Database Mein Save Karna (Sabse Zaroori)
        PushNotifications.addListener("registration", async (token) => {
          console.log("Push Token:", token.value);
          try {
            // User ke document mein token save karein taake backend notification bhej sakay
            const userRef = doc(db, "users", userId); 
            await updateDoc(userRef, {
              fcmToken: token.value,
              lastUpdated: new Date()
            });
            console.log("Token successfully saved to Firestore");
          } catch (err) {
            console.error("Error saving token:", err);
          }
        });

        // 5. Listeners for incoming notifications
        PushNotifications.addListener("pushNotificationReceived", (notification) => {
          console.log("Notification Received:", notification);
        });

        PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
          console.log("Notification Clicked:", notification);
        });
      };

      // Check karein ke user logged in hai ya nahi
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