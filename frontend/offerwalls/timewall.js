export async function initTimeWall(user) {
  console.log("🟦 initTimeWall ejecutándose");

  // Apagar loader de Theorem
  const container = document.getElementById("theoremreach-container");
  const loader = container?.querySelector(".offerwall-loader");
  if (loader) loader.style.display = "none";

  // Vaciar contenedor Theorem
  const tr = document.getElementById("theoremreach_offerwall");
  if (tr) tr.innerHTML = "";

  // Render TimeWall
  const uid = user?.user_id || user?.userId || user?.id;
  const tw = document.getElementById("offerwall-container");
  if (!tw) return console.error("No existe #offerwall-container");
  if (!uid) return console.error("No hay uid para TimeWall", user);

  const oid = "8a2a1f2f37b4c642";
  const url = `https://timewall.io/users/login?oid=${oid}&uid=${encodeURIComponent(uid)}`;

  tw.innerHTML = `
    <iframe title="TimeWall"
      src="${url}"
      frameborder="0"
      width="100%"
      height="1000"
      scrolling="auto"
      style="border:0;"
    ></iframe>
  `;
}
