/* eslint-disable no-undef */

// 1. SDKs Import
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// 2. Firebase Config
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

// 3. Background Message Handler
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background Message received: ', payload);
    
    const notificationTitle = payload.notification?.title || "New Update";
    const notificationOptions = {
        body: payload.notification?.body || "Check your RBS app",
        icon: '/icons/icon-192x192.png', // Ensure ye file public folder mein ho
        badge: '/icons/badge.png',        // Chota icon jo top bar mein dikhta hai
        data: payload.data || {},
        vibrate: [200, 100, 200],
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 4. Notification Click Handler (App open karne ke liye)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    // Yahan click hone par app ka specific URL open karein
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/'); // App root open karein
        })
    );
});