/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

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
const messaging = firebase.messaging();

// Background Notification Handler
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background Message:", payload);

  // Notification content extract karein
  const notificationTitle = payload.notification?.title || "Workly Message";
  const notificationOptions = {
    body: payload.notification?.body || "Check your app for updates.",
    icon: "/icons/icon-192x192.png", 
    badge: "/icons/icon-192x192.png",
    tag: "workly-notification", // Same tag se purana notification overwrite ho jayega
    renotify: true,
    data: payload.data,
  };

  // System ko batayein ke notification dikhana hai
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click listener inside SW (Optional: to open app on click)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') // Click par app home page khole
  );
});