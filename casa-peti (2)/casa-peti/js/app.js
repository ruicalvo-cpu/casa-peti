// ============================================
// Casa Peti — app.js
// Navegação simples (SPA por hash) + widget do tempo (Open-Meteo, sem chave)
// ============================================

const LOCATIONS = {
  casa: { label: "Casa (Venade)", lat: 41.857, lon: -8.816 },
  praia: { label: "Praia de Moledo", lat: 41.8495, lon: -8.8665 },
};

// Mapeamento resumido dos códigos WMO usados pelo Open-Meteo
const WEATHER_CODES = {
  0: ["Céu limpo", "☀️"],
  1: ["Pouco nublado", "🌤️"],
  2: ["Parcialmente nublado", "⛅"],
  3: ["Nublado", "☁️"],
  45: ["Nevoeiro", "🌫️"],
  48: ["Nevoeiro gelado", "🌫️"],
  51: ["Chuvisco fraco", "🌦️"],
  53: ["Chuvisco", "🌦️"],
  55: ["Chuvisco forte", "🌧️"],
  61: ["Chuva fraca", "🌦️"],
  63: ["Chuva", "🌧️"],
  65: ["Chuva forte", "🌧️"],
  71: ["Neve fraca", "🌨️"],
  73: ["Neve", "🌨️"],
  75: ["Neve forte", "🌨️"],
  80: ["Aguaceiros fracos", "🌦️"],
  81: ["Aguaceiros", "🌧️"],
  82: ["Aguaceiros fortes", "⛈️"],
  95: ["Trovoada", "⛈️"],
  96: ["Trovoada c/ granizo", "⛈️"],
  99: ["Trovoada c/ granizo forte", "⛈️"],
};

function describeWeather(code) {
  return WEATHER_CODES[code] || ["—", "❓"];
}

// ---------- Data no cabeçalho ----------

function renderHeaderDate() {
  const el = document.getElementById("header-date");
  const now = new Date();
  const formatted = now.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  el.textContent = formatted;
}

// ---------- Navegação (SPA) ----------

const ROUTES = ["home", "compras", "menus", "vinhos", "agenda", "info"];

function renderRoute() {
  let route = (location.hash || "#home").replace("#", "");
  if (!ROUTES.includes(route)) route = "home";

  document.querySelectorAll(".view").forEach((v) => v.classList.remove("is-active"));
  document.getElementById(`view-${route}`).classList.add("is-active");

  document.querySelectorAll(".tab-bar__item").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.route === route);
  });

  window.scrollTo(0, 0);
}

function initNav() {
  document.querySelectorAll(".tab-bar__item").forEach((btn) => {
    btn.addEventListener("click", () => {
      location.hash = btn.dataset.route;
    });
  });
  window.addEventListener("hashchange", renderRoute);
  renderRoute();
}

// ---------- Tempo (Casa + Praia) ----------

let weatherData = null; // cache em memória: { casa: {...}, praia: {...} }
let activeDay = 0; // 0 = hoje, 1 = amanhã

async function fetchWeather(loc) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
    `&current=temperature_2m,weathercode` +
    `&timezone=Europe%2FLisbon&forecast_days=2`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao obter o tempo");
  return res.json();
}

function renderWeatherRow() {
  const container = document.getElementById("weather-casa-praia");
  if (!weatherData) return;

  container.innerHTML = "";

  Object.entries(LOCATIONS).forEach(([key, loc]) => {
    const data = weatherData[key];
    const tile = document.createElement("div");
    tile.className = "weather-tile";

    if (!data) {
      tile.innerHTML = `<div class="weather-tile__place">${loc.label}</div><div class="empty-state">Sem dados</div>`;
      container.appendChild(tile);
      return;
    }

    const code = data.daily.weathercode[activeDay];
    const [desc, icon] = describeWeather(code);
    const max = Math.round(data.daily.temperature_2m_max[activeDay]);
    const min = Math.round(data.daily.temperature_2m_min[activeDay]);

    let nowTemp = "";
    if (activeDay === 0 && data.current) {
      nowTemp = `<div class="weather-tile__temp">${Math.round(data.current.temperature_2m)}°</div>`;
    } else {
      nowTemp = `<div class="weather-tile__temp">${max}°</div>`;
    }

    tile.innerHTML = `
      <div class="weather-tile__place">${loc.label}</div>
      <div style="font-size:22px;">${icon}</div>
      ${nowTemp}
      <div class="weather-tile__desc">${desc}</div>
      <div class="weather-tile__minmax">MIN ${min}° · MAX ${max}°</div>
    `;
    container.appendChild(tile);
  });
}

async function initWeather() {
  const container = document.getElementById("weather-casa-praia");
  try {
    const [casa, praia] = await Promise.all([
      fetchWeather(LOCATIONS.casa),
      fetchWeather(LOCATIONS.praia),
    ]);
    weatherData = { casa, praia };
    renderWeatherRow();
  } catch (err) {
    container.innerHTML = `<div class="empty-state">Não foi possível obter o tempo agora. Verifica a ligação à internet.</div>`;
  }

  document.querySelectorAll(".day-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      activeDay = Number(tab.dataset.day);
      document.querySelectorAll(".day-tab").forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      renderWeatherRow();
    });
  });
}

// ---------- Service worker ----------

function initServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {
        // silencioso — a app continua a funcionar sem cache offline
      });
    });
  }
}

// ---------- Arranque ----------

document.addEventListener("DOMContentLoaded", () => {
  renderHeaderDate();
  initNav();
  initWeather();
  initServiceWorker();
});
