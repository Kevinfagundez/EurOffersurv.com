// ========================================
// SISTEMA DE AUTENTICACIÓN - EUROFFERSURV
// ========================================

/**
 * Clase principal para manejar la autenticación
 */
class AuthSystem {
    constructor() {
        this.USERS_KEY = 'euroffersurv_users';
        this.CURRENT_USER_KEY = 'euroffersurv_current_user';
        this.initializeStorage();
    }

    /**
     * Inicializa el almacenamiento si no existe
     */
    initializeStorage() {
        if (!localStorage.getItem(this.USERS_KEY)) {
            localStorage.setItem(this.USERS_KEY, JSON.stringify([]));
        }
    }

    /**
     * Obtiene todos los usuarios registrados
     */
    getAllUsers() {
        try {
            return JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            return [];
        }
    }

    /**
     * Guarda la lista de usuarios
     */
    saveUsers(users) {
        try {
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('Error al guardar usuarios:', error);
            return false;
        }
    }

    /**
     * Verifica si un email ya está registrado
     */
    emailExists(email) {
        const users = this.getAllUsers();
        return users.some(user => user.email.toLowerCase() === email.toLowerCase());
    }

    /**
     * Registra un nuevo usuario
     */
    register(userData) {
        try {
            // Validar que el email no exista
            if (this.emailExists(userData.email)) {
                return {
                    success: false,
                    message: 'Este correo electrónico ya está registrado'
                };
            }

            // Crear objeto de usuario
            const newUser = {
                id: this.generateUserId(),
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email.toLowerCase(),
                password: this.hashPassword(userData.password), // En producción usa bcrypt
                birthDate: userData.birthDate,
                country: userData.country,
                gender: userData.gender,
                balance: 0,
                totalEarned: 0,
                completedOffers: 0,
                registeredAt: new Date().toISOString(),
                lastLogin: null,
                isActive: true
            };

            // Guardar usuario
            const users = this.getAllUsers();
            users.push(newUser);
            this.saveUsers(users);

            return {
                success: true,
                message: 'Registro exitoso',
                user: this.sanitizeUser(newUser)
            };
        } catch (error) {
            console.error('Error en registro:', error);
            return {
                success: false,
                message: 'Error al registrar usuario'
            };
        }
    }

    /**
     * Inicia sesión de un usuario
     */
    login(email, password) {
        try {
            const users = this.getAllUsers();
            const user = users.find(u => 
                u.email.toLowerCase() === email.toLowerCase() &&
                u.password === this.hashPassword(password)
            );

            if (!user) {
                return {
                    success: false,
                    message: 'Correo electrónico o contraseña incorrectos'
                };
            }

            if (!user.isActive) {
                return {
                    success: false,
                    message: 'Esta cuenta ha sido desactivada'
                };
            }

            // Actualizar último login
            user.lastLogin = new Date().toISOString();
            this.saveUsers(users);

            // Guardar sesión
            const sanitizedUser = this.sanitizeUser(user);
            localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(sanitizedUser));

            return {
                success: true,
                message: 'Inicio de sesión exitoso',
                user: sanitizedUser
            };
        } catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                message: 'Error al iniciar sesión'
            };
        }
    }

    /**
     * Cierra la sesión actual
     */
    logout() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
        return {
            success: true,
            message: 'Sesión cerrada exitosamente'
        };
    }

    /**
     * Obtiene el usuario actualmente autenticado
     */
    getCurrentUser() {
        try {
            const userJson = localStorage.getItem(this.CURRENT_USER_KEY);
            return userJson ? JSON.parse(userJson) : null;
        } catch (error) {
            console.error('Error al obtener usuario actual:', error);
            return null;
        }
    }

    /**
     * Verifica si hay un usuario autenticado
     */
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }

    /**
     * Actualiza los datos del usuario
     */
    updateUser(userId, updates) {
        try {
            const users = this.getAllUsers();
            const userIndex = users.findIndex(u => u.id === userId);

            if (userIndex === -1) {
                return {
                    success: false,
                    message: 'Usuario no encontrado'
                };
            }

            // Actualizar usuario
            users[userIndex] = { ...users[userIndex], ...updates };
            this.saveUsers(users);

            // Si es el usuario actual, actualizar sesión
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                const updatedUser = this.sanitizeUser(users[userIndex]);
                localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updatedUser));
            }

            return {
                success: true,
                message: 'Usuario actualizado',
                user: this.sanitizeUser(users[userIndex])
            };
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            return {
                success: false,
                message: 'Error al actualizar usuario'
            };
        }
    }

    /**
     * Elimina información sensible del usuario
     */
    sanitizeUser(user) {
        const { password, ...sanitized } = user;
        return sanitized;
    }

    /**
     * Hash simple de contraseña (en producción usar bcrypt)
     */
    hashPassword(password) {
        // Esto es solo para demo. En producción NUNCA uses esto.
        // Usa bcrypt, argon2, o similar en el backend
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'hash_' + Math.abs(hash).toString(16);
    }

    /**
     * Genera un ID único para el usuario
     */
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Valida formato de email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valida contraseña (mínimo 8 caracteres)
     */
    isValidPassword(password) {
        return password && password.length >= 8;
    }

    /**
     * Calcula edad a partir de fecha de nacimiento
     */
    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    /**
     * Protege páginas que requieren autenticación
     */
    requireAuth(redirectTo = 'index.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    /**
     * Redirige usuarios autenticados (para páginas de login/registro)
     */
    redirectIfAuthenticated(redirectTo = 'dashboard.html') {
        if (this.isAuthenticated()) {
            window.location.href = redirectTo;
            return true;
        }
        return false;
    }
}

// Crear instancia global
const auth = new AuthSystem();

// Exportar para uso global
window.auth = auth;