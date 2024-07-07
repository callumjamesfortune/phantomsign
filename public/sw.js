self.addEventListener('push', function (e) { 
    console.log('Push Received...')
    const data = e.data.json()
    self.registration.showNotification(data.title, {
      body: 'Notified by PhantomSign',
      icon: '/phantom.svg',
    })
  })