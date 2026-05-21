// Wire top navigation button events.
export function setupPages(appElements, onShowPage) {
  appElements.showMainPageBtn.addEventListener("click", function () {
    onShowPage("main");
  });

  appElements.showFavoritesPageBtn.addEventListener("click", function () {
    onShowPage("favorites");
  });

  appElements.showAccountPageBtn.addEventListener("click", function () {
    onShowPage("account");
  });
}


// Toggle visible page and active nav state.
export function showPage(pageName, appElements, activeLeafletMap) {
  appElements.mainPage.classList.remove("is-visible");
  appElements.favoritesPage.classList.remove("is-visible");
  appElements.accountPage.classList.remove("is-visible");

  appElements.showMainPageBtn.classList.remove("is-active");
  appElements.showFavoritesPageBtn.classList.remove("is-active");
  appElements.showAccountPageBtn.classList.remove("is-active");

  if (pageName === "favorites") {
    appElements.favoritesPage.classList.add("is-visible");
    appElements.showFavoritesPageBtn.classList.add("is-active");
    return;
  }

  if (pageName === "account") {
    appElements.accountPage.classList.add("is-visible");
    appElements.showAccountPageBtn.classList.add("is-active");
    return;
  }

  appElements.mainPage.classList.add("is-visible");
  appElements.showMainPageBtn.classList.add("is-active");

  if (activeLeafletMap) {
    setTimeout(function () {
      activeLeafletMap.invalidateSize();
    }, 60);
  }
}


export function setStatus(appElements, statusMessage, statusType) {
  const statusClassByType = {
    success: "status-success",
    error: "status-error",
    info: "status-info"
  };

  // NOTE: Clearing all known classes avoids stale visual states.
  appElements.statusText.classList.remove(
    "status-success",
    "status-error",
    "status-info"
  );

  appElements.statusText.classList.add(statusClassByType[statusType] || "status-info");
  appElements.statusText.textContent = statusMessage;
}


// Keep refresh disabled during async work.
export function setBusy(appElements, shouldShowBusyState) {
  document.body.classList.toggle("is-busy", shouldShowBusyState);
  appElements.refreshBtn.disabled = shouldShowBusyState;
}


export function formatDateTime(rawDateTimeString) {
  const parsedDate = new Date(rawDateTimeString);

  if (Number.isNaN(parsedDate.getTime())) {
    return "okand";
  }

  return parsedDate.toLocaleString("sv-SE", {
    hour12: false
  });
}


export function escapeHtml(unsafeValue) {
  return String(unsafeValue)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
