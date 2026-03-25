// public/custom-sw.js

self.addEventListener('push', function (event) {
  let data = { title: 'New Notification', body: 'Check it out!', url: '/' };

  if (event.data) {
    try {
      const payload = event.data.json();
      const lowerTitle = (payload.title || "").toLowerCase();
      
      // Exact same logic as your React component
      let destination = payload.link;
      
      if (!destination) {
        if (payload.type === "chat" || lowerTitle.includes("chat")) {
          destination = "/chat";
        } else if (payload.SenderID) {
          destination = `/project-worker/${payload.SenderID}?projectid=${payload.projectID || 'default'}`;
        } else {
          destination = "/";
        }
      }

      data = {
        title: payload.title || "New Message",
        body: payload.body || "You have a new notification",
        url: destination
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
    data: { url: data.url }, // Link yahan store hota hai
    tag: 'renotify-tag',
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  // URL ko absolute banana zaroori hai
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // 1. Agar tab pehle se khula hai toh usay navigate aur focus karein
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // 2. Agar band hai toh naya tab kholain
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});