export async function initTheorem(user) {
  console.log("🟩 initTheorem ejecutándose");

  // 1) Limpiar TimeWall (si estaba)
  const tw = document.getElementById("offerwall-container");
  if (tw) tw.innerHTML = "";

  // 2) Asegurar que el target de Theorem esté visible y vacío
  const target = document.getElementById("theoremreach_offerwall");
  if (target) target.innerHTML = "";

  // 3) Mostrar loader de Theorem (lo usa theoremreach-integration)
  const container = document.getElementById("theoremreach-container");
  const loader = container?.querySelector(".offerwall-loader");
  if (loader) loader.style.display = "flex";

  // 4) Llamar al init original (como siempre)
  if (typeof window.initTheoremReach === "function") {
    window.initTheoremReach();
  } else {
    console.error("❌ window.initTheoremReach no existe. ¿Se carga /theoremreach-integration.js?");
  }
}
