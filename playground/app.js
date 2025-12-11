/**
 * app.js - Controller Principal
 */

wrapnative.onReady(()=>{

    const store = wrapnative.state.reactive({
        count: 0,// HTML: <span data-bind="count">0</span>
        user:'Coder'// HTML: <p>Hello, <span data-bind="user">Coder</span>!</p>
    }); 

    // 2. Event Delegate
    document.addEventListener('click', async (e) => {
        if(e.target.closest('#btn-docs-search')) {
            wrapnative.bridge.toast('Buscando...');
        }
        
        if(e.target.closest('#btn-teste')) {
            const foto = await wrapnative.bridge.camera();
            if(foto) wrapnative.bridge.toast('Foto capturada!');
        }
        
        // Exemplo de Alerta Nativo
        if(e.target.closest('#btn-alert-demo')) {
            wrapnative.ui.alert({
                title: 'Attention',
                message: 'Do you really want to delete this item?',
                buttons: [
                    { text: 'Cancel', role: 'cancel', handler: () => console.log('Canceled') },
                    { text: 'Delete', handler: () => wrapnative.bridge.toast('Deleted!') }
                ]
            });
        }
    });
    
    // document.getElementById('count').addEventListener('click', () => {
    //     store.count++
    // });
    document.addEventListener('wrapnative-refresh',async ()=>{
        console.log('teste')
        
    })
    
})
