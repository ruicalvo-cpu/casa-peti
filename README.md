// ============================================
// Casa Peti — compras.js
// Lista de compras partilhada, sincronizada em tempo real via Firestore.
// ============================================

(function () {
  const COLLECTION = "compras";

  function getNome() {
    let nome = localStorage.getItem("casapeti_nome");
    if (!nome) {
      nome = (prompt("Como te chamas? (fica guardado neste telemóvel, para sabermos quem pediu cada coisa)") || "Alguém").trim();
      if (!nome) nome = "Alguém";
      localStorage.setItem("casapeti_nome", nome);
    }
    return nome;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function renderList(items) {
    const list = document.getElementById("compras-lista");
    if (!list) return;

    if (items.length === 0) {
      list.innerHTML = '<div class="empty-state" style="padding:8px 4px;">A lista está vazia. Adiciona o que for preciso comprar 🙂</div>';
      return;
    }

    list.innerHTML = items
      .map(
        (item) => `
      <div class="shop-item ${item.comprado ? "is-done" : ""}" data-id="${item.id}">
        <button class="shop-item__check" data-action="toggle" data-id="${item.id}" data-done="${item.comprado ? "1" : "0"}" aria-label="Marcar como comprado">
          ${item.comprado ? "✓" : ""}
        </button>
        <div class="shop-item__body">
          <div class="shop-item__text">${escapeHtml(item.texto)}</div>
          <div class="shop-item__meta">${escapeHtml(item.criadoPor || "")}</div>
        </div>
        <button class="shop-item__delete" data-action="delete" data-id="${item.id}" aria-label="Remover">✕</button>
      </div>`
      )
      .join("");
  }

  function initCompras() {
    const form = document.getElementById("compras-form");
    const input = document.getElementById("compras-input");
    const list = document.getElementById("compras-lista");

    if (!form || !list || !window.db) return;

    window.db
      .collection(COLLECTION)
      .orderBy("criadoEm", "asc")
      .onSnapshot(
        (snapshot) => {
          const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          renderList(items);
        },
        () => {
          list.innerHTML =
            '<div class="empty-state" style="padding:8px 4px;">Não foi possível ligar à lista partilhada. Verifica a ligação à internet.</div>';
        }
      );

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const texto = input.value.trim();
      if (!texto) return;

      window.db.collection(COLLECTION).add({
        texto,
        comprado: false,
        criadoPor: getNome(),
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      });

      input.value = "";
      input.focus();
    });

    list.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const id = btn.dataset.id;

      if (btn.dataset.action === "toggle") {
        const isDone = btn.dataset.done === "1";
        window.db.collection(COLLECTION).doc(id).update({ comprado: !isDone });
      } else if (btn.dataset.action === "delete") {
        window.db.collection(COLLECTION).doc(id).delete();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initCompras);
})();
