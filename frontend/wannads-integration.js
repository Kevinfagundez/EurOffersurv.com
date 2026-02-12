/**
 * Wannads Integration Script
 * Gestiona la integración con Wannads Offerwall y Surveywall
 */

(function() {
  'use strict';

  const WANNADS_CONFIG = {
    offerwall: 'https://earn.wannads.com/wall',
    surveywall: 'https://earn.wannads.com/surveywall',
    apiKey: '698c972b2683b866438761',
    iframeId: 'wannads_offerwall',
    containerId: 'wannads-container',
    loaderId: 'wannads-loader'
  };

  class WannadsIntegration {
    constructor() {
      this.iframe = null;
      this.container = null;
      this.loader = null;
      this.userId = null;
      this.isLoaded = false;
      this.currentTab = 'offerwall'; // 'offerwall' o 'surveywall'
    }

    /**
     * Inicializa la integración de Wannads
     */
    async init() {
      try {
        console.log('[Wannads] Iniciando integración...');

        // Obtener elementos del DOM
        this.iframe = document.getElementById(WANNADS_CONFIG.iframeId);
        this.container = document.getElementById(WANNADS_CONFIG.containerId);
        this.loader = document.getElementById(WANNADS_CONFIG.loaderId);

        if (!this.iframe || !this.container) {
          console.error('[Wannads] Elementos del DOM no encontrados');
          return;
        }

        // Obtener el ID del usuario usando auth.js
        await this.getUserId();

        if (!this.userId) {
          console.error('[Wannads] No se pudo obtener el ID del usuario');
          this.showError('No se pudo cargar las ofertas. Por favor, recarga la página.');
          return;
        }

        // Cargar el offerwall por defecto
        this.loadWannads('offerwall');

      } catch (error) {
        console.error('[Wannads] Error en inicialización:', error);
        this.showError('Error al cargar las ofertas.');
      }
    }

    /**
     * Obtiene el ID del usuario usando auth.requireAuth
     */
    async getUserId() {
      try {
        console.log('[Wannads] Verificando autenticación...');

        // Verificar que auth.js esté disponible
        if (!window.auth || typeof window.auth.requireAuth !== 'function') {
          console.error('[Wannads] auth.js no está disponible o no tiene requireAuth');
          return false;
        }

        // Usar el mismo método que usa el dashboard
        const session = await window.auth.requireAuth({
          redirectTo: '/index.html',
          retries: 3,
          delayMs: 300,
          graceMs: 2000,
        });

        console.log('[Wannads] Respuesta de auth.requireAuth:', session);

        if (!session.ok) {
          console.error('[Wannads] Sesión no válida');
          return false;
        }

        const user = session.user || null;
        if (!user) {
          console.error('[Wannads] Usuario no encontrado en sesión');
          return false;
        }

        // Obtener el ID del usuario
        this.userId = user.id || user.user_id || user.userId;

        if (this.userId) {
          console.log('[Wannads] ID de usuario obtenido exitosamente:', this.userId);
          return true;
        } else {
          console.error('[Wannads] No se encontró ID en el objeto user:', user);
          return false;
        }

      } catch (error) {
        console.error('[Wannads] Error al obtener ID del usuario:', error);
        return false;
      }
    }

    /**
     * Carga el iframe de Wannads
     * @param {string} type - 'offerwall' o 'surveywall'
     */
    loadWannads(type = 'offerwall') {
      try {
        this.currentTab = type;
        
        // Construir la URL según el tipo
        const baseUrl = type === 'surveywall' 
          ? WANNADS_CONFIG.surveywall 
          : WANNADS_CONFIG.offerwall;
        
        const wannadsUrl = `${baseUrl}?apiKey=${WANNADS_CONFIG.apiKey}&userId=${this.userId}`;
        
        console.log(`[Wannads] Cargando ${type} URL:`, wannadsUrl);

        // Mostrar loader
        this.showLoader();

        // Configurar el iframe
        this.iframe.src = wannadsUrl;
        this.iframe.style.display = 'none';

        // Manejar el evento de carga
        this.iframe.onload = () => {
          console.log(`[Wannads] ${type} cargado exitosamente`);
          this.hideLoader();
          this.showIframe();
          this.isLoaded = true;
        };

        // Manejar errores de carga
        this.iframe.onerror = (error) => {
          console.error(`[Wannads] Error al cargar ${type}:`, error);
          this.showError('Error al cargar las ofertas de Wannads.');
        };

        // Timeout de seguridad
        setTimeout(() => {
          if (!this.isLoaded) {
            console.warn('[Wannads] Timeout de carga, mostrando iframe de todas formas');
            this.hideLoader();
            this.showIframe();
            this.isLoaded = true;
          }
        }, 10000);

      } catch (error) {
        console.error('[Wannads] Error al cargar Wannads:', error);
        this.showError('Error al configurar las ofertas.');
      }
    }

    /**
     * Cambia entre Offerwall y Surveywall
     * @param {string} tab - 'offerwall' o 'surveywall'
     */
    switchTab(tab) {
      if (tab === this.currentTab) {
        console.log('[Wannads] Ya estás en esta pestaña');
        return;
      }

      console.log(`[Wannads] Cambiando de ${this.currentTab} a ${tab}`);

      // Actualizar las pestañas visuales
      document.querySelectorAll('.wannads-tab').forEach(tabEl => {
        if (tabEl.dataset.tab === tab) {
          tabEl.classList.add('active');
        } else {
          tabEl.classList.remove('active');
        }
      });

      // Cargar el nuevo contenido
      this.isLoaded = false;
      this.loadWannads(tab);
    }

    /**
     * Muestra el loader
     */
    showLoader() {
      if (this.loader) {
        this.loader.style.display = 'flex';
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
     * Refresca el contenido actual
     */
    refresh() {
      if (this.userId) {
        console.log('[Wannads] Refrescando contenido...');
        this.isLoaded = false;
        this.loadWannads(this.currentTab);
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
      console.log('[Wannads] Instancia destruida');
    }
  }

  // Crear instancia global
  window.WannadsApp = new WannadsIntegration();

  // Auto-inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.WannadsApp.init();
    });
  } else {
    window.WannadsApp.init();
  }

  // Limpiar al salir de la página
  window.addEventListener('beforeunload', () => {
    if (window.WannadsApp) {
      window.WannadsApp.destroy();
    }
  });

})();