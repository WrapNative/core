 // Variável "escondida" no escopo do módulo para segurar a instância
 
 export function createStateManager(internalState,utils) {

    const { $$ } = utils

    const updateUI = (key, value) => {
        // SEGURANÇA: Se o framework não estiver pronto, não tente buscar elementos
        if (!internalState.isReady) return;

        $$(`[data-bind="${key}"]`).forEach(el => el.innerText = value);

        $$(`[data-model="${key}"]`).forEach(el => {
            if (el.value !== String(value)) el.value = value;
        });

        $$(`[data-if="${key}"]`).forEach(el => {
            // Verifica truthy/falsy
            value ? el.classList.remove('wn-hidden') : el.classList.add('wn-hidden');
        });
    };

// --- Função para Sincronizar Tudo (Quando o App ficar pronto) ---
    const syncDOM = (proxy) => {
        Object.keys(proxy).forEach(key => {
            updateUI(key, proxy[key]);
            bindInputEvents(proxy, key);
        });
    };

    // Função para ligar o DOM ao State (DOM -> State)
    const bindInputEvents = (proxy, key) => {
        $$(`[data-model="${key}"]`).forEach(el => {
            // Evita adicionar listeners duplicados se chamar reactive() 2x
            if (el._wn_bound) return; 
            
            el.addEventListener('input', (e) => {
                // Atualiza o Proxy, que vai disparar o 'set' e atualizar outros locais
                proxy[key] = e.target.value; 
            });
            el._wn_bound = true; // Marca como "ligado"
        });
    };
    return {

        reactive: (data={}) => {
            
            let proxy;

            // 1. MERGE STRATEGY (Singleton)
            if (internalState.activeStore) {
                proxy = internalState.activeStore;
                Object.keys(data).forEach(key => {
                    proxy[key] = data[key];
                });
                // Se já estiver pronto, atualiza o DOM agora. 
                // Se não, o listener global abaixo vai cuidar disso depois.
                if (internalState.isReady) syncDOM(proxy);
                return proxy;
            }

            // 2. CREATE STRATEGY
            proxy = new Proxy(data, {
                set(target, key, value) {
                    target[key] = value;
                    updateUI(key, value); // Se não estiver ready, o updateUI aborta (return)
                    return true;
                }
            });

            internalState.activeStore = proxy;

            // 3. O PULO DO GATO (Lazy Initialization)
            if (internalState.isReady) {
                // Cenário A: Criado dentro de onReady ou Rota (DOM existe)
                syncDOM(proxy);
            } else {
                // Cenário B: Criado no topo do arquivo (DOM não existe)
                // "Ei framework, quando você terminar de carregar, atualize essa store na tela"
                document.addEventListener('wrapnative-ready', () => {
                    console.log("🔄 Sincronizando Store tardia com o DOM...");
                    syncDOM(proxy);
                });
            }

            return proxy;
        }
    }
        
};