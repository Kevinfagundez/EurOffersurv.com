export async function initTheorem() {
  if (typeof window.initTheoremReach === "function") {
    window.initTheoremReach();
  } else {
    console.warn("Theorem: window.initTheoremReach no existe");
  }
}
