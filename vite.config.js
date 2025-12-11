import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    // A pasta de saída
    outDir: 'dist',
    
    // Minificação: 'terser' é ótimo para reduzir tamanho, 
    // ou 'esbuild' (padrão) que é mais rápido.
    minify: 'esbuild', 
    
    lib: {
      // O arquivo principal onde você exporta as ferramentas do framework
      entry: path.resolve(__dirname, 'src/index.js'),
      
      // O nome da variável global que o navegador vai enxergar
      // Ex: window.MeuFramework
      name: 'wrapnative',
      
      // O nome do arquivo final (ex: meu-framework.js)
      fileName: () => `wrapnative.js`,
      
      // Formatos de saída. 
      // 'iife' é o que você quer: um script que roda direto no navegador (<script src="...">)
      // 'es' seria para quem usa import/export moderno.
      formats: ['iife'] 
    }
  }
});