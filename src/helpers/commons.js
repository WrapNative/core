function $(selector) {
        if (!selector || selector === '#' || selector.trim() === '') return null;
        try { return document.querySelector(selector); }
        catch (e) { return null; }
};

function $$ (selector) { return document.querySelectorAll(selector) };

function urlRevoke (element, uri){
   element.onload = () => {
      URL.revokeObjectURL(uri);
   }
}

 async function loadDynamicFile ( props, required = false) {
        const { page, fileName } = props
        try {

                let fileRequest = await fetch(`./pages/${page}/${fileName}`)

                if (!fileRequest.ok && required) throw new Error(` Failed to load: ${page} page ${fileName}`);

                // 2. Detecta o tipo automaticamente pelo cabeçalho
                const contentType = fileRequest.headers.get('content-type');
                const contentText = await fileRequest.text()
                let blobType;

                if (contentText.length <= 0 || contentText.includes("Cannot GET")) {
                        return undefined
                }

                if (required && contentText.length <= 0) {
                        throw new Error(`Arquivo: ${fileName} requerido existe, mas esta vazio!`);
                }
                // 3. Lógica de Decisão (JS vs CSS)
                else if (contentType && contentType.includes('javascript')) {

                        // É JAVASCRIPT
                        blobType = contentType.split(';')[0] //'application/javascript';

                        // Adiciona o hack para aparecer nomeado no DevTools
                        const scriptComSourceMap = `(() => { ${contentText} })();`; // user code isolate
                        
                        //+ `\n//# sourceURL=${fileName}`;
                        const blob = new Blob([scriptComSourceMap], { type: blobType });
                        if (contentText.length <= 0) throw new Error(`Arquivo: ${fileName} requerido existe, mas esta vazio!`);
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
        catch (e) {
                console.error(e)
        }
}

 async function getContentPage (pageName,resources)  {

        const filename = { css: 'style', html: 'index', js: 'script'}
        try {
                let pageResources = { html: undefined, css:undefined, js:undefined}
                resources.split('|').map(async type => {
                        pageResources[type] = utils.loadDynamicFile({ page: pageName, fileName: `${filename[type]}.${type}` })
                        return pageResources
                }, true)

                await Promise.all(Object.values(pageResources)).then(resources => {
                    const [ html, css, js ] = resources
                    pageResources = { html , css, js }
                })

                return pageResources
        }
        catch (e) {
                console.warn(e)
        }
}

function _swap (oldEl, newEl) {
        // console.log(`página antiga:${oldEl.id} nova página: ${newEl.id}`)
        if(oldEl) oldEl.classList.add('wn-hidden');
        newEl.classList.remove('wn-hidden');
        window.scrollTo(0, 0);
}

export const utils = {
        $,
        $$,
        _swap,
        urlRevoke,
        getContentPage,
        loadDynamicFile
}