// ============================================
// Casa Peti — vinhos.js
// Repositório de vinhos, com avaliações (estrelas) e comentários de cada pessoa.
// ============================================

(function () {
  const COLLECTION = "vinhos";

  function getNome() {
    let nome = localStorage.getItem("casapeti_nome");
    if (!nome) {
      nome = (prompt("Como te chamas? (fica guardado neste telemóvel)") || "Alguém").trim();
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

  function starsDisplay(n) {
    const rounded = Math.round(n);
    return "★★★★★".slice(0, rounded) + "☆☆☆☆☆".slice(0, 5 - rounded);
  }

  function computeAvg(avaliacoes) {
    if (!avaliacoes || avaliacoes.length === 0) return { avg: 0, count: 0 };
    const sum = avaliacoes.reduce((acc, a) => acc + (a.nota || 0), 0);
    return { avg: sum / avaliacoes.length, count: avaliacoes.length };
  }

  function renderStarPicker(wineId) {
    let html = `<div class="star-picker" data-wine-id="${wineId}">`;
    for (let i = 1; i <= 5; i++) {
      html += `<button type="button" class="star-picker__star" data-star="${i}" aria-label="${i} estrelas">☆</button>`;
    }
    html += "</div>";
    return html;
  }

  function renderWineCard(wine) {
    const { avg, count } = computeAvg(wine.avaliacoes);
    const avaliacoesHtml = (wine.avaliacoes || [])
      .slice()
      .reverse()
      .map(
        (a) => `
        <div class="wine-review">
          <div class="wine-review__head">
            <span class="wine-review__stars">${starsDisplay(a.nota)}</span>
            <span class="wine-review__author">${escapeHtml(a.pessoa)}</span>
          </div>
          ${a.comentario ? `<div class="wine-review__comment">${escapeHtml(a.comentario)}</div>` : ""}
        </div>`
      )
      .join("");

    const metaBits = [wine.produtor, wine.tipo, wine.ano].filter(Boolean).map(escapeHtml);

    return `
    <div class="card wine-card" data-id="${wine.id}">
      <div class="wine-card__header">
        <div>
          <div class="wine-card__name">${escapeHtml(wine.nome)}</div>
          <div class="wine-card__meta">${metaBits.join(" · ")}</div>
        </div>
        <button class="wine-card__delete" data-action="delete-wine" data-id="${wine.id}" aria-label="Remover vinho">✕</button>
      </div>

      ${
        count > 0
          ? `<div class="wine-card__avg"><span class="wine-card__avg-stars">${starsDisplay(avg)}</span> ${avg.toFixed(1)} · ${count} avaliaç${count === 1 ? "ão" : "ões"}</div>`
          : `<div class="empty-state" style="margin:6px 0;">Ainda sem avaliações.</div>`
      }

      <div class="wine-reviews">${avaliacoesHtml}</div>

      <div class="wine-rate-form" data-wine-id="${wine.id}">
        ${renderStarPicker(wine.id)}
        <textarea class="wine-rate-form__comment" placeholder="O que achaste? (opcional)"></textarea>
        <button type="button" class="wine-rate-form__submit" data-action="submit-rating" data-id="${wine.id}">Guardar avaliação</button>
      </div>
    </div>`;
  }

  function renderList(wines) {
    const list = document.getElementById("vinhos-lista");
    if (!list) return;

    if (wines.length === 0) {
      list.innerHTML = '<div class="empty-state" style="padding:8px 4px;">Ainda não há vinhos registados. Adiciona o primeiro acima 🍷</div>';
      return;
    }

    list.innerHTML = wines.map(renderWineCard).join("");
  }

  function initVinhos() {
    const form = document.getElementById("vinho-form");
    const list = document.getElementById("vinhos-lista");

    if (!list || !window.db) return;

    window.db
      .collection(COLLECTION)
      .orderBy("criadoEm", "desc")
      .onSnapshot(
        (snapshot) => {
          const wines = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          renderList(wines);
        },
        () => {
          list.innerHTML =
            '<div class="empty-state" style="padding:8px 4px;">Não foi possível ligar ao repositório de vinhos. Verifica a ligação à internet.</div>';
        }
      );

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const nome = document.getElementById("vinho-nome").value.trim();
        const produtor = document.getElementById("vinho-produtor").value.trim();
        const anoVal = document.getElementById("vinho-ano").value;
        const tipo = document.getElementById("vinho-tipo").value;

        if (!nome) return;

        window.db.collection(COLLECTION).add({
          nome,
          produtor,
          tipo,
          ano: anoVal ? Number(anoVal) : null,
          avaliacoes: [],
          criadoPor: getNome(),
          criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        });

        form.reset();
        document.getElementById("vinho-tipo").value = "Tinto";
      });
    }

    // Seleção de estrelas (delegação de eventos)
    list.addEventListener("click", (e) => {
      const star = e.target.closest(".star-picker__star");
      if (star) {
        const picker = star.closest(".star-picker");
        const value = Number(star.dataset.star);
        picker.dataset.value = value;
        picker.querySelectorAll(".star-picker__star").forEach((s, idx) => {
          s.textContent = idx < value ? "★" : "☆";
          s.classList.toggle("is-active", idx < value);
        });
        return;
      }

      const submitBtn = e.target.closest("[data-action='submit-rating']");
      if (submitBtn) {
        const wineId = submitBtn.dataset.id;
        const rateForm = submitBtn.closest(".wine-rate-form");
        const picker = rateForm.querySelector(".star-picker");
        const nota = Number(picker.dataset.value || 0);
        const comentario = rateForm.querySelector(".wine-rate-form__comment").value.trim();

        if (!nota) {
          alert("Escolhe pelo menos 1 estrela antes de guardar.");
          return;
        }

        window.db
          .collection(COLLECTION)
          .doc(wineId)
          .update({
            avaliacoes: firebase.firestore.FieldValue.arrayUnion({
              pessoa: getNome(),
              nota,
              comentario,
              data: new Date().toISOString(),
            }),
          });
        return;
      }

      const deleteBtn = e.target.closest("[data-action='delete-wine']");
      if (deleteBtn) {
        window.db.collection(COLLECTION).doc(deleteBtn.dataset.id).delete();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initVinhos);
})();
