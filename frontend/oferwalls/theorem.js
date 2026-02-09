function qs(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`No existe #${id}`);
  return el;
}

export function createTheoremProvider() {
  const container = () => qs("theoremreach-container");

  let mounted = false;

  return {
    name: "theorem",

    async mount(user) {
      if (mounted) return;
      mounted = true;

      // Oculto al inicio; se mostrará cuando se active
      container().style.display = "none";

      // Llama a tu integración intacta
      if (typeof window.initTheoremReach !== "function") {
        console.error("initTheoremReach no está disponible. ¿Cargaste theoremreach-integration.js?");
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

