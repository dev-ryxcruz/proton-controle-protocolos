/**
 * PROTON v1.4 - Ponto de Entrada da Aplicação (Application Orchestrator)
 * Inicialização de módulos, alternância de abas e montagem do ciclo de vida
 */

import { LoadingManager } from "./components/loading.js";
import { initTheme, setupThemeToggle } from "./components/theme.js";
import { initTimer } from "./components/timer.js";
import { setupUX } from "./components/ux.js";
import { setupCommandPalette } from "./components/palette.js";
import { setupGlobalKeyboardShortcuts } from "./components/shortcuts.js";
import { setupEasterEgg } from "./modules/easterEgg.js";
import { protocoloApp } from "./modules/protocolo/index.js";
import { contadorApp } from "./modules/contador/index.js";
import { novidadesApp } from "./modules/novidades/index.js";

const setupTabs = () => {
  const tabLinks = document.querySelectorAll(".tab-link");
  const tabContents = document.querySelectorAll(".tab-content");
  const protonShortcuts = document.getElementById("proton-shortcuts");
  const contadorShortcuts = document.getElementById("contador-shortcuts");

  tabLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const tabId = link.getAttribute("data-tab");
      if (!tabId) return;

      tabLinks.forEach((item) => {
        item.classList.remove("active");
        item.setAttribute("aria-selected", "false");
      });
      tabContents.forEach((item) => item.classList.remove("active"));

      link.classList.add("active");
      link.setAttribute("aria-selected", "true");
      const targetContent = document.getElementById(tabId);
      if (targetContent) targetContent.classList.add("active");

      // Alternar visualização dos atalhos
      if (tabId === "tab-proton") {
        if (protonShortcuts) protonShortcuts.style.display = "block";
        if (contadorShortcuts) contadorShortcuts.style.display = "none";
      } else if (tabId === "tab-contador") {
        if (protonShortcuts) protonShortcuts.style.display = "none";
        if (contadorShortcuts) contadorShortcuts.style.display = "block";
      } else {
        if (protonShortcuts) protonShortcuts.style.display = "none";
        if (contadorShortcuts) contadorShortcuts.style.display = "none";
      }
    });
  });
};

export const initializeApp = () => {
  LoadingManager.show("Inicializando PROTON...");

  // 1. Inicializa Tema e alternador
  initTheme();
  setupThemeToggle();

  // 2. Navegação entre abas
  setupTabs();

  // 3. Inicializa Cronômetro de produtividade
  initTimer();

  // 4. Inicializa os módulos de negócio
  const protonInstance = protocoloApp();
  const contadorInstance = contadorApp();
  const novidadesInstance = novidadesApp();

  // 5. Atalhos, Command Palette (Ctrl+K) e UX
  setupGlobalKeyboardShortcuts();
  setupCommandPalette();
  setupUX();
  setupEasterEgg();

  // Esconde overlay de carregamento
  setTimeout(() => {
    LoadingManager.hide();
  }, 400);

  // Expõe instâncias no escopo window para integração e depuração
  window.proton = {
    protocolo: protonInstance,
    contador: contadorInstance,
    novidades: novidadesInstance,
  };

  return { protonInstance, contadorInstance, novidadesInstance };
};

// Auto-inicialização quando o DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

