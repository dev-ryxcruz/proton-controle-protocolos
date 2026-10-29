/**
 * PROTON v1.4 - Gestão do Gráfico de Tipos de Documentos (Chart.js)
 * Atualização eficiente via chart.update() sem destruir a instância do zero
 */

import { getCssVariable } from "../../utils/helpers.js";

export const getChartColors = () => {
  return {
    Ambulatorio: getCssVariable("--cor-ambulatório") || "#10b981",
    CDI: getCssVariable("--cor-tipo-cdi") || "#f59e0b",
    UE: getCssVariable("--cor-tipo-ue") || "#ef4444",
    Internacao: getCssVariable("--cor-internação") || "#667eea",
    Texto: getCssVariable("--cor-texto") || "#1e293b",
    Borda: getCssVariable("--cor-container") || "#ffffff",
  };
};

export const atualizarGraficoTipo = (state, chartCanvas) => {
  if (!chartCanvas || !window.Chart) return;

  const contagemTipos = { Ambulatorio: 0, CDI: 0, UE: 0, Internacao: 0 };

  state.dadosFiltrados
    .filter((item) => item.status === "Baixado")
    .forEach((item) => {
      if (item.quantidades) {
        for (const tipo in item.quantidades) {
          if (item.quantidades[tipo] > 0) {
            contagemTipos[tipo] += item.quantidades[tipo];
          }
        }
      }
    });

  const labels = Object.keys(contagemTipos).filter(
    (k) => contagemTipos[k] > 0
  );
  const data = Object.values(contagemTipos).filter((v) => v > 0);

  const themeColors = getChartColors();
  const colors = labels.map((label) => themeColors[label]);

  const formattedLabels = labels.map((l) => {
    switch (l) {
      case "Ambulatorio":
        return "Ambulatório";
      case "Internacao":
        return "Internação";
      default:
        return l;
    }
  });

  // Se o gráfico já existe, atualiza datasets e invoca chart.update()
  if (state.tipoDocumentoChart) {
    state.tipoDocumentoChart.data.labels = formattedLabels;
    state.tipoDocumentoChart.data.datasets[0].data = data;
    state.tipoDocumentoChart.data.datasets[0].backgroundColor = colors;
    state.tipoDocumentoChart.data.datasets[0].borderColor = themeColors.Borda;
    if (state.tipoDocumentoChart.options.plugins?.legend?.labels) {
      state.tipoDocumentoChart.options.plugins.legend.labels.color =
        themeColors.Texto;
    }
    state.tipoDocumentoChart.update();
  } else if (data.length > 0) {
    // Inicializa nova instância do gráfico caso não exista
    state.tipoDocumentoChart = new window.Chart(chartCanvas, {
      type: "doughnut",
      data: {
        labels: formattedLabels,
        datasets: [
          {
            data: data,
            backgroundColor: colors,
            borderColor: themeColors.Borda,
            borderWidth: 2,
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
              color: themeColors.Texto,
              padding: 20,
              usePointStyle: true,
              font: { size: 12 },
            },
          },
        },
      },
    });
  }
};

