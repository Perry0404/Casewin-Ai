// CaseWin Legal Aid — keeps the field-visit form usable without signal.
// Only the visit page and the site's static files are cached; no case data is.
const CACHE = 'la-visit-v1'
const PAGE = '/desk/visit'

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then((c) => c.add(PAGE).catch(() => {})))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  // Static build files never change once deployed: cache first.
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
            return res
          }),
      ),
    )
    return
  }
  // The visit page: network first, the saved copy when offline.
  if (url.pathname === PAGE && req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(PAGE, copy))
          }
          return res
        })
        .catch(() => caches.match(PAGE).then((hit) => hit || Response.error())),
    )
  }
})
