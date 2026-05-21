import {
  API_KEY,
  AUTH_BASE_URL,
  DELAYED_CACHE_TTL_MS,
  STATIONS_CACHE_TTL_MS,
  TRAFIK_BASE_URL
} from "./config";
import { clearCacheItem, getCacheItem, setCacheItem } from "./cache";


const STATIONS_CACHE_KEY = "traffic_stations_v1";
const DELAYED_CACHE_KEY = "traffic_delayed_v1";


// Attach apikey to outgoing endpoint URLs
function addApiKey(baseUrl) {
  const urlWithQueryParams = new URL(baseUrl);

  if (API_KEY) {
    urlWithQueryParams.searchParams.set("api_key", API_KEY);
  }

  return urlWithQueryParams.toString();
}


// Parse JSON/text responses and normalize thrown errors.
async function requestJson(requestUrl, requestOptions) {
  const httpResponse = await fetch(requestUrl, requestOptions || {});

  if (httpResponse.status === 204) {
    return null;
  }

  const responseContentType = httpResponse.headers.get("content-type") || "";
  let responsePayload = null;

  if (responseContentType.indexOf("application/json") >= 0) {
    responsePayload = await httpResponse.json();
  } else {
    responsePayload = { raw: await httpResponse.text() };
  }

  if (!httpResponse.ok) {
    const resolvedErrorMessage =
      (responsePayload && responsePayload.errors && responsePayload.errors.detail) ||
      (responsePayload && responsePayload.data && responsePayload.data.message) ||
      (responsePayload && responsePayload.raw) ||
      "Request failed.";

    throw new Error(resolvedErrorMessage);
  }

  return responsePayload;
}


export function parseWgs84Point(rawPointText) {
  if (!rawPointText || typeof rawPointText !== "string") {
    return null;
  }

  const regexMatch = rawPointText.match(/^POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)$/i);

  if (!regexMatch) {
    return null;
  }

  const parsedLongitude = Number(regexMatch[1]);
  const parsedLatitude = Number(regexMatch[2]);

  if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
    return null;
  }

  return {
    latitude: parsedLatitude,
    longitude: parsedLongitude
  };
}


export function calculateDelayMinutes(advertisedTime, estimatedTime) {
  const advertisedTimeMs = new Date(advertisedTime).getTime();
  const estimatedTimeMs = new Date(estimatedTime).getTime();

  if (!advertisedTimeMs || !estimatedTimeMs) {
    return 0;
  }

  return Math.max(0, Math.round((estimatedTimeMs - advertisedTimeMs) / 60000));
}


// Prefer cached stations unless force refresh is requested.
export async function getStations(shouldForceNetwork) {
  if (!shouldForceNetwork) {
    const cachedStationRows = getCacheItem(STATIONS_CACHE_KEY, STATIONS_CACHE_TTL_MS);

    if (cachedStationRows) {
      return cachedStationRows;
    }
  }

  const stationResult = await requestJson(addApiKey(TRAFIK_BASE_URL + "/stations"));

  const normalizedStationRows = (stationResult.data || [])
    .map(function (rawStationRow) {
      const parsedCoordinates = parseWgs84Point(
        rawStationRow.Geometry ? rawStationRow.Geometry.WGS84 : ""
      );

      if (!parsedCoordinates) {
        return null;
      }

      return {
        locationSignature: rawStationRow.LocationSignature,
        advertisedLocationName: rawStationRow.AdvertisedLocationName,
        platformLine: rawStationRow.PlatformLine || [],
        coords: parsedCoordinates
      };
    })
    .filter(Boolean);

  setCacheItem(STATIONS_CACHE_KEY, normalizedStationRows);

  return normalizedStationRows;
}


// Keep only active delayed rows with positive delay.
export async function getDelayedTrains(shouldForceNetwork) {
  if (!shouldForceNetwork) {
    const cachedDelayedRows = getCacheItem(DELAYED_CACHE_KEY, DELAYED_CACHE_TTL_MS);

    if (cachedDelayedRows) {
      return cachedDelayedRows;
    }
  }

  const delayedResult = await requestJson(addApiKey(TRAFIK_BASE_URL + "/delayed"));

  const normalizedDelayedRows = (delayedResult.data || [])
    .filter(function (rawDelayedRow) {
      return !rawDelayedRow.Canceled;
    })
    .map(function (rawDelayedRow) {
      const computedDelayMinutes = calculateDelayMinutes(
        rawDelayedRow.AdvertisedTimeAtLocation,
        rawDelayedRow.EstimatedTimeAtLocation
      );

      return {
        activityId: rawDelayedRow.ActivityId,
        activityType: rawDelayedRow.ActivityType,
        advertisedTimeAtLocation: rawDelayedRow.AdvertisedTimeAtLocation,
        estimatedTimeAtLocation: rawDelayedRow.EstimatedTimeAtLocation,
        advertisedTrainIdent: rawDelayedRow.AdvertisedTrainIdent,
        operationalTrainNumber: rawDelayedRow.OperationalTrainNumber,
        canceled: rawDelayedRow.Canceled,
        fromLocation: rawDelayedRow.FromLocation || [],
        toLocation: rawDelayedRow.ToLocation || [],
        locationSignature: rawDelayedRow.LocationSignature,
        timeAtLocation: rawDelayedRow.TimeAtLocation,
        trainOwner: rawDelayedRow.TrainOwner,
        delayMinutes: computedDelayMinutes
      };
    })
    .filter(function (normalizedRow) {
      return normalizedRow.delayMinutes > 0;
    });

  setCacheItem(DELAYED_CACHE_KEY, normalizedDelayedRows);

  return normalizedDelayedRows;
}


// shared headers for auth requests
function authHeaders(authToken) {
  const requestHeaders = {
    "content-type": "application/json"
  };

  if (authToken) {
    requestHeaders["x-access-token"] = authToken;
  }

  return requestHeaders;
}


export async function registerUser(userEmail, userPassword) {
  return requestJson(AUTH_BASE_URL + "/register", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email: userEmail,
      password: userPassword,
      api_key: API_KEY
    })
  });
}


export async function loginUser(userEmail, userPassword) {
  return requestJson(AUTH_BASE_URL + "/login", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email: userEmail,
      password: userPassword,
      api_key: API_KEY
    })
  });
}


export async function getUserData(authToken) {
  return requestJson(addApiKey(AUTH_BASE_URL + "/data"), {
    method: "GET",
    headers: {
      "x-access-token": authToken
    }
  });
}


export async function createUserData(authToken, artefactObject) {
  return requestJson(AUTH_BASE_URL + "/data", {
    method: "POST",
    headers: authHeaders(authToken),
    body: JSON.stringify({
      api_key: API_KEY,
      artefact: JSON.stringify(artefactObject)
    })
  });
}


export async function updateUserData(authToken, dataId, artefactObject) {
  return requestJson(AUTH_BASE_URL + "/data", {
    method: "PUT",
    headers: authHeaders(authToken),
    body: JSON.stringify({
      id: dataId,
      api_key: API_KEY,
      artefact: JSON.stringify(artefactObject)
    })
  });
}


export async function deleteUserData(authToken, dataId) {
  try {
    return await requestJson(AUTH_BASE_URL + "/data", {
      method: "DELETE",
      headers: authHeaders(authToken),
      body: JSON.stringify({
        id: dataId,
        api_key: API_KEY
      })
    });
  } catch (deleteError) {
    // Why: Older auth service versions only accept id as query param on delete.
    const fallbackDeleteUrl = addApiKey(AUTH_BASE_URL + "/data") + "&id=" + dataId;
    const fallbackDeleteResponse = await fetch(fallbackDeleteUrl, {
      method: "DELETE",
      headers: {
        "x-access-token": authToken
      }
    });

    if (!fallbackDeleteResponse.ok) {
      throw deleteError;
    }

    return null;
  }
}


export function clearTrafficCache() {
  // add selective cache invalidation when ui adds per view refresh
  clearCacheItem(STATIONS_CACHE_KEY);
  clearCacheItem(DELAYED_CACHE_KEY);
}
