// Service Worker - Basic placeholder
// Service Worker - Basic placeholder
// This file prevents 404 errors for sw.js requests

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests without caching
  event.respondWith(fetch(event.request));
});
