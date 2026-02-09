// frontend/offerwalls/index.js (SIN MODULES)
// Expone window.initOfferwall(user, defaultProvider)
// y window.switchOfferwall(name, user)

(function () {
  const providers = {
    theorem: createTheoremProvider(),
    timewall: createTimewallProvider(),
  };

  let active = null;

  async function initOfferwall(user, defaultProvider = "theorem") {
    // Montamos ambos una vez, pero mostramos solo el default
    await providers.theorem.mount(user);
    await providers.timewall.mount(user);

    // Ocultar ambos y mostrar el elegido
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

    // mount defensivo por si initOfferwall no se llamó
    await next.mount(user);

    next.show();
    active = next;
  }

  window.initOfferwall = initOfferwall;
  window.switchOfferwall = switchOfferwall;
})();
