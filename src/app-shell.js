export function renderAppShell(appRootElement) {
  // Keeping markup in one template string makes feature tabs easy to read in one place.
  appRootElement.innerHTML = `
  <div class="app-shell">
    <header class="app-header">
      <div>
        <h1>Sverige Tagforseningar</h1>
        <p>En enkel och tydlig oversikt av forsenade tag.</p>
      </div>
      <button id="refreshBtn" class="btn btn-light" type="button">Uppdatera data</button>
    </header>

    <p id="statusText" class="status status-info">Laddar data...</p>

    <nav class="page-nav">
      <button id="showMainPageBtn" class="page-btn is-active" type="button">Startsida</button>
      <button id="showFavoritesPageBtn" class="page-btn" type="button">Favoriter</button>
      <button id="showAccountPageBtn" class="page-btn" type="button">Konto</button>
    </nav>

    <div id="mainPage" class="page is-visible">
      <section class="simple-section">
        <div class="map-card">
          <div id="map"></div>
        </div>

        <div class="hint-row">
          <span id="mapCountText">0 markorer</span>
          <span>GPS visar din position om tillatet.</span>
        </div>
      </section>

      <section class="simple-section">
        <div class="panel-row">
          <input id="searchInput" class="input" type="search" placeholder="Sok station eller tagnummer" />
          <span id="listCountText">0 traffar</span>
        </div>

        <ul id="delayedList" class="list"></ul>
      </section>
    </div>

    <div id="favoritesPage" class="page">
      <section class="simple-section">
        <div id="favoritesMeta" class="panel-row">
          <span>Logga in for att hantera favoriter.</span>
        </div>

        <ul id="favoritesList" class="list"></ul>
      </section>
    </div>

    <div id="accountPage" class="page">
      <section class="simple-section account-note">
        <p>Logga in i Konto-fliken for att spara favoritstationer.</p>
        <p>Favoriter ar endast tillgangliga for inloggade anvandare.</p>
        <p>Inte inloggad.</p>
      </section>

      <section class="simple-section">
        <div id="sessionBox" class="session-box">
          <p>Inte inloggad.</p>
        </div>

        <div class="auth-grid">
          <form id="registerForm" class="card-form">
            <h2>Skapa konto</h2>
            <label for="registerEmail">E-post</label>
            <input id="registerEmail" name="email" type="email" required />

            <label for="registerPassword">Losenord</label>
            <input id="registerPassword" name="password" type="password" minlength="6" required />

            <button class="btn" type="submit">Registrera</button>
          </form>

          <form id="loginForm" class="card-form">
            <h2>Logga in</h2>
            <label for="loginEmail">E-post</label>
            <input id="loginEmail" name="email" type="email" required />

            <label for="loginPassword">Losenord</label>
            <input id="loginPassword" name="password" type="password" required />

            <button class="btn" type="submit">Logga in</button>
            <button id="logoutBtn" class="btn btn-light" type="button">Logga ut</button>
          </form>
        </div>
      </section>
    </div>
  </div>
`;
}


export function createAppState() {
  // Shared state object passed between modules.
  return {
    stations: [],
    delayedRows: [],
    mergedRows: [],
    filteredRows: [],
    stationBySignature: new Map(),
    favorites: [],
    map: null,
    markerLayer: null,
    userLayer: null,
    token: localStorage.getItem("auth_token") || "",
    email: localStorage.getItem("auth_email") || ""
  };
}


export function getAppElements() {
  // Cache selectors once after shell render.
  return {
    statusText: document.querySelector("#statusText"),
    showMainPageBtn: document.querySelector("#showMainPageBtn"),
    showFavoritesPageBtn: document.querySelector("#showFavoritesPageBtn"),
    showAccountPageBtn: document.querySelector("#showAccountPageBtn"),
    mainPage: document.querySelector("#mainPage"),
    favoritesPage: document.querySelector("#favoritesPage"),
    accountPage: document.querySelector("#accountPage"),
    mapCountText: document.querySelector("#mapCountText"),
    listCountText: document.querySelector("#listCountText"),
    delayedList: document.querySelector("#delayedList"),
    favoritesList: document.querySelector("#favoritesList"),
    favoritesMeta: document.querySelector("#favoritesMeta"),
    sessionBox: document.querySelector("#sessionBox"),
    searchInput: document.querySelector("#searchInput"),
    refreshBtn: document.querySelector("#refreshBtn"),
    registerForm: document.querySelector("#registerForm"),
    loginForm: document.querySelector("#loginForm"),
    logoutBtn: document.querySelector("#logoutBtn")
  };
}
