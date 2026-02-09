/**
 * TimeWall Integration Script
 * Gestiona la integración con TimeWall Offerwall
 * Versión simplificada compatible con auth.js de EurOffersurv
 */

(function() {
  'use strict';

  const TIMEWALL_CONFIG = {
    baseUrl: 'https://timewall.io/users/login',
    offerId: '8a2a1f2f37b4c642', // Tu Offer ID de TimeWall
    iframeId: 'timewall_offerwall',
    containerId: 'timewall-container',
    loaderId: 'timewall-loader'
  };

  class TimeWallIntegration {
    constructor() {
      this.iframe = null;
      this.container = null;
      this.loader = null;
      this.userId = null;
      this.isLoaded = false;
    }

    /**
     * Inicializa la integración de TimeWall
     */
    async init() {
      try {
        console.log('[TimeWall] Iniciando integración...');

        // Obtener elementos del DOM
        this.iframe = document.getElementById(TIMEWALL_CONFIG.iframeId);
        this.container = document.getElementById(TIMEWALL_CONFIG.containerId);
        this.loader = document.getElementById(TIMEWALL_CONFIG.loaderId);

        if (!this.iframe || !this.container) {
          console.error('[TimeWall] Elementos del DOM no encontrados');
          return;
        }

        // Obtener el ID del usuario usando auth.js
        await this.getUserId();

        if (!this.userId) {
          console.error('[TimeWall] No se pudo obtener el ID del usuario');
          this.showError('No se pudo cargar las encuestas. Por favor, recarga la página.');
          return;
        }

        // Construir y cargar la URL de TimeWall
        this.loadTimeWall();

      } catch (error) {
        console.error('[TimeWall] Error en inicialización:', error);
        this.showError('Error al cargar las encuestas.');
      }
    }

    /**
     * Obtiene el ID del usuario usando auth.requireAuth
     * que es el método que usa tu sistema
     */
    async getUserId() {
      try {
        console.log('[TimeWall] Verificando autenticación...');

        // Verificar que auth.js esté disponible
        if (!window.auth || typeof window.auth.requireAuth !== 'function') {
          console.error('[TimeWall] auth.js no está disponible o no tiene requireAuth');
          return false;
        }

        // Usar el mismo método que usa el dashboard (auth.requireAuth)
        const session = await window.auth.requireAuth({
          redirectTo: '/index.html',
          retries: 3,
          delayMs: 300,
          graceMs: 2000,
        });

        console.log('[TimeWall] Respuesta de auth.requireAuth:', session);

        if (!session.ok) {
          console.error('[TimeWall] Sesión no válida');
          return false;
        }

        const user = session.user || null;
        if (!user) {
          console.error('[TimeWall] Usuario no encontrado en sesión');
          return false;
        }

        // Intentar obtener el ID del usuario de diferentes formas
        this.userId = user.id || user.user_id || user.userId;

        if (this.userId) {
          console.log('[TimeWall] ID de usuario obtenido exitosamente:', this.userId);
          return true;
        } else {
          console.error('[TimeWall] No se encontró ID en el objeto user:', user);
          return false;
        }

      } catch (error) {
        console.error('[TimeWall] Error al obtener ID del usuario:', error);
        return false;
      }
    }

    /**
     * Carga el iframe de TimeWall con la URL correcta
     */
    loadTimeWall() {
      try {
        // Construir la URL con el user ID
        const timewallUrl = `${TIMEWALL_CONFIG.baseUrl}?oid=${TIMEWALL_CONFIG.offerId}&uid=${this.userId}`;
        
        console.log('[TimeWall] Cargando URL:', timewallUrl);

        // Configurar el iframe
        this.iframe.src = timewallUrl;

        // Manejar el evento de carga
        this.iframe.onload = () => {
          console.log('[TimeWall] Iframe cargado exitosamente');
          this.hideLoader();
          this.showIframe();
          this.isLoaded = true;
        };

        // Manejar errores de carga
        this.iframe.onerror = (error) => {
          console.error('[TimeWall] Error al cargar iframe:', error);
          this.showError('Error al cargar las encuestas de TimeWall.');
        };

        // Timeout de seguridad (si no carga en 10 segundos, mostrar de todas formas)
        setTimeout(() => {
          if (!this.isLoaded) {
            console.warn('[TimeWall] Timeout de carga, mostrando iframe de todas formas');
            this.hideLoader();
            this.showIframe();
          }
        }, 10000);

      } catch (error) {
        console.error('[TimeWall] Error al cargar TimeWall:', error);
        this.showError('Error al configurar las encuestas.');
      }
    }

    /**
     * Oculta el loader
     */
    hideLoader() {
      if (this.loader) {
        this.loader.style.display = 'none';
      }
    }

    /**
     * Muestra el iframe
     */
    showIframe() {
      if (this.iframe) {
        this.iframe.style.display = 'block';
      }
    }

    /**
     * Muestra un mensaje de error
     */
    showError(message) {
      if (this.loader) {
        this.loader.innerHTML = `
          <div style="text-align: center; padding: 2rem;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p style="margin-top: 1rem; color: #f44336; font-weight: 600;">${message}</p>
            <button 
              onclick="location.reload()" 
              style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: #2196f3; color: white; border: none; border-radius: 8px; cursor: pointer;"
            >
              Recargar página
            </button>
          </div>
        `;
      }
    }

    /**
     * Refresca el contenido de TimeWall
     */
    refresh() {
      if (this.iframe && this.userId) {
        console.log('[TimeWall] Refrescando contenido...');
        const timewallUrl = `${TIMEWALL_CONFIG.baseUrl}?oid=${TIMEWALL_CONFIG.offerId}&uid=${this.userId}`;
        this.iframe.src = timewallUrl;
      }
    }

    /**
     * Destruye la instancia y limpia recursos
     */
    destroy() {
      if (this.iframe) {
        this.iframe.src = 'about:blank';
        this.iframe.onload = null;
        this.iframe.onerror = null;
      }
      this.userId = null;
      this.isLoaded = false;
      console.log('[TimeWall] Instancia destruida');
    }
  }

  // Crear instancia global
  window.TimeWallApp = new TimeWallIntegration();

  // Auto-inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.TimeWallApp.init();
    });
  } else {
    window.TimeWallApp.init();
  }

  // Limpiar al salir de la página
  window.addEventListener('beforeunload', () => {
    if (window.TimeWallApp) {
      window.TimeWallApp.destroy();
    }
  });

})();