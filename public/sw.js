// Service Worker placeholder
// This file prevents 404 errors when libraries attempt to register a service worker

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
