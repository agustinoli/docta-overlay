// sw.js - Service Worker para soporte offline

const CACHE_NAME = 'doctamap-v1';

// Listado de archivos locales críticos que se guardarán en el teléfono
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './js/config.js',
  './js/key.js',
  './js/map.js',
  './js/main.js',
  './js/docta.geojson'
];

// 1. Evento de Instalación: Guarda los archivos en el caché físico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PWA: Cacheando archivos estáticos y GeoJSON...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Fuerza al Service Worker actual a tomar el control inmediatamente
  self.skipWaiting();
});

// 2. Evento de Activación: Limpia cachés viejos si se actualiza la app
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('PWA: Limpiando caché antiguo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Estrategia de Estrategia: Cache First / Network Fallback
// Primero busca en el almacenamiento local. Si no está (ej. mapas de Google externos), va a internet.
self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones locales de nuestra app o el GeoJSON
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Retorna el archivo local al instante
      }
      return fetch(event.request); // Va a buscarlo a la red si no estaba cacheado
    })
  );
});