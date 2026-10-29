/**
 * PROTON v1.4 - Relatório Diário com Gráfico de Timeline de Produtividade
 */

import { getChartColors } from "./chart.js";

export const setupRelatorio = (state) => {
  const modalRelatorio = document.getElementById("modalRelatorio");
  const btnRelatorio = document.getElementById("btnRelatorio");
  const fecharModalRelatorio = document.getElementById("fecharModalRelatorio");

  if (!modalRelatorio || !btnRelatorio) return;

  let relatorioChart = null;

  const buildChart = () => {
    const today = new Date().toLocaleDateString("pt-BR");

    const todayActs = state.atividades.filter((a) => {
      return a.timestamp && a.timestamp.startsWith(today);
    });

    const buckets = {};
    for (let h = 0; h < 24; h++) buckets[h] = { add: 0, conference: 0 };

    todayActs.forEach((a) => {
      const parts = a.timestamp.split(", ");
      if (!parts[1]) return;
      const hour = parseInt(parts[1].split(":")[0], 10);
      if (isNaN(hour)) return;
      if (a.type === "add") buckets[hour].add++;
      if (a.type === "conference") buckets[hour].conference++;
    });

    const activeHours = Object.keys(buckets)
      .map(Number)
      .filter((h) => buckets[h].add + buckets[h].conference > 0);
    const hours =
      activeHours.length > 0
        ? activeHours
        : Array.from({ length: 10 }, (_, i) => i + 8);

    const labels = hours.map((h) => `${String(h).padStart(2, "0")}h`);
    const addData = hours.map((h) => buckets[h].add);
    const confData = hours.map((h) => buckets[h].conference);

    const totalAdd = todayActs.filter((a) => a.type === "add").length;
    const totalConf = todayActs.filter((a) => a.type === "conference").length;

    const peakHour =
      activeHours.length > 0
        ? activeHours.reduce(
            (p, h) =>
              buckets[h].add + buckets[h].conference >
              buckets[p].add + buckets[p].conference
                ? h
                : p,
            activeHours[0]
          )
        : null;

    const ritmo =
      activeHours.length > 0
        ? (todayActs.length / activeHours.length).toFixed(1)
        : "--";

    document.getElementById("relatorioTotalAdicionados").textContent = totalAdd;
    document.getElementById("relatorioTotalBaixados").textContent = totalConf;
    document.getElementById("relatorioHoraPico").textContent =
      peakHour !== null ? `${String(peakHour).padStart(2, "0")}:00` : "--";
    document.getElementById("relatorioRitmo").textContent = ritmo;
    document.getElementById("relatorioDataAtual").textContent = `Dados de hoje — ${today}`;

    const wrapper = document.querySelector(".relatorio-chart-wrapper");
    const canvas = document.getElementById("relatorioTimelineChart");

    if (todayActs.length === 0) {
      if (canvas) canvas.style.display = "none";
      if (wrapper && !wrapper.querySelector(".relatorio-empty")) {
        const empty = document.createElement("div");
        empty.className = "relatorio-empty";
        empty.innerHTML =
          '<i class="fas fa-moon"></i><span>Nenhuma atividade registrada hoje.</span><small>Comece adicionando protocolos!</small>';
        wrapper.appendChild(empty);
      }
      return;
    }

    const emptyEl = wrapper && wrapper.querySelector(".relatorio-empty");
    if (emptyEl) emptyEl.remove();
    if (canvas) canvas.style.display = "";

    if (relatorioChart) {
      try {
        relatorioChart.destroy();
      } catch (e) {}
    }

    const themeColors = getChartColors();

    if (window.Chart && canvas) {
      relatorioChart = new window.Chart(canvas, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Adicionados",
              data: addData,
              backgroundColor: "rgba(102,126,234,0.7)",
              borderColor: "#764ba2",
              borderWidth: 2,
              borderRadius: 6,
              borderSkipped: false,
            },
            {
              label: "Baixados",
              data: confData,
              backgroundColor: "rgba(16,185,129,0.7)",
              borderColor: "#059669",
              borderWidth: 2,
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: themeColors.Texto,
                usePointStyle: true,
                padding: 16,
                font: { size: 12 },
              },
            },
            tooltip: {
              callbacks: {
                title: (items) => `Horário: ${items[0].label}`,
                label: (item) => ` ${item.dataset.label}: ${item.parsed.y}`,
              },
            },
          },
          scales: {
            x: {
              ticks: { color: themeColors.Texto },
              grid: { color: "rgba(128,128,128,0.12)" },
            },
            y: {
              beginAtZero: true,
              ticks: { color: themeColors.Texto, stepSize: 1, precision: 0 },
              grid: { color: "rgba(128,128,128,0.12)" },
            },
          },
        },
      });
    }
  };

  btnRelatorio.addEventListener("click", () => {
    modalRelatorio.style.display = "block";
    modalRelatorio.setAttribute("aria-hidden", "false");
    buildChart();
  });

  if (fecharModalRelatorio) {
    fecharModalRelatorio.addEventListener("click", () => {
      modalRelatorio.style.display = "none";
      modalRelatorio.setAttribute("aria-hidden", "true");
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modalRelatorio) {
      modalRelatorio.style.display = "none";
      modalRelatorio.setAttribute("aria-hidden", "true");
    }
  });
};

