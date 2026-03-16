"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

export default function PushNotificationInit() {
  useEffect(() => {
    // Sirf tab chale jab platform 'web' na ho (yaani Android/iOS ho)
    if (Capacitor.getPlatform() !== "web") {
      
      const initializePush = async () => {
        // Permissions check karein
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === "granted") {
          // Token register karein
          await PushNotifications.register();
        }

        // Listeners setup karein
        PushNotifications.addListener("registration", (token) => {
          console.log("Push registration success, token:", token.value);
        });

        PushNotifications.addListener("registrationError", (err) => {
          console.error("Registration error:", err);
        });

        PushNotifications.addListener("pushNotificationReceived", (notification) => {
          console.log("Push received:", notification);
        });
      };

      initializePush();
    } else {
      console.log("Push Notifications: Skipping on Web platform.");
    }
  }, []);

  return null; // Ye component screen par kuch dikhayega nahi
}