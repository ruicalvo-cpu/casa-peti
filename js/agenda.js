// ============================================
// Casa Peti — agenda.js
// Agenda de quartos: quem fica em cada quarto e em que datas.
// Cada estadia é um documento com {quarto, pessoa, dataInicio, dataFim, notas}.
// ============================================

(function () {
  const COLLECTION = "agenda";

  const ROOMS = [
    { id: "mae", label: "Quarto da Mãe", short: "Mãe" },
    { id: "nuno", label: "Quarto Nuno/Rita", short: "Nuno/Rita" },
    { id: "rui", label: "Quarto Rui/Inês", short: "Rui/Inês" },
    { id: "menino", label: "Quarto Menino", short: "Menino" },
    { id: "garagem", label: "Quarto Garagem", short: "Garagem" },
  ];

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function dateStrWithOffset(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function formatShort(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-").map(Number);
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
  }

  function formatRange(stay) {
    const inicio = formatShort(stay.dataInicio);
    if (!stay.dataFim) return `a partir de ${inicio}`;
    return `${inicio} a ${formatShort(stay.dataFim)}`;
  }

  function isOngoing(stay, dateStr) {
    if (!stay.dataInicio) return false;
    const started = stay.dataInicio <= dateStr;
    const notEnded = !stay.dataFim || stay.dataFim >= dateStr;
    return started && notEnded;
  }

  // ---------- Vista da semana ----------

  let cachedStays = [];
  let weekOffset = 0;

  function formatLocalISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function getWeekStart(offset) {
    const now = new Date();
    const dow = now.getDay(); // 0 = domingo
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + offset * 7);
    return monday;
  }

  function weekDayLabel(d) {
    const label = d.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function renderWeek() {
    const grid = document.getElementById("week-grid");
    const label = document.getElementById("week-label");
    if (!grid || !label) return;

    const monday = getWeekStart(weekOffset);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });

    const sunday = days[6];
    label.textContent = `${weekDayLabel(days[0]).split(",")[0]} — ${weekDayLabel(sunday).split(",")[0]}, ${sunday.getFullYear()}`;

    const today = todayStr();

    grid.innerHTML = days
      .map((d) => {
        const dateStr = formatLocalISO(d);
        const isToday = dateStr === today;
        const pills = ROOMS.map((room) => {
          const stay = cachedStays.find((s) => s.quarto === room.id && isOngoing(s, dateStr));
          return stay
            ? `<span class="room-pill room-pill--occupied">${room.short}: ${escapeHtml(stay.pessoa)}</span>`
            : `<span class="room-pill">${room.short}: livre</span>`;
        }).join("");

        return `
        <div class="week-day-row ${isToday ? "is-today" : ""}">
          <div class="week-day-row__date">${weekDayLabel(d)}</div>
          <div class="week-day-row__rooms">${pills}</div>
        </div>`;
      })
      .join("");
  }

  function initWeekNav() {
    const prev = document.getElementById("week-prev");
    const next = document.getElementById("week-next");
    if (prev) prev.addEventListener("click", () => { weekOffset -= 1; renderWeek(); });
    if (next) next.addEventListener("click", () => { weekOffset += 1; renderWeek(); });
  }

  function renderRoomList(roomId, stays) {
    const container = document.querySelector(`[data-room-list="${roomId}"]`);
    if (!container) return;

    const roomStays = stays
      .filter((s) => s.quarto === roomId)
      .sort((a, b) => (a.dataInicio || "").localeCompare(b.dataInicio || ""));

    if (roomStays.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:2px 0;">Sem estadias marcadas.</div>';
      return;
    }

    const today = todayStr();

    container.innerHTML = roomStays
      .map(
        (stay) => `
      <div class="stay-row ${isOngoing(stay, today) ? "stay-row--now" : ""}">
        <div>
          <span class="stay-row__name">${escapeHtml(stay.pessoa)}</span>
          <span class="stay-row__dates">${formatRange(stay)}</span>
        </div>
        <button class="stay-row__delete" data-action="delete-stay" data-id="${stay.id}" aria-label="Remover">✕</button>
      </div>`
      )
      .join("");
  }

  function renderHomeToday(stays) {
    const el = document.getElementById("home-agenda-hoje");
    if (!el) return;

    const offset = (window.CasaPeti && window.CasaPeti.homeDayOffset) || 0;
    const targetDate = dateStrWithOffset(offset);

    const lines = ROOMS.map((room) => {
      const stay = stays.find((s) => s.quarto === room.id && isOngoing(s, targetDate));
      return stay
        ? `${room.label}: ${escapeHtml(stay.pessoa)}`
        : `${room.label}: <span class="empty-state">livre</span>`;
    });

    el.innerHTML = lines.join("<br>");
  }

  function initAgenda() {
    if (!window.db) return;

    window.db.collection(COLLECTION).onSnapshot(
      (snapshot) => {
        const stays = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        cachedStays = stays;
        ROOMS.forEach((room) => renderRoomList(room.id, stays));
        renderHomeToday(stays);
        renderWeek();
      },
      () => {
        ROOMS.forEach((room) => {
          const container = document.querySelector(`[data-room-list="${room.id}"]`);
          if (container) {
            container.innerHTML =
              '<div class="empty-state" style="padding:2px 0;">Não foi possível ligar à agenda partilhada.</div>';
          }
        });
      }
    );

    window.addEventListener("casapeti:homedaychange", () => renderHomeToday(cachedStays));

    initWeekNav();

    document.querySelectorAll("[data-room-form]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const roomId = form.dataset.roomForm;
        const pessoa = form.querySelector('[data-field="pessoa"]').value.trim();
        const dataInicio = form.querySelector('[data-field="dataInicio"]').value;
        const dataFim = form.querySelector('[data-field="dataFim"]').value;

        if (!pessoa || !dataInicio) return;

        window.db.collection(COLLECTION).add({
          quarto: roomId,
          pessoa,
          dataInicio,
          dataFim: dataFim || null,
          criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        });

        form.reset();
      });
    });

    document.querySelectorAll("[data-room-list]").forEach((container) => {
      container.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action='delete-stay']");
        if (!btn) return;
        window.db.collection(COLLECTION).doc(btn.dataset.id).delete();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initAgenda);
})();
