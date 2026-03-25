"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications"; 
import { db } from "@/firebase/Firebase"; // Auth nikal diya yahan se
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function PushNotificationInit() {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // --- Token Ko Firestore Mein Save Karne Ka Function ---
    const handleRegistration = async (token: string, platform: string) => {
      try {
        console.log(`RBS_DEBUG: Saving Device Token [${platform}]...`);
        
        // Agar user login nahi hai, toh hum device ID ya random ID use kar sakte hain
        // Filhal hum 'anonymous_devices' collection mein save kar rahe hain
        const deviceRef = doc(db, "device_tokens", token); 
        await setDoc(deviceRef, {
          fcmToken: token,
          platform: platform,
          lastUpdated: serverTimestamp(),
          deviceInfo: Capacitor.getPlatform()
        }, { merge: true });
        
        console.log(`✅ RBS_SUCCESS: Token Synced:`, token);
      } catch (err) {
        console.error("❌ RBS_ERROR: Firestore Save Error:", err);
      }
    };

    const setupNotifications = async () => {
      console.log("RBS_DEBUG: Triggering setup without login...");

      if (Capacitor.isNativePlatform()) {
        const platform = Capacitor.getPlatform();

        // 1. Android Channel Setup
        if (platform === 'android') {
          await PushNotifications.createChannel({
            id: 'rbs_notifications',
            name: 'RBS Alerts',
            importance: 5,
            visibility: 1,
            vibration: true,
          });
        }

        // 2. Request Permissions (Dono mangna lazmi hain)
        await LocalNotifications.requestPermissions();
        let perm = await PushNotifications.checkPermissions();
        
        if (perm.receive !== 'granted') {
          perm = await PushNotifications.requestPermissions();
        }

        if (perm.receive === 'granted') {
          // 3. Listeners Setup
          await PushNotifications.removeAllListeners();

          await PushNotifications.addListener("registration", (token) => {
            console.log("✅ RBS_SUCCESS: Token Received:", token.value);
            handleRegistration(token.value, platform);
          });

          await PushNotifications.addListener("registrationError", (error) => {
            console.error("❌ RBS_ERROR: Native Registration Error:", error);
          });

          await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
            console.log("RBS_DEBUG: Foreground Push:", notification);
            await LocalNotifications.schedule({
              notifications: [{
                title: notification.title || "RBS Notification",
                body: notification.body || "",
                id: Math.floor(Math.random() * 10000),
                channelId: 'rbs_notifications',
              }]
            });
          });

          // 4. Register
          console.log("RBS_DEBUG: Registering with OS...");
          await PushNotifications.register(); 
        }
      }
    };

    // --- DIRECT CALL (No Auth Required) ---
    setupNotifications();

  }, []);

  return null; 
}