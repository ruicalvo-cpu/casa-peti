// Casa Peti — Service Worker
// Guarda em cache o "esqueleto" da app (HTML/CSS/JS/ícones) para que abra
// instantaneamente e funcione mesmo com fraca cobertura de rede na aldeia.
// Os dados partilhados (compras, menus, etc.) NÃO passam por aqui —
// esses vêm sempre da base de dados em tempo real.

const CACHE_NAME = "casa-peti-shell-v7";

const SHELL_FILES = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/firebase-config.js",
  "./js/compras.js",
  "./js/menus.js",
  "./js/agenda.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nunca guardar em cache chamadas a APIs externas (tempo, base de dados, etc.)
  // — isso tem de vir sempre fresco da rede.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Estratégia "network-first": tenta sempre a rede primeiro, para nunca
  // mostrares uma versão desatualizada da app. Só usa a cache como reserva
  // se não houver ligação (ex: fraca cobertura na aldeia).
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
