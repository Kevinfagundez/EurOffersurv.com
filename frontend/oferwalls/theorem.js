export async function initTheorem(user) {
  console.log("🟩 initTheorem ejecutándose");

  // limpiar TimeWall
  const tw = document.getElementById("offerwall-container");
  if (tw) tw.innerHTML = "";

  // limpiar target theorem
  const target = document.getElementById("theoremreach_offerwall");
  if (target) target.innerHTML = "";

  // mostrar loader
  const container = document.getElementById("theoremreach-container");
  const loader = container?.querySelector(".offerwall-loader");
  if (loader) loader.style.display = "flex";

  // llamar integración ORIGINAL
  if (typeof window.initTheoremReach === "function") {
    window.initTheoremReach();
  } else {
    console.error("❌ window.initTheoremReach no existe");
  }
}
