function qs(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`No existe #${id}`);
  return el;
}

export function createTimewallProvider() {
  const shell = () => qs("timewall-container");
  const mount = () => qs("timewall_offerwall");

  const OID = "8a2a1f2f37b4c642";
  const BASE = "https://timewall.io/users/login";

  let mounted = false;
  let iframe = null;

  function setLoading(isLoading) {
    const loader = shell().querySelector(".offerwall-loader");
    if (loader) loader.style.display = isLoading ? "flex" : "none";
  }

  function buildUrl(uid) {
    const u = new URL(BASE);
    u.searchParams.set("oid", OID);
    u.searchParams.set("uid", String(uid));
    return u.toString();
  }

  return {
    name: "timewall",

    async mount(user) {
      if (mounted) return;
      mounted = true;

      shell().style.display = "none";

      const uid = user?.user_id ?? user?.id ?? (window.auth?.getUserId?.());
      if (!uid) {
        console.error("No hay uid para TimeWall");
        return;
      }

      setLoading(true);

      iframe = document.createElement("iframe");
      iframe.src = buildUrl(uid);
      iframe.style.width = "100%";
      iframe.style.height = "75vh";
      iframe.style.minHeight = "620px";
      iframe.style.border = "0";
      iframe.style.borderRadius = "12px";
      iframe.style.background = "white";

      iframe.onload = () => setLoading(false);
      iframe.onerror = () => setLoading(false);

      mount().appendChild(iframe);

      // fallback anti-loader eterno
      setTimeout(() => setLoading(false), 8000);
    },

    show() {
      shell().style.display = "block";
    },

    hide() {
      shell().style.display = "none";
    },
  };
}
