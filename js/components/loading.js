/**
 * PROTON v1.4 - Gerenciador de Loading Overlay
 */

export const LoadingManager = {
  show: (message = "Carregando...") => {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
      const p = overlay.querySelector("p");
      if (p) p.textContent = message;
      overlay.style.display = "flex";
      overlay.style.opacity = "1";
    }
  },

  hide: () => {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.style.display = "none";
        overlay.style.opacity = "1";
      }, 300);
    }
  },
};

