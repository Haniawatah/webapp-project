// Return payload only when tha cache entry is fresh.
export function getCacheItem(cacheKey, cacheTimeToLiveMs) {
  try {
    const storedRawValue = localStorage.getItem(cacheKey);

    if (!storedRawValue) {
      return null;
    }

    const parsedCacheRecord = JSON.parse(storedRawValue);

    if (!parsedCacheRecord || !parsedCacheRecord.savedAt || !parsedCacheRecord.payload) {
      return null;
    }

    const isCacheEntryExpired = Date.now() - parsedCacheRecord.savedAt > cacheTimeToLiveMs;

    if (isCacheEntryExpired) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return parsedCacheRecord.payload;
  } catch (cacheReadError) {
    localStorage.removeItem(cacheKey);
    return null;
  }
}


// Save payload with timestamp for TtL checks.
export function setCacheItem(cacheKey, payloadToStore) {
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        savedAt: Date.now(),
        payload: payloadToStore
      })
    );
  } catch (cacheWriteError) {
    // quota issues should not breaks user flows in here
  }
}


export function clearCacheItem(cacheKey) {
  localStorage.removeItem(cacheKey);
}
