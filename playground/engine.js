/**
 * WrapNative Engine v1.0.0 (Alpha) 
*/
  const internalState = {
    preLoadedDynamicPageResources:{},
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

(function(window) {
    'use strict';

    const $ = (selector) => {
        if (!selector || selector === '#' || selector.trim() === '') return null;
        try { return document.querySelector(selector); } 
        catch (e) { return null; }
    };
    
    const $$ = (selector) => document.querySelectorAll(selector);


    //-- UTILS --
    const utils = {
        urlRevoke:(element,uri)=> {
                element.onload = () => {
                    URL.revokeObjectURL(uri); 
            } 
        },

        loadDynamicFile: async (props,required = false) => {
            const {page, fileName } = props
            try{
                
                let fileRequest =  await fetch(`./pages/${page}/${fileName}`)

                if(!fileRequest.ok && required) throw new Error(`Falha ao carregar: ${fileName}`);
                
                // 2. Detecta o tipo automaticamente pelo cabeçalho
                const contentType = fileRequest.headers.get('content-type');
                const contentText = await fileRequest.text()
                let blobType;

                if( contentText.length <= 0 || contentText.includes("Cannot GET") ){
                return undefined
                }

                if(required && contentText.length <= 0 ){
                    throw new Error(`Arquivo: ${fileName} requerido existe, mas esta vazio!`);
                }
                // 3. Lógica de Decisão (JS vs CSS)
                else if (contentType && contentType.includes('javascript')) {
                    
                    // É JAVASCRIPT
                    blobType = contentType.split(';')[0] //'application/javascript';
                    
                    // Adiciona o hack para aparecer nomeado no DevTools
                    const scriptComSourceMap = contentText //+ `\n//# sourceURL=${fileName}`;
                    const blob = new Blob([scriptComSourceMap], { type: blobType });
                    if(contentText.length <= 0 ) throw new Error(`Arquivo: ${fileName} requerido existe, mas esta vazio!`);
                    return URL.createObjectURL(blob);
                    
                } else if (contentType && contentType.includes('css')) {
                    // É CSS
                    blobType = 'text/css';
            
                    // CSS também suporta sourceURL, mas a sintaxe é ligeiramente diferente
                    const cssComSourceMap = contentText //+ `\n/*# sourceURL=${fileName} */`;
                    const blob = new Blob([cssComSourceMap], { type: blobType });
                    return URL.createObjectURL(blob);
                } 
                else if (fileRequest && contentType && contentType.includes('html')) {
                    return contentText
                }
                else {
                    console.warn('Tipo de arquivo não suportado ou desconhecido:', contentType);
                    return;
                }
                
            }
            catch(e){
                console.error(e)
            } 
        },

        getContentPage: async (pageName) => {
            try
            {
                let pageContent =  await utils.loadDynamicFile({page: pageName, fileName: `index.html`},true)
                let cssContent =  await utils.loadDynamicFile({page: pageName, fileName: "style.css"})
                let scriptContent =  await utils.loadDynamicFile({page: pageName, fileName:`script.js` })

                return {
                    html:pageContent,
                    css:cssContent,
                    js: scriptContent
                }
            }
            catch(e)
            {
                console.warn(e)
            }
        }
    }

    // --- BRIDGE ---
    const bridge = {
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
                ui.showWebToast(message);
            }
        },
        share: async (data) => {
            if (navigator.share) { try { await navigator.share(data); } catch(e) {} }
            else { ui.showWebToast('Compartilhar não disponível.'); }
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
    };

    // --- STATE MANAGER ---
    const stateManager = {
        reactive: (data={}) => {

                // Função auxiliar para atualizar a UI
                const updateUI = (key, value) => {
                    $$('[data-bind="' + key + '"]').forEach(el => { el.innerText = value; });
                    $$('[data-model="' + key + '"]').forEach(el => { if (el.value !== value) el.value = value; });
                    $$('[data-if="' + key + '"]').forEach(el => {
                        if (value) el.classList.remove('wn-hidden');
                        else el.classList.add('wn-hidden');
                    });
                };

                // 1. MERGE STRATEGY: Se já existe store, mescla os dados e retorna a existente
                if (internalState.activeStore) {
                    Object.keys(data).forEach(key => {
                        // Adiciona/Atualiza a chave no Proxy existente
                       internalState.activeStore[key] = data[key];
                        // Força a atualização visual inicial para a nova página
                        updateUI(key, data[key]);
                    });
                    return internalState.activeStore;
                }

                 // 2. CREATE STRATEGY: Se não existe, cria o Proxy Singleton
                const proxy = new Proxy(data, {
                    set(target, key, value) {
                        target[key] = value;
                        updateUI(key, value);
                        return true;
                    }
                });

                // Renderização Inicial (IMPORTANTE)
                Object.keys(data).forEach(key => {
                    updateUI(key, data[key]);
                });

                // Registra store global única
                internalState.activeStore = proxy;
                return proxy;
            }
    };

    // --- ROUTER ---
    const router_v1 = {
        init: async () => {
            document.documentElement.style.setProperty('--wn-safe-top', 'env(safe-area-inset-top, 0px)');
            document.documentElement.style.setProperty('--wn-safe-bottom', 'env(safe-area-inset-bottom, 0px)');

            const screens = $$('[data-wn-screen]');

           // Lista de IDs que costumam dar problema (AdBlockers ou Globais)
            const DANGEROUS_IDS = ['react', 'vue', 'angular', 'ad', 'ads', 'banner', 'track', 'tracker', 'pixel', 'popup', 'social'];

            // --- DETECTOR DE ERROS (Segurança) ---
            const idMap = {};


            const loadPromises = Array.from(screens).map(async screen => {

                 // 1. Checa Duplicatas
                if (idMap[screen.id]) {
                    console.error(`🔴 WrapNative Error: DUPLICATE SCREEN ID! The Screen '${screen.id}' exists more than once.`);
                    screen.style.border = "5px solid red"; 
                }
                idMap[screen.id] = true;

                // 2. Checa IDs Perigosos (Novo!)
                if (DANGEROUS_IDS.includes(screen.id.toLowerCase())) {
                    console.warn(`⚠️ WrapNative Warning: The ID '${screen.id}' is risky! It may be hidden by AdBlockers or conflict with browser extensions. We recommend renaming.`);
                }
                
                let dynamicPageResources = await utils.getContentPage(screen.id);
                
                if (dynamicPageResources) {
                    internalState.preLoadedDynamicPageResources[screen.id] = dynamicPageResources;
                    screen.innerHTML = dynamicPageResources.html;
                }
            });

            // O código vai PAUSAR aqui até todos os arquivos .html/.js/.css serem baixados
            await Promise.all(loadPromises); 

            let startRoute = '';
            
            screens.forEach(s => {
                if(!s.classList.contains('wn-hidden')) startRoute = s.id;
                else s.classList.add('wn-hidden');
            });

            if(!startRoute && screens.length > 0) {
                startRoute = screens[0].id;
                screens[0].classList.remove('wn-hidden');
            }

            if (startRoute) {
                internalState.currentRoute = startRoute;
                router.navigate(startRoute, false, false);
            }
            
            document.addEventListener('click', e => {
                const link = e.target.closest('[data-wn-link]');
                if (link) {
                    e.preventDefault();
                    router.navigate(link.getAttribute('href').replace('#', ''));
                }
            });

            // Two-Way Binding Listener (CORRIGIDO)
            document.addEventListener('input', e => {
                if (e.target.hasAttribute('data-model')) {
                    const key = e.target.getAttribute('data-model');
                    if (internalState.activeStore) {
                        internalState.activeStore[key] = e.target.value;
                    }
                }
            });
        },

        navigate: async (screenId, animate = true, pushToHistory = true) => {

            if (!screenId) return;
            const oldScreen = internalState.currentRoute ? $('#' + internalState.currentRoute) : null;
            const newScreen = $('#' + screenId);

            if (!newScreen) return;
            if (internalState.currentRoute === screenId && animate) return;

            const isRootTab = !!document.querySelector('.wn-nav-item[href="#' + screenId + '"]');
            
            if (isRootTab) {
                internalState.history = [];
                pushToHistory = false;
            } else if (pushToHistory && internalState.currentRoute) {
                internalState.history.push(internalState.currentRoute);
            }

            if(internalState.sidebarOpen) ui.toggleSidebar(false);
            if(animate) bridge.haptic('light');

            const title = newScreen.getAttribute('data-wn-title') || internalState.defaultTitle;
            const toolbarMode = newScreen.getAttribute('data-wn-toolbar') || 'default';
            const customActions = newScreen.querySelector('template.wn-actions');

            const toolbarEl = $('#wn-main-toolbar');
            const titleEl = $('#wn-toolbar-title');
            const actionsEl = $('#wn-toolbar-actions');
            const backBtn = $('#wn-back-btn');
            const menuBtn = $('#wn-menu-btn');

            internalState.currentRoute = screenId;

            const JS = internalState.preLoadedDynamicPageResources[screenId].js
            const CSS = internalState.preLoadedDynamicPageResources[screenId].css

            document.querySelectorAll('[data="dynamic-resource"]').forEach(element => {
                element.remove(); 
            });

            if(CSS)
            {
                let linkElement = document.createElement('link')
                linkElement.rel = 'stylesheet'
                linkElement.setAttribute('data','dynamic-resource')
                linkElement.href = CSS
                document.head.appendChild(linkElement)
            }

            if(JS)
            {
                let jsElement = document.createElement('script')
                jsElement.setAttribute('data','dynamic-resource')
                jsElement.src = JS
                document.body.appendChild(jsElement)
            }

            if(toolbarEl) {
                if(titleEl) titleEl.innerText = title;
                
                if (internalState.history.length > 0) {
                    if(menuBtn) menuBtn.classList.add('hidden');
                    if(backBtn) backBtn.classList.remove('hidden');
                } else {
                    if(backBtn) backBtn.classList.add('hidden');
                    if(menuBtn) menuBtn.classList.remove('hidden');
                }

                if(actionsEl) {
                    actionsEl.innerHTML = '';
                    if(customActions) actionsEl.appendChild(customActions.content.cloneNode(true));
                }

                if (toolbarMode === 'hidden') {
                    toolbarEl.classList.add('wn-hidden');
                    document.body.classList.remove('has-toolbar');
                } else {
                    toolbarEl.classList.remove('wn-hidden');
                    document.body.classList.add('has-toolbar');
                }
            }

            if (animate && oldScreen) 
            {
                if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion)').matches) {
                    document.startViewTransition(() => _swap(oldScreen, newScreen));
                } else {
                    _swap(oldScreen, newScreen);
                }
            } 
            else 
            {
                if(oldScreen) oldScreen.classList.add('wn-hidden');
                newScreen.classList.remove('wn-hidden');
            }
            $$('.wn-nav-item').forEach(el => {
                const isActive = el.getAttribute('href') === '#' + screenId;
                el.classList.toggle('wn-active', isActive);
                if(isActive) el.setAttribute('aria-current', 'page');
                else el.removeAttribute('aria-current');
            });
        },

        back: async () => {
            if (internalState.history.length === 0) return;
            const prevScreenId = internalState.history.pop();
            await router.navigate(prevScreenId, true, false);
        }
    };

    const router = router_v1

    function _swap(oldEl, newEl) {
        // console.log(`página antiga:${oldEl.id} nova página: ${newEl.id}`)
        if(oldEl) oldEl.classList.add('wn-hidden');
        newEl.classList.remove('wn-hidden');
        window.scrollTo(0, 0);
    }

    // --- UI MANAGER ---
    const ui = {
        openModal: (modalId) => {
            const modal = $('#' + modalId);
            if(modal) {
                modal.classList.remove('wn-hidden');
                requestAnimationFrame(() => modal.classList.add('wn-modal-open'));
                bridge.haptic('medium');
                internalState.activeModals++;
            }
        },

        closeModal: (modalId) => {
            const modal = $('#' + modalId);
            if(modal) {
                modal.classList.remove('wn-modal-open');
                setTimeout(() => {
                    modal.classList.add('wn-hidden');
                    const content = modal.querySelector('.wn-modal-content');
                    if(content) content.style.transform = '';
                    internalState.activeModals = Math.max(0, internalState.activeModals - 1);
                }, 300);
            }
        },

        // NEW: NATIVE-LIKE ALERT (Fixed & Optimized)
        alert: ({ title, message, buttons }) => {
            const overlay = document.createElement('div');
            overlay.className = 'wn-alert-overlay';
            
            // Default button if none provided
            if (!buttons || buttons.length === 0) {
                buttons = [{ text: 'OK', role: 'confirm' }];
            }

            const content = document.createElement('div');
            content.className = 'wn-alert-content';
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'wn-alert-header';
            headerDiv.innerHTML = '<div class="wn-alert-title">' + (title || '') + '</div>' +
                                  '<div class="wn-alert-msg">' + (message || '') + '</div>';
            content.appendChild(headerDiv);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'wn-alert-actions';

            buttons.forEach(btn => {
                const b = document.createElement('button');
                b.className = 'wn-alert-btn ' + (btn.role || '');
                b.innerText = btn.text;
                b.onclick = () => {
                    if (btn.handler) btn.handler();
                    closeAlert();
                };
                actionsDiv.appendChild(b);
            });
            content.appendChild(actionsDiv);

            overlay.appendChild(content);
            document.body.appendChild(overlay);

            // Animation: Force reflow then add class
            void overlay.offsetWidth; 
            overlay.classList.add('wn-alert-open');
            bridge.haptic('medium');

            function closeAlert() {
                overlay.classList.remove('wn-alert-open');
                setTimeout(() => overlay.remove(), 200);
            }
        },

        toggleSidebar: (forceState) => {
            const sidebar = $('#wn-sidebar');
            const overlay = $('#wn-sidebar-overlay');
            if(!sidebar) return;
            const newState = forceState !== undefined ? forceState : !internalState.sidebarOpen;
            internalState.sidebarOpen = newState;
            if(newState) {
                sidebar.classList.add('translate-x-0'); sidebar.classList.remove('-translate-x-full');
                if(overlay) { overlay.classList.remove('hidden'); requestAnimationFrame(() => overlay.classList.add('opacity-100')); }
            } else {
                sidebar.classList.remove('translate-x-0'); sidebar.classList.add('-translate-x-full');
                if(overlay) { overlay.classList.remove('opacity-100'); setTimeout(() => overlay.classList.add('hidden'), 300); }
            }
        },

        showWebToast: (msg) => {
            const toast = document.createElement('div');
            toast.className = 'wn-toast wn-toast-enter';
            toast.innerText = msg;
            document.body.appendChild(toast);
            setTimeout(() => toast.classList.remove('wn-toast-enter'), 10);
            setTimeout(() => { toast.classList.add('wn-toast-exit'); setTimeout(() => toast.remove(), 300); }, 3000);
        },

        toggleTheme: () => {
            internalState.isDark = !internalState.isDark;
            document.documentElement.classList.toggle('dark', internalState.isDark);
            localStorage.setItem('wn-theme', internalState.isDark ? 'dark' : 'light');
        },
        initTheme: () => {
            const saved = localStorage.getItem('wn-theme');
            if(saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                internalState.isDark = true;
                document.documentElement.classList.add('dark');
            }
        },

        showIOSGuide: () => {
            const guide = document.createElement('div');
            guide.className = 'wn-ios-modal';
            // Safe String Concatenation
            guide.innerHTML = '<div class="wn-ios-content">' +
                    '<div class="wn-ios-icon-wrapper"><i class="ph ph-export"></i></div>' +
                    '<h3>Instalar Aplicativo</h3>' +
                    '<p class="wn-ios-step">1. Toque no botão <strong>Compartilhar</strong> <span class="wn-ios-inline-icon"><i class="ph ph-export"></i></span>.</p>' +
                    '<div class="wn-ios-divider"></div>' +
                    '<p class="wn-ios-step">2. Selecione <strong>Adicionar à Tela de Início</strong> <span class="wn-ios-inline-icon"><i class="ph ph-plus-square"></i></span>.</p>' +
                    '<button class="wn-ios-btn">Entendi</button>' +
                '</div>';

            document.body.appendChild(guide);
            requestAnimationFrame(() => guide.classList.add('visible'));
            guide.querySelector('.wn-ios-btn').addEventListener('click', () => {
                guide.classList.remove('visible'); setTimeout(() => guide.remove(), 300);
            });
        },

        initGestures: () => {
             $$('.wn-modal-content').forEach(el => {
                let startY = 0; let currentY = 0; const modalId = el.parentElement.id;
                el.addEventListener('touchstart', (e) => { if(el.scrollTop <= 0) { startY = e.touches[0].clientY; el.style.transition = 'none'; } }, {passive: true});
                el.addEventListener('touchmove', (e) => {
                    if (startY === 0) return; currentY = e.touches[0].clientY; const diff = currentY - startY;
                    if (diff > 0 && el.scrollTop <= 0) { 
                        if(e.cancelable) e.preventDefault(); 
                        el.style.transform = 'translateY(' + diff + 'px)'; 
                    }
                }, {passive: false});
                el.addEventListener('touchend', () => {
                    if (startY === 0) return; el.style.transition = ''; const diff = currentY - startY;
                    if (diff > 120) ui.closeModal(modalId); else el.style.transform = ''; startY = 0; currentY = 0;
                });
            });

            let edgeStartX = 0;
            let edgeStartY = 0;

            document.addEventListener('touchstart', (e) => {
                edgeStartX = e.touches[0].clientX;
                edgeStartY = e.touches[0].clientY;
            }, {passive: true});

            document.addEventListener('touchend', (e) => {
                if (!edgeStartX) return;
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const diffX = endX - edgeStartX;
                const diffY = Math.abs(endY - edgeStartY);
                
                if (edgeStartX < 40 && diffX > 50 && diffX > diffY && !internalState.sidebarOpen) {
                    if (document.getElementById('wn-sidebar')) ui.toggleSidebar(true);
                }
                if (internalState.sidebarOpen && diffX < -50 && Math.abs(diffX) > diffY) {
                     if (document.getElementById('wn-sidebar')) ui.toggleSidebar(false);
                }
                edgeStartX = 0;
            });
        },

        initPTR: () => {

            const spinner = document.createElement('div'); 
            spinner.className = 'wn-ptr-spinner';
            spinner.innerHTML = '<i class="ph ph-arrow-down wn-ptr-icon"></i><div class="wn-spinner-icon"></div>'; 
            document.body.appendChild(spinner);
            
            let startY = 0;
            let isDragging = false;
            let activeScreen = null; 

            // Touch & Mouse Handlers Combined
            const onStart = (e) => {
                let y
            
                if (internalState.activeModals > 0 || e.target.closest('.wn-modal-overlay') || e.target.closest('.wn-modal-content')) return; // fix blocked PTR when any modals open

               // STRICT CHECK: Did user touch a screen container?
                const screenEl = e.target.closest('[data-wn-screen]');
                
                // STRICT CHECK: Does this specific screen have PTR enabled?
                if (!screenEl || !screenEl.hasAttribute('data-wn-ptr')) { 
                    activeScreen = null; 
                    return; 
                } 
                
                // STRICT CHECK: Is this the currently visible screen?
                if (screenEl.id !== internalState.currentRoute) {
                    activeScreen = null;
                    return;
                }

                if(e instanceof MouseEvent)  y =  e.clientY
                if(e instanceof TouchEvent )  y = e.touches[0].clientY 

                if (window.scrollY <= 1) {
                    startY = y;
                    isDragging = true;
                    spinner.style.transition = 'none';
                }
                
            };

            const onMove = (y, e) => {

             if (!isDragging|| internalState.activeModals > 0 || e.target.closest('.wn-modal-overlay') || e.target.closest('.wn-modal-content')) return; 

                const diff = y - startY;
                if (diff > 0 && window.scrollY <= 0) {
                    if(e.cancelable && e.type !== 'mousemove') e.preventDefault();
                    
                    const translate = Math.min(diff * 0.4, 80); 
                    spinner.style.transform = `translateY(${translate}px)`; 
                    spinner.style.opacity = Math.min(translate / 50, 1);
                    
                    const icon = spinner.querySelector('.wn-ptr-icon');
                    if(icon) icon.style.transform = diff > 60 ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            };

            const onEnd = (y) => {
                if (!isDragging) return;
                isDragging = false;
                const diff = y - startY;
                if (diff > 60 && window.scrollY <= 0) {
                    internalState.ptrLoading = true; 
                    spinner.classList.add('wn-ptr-loading');
                    spinner.style.transform = 'translateY(60px)'; 
                    spinner.style.opacity = '1'; 
                    // Dispatch Custom Event
                    document.dispatchEvent(new CustomEvent('wrapnative-refresh'));
                } else { 
                    ui.completePTR(); 
                }
                startY = 0;
            };

            // Touch Events
            window.addEventListener('touchstart', (e) => onStart(e), {passive: true});
            window.addEventListener('touchmove', (e) => onMove(e.touches[0].clientY, e), {passive: false});
            window.addEventListener('touchend', (e) => onEnd(e.changedTouches[0].clientY));

            // Mouse Events (For Desktop Testing)
            window.addEventListener('mousedown', (e) => onStart(e));
            window.addEventListener('mousemove', (e) => onMove(e.clientY, e));
            window.addEventListener('mouseup', (e) => onEnd(e.clientY));
        },

        completePTR: () => {
            internalState.ptrLoading = false;
            const spinner = document.querySelector('.wn-ptr-spinner');
            if(spinner) {
                spinner.classList.remove('wn-ptr-loading');
                spinner.style.transform = 'translateY(-20px)';
                spinner.style.opacity = '0';
                const icon = spinner.querySelector('.wn-ptr-icon');
                if(icon) icon.style.transform = 'rotate(0deg)';
            }
        },
        
        showInstallBanner: (isIOS) => {
            if (sessionStorage.getItem('wn-pwa-dismissed')) return;
            const banner = document.createElement('div');
            banner.className = 'wn-pwa-banner';
            // Safe String Concatenation
            banner.innerHTML = '<div class="wn-pwa-content">' +
                    '<div class="wn-pwa-icon"><i class="ph ph-download-simple"></i></div>' +
                    '<div class="wn-pwa-info">' +
                        '<strong>Instalar App</strong>' +
                        '<span>Adicionar à tela de início</span>' +
                    '</div>' +
                    '<button class="wn-pwa-btn">Instalar</button>' +
                '</div>' +
                '<button class="wn-pwa-close"><i class="ph ph-x"></i></button>';
            
            document.body.appendChild(banner);
            requestAnimationFrame(() => banner.classList.add('visible'));
            
            banner.querySelector('.wn-pwa-close').addEventListener('click', () => {
                banner.classList.remove('visible'); setTimeout(() => banner.remove(), 300);
                sessionStorage.setItem('wn-pwa-dismissed', 'true');
            });
            banner.querySelector('.wn-pwa-btn').addEventListener('click', () => {
                if (isIOS) ui.showIOSGuide();
                else if (internalState.deferredPrompt) {
                    internalState.deferredPrompt.prompt();
                    internalState.deferredPrompt.userChoice.then((r) => { if (r.outcome === 'accepted') banner.remove(); internalState.deferredPrompt = null; });
                }
            });
        }
    };

  // HELPER: Check conditions and show banner
    const checkAndTriggerPWA = () => {
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) return;
        
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isIOS) {
             ui.showInstallBanner(true);
        } else if (internalState.deferredPrompt) {
             ui.showInstallBanner(false);
        }
    };

    const pwa = {
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
        }
    };

    // GLOBAL PWA LISTENER (Early Catch)
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        internalState.deferredPrompt = e;
        // Also check cooldown for the early catch
        const last = localStorage.getItem('wn-pwa-dismissed');
        const COOLDOWN = 3; 
        //if (last && (Date.now() - parseInt(last)) / 86400000 < COOLDOWN) return;

        if (internalState.isReady) {
            //setTimeout(() => ui.showInstallBanner(false), 2000);
            checkAndTriggerPWA();
        }
        
    });

    const init = async () => {
    
        // SAFE BOOT CHECK: Wait for body
        if (!document.body) {
            window.addEventListener('DOMContentLoaded', init);
            return;
        }

        await router.init(); ui.initTheme(); ui.initGestures(); ui.initPTR(); pwa.init();
        
        // CRITICAL: Signal readiness and Reveal Body
        internalState.isReady = true;
        document.body.classList.add('wn-loaded');
        document.dispatchEvent(new CustomEvent('wrapnative-ready'));

        // Trigger PWA check (handles case where event fired BEFORE init)
        checkAndTriggerPWA();

        console.log('Nativify Engine v1.0.0 (Alpha) Ready');

    };

    // Auto-Init Logic (Apenas uma vez)
    if (document.readyState !== 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

   // RESTORED: onReady helper
    const onReady = (callback) => {
        if (internalState.isReady) callback();
        else document.addEventListener('wrapnative-ready', callback);
    };

   const wrapnative = { ui, router, bridge, pwa, init, state: stateManager, isReady: () => internalState.isReady, onReady };

    // Expose to Global Scope
    window.wrapnative = wrapnative
    window.WN = wrapnative; // Alias
    
})(window);

