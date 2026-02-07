// ========================================
// SISTEMA DE AUTENTICACIÓN - EUROFFERSURV
// Frontend JS conectado a Backend PHP
// ========================================

// 🔴 BACKEND REAL EN PRODUCCIÓN
window.EUR_API_BASE = window.EUR_API_BASE || "https://euroffersurv-api.onrender.com/api";
const API_BASE = window.EUR_API_BASE;

class AuthSystem {
  constructor() {
    this.API_BASE = API_BASE;
    this.KEY_LOGGED = "euroffersurv_logged_in";
    this.KEY_UID = "euroffersurv_user_id";
    this.KEY_JUST_LOGGED_AT = "euroffersurv_just_logged_at";
  }

  // =========================
  // UTIL
  // =========================
  markJustLoggedIn() {
    try {
      localStorage.setItem(this.KEY_JUST_LOGGED_AT, String(Date.now()));
    } catch {}
  }

  wasJustLoggedIn(withinMs = 5000) {
    try {
      const t = Number(localStorage.getItem(this.KEY_JUST_LOGGED_AT) || 0);
      if (!t) return false;
      return Date.now() - t <= withinMs;
    } catch {
      return false;
    }
  }

  setLocalAuth(userId) {
    try {
      localStorage.setItem(this.KEY_LOGGED, "true");
      if (userId !== undefined && userId !== null) {
        localStorage.setItem(this.KEY_UID, String(userId));
      }
    } catch {}
  }

  clearLocalAuth() {
    try {
      localStorage.removeItem(this.KEY_LOGGED);
      localStorage.removeItem(this.KEY_UID);
      localStorage.removeItem(this.KEY_JUST_LOGGED_AT);
    } catch {}
  }

  // =========================
  // REGISTRO
  // =========================
  async register(userData) {
    try {
      const response = await fetch(`${this.API_BASE}/register.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      const text = await response.text();

      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("Respuesta inválida del servidor:", text);
        return { success: false, message: "Error interno del servidor" };
      }

      return result;
    } catch (error) {
      console.error("Error de conexión:", error);
      return { success: false, message: "No se pudo conectar con el servidor" };
    }
  }

  // =========================
  // LOGIN
  // =========================
  async login(email, password) {
    try {
      const response = await fetch(`${this.API_BASE}/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();

      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("Respuesta inválida del servidor:", text);
        return { success: false, message: "Respuesta inválida del servidor" };
      }

      if (result.success) {
        const uid = result?.user?.user_id ?? result?.user?.userId ?? null;
        this.setLocalAuth(uid);
        this.markJustLoggedIn();
      }

      return result;
    } catch (error) {
      console.error("Error en login:", error);
      return { success: false, message: "Error de conexión" };
    }
  }

  // =========================
  // LOGOUT
  // =========================
  async logout() {
    try {
      await fetch(`${this.API_BASE}/logout.php`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.warn("Logout con error, limpiando localStorage");
    }

    this.clearLocalAuth();
    return { success: true };
  }

  // =========================
  // SESIÓN REAL (BACKEND)
  // =========================
  async getCurrentUserOnce() {
    try {
      const response = await fetch(`${this.API_BASE}/check-session.php`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) return null;

      const result = await response.json();
      return result && result.authenticated ? result.user : null;
    } catch (e) {
      return null;
    }
  }

  async getCurrentUserWithRetry({ retries = 6, delayMs = 400 } = {}) {
    for (let i = 0; i < retries; i++) {
      const user = await this.getCurrentUserOnce();
      if (user) return user;
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return null;
  }

  async isAuthenticated() {
    const user = await this.getCurrentUserOnce();
    return !!user;
  }

  getUserId() {
    try {
      return localStorage.getItem(this.KEY_UID);
    } catch {
      return null;
    }
  }

  // =========================
  // VALIDACIONES
  // =========================
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidPassword(password) {
    return password && password.length >= 8;
  }

  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  // =========================
  // REDIRECCIONES
  // =========================
  async redirectIfAuthenticated(redirectTo = "/dashboard.html") {
    const user = await this.getCurrentUserWithRetry({ retries: 2, delayMs: 200 });
    if (user) {
      this.setLocalAuth(user.user_id);
      window.location.href = redirectTo;
      return true;
    }

    this.clearLocalAuth();
    return false;
  }

  /**
   * ✅ FIX CLAVE para el "ME BOTA"
   * - Reintenta sesión real varios segundos.
   * - Si venís de un login reciente, NO te bota enseguida (grace period).
   * - Si aun así no hay sesión: limpia y redirige.
   */
  async requireAuth({ redirectTo = "/index.html", retries = 8, delayMs = 450, graceMs = 5000 } = {}) {
    // Si viene de login reciente, damos margen sin botar
    const grace = this.wasJustLoggedIn(graceMs);

    const user = await this.getCurrentUserWithRetry({ retries, delayMs });

    if (user) {
      this.setLocalAuth(user.user_id);
      return { ok: true, user };
    }

    // Si no hay sesión pero hay "logged_in" local y estaba dentro del grace, evitamos el bote inmediato:
    // permitimos unos ms extra de reintento.
    const localLogged = (() => {
      try {
        return localStorage.getItem(this.KEY_LOGGED) === "true";
      } catch {
        return false;
      }
    })();

    if (grace && localLogged) {
      const extra = await this.getCurrentUserWithRetry({ retries: 6, delayMs: 500 });
      if (extra) {
        this.setLocalAuth(extra.user_id);
        return { ok: true, user: extra };
      }
    }

    // Si llegamos acá: sesión no existe / no viaja -> botar
    this.clearLocalAuth();
    window.location.href = redirectTo;
    return { ok: false, user: null };
  }
}

// =========================
// INSTANCIA GLOBAL
// =========================
const auth = new AuthSystem();
window.auth = auth;

// =========================
// FORMULARIO DE REGISTRO
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userData = {
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      birthDate: document.getElementById("birthDate").value,
      newsletter: document.getElementById("newsletter")?.checked || false,
    };

    if (!auth.isValidEmail(userData.email)) {
      alert("Email inválido");
      return;
    }

    if (!auth.isValidPassword(userData.password)) {
      alert("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (auth.calculateAge(userData.birthDate) < 18) {
      alert("Debes ser mayor de 18 años");
      return;
    }

    const result = await auth.register(userData);

    if (result.success) {
      alert("Registro exitoso");
      window.location.href = "/index.html";
    } else {
      alert(result.message || "Error desconocido");
    }
  });
});
