// public/custom-sw.js

self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const n = event.data.json().data || event.data.json();
      
      const title = n.title || "New Message";
      const sID = n.SenderID || n.senderID;
      const pID = n.projectID || n.projectId || 'default';
      const type = n.type || "";
      
      // Destination Logic - Fixed "chsssat" typo to "chat"
      let destination = n.link || (
        (type === "chat" || title.toLowerCase().includes("chat")) 
        ? "/chat" 
        : `/project-worker/${sID}?projectid=${pID}`
      );

      const options = {
        body: n.body || "Click to view details",
        icon: '/images/logo/logo-icon.png',
        badge: '/images/logo/logo-icon.png',
        data: { url: destination },
        tag: n.id || 'renotify',
        renotify: true,
        vibrate: [200, 100, 200] // Added vibration for better mobile feel
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error("Push Error:", e);
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  // URL ko properly form karna
  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Check if the specific page is already open
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // 2. Check if any app window is open, then navigate that window
      if (windowClients.length > 0) {
        const client = windowClients[0];
        if ('navigate' in client) {
          return client.navigate(urlToOpen).then(c => c?.focus());
        }
      }

      // 3. If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});