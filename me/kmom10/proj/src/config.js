export const TRAFIK_BASE_URL = "https://trafik.emilfolino.se";
export const AUTH_BASE_URL = "https://auth.emilfolino.se";

// icould leave the api visible for the sake of rate but yeah, lets keep it clean. 
export const API_KEY =
  import.meta.env.VITE_API_KEY; 


// nothing secret her so im just gonna leave it.
export const STATIONS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const DELAYED_CACHE_TTL_MS = 2 * 60 * 1000;
