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
        console.log(`RBS_DEBUG: Attempting to save token for ${platform}...`);
        const userRef = doc(db, "users", userId); 
        await setDoc(userRef, {
          fcmToken: token,
          platform: platform,
          lastTokenUpdate: serverTimestamp(),
          status: "active"
        }, { merge: true });
        console.log(`✅ RBS_SUCCESS: Token Saved [${platform}]:`, token);
      } catch (err) {
        console.error("❌ RBS_ERROR: Firestore Save Error:", err);
      }
    };

    const setupNotifications = async (userId: string) => {
      console.log("RBS_DEBUG: setupNotifications started for user:", userId);

      if (Capacitor.isNativePlatform()) {
        // --- 📱 MOBILE NATIVE LOGIC ---
        const platform = Capacitor.getPlatform();
        console.log("RBS_DEBUG: Native Platform detected:", platform);

        await PushNotifications.removeAllListeners();

        // 1. Add Listeners
        await PushNotifications.addListener("registration", (token) => {
          console.log("✅ RBS_SUCCESS: Native Registration Token Received:", token.value);
          handleRegistration(userId, token.value, platform);
        });

        await PushNotifications.addListener("registrationError", (error) => {
          console.error("❌ RBS_ERROR: Native Registration Error:", error);
        });

        await PushNotifications.addListener('registration', (token) => {
  console.log('My FCM Token: ' + token.value);
});

        await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
          console.log("RBS_DEBUG: Push Received in Foreground:", notification);
          await LocalNotifications.schedule({
            notifications: [{
              title: notification.title || "RBS Update",
              body: notification.body || "New update received",
              id: Date.now(),
              channelId: 'rbs_notifications',
            }]
          });
        });

        // 2. Create Channel (Android Only)
        if (platform === 'android') {
          await PushNotifications.createChannel({
            id: 'rbs_notifications',
            name: 'RBS Alerts',
            importance: 5,
          });
        }

        // 3. Request Permissions & Register
        console.log("RBS_DEBUG: Requesting Push Permissions...");
        let perm = await PushNotifications.checkPermissions();
        
        if (perm.receive !== 'granted') {
          perm = await PushNotifications.requestPermissions();
        }

        if (perm.receive === 'granted') {
          console.log("RBS_DEBUG: Permission GRANTED. Calling PushNotifications.register()...");
          await PushNotifications.register(); // Ye line Google se token mangwati hai
        } else {
          console.warn("⚠️ RBS_WARNING: Push Permission Denied by User.");
        }

      } else {
        // --- 🌐 WEB LOGIC ---
        console.log("RBS_DEBUG: Web Platform detected.");
        const token = await getFCMToken();
        if (token && token !== "permission-denied") {
          handleRegistration(userId, token, "web");
        }
        
        onMessageListener().then((payload) => {
          console.log("✅ RBS_SUCCESS: Web Foreground message received", payload);
        });
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("RBS_DEBUG: Auth State Changed - User Logged In");
        setupNotifications(user.uid);
      } else {
        console.log("RBS_DEBUG: Auth State Changed - No User");
      }
    });

    return () => unsubscribe();
  }, []);

  return null; 
}