async function initTimeWall() {
  try {
    if (typeof auth === "undefined" || !auth.isAuthenticated()) {
      console.error("Usuario no autenticado");
      return;
    }

    const userId = auth.getUserId();
    if (!userId) {
      console.error("No se pudo obtener user_id");
      return;
    }

    const container = document.getElementById("offerwall-container");
    if (!container) {
      console.error("Contenedor offerwall no encontrado");
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.src = `https://timewall.io/users/login?oid=8a2a1f2f37b4c642&uid=${userId}`;
    iframe.width = "100%";
    iframe.height = "1000";
    iframe.frameBorder = "0";
    iframe.scrolling = "auto";

    container.innerHTML = "";
    container.appendChild(iframe);

  } catch (err) {
    console.error("Error cargando TimeWall", err);
  }
}

document.addEventListener("DOMContentLoaded", initTimeWall);
