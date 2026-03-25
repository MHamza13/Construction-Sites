// public/custom-sw.js

self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const payload = event.data.json().data || event.data.json();
      
      const rawType = (payload.Type || payload.type || "").toLowerCase().trim().replace(/\s/g, "");
      const sID = payload.SenderID || payload.senderID;
      const pID = payload.projectId || payload.projectID || payload.projectid;
      const title = payload.title || "RBS Update";
      
      let destination = "/";

      if (payload.link) {
        destination = payload.link;
      } else if (rawType === "projectchat" || rawType.includes("projectchat")) {
        destination = (sID && pID) ? `/project-worker/${sID}?projectid=${pID}` : "/chat";
      } else if (rawType === "chat" || title.toLowerCase().includes("chat")) {
        // --- Added Chat ID here ---
        destination = sID ? `/chat?id=${sID}` : "/chat";
      }

      const options = {
        body: payload.body || "New update received",
        icon: '/images/logo/logo-icon.png',
        badge: '/images/logo/logo-icon.png',
        data: { url: destination },
        tag: payload.id || `notif-${Date.now()}`,
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
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('navigate' in client) {
          return client.navigate(targetUrl).then(c => c?.focus());
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});