const CACHE = "dentora-shell-v1"; const ASSETS = ["/", "/login", "/icon.svg"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>undefined)));
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => { if (e.request.method !== "GET") return; e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match("/login")))); });
