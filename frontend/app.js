// ========================================
// APP PRINCIPAL - EUROFFERSURV
// Maneja UI, login y dashboard
// Registro: manejado SOLO por auth.js
// ========================================

// ✅ RUTAS CORRECTAS PARA RENDER STATIC SITE
const ROUTES = {
  index: "/index.html",
  register: "/register.html",
  dashboard: "/dashboard.html",
};

// ========== LOGIN PAGE FUNCTIONS ==========

function scrollToLogin() {
  const loginSection = document.getElementById("login-section");
  if (loginSection) {
    loginSection.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!emailInput || !passwordInput) {
    showToast("Formulario de login inválido", "error");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showToast("Por favor completa todos los campos", "error");
    return;
  }

  if (!auth.isValidEmail(email)) {
    showToast("Ingresa un correo electrónico válido", "error");
    return;
  }

  const result = await auth.login(email, password);

  if (result.success) {
    showToast(result.message || "Login exitoso", "success");
    auth.markJustLoggedIn();

    setTimeout(() => {
      window.location.href = ROUTES.dashboard;
    }, 250);
  } else {
    showToast(result.message || "Error al iniciar sesión", "error");
  }
}

function handleRegister() {
  window.location.href = ROUTES.register;
}

// ========== LOGOUT (POPUP PRO SIN TOCAR dashboard.html) ==========

let logoutBound = false;

function injectLogoutPopupCSSOnce() {
  if (document.getElementById("logout-pop-css")) return;

  const style = document.createElement("style");
  style.id = "logout-pop-css";
  style.textContent = `
    /* Popup logout dentro del sidebar (estilo pro, tipo dropdown) */
    .logout-pop {
      position: absolute;
      left: 14px;
      bottom: 62px;
      width: 280px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.18);
      border: 1px solid rgba(0,0,0,0.08);
      z-index: 9999;
      overflow: hidden;
    }
    .logout-pop::before{
      content:"";
      position:absolute;
      left: 26px;
      bottom:-8px;
      width:16px;
      height:16px;
      background:#fff;
      border-left: 1px solid rgba(0,0,0,0.08);
      border-bottom: 1px solid rgba(0,0,0,0.08);
      transform: rotate(45deg);
    }
    .logout-pop-head{
      padding: 12px 14px;
      font-weight: 800;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .logout-pop-body{
      padding: 12px 14px;
      color:#555;
      font-size: .92rem;
      line-height: 1.35;
    }
    .logout-pop-actions{
      padding: 12px 14px;
      display:flex;
      gap:10px;
      justify-content:flex-end;
      border-top: 1px solid rgba(0,0,0,0.06);
      background: rgba(0,0,0,0.02);
    }
    .logout-pop-btn{
      border: none;
      border-radius: 10px;
      padding: 9px 12px;
      font-weight: 700;
      cursor:pointer;
    }
    .logout-pop-btn.secondary{ background:#f1f1f1; color:#222; }
    .logout-pop-btn.danger{ background:#f44336; color:#fff; }
    .logout-pop-btn:hover{ opacity:.92; }
    .logout-pop-btn:disabled{ opacity:.65; cursor:not-allowed; }
  `;
  document.head.appendChild(style);
}

function ensureLogoutPopup() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return null;

  // asegurar positioning para que absolute funcione bien
  const cs = getComputedStyle(sidebar);
  if (cs.position === "static") sidebar.style.position = "relative";

  let pop = document.getElementById("logoutPop");
  if (pop) return pop;

  pop = document.createElement("div");
  pop.id = "logoutPop";
  pop.className = "logout-pop";
  pop.hidden = true;
  pop.innerHTML = `
    <div class="logout-pop-head">Cerrar sesión</div>
    <div class="logout-pop-body">¿Seguro que deseas cerrar tu sesión?</div>
    <div class="logout-pop-actions">
      <button type="button" class="logout-pop-btn secondary" id="logoutCancelBtn">Cancelar</button>
      <button type="button" class="logout-pop-btn danger" id="logoutConfirmBtn">Cerrar sesión</button>
    </div>
  `;
  sidebar.appendChild(pop);
  return pop;
}

function openLogoutModal() {
  injectLogoutPopupCSSOnce();
  const pop = ensureLogoutPopup();

  // fallback ultra seguro
  if (!pop) {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      auth.logout().finally(() => (window.location.href = ROUTES.index));
    }
    return;
  }

  pop.hidden = false;
  document.getElementById("logoutConfirmBtn")?.focus();
}

function closeLogoutModal() {
  const pop = document.getElementById("logoutPop");
  if (!pop) return;
  pop.hidden = true;
}

function initLogoutModal() {
  if (logoutBound) return;
  logoutBound = true;

  // Solo en dashboard
  if (!document.querySelector(".dashboard-container")) return;

  injectLogoutPopupCSSOnce();
  ensureLogoutPopup();

  const sidebar = document.getElementById("sidebar");

  // Click afuera cierra (sin tocar el link del sidebar)
  document.addEventListener("click", (e) => {
    const pop = document.getElementById("logoutPop");
    if (!pop || pop.hidden) return;

    const clickedInsidePop = pop.contains(e.target);
    const clickedLogoutLink = e.target.closest?.(".sidebar-link.logout");

    // si clickeó el link "Cerrar sesión", NO cerramos acá (lo maneja handleLogout)
    if (clickedLogoutLink) return;

    // si clickeó dentro del popup, no cierres
    if (clickedInsidePop) return;

    // si clickeó dentro del sidebar pero fuera del pop => cerrar
    if (sidebar && sidebar.contains(e.target)) {
      closeLogoutModal();
      return;
    }

    // cualquier otro click => cerrar
    closeLogoutModal();
  });

  // ESC cierra
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLogoutModal();
  });

  // Botones (delegación)
  document.addEventListener("click", async (e) => {
    if (e.target?.id === "logoutCancelBtn") {
      e.preventDefault();
      e.stopPropagation();
      closeLogoutModal();
      return;
    }

    if (e.target?.id === "logoutConfirmBtn") {
      e.preventDefault();
      e.stopPropagation();

      const btn = e.target;
      btn.disabled = true;
      const prev = btn.textContent;
      btn.textContent = "Cerrando...";

      try {
        const result = await auth.logout();
        showToast(result?.message || "Sesión cerrada", "success");
      } catch (err) {
        console.error("Logout error:", err);
        showToast("No se pudo cerrar sesión, intenta nuevamente", "error");
        // si falla, no redirigimos
        btn.disabled = false;
        btn.textContent = prev || "Cerrar sesión";
        return;
      }

      closeLogoutModal();
      setTimeout(() => (window.location.href = ROUTES.index), 250);
    }
  });
}

function handleLogout() {
  // IMPORTANTE: esto es lo que llama tu HTML con onclick="handleLogout()"
  // Por eso, acá NO usamos preventDefault.
  const pop = ensureLogoutPopup();

  // fallback ultra seguro (si no hay sidebar por algún motivo)
  if (!pop) {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      auth.logout().finally(() => (window.location.href = ROUTES.index));
    }
    return;
  }

  // toggle
  if (pop.hidden) openLogoutModal();
  else closeLogoutModal();
}

// ========== DASHBOARD FUNCTIONS ==========

async function initDashboard() {
  const session = await auth.requireAuth({
    redirectTo: ROUTES.index,
    retries: 8,
    delayMs: 450,
    graceMs: 5000,
  });

  if (!session.ok) return;

  const user = session.user || null;
  if (!user) {
    window.location.href = ROUTES.index;
    return;
  }

  updateDashboardUserInfo(user);

  initNotifications(user);
  initWithdraw(user);
  initLogoutModal();

  if (typeof window.initTheoremReach === "function") {
    window.initTheoremReach();
  }
}

function updateDashboardUserInfo(user) {
  const firstName = user.firstName ?? user.first_name ?? "";
  const lastName = user.lastName ?? user.last_name ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || "Usuario";

  document.querySelectorAll(".user-name").forEach((el) => (el.textContent = fullName));

  if (user.balance !== undefined && user.balance !== null) {
    const bal = Number(user.balance);
    if (!Number.isNaN(bal)) {
      document.querySelectorAll(".user-balance, [data-balance]").forEach((el) => {
        el.textContent = `$${bal.toFixed(2)} USD`;
      });
    }
  }

  const totalEarned = user.totalEarned ?? user.total_earned;
  if (totalEarned !== undefined && totalEarned !== null) {
    const te = Number(totalEarned);
    if (!Number.isNaN(te)) {
      document.querySelectorAll("[data-total-earned]").forEach((el) => {
        el.textContent = `$${te.toFixed(2)}`;
      });
    }
  }

  const completedOffers = user.completedOffers ?? user.completed_offers;
  if (completedOffers !== undefined && completedOffers !== null) {
    document.querySelectorAll("[data-completed-offers]").forEach((el) => {
      el.textContent = completedOffers;
    });
  }
}

// ========== NOTIFICATIONS (PRO) ==========

function initNotifications(user) {
  const wrap = document.getElementById("notifWrap");
  const btn = document.getElementById("notifBtn");
  const dropdown = document.getElementById("notifDropdown");
  const list = document.getElementById("notifList");
  const badge = document.getElementById("notifBadge");

  const markAllBtn = document.getElementById("notifMarkAllBtn");
  const clearBtn = document.getElementById("notifClearBtn");
  const refreshBtn = document.getElementById("notifRefreshBtn");

  if (!wrap || !btn || !dropdown || !list || !badge) return;

  const key = `euroffersurv_notifications_${user.user_id || user.userId || "anon"}`;

  let items = safeJsonParse(localStorage.getItem(key)) || null;
  if (!items) {
    items = seedDemoNotifications(user);
    localStorage.setItem(key, JSON.stringify(items));
  }

  function computeUnreadCount() {
    return items.filter((n) => !n.read).length;
  }

  function render() {
    const unread = computeUnreadCount();
    badge.hidden = unread <= 0;
    badge.textContent = String(unread);

    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = `
        <div class="notif-empty">
          <div class="notif-empty-title">Sin notificaciones</div>
          <div class="notif-empty-sub">Cuando haya actividad, aparecerá aquí.</div>
        </div>
      `;
      return;
    }

    const sorted = [...items].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    for (const n of sorted) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `notif-item ${n.read ? "" : "unread"}`;
      el.innerHTML = `
        <span class="notif-dot" aria-hidden="true"></span>
        <span class="notif-body">
          <span class="notif-row">
            <span class="notif-item-title">${escapeHtml(n.title)}</span>
            <span class="notif-time">${formatRelativeTime(n.created_at)}</span>
          </span>
          <span class="notif-item-text">${escapeHtml(n.message)}</span>
        </span>
      `;

      el.addEventListener("click", () => {
        items = items.map((x) => (x.id === n.id ? { ...x, read: true } : x));
        localStorage.setItem(key, JSON.stringify(items));
        render();

        if (n.action && n.action.type === "link" && n.action.href) {
          window.location.href = n.action.href;
        }
      });

      list.appendChild(el);
    }
  }

  function open() {
    dropdown.hidden = false;
    btn.setAttribute("aria-expanded", "true");
  }

  function close() {
    dropdown.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  }

  function toggle() {
    if (dropdown.hidden) open();
    else close();
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggle();
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  markAllBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    items = items.map((x) => ({ ...x, read: true }));
    localStorage.setItem(key, JSON.stringify(items));
    render();
  });

  clearBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    items = [];
    localStorage.setItem(key, JSON.stringify(items));
    render();
  });

  refreshBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    render();
    showToast("Notificaciones actualizadas", "success");
  });

  render();
}

function seedDemoNotifications(user) {
  const name = user.firstName || user.first_name || "Usuario";
  const now = Date.now();

  return [
    {
      id: cryptoId(),
      title: "Bienvenido",
      message: `Hola ${name}, tu cuenta está lista. ¡Puedes comenzar a completar ofertas!`,
      read: false,
      created_at: new Date(now - 60_000).toISOString(),
      action: { type: "link", href: ROUTES.dashboard },
    },
    {
      id: cryptoId(),
      title: "Consejo",
      message: "Completa encuestas cortas primero para aumentar la disponibilidad de ofertas.",
      read: false,
      created_at: new Date(now - 15 * 60_000).toISOString(),
    },
    {
      id: cryptoId(),
      title: "Seguridad",
      message: "Nunca compartas tu contraseña. Nuestro equipo nunca te la pedirá.",
      read: true,
      created_at: new Date(now - 2 * 60 * 60_000).toISOString(),
    },
  ];
}

function cryptoId() {
  try {
    return crypto.randomUUID();
  } catch {
    return "id_" + Math.random().toString(16).slice(2);
  }
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatRelativeTime(iso) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

// ========== WITHDRAW (placeholder pro) ==========

function initWithdraw(user) {
  const btn = document.getElementById("withdrawBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const bal = Number(user.balance ?? 0);
    if (!bal || bal < 1) {
      showToast("Aún no tienes balance suficiente para retirar", "error");
      return;
    }
    showToast("Función de retiro: pendiente de integrar pasarela/método", "info");
  });
}

// ========== UI HELPERS ==========

function toggleSidebar() {
  document.getElementById("sidebar")?.classList.toggle("active");
}

function initMenuToggle() {
  document.getElementById("menuToggle")?.addEventListener("click", toggleSidebar);
}

function closeSidebarOnOutsideClick(event) {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("menuToggle");

  if (window.innerWidth <= 768 && sidebar?.classList.contains("active")) {
    if (!sidebar.contains(event.target) && !toggle.contains(event.target)) {
      sidebar.classList.remove("active");
    }
  }
}

// ========== PASSWORD STRENGTH (REGISTER) ==========

function initPasswordStrength() {
  const pass = document.getElementById("password");
  const strengthTextEl = document.getElementById("strengthText");
  const strengthWrap = document.querySelector(".password-strength");
  const bar = document.querySelector(".password-strength .strength-bar");

  if (!pass || !strengthTextEl || !strengthWrap || !bar) return;

  strengthWrap.querySelectorAll(".pw-strength-extra").forEach((n) => n.remove());
  if (bar.querySelector(".strength-shine")) bar.querySelector(".strength-shine").remove();

  strengthWrap.style.display = "grid";
  strengthWrap.style.gap = "8px";
  strengthWrap.style.marginTop = "10px";

  let track = strengthWrap.querySelector(".pw-track");
  if (!track) {
    track = document.createElement("div");
    track.className = "pw-track";
    strengthWrap.insertBefore(track, bar);
    track.appendChild(bar);
  }

  track.style.height = "8px";
  track.style.borderRadius = "999px";
  track.style.background = "rgba(0,0,0,0.10)";
  track.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.12)";
  track.style.overflow = "hidden";

  bar.style.height = "100%";
  bar.style.width = "0%";
  bar.style.borderRadius = "999px";
  bar.style.transition = "width 220ms ease, background-color 220ms ease, filter 220ms ease";
  bar.style.filter = "saturate(1.15)";

  strengthTextEl.style.fontWeight = "700";
  strengthTextEl.style.transition = "color 180ms ease";

  function scorePassword(p) {
    let score = 0;
    if (!p) return 0;
    if (p.length >= 8) score += 1;
    if (p.length >= 12) score += 1;
    if (/[a-z]/.test(p)) score += 1;
    if (/[A-Z]/.test(p)) score += 1;
    if (/\d/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;
    if (p.length < 6) score = Math.min(score, 1);
    return Math.min(score, 5);
  }

  function mapStrength(score) {
    if (score <= 1) return { label: "Débil", width: 25, color: "#ef4444" };
    if (score === 2) return { label: "Regular", width: 50, color: "#f97316" };
    if (score === 3) return { label: "Media", width: 70, color: "#eab308" };
    return { label: "Fuerte", width: 100, color: "#22c55e" };
  }

  let lastLabel = "";
  function render() {
    const s = scorePassword(pass.value);
    const v = mapStrength(s);

    strengthTextEl.textContent = v.label;
    strengthTextEl.style.color = v.color;

    bar.style.backgroundColor = v.color;
    bar.style.width = `${pass.value ? v.width : 0}%`;

    if (v.label !== lastLabel) {
      bar.animate([{ opacity: 0.85 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
      lastLabel = v.label;
    }
  }

  pass.addEventListener("input", render);
  render();
}

// ========== INIT ==========

document.addEventListener("DOMContentLoaded", () => {
  // LOGIN
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    if (auth.redirectIfAuthenticated) auth.redirectIfAuthenticated(ROUTES.dashboard);
    loginForm.addEventListener("submit", handleLogin);
  }

  // REGISTRO
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    if (auth.redirectIfAuthenticated) auth.redirectIfAuthenticated(ROUTES.dashboard);
    initPasswordStrength();
  }

  // DASHBOARD
  if (document.querySelector(".dashboard-container")) {
    initDashboard();
    initMenuToggle();
    initLogoutModal();
  }

  document.addEventListener("click", closeSidebarOnOutsideClick);

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      document.getElementById("sidebar")?.classList.remove("active");
    }
  });

  console.log("EurOffersurv app initialized successfully");
});

// ========== TOAST ==========

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: ${type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#2196f3"};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-family: sans-serif;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ========== TOGGLE PASSWORD (REGISTER/LOGIN) ==========

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const wrapper = input.closest(".password-input");
  const btn = wrapper ? wrapper.querySelector(".toggle-password") : null;

  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";

  if (btn) {
    btn.textContent = "👁️";
    btn.setAttribute("aria-label", isHidden ? "Ocultar contraseña" : "Mostrar contraseña");
    btn.setAttribute("aria-pressed", String(isHidden));
  }

  try {
    input.focus({ preventScroll: true });
    const len = input.value.length;
    input.setSelectionRange(len, len);
  } catch (_) {}
}

// ========== EXPORTS ==========
window.scrollToLogin = scrollToLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.togglePassword = togglePassword;
