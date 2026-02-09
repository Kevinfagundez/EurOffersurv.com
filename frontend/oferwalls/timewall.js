// /offerwalls/timewall.js
(function () {
  const TIMEWALL_OID = "8a2a1f2f37b4c642";

  function getUid(user) {
    return user?.user_id || user?.userId || user?.id || (auth?.getUserId?.() ?? null);
  }

  function showLoader(show) {
    const loader = document.getElementById("timewall-loader");
    if (loader) loader.style.display = show ? "flex" : "none";
  }

  function mountIframe(uid) {
    const mount = document.getElementById("timewall_offerwall");
    if (!mount) return;

    const url = `https://timewall.io/users/login?oid=${TIMEWALL_OID}&uid=${encodeURIComponent(uid)}`;

    mount.innerHTML = `
      <iframe
        title="TimeWall"
        src="${url}"
        frameborder="0"
        width="100%"
        height="1000"
        scrolling="auto"
        style="border:0; border-radius:12px; background:white;"
      ></iframe>
    `;
  }

  // Exponer global para que app.js lo llame cuando el usuario entra a "Encuestas"
  window.initTimeWallForSurveys = function initTimeWallForSurveys(user) {
    const uid = getUid(user);
    if (!uid) {
      console.error("TimeWall: no se pudo obtener uid");
      showLoader(false);
      return;
    }

    showLoader(true);
    mountIframe(uid);

    // Apagamos loader luego de un ratito (iframe load a veces no dispara en algunos entornos)
    const iframe = document.querySelector("#timewall_offerwall iframe");
    if (iframe) {
      iframe.onload = () => showLoader(false);
      iframe.onerror = () => {
        console.error("TimeWall: error cargando iframe");
        showLoader(false);
      };
    } else {
      setTimeout(() => showLoader(false), 800);
    }
  };
})();
