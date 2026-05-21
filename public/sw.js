const STATIC_ASSET_CACHE_KEY = "train-delay-static-v1";
const TRAFFIC_RESPONSE_CACHE_KEY = "train-delay-traffic-v1";


const CORE_ASSET_PATHS = ["./", "./manifest.webmanifest", "./logo.svg"];


self.addEventListener("install", function (installEvent) {
  installEvent.waitUntil(
    caches
      .open(STATIC_ASSET_CACHE_KEY)
      .then(function (staticCache) {
        return staticCache.addAll(CORE_ASSET_PATHS);
      })
      .catch(function () {
        return null;
      })
  );

  self.skipWaiting();
});


self.addEventListener("activate", function (activateEvent) {
  activateEvent.waitUntil(
    caches.keys().then(function (availableCacheKeys) {
      return Promise.all(
        availableCacheKeys.map(function (cacheKey) {
          if (cacheKey !== STATIC_ASSET_CACHE_KEY && cacheKey !== TRAFFIC_RESPONSE_CACHE_KEY) {
            return caches.delete(cacheKey);
          }

          return null;
        })
      );
    })
  );

  self.clients.claim();
});


// Static assets use stale while revalidate, traffic uses network first.
self.addEventListener("fetch", function (fetchEvent) {
  if (fetchEvent.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(fetchEvent.request.url);

  if (requestUrl.origin === self.location.origin) {
    fetchEvent.respondWith(staleWhileRevalidate(fetchEvent.request, STATIC_ASSET_CACHE_KEY));
    return;
  }

  const isTrafficApiRequest =
    requestUrl.origin === "https://trafik.emilfolino.se" &&
    (requestUrl.pathname === "/stations" || requestUrl.pathname === "/delayed");

  if (isTrafficApiRequest) {
    fetchEvent.respondWith(networkFirst(fetchEvent.request, TRAFFIC_RESPONSE_CACHE_KEY));
  }
});


// Prefer network data first, then fallback to cache.
async function networkFirst(requestObject, cacheKey) {
  const targetCache = await caches.open(cacheKey);

  try {
    const freshNetworkResponse = await fetch(requestObject);

    targetCache.put(requestObject, freshNetworkResponse.clone());
    return freshNetworkResponse;
  } catch (networkError) {
    const cachedFallbackResponse = await targetCache.match(requestObject);

    if (cachedFallbackResponse) {
      return cachedFallbackResponse;
    }

    throw networkError;
  }
}


// eturn cached response quickly and refresh in background.
async function staleWhileRevalidate(requestObject, cacheKey) {
  const targetCache = await caches.open(cacheKey);
  const cachedResponse = await targetCache.match(requestObject);

  const backgroundNetworkPromise = fetch(requestObject)
    .then(function (networkResponse) {
      if (networkResponse && networkResponse.ok) {
        targetCache.put(requestObject, networkResponse.clone());
      }

      return networkResponse;
    })
    .catch(function () {
      return null;
    });

  if (cachedResponse) {
    return cachedResponse;
  }

  const latestNetworkResponse = await backgroundNetworkPromise;

  if (latestNetworkResponse) {
    return latestNetworkResponse;
  }

  // explicit offline response gives deterministic UX during spotty connections.
  return new Response("Offline", {
    status: 503,
    statusText: "Offline"
  });
}
