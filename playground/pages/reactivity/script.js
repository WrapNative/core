wrapnative.onReady( async ()=> {

    const store = wrapnative.state.reactive({
        user:{ name:'marcos'},
        livro: { title: 'Java', year: 2009 }
    }); 

    const decrement = () => store.count > 0 && store.count--
    const increment = () => store.count >= 0 && store.count++

    document.getElementById('increment').addEventListener('click',increment)
    document.getElementById('decrement').addEventListener('click',decrement)

})