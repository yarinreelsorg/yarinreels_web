// Service worker mínimo — existir e ter um handler de "fetch" é exigido
// pelo Chrome (principalmente no desktop) pra considerar o site instalável
// e disparar o evento "beforeinstallprompt". Não faz cache de nada de
// propósito: o site já é dinâmico (catálogo, sessão, player) e cachear
// respostas aqui poderia servir conteúdo desatualizado ou stale de sessão.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // no-op: deixa o navegador seguir com a requisição normal de rede.
});
