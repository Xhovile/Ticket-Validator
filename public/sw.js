const CACHE = "buymesho-validator-v7";
const SHELL = ["/", "/index.html", "/manifest.json", "/vite.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isNavigation = request.mode === "navigate";
  const isAsset = url.pathname.startsWith("/assets/")
    || url.pathname.endsWith(".js")
    || url.pathname.endsWith(".css")
    || SHELL.includes(url.pathname);

  if (!isNavigation && !isAsset) return;

  event.respondWith(
    (async () => {
      try {
        // Always ask the network for navigation requests. Vercel must resolve
        // /events, /scanner and /attendees to the SPA entry point first.
        // This prevents an old cached deep-link response from producing a blank page.
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put(request, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (isNavigation) {
          const shell = await caches.match("/index.html");
          if (shell) return shell;
        }

        return new Response("Offline", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      }
    })(),
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-ticket-validations") {
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "BACKGROUND_SYNC_TRIGGERED" });
        }
      }),
    );
  }
});
