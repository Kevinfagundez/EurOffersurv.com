// ========================================
// SISTEMA DE AUTENTICACIÓN - EUROFFERSURV
// Frontend JS conectado a Backend PHP
// ========================================

// 🔴 BACKEND REAL EN PRODUCCIÓN
window.EUR_API_BASE = window.EUR_API_BASE || "https://euroffersurv-api.onrender.com/api";
const API_BASE = window.EUR_API_BASE;

class AuthSystem {
    constructor() {
        // 🔴 FIX CLAVE: usar el API_BASE real
        this.API_BASE = API_BASE;
    }

    // =========================
    // REGISTRO
    // =========================
    async register(userData) {
        try {
            const response = await fetch(`${this.API_BASE}/register.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(userData)
            });

            const text = await response.text();

            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('Respuesta inválida del servidor:', text);
                return { success: false, message: 'Error interno del servidor' };
            }

            return result;
        } catch (error) {
            console.error('Error de conexión:', error);
            return { success: false, message: 'No se pudo conectar con el servidor' };
        }
    }

    // =========================
    // LOGIN
    // =========================
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_BASE}/login.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('Respuesta inválida del servidor:', text);
                return { success: false, message: 'Respuesta inválida del servidor' };
            }

            if (result.success) {
                localStorage.setItem('euroffersurv_logged_in', 'true');
                localStorage.setItem('euroffersurv_user_id', result.user.user_id);
            }

            return result;
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, message: 'Error de conexión' };
        }
    }

    // =========================
    // LOGOUT
    // =========================
    async logout() {
        try {
            await fetch(`${this.API_BASE}/logout.php`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (e) {
            console.warn('Logout con error, limpiando localStorage');
        }

        localStorage.removeItem('euroffersurv_logged_in');
        localStorage.removeItem('euroffersurv_user_id');

        return { success: true };
    }

    // =========================
    // SESIÓN REAL (BACKEND)
    // =========================
    async getCurrentUser() {
        try {
            const response = await fetch(`${this.API_BASE}/check-session.php`, {
                credentials: 'include'
            });

            if (!response.ok) return null;

            const result = await response.json();
            return result.authenticated ? result.user : null;
        } catch (e) {
            return null;
        }
    }

    async isAuthenticated() {
        const user = await this.getCurrentUser();
        return !!user;
    }

    getUserId() {
        return localStorage.getItem('euroffersurv_user_id');
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
    async redirectIfAuthenticated(redirectTo = '/dashboard.html') {
        const user = await this.getCurrentUser();
        if (user) {
            localStorage.setItem('euroffersurv_logged_in', 'true');
            localStorage.setItem('euroffersurv_user_id', user.user_id);
            window.location.href = redirectTo;
            return true;
        }

        localStorage.removeItem('euroffersurv_logged_in');
        localStorage.removeItem('euroffersurv_user_id');
        return false;
    }

    async requireAuth(redirectTo = '/index.html') {
        const user = await this.getCurrentUser();
        if (!user) {
            localStorage.removeItem('euroffersurv_logged_in');
            localStorage.removeItem('euroffersurv_user_id');
            window.location.href = redirectTo;
            return false;
        }

        localStorage.setItem('euroffersurv_logged_in', 'true');
        localStorage.setItem('euroffersurv_user_id', user.user_id);
        return true;
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
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
            birthDate: document.getElementById('birthDate').value,
            newsletter: document.getElementById('newsletter')?.checked || false
        };

        if (!auth.isValidEmail(userData.email)) {
            alert('Email inválido');
            return;
        }

        if (!auth.isValidPassword(userData.password)) {
            alert('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (auth.calculateAge(userData.birthDate) < 18) {
            alert('Debes ser mayor de 18 años');
            return;
        }

        const result = await auth.register(userData);

        if (result.success) {
            alert('Registro exitoso');
            window.location.href = '/index.html';
        } else {
            alert(result.message || 'Error desconocido');
        }
    });
});
