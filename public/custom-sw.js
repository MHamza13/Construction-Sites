// public/custom-sw.js

self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const n = payload.data || payload; 

      const title = n.title || "New Message";
      const body = n.body || "Click to see details";
      const type = n.type || ""; 
      const lowerTitle = title.toLowerCase();

      // IDs Handling
      const sID = n.SenderID || n.senderID;
      const pID = n.projectID || n.projectId || 'default';

      // Logic for Destination
      let destination = n.link;
      if (!destination) {
        if (type === "chat" || lowerTitle.includes("chat")) {
          destination = "/chat";
        } else if (type === "project" || sID) {
          destination = `/project-worker/${sID}?projectid=${pID}`;
        } else {
          destination = "/";
        }
      }

      const options = {
        body: body,
        icon: '/images/logo/logo-icon.png',
        badge: '/images/logo/logo-icon.png',
        vibrate: [200, 100, 200],
        data: { url: destination }, // Click ke liye URL save
        tag: n.id || 'renotify-tag',
        renotify: true,
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error("SW Push Error:", e);
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  // URL ko absolute banana zaroori hai PWA ke liye
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Agar wahi page pehle se khula hai toh focus
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // 2. Agar app kisi aur page par khuli hai toh navigate
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'navigate' in client) {
          return client.navigate(targetUrl).then(c => c?.focus());
        }
      }
      // 3. Agar app band hai toh naya window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});