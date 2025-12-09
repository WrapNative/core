console.log("Script da página home carregado!")


WN.onReady(()=>{

    document.addEventListener('wrapnative-refresh', () => {
        WN.ui.showWebToast('Atualizando dados...');
        setTimeout(() => {
            WN.ui.completePTR();
            WN.ui.showWebToast('Concluído!');
        }, 2000);
    });
})
