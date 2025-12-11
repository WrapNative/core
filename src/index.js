import cssCore from './css/core.css?inline'; 
import { utils } from "./helpers/commons";
import { createRouter } from './modules/router';
import { createPwa } from './modules/pwa';
import { createBridge } from './modules/bridge';
import { createUiManager } from './modules/uiManager';
import { createStateManager } from './modules/stateManager';

// --- Singleton & Travas ---
const internalState = {
    activeStore:null,
    loadedDynamicResources:{},
    currentParams:'',
    currentRoute: '',
    history: [], 
    isDark: false,
    sidebarOpen: false,
    defaultTitle: document.title,
    ptrLoading: false,
    activeModals: 0,
    deferredPrompt: null,
    isReady: false
};

// --- Função de Injeção de CSS ---
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = cssCore;
    document.head.appendChild(style);
}


// --- Composição ---
const bridge = createBridge(internalState);
const router = createRouter(internalState,bridge,utils);
const ui = createUiManager(internalState,utils);
const pwa = createPwa(internalState,ui);
const stateManager = createStateManager(internalState,utils);

const WrapNative = {

    ui, router, bridge, pwa,
    state: stateManager, 
    isReady: () => internalState.isReady, 
    onReady : (callback) => {
        if (internalState.isReady) callback();
        else document.addEventListener('wrapnative-ready', callback);
    },
    init: async () => {

        if (!document.body) {
            window.addEventListener('DOMContentLoaded', WrapNative.init);
            return;
        }

        if (internalState.isReady) return; // Evita rodar 2x
        

        injectStyles(); // CSS load start
        
        await WrapNative.router.init(); ui.initTheme(); ui.initGestures(); ui.initPTR(); pwa.init();
        
        console.log("🚀 WrapNative Engine v1.0.0 (Alpha) Ready!");


        // CRITICAL: Signal readiness and Reveal Body
        internalState.isReady = true;
        document.body.classList.add('wn-loaded');
        document.dispatchEvent(new CustomEvent('wrapnative-ready'));

        // Trigger PWA check (handles case where event fired BEFORE init)
        pwa.checkAndTriggerPWA();
    }
};

// GLOBAL PWA LISTENER (Early Catch)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    internalState.deferredPrompt = e;
    // Also check cooldown for the early catch
    const last = localStorage.getItem('wn-pwa-dismissed');
    const COOLDOWN = 3; 
    if (last && (Date.now() - parseInt(last)) / 86400000 < COOLDOWN) return;

    if (internalState.isReady) {
        setTimeout(() => ui.showInstallBanner(false), 2000);
        pwa.checkAndTriggerPWA();
    }
    
});

// --- Lógica de Auto-Inicialização ---
// Esta função verifica o momento certo de disparar
const autoStart = () => {
    // Se o usuário definir window.NO_AUTO_INIT = true, respeitamos e não iniciamos
    if (window.FRAMEWORK_NO_AUTO_INIT) return;
    WrapNative.init().then(() => {
        console.log("✅ WrapNative carregado com sucesso.");
        //document.querySelector('[data-wn-loading-app]').style.display = 'none'
    })
    .catch((erro) => {
        console.error("❌ Falha fatal ao iniciar o WrapNative:", erro);
    });
};

// A lógica correta de verificação do DOM
if (document.readyState === 'loading') {
    // Ainda está carregando? Espera o evento.
    document.addEventListener('DOMContentLoaded', autoStart);
} else {
    // Já carregou? Roda agora.
    autoStart();
}

window.WN = WrapNative; // Alias
export default WrapNative;