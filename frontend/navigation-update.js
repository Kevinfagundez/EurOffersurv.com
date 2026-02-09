/**
 * Función de navegación actualizada para incluir la página de encuestas
 * Agrega esta función a tu app.js existente o reemplaza la función navigateTo
 */

/**
 * Navega entre diferentes secciones del dashboard
 * @param {string} section - La sección a la que navegar
 */
function navigateTo(section) {
  console.log('[Navigation] Navegando a:', section);

  // Mapeo de secciones a páginas
  const routes = {
    'inicio': '/dashboard.html',
    'encuestas': '/encuestas.html',
    'ofertas': '/dashboard.html', // O crear una página específica si es necesario
    'recompensas': '/dashboard.html', // O crear una página específica si es necesario
    'soporte': '/dashboard.html' // O crear una página específica si es necesario
  };

  // Obtener la ruta de destino
  const targetRoute = routes[section];

  if (targetRoute) {
    // Si estamos en la misma página, no recargar
    if (window.location.pathname === targetRoute) {
      console.log('[Navigation] Ya estás en esta página');
      return;
    }

    // Navegar a la nueva página
    window.location.href = targetRoute;
  } else {
    console.warn('[Navigation] Sección no reconocida:', section);
  }
}

/**
 * Actualiza el estado activo del sidebar
 * Llama esta función al cargar cada página para marcar el item correcto
 */
function updateSidebarActive() {
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll('.sidebar-link');

  sidebarLinks.forEach(link => {
    link.classList.remove('active');
  });

  // Determinar qué link debe estar activo según la página actual
  let activeSection = 'inicio';
  
  if (currentPath.includes('encuestas.html')) {
    activeSection = 'encuestas';
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
}

// Auto-ejecutar al cargar la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateSidebarActive);
} else {
  updateSidebarActive();
}

/**
 * INSTRUCCIONES DE INTEGRACIÓN:
 * 
 * 1. Si tu app.js ya tiene una función navigateTo(), reemplázala con esta versión
 * 2. Si no existe, agrega toda esta función al final de tu app.js
 * 3. La función updateSidebarActive() se ejecuta automáticamente
 * 
 * ESTRUCTURA DE ARCHIVOS REQUERIDA:
 * frontend/
 * ├── dashboard.html          (página principal con TheoremReach)
 * ├── encuestas.html          (nueva página con TimeWall)
 * ├── auth.js                 (sin cambios)
 * ├── app.js                  (actualizar con estas funciones)
 * ├── theoremreach-integration.js (sin cambios)
 * └── timewall-integration.js (nuevo archivo)
 */