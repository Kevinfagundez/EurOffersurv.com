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
        console.error("Faltan contenedores TimeWall (#timewall-container / #timewall_offerwall)");
        return;
      }

      // no mostramos aún (show() lo hará)
      shell().style.display = "none";
      setLoading(true);

      const uid =
        user?.user_id ??
        user?.userId ??
        user?.id ??
        (window.auth?.getUserId?.());

      if (!uid) {
        console.error("No hay uid para TimeWall");
        setLoading(false);
        mount().innerHTML = "<p style='padding:12px'>No se pudo obtener tu user_id.</p>";
        return;
      }

      const url = buildUrl(uid);
      console.log("TimeWall URL:", url);

      // limpiar SOLO su mount (no toca theorem)
      mount().innerHTML = "";

      const iframe = document.createElement("iframe");
      iframe.title = "TimeWall";
      iframe.src = url;
      iframe.frameBorder = "0";
      iframe.scrolling = "auto";
      iframe.style.width = "100%";
      iframe.style.height = "1000px"; // recomendado por TimeWall
      iframe.style.border = "0";
      iframe.style.borderRadius = "12px";
      iframe.style.background = "white";

      iframe.onload = () => {
        setLoading(false);
        console.log("TimeWall iframe cargado");
      };

      iframe.onerror = () => {
        setLoading(false);
        console.error("Error al cargar TimeWall iframe");
        mount().innerHTML = `
          <div style="padding:18px;background:white;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.08)">
            <h3 style="margin:0 0 8px;color:#111;">Error al cargar TimeWall</h3>
            <p style="margin:0 0 14px;color:#555;">No se pudo cargar en iframe. Probá abrirlo en una nueva pestaña.</p>
            <a href="${url}" target="_blank" rel="noopener noreferrer"
               style="display:inline-block;padding:10px 14px;background:#2196f3;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;">
              Abrir TimeWall
            </a>
          </div>
        `;
      };

      mount().appendChild(iframe);

      // fallback anti-loader eterno (si iframe bloqueado / no carga)
      setTimeout(() => {
        const loader = shell()?.querySelector(".offerwall-loader");
        if (loader && loader.style.display !== "none") {
          setLoading(false);
          console.warn("TimeWall tardó demasiado (posible bloqueo).");
        }
      }, 9000);
    },

    show() {
      shell()?.style && (shell().style.display = "block");
    },

    hide() {
      shell()?.style && (shell().style.display = "none");
    },
  };
}

window.createTimewallProvider = createTimewallProvider;
