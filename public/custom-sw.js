// public/custom-sw.js

self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const n = event.data.json().data || event.data.json();
      
      const title = n.title || "New Message";
      const sID = n.SenderID || n.senderID;
      const pID = n.projectID || n.projectId || 'default';
      const type = (n.type || "").toLowerCase();
      const lowerTitle = title.toLowerCase();
      
      // Destination Logic
      let destination = '/';
      if (n.link) {
        destination = n.link;
      } else if (type === "chat" || lowerTitle.includes("chat")) {
        destination = "/chat";
      } else {
        destination = `/project-worker/${sID}?projectid=${pID}`;
      }

      const options = {
        body: n.body || "Click to view details",
        icon: '/images/logo/logo-icon.png',
        badge: '/images/logo/logo-icon.png',
        data: { url: destination }, 
        tag: n.id || 'rbs-notification',
        renotify: true,
        vibrate: [200, 100, 200]
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error("Push Error:", e);
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (windowClients.length > 0) {
        const client = windowClients[0];
        if ('navigate' in client) {
          return client.navigate(urlToOpen).then(c => c?.focus());
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});