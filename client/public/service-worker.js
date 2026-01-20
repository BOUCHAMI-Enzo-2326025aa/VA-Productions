const CACHE_VERSION = "v2";
const STATIC_CACHE = `va-productions-${CACHE_VERSION}`;

// Pr005-cache uniquement des fichiers stables (pas de HTML / routing).
const PRECACHE_URLS = [
  "/manifest.json",
  "/icons/logo-192.png",
  "/icons/logo-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("va-productions-") && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Ne pas intercepter les navigations (documents HTML), sinon 205a peut provoquer une page blanche.
  if (req.mode === "navigate") return;

  event.respondWith(caches.match(req).then((c) => c || fetch(req)));
});