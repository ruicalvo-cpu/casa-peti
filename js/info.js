// ============================================
// Casa Peti — info.js
// WiFi e notas da casa, partilhados e editáveis por todos.
// (Os eventos e a festa da aldeia ficam como texto fixo no index.html,
// porque são informação de referência pesquisada, não dados do dia a dia.)
// ============================================

(function () {
  const DOC_REF = () => window.db.collection("infoUtil").doc("geral");

  function initInfo() {
    if (!window.db) return;

    const redeEl = document.getElementById("wifi-rede");
    const passEl = document.getElementById("wifi-password");
    const notasEl = document.getElementById("info-notas");

    DOC_REF().onSnapshot((doc) => {
      const data = doc.exists ? doc.data() : {};
      if (redeEl && document.activeElement !== redeEl) redeEl.value = data.wifiRede || "";
      if (passEl && document.activeElement !== passEl) passEl.value = data.wifiPassword || "";
      if (notasEl && document.activeElement !== notasEl) notasEl.value = data.notas || "";
    });

    function save(field, value) {
      DOC_REF().set(
        { [field]: value, atualizadoEm: firebase.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
    }

    if (redeEl) redeEl.addEventListener("change", () => save("wifiRede", redeEl.value.trim()));
    if (passEl) passEl.addEventListener("change", () => save("wifiPassword", passEl.value.trim()));
    if (notasEl) notasEl.addEventListener("change", () => save("notas", notasEl.value.trim()));
  }

  document.addEventListener("DOMContentLoaded", initInfo);
})();
