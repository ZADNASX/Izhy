// Mode hors ligne : garde l'appli et ses polices dans le cache de la tablette.
// Changer VERSION à chaque mise à jour de index.html pour que les tablettes la récupèrent.
const VERSION = "ardoise-v1";
const APP = ["./", "index.html", "manifest.json", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord pour la page (mises à jour rapides), cache sinon ; cache d'abord pour le reste (polices, icônes).
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put("index.html", copy)); return r; })
        .catch(() => caches.match("index.html"))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    }))
  );
});
