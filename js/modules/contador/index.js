/**
 * PROTON v1.4 - Módulo Contador de Digitalização
 * Contagem manual rápida para Ambulatório e Internação com gráfico em tempo real e PDF
 */

import { STORAGE_KEYS } from "../../constants/storage.js";
import { getCssVariable } from "../../utils/helpers.js";
import { showToast } from "../../components/toast.js";
import { showConfirmModal } from "../../components/modal.js";
import { generatePDF } from "../../services/pdfService.js";

export const contadorApp = () => {
  if (!document.getElementById("tab-contador")) return {};

  const elements = {
    ambulatorioCount: document.getElementById("ambulatorio-count"),
    internacaoCount: document.getElementById("internacao-count"),
    totalCount: document.getElementById("total-count"),
    addAmbulatorioBtn: document.getElementById("add-ambulatorio-btn"),
    removeAmbulatorioBtn: document.getElementById("remove-ambulatorio-btn"),
    addInternacaoBtn: document.getElementById("add-internacao-btn"),
    removeInternacaoBtn: document.getElementById("remove-internacao-btn"),
    resetBtn: document.getElementById("reset-btn"),
    pdfBtn: document.getElementById("pdf-btn"),
    chartCanvas: document.getElementById("contadorChart"),
  };

  let state = {
    ambulatorioCount:
      parseInt(localStorage.getItem(STORAGE_KEYS.contadorAmbulatorio)) || 0,
    internacaoCount:
      parseInt(localStorage.getItem(STORAGE_KEYS.contadorInternacao)) || 0,
    chart: null,
  };

  const saveState = () => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.contadorAmbulatorio,
        state.ambulatorioCount
      );
      localStorage.setItem(
        STORAGE_KEYS.contadorInternacao,
        state.internacaoCount
      );
    } catch (error) {
      console.error("Erro ao salvar estado do contador:", error);
    }
  };

  const updateChart = () => {
    if (!elements.chartCanvas || !window.Chart) return;

    if (state.chart) {
      try {
        state.chart.destroy();
      } catch (e) {
        console.warn("Aviso ao atualizar gráfico do contador:", e);
      }
    }

    const containerColor = getCssVariable("--cor-container") || "#ffffff";
    const ambulatorioColor = getCssVariable("--cor-ambulatório") || "#10b981";
    const internacaoColor = getCssVariable("--cor-internação") || "#667eea";
    const isDarkMode = document.documentElement.classList.contains("dark-mode");
    const legendColor = isDarkMode ? "#f1f5f9" : "#1e293b";

    state.chart = new window.Chart(elements.chartCanvas, {
      type: "doughnut",
      data: {
        labels: ["Ambulatório", "Internação"],
        datasets: [
          {
            label: "Quantidade",
            data: [state.ambulatorioCount, state.internacaoCount],
            backgroundColor: [ambulatorioColor, internacaoColor],
            borderColor: containerColor,
            borderWidth: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: legendColor,
              padding: 20,
              usePointStyle: true,
              font: {
                size: 14,
                weight: "bold",
              },
            },
          },
        },
        elements: {
          arc: {
            borderWidth: 3,
          },
        },
      },
    });
  };

  const updateDisplay = () => {
    const total = state.ambulatorioCount + state.internacaoCount;

    if (elements.ambulatorioCount) elements.ambulatorioCount.textContent = state.ambulatorioCount;
    if (elements.internacaoCount) elements.internacaoCount.textContent = state.internacaoCount;
    if (elements.totalCount) elements.totalCount.textContent = total;

    updateChart();
    saveState();
  };

  const resetCount = async () => {
    const confirmed = await showConfirmModal(
      "Zerar Contagem?",
      "Tem certeza que deseja zerar todas as contagens? Esta ação não pode ser desfeita."
    );

    if (confirmed) {
      state.ambulatorioCount = 0;
      state.internacaoCount = 0;
      updateDisplay();
      showToast("info", "Contagem Zerada", "Todas as contagens foram zeradas.");
    }
  };

  const setupEventListeners = () => {
    elements.addAmbulatorioBtn?.addEventListener("click", () => {
      state.ambulatorioCount++;
      updateDisplay();
    });

    elements.removeAmbulatorioBtn?.addEventListener("click", () => {
      if (state.ambulatorioCount > 0) {
        state.ambulatorioCount--;
        updateDisplay();
      }
    });

    elements.addInternacaoBtn?.addEventListener("click", () => {
      state.internacaoCount++;
      updateDisplay();
    });

    elements.removeInternacaoBtn?.addEventListener("click", () => {
      if (state.internacaoCount > 0) {
        state.internacaoCount--;
        updateDisplay();
      }
    });

    elements.resetBtn?.addEventListener("click", resetCount);

    elements.pdfBtn?.addEventListener("click", () => {
      generatePDF({
        ambulatorioCount: state.ambulatorioCount,
        internacaoCount: state.internacaoCount,
      });
    });

    // Atalhos de teclado da aba: Alt + A, Alt + I, Alt + R
    document.addEventListener("keydown", (e) => {
      if (document.querySelector('.modal[style*="display: block"]')) return;

      if (
        e.altKey &&
        document.getElementById("tab-contador")?.classList.contains("active")
      ) {
        switch (e.key.toLowerCase()) {
          case "a":
            e.preventDefault();
            elements.addAmbulatorioBtn?.click();
            break;
          case "i":
            e.preventDefault();
            elements.addInternacaoBtn?.click();
            break;
          case "r":
            e.preventDefault();
            resetCount();
            break;
        }
      }
    });

    // Observer para atualizar cores do gráfico quando alternar tema claro/escuro
    const themeObserver = new MutationObserver(() => {
      setTimeout(updateChart, 50);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  };

  const init = () => {
    updateDisplay();
    setupEventListeners();
  };

  init();

  return {
    updateDisplay,
    state,
  };
};

