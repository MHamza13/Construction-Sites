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
      
      // --- Centralized Destination Logic (Matching React Component) ---
      let destination = '/'; // Default fallback

      if (n.link) {
        destination = n.link; // Direct link if provided
      } 
      else if (type === "chat" || lowerTitle.includes("chat")) {
        destination = "/chat"; // Chat route
      } 
      else if (type === "project" || pID !== 'default') {
        destination = `/project-worker/${sID}?projectid=${pID}`; // Project route
      }

      const options = {
        body: n.body || "Click to view details",
        icon: '/images/logo/logo-icon.png',
        badge: '/images/logo/logo-icon.png',
        data: { url: destination }, // Click event ke liye destination save kiya
        tag: n.id || 'renotify',
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

  // Relative path ko Absolute URL mein convert karna
  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Agar wahi exact URL pehle se khula hai toh sirf focus karo
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // 2. Agar koi bhi window khuli hai (lekin kisi aur page par), toh navigate karo
      if (windowClients.length > 0) {
        const client = windowClients[0];
        if ('navigate' in client) {
          return client.navigate(urlToOpen).then(c => c?.focus());
        }
      }

      // 3. Agar app band hai, toh naya tab/window kholo
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});