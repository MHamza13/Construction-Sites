// public/custom-sw.js

self.addEventListener('push', function (event) {
  // Initial fallback data (agar payload na mile)
  let data = { title: 'New Notification', body: 'Click to open', url: '/' };

  if (event.data) {
    try {
      const payload = event.data.json();
      
      // Firebase data ya notification object se raw data nikalna
      const n = payload.data || payload; 
      
      const title = n.title || "New Message";
      const body = n.body || "Check it out!";
      const type = n.type; // 'chat' ya 'project'
      const lowerTitle = title.toLowerCase();

      // IDs Handle karna (Case sensitivity handle ki gayi hai)
      const sID = n.SenderID || n.senderID;
      const pID = n.projectID || n.projectId || 'default';

      // Link logic: Bilkul aapke frontend component jaisa
      let destination = n.link;

      if (!destination) {
        if (type === "chat" || lowerTitle.includes("chat")) {
          destination = "/chat";
        } else if (type === "project" || sID) {
          // Dynamic URL for project worker
          destination = `/project-worker/${sID}?projectid=${pID}`;
        } else {
          destination = "/";
        }
      }

      data = {
        title: title,
        body: body,
        url: destination
      };
    } catch (e) {
      console.error("Push payload processing error:", e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/images/logo/logo-icon.png',
    badge: '/images/logo/logo-icon.png',
    vibrate: [200, 100, 200],
    data: { url: data.url }, // Navigation ke liye URL store karna
    tag: 'renotify-tag', // Ek hi tag taake notifications stack na hon
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  // Target URL ko absolute URL mein convert karna (Required for PWA)
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Check karein agar exact wahi target page pehle se khula hai
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }

      // 2. Agar app kisi aur page par khuli hai, toh navigate karein
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'navigate' in client) {
          return client.navigate(targetUrl).then(c => c?.focus());
        }
      }

      // 3. Agar app band hai, toh naya tab/window kholain
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});