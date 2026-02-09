// frontend/offerwalls/index.js (SIN MODULES)
// Expone window.initOfferwall(user, defaultProvider)
// y window.switchOfferwall(name, user)

(function () {
  if (typeof window.createTheoremProvider !== "function") {
    console.error("Falta createTheoremProvider(). ¿Cargaste /offerwalls/theorem.js?");
  }
  if (typeof window.createTimewallProvider !== "function") {
    console.error("Falta createTimewallProvider(). ¿Cargaste /offerwalls/timewall.js?");
  }

  const providers = {
    theorem: window.createTheoremProvider?.(),
    timewall: window.createTimewallProvider?.(),
  };

  let active = null;

  async function initOfferwall(user, defaultProvider = "theorem") {
    if (!providers.theorem || !providers.timewall) {
      console.error("Providers no disponibles. Revisa el orden de scripts en dashboard.html");
      return;
    }

    // Montar ambos (solo 1 vez cada uno)
    await providers.theorem.mount(user);
    await providers.timewall.mount(user);

    // Ocultar ambos y mostrar el default
    providers.theorem.hide();
    providers.timewall.hide();

    await switchOfferwall(defaultProvider, user);
  }

  async function switchOfferwall(name, user) {
    const next = providers[name];
    if (!next) {
      console.error("Provider inválido:", name);
      return;
    }

    if (active && active !== next) active.hide();

    // mount defensivo por si initOfferwall no corrió
    await next.mount(user);

    next.show();
    active = next;

    console.log("Offerwall activo:", name);
  }

  window.initOfferwall = initOfferwall;
  window.switchOfferwall = switchOfferwall;
})();
