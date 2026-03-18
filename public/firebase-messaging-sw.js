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
  console.log('[SW] Background Message received: ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png',
    data: payload.data,
    tag: 'workly-notification' 
  };

  // YE LINE SABSE ZAROORI HAI:
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click listener inside SW (Optional: to open app on click)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') // Click par app home page khole
  );
});