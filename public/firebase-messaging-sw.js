// public/firebase-messaging-sw.js

/* eslint-disable no-undef */

// ✅ Import Firebase libraries for the Service Worker
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// ✅ Initialize Firebase (replace with your config)
firebase.initializeApp({
  apiKey: "AIzaSyBOwRSUMtT8HRzZHnjpUaNi4_6n0HJYt1E",
  authDomain: "workly-e9a30.firebaseapp.com",
  projectId: "workly-e9a30",
  storageBucket: "workly-e9a30.firebasestorage.app",
  messagingSenderId: "921335062536",
  appId: "1:921335062536:web:922a20ed69f395b695b1bd",
  measurementId: "G-QX222RF0B4",
});

// ✅ Get Firebase Messaging instance
const messaging = firebase.messaging();

// ✅ Handle background notifications
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message:", payload);

  const notificationTitle = payload?.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload?.notification?.body || "",
    icon: "/icons/icon-192x192.png", // optional icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
