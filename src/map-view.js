import L from "leaflet";

import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";


// Leaflet's default icon points at fixed package paths that go 404 after the
// Vite build. Importing the PNGs lets Vite copy and rewrite their URLs.
const stationMarkerIcon = L.icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


// Initialize map and reusable layers.
export function setupMap(appState) {
  appState.map = L.map("map", {
    zoomControl: true
  }).setView([62.5, 16], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(appState.map);

  appState.markerLayer = L.layerGroup().addTo(appState.map);
  appState.userLayer = L.layerGroup().addTo(appState.map);
}


// GPS is optional; app still works without it.
export function placeUserLocation(appState, setStatusMessage) {
  if (!("geolocation" in navigator)) {
    setStatusMessage("GPS stods inte i den har enheten.", "info");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function (positionResult) {
      const userLatitude = positionResult.coords.latitude;
      const userLongitude = positionResult.coords.longitude;

      appState.userLayer.clearLayers();

      L.circleMarker([userLatitude, userLongitude], {
        radius: 8,
        weight: 2,
        color: "#0a4361",
        fillColor: "#2bb4c7",
        fillOpacity: 0.92
      })
        .bindPopup("Din position")
        .addTo(appState.userLayer);

      L.circle([userLatitude, userLongitude], {
        radius: Math.max(positionResult.coords.accuracy || 0, 30),
        stroke: false,
        fillColor: "#2bb4c7",
        fillOpacity: 0.12
      }).addTo(appState.userLayer);

      appState.map.setView([userLatitude, userLongitude], 7);
    },
    function () {
      setStatusMessage("Kunde inte lasa GPS-position. Kartan fungerar anda.", "info");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}


// Rebuild all markers from merged delay rows.
export function renderMapMarkers(appState, appElements, escapeHtml) {
  appState.markerLayer.clearLayers();

  appState.mergedRows.forEach(function (mergedRowItem) {
    const stationData = mergedRowItem.station;
    const stationMarker = L.marker(
      [
        stationData.coords.latitude,
        stationData.coords.longitude
      ],
      { icon: stationMarkerIcon }
    );

    const popupHtml = `
      <div class="popup-wrap">
        <strong>${escapeHtml(stationData.advertisedLocationName)}</strong><br />
        Forsening: <b>${mergedRowItem.row.delayMinutes} min</b><br />
        Tag: ${escapeHtml(mergedRowItem.row.advertisedTrainIdent || "okant")}
      </div>
    `;

    stationMarker.bindPopup(popupHtml);
    stationMarker.addTo(appState.markerLayer);
  });

  appElements.mapCountText.textContent = appState.mergedRows.length + " markorer";
}
