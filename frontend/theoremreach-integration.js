// ========================================
// INTEGRACIÓN THEOREMREACH (WEB - IFRAME)
// EurOffersurv.com
// ========================================

/**
 * API KEY (Web App) - OJO: En web se usa en frontend (es normal en este tipo de integración)
 */
const THEOREMREACH_API_KEY = "d32ff15efe78fa5475d2b5d132ec";

/**
 * Inicializa TheoremReach dentro del dashboard (iframe embebido).
 * Requiere:
 * - Usuario autenticado
 * - Contenedor: #theoremreach-container
 * - Target: #theoremreach_offerwall (dentro del contenedor)
 */
async function initTheoremReach() {
  try {
    // Validar auth disponible
    if (typeof auth === "undefined") {
      console.error("auth no está definido. Asegúrate de cargar auth.js antes.");
      showOfferwallError("Error interno: auth no disponible.");
      return;
    }

    // Validar autenticación
    if (!auth.isAuthenticated || !auth.isAuthenticated()) {
      console.error("Usuario no autenticado");
      return;
    }

    // Obtener user_id
    const userId = (auth.getUserId && auth.getUserId()) || null;
    if (!userId) {
      console.error("No se pudo obtener el user_id");
      showToast("Error al cargar ofertas. Por favor, recarga la página.", "error");
      showOfferwallError("No se pudo obtener tu usuario.");
      return;
    }

    // Validar API KEY
    if (!THEOREMREACH_API_KEY) {
      showOfferwallError("Falta configurar la API Key de TheoremReach.");
      return;
    }

    const container = document.getElementById("theoremreach-container");
    const target = document.getElementById("theoremreach_offerwall");

    if (!container || !target) {
      console.error("Faltan contenedores #theoremreach-container o #theoremreach_offerwall");
      return;
    }

    // Mostrar loader (si existe)
    const loader = container.querySelector(".offerwall-loader");
    if (loader) loader.style.display = "flex";

    // Generar transaction_id único (recomendado para iframe/direct)
    const transactionId = generateTransactionId(userId);

    // URL oficial (direct) embebida como iframe
    const iframeUrl =
      "https://theoremreach.com/respondent_entry/direct" +
      `?api_key=${encodeURIComponent(THEOREMREACH_API_KEY)}` +
      `&user_id=${encodeURIComponent(userId)}` +
      `&transaction_id=${encodeURIComponent(transactionId)}`;

    console.log("Cargando TheoremReach iframe:", { userId, transactionId });

    // Renderizar iframe dentro de theoremreach_offerwall (sin pisar el contenedor principal)
    target.innerHTML = `
      <iframe
        id="theoremreach-iframe"
        src="${iframeUrl}"
        style="
          width: 100%;
          height: 75vh;
          min-height: 620px;
          border: 0;
          border-radius: 12px;
          background: white;
          display: none;
        "
        allow="clipboard-write; fullscreen"
      ></iframe>
    `;

    const iframe = document.getElementById("theoremreach-iframe");

    iframe.onload = () => {
      if (loader) loader.style.display = "none";
      iframe.style.display = "block";
      console.log("TheoremReach iframe cargado correctamente");
    };

    iframe.onerror = () => {
      console.error("Error al cargar iframe de TheoremReach");
      showOfferwallError("No pudimos cargar las ofertas. Reintenta en unos segundos.");
    };
  } catch (error) {
    console.error("Error en initTheoremReach:", error);
    showOfferwallError("Error inesperado al cargar ofertas.");
  }
}

function generateTransactionId(userId) {
  const rand = Math.random().toString(16).slice(2, 10);
  return `tr_${userId}_${Date.now()}_${rand}`;
}

/**
 * Muestra mensaje de error dentro del panel (sin romper layout)
 */
function showOfferwallError(customMessage) {
  const container = document.getElementById("theoremreach-container");
  const target = document.getElementById("theoremreach_offerwall");
  if (!container || !target) return;

  const loader = container.querySelector(".offerwall-loader");
  if (loader) loader.style.display = "none";

  const message = customMessage || "No pudimos cargar las ofertas disponibles.";

  target.innerHTML = `
    <div class="offerwall-error" style="
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none"
        viewBox="0 0 24 24" stroke="currentColor" style="color: #f44336; margin: 0 auto;">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 style="margin-top: 1rem; color: #333;">Error al cargar ofertas</h3>
      <p style="color: #757575; margin-top: 0.5rem;">${escapeHtml(message)}</p>
      <button onclick="location.reload()" style="
        margin-top: 1.5rem;
        padding: 0.75rem 1.5rem;
        background: #2196f3;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
      ">Reintentar</button>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Refrescar balance (se mantiene, solo defensivo)
 */
async function refreshUserBalance() {
  try {
    if (!auth || !auth.getUserData) return;

    const userData = await auth.getUserData();
    if (userData && userData.user) {
      const u = userData.user;

      const balance = u.balance != null ? parseFloat(u.balance) : null;
      const totalEarned = u.total_earned != null ? parseFloat(u.total_earned) : null;

      if (balance != null && !Number.isNaN(balance)) {
        document.querySelectorAll(".user-balance, [data-balance]").forEach((el) => {
          el.textContent = `$${balance.toFixed(2)} USD`;
        });
      }

      if (totalEarned != null && !Number.isNaN(totalEarned)) {
        document.querySelectorAll("[data-total-earned]").forEach((el) => {
          el.textContent = `$${totalEarned.toFixed(2)}`;
        });
      }

      if (u.completed_offers != null) {
        document.querySelectorAll("[data-completed-offers]").forEach((el) => {
          el.textContent = u.completed_offers;
        });
      }

      console.log("Balance actualizado:", u.balance);
    }
  } catch (error) {
    console.error("Error al actualizar balance:", error);
  }
}

// Actualizar balance cada 30 segundos
setInterval(refreshUserBalance, 30000);

// Exportar funciones para uso global
window.initTheoremReach = initTheoremReach;
window.refreshUserBalance = refreshUserBalance;
