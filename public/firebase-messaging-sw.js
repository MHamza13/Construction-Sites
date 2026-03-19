/* eslint-disable no-undef */

// Behtar check: Service Worker URL parameters check karta hai
const isNative = new URL(location).searchParams.get('platform') === 'android';

if (isNative) {
    console.log("[SW] Android detected, skipping SW initialization.");
} else {
    importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
    importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

    // Config ko ek hi baar define karein
    const firebaseConfig = {
        apiKey: "AIzaSyBOwRSUMtT8HRzZHnjpUaNi4_6n0HJYt1E",
        authDomain: "workly-e9a30.firebaseapp.com",
        projectId: "workly-e9a30",
        storageBucket: "workly-e9a30.firebasestorage.app",
        messagingSenderId: "921335062536",
        appId: "1:921335062536:web:922a20ed69f395b695b1bd",
    };

    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log('[SW] Background Message received: ', payload);
        
        const notificationTitle = payload.notification?.title || "New Update";
        const notificationOptions = {
            body: payload.notification?.body || "Check your RBS app",
            icon: '/icons/icon-192x192.png',
            data: payload.data,
        };

        return self.registration.showNotification(notificationTitle, notificationOptions);
    });
}