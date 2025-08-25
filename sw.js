// sw.js with cache versioning and image fallback
const CACHE_NAME = "scoreboard-cache-v2025-08-08";

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/script.js",
  "/teams-config.js",
  "/styles.css",
  "/sw.js",
  "/icon-192.png",
  "/icon-512.png",
  "/images/animation0.gif",
  "/images/animation1.gif",
  "/images/animation2.gif",
  "/images/animation3.gif",
  "/logo/away-team.png",
  "/logo/home-team.png",
  "/logo/team01.png",
  "/logo/team02.png",
  "/logo/team03.png",
  "/logo/team04.png",
  "/logo/team05.png",
  "/logo/team06.png",
  "/logo/team07.png",
  "/logo/team08.png",
  "/logo/team09.png",
  "/logo/team10.png",
  "/logo/team11.png",
  "/logo/team12.png",
  "/logo/team13.png",
  "/logo/placeholder.png"
];

// Install: Cache all known assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

// Activate: Clean up old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
});

// Fetch: Serve from cache or fetch, fallback for images
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).catch(() => {
        if (e.request.destination === "image") {
          return caches.match("/logo/placeholder.png");
        }
      });
    })
  );
});
