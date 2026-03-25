"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications"; 
import { db, getFCMToken, onMessageListener } from "@/firebase/Firebase"; 
import { doc, setDoc, serverTimestamp, collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";

export default function PushNotificationInit() {
  const isInitialized = useRef(false);
  const isFirstRun = useRef(true); // Purani notifications ko ignore karne ke liye

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // --- 1. Token Save Karne Ka Function ---
    const handleRegistration = async (token: string, platform: string) => {
      try {
        const deviceRef = doc(db, "device_tokens", token); 
        await setDoc(deviceRef, {
          fcmToken: token,
          platform: platform,
          lastTokenUpdate: serverTimestamp(),
          deviceInfo: Capacitor.getPlatform(),
          status: "active"
        }, { merge: true });
        console.log(`✅ RBS_SUCCESS: Token Synced [${platform}]:`, token);
      } catch (err) {
        console.error("❌ RBS_ERROR: Firestore Save Error:", err);
      }
    };

    // --- 2. Firestore Listener (Sync logic) ---
    // Jab bhi 'notification' collection mein naya doc aayega, ye phone par alert dega
    const startFirestoreSync = () => {
      const q = query(collection(db, "notification"), orderBy("sentAt", "desc"), limit(1));
      
      onSnapshot(q, (snapshot) => {
        if (isFirstRun.current) {
          isFirstRun.current = false;
          return; // Pehli baar load hote waqt notification nahi dikhani
        }

        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added" && Capacitor.isNativePlatform()) {
            const data = change.doc.data();
            
            // Mobile screen par notification dikhana
            await LocalNotifications.schedule({
              notifications: [{
                title: data.title || "New Notification",
                body: data.body || "You have a new update in RBS",
                id: Math.floor(Math.random() * 10000),
                channelId: 'rbs_notifications',
                smallIcon: 'ic_stat_name', 
              }]
            });
          }
        });
      });
    };

    const setupNotifications = async () => {
      console.log("RBS_DEBUG: Starting setup...");

      if (Capacitor.isNativePlatform()) {
        const platform = Capacitor.getPlatform();

        // Android Channel
        if (platform === 'android') {
          await PushNotifications.createChannel({
            id: 'rbs_notifications',
            name: 'RBS Alerts',
            importance: 5,
            visibility: 1,
            vibration: true,
          });
        }

        // Permissions
        await LocalNotifications.requestPermissions();
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') {
          perm = await PushNotifications.requestPermissions();
        }

        if (perm.receive === 'granted') {
          await PushNotifications.removeAllListeners();

          // Token Receive Listener
          await PushNotifications.addListener("registration", (token) => {
            handleRegistration(token.value, platform);
          });

          // Foreground Push Listener (For FCM)
          await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
            await LocalNotifications.schedule({
              notifications: [{
                title: notification.title || "RBS Update",
                body: notification.body || "New update available",
                id: Math.floor(Math.random() * 10000),
                channelId: 'rbs_notifications',
              }]
            });
          });

          await PushNotifications.register(); 
        }
      } else {
        // Web Logic
        try {
          const token = await getFCMToken();
          if (token && token !== "permission-denied") {
            handleRegistration(token, "web");
          }
        } catch (error) {
          console.error("Web Setup Error:", error);
        }
      }

      // Firestore sync start karein
      startFirestoreSync();
    };

    setupNotifications();
  }, []);

  return null; 
}