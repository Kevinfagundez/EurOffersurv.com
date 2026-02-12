// ========================================
// MOBIVORTEX (VORTEXWALL) INTEGRATION
// Renderiza el iframe dentro de #vortex_offerwall
// Requiere auth.js cargado antes
// ========================================

(function () {
  // ✅ 1) PONÉ TU PLACEMENT ID REAL ACÁ
  const VORTEX_PLACEMENT_ID = "TU_PLACEMENT_ID_AQUI";

  function pickUserIdentity(user) {
    // Ideal: un ID estable de tu sistema
    return (
      user.user_id ||
      user.userId ||
      user.id ||
      user.email ||
      "guest"
    );
  }

  function buildVortexUrl({ placementId, identityId, sub1, sub2 }) {
    const base = `https://vortexwall.com/ow/${encodeURIComponent(placementId)}/${encodeURIComponent(identityId)}/`;
    const qs = new URLSearchParams();

    if (sub1) qs.set("sub1", sub1);
    if (sub2) qs.set("sub2", sub2);

    const q = qs.toString();
    return q ? `${base}?${q}` : base;
  }

  async function initVortexOfferwall() {
    const mount = document.getElementById("vortex_offerwall");
    const loader = document.getElementById("vortex-loader");

    if (!mount) return;

    if (!VORTEX_PLACEMENT_ID || VORTEX_PLACEMENT_ID === "TU_PLACEMENT_ID_AQUI") {
      console.error("[Mobivortex] Falta configurar VORTEX_PLACEMENT_ID");
      if (loader) loader.style.display = "none";
      mount.innerHTML = `
        <div style="padding:1rem; color:#757575;">
          Falta configurar el <b>PLACEMENT_ID</b> de Mobivortex en <code>/vortex-integration.js</code>.
        </div>
      `;
      return;
    }

    // ✅ Protegido: si no hay sesión, auth.requireAuth redirige (según tu config)
    const session = await auth.requireAuth({
      redirectTo: "/index.html",
      retries: 8,
      delayMs: 450,
      graceMs: 5000,
    });

    if (!session.ok) return;

    const user = session.user || {};
    const identityId = pickUserIdentity(user);

    // ✅ Sub IDs opcionales: podés mandar tracking propio
    // Recomendación: sub1 = tu user_id, sub2 = algo tipo "web"
    const sub1 = String(user.user_id || user.userId || identityId);
    const sub2 = "web";

    const iframeUrl = buildVortexUrl({
      placementId: VORTEX_PLACEMENT_ID,
      identityId,
      sub1,
      sub2,
    });

    // Crear iframe
    const iframe = document.createElement("iframe");
    iframe.src = iframeUrl;
    iframe.title = "Offer Wall";
    iframe.style.width = "100%";
    iframe.style.height = "600px";
    iframe.style.border = "none";

    // Limpieza + render
    mount.innerHTML = "";
    mount.appendChild(iframe);

    if (loader) loader.style.display = "none";

    console.log("[Mobivortex] Iframe renderizado:", iframeUrl);
  }

  // Exponer por si querés llamarlo manual
  window.initVortexOfferwall = initVortexOfferwall;

  document.addEventListener("DOMContentLoaded", () => {
    // Solo corre en la página donde exista el contenedor
    if (document.getElementById("vortex_offerwall")) {
      initVortexOfferwall().catch((e) => {
        console.error("[Mobivortex] Error:", e);
        const loader = document.getElementById("vortex-loader");
        if (loader) loader.style.display = "none";
      });
    }
  });
})();
