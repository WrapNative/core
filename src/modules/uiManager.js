

// --- UI MANAGER ---
export function createUiManager (internalState , utils){

    const { $$, $} = utils

    return {

        openModal: (modalId) => {
            const modal = $('#' + modalId);
            if(modal) {
                modal.classList.remove('wn-hidden');
                requestAnimationFrame(() => modal.classList.add('wn-modal-open'));
                wrapnative.bridge.haptic('medium');
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
            wrapnative.bridge.haptic('medium');

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
                    if (diff > 120) wrapnative.ui.closeModal(modalId); else el.style.transform = ''; startY = 0; currentY = 0;
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
                    wrapnative.ui.completePTR(); 
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
                if (isIOS) wrapnative.ui.showIOSGuide();
                else if (internalState.deferredPrompt) {
                    internalState.deferredPrompt.prompt();
                    internalState.deferredPrompt.userChoice.then((r) => { if (r.outcome === 'accepted') banner.remove(); internalState.deferredPrompt = null; });
                }
            });
        }
    }
};
