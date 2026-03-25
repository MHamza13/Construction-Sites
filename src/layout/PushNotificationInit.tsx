"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications"; 
import { db, getFCMToken, onMessageListener } from "@/firebase/Firebase"; 
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function PushNotificationInit() {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // --- Token Save Karne Ka Function ---
    const handleRegistration = async (token: string, platform: string) => {
      try {
        console.log(`RBS_DEBUG: Saving token for ${platform}...`);
        
        /**
         * Kyunke hum auth use nahi kar rahe, hum token ko hi Document ID bana rahe hain.
         * Isse duplicate tokens create nahi honge.
         */
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

    const setupNotifications = async () => {
      console.log("RBS_DEBUG: Starting setup (Direct Call)...");

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

        // 2. Request Permissions
        await LocalNotifications.requestPermissions();
        let perm = await PushNotifications.checkPermissions();
        
        if (perm.receive !== 'granted') {
          perm = await PushNotifications.requestPermissions();
        }

        if (perm.receive === 'granted') {
          // 3. Listeners ko Register se pehle add karein
          await PushNotifications.removeAllListeners();

          await PushNotifications.addListener("registration", (token) => {
            console.log("✅ RBS_SUCCESS: Native Token Received:", token.value);
            handleRegistration(token.value, platform);
          });

          await PushNotifications.addListener("registrationError", (error) => {
            console.error("❌ RBS_ERROR: Native Registration Error:", error);
          });

          await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
            console.log("RBS_DEBUG: Foreground Push Received:", notification);
            
            await LocalNotifications.schedule({
              notifications: [{
                title: notification.title || "RBS Update",
                body: notification.body || "New update available",
                id: Math.floor(Math.random() * 10000),
                channelId: 'rbs_notifications',
              }]
            });
          });

          // 4. Register
          console.log("RBS_DEBUG: Registering with OS...");
          await PushNotifications.register(); 
        }

      } else {
        // --- Web Logic (If needed) ---
        try {
          const token = await getFCMToken();
          if (token && token !== "permission-denied") {
            handleRegistration(token, "web");
          }
          
          onMessageListener().then((payload) => {
            console.log("✅ RBS_SUCCESS: Web Message:", payload);
          });
        } catch (error) {
          console.error("RBS_DEBUG: Web Setup Error:", error);
        }
      }
    };

    // --- DIRECT CALL: Kisi condition ka intezar nahi ---
    setupNotifications();

  }, []);

  return null; 
}