// ========================================
// APP PRINCIPAL - EUROFFERSURV
// Maneja UI, login y dashboard
// Registro: manejado SOLO por auth.js
// ========================================

// ✅ Base del backend en producción (Render)
const API_ORIGIN = "https://euroffersurv-api.onrender.com";
const API_BASE = `${API_ORIGIN}/api`;

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
    setTimeout(() => {
      window.location.href = "/dashboard.html";
    }, 300);
  } else {
    showToast(result.message || "Error al iniciar sesión", "error");
  }
}

function handleRegister() {
  window.location.href = "/register.html";
}

// ========== LOGOUT (MODAL PRO) ==========

let logoutModalBound = false;

function openLogoutModal() {
  const modal = document.getElementById("logoutModal");
  if (!modal) {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      auth.logout().finally(() => {
        window.location.href = "/index.html";
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
        window.location.href = "/index.html";
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
  // ✅ rutas correctas en Render
  const allowed = await (auth.requireAuth ? auth.requireAuth("/index.html") : Promise.resolve(true));
  if (!allowed) return;

  const user = await resolveCurrentUser();
  if (!user) {
    window.location.href = "/index.html";
    return;
  }

  updateDashboardUserInfo(user);
  console.log("Datos del usuario cargados:", user);

  initNotifications(user);
  initWithdraw(user);
  initLogoutModal();

  if (typeof window.initTheoremReach === "function") {
    window.initTheoremReach();
  }
}

async function resolveCurrentUser() {
  // 1) Mejor vía: auth.getCurrentUser (si usa API_BASE correcto en auth.js)
  if (auth.getCurrentUser) {
    try {
      const u = await auth.getCurrentUser();
      if (u) return normalizeUser(u);
    } catch (e) {
      console.warn("auth.getCurrentUser falló:", e);
    }
  }

  // 2) Fallback: pedir al backend directamente (Render)
  try {
    const res = await fetch(`${API_BASE}/user-data.php`, { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.user) return normalizeUser(data.user);
  } catch (e) {
    console.warn(`Fetch ${API_BASE}/user-data.php falló:`, e);
  }

  return null;
}

function normalizeUser(user) {
  if (!user || typeof user !== "object") return user;

  if (user.first_name && !user.firstName) user.firstName = user.first_name;
  if (user.last_name && !user.lastName) user.lastName = user.last_name;

  if (user.total_earned !== undefined && user.totalEarned === undefined) {
    user.totalEarned = user.total_earned;
  }

  if (user.completed_offers !== undefined && user.completedOffers === undefined) {
    user.completedOffers = user.completed_offers;
  }

  return user;
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
      action: { type: "link", href: "/dashboard.html" } // ✅ ruta correcta
    },
    {
      id: cryptoId(),
      title: "Consejo",
      message: "Completa encuestas cortas primero para aumentar la disponibilidad de ofertas.",
      read: false,
      created_at: new Date(now - 15 * 60_000).toISOString()
    },
    {
      id: cryptoId(),
      title: "Seguridad",
      message: "Nunca compartas tu contraseña. Nuestro equipo nunca te la pedirá.",
      read: true,
      created_at: new Date(now - 2 * 60 * 60_000).toISOString()
    }
  ];
}

function cryptoId() {
  try { return crypto.randomUUID(); }
  catch { return "id_" + Math.random().toString(16).slice(2); }
}

function safeJsonParse(s) {
  try { return JSON.parse(s); } catch { return null; }
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

// ========== INIT ==========

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    auth.redirectIfAuthenticated?.("/dashboard.html"); // ✅ ruta correcta
    loginForm.addEventListener("submit", handleLogin);
  }

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    auth.redirectIfAuthenticated?.("/dashboard.html"); // ✅ ruta correcta
  }

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

// ========== EXPORTS ==========

window.scrollToLogin = scrollToLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
