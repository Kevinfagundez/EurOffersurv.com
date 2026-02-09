export async function initTimeWall() {
  // 1) Validar auth (adaptá a tu auth real)
  if (typeof auth === "undefined" || !auth.isAuthenticated?.()) {
    console.error("No autenticado");
    return;
  }

  const userId = auth.getUserId?.();
  if (!userId) {
    console.error("No se pudo obtener userId");
    return;
  }

  // 2) Contenedor
  const container = document.getElementById("offerwall-container");
  if (!container) {
    console.error("No existe #offerwall-container");
    return;
  }

  // 3) Iframe TimeWall
  const oid = "8a2a1f2f37b4c642"; // tu OID
  const url = `https://timewall.io/users/login?oid=${oid}&uid=${encodeURIComponent(userId)}`;

  container.innerHTML = `
    <iframe
      title="TimeWall"
      src="${url}"
      frameborder="0"
      width="100%"
      height="1000"
      scrolling="auto"
      style="border:0; border-radius:12px;"
    ></iframe>
  `;
}
