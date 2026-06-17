const CACHE_NAME = "afaq-final-safe-v3";
const APP_FILES = ["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png"];
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.mode === "navigate" || req.url.endsWith("index.html")) {
    event.respondWith(fetch(req, {cache:"no-store"}).catch(() => caches.match("./index.html")));
    return;
  }
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
