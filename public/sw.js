self.addEventListener('push', function(event) {
    console.log('Push event received:', event);
  
    let data = {};
    try {
      data = event.data ? event.data.json() : {};
    } catch (e) {
      console.error('Error parsing push event data:', e);
      data = {
        title: 'Test Notification',
        body: 'This is a test push notification.',
        icon: '/phantom.svg'
      };
    }
  
    const title = data.title || 'New Notification';
    const options = {
      body: data.body || 'You have a new email in your temporary inbox.',
      icon: data.icon || '/phantom.svg',
    };
  
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  });
  
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
      clients.openWindow('/')
    );
  });
  