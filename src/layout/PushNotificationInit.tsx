"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications"; 
import { db, auth, getFCMToken, onMessageListener } from "@/firebase/Firebase"; 
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PushNotificationInit() {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const handleRegistration = async (userId: string, token: string, platform: string) => {
      try {
        console.log(`RBS_DEBUG: Saving token for ${platform}...`);
        const userRef = doc(db, "users", userId); 
        await setDoc(userRef, {
          fcmToken: token,
          platform: platform,
          lastTokenUpdate: serverTimestamp(),
          status: "active"
        }, { merge: true });
        console.log(`✅ RBS_SUCCESS: Token Synced [${platform}]:`, token);
      } catch (err) {
        console.error("❌ RBS_ERROR: Firestore Save Error:", err);
      }
    };

    const setupNotifications = async (userId: string) => {
      console.log("RBS_DEBUG: Starting setup for user:", userId);

      if (Capacitor.isNativePlatform()) {
        const platform = Capacitor.getPlatform();

        // 1. Android Channel Setup (Hamesha pehle karein)
        if (platform === 'android') {
          await PushNotifications.createChannel({
            id: 'rbs_notifications',
            name: 'RBS Alerts',
            importance: 5, // High priority
            visibility: 1,
            vibration: true,
          });
        }

        // 2. Request Permissions (Push + Local)
        // Android 13+ ke liye ye dono mangna zaroori hain
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
            handleRegistration(userId, token.value, platform);
          });

          await PushNotifications.addListener("registrationError", (error) => {
            console.error("❌ RBS_ERROR: Native Registration Error:", error);
          });

          await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
            console.log("RBS_DEBUG: Foreground Push Received:", notification);
            
            // Notification ko screen par dikhana (Foreground)
            await LocalNotifications.schedule({
              notifications: [{
                title: notification.title || "RBS Update",
                body: notification.body || "New update available",
                id: Math.floor(Math.random() * 10000), // Unique ID
                channelId: 'rbs_notifications',
                smallIcon: 'res://ic_stat_name', // Make sure this exists in Android res folder
              }]
            });
          });

          // 4. Finally Register with FCM
          console.log("RBS_DEBUG: Registering with OS...");
          await PushNotifications.register(); 
        } else {
          console.warn("⚠️ RBS_WARNING: Notification Permission Denied.");
        }

      } else {
        // --- Web Logic ---
        try {
          const token = await getFCMToken();
          if (token && token !== "permission-denied") {
            handleRegistration(userId, token, "web");
          }
          
          onMessageListener().then((payload) => {
            console.log("✅ RBS_SUCCESS: Web Message:", payload);
          });
        } catch (error) {
          console.error("RBS_DEBUG: Web Setup Error:", error);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setupNotifications(user.uid);
      } else {
        console.log("RBS_DEBUG: No authenticated user found.");
      }
    });

    return () => unsubscribe();
  }, []);

  return null; 
}