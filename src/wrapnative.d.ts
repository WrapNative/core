/**
 * Type Definitions for Nativify Engine.
 * Place this file in your project root to enable IntelliSense in VS Code.
 */

/**
 * Opções para os botões do Alerta Nativo.
 */
interface NativifyAlertButton {
    /** Texto exibido no botão */
    text: string;
    /** Papel do botão (ex: 'cancel' fecha sem ação, 'confirm' é o padrão) */
    role?: 'cancel' | 'confirm' | string;
    /** Função executada ao clicar */
    handler?: () => void;
}

/**
 * Opções de configuração para o Alerta.
 */
interface WrapNativeAlertOptions {
    title?: string;
    message?: string;
    buttons?: WrapNativeAlertButton[];
}


interface IUtils {
    $(selector:string): ?Element
    $$(selector:string): NodeList<Element>
    _swap(oldEL:Element,newEl:HTMLElement) : void
    urlRevoke(): Promise<string | undefined>
    getContentPage(): Promise<{ html:?string, css:?string, js:?string}> | undefined
    loadDynamicFile(): Promise<string | undefined>
}

/**
 * Gerenciador de Rotas e Navegação SPA.
 */
interface WrapNativeRouter {
    /**
     * Inicializa o roteador (Chamado internamente).
     */
    init(): void;

    /**
     * Navega para uma tela específica pelo ID do elemento HTML.
     * @param screenId O ID do elemento da tela (ex: 'home', 'profile').
     * @param animate Se deve usar a ViewTransition ou animação simples (padrão: true).
     * @param pushToHistory Se deve adicionar esta navegação à pilha de voltar (padrão: true).
     */
    navigate(screenId: string, animate?: boolean, pushToHistory?: boolean): Promise<void>;

    /**
     * Volta para a tela anterior no histórico.
     * Se não houver histórico, não faz nada.
     */
    back(): Promise<void>;
}

/**
 * Gerenciador de Interface do Usuário (Modais, Alertas, Temas).
 */
interface WrapNativeUI {
    /**
     * Abre um modal pelo ID, adicionando classe de visibilidade e animação.
     * @param modalId O ID do elemento HTML do modal.
     */
    openModal(modalId: string): void;

    /**
     * Fecha um modal com animação de saída.
     * @param modalId O ID do elemento HTML do modal.
     */
    closeModal(modalId: string): void;

    /**
     * Exibe um alerta nativo (centralizado e com backdrop).
     * @param options Configurações de título, mensagem e botões.
     */
    alert(options: WrapNativeAlertOptions): void;

    /**
     * Abre ou fecha o menu lateral (Sidebar).
     * @param forceState (Opcional) true para abrir, false para fechar.
     */
    toggleSidebar(forceState?: boolean): void;

    /**
     * Exibe uma mensagem flutuante temporária (Toast).
     * @param msg A mensagem a ser exibida.
     */
    showWebToast(msg: string): void;

    /**
     * Alterna entre o tema Claro e Escuro e salva a preferência no localStorage.
     */
    toggleTheme(): void;

    /**
     * Finaliza a animação de carregamento do Pull-to-Refresh (PTR).
     * Deve ser chamado após o término da requisição de dados.
     */
    completePTR(): void;

    // Métodos internos (geralmente automáticos)
    initTheme(): void;
    showInstallBanner(isIOS: boolean): void;
    showIOSGuide(): void;
    initGestures(): void;
    initPTR(): void;
}

/**
 * Ponte para recursos nativos do dispositivo (Capacitor/Cordova) com fallback Web.
 */
interface WrapNativeBridge {
    /**
     * Verifica se está rodando em um ambiente nativo (App híbrido).
     */
    isNative(): boolean;

    /**
     * Dispara feedback tátil (vibração).
     * @param style Intensidade: 'light', 'medium' ou 'heavy'.
     */
    haptic(style?: 'light' | 'medium' | 'heavy'): Promise<void>;

    /**
     * Exibe um Toast nativo (se disponível) ou Web Toast.
     */
    toast(message: string): Promise<void>;

    /**
     * Invoca a gaveta de compartilhamento nativa do sistema.
     */
    share(data: any): Promise<void>;

    /**
     * Abre a câmera ou galeria do dispositivo.
     * @returns Promise com a imagem em Base64 ou null se cancelado.
     */
    camera(): Promise<string | null>;

    /**
     * Solicita autenticação do usuário (Biometria, FaceID ou Confirmação simples na Web).
     * @param reason Mensagem exibida ao solicitar a biometria.
     * @returns Promise true se autenticado com sucesso, false caso contrário.
     */
    authenticate(reason?: string): Promise<boolean>;
}

/**
 * Gerenciador de Estado Reativo (Proxy).
 */
interface WrapNativeState {
    /**
     * Cria um objeto reativo que atualiza o DOM automaticamente.
     * Vincula chaves a atributos `data-bind`, `data-model` e `data-if`.
     * @param initialData Objeto inicial com os dados.
     * @returns Um Proxy do objeto original.
     */
    reactive<T extends object>(initialData: T): T;
}

/**
 * Interface Principal da Engine WrapNative.
 */
interface WrapNativeEngine {
    router: WrapNativeRouter;
    ui: WrapNativeUI;
    bridge: WrapNativeBridge;
    state: WrapNativeState;

    /**
     * Inicializa a engine manualmente (geralmente chamado automaticamente pelo DOMContentLoaded).
     */
    init(): void;

    /**
     * Retorna verdadeiro se a engine já carregou completamente.
     */
    isReady(): boolean;

    /**
     * O Ponto de Entrada seguro. Executa o callback apenas quando a Engine e o DOM estão prontos.
     * Use isso em vez de DOMContentLoaded.
     * @param callback Função com a lógica do seu app.
     */
    onReady(callback: () => void): void;
}

// Declaração global para uso sem importação
declare const wrapnative: WrapNativeEngine;

// Extensão da interface Window
interface Window {
    wrapNative: NativifyEngine;
    // Variável interna para evitar dupla inicialização no boilerplate
    __appInitialized?: boolean;
}