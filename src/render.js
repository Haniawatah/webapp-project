// Filter by station name, train id, or owner.
export function applyFilter(appState, rawSearchValue) {
  const normalizedNeedle = String(rawSearchValue || "").trim().toLowerCase();

  appState.filteredRows = appState.mergedRows.filter(function (mergedRowItem) {
    if (!normalizedNeedle) {
      return true;
    }

    const stationNameText = mergedRowItem.station.advertisedLocationName.toLowerCase();
    const trainIdentifierText = String(mergedRowItem.row.advertisedTrainIdent || "").toLowerCase();
    const trainOwnerText = String(mergedRowItem.row.trainOwner || "").toLowerCase();

    return (
      stationNameText.indexOf(normalizedNeedle) >= 0 ||
      trainIdentifierText.indexOf(normalizedNeedle) >= 0 ||
      trainOwnerText.indexOf(normalizedNeedle) >= 0
    );
  });
}


// Cap rendered rows to keep the list responsive.
export function renderDelayedList(appState, appElements, helperFunctions) {
  const {
    findFavoriteBySignature,
    escapeHtml,
    formatDateTime
  } = helperFunctions;

  appElements.listCountText.textContent = appState.filteredRows.length + " traffar";

  if (appState.filteredRows.length === 0) {
    appElements.delayedList.innerHTML =
      '<li class="list-item empty">Inga forseningar matchar sokningen.</li>';
    return;
  }

  appElements.delayedList.innerHTML = appState.filteredRows
    .slice(0, 200)
    .map(function (mergedRowItem) {
      const stationName = mergedRowItem.station.advertisedLocationName;
      const stationSignature = mergedRowItem.station.locationSignature;
      const displayedTrainId = mergedRowItem.row.advertisedTrainIdent || "okant";
      const isAlreadyFavorite = Boolean(findFavoriteBySignature(stationSignature));

      const favoriteButtonMarkup = appState.token
        ? '<button class="btn btn-light btn-small" data-action="' +
          (isAlreadyFavorite ? "remove-favorite" : "add-favorite") +
          '" data-signature="' +
          escapeHtml(stationSignature) +
          '" data-name="' +
          escapeHtml(stationName) +
          '">' +
          (isAlreadyFavorite ? "Ta bort favorit" : "Lagg till favorit") +
          "</button>"
        : "";

      return `
        <li class="list-item">
          <div class="line-top">
            <strong>${escapeHtml(stationName)}</strong>
            <span class="badge">+${mergedRowItem.row.delayMinutes} min</span>
          </div>
          <div class="line-mid">
            Tag ${escapeHtml(String(displayedTrainId))} (${escapeHtml(
        mergedRowItem.row.trainOwner || "okand"
      )})
          </div>
          <div class="line-mid">
            Planerad: ${escapeHtml(
              formatDateTime(mergedRowItem.row.advertisedTimeAtLocation)
            )}<br />
            Beraknad: ${escapeHtml(
              formatDateTime(mergedRowItem.row.estimatedTimeAtLocation)
            )}
          </div>
          <div class="line-bottom">
            ${favoriteButtonMarkup}
          </div>
        </li>
      `;
    })
    .join("");
}


// Reflect login state in the account view.
export function renderSessionBox(appState, appElements, escapeHtml) {
  if (!appState.token) {
    appElements.sessionBox.innerHTML = "<p>Inte inloggad.</p>";
    return;
  }

  appElements.sessionBox.innerHTML =
    "<p>Inloggad som <strong>" +
    escapeHtml(appState.email || "okand") +
    "</strong>.</p>";
}


// Show delay summary for each saved favorite station.
export function renderFavorites(appState, appElements, escapeHtml) {
  if (!appState.token) {
    appElements.favoritesMeta.innerHTML =
      "<span>Logga in i Konto-fliken for att spara favoritstationer.</span>";

    appElements.favoritesList.innerHTML =
      '<li class="list-item empty">Favoriter ar endast tillgangliga for inloggade anvandare.</li>';

    return;
  }

  appElements.favoritesMeta.innerHTML =
    "<span>Antal favoriter: " + appState.favorites.length + "</span>";

  if (appState.favorites.length === 0) {
    appElements.favoritesList.innerHTML =
      '<li class="list-item empty">Inga favoriter sparade an.</li>';

    return;
  }

  appElements.favoritesList.innerHTML = appState.favorites
    .map(function (favoriteStationItem) {
      const delayRowsForFavoriteStation = appState.mergedRows.filter(function (mergedRowItem) {
        return mergedRowItem.station.locationSignature === favoriteStationItem.locationSignature;
      });

      const stationDelayDetailsMarkup =
        delayRowsForFavoriteStation.length === 0
          ? "Inga rapporterade forseningar just nu."
          : delayRowsForFavoriteStation
              .slice(0, 5)
              .map(function (mergedRowItem) {
                return (
                  "Tag " +
                  escapeHtml(String(mergedRowItem.row.advertisedTrainIdent || "okant")) +
                  " (+" +
                  mergedRowItem.row.delayMinutes +
                  " min)"
                );
              })
              .join("<br />");

      return `
        <li class="list-item">
          <div class="line-top">
            <strong>${escapeHtml(favoriteStationItem.stationName)}</strong>
            <span class="badge">${delayRowsForFavoriteStation.length} forseningar</span>
          </div>
          <div class="line-mid">${stationDelayDetailsMarkup}</div>
          <div class="line-bottom">
            <button class="btn btn-light btn-small" data-action="remove-favorite" data-id="${favoriteStationItem.id}">Ta bort</button>
          </div>
        </li>
      `;
    })
    .join("");
}
