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
  encuestas: "/encuestas.html", // TimeWall
  ofertas: "/ofertas.html", // 🆕 Wannads
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

// ========== LOGOUT (POPUP PRO EN SIDEBAR) ==========

let logoutBound = false;

function openLogoutModal() {
  const pop = document.getElementById("logoutPop");

  // fallback si por algo no existe el popup en el HTML
  if (!pop) {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      auth.logout().finally(() => (window.location.href = ROUTES.index));
    }
    return;
  }

  pop.hidden = false;
}

function closeLogoutModal() {
  const pop = document.getElementById("logoutPop");
  if (!pop) return;
  pop.hidden = true;
}

function initLogoutModal() {
  if (logoutBound) return;
  logoutBound = true;

  const pop = document.getElementById("logoutPop");
  const cancelBtn = document.getElementById("logoutCancelBtn");
  const confirmBtn = document.getElementById("logoutConfirmBtn");
  const sidebar = document.getElementById("sidebar");
  const logoutLink = document.querySelector(".sidebar-link.logout");

  // Si no existe el popup, igual dejamos el fallback por confirm cuando toquen el link
  if (!pop || !cancelBtn || !confirmBtn) {
    logoutLink?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        auth.logout().finally(() => (window.location.href = ROUTES.index));
      }
    });
    return;
  }

  // ✅ Esto garantiza que funcione incluso si el inline onclick falla
  logoutLink?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLogout();
  });

  cancelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeLogoutModal();
  });

  confirmBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    confirmBtn.disabled = true;
    const prev = confirmBtn.textContent;
    confirmBtn.textContent = "Cerrando...";

    try {
      const result = await auth.logout();
      showToast(result?.message || "Sesión cerrada", "success");
      closeLogoutModal();
      setTimeout(() => (window.location.href = ROUTES.index), 250);
    } catch (err) {
      console.error("Logout error:", err);
      showToast("No se pudo cerrar sesión, intenta nuevamente", "error");
      confirmBtn.disabled = false;
      confirmBtn.textContent = prev || "Cerrar sesión";
    }
  });

  // click afuera cierra
  document.addEventListener("click", (e) => {
    if (pop.hidden) return;

    const inside = pop.contains(e.target);
    const clickedLogout = e.target.closest?.(".sidebar-link.logout");
    if (inside || clickedLogout) return;

    if (sidebar && sidebar.contains(e.target)) {
      closeLogoutModal();
      return;
    }

    closeLogoutModal();
  });

  // ESC cierra
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLogoutModal();
  });
}

async function handleLogout() {
  const pop = document.getElementById("logoutPop");
  if (!pop) return openLogoutModal();
  pop.hidden ? openLogoutModal() : closeLogoutModal();
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

  // 🆕 Actualizar estadísticas de encuestas (TimeWall)
  const completedSurveys = user.completedSurveys ?? user.completed_surveys;
  if (completedSurveys !== undefined && completedSurveys !== null) {
    document.querySelectorAll("[data-completed-surveys]").forEach((el) => {
      el.textContent = completedSurveys;
    });
  }

  const surveyEarnings = user.surveyEarnings ?? user.survey_earnings;
  if (surveyEarnings !== undefined && surveyEarnings !== null) {
    const se = Number(surveyEarnings);
    if (!Number.isNaN(se)) {
      document.querySelectorAll("[data-survey-earnings]").forEach((el) => {
        el.textContent = `$${se.toFixed(2)}`;
      });
    }
  }

  // 🆕 Actualizar estadísticas de Wannads
  const wannadsEarnings = user.wannadsEarnings ?? user.wannads_earnings;
  if (wannadsEarnings !== undefined && wannadsEarnings !== null) {
    const we = Number(wannadsEarnings);
    if (!Number.isNaN(we)) {
      document.querySelectorAll("[data-wannads-earnings]").forEach((el) => {
        el.textContent = `$${we.toFixed(2)}`;
      });
    }
  }
}

// ========== SIDEBAR NAV (NAVEGACIÓN ACTUALIZADA) ==========
// 🆕 ACTUALIZADO: Navegación completa incluyendo Wannads
function navigateTo(section) {
  console.log('[Navigation] Navegando a:', section);

  // 🆕 Encuestas - TimeWall
  if (section === "encuestas") {
    if (window.location.pathname === ROUTES.encuestas) {
      console.log('[Navigation] Ya estás en la página de encuestas');
      return;
    }
    window.location.href = ROUTES.encuestas;
    return;
  }

  // 🆕 Ofertas - Wannads
  if (section === "ofertas") {
    if (window.location.pathname === ROUTES.ofertas) {
      console.log('[Navigation] Ya estás en la página de ofertas');
      return;
    }
    window.location.href = ROUTES.ofertas;
    return;
  }

  // Inicio - Dashboard con TheoremReach
  if (section === "inicio") {
    if (window.location.pathname === ROUTES.dashboard) {
      console.log('[Navigation] Ya estás en el dashboard');
      return;
    }
    window.location.href = ROUTES.dashboard;
    return;
  }

  // Recompensas - requiere balance mínimo
  if (section === "recompensas") {
    alert("Necesitas llegar al retiro minimo $5");
    return;
  }

  // Soporte - contacto
  if (section === "soporte") {
    alert("¿Tienes dudas? Escribe a admin@euroffersurv.com");
    return;
  }

  console.warn('[Navigation] Sección no reconocida:', section);
}

// 🆕 Función para actualizar el estado activo del sidebar
function updateSidebarActive() {
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll('.sidebar-link');

  // Remover clase active de todos los links
  sidebarLinks.forEach(link => {
    link.classList.remove('active');
  });

  // Determinar qué link debe estar activo
  let activeSection = 'inicio';
  
  if (currentPath.includes('encuestas.html')) {
    activeSection = 'encuestas';
  } else if (currentPath.includes('ofertas.html')) {
    activeSection = 'ofertas';
  } else if (currentPath.includes('dashboard.html') || currentPath === '/') {
    activeSection = 'inicio';
  }

  // Marcar el link correcto como activo
  sidebarLinks.forEach(link => {
    const onclick = link.getAttribute('onclick');
    if (onclick && onclick.includes(`'${activeSection}'`)) {
      link.classList.add('active');
    }
  });

  console.log('[Navigation] Sidebar activo actualizado:', activeSection);
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
    updateSidebarActive(); // 🆕 Actualizar sidebar en cada carga
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
window.navigateTo = navigateTo;