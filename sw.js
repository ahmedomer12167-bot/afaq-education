const CACHE_NAME = "afaq-pwa-fcm-v2";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js");

const firebaseConfig={
  apiKey:"AIzaSyAercsM1RjeL-GTMCBafeSN7W1aph9hvRw",
  authDomain:"afaq-education-99de3.firebaseapp.com",
  projectId:"afaq-education-99de3",
  storageBucket:"afaq-education-99de3.firebasestorage.app",
  messagingSenderId:"23291110528",
  appId:"1:23291110528:web:cf1fcdeb13487faf6cb265",
  measurementId:"G-QQ2Y4Y3XKL"
};
firebase.initializeApp(firebaseConfig);

try {
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage(function(payload) {
    const title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title) || "منصة آفاق التعليمية";
    const options = {
      body: (payload.notification && payload.notification.body) || (payload.data && payload.data.body) || "لديك إشعار جديد",
      icon: "icon-192.png",
      badge: "icon-192.png",
      data: payload.data || {}
    };
    self.registration.showNotification(title, options);
  });
} catch(e) {
  console.log("FCM background messaging error:", e);
}
