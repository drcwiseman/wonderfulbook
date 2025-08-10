// Service Worker for Offline Reading
const CACHE_NAME = 'wonderful-books-v1';
const OFFLINE_CACHE = 'wonderful-books-offline-v1';
const BOOKS_CACHE = 'wonderful-books-books-v1';

// Essential files to cache for app shell
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell files');
        return cache.addAll(APP_SHELL_FILES);
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE && cacheName !== BOOKS_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle book PDF requests
  if (url.pathname.includes('/books/') && url.pathname.endsWith('.pdf')) {
    event.respondWith(handleBookRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request).catch(() => {
          // Return offline page for HTML requests
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Handle API requests - serve cached data when offline
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful GET requests
    if (request.method === 'GET' && response.ok) {
      const cache = await caches.open(OFFLINE_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for specific endpoints
    if (url.pathname === '/api/auth/user') {
      return new Response(JSON.stringify({ offline: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.pathname === '/api/books') {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Handle book PDF requests - serve from cache when offline
async function handleBookRequest(request) {
  try {
    // Check cache first for books
    const cachedBook = await caches.match(request);
    if (cachedBook) {
      return cachedBook;
    }
    
    // Try network
    const response = await fetch(request);
    
    // Cache the book for offline reading
    if (response.ok) {
      const cache = await caches.open(BOOKS_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return cached version if available
    const cachedBook = await caches.match(request);
    if (cachedBook) {
      return cachedBook;
    }
    
    throw error;
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Serve cached page or offline page
    const cachedPage = await caches.match(request);
    if (cachedPage) {
      return cachedPage;
    }
    
    return caches.match('/offline.html');
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'CACHE_BOOK':
        cacheBook(event.data.bookUrl, event.data.bookId);
        break;
      case 'REMOVE_CACHED_BOOK':
        removeCachedBook(event.data.bookUrl);
        break;
      case 'GET_CACHED_BOOKS':
        getCachedBooks().then((books) => {
          event.ports[0].postMessage({ books });
        });
        break;
    }
  }
});

// Cache a specific book
async function cacheBook(bookUrl, bookId) {
  try {
    const cache = await caches.open(BOOKS_CACHE);
    const response = await fetch(bookUrl);
    
    if (response.ok) {
      await cache.put(bookUrl, response);
      console.log(`Book ${bookId} cached for offline reading`);
      
      // Notify main thread
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'BOOK_CACHED',
            bookId,
            success: true
          });
        });
      });
    }
  } catch (error) {
    console.error('Failed to cache book:', error);
    
    // Notify main thread of failure
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'BOOK_CACHED',
          bookId,
          success: false,
          error: error.message
        });
      });
    });
  }
}

// Remove a cached book
async function removeCachedBook(bookUrl) {
  try {
    const cache = await caches.open(BOOKS_CACHE);
    await cache.delete(bookUrl);
    console.log('Book removed from cache');
  } catch (error) {
    console.error('Failed to remove cached book:', error);
  }
}

// Get list of cached books
async function getCachedBooks() {
  try {
    const cache = await caches.open(BOOKS_CACHE);
    const requests = await cache.keys();
    return requests.map(req => req.url);
  } catch (error) {
    console.error('Failed to get cached books:', error);
    return [];
  }
}