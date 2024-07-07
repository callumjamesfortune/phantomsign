self.addEventListener('push', function(event) {
    console.log('Push event received:', event);
  
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'New Notification';
    const options = {
      body: data.body || 'You have a new email in your temporary inbox.',
      icon: data.icon || '/phantom.svg'
    };
  
    event.waitUntil(self.registration.showNotification(title, options));
  });
  
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
      clients.openWindow('/')
    );
  });
  