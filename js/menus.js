// ============================================
// Casa Peti — menus.js
// Plano diário de refeições e atividades, sincronizado via Firestore.
// Cada dia é um documento com o ID igual à data (AAAA-MM-DD).
// ============================================

(function () {
  const COLLECTION = "menusAtividades";

  function todayStr() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function formatDateLabel(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const label = date.toLocaleDateString("pt-PT", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function renderDayCards(days) {
    const list = document.getElementById("dias-lista");
    if (!list) return;

    if (days.length === 0) {
      list.innerHTML =
        '<div class="empty-state" style="padding:8px 4px;">Ainda não há dias no plano. Adiciona o primeiro acima 👆</div>';
      return;
    }

    list.innerHTML = days
      .map((day) => {
        const isToday = day.id === todayStr();
        return `
        <div class="card day-card ${isToday ? "day-card--today" : ""}" data-id="${day.id}">
          <div class="day-card__header">
            <div class="day-card__date">${formatDateLabel(day.id)} ${isToday ? '<span class="day-card__badge">HOJE</span>' : ""}</div>
            <button class="day-card__delete" data-action="delete-day" data-id="${day.id}" aria-label="Remover dia">✕</button>
          </div>

          <div class="day-field">
            <label class="day-field__label">Almoço</label>
            <input type="text" class="day-field__input" data-field="almoco" data-id="${day.id}" value="${escapeHtml(day.almoco)}" placeholder="Ex: peixe grelhado com legumes">
          </div>
          <div class="day-field day-field--split">
            <label class="day-field__label">Nº pessoas ao almoço</label>
            <input type="number" min="0" class="day-field__input day-field__input--num" data-field="pessoasAlmoco" data-id="${day.id}" value="${day.pessoasAlmoco != null ? day.pessoasAlmoco : ""}" placeholder="Ex: 8">
          </div>
          <div class="day-field">
            <label class="day-field__label">Jantar</label>
            <input type="text" class="day-field__input" data-field="jantar" data-id="${day.id}" value="${escapeHtml(day.jantar)}" placeholder="Ex: churrasco no jardim">
          </div>
          <div class="day-field day-field--split">
            <label class="day-field__label">Nº pessoas ao jantar</label>
            <input type="number" min="0" class="day-field__input day-field__input--num" data-field="pessoasJantar" data-id="${day.id}" value="${day.pessoasJantar != null ? day.pessoasJantar : ""}" placeholder="Ex: 6">
          </div>
          <div class="day-field">
            <label class="day-field__label">Atividade</label>
            <input type="text" class="day-field__input" data-field="atividade" data-id="${day.id}" value="${escapeHtml(day.atividade)}" placeholder="Ex: praia de Moledo de manhã">
          </div>
          <div class="day-field">
            <label class="day-field__label">Notas</label>
            <input type="text" class="day-field__input" data-field="notas" data-id="${day.id}" value="${escapeHtml(day.notas)}" placeholder="Opcional">
          </div>
        </div>`;
      })
      .join("");
  }

  function renderHomeToday(day) {
    const menuEl = document.getElementById("home-menu-hoje");
    const atividadeEl = document.getElementById("home-atividade-hoje");
    if (!menuEl || !atividadeEl) return;

    if (!day) {
      menuEl.innerHTML = '<span class="empty-state">Ainda por definir.</span>';
      atividadeEl.innerHTML = '<span class="empty-state">Ainda por definir.</span>';
      return;
    }

    const partes = [];
    if (day.almoco) {
      partes.push(`Almoço: ${escapeHtml(day.almoco)}${day.pessoasAlmoco != null && day.pessoasAlmoco !== "" ? ` (${day.pessoasAlmoco}p)` : ""}`);
    }
    if (day.jantar) {
      partes.push(`Jantar: ${escapeHtml(day.jantar)}${day.pessoasJantar != null && day.pessoasJantar !== "" ? ` (${day.pessoasJantar}p)` : ""}`);
    }
    menuEl.innerHTML = partes.length
      ? partes.join(" · ")
      : '<span class="empty-state">Ainda por definir.</span>';

    atividadeEl.innerHTML = day.atividade
      ? escapeHtml(day.atividade)
      : '<span class="empty-state">Ainda por definir.</span>';
  }

  function saveField(id, field, value, isNumber) {
    const finalValue = isNumber ? (value === "" ? null : Number(value)) : value;
    window.db
      .collection(COLLECTION)
      .doc(id)
      .set(
        {
          data: id,
          [field]: finalValue,
          atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  }

  function initMenus() {
    const form = document.getElementById("dia-form");
    const input = document.getElementById("dia-input");
    const list = document.getElementById("dias-lista");

    if (!window.db) return;

    // Lista completa, ordenada por data — alimenta a secção Menus.
    if (list) {
      window.db
        .collection(COLLECTION)
        .orderBy("data", "asc")
        .onSnapshot(
          (snapshot) => {
            const days = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            renderDayCards(days);
          },
          () => {
            list.innerHTML =
              '<div class="empty-state" style="padding:8px 4px;">Não foi possível ligar ao plano partilhado. Verifica a ligação à internet.</div>';
          }
        );
    }

    // Documento de hoje — alimenta a home page.
    window.db
      .collection(COLLECTION)
      .doc(todayStr())
      .onSnapshot((doc) => {
        renderHomeToday(doc.exists ? doc.data() : null);
      });

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const dateStr = input.value;
        if (!dateStr) return;
        window.db
          .collection(COLLECTION)
          .doc(dateStr)
          .set(
            { data: dateStr, criadoEm: firebase.firestore.FieldValue.serverTimestamp() },
            { merge: true }
          );
        input.value = "";
      });
    }

    if (list) {
      list.addEventListener("change", (e) => {
        const field = e.target.closest("input[data-field]");
        if (!field) return;
        const isNumber = field.type === "number";
        saveField(field.dataset.id, field.dataset.field, field.value.trim(), isNumber);
      });

      list.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action='delete-day']");
        if (!btn) return;
        window.db.collection(COLLECTION).doc(btn.dataset.id).delete();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", initMenus);
})();
