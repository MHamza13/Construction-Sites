// 1. Push Event: Jab server se notification aaye
self.addEventListener('push', function (event) {
  let data = { 
    title: 'New Notification', 
    body: 'Check it out!', 
    url: '/' 
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/images/logo/logo-icon.png', // Aapke folder structure ke mutabiq fix kiya
    badge: '/images/logo/logo-icon.png',
    
    // Sound aur Vibration
    vibrate: [200, 100, 200],
    // Note: Browser sounds sirf tab bajte hain agar browser/OS allow kare
    data: {
      url: data.url || '/'
    },
    
    // Notification behavior
    tag: 'renotify-tag',
    renotify: true,
    actions: [
      { action: 'open', title: 'Open App' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 2. Notification Click: Jab user notification par click kare
self.addEventListener('notificationclick', function (event) {
  event.notification.close(); // Notification ko khatam karein

  // Target URL nikalain jo humne push data mein bheja tha
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Check karein agar app pehle se khuli hai
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Usi tab ko navigate karein aur focus dein
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Agar app band hai, toh naya window/tab kholain
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});