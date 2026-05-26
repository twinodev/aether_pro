const CACHE_NAME = 'duka-sync-cache-v3';
const RUNTIME_CACHE = 'duka-sync-runtime-v3';

// Core assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
];

// Helper to open IndexedDB for offline queue
function getIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaSyncOfflineDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-requests')) {
        db.createObjectStore('offline-requests', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Queue failed inventory update request to IndexedDB
async function queueFailedRequest(request) {
  try {
    const db = await getIndexedDB();
    const clonedRequest = request.clone();
    const bodyText = await clonedRequest.text();
    
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Array.from(request.headers.entries()).reduce((acc, [k, v]) => {
        acc[k] = v;
        return acc;
      }, {}),
      body: bodyText,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offline-requests'], 'readwrite');
      const store = transaction.objectStore('offline-requests');
      const addRequest = store.add(requestData);
      
      addRequest.onsuccess = () => {
        console.log('[Service Worker] Request queued for offline sync:', request.url);
        // Register standard PWA Background Sync tag
        if ('sync' in self.registration) {
          self.registration.sync.register('sync-inventory-queue')
            .then(() => console.log('[Service Worker] Background Sync registered'))
            .catch(err => console.error('[Service Worker] Sync registration failed:', err));
        }
        resolve();
      };
      
      addRequest.onerror = () => reject(addRequest.error);
    });
  } catch (err) {
    console.error('[Service Worker] Failed to queue request:', err);
  }
}

// Replay queued requests when connection is restored
async function replayOfflineQueue() {
  try {
    const db = await getIndexedDB();
    const requests = await new Promise((resolve, reject) => {
      const transaction = db.transaction(['offline-requests'], 'readonly');
      const store = transaction.objectStore('offline-requests');
      const getRequest = store.getAll();
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    if (requests.length === 0) return;
    
    console.log(`[Service Worker] Replaying ${requests.length} queued offline requests...`);
    
    for (const req of requests) {
      try {
        const fetchOptions = {
          method: req.method,
          headers: req.headers,
          body: req.body || undefined
        };
        
        const response = await fetch(req.url, fetchOptions);
        if (response.ok) {
          // Remove successfully sent request from queue
          await new Promise((resolve, reject) => {
            const transaction = db.transaction(['offline-requests'], 'readwrite');
            const store = transaction.objectStore('offline-requests');
            const deleteRequest = store.delete(req.id);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
          console.log('[Service Worker] Queued request retried & sent successfully:', req.url);
        }
      } catch (err) {
        console.error('[Service Worker] Replaying request failed, will retry later:', req.url, err);
        break; // Stop and retry later if network still fails
      }
    }
  } catch (err) {
    console.error('[Service Worker] Error playing offline queue:', err);
  }
}

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching app shell assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event with Cache-First & Stale-While-Revalidate strategies
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Skip non-GET requests for standard caching, handle data submission offline-sync
  if (event.request.method !== 'GET') {
    // If we are offline and modifying inventory/sales/POS endpoints
    if (requestUrl.pathname.includes('/api/')) {
      event.respondWith(
        fetch(event.request).catch(async (error) => {
          console.warn('[Service Worker] Network write failed, caching request for Background Sync:', error);
          await queueFailedRequest(event.request);
          return new Response(JSON.stringify({ 
            offline: true, 
            status: 'queued', 
            message: 'Duka Sync operates offline. Your changes are queued and will sync when online!' 
          }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );
    }
    return;
  }

  // Define strategies for GET requests
  const isStaticAsset = (
    PRECACHE_ASSETS.includes(requestUrl.pathname) ||
    requestUrl.pathname.endsWith('.js') ||
    requestUrl.pathname.endsWith('.css') ||
    requestUrl.pathname.endsWith('.svg') ||
    requestUrl.pathname.endsWith('.png') ||
    requestUrl.pathname.endsWith('.woff2') ||
    requestUrl.pathname.includes('/assets/')
  );

  if (isStaticAsset) {
    // 1. Cache-First with Stale-While-Revalidate
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => null); // Silent fallback if network failed in background

        return cachedResponse || fetchPromise || Response.error();
      })
    );
  } else {
    // 2. Network-First falling back to Cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Fallback for document request (SPA navigation routing)
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/index.html');
            }
            return Response.error();
          });
        })
    );
  }
});

// Background Sync Listener
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Sync Event Fired, tag:', event.tag);
  if (event.tag === 'sync-inventory-queue' || event.tag === 'duka-sync-queue') {
    event.waitUntil(replayOfflineQueue());
  }
});
