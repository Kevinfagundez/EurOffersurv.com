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
  encuestas: "/encuestas.html", // 🆕 Nueva ruta para TimeWall
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

// ========== COMING SOON LINKS (Contacto / FAQ) ==========

function initComingSoonLinks() {
  const links = document.querySelectorAll("a.coming-soon");
  if (!links.length) return;

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const feature = link.dataset.feature || "Esta sección";
      showToast(`${feature} estará disponible próximamente 🚧`, "info");
    });
  });
}

// ========== LOGOUT (POPUP PRO EN SIDEBAR) ==========

let logoutBound = false;

function openLogoutModal() {
  const pop = document.getElementById("logoutPop");

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

  document.addEventListener("click", (e) => {
    if (pop.hidden) return;
    const inside = pop.contains(e.target);
    const clickedLogout = e.target.closest?.(".sidebar-link.logout");
    if (inside || clickedLogout) return;
    closeLogoutModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLogoutModal();
  });
}

async function handleLogout() {
  const pop = document.getElementById("logoutPop");
  if (!pop) return openLogoutModal();
  pop.hidden ? openLogoutModal() : closeLogoutModal();
}

// ========== SIDEBAR NAV ==========

function navigateTo(section) {
  if (section === "encuestas") {
    if (window.location.pathname !== ROUTES.encuestas) {
      window.location.href = ROUTES.encuestas;
    }
    return;
  }

  if (section === "inicio") {
    if (window.location.pathname !== ROUTES.dashboard) {
      window.location.href = ROUTES.dashboard;
    }
    return;
  }

  if (section === "ofertas") {
    alert("Descubre nuestros socios próximamente..");
    return;
  }

  if (section === "recompensas") {
    alert("Necesitas llegar al retiro minimo $5");
    return;
  }

  if (section === "soporte") {
    alert("¿Tienes dudas? Escribe a admin@euroffersurv.com");
    return;
  }
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
    updateSidebarActive();
  }

  // 🆕 COMING SOON LINKS
  initComingSoonLinks();

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
window.togglePassword = togglePassword;
window.navigateTo = navigateTo;
