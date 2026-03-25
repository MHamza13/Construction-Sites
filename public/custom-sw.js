self.addEventListener('push', function (event) {
  let data = { title: '', body: '', url: '' };

  if (event.data) {
    try {
      const payload = event.data.json();
      
      // --- Aapka Logic Yahan Start Hota Hai ---
      const lowerTitle = (payload.title || "").toLowerCase();
      let destination = payload.link || "/";

      // Agar link nahi hai, toh title ya type se check karein
      if (!payload.link) {
        if (payload.type === "chat" || lowerTitle.includes("chat")) {
          destination = "/chat";
        } else if (payload.SenderID) {
          destination = `/project-worker/${payload.SenderID}?projectid=${payload.projectID || 'default'}`;
        }
      }
      
      data = {
        title: payload.title || "New Notification",
        body: payload.body || "Check it out!",
        url: destination // Final destination url
      };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/images/logo/logo-icon.png',
    badge: '/images/logo/logo-icon.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url
    },
    tag: 'renotify-tag',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});