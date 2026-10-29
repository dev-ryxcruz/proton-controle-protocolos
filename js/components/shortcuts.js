/**
 * PROTON v1.4 - Atalhos Globais de Teclado
 */

export const setupGlobalKeyboardShortcuts = () => {
  document.addEventListener("keydown", (e) => {
    // Não ativa se houver modal aberto
    if (document.querySelector('.modal[style*="display: block"]')) return;

    if (e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case "d":
          e.preventDefault();
          document.getElementById("checkbox")?.click();
          break;
        case "?":
          e.preventDefault();
          document.getElementById("btnShowShortcuts")?.click();
          break;
      }
    }
  });
};

