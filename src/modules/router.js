
export function createRouter(internalState, bridge,utils) {

    const { $$,$, _swap, getContentPage } = utils
    
    return {

        init: async () => {
            document.documentElement.style.setProperty('--wn-safe-top', 'env(safe-area-inset-top, 0px)');
            document.documentElement.style.setProperty('--wn-safe-bottom', 'env(safe-area-inset-bottom, 0px)');

            const screens = $$('[data-wn-screen]');
           
            // Lista de IDs que costumam dar problema (AdBlockers ou Globais)
            const DANGEROUS_IDS = ['react', 'vue', 'angular', 'ad', 'ads', 'banner', 'track', 'tracker', 'pixel', 'popup', 'social'];

            // --- DETECTOR DE ERROS (Segurança) ---
            const idMap = {};

            const loadPromises = Array.from(screens).map(async screen => {
        
                if(!(screen instanceof HTMLDivElement)) throw new Error("Don't screen finded, screen need be a DIV ELEMENT")
               
                let screenName = screen.dataset.wnScreen
                screen.id = screenName
                // 1. Checa Duplicatas
                if (idMap[screenName]) console.error(`🔴 WrapNative Error: DUPLICATE SCREEN ID! The Screen '${screen.id}' exists more than once.`);
                
                idMap[screen.id] = true;

                // 2. Checa IDs Perigosos (Novo!)
                if (DANGEROUS_IDS.includes(screenName.toLowerCase()))  console.warn(`⚠️ WrapNative Warning: The ID '${screenName}' is risky! It may be hidden by AdBlockers or conflict with browser extensions. We recommend renaming.`);
                
                if(screen.children.length === 0 || screen.dataset.wnDynamicResource) 
                {
                   
                    let dynamicResource = (screen.dataset.wnDynamicResource ?  screen.dataset.wnDynamicResource.trim() : "").split('|')
                    if(screen.children.length === 0 )  dynamicResource.push('html')
                    let dynamicPageResources = await getContentPage( screenName,dynamicResource.filter(c => c.length >= 2 ).join("|"));
                    internalState.loadedDynamicResources[screenName]=dynamicPageResources
                    if(screen.children.length === 0 ) screen.innerHTML = dynamicPageResources.html;
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
                wrapnative.router.navigate(startRoute, false, false);
            }
            
            document.addEventListener('click', e => {
                const link = e.target.closest('[data-wn-link]');
                if (link) {
                    e.preventDefault();
                    wrapnative.router.navigate(link.getAttribute('href').replace('#', ''));
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

            document.querySelectorAll('[data-resource="dynamic-resource"]').forEach(element => {
                element.remove(); 
            });

            // load dynamic files 
            if(internalState.loadedDynamicResources[screenId] )
            {
               
                let pageDynamicResources = internalState.loadedDynamicResources[screenId]
                if(pageDynamicResources['css'])
                {
                   
                    let linkElement = document.createElement('link')
                    linkElement.rel = 'preload'
                    linkElement.as = 'style'
                    linkElement.setAttribute('data-resource','dynamic-resource')
                    linkElement.href = internalState.loadedDynamicResources[screenId].css
                    document.head.appendChild(linkElement)
                    let cloneLinkELement = document.createElement('link')
                    cloneLinkELement.href = internalState.loadedDynamicResources[screenId].css
                    cloneLinkELement.rel = 'stylesheet'
                    cloneLinkELement.setAttribute('data-resource','dynamic-resource')
                    document.head.appendChild(cloneLinkELement)
                }

                if(pageDynamicResources['js'])
                {
                    let jsElement = document.createElement('script')
                    jsElement.setAttribute('data-resource','dynamic-resource')
                    jsElement.src = internalState.loadedDynamicResources[screenId].js
                    document.body.appendChild(jsElement)
                }
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
            await wrapnative.router.navigate(prevScreenId, true, false);
        }
    }

}




