function createTimewallProvider() {
  const shell = () => document.getElementById("timewall-container");
  const mount = () => document.getElementById("timewall_offerwall");

  const OID = "8a2a1f2f37b4c642";
  const BASE = "https://timewall.io/users/login";

  let mounted = false;

  function setLoading(isLoading) {
    const loader = shell()?.querySelector(".offerwall-loader");
    if (loader) loader.style.display = isLoading ? "flex" : "none";
  }

  function buildUrl(uid) {
    const u = new URL(BASE);
    u.searchParams.set("oid", OID);
    u.searchParams.set("uid", String(uid));
    return u.toString();
  }

  return {
    async mount(user) {
      if (mounted) return;
      mounted = true;

      if (!shell() || !mount()) {
        console.error("Faltan contenedores de TimeWall (#timewall-container / #timewall_offerwall)");
        return;
      }

      shell().style.display = "none";
      setLoading(true);

      const uid = user?.user_id ?? user?.id ?? (window.auth?.getUserId?.());
      if (!uid) {
        console.error("No hay uid para TimeWall");
        setLoading(false);
        return;
      }

      const iframe = document.createElement("iframe");
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

window.createTimewallProvider = createTimewallProvider;
