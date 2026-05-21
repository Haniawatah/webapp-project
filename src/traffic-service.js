export function createTrafficService(dependencies) {
  const {
    appState,
    appElements,
    api,
    ui,
    render,
    helpers
  } = dependencies;

  const {
    getDelayedTrains,
    getStations
  } = api;

  const {
    setAppBusy,
    setAppStatus
  } = ui;

  const {
    applyFilter,
    renderDelayedListSection,
    renderFavorites,
    renderMapMarkers
  } = render;

  const {
    escapeHtml
  } = helpers;

  function setupServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function () {
        // this one here keeps app working even if registration fails... fingers crossed.
      });
    });
  }

  // In my opinion, keeping traffic refresh here keeps main easy to scan.
  async function refreshTraffic(forceNetwork) {
    try {
      setAppBusy(true);

      const trafficResponses = await Promise.all([
        getStations(forceNetwork),
        getDelayedTrains(forceNetwork)
      ]);

      appState.stations = trafficResponses[0];
      appState.delayedRows = trafficResponses[1];
      appState.stationBySignature = new Map();

      appState.stations.forEach(function (stationData) {
        appState.stationBySignature.set(stationData.locationSignature, stationData);
      });

      appState.mergedRows = appState.delayedRows
        .map(function (delayedRow) {
          const linkedStation = appState.stationBySignature.get(delayedRow.locationSignature);

          if (!linkedStation) {
            return null;
          }

          return {
            row: delayedRow,
            station: linkedStation
          };
        })
        .filter(Boolean)
        .sort(function (leftItem, rightItem) {
          return rightItem.row.delayMinutes - leftItem.row.delayMinutes;
        });

      applyFilter(appState, appElements.searchInput.value);

      renderDelayedListSection();
      renderMapMarkers(appState, appElements, escapeHtml);
      renderFavorites(appState, appElements, escapeHtml);

      setAppStatus(
        "Data uppdaterad. " + appState.mergedRows.length + " forsenade tag hittades.",
        "success"
      );
    } catch (refreshError) {
      setAppStatus(refreshError.message || "Kunde inte hamta data.", "error");
    } finally {
      setAppBusy(false);
    }
  }

  return {
    refreshTraffic,
    setupServiceWorker
  };
}
