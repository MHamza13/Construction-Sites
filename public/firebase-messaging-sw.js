/* eslint-disable no-undef */

// ✅ Import Firebase libraries (Compat versions are best for SW)
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// ✅ Initialize Firebase
// Note: Ensure these keys match your firebase.ts exactly
const firebaseConfig = {
  apiKey: "AIzaSyBOwRSUMtT8HRzZHnjpUaNi4_6n0HJYt1E",
  authDomain: "workly-e9a30.firebaseapp.com",
  projectId: "workly-e9a30",
  storageBucket: "workly-e9a30.firebasestorage.app",
  messagingSenderId: "921335062536",
  appId: "1:921335062536:web:922a20ed69f395b695b1bd",
  measurementId: "G-QX222RF0B4",
};

firebase.initializeApp(firebaseConfig);

// ✅ Get Firebase Messaging instance
const messaging = firebase.messaging();

// ✅ Service Worker Lifecycle Management
// Ye code zaroori hai taaki service worker foran active ho jaye aur token generate kare
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// ✅ Handle background notifications
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background Message received:", payload);

  const notificationTitle = payload?.notification?.title || "Workly Notification";
  const notificationOptions = {
    body: payload?.notification?.body || "You have a new update.",
    icon: "/icons/icon-192x192.png", // Ensure this file exists in /public/icons/
    badge: "/icons/icon-192x192.png",
    data: payload?.data, // Custom data pass karne ke liye
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});