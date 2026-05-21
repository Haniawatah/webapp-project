import "leaflet/dist/leaflet.css";
import "./style.css";
import {
  clearTrafficCache,
  createUserData,
  deleteUserData,
  getDelayedTrains,
  getStations,
  getUserData,
  loginUser,
  registerUser
} from "./api";
import { createAppState, getAppElements, renderAppShell } from "./app-shell";
import { setupAppEvents } from "./events";
import { createFavoriteService } from "./favorite-service";
import { placeUserLocation, renderMapMarkers, setupMap } from "./map-view";
import {
  applyFilter,
  renderDelayedList,
  renderFavorites,
  renderSessionBox
} from "./render";
import { createTrafficService } from "./traffic-service";
import {
  escapeHtml,
  formatDateTime,
  setBusy,
  setStatus,
  setupPages,
  showPage
} from "./ui";

// I think rendering the shell first keeps DOM wiring clear.
const appRootElement = document.querySelector("#app");
renderAppShell(appRootElement);

const appState = createAppState();
const appElements = getAppElements();
let favoriteService = null;

function setAppStatus(statusMessage, statusType) {
  setStatus(appElements, statusMessage, statusType);
}

function setAppBusy(shouldShowBusyState) {
  setBusy(appElements, shouldShowBusyState);
}

// In my opinion this tiny wrapper keeps helper wiring in one place.
function renderDelayedListSection() {
  renderDelayedList(appState, appElements, {
    findFavoriteBySignature: favoriteService
      ? favoriteService.findFavoriteBySignature
      : function () {
          return null;
        },
    escapeHtml,
    formatDateTime
  });
}

favoriteService = createFavoriteService({
  appState,
  appElements,
  api: {
    createUserData,
    deleteUserData,
    getUserData
  },
  ui: {
    setAppBusy,
    setAppStatus
  },
  render: {
    renderDelayedListSection,
    renderFavorites,
    renderSessionBox
  },
  helpers: {
    escapeHtml
  }
});

const trafficService = createTrafficService({
  appState,
  appElements,
  api: {
    getDelayedTrains,
    getStations
  },
  ui: {
    setAppBusy,
    setAppStatus
  },
  render: {
    applyFilter,
    renderDelayedListSection,
    renderFavorites,
    renderMapMarkers
  },
  helpers: {
    escapeHtml
  }
});

init();

async function init() {
  setupPages(appElements, function (requestedPageName) {
    showPage(requestedPageName, appElements, appState.map);
  });

  setupMap(appState);

  setupAppEvents({
    appState,
    appElements,
    api: {
      clearTrafficCache,
      loginUser,
      registerUser
    },
    favorites: favoriteService,
    traffic: trafficService,
    ui: {
      setAppBusy,
      setAppStatus
    },
    render: {
      applyFilter,
      renderDelayedListSection
    }
  });

  trafficService.setupServiceWorker();
  placeUserLocation(appState, setAppStatus);

  await trafficService.refreshTraffic(false);

  if (appState.token) {
    await favoriteService.loadFavorites();
  }

  favoriteService.refreshAccountViews();
}
