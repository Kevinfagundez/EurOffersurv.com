function createTheoremProvider() {
  const container = () => document.getElementById("theoremreach-container");

  let mounted = false;

  return {
    async mount() {
      if (mounted) return;
      mounted = true;

      container().style.display = "none";

      if (typeof window.initTheoremReach !== "function") {
        console.error("initTheoremReach no está disponible.");
        return;
      }
      window.initTheoremReach();
    },
    show() {
      container().style.display = "block";
    },
    hide() {
      container().style.display = "none";
    },
  };
}

window.createTheoremProvider = createTheoremProvider;
