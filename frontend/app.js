// ========================================
// APP PRINCIPAL - EUROFFERSURV
// ========================================

// ✅ RUTAS
const ROUTES = {
  index: "/index.html",
  register: "/register.html",
  dashboard: "/dashboard.html",
  encuestas: "/encuestas.html",
};

// ========================================
// LOGIN
// ========================================

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

  if (!auth?.isValidEmail?.(email)) {
    showToast("Ingresa un correo electrónico válido", "error");
    return;
  }

  const result = await auth.login(email, password);

  if (result.success) {
    showToast(result.message || "Login exitoso", "success");
    auth.markJustLoggedIn?.();
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

// ========================================
// COMING SOON
// ========================================

function initComingSoonLinks() {
  const links = document.querySelectorAll("a.coming-soon");
  if (!links.length) return;

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const feature = link.dataset.feature || "Esta sección";
      showToast(`${feature} estará disponible próximamente `, "info");
    });
  });
}

// ========================================
// TOAST
// ========================================

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.textContent = message;

  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: ${
      type === "success"
        ? "#4caf50"
        : type === "error"
        ? "#f44336"
        : "#2196f3"
    };
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

// ========================================
// INIT GLOBAL SEGURO
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  try {
    // LOGIN
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      auth?.redirectIfAuthenticated?.(ROUTES.dashboard);
      loginForm.addEventListener("submit", handleLogin);
    }

    // REGISTER
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
      auth?.redirectIfAuthenticated?.(ROUTES.dashboard);

      if (typeof initPasswordStrength === "function") {
        initPasswordStrength();
      }
    }

    // DASHBOARD
    if (document.querySelector(".dashboard-container")) {
      if (typeof initDashboard === "function") initDashboard();
      if (typeof initMenuToggle === "function") initMenuToggle();
      if (typeof initLogoutModal === "function") initLogoutModal();
      if (typeof updateSidebarActive === "function") updateSidebarActive();
    }

    // COMING SOON (SIEMPRE)
    initComingSoonLinks();

    console.log("EurOffersurv app initialized successfully");
  } catch (err) {
    console.error("Init error:", err);
  }
});

// ========================================
// EXPORTS
// ========================================

window.scrollToLogin = scrollToLogin;
window.handleRegister = handleRegister;
window.handleLogout = window.handleLogout;
window.togglePassword = window.togglePassword;
window.navigateTo = window.navigateTo;
