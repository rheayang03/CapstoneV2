/* Minimal service worker for web push notifications */
/* eslint-env serviceworker */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    try {
      data = { title: 'Notification', body: event.data && event.data.text() };
    } catch {}
  }
  const title = data.title || 'Notification';
  const body = data.body || data.message || '';
  const options = {
    body,
    data: data.data || {},
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    tag: data.tag || undefined,
    renotify: Boolean(data.renotify),
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target =
    (event.notification &&
      event.notification.data &&
      event.notification.data.url) ||
    '/notifications';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientsArr) => {
        for (const client of clientsArr) {
          if ('focus' in client) {
            client.focus();
            client.navigate && client.navigate(target);
            return;
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(target);
      })
  );
});
