// public/custom-sw.js

self.addEventListener('push', function (event) {

  if (event.data) {
    try {
      const payload = event.data.json();
      
      // Firebase data structure handle karna
      // (Data aksar payload.data mein hota hai ya direct payload mein)
      const n = payload.data || payload; 
      
      const title = n.title || "New Message";
      const body = n.body || "You have a new notification";
      const type = n.type || ""; // 'chat' ya 'project'
      const lowerTitle = title.toLowerCase();

      // IDs (Case sensitivity handling: SenderID vs senderID)
      const sID = n.SenderID || n.senderID;
      const pID = n.projectID || n.projectId || 'default';

      // 1. Agar Firestore se direct link aayi hai
      let destination = n.link;

      // 2. Agar link nahi hai toh Type base navigation
      if (!destination) {
        if (type === "chat" || lowerTitle.includes("chat")) {
          destination = "/chat";
        } else if (type === "project" || sID) {
          // Dynamic URL for workers/projects
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
    data: { url: data.url }, // Navigation ke liye URL save ho raha hai
    tag: 'renotify-tag', 
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// --- Click Event (PWA Navigation) ---
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  // Target URL ko absolute banayein taake match sahi ho
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Agar wahi page (e.g. Chat) pehle se khula hai, toh sirf focus karein
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }

      // 2. Agar app kisi aur page par khuli hai, toh usay navigate kar dein
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'navigate' in client) {
          return client.navigate(targetUrl).then(c => c?.focus());
        }
      }

      // 3. Agar app band hai (Browser mein tab nahi hai), toh naya window kholain
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});