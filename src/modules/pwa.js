export function createPwa(internalState,ui) {

    return {
        init: () => {
            if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) return;
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault(); 
                internalState.deferredPrompt = e; 
                // Verifica cooldown
                const last = localStorage.getItem('wn-pwa-dismissed');
                const COOLDOWN = 3; // dias
                if (last && (Date.now() - parseInt(last)) / 86400000 < COOLDOWN) return;
                setTimeout(() => ui.showInstallBanner(false), 2000);
            });
            if (isIOS) setTimeout(() => ui.showInstallBanner(true), 2000);
        },
        checkAndTriggerPWA: () => {
            if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) return;
            
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            if (isIOS) {
               wrapnative.ui.showInstallBanner(true);
            } else if (internalState.deferredPrompt) {
                wrapnative.ui.showInstallBanner(false);
            }
        }
    }
};