// sw.js with cache versioning and image fallback
const CACHE_NAME = "scoreboard-cache-v2025-07-04";

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
  "/images/homerun1.gif",
  "/images/homerun2.gif",
  "/images/homerun3.gif",
  "/logo/away-team-logo.png",
  "/logo/home-team-logo.png",
  "/logo/team01-logo.png",
  "/logo/team02-logo.png",
  "/logo/team03-logo.png",
  "/logo/team04-logo.png",
  "/logo/team05-logo.png",
  "/logo/team06-logo.png",
  "/logo/team07-logo.png",
  "/logo/team08-logo.png",
  "/logo/team09-logo.png",
  "/logo/team10-logo.png",
  "/logo/team11-logo.png",
  "/logo/team12-logo.png",
  "/logo/team13-logo.png",
  "/logo/team14-logo.png",
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
