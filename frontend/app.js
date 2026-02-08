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

    // ✅ IMPORTANTE: marca "login reciente" para evitar el rebote del dashboard
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

// ========== LOGOUT (MODAL PRO) ==========

let logoutModalBound = false;

function openLogoutModal() {
  const modal = document.getElementById("logoutModal");
  if (!modal) {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      auth.logout().finally(() => {
        window.location.href = ROUTES.index;
      });
    }
    return;
  }

  modal.hidden = false;
  document.getElementById("logoutConfirmBtn")?.focus();
}

function closeLogoutModal() {
  const modal = document.getElementById("logoutModal");
  if (!modal) return;
  modal.hidden = true;
}

function initLogoutModal() {
  if (logoutModalBound) return;
  logoutModalBound = true;

  const modal = document.getElementById("logoutModal");
  const cancelBtn = document.getElementById("logoutCancelBtn");
  const closeBtn = document.getElementById("logoutCloseBtn");
  const confirmBtn = document.getElementById("logoutConfirmBtn");

  if (!modal || !cancelBtn || !closeBtn || !confirmBtn) return;

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeLogoutModal();
  });

  cancelBtn.addEventListener("click", closeLogoutModal);
  closeBtn.addEventListener("click", closeLogoutModal);

  document.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") closeLogoutModal();
  });

  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;
    const prevText = confirmBtn.textContent;
    confirmBtn.textContent = "Cerrando...";

    try {
      const result = await auth.logout();
      showToast(result.message || "Sesión cerrada", "success");
    } catch (e) {
      console.error("Logout error:", e);
      showToast("No se pudo cerrar sesión, intenta nuevamente", "error");
    } finally {
      closeLogoutModal();
      setTimeout(() => {
        window.location.href = ROUTES.index;
      }, 250);

      confirmBtn.disabled = false;
      confirmBtn.textContent = prevText || "Sí, cerrar sesión";
    }
  });
}

async function handleLogout() {
  openLogoutModal();
}

// ========== DASHBOARD FUNCTIONS ==========

async function initDashboard() {
  // ✅ FIX CLAVE: NO redirigir inmediatamente.
  // Hacemos reintentos reales contra backend para evitar el "me bota".
  // Si hay login reciente, damos un "grace period" para que la cookie/sesión quede lista.
  const session = await auth.requireAuth({
    redirectTo: ROUTES.index,
    retries: 8,        // ~8 intentos
    delayMs: 450,      // cada 450ms -> ~3.6s total
    graceMs: 5000      // si vienes de login reciente, hasta 5s sin botar
  });

  if (!session.ok) return;

  const user = session.user || null;
  if (!user) {
    // fallback ultra defensivo (no debería pasar)
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

  // balance
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

// ========== PASSWORD STRENGTH (REGISTER) ==========
function initPasswordStrength() {
  const pass = document.getElementById("password");
  const strengthTextEl = document.getElementById("strengthText");
  const bar = document.querySelector(".password-strength .strength-bar");

  if (!pass || !strengthTextEl || !bar) return;

  // Track (contenedor de la barra)
  const track = bar.parentElement;

  // Estética PRO: track + barra
  if (track) {
    track.style.background = "linear-gradient(90deg, rgba(0,0,0,0.08), rgba(0,0,0,0.04))";
    track.style.borderRadius = "999px";
    track.style.padding = "3px";
    track.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.10)";
    track.style.overflow = "hidden";
  }

  bar.style.height = "10px";
  bar.style.width = "0%";
  bar.style.borderRadius = "999px";
  bar.style.transition = "width 260ms cubic-bezier(.2,.8,.2,1), filter 260ms ease";
  bar.style.boxShadow = "0 6px 14px rgba(0,0,0,0.10)";
  bar.style.filter = "saturate(1.15)";

  // Badge PRO para el texto (sin cambiar el HTML)
  strengthTextEl.style.display = "inline-block";
  strengthTextEl.style.padding = "2px 10px";
  strengthTextEl.style.borderRadius = "999px";
  strengthTextEl.style.fontWeight = "700";
  strengthTextEl.style.fontSize = "0.85rem";
  strengthTextEl.style.letterSpacing = "0.2px";
  strengthTextEl.style.transition = "color 220ms ease, background-color 220ms ease, transform 220ms ease";

  // Shine (brillito animado encima de la barra)
  let shine = bar.querySelector(".strength-shine");
  if (!shine) {
    shine = document.createElement("span");
    shine.className = "strength-shine";
    shine.style.cssText = `
      position:absolute;
      top:0; left:-40%;
      height:100%;
      width:40%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
      transform: skewX(-20deg);
      opacity: 0;
      pointer-events:none;
    `;
    bar.style.position = "relative";
    bar.appendChild(shine);
  }

  function scorePassword(p) {
    let score = 0;
    if (!p) return 0;

    // longitud
    if (p.length >= 8) score += 1;
    if (p.length >= 12) score += 1;

    // variedad
    if (/[a-z]/.test(p)) score += 1;
    if (/[A-Z]/.test(p)) score += 1;
    if (/\d/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;

    // penaliza si es muy corta
    if (p.length < 6) score = Math.min(score, 1);

    return Math.min(score, 5);
  }

  function palette(level) {
    // base + un segundo color para gradiente
    if (level <= 1) return { label: "Débil", width: 22, c1: "#ef4444", c2: "#fb7185", badgeBg: "rgba(239,68,68,0.12)" };
    if (level === 2) return { label: "Regular", width: 46, c1: "#f97316", c2: "#f59e0b", badgeBg: "rgba(249,115,22,0.14)" };
    if (level === 3) return { label: "Media", width: 66, c1: "#eab308", c2: "#fde047", badgeBg: "rgba(234,179,8,0.16)" };
    if (level === 4) return { label: "Fuerte", width: 85, c1: "#22c55e", c2: "#86efac", badgeBg: "rgba(34,197,94,0.14)" };
    return { label: "Muy fuerte", width: 100, c1: "#16a34a", c2: "#4ade80", badgeBg: "rgba(22,163,74,0.14)" };
  }

  function runShine() {
    // animación del brillito
    shine.animate(
      [
        { left: "-40%", opacity: 0 },
        { left: "10%", opacity: 0.55 },
        { left: "120%", opacity: 0 }
      ],
      { duration: 520, easing: "ease-out" }
    );
  }

  let lastLabel = "";
  function renderStrength() {
    const level = scorePassword(pass.value);
    const p = palette(level);

    // barra con gradiente
    bar.style.background = `linear-gradient(90deg, ${p.c1}, ${p.c2})`;
    bar.style.width = `${p.width}%`;

    // badge + color de texto
    strengthTextEl.textContent = p.label;
    strengthTextEl.style.color = p.c1;
    strengthTextEl.style.backgroundColor = p.badgeBg;

    // micro “pop” solo cuando cambia de nivel
    if (p.label !== lastLabel) {
      strengthTextEl.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }],
        { duration: 220, easing: "ease-out" }
      );
      runShine();
      lastLabel = p.label;
    }
  }

  pass.addEventListener("input", renderStrength);
  renderStrength();
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

    // ✅ activa el medidor de seguridad en register.html
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

// ========== TOGGLE PASSWORD (REGISTER) ==========
// Muestra/oculta la contraseña para inputs como #password y #confirmPassword
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const wrapper = input.closest(".password-input");
  const btn = wrapper ? wrapper.querySelector(".toggle-password") : null;

  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";

  if (btn) {
    // ✅ ahora sí cambia
    btn.textContent = isHidden ? "👁️" : "👁️";
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
