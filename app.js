// ========== LOGIN PAGE FUNCTIONS ==========

/**
 * Scroll suave a la sección de login
 */
function scrollToLogin() {
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
        loginSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

/**
 * Maneja el envío del formulario de login
 */
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Validación básica
    if (!email || !password) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }

    if (!auth.isValidEmail(email)) {
        showToast('Ingresa un correo electrónico válido', 'error');
        return;
    }
    
    // Intentar login
    const result = auth.login(email, password);
    
    if (result.success) {
        showToast(result.message, 'success');
        // Pequeño delay para que se vea el mensaje
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    } else {
        showToast(result.message, 'error');
    }
}

/**
 * Maneja el registro de nuevos usuarios
 */
function handleRegister() {
    window.location.href = 'register.html';
}

/**
 * Maneja el cierre de sesión
 */
function handleLogout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        const result = auth.logout();
        if (result.success) {
            showToast(result.message, 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        }
    }
}

// ========== REGISTRATION FUNCTIONS ==========

/**
 * Maneja el envío del formulario de registro
 */
function handleRegistration(event) {
    event.preventDefault();
    
    // Obtener datos del formulario
    const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        birthDate: document.getElementById('birthDate').value,
        country: document.getElementById('country').value,
        city: document.getElementById('city') ? document.getElementById('city').value.trim() : '',
        gender: 'not-specified', // Campo opcional, valor por defecto
        termsAccepted: document.getElementById('terms').checked
    };

    // Validaciones
    const errors = validateRegistrationForm(formData);
    
    if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
    }

    // Intentar registrar
    const result = auth.register(formData);
    
    if (result.success) {
        showToast('¡Registro exitoso! Redirigiendo al login...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        showToast(result.message, 'error');
    }
}

/**
 * Valida el formulario de registro
 */
function validateRegistrationForm(formData) {
    const errors = [];
    
    // Validar nombre
    if (!formData.firstName || formData.firstName.length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
    }
    
    // Validar apellido
    if (!formData.lastName || formData.lastName.length < 2) {
        errors.push('El apellido debe tener al menos 2 caracteres');
    }
    
    // Validar email
    if (!auth.isValidEmail(formData.email)) {
        errors.push('Ingresa un correo electrónico válido');
    }
    
    // Validar contraseña
    if (!auth.isValidPassword(formData.password)) {
        errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    // Validar coincidencia de contraseñas
    if (formData.password !== formData.confirmPassword) {
        errors.push('Las contraseñas no coinciden');
    }
    
    // Validar fecha de nacimiento
    if (!formData.birthDate) {
        errors.push('Debes ingresar tu fecha de nacimiento');
    } else {
        const age = auth.calculateAge(formData.birthDate);
        if (age < 18) {
            errors.push('Debes tener al menos 18 años para registrarte');
        }
    }
    
    // Validar país
    if (!formData.country) {
        errors.push('Debes seleccionar tu país');
    }
    
    // Validar términos y condiciones
    if (!formData.termsAccepted) {
        errors.push('Debes aceptar los términos y condiciones');
    }
    
    return errors;
}

/**
 * Toggle del campo de contraseña
 */
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const type = field.getAttribute('type') === 'password' ? 'text' : 'password';
    field.setAttribute('type', type);
}

/**
 * Actualiza el indicador de fortaleza de contraseña
 */
function updatePasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    let color = '#f44336';
    let text = 'Débil';
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength === 0) {
        color = '#f44336';
        text = 'Muy débil';
    } else if (strength === 1) {
        color = '#f44336';
        text = 'Débil';
    } else if (strength === 2) {
        color = '#ff9800';
        text = 'Regular';
    } else if (strength === 3) {
        color = '#4caf50';
        text = 'Buena';
    } else if (strength >= 4) {
        color = '#388e3c';
        text = 'Excelente';
    }
    
    strengthBar.style.width = (strength * 25) + '%';
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
    strengthText.style.color = color;
}

/**
 * Valida que las contraseñas coincidan
 */
function validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const passwordMatch = document.getElementById('passwordMatch');
    
    if (!passwordMatch) return true;
    
    if (confirmPassword && password !== confirmPassword) {
        passwordMatch.classList.remove('hidden');
        return false;
    } else {
        passwordMatch.classList.add('hidden');
        return true;
    }
}

// ========== DASHBOARD FUNCTIONS ==========

/**
 * Inicializa el dashboard con datos del usuario
 */
function initDashboard() {
    // Verificar autenticación
    if (!auth.requireAuth()) {
        return;
    }

    const user = auth.getCurrentUser();
    
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Actualizar información del usuario en el dashboard
    updateDashboardUserInfo(user);
    
    // Cargar datos del usuario
    loadUserData(user);
}

/**
 * Actualiza la información del usuario en el dashboard
 */
function updateDashboardUserInfo(user) {
    // Actualizar nombre de usuario
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
        el.textContent = user.firstName + ' ' + user.lastName;
    });

    // Actualizar email
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(el => {
        el.textContent = user.email;
    });

    // Actualizar balance
    const balanceElements = document.querySelectorAll('.user-balance');
    balanceElements.forEach(el => {
        el.textContent = `$${user.balance.toFixed(2)} USD`;
    });

    // Actualizar ganancias totales
    const totalEarnedElements = document.querySelectorAll('.total-earned');
    totalEarnedElements.forEach(el => {
        el.textContent = `$${user.totalEarned.toFixed(2)} USD`;
    });

    // Actualizar ofertas completadas
    const completedOffersElements = document.querySelectorAll('.completed-offers');
    completedOffersElements.forEach(el => {
        el.textContent = user.completedOffers;
    });
}

/**
 * Carga los datos del usuario
 */
function loadUserData(user) {
    // Aquí puedes cargar ofertas, estadísticas, etc.
    console.log('Datos del usuario cargados:', user);
}

/**
 * Toggle del menú lateral en móviles
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

/**
 * Inicialización del toggle del menú
 */
function initMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
}

/**
 * Cierra el sidebar al hacer click fuera (solo en móvil)
 */
function closeSidebarOnOutsideClick(event) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('active')) {
        if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    }
}

/**
 * Maneja los clicks en los enlaces del sidebar
 */
function handleSidebarLinks() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link:not(.logout)');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover clase active de todos los enlaces
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Agregar clase active al enlace clickeado
            this.classList.add('active');
            
            // Cerrar sidebar en móvil
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
            
            console.log('Navegando a:', this.querySelector('span').textContent);
        });
    });
}

/**
 * Maneja el botón de retiro
 */
function handleWithdraw() {
    const user = auth.getCurrentUser();
    const withdrawBtn = document.querySelector('.btn-withdraw');
    
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', function() {
            const minWithdraw = 5.00;
            const currentBalance = user ? user.balance : 0;
            
            if (currentBalance < minWithdraw) {
                showToast(`Balance insuficiente. Mínimo para retiro: $${minWithdraw.toFixed(2)} USD`, 'error');
            } else {
                showToast('Función de retiro disponible próximamente', 'info');
            }
        });
    }
}

/**
 * Maneja las notificaciones
 */
function handleNotifications() {
    const notificationBtns = document.querySelectorAll('.notification-btn');
    
    notificationBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const badge = this.querySelector('.badge');
            if (badge) {
                badge.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    badge.style.transform = 'scale(1)';
                    const count = parseInt(badge.textContent);
                    if (count > 0) {
                        badge.textContent = count - 1;
                        if (count - 1 === 0) {
                            badge.style.display = 'none';
                        }
                    }
                }, 200);
            }
            
            console.log('Mostrando notificaciones...');
        });
    });
}

/**
 * Animación de carga de ofertas
 */
function loadOffers() {
    const offersList = document.querySelector('.offers-list');
    
    if (offersList) {
        const offers = offersList.querySelectorAll('.offer-item');
        offers.forEach((offer, index) => {
            offer.style.opacity = '0';
            offer.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                offer.style.transition = 'all 0.5s ease';
                offer.style.opacity = '1';
                offer.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
}

// ========== RESPONSIVE HANDLING ==========

/**
 * Maneja cambios en el tamaño de la ventana
 */
function handleResize() {
    const sidebar = document.getElementById('sidebar');
    
    if (window.innerWidth > 768 && sidebar) {
        sidebar.classList.remove('active');
    }
}

// ========== INITIALIZATION ==========

/**
 * Inicializa todas las funcionalidades cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== INDEX PAGE (LOGIN) =====
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Redirigir si ya está autenticado
        auth.redirectIfAuthenticated();
        
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // ===== REGISTER PAGE =====
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        // Redirigir si ya está autenticado
        auth.redirectIfAuthenticated();
        
        registerForm.addEventListener('submit', handleRegistration);
        
        // Validación de contraseña en tiempo real
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (passwordInput) {
            passwordInput.addEventListener('input', updatePasswordStrength);
        }
        
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', validatePasswordMatch);
        }
    }
    
    // ===== DASHBOARD PAGE =====
    const dashboard = document.querySelector('.dashboard-container, .dashboard');
    if (dashboard) {
        initDashboard();
        initMenuToggle();
        handleSidebarLinks();
        handleWithdraw();
        handleNotifications();
        loadOffers();
    }
    
    // ===== GLOBAL EVENTS =====
    
    // Click fuera del sidebar
    document.addEventListener('click', closeSidebarOnOutsideClick);
    
    // Resize handler
    window.addEventListener('resize', handleResize);
    
    // Smooth scroll para todos los enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    console.log('EurOffersurv app initialized successfully');
});

// ========== UTILITY FUNCTIONS ==========

/**
 * Formatea números como moneda
 */
function formatCurrency(amount) {
    return `$${parseFloat(amount).toFixed(2)} USD`;
}

/**
 * Genera un ID único
 */
function generateUniqueId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Muestra mensajes toast (notificaciones temporales)
 */
function showToast(message, type = 'info') {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        font-size: 0.95rem;
    `;
    
    document.body.appendChild(toast);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Añadir animaciones CSS para toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
    }
`;
document.head.appendChild(style);

// ========== EXPORT FUNCTIONS (para uso global) ==========
window.scrollToLogin = scrollToLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.showToast = showToast;
window.togglePassword = togglePassword;
window.updatePasswordStrength = updatePasswordStrength;
window.validatePasswordMatch = validatePasswordMatch;