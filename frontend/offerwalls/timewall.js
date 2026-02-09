export async function initTimeWall(user) {
  const uid = user?.user_id || user?.userId || user?.id;
  if (!uid) {
    console.error("TimeWall: uid inválido", user);
    return;
  }

  const container = document.getElementById("offerwall-container");
  if (!container) {
    console.error("TimeWall: no existe #offerwall-container");
    return;
  }

  const oid = "8a2a1f2f37b4c642";
  const url = `https://timewall.io/users/login?oid=${oid}&uid=${encodeURIComponent(uid)}`;

  container.innerHTML = `
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
