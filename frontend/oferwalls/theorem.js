function createTheoremProvider() {
  const container = () => document.getElementById("theoremreach-container");
  let mounted = false;

  return {
    async mount() {
      if (mounted) return;
      mounted = true;

      if (!container()) {
        console.error("No existe #theoremreach-container");
        return;
      }

      // no mostramos aún (show() lo hará)
      container().style.display = "none";

      if (typeof window.initTheoremReach !== "function") {
        console.error("initTheoremReach no está disponible. ¿Cargaste theoremreach-integration.js?");
        return;
      }

      // Tu integración intacta
      window.initTheoremReach();
    },

    show() {
      container()?.style && (container().style.display = "block");
    },

    hide() {
      container()?.style && (container().style.display = "none");
    },
  };
}

window.createTheoremProvider = createTheoremProvider;
