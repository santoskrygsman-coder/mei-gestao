const CACHE_NAME = 'mei-gestao-cache-v7';
const ASSETS = [
    './',
    './index.html',
    './css/main.css',
    './css/components.css',
    './js/database.js',
    './js/app.js',
    './js/dashboard.js',
    './js/clientes.js',
    './js/estoque.js',
    './js/pdv.js',
    './js/documentos.js',
    './js/financeiro.js',
    './js/relatorios.js',
    './js/configuracoes.js',
    './manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
                fetch(e.request).then((networkResponse) => {
                    if (networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
                    }
                }).catch(() => {/* Silencia erros offline */});

                return cachedResponse;
            }

            return fetch(e.request);
        })
    );
});
