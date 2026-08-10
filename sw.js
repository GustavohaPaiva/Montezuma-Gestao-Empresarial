/* Montezuma PWA — network-first for navigations; cache static shell lightly */
const CACHE = 'montezuma-shell-v2'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/', '/index.html', '/manifest.webmanifest'])).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone()
        if (req.mode === 'navigate' || req.destination === 'document') {
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy)).catch(() => {})
        }
        return res
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('/index.html'))
      )
  )
})
