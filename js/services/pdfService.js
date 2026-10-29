/**
 * PROTON v1.4 - Serviço de Geração de Relatório PDF para o Contador (jsPDF + Chart.js)
 */

import { LoadingManager } from "../components/loading.js";
import { showToast } from "../components/toast.js";
import { getCssVariable } from "../utils/helpers.js";

const whiteBackgroundPlugin = {
  id: "whiteBackground",
  beforeDraw: (chart) => {
    const { ctx, width, height } = chart;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  },
};

export const generatePDF = async ({ ambulatorioCount, internacaoCount }) => {
  try {
    LoadingManager.show("Gerando relatório PDF...");

    if (!window.jspdf || !window.jspdf.jsPDF) {
      showToast("error", "Erro jsPDF", "Biblioteca jsPDF não encontrada.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // --- 1. Header/Banner ---
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, pageWidth, 45, "F");

    // Linha decorativa
    pdf.setFillColor(99, 102, 241); // indigo-500
    pdf.rect(0, 45, pageWidth, 3, "F");

    // Título PROTON e subtítulo
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(26);
    pdf.setFont("helvetica", "bold");
    pdf.text("PROTON", 20, 28);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text("RELATÓRIO DE DIGITALIZAÇÃO", 65, 27);

    // --- 2. Data e Hora ---
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR");
    const timeStr = now.toLocaleTimeString("pt-BR");

    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("DATA DO RELATÓRIO", 20, 65);
    pdf.text("HORÁRIO", pageWidth - 20, 65, { align: "right" });

    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    pdf.text(dateStr, 20, 73);
    pdf.text(timeStr, pageWidth - 20, 73, { align: "right" });

    // Linha divisória
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.line(20, 85, pageWidth - 20, 85);

    // --- 3. Cards de Contagem ---
    const total = ambulatorioCount + internacaoCount;

    const cardY = 100;
    const cardWidth = (pageWidth - 50) / 3;
    const cardHeight = 40;

    const drawCard = (x, title, value, hexColor) => {
      const r = parseInt(hexColor.slice(1, 3), 16) || 0;
      const g = parseInt(hexColor.slice(3, 5), 16) || 0;
      const b = parseInt(hexColor.slice(5, 7), 16) || 0;

      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.roundedRect(x, cardY, cardWidth, cardHeight, 4, 4, "FD");

      // Tarja colorida no topo
      pdf.setFillColor(r, g, b);
      pdf.roundedRect(x, cardY, cardWidth, 4, 4, 4, "F");
      pdf.rect(x, cardY + 2, cardWidth, 2, "F");

      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(title, x + cardWidth / 2, cardY + 16, { align: "center" });

      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.text(String(value), x + cardWidth / 2, cardY + 32, { align: "center" });
    };

    const corAmb = getCssVariable("--cor-ambulatório") || "#10b981";
    const corInt = getCssVariable("--cor-internação") || "#667eea";
    const corTotal = "#334155";

    drawCard(20, "AMBULATÓRIO", ambulatorioCount, corAmb);
    drawCard(20 + cardWidth + 5, "INTERNAÇÃO", internacaoCount, corInt);
    drawCard(20 + cardWidth * 2 + 10, "TOTAL PROCESSADO", total, corTotal);

    // --- 4. Gráfico ---
    if (total > 0 && window.Chart) {
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Distribuição Visual", 20, 165);

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 600;
      tempCanvas.height = 350;
      const tempCtx = tempCanvas.getContext("2d");

      const tempChart = new window.Chart(tempCtx, {
        type: "doughnut",
        data: {
          labels: [" Ambulatório", " Internação"],
          datasets: [
            {
              data: [ambulatorioCount, internacaoCount],
              backgroundColor: [corAmb, corInt],
              borderColor: "#ffffff",
              borderWidth: 4,
              hoverOffset: 0,
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          devicePixelRatio: 2,
          plugins: {
            legend: {
              position: "right",
              labels: {
                color: "#334155",
                padding: 30,
                usePointStyle: true,
                pointStyle: "circle",
                font: { size: 24, family: "helvetica", weight: "bold" },
              },
            },
            whiteBackground: { enabled: true },
          },
          cutout: "65%",
        },
        plugins: [whiteBackgroundPlugin],
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      const chartImage = tempCanvas.toDataURL("image/png", 1.0);
      const imgWidth = 150;
      const imgHeight = 87.5;
      const imgX = (pageWidth - imgWidth) / 2;
      const imgY = 175;

      pdf.addImage(chartImage, "PNG", imgX, imgY, imgWidth, imgHeight);
      tempChart.destroy();
    } else {
      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "italic");
      pdf.text(
        "Nenhum documento contabilizado até o momento.",
        pageWidth / 2,
        190,
        { align: "center" }
      );
    }

    // --- 5. Footer ---
    pdf.setFillColor(241, 245, 249);
    pdf.rect(0, pageHeight - 25, pageWidth, 25, "F");

    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "Relatório gerado automaticamente por PROTON v1.5",
      pageWidth / 2,
      pageHeight - 11,
      { align: "center" }
    );

    const sanitizedDate = dateStr.replace(/\//g, "-").replace(/:/g, "");
    pdf.save(`PROTON_Digitalizacao_${sanitizedDate}.pdf`);

    showToast("success", "Relatório PDF Gerado", "O design premium foi aplicado com sucesso!");
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    showToast("error", "Falha na Exportação", "Ocorreu um erro ao gerar o PDF.");
  } finally {
    LoadingManager.hide();
  }
};

