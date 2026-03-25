// public/custom-sw.js

self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const n = event.data.json().data || event.data.json();
      
      const title = n.title || "New Message";
      const sID = n.SenderID || n.senderID;
      const pID = n.projectID || n.projectId;
      const type = (n.type || "").toLowerCase();
      const lowerTitle = title.toLowerCase();
      
      // Destination Logic (Clean & Direct)
      const destination = n.link 
        ? n.link 
        : (type === "chat" || lowerTitle.includes("chat"))
          ? "/chat"
          : (sID && pID)
            ? `/project-worker/${sID}?projectid=${pID}`
            : "/";

      const options = {
        body: n.body || "Click to view details",
        icon: '/images/logo/logo-icon.png',
        badge: '/images/logo/logo-icon.png',
        data: { url: destination }, 
        // Unique tag ensures renotify works and prevents duplicate popups
        tag: n.id || `notif-${Date.now()}`,
        renotify: true,
        vibrate: [200, 100, 200]
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error("Push Event Error:", e);
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  
  // Destination URL format karna
  const urlToOpen = new URL(
    event.notification.data?.url || '/', 
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Agar tab pehle se khula hai, toh focus karo
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 2. Agar koi aur tab khula hai, toh usko navigate karo
      if (windowClients.length > 0) {
        const client = windowClients[0];
        if ('navigate' in client) {
          return client.navigate(urlToOpen).then(c => c?.focus());
        }
      }
      
      // 3. Agar browser close hai, toh naya window kholo
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});