// Service worker: guarda a "casca" do app para abrir rápido e instalar como app.
// Dados (/api) nunca vão para o cache: sempre buscam do servidor.
const VERSION = "painel-v29";
const SHELL = ["/", "/index.html", "/painel.css", "/ios.css", "/app.js", "/saude.js", "/financas.js", "/self.js", "/carreira.js", "/carreira.css", "/ai.js", "/calendario.js", "/calendario.css", "/treino.js", "/dieta.js", "/taco.json", "/mcp.js", "/data.js", "/manifest.webmanifest", "/vendor/supabase-2.117.3.js", "/icons/light-192.png", "/icons/dark-192.png", "/icons/light-180.png", "/icons/dark-180.png", "/icons/light-64.png", "/icons/dark-64.png"];

self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return; // rede direta
  // rede primeiro (pega a versão nova logo após publicar); sem rede, usa o cache
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request).then(m => m || caches.match("/index.html"))));
});
