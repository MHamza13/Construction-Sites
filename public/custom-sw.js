self.addEventListener('push', function (event) {
  let data = { title: 'New Notification', body: 'Check it out!', url: '/' };

  if (event.data) {
    try {
      const payload = event.data.json();
      const lowerTitle = (payload.title || "").toLowerCase();
      let destination = payload.link || "/";

      // --- Logic for destination URL ---
      if (!payload.link) {
        if (payload.type === "chat" || lowerTitle.includes("chat")) {
          destination = "/chat";
        } else if (payload.senderID || payload.SenderID) {
          const sID = payload.senderID || payload.SenderID;
          const pID = payload.projectID || 'default';
          destination = `/project-worker/${sID}?projectid=${pID}`;
        }
      }

      data = {
        title: payload.title || "New Notification",
        body: payload.body || "You have a new update.",
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
    data: {
      url: data.url // Storing the destination URL here
    },
    tag: 'renotify-tag',
    renotify: true,
    actions: [
      { action: 'open_url', title: 'View Now' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close(); // Notification ko close karein

  // Target URL ko absolute banayein
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;

    // 1. Check karein agar koi window pehle se open hai hamari site ki
    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url.startsWith(self.location.origin)) {
        matchingClient = windowClient;
        break;
      }
    }

    // 2. Agar window mil jaye toh use navigate karein aur focus karein
    if (matchingClient) {
      return matchingClient.navigate(targetUrl).then(client => client.focus());
    } else {
      // 3. Agar koi window open na ho toh openWindow use karein
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }
  });

  event.waitUntil(promiseChain);
});