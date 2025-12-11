export function createBridge(){

    return {

        isNative: () => !!window.Capacitor || !!window.cordova,
        haptic: async (style = 'light') => {

            if (window.Capacitor?.Plugins?.Haptics) {
                await window.Capacitor.Plugins.Haptics.impact({ style: style.toUpperCase() });
            } else if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        },

        toast: async (message) => {
            if (window.Capacitor?.Plugins?.Toast) {
                await window.Capacitor.Plugins.Toast.show({ text: message });
            } else {
                wrapnative.ui.showWebToast(message);
            }
        },

        share: async (data) => {
            if (navigator.share) { try { await navigator.share(data); } catch(e) {} }
            else { wrapnative.ui.showWebToast('Compartilhar não disponível.'); }
        },

        camera: async () => {
            if (window.Capacitor?.Plugins?.Camera) {
                try {
                    const image = await window.Capacitor.Plugins.Camera.getPhoto({
                        quality: 90,
                        allowEditing: true,
                        resultType: 'base64'
                    });
                    return 'data:image/jpeg;base64,' + image.base64String;
                } catch (e) {
                    return null;
                }
            } else {
                return new Promise((resolve) => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (!file) { resolve(null); return; }
                        const reader = new FileReader();
                        reader.onload = (evt) => resolve(evt.target.result);
                        reader.readAsDataURL(file);
                    };
                    input.click();
                });
            }
        },

        authenticate: async (reason = 'Confirme sua identidade') => {
            if (window.Capacitor?.Plugins?.BiometricAuth) {
                try {
                    await window.Capacitor.Plugins.BiometricAuth.verify({ reason });
                    return true;
                } catch (e) { return false; }
            }
            if (window.PublicKeyCredential) {
                try {
                    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                    if (available) return true; 
                } catch (e) {}
            }
            return confirm(reason);
        }
    }
};