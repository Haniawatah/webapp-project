export function createFavoriteService(dependencies) {
  const {
    appState,
    appElements,
    api,
    ui,
    render,
    helpers
  } = dependencies;

  const {
    createUserData,
    deleteUserData,
    getUserData
  } = api;

  const {
    setAppBusy,
    setAppStatus
  } = ui;

  const {
    renderDelayedListSection,
    renderFavorites,
    renderSessionBox
  } = render;

  const {
    escapeHtml
  } = helpers;

  // I think this tiny loop is clear enough for favorite lookups.
  function findFavoriteBySignature(stationSignature) {
    for (let favoriteIndex = 0; favoriteIndex < appState.favorites.length; favoriteIndex += 1) {
      const favoriteItem = appState.favorites[favoriteIndex];

      if (favoriteItem.locationSignature === stationSignature) {
        return favoriteItem;
      }
    }

    return null;
  }

  function refreshAccountViews() {
    renderSessionBox(appState, appElements, escapeHtml);
    renderFavorites(appState, appElements, escapeHtml);
    renderDelayedListSection();
  }

  async function loadFavorites() {
    if (!appState.token) {
      appState.favorites = [];
      return;
    }

    try {
      const userDataResult = await getUserData(appState.token);
      const userDataRows = (userDataResult && userDataResult.data) || [];

      appState.favorites = userDataRows
        .map(function (dataRow) {
          try {
            const parsedArtefact = JSON.parse(dataRow.artefact || "{}");

            if (
              parsedArtefact.type !== "favorite-station" ||
              !parsedArtefact.locationSignature
            ) {
              return null;
            }

            return {
              id: dataRow.id,
              locationSignature: parsedArtefact.locationSignature,
              stationName: parsedArtefact.stationName || parsedArtefact.locationSignature
            };
          } catch (parsingError) {
            return null;
          }
        })
        .filter(Boolean);
    } catch (loadError) {
      if (loadError.message && loadError.message.toLowerCase().indexOf("token") >= 0) {
        logout();
        setAppStatus("Sessionen gick ut. Logga in igen.", "error");
        return;
      }

      setAppStatus(
        loadError.message || "Kunde inte lasa favoriter for den inloggade anvandaren.",
        "error"
      );
    }
  }

  async function addFavorite(stationSignature, stationName) {
    if (findFavoriteBySignature(stationSignature)) {
      setAppStatus("Stationen ar redan favorit.", "info");
      return;
    }

    try {
      setAppBusy(true);

      await createUserData(appState.token, {
        type: "favorite-station",
        locationSignature: stationSignature,
        stationName: stationName
      });

      await loadFavorites();
      refreshAccountViews();

      setAppStatus("Favorit sparad.", "success");
    } catch (addError) {
      setAppStatus(addError.message || "Kunde inte spara favorit.", "error");
    } finally {
      setAppBusy(false);
    }
  }

  async function removeFavorite(favoriteDataId) {
    try {
      setAppBusy(true);

      await deleteUserData(appState.token, favoriteDataId);
      await loadFavorites();
      refreshAccountViews();

      setAppStatus("Favorit borttagen.", "success");
    } catch (removeError) {
      setAppStatus(removeError.message || "Kunde inte ta bort favorit.", "error");
    } finally {
      setAppBusy(false);
    }
  }

  // In my opinion, logout should also refresh every account-related view.
  function logout() {
    appState.token = "";
    appState.email = "";
    appState.favorites = [];

    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_email");

    refreshAccountViews();
  }

  return {
    addFavorite,
    findFavoriteBySignature,
    loadFavorites,
    logout,
    refreshAccountViews,
    removeFavorite
  };
}
