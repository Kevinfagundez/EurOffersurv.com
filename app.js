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
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Validación básica
    if (!email || !password) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    // Simulación de login exitoso
    console.log('Login simulado con:', { email, password });
    
    // Redirigir al dashboard
    window.location.href = 'dashboard.html';
}

/**
 * Maneja el registro de nuevos usuarios
 */
function handleRegister() {
    // Simulación de registro
    console.log('Redirigiendo a registro...');
    window.location.href = 'index.html';
}

/**
 * Maneja el cierre de sesión
 */
function handleLogout() {
    // Confirmación antes de cerrar sesión
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        console.log('Cerrando sesión...');
        window.location.href = 'index.html';
    }
}

// ========== DASHBOARD FUNCTIONS ==========

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
 * Animación de progreso para las ofertas
 */
function animateOfferProgress() {
    const progressDots = document.querySelectorAll('.progress-dot');
    
    progressDots.forEach((dot, index) => {
        setTimeout(() => {
            if (dot.classList.contains('active')) {
                dot.style.animation = 'pulse 0.5s ease-in-out';
            }
        }, index * 100);
    });
}

/**
 * Simula la carga de ofertas dinámicas
 */
function loadOffers() {
    const offersList = document.querySelector('.offers-list');
    
    if (offersList) {
        // Efecto de entrada para las ofertas
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

/**
 * Actualiza el ranking en tiempo real (simulado)
 */
function updateRanking() {
    const rankingAmounts = document.querySelectorAll('.ranking-amount');
    
    rankingAmounts.forEach(amount => {
        const currentValue = parseFloat(amount.textContent.replace('$', '').replace(' USD', ''));
        
        // Simular incremento aleatorio pequeño
        const increment = (Math.random() * 0.5).toFixed(2);
        const newValue = (currentValue + parseFloat(increment)).toFixed(2);
        
        // Animación del cambio
        amount.style.transition = 'color 0.3s ease';
        amount.style.color = '#4caf50';
        
        setTimeout(() => {
            amount.textContent = `$${newValue} USD`;
            setTimeout(() => {
                amount.style.color = '';
            }, 500);
        }, 300);
    });
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
                // Animar y reducir el contador
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
 * Maneja el botón de retiro
 */
function handleWithdraw() {
    const withdrawBtn = document.querySelector('.btn-withdraw');
    
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', function() {
            alert('Función de retiro disponible próximamente.\n\nRetiro mínimo: $5.00 USD\nTu balance actual: $5.25 USD');
        });
    }
}

/**
 * Añade efectos hover personalizados a las cards
 */
function addCardEffects() {
    const cards = document.querySelectorAll('.quick-offer-card, .offer-item');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    });
}

/**
 * Simula la carga de contenido dinámico
 */
function simulateContentLoading() {
    // Simular actualización del balance cada 30 segundos
    setInterval(() => {
        const balance = document.querySelector('.user-balance');
        if (balance) {
            const currentBalance = parseFloat(balance.textContent.replace('$', '').replace(' USD', ''));
            const newBalance = (currentBalance + 0.05).toFixed(2);
            balance.textContent = `$${newBalance} USD`;
            
            // Efecto de resaltado
            balance.style.fontWeight = '700';
            balance.style.color = '#4caf50';
            setTimeout(() => {
                balance.style.fontWeight = '';
                balance.style.color = '';
            }, 1000);
        }
    }, 30000);
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
    
    // ===== LOGIN PAGE =====
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('Login page initialized');
    }
    
    // ===== DASHBOARD PAGE =====
    const dashboardPage = document.querySelector('.dashboard-page');
    if (dashboardPage) {
        // Inicializar funciones del dashboard
        initMenuToggle();
        handleSidebarLinks();
        handleNotifications();
        handleWithdraw();
        loadOffers();
        animateOfferProgress();
        addCardEffects();
        simulateContentLoading();
        
        // Actualizar ranking cada 10 segundos
        setInterval(updateRanking, 10000);
        
        console.log('Dashboard initialized');
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
    
    console.log('NombreGPT app initialized successfully');
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
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
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

// ACTUALIZACIÓN REGISTER.HTML

/**
 * Maneja el registro de nuevos usuarios
 */
function handleRegister() {
    // Redirigir a la página de registro
    window.location.href = 'register.html';
}

/**
 * Valida el formulario de registro
 */
function validateRegistration(formData) {
    const errors = [];
    
    if (!formData.firstName || formData.firstName.length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
    }
    
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
        errors.push('Ingresa un correo electrónico válido');
    }
    
    if (!formData.password || formData.password.length < 8) {
        errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    if (formData.password !== formData.confirmPassword) {
        errors.push('Las contraseñas no coinciden');
    }
    
    if (!formData.termsAccepted) {
        errors.push('Debes aceptar los términos y condiciones');
    }
    
    const birthDate = new Date(formData.birthDate);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    if (age < 18) {
        errors.push('Debes tener al menos 18 años');
    }
    
    return errors;
}

// actualización 2

// Añade esto a las funciones del archivo app.js existente

/**
 * Formatea la fecha de nacimiento
 */
function formatBirthDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Calcula la edad a partir de la fecha de nacimiento
 */
function calculateAge(birthDate) {
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
 * Validación en tiempo real de formularios
 */
function setupRealTimeValidation() {
    const inputs = document.querySelectorAll('.registration-form input, .registration-form select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    const fieldId = field.id;
    
    switch(fieldId) {
        case 'email':
            if (!/^\S+@\S+\.\S+$/.test(value)) {
                showFieldError(field, 'Ingresa un correo válido');
            }
            break;
        case 'password':
            if (value.length < 8) {
                showFieldError(field, 'Mínimo 8 caracteres');
            }
            break;
        case 'confirmPassword':
            const password = document.getElementById('password').value;
            if (value !== password) {
                showFieldError(field, 'Las contraseñas no coinciden');
            }
            break;
        case 'birthDate':
            if (value && calculateAge(value) < 18) {
                showFieldError(field, 'Debes ser mayor de 18 años');
            }
            break;
    }
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = 'var(--danger)';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '0.25rem';
    
    field.parentNode.appendChild(errorDiv);
    field.classList.add('error');
}

function clearFieldError(field) {
    const errorDiv = field.parentNode.querySelector('.error-message');
    if (errorDiv) {
        field.parentNode.removeChild(errorDiv);
    }
    field.classList.remove('error');
}