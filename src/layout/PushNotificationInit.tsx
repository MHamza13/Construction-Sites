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
        const userRef = doc(db, "users", userId); 
        await setDoc(userRef, {
          fcmToken: token,
          platform: platform,
          lastTokenUpdate: serverTimestamp(),
          status: "active"
        }, { merge: true });
        console.log(`✅ Token Saved [${platform}]:`, token);
      } catch (err) {
        console.error("❌ Firestore Save Error:", err);
      }
    };

    const setupNotifications = async (userId: string) => {
      if (Capacitor.isNativePlatform()) {
        // --- 📱 MOBILE NATIVE LOGIC ---
        const platform = Capacitor.getPlatform();
        await PushNotifications.removeAllListeners();

        await PushNotifications.addListener("registration", (token) => {
          handleRegistration(userId, token.value, platform);
        });

        await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
          await LocalNotifications.schedule({
            notifications: [{
              title: notification.title || "RBS Update",
              body: notification.body || "New update received",
              id: Date.now(),
              channelId: 'rbs_notifications',
            }]
          });
        });

        if (platform === 'android') {
          await PushNotifications.createChannel({
            id: 'rbs_notifications',
            name: 'RBS Alerts',
            importance: 5,
          });
        }

        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') perm = await PushNotifications.requestPermissions();
        if (perm.receive === 'granted') await PushNotifications.register();

      } else {
        // --- 🌐 WEB LOGIC ---
        const token = await getFCMToken();
        if (token && token !== "permission-denied") {
          handleRegistration(userId, token, "web");
        }
        
        // Web Foreground listener
        onMessageListener().then((payload) => {
          console.log("Received foreground web message", payload);
          // Yahan aap toast dikha sakte hain
        });
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setupNotifications(user.uid);
    });

    return () => unsubscribe();
  }, []);

  return null; 
}