const CACHE_NAME = 'ev-gps-nav-v1';
const ASSETS_TO_CACHE = [
  '/', 
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  // ถ้ามีไฟล์ CSS/JS อื่น ให้เพิ่มที่นี่
];

// ระหว่างติดตั้ง ให้แคช ASSETS_TO_CACHE
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// activate: เคลียร์ cache เก่า
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// fetch: ตอบจาก cache ก่อน ถ้าไม่มีถึงค่อยยิงเน็ต
self.addEventListener('fetch', evt => {
  const url = new URL(evt.request.url);

  // สำหรับ Google Maps tiles / JavaScript ถ้าเคยแคชไว้ ให้คืนจาก cache
  if (url.origin.includes('googleapis.com') ||
      url.origin.includes('gstatic.com')) {
    evt.respondWith(
      caches.match(evt.request).then(resp =>
        resp || fetch(evt.request).then(fetchResp => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(evt.request, fetchResp.clone());
            return fetchResp;
          });
        })
      )
    );
    return;
  }

  // สำหรับไฟล์แอปหลัก
  evt.respondWith(
    caches.match(evt.request).then(resp =>
      resp || fetch(evt.request)
    )
  );
});
