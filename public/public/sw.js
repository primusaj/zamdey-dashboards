// public/sw.js
self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'You have a new pickup mission available!',
      icon: '/icon.png', 
      badge: '/badge.png',
      vibrate: [200, 100, 200, 100, 200, 100, 400], 
      data: {
        url: data.url || '/rider/dashboard'
      },
      actions: [
        { action: 'open', title: '🚀 OPEN DASHBOARD' }
      ],
      tag: 'new-mission-alert', 
      requireInteraction: true 
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '🚀 ZAMDEY MISSION', options)
    );
  } catch (err) {
    console.error('Push handling failed:', err);
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes('/rider/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});