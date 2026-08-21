// Declaração única do SDK do Google Identity Services (window.google), pra
// não duplicar `declare global` em cada componente que usa o botão do
// Google — declarações duplicadas com shapes diferentes quebram o build.
export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme: string; width: number; text?: string }
          ) => void;
        };
      };
    };
  }
}
