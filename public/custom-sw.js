self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : { title: 'New Notification', body: 'Check it out!' };

  const options = {
    body: data.body,
    icon: '/images/icon-192x192.png', 
    badge: '/images/badge.png',
    
    // Sound aur Vibration logic
    vibrate: [200, 100, 200],
    sound: '/images/jackhammer.mp3', 
    
    tag: 'renotify-tag',
    renotify: true,
    
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            return client.focus();
          }
        }
        return client.focus();
      }
      return clients.openWindow(event.notification.data.url || '/');
    })
  );
});