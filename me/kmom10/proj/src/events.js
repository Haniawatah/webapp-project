export function setupAppEvents(dependencies) {
  const {
    appState,
    appElements,
    api,
    favorites,
    traffic,
    ui,
    render
  } = dependencies;

  const {
    clearTrafficCache,
    loginUser,
    registerUser
  } = api;

  const {
    setAppBusy,
    setAppStatus
  } = ui;

  const {
    applyFilter,
    renderDelayedListSection
  } = render;

  appElements.refreshBtn.addEventListener("click", async function () {
    clearTrafficCache();
    await traffic.refreshTraffic(true);
  });

  appElements.searchInput.addEventListener("input", function () {
    applyFilter(appState, appElements.searchInput.value);
    renderDelayedListSection();
  });

  // I think one delegated listener keeps the list logic easier to maintain.
  appElements.delayedList.addEventListener("click", async function (clickEvent) {
    const clickedElement = clickEvent.target;

    if (!(clickedElement instanceof HTMLElement)) {
      return;
    }

    const requestedAction = clickedElement.getAttribute("data-action");

    if (!requestedAction) {
      return;
    }

    const stationSignature = clickedElement.getAttribute("data-signature") || "";
    const stationName = clickedElement.getAttribute("data-name") || stationSignature;

    if (!appState.token) {
      setAppStatus("Logga in for att spara favoriter.", "error");
      return;
    }

    if (requestedAction === "add-favorite") {
      await favorites.addFavorite(stationSignature, stationName);
    }

    if (requestedAction === "remove-favorite") {
      const existingFavorite = favorites.findFavoriteBySignature(stationSignature);

      if (existingFavorite) {
        await favorites.removeFavorite(existingFavorite.id);
      }
    }
  });

  appElements.favoritesList.addEventListener("click", async function (clickEvent) {
    const clickedElement = clickEvent.target;

    if (!(clickedElement instanceof HTMLElement)) {
      return;
    }

    const requestedAction = clickedElement.getAttribute("data-action");

    if (requestedAction !== "remove-favorite") {
      return;
    }

    const favoriteDataId = Number(clickedElement.getAttribute("data-id") || "0");

    if (favoriteDataId > 0) {
      await favorites.removeFavorite(favoriteDataId);
    }
  });

  appElements.registerForm.addEventListener("submit", async function (submitEvent) {
    submitEvent.preventDefault();

    const registrationFormData = new FormData(appElements.registerForm);
    const registrationEmail = String(registrationFormData.get("email") || "").trim();
    const registrationPassword = String(registrationFormData.get("password") || "").trim();

    if (!registrationEmail || !registrationPassword) {
      setAppStatus("Fyll i e-post och losenord.", "error");
      return;
    }

    try {
      setAppBusy(true);

      const registrationResult = await registerUser(registrationEmail, registrationPassword);
      const statusMessage =
        (registrationResult && registrationResult.data && registrationResult.data.message) ||
        "Konto skapat. Du kan nu logga in.";

      setAppStatus(statusMessage, "success");
      appElements.registerForm.reset();
    } catch (registrationError) {
      setAppStatus(registrationError.message || "Registrering misslyckades.", "error");
    } finally {
      setAppBusy(false);
    }
  });

  appElements.loginForm.addEventListener("submit", async function (submitEvent) {
    submitEvent.preventDefault();

    const loginFormData = new FormData(appElements.loginForm);
    const loginEmail = String(loginFormData.get("email") || "").trim();
    const loginPassword = String(loginFormData.get("password") || "").trim();

    if (!loginEmail || !loginPassword) {
      setAppStatus("Fyll i e-post och losenord.", "error");
      return;
    }

    try {
      setAppBusy(true);

      const loginResult = await loginUser(loginEmail, loginPassword);
      const authToken =
        loginResult && loginResult.data && loginResult.data.token
          ? loginResult.data.token
          : "";

      const resolvedUserEmail =
        loginResult && loginResult.data && loginResult.data.user
          ? loginResult.data.user.email
          : loginEmail;

      if (!authToken) {
        throw new Error("Ingen token mottogs.");
      }

      appState.token = authToken;
      appState.email = resolvedUserEmail;

      localStorage.setItem("auth_token", appState.token);
      localStorage.setItem("auth_email", appState.email);

      await favorites.loadFavorites();
      favorites.refreshAccountViews();

      setAppStatus("Inloggning lyckades.", "success");
    } catch (loginError) {
      setAppStatus(loginError.message || "Inloggning misslyckades.", "error");
    } finally {
      setAppBusy(false);
    }
  });

  appElements.logoutBtn.addEventListener("click", function () {
    favorites.logout();
    setAppStatus("Du ar utloggad.", "info");
  });
}
