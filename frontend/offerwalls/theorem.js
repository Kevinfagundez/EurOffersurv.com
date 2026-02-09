export async function initTheorem(user) {
  console.log("🟩 initTheorem (wrapper) ejecutándose");

  // Algunos setups necesitan userId disponible globalmente
  // para que theoremreach-integration.js lo use.
  try {
    if (user) window.__USER_FOR_OFFERWALL__ = user;
  } catch (_) {}

  if (typeof window.initTheoremReach === "function") {
    window.initTheoremReach();
    return;
  }

  console.error("❌ No existe window.initTheoremReach. ¿Se está cargando /theoremreach-integration.js?");
}
