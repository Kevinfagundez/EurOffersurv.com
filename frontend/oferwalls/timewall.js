export async function initTimeWall(user) {
  console.log("🟦 initTimeWall ejecutándose");

  // apagar loader de Theorem
  const container = document.getElementById("theoremreach-container");
  const loader = container?.querySelector(".offerwall-loader");
  if (loader) loader.style.display = "none";

  // limpiar Theorem
  const tr = document.getElementById("theoremreach_offerwall");
  if (tr) tr.innerHTML = "";

  const uid = user?.user_id || user?.userId || user?.id;
  if (!uid) {
    console.error("TimeWall: UID inválido", user);
    return;
  }

  const tw = document.getElementById("offerwall-container");
  if (!tw) {
    console.error("No existe #offerwall-container");
    return;
  }

  const oid = "8a2a1f2f37b4c642";
  const url = `https://timewall.io/users/login?oid=${oid}&uid=${encodeURIComponent(uid)}`;

  tw.innerHTML = `
    <iframe
      title="TimeWall"
      src="${url}"
      frameborder="0"
      width="100%"
      height="1000"
      scrolling="auto"
      style="border:0;"
    ></iframe>
  `;
}
