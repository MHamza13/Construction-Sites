// public/custom-sw.js

self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const payload = event.data.json().data || event.data.json();
      
      // --- 1. Wahi Logic jo NavigationDropdown mein hai ---
      const rawType = (payload.Type || payload.type || "").toLowerCase().trim().replace(/\s/g, "");
      const sID = payload.SenderID || payload.senderID;
      const pID = payload.projectId || payload.projectID || payload.projectid;
      const title = payload.title || "RBS Update";
      
      let destination = "/";

      if (payload.link) {
        destination = payload.link;
      } else if (rawType === "projectchat" || rawType.includes("projectchat")) {
        if (sID && pID) {
          destination = `/project-worker/${sID}?projectid=${pID}`;
        } else {
          destination = "/chat";
        }
      } else if (rawType === "chat" || title.toLowerCase().includes("chat")) {
        destination = "/chat";
      }

      const options = {
        body: payload.body || "New update received",
        icon: '/images/logo/logo-icon.png',
        badge: '/images/logo/logo-icon.png',
        data: { url: destination }, // Destination yahan save ho rahi hai
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
  
  // Destination URL format karna (Domain name ke sath)
  const targetUrl = new URL(
    event.notification.data?.url || '/', 
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Agar koi bhi window khuli hai (bhale hi kisi bhi page par ho)
      for (const client of windowClients) {
        // Use navigate to force the existing window to the new URL
        if ('navigate' in client) {
          return client.navigate(targetUrl).then(c => c?.focus());
        }
      }
      
      // 2. Agar app bilkul band hai, toh naya window kholo target URL par
      if (clients.openWindow) {ss
        return clients.openWindow(targetUrl);
      }
    })
  );
});