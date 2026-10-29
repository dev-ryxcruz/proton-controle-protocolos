/**
 * PROTON v1.4 - Serviço de Exportação e Importação Reversa via ExcelJS
 */

import { formatarDataBR } from "../utils/helpers.js";
import { showToast } from "../components/toast.js";
import { LoadingManager } from "../components/loading.js";

/**
 * Exporta os protocolos processados (Baixados) para planilha formatada .xlsx
 */
export const gerarExcel = async ({
  baseDeDados,
  dataRecebimento,
  conferente,
  btnExcel,
  onSuccess,
}) => {
  if (baseDeDados.length === 0) {
    showToast("warning", "Sem Dados", "Não há protocolos para exportar.");
    return false;
  }

  const itensParaExportar = baseDeDados.filter(
    (item) => item.status === "Baixado"
  );

  if (itensParaExportar.length === 0) {
    showToast(
      "warning",
      "Sem Dados Processados",
      "Não há protocolos processados (baixados) para exportar."
    );
    return false;
  }

  const originalHTML = btnExcel ? btnExcel.innerHTML : "";
  if (btnExcel) {
    btnExcel.disabled = true;
    btnExcel.innerHTML =
      '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Gerando Planilha...';
  }
  LoadingManager.show("Gerando planilha Excel formatada...");

  try {
    const dataRef =
      formatarDataBR(dataRecebimento) ||
      new Date().toLocaleDateString("pt-BR");
    const nomeResp = conferente || "Não informado";

    const workbook = new window.ExcelJS.Workbook();
    workbook.creator = "PROTON v1.5";
    workbook.created = new Date();

    const tiposDoc = {
      Ambulatorio: "Ambulatório",
      CDI: "CDI",
      UE: "Ficha UE",
      Internacao: "Internação",
    };

    for (const tipo in tiposDoc) {
      const nomeAba = tiposDoc[tipo];
      const dadosFiltrados = itensParaExportar
        .filter((item) => item.quantidades && item.quantidades[tipo] > 0)
        .map((item) => ({
          protocolo: item.protocolo,
          tipo: tipo.substring(0, 3).toUpperCase(),
          quantidade: item.quantidades[tipo],
          observacao: item.observacoes || "OK",
        }));

      if (dadosFiltrados.length > 0) {
        const ws = workbook.addWorksheet(nomeAba);

        ws.columns = [
          { width: 20 },
          { width: 12 },
          { width: 12 },
          { width: 45 },
        ];

        ws.mergeCells("A1:D1");
        const headerCell = ws.getCell("A1");
        headerCell.value = "CONTROLE DE RECEBIMENTO - PROTOCOLO MOVDOC";
        headerCell.alignment = { horizontal: "center", vertical: "middle" };
        headerCell.font = { bold: true, size: 14 };
        headerCell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        ws.mergeCells("A2:B2");
        const dateCell = ws.getCell("A2");
        dateCell.value = `DATA: ${dataRef}`;
        dateCell.font = { bold: true, size: 12 };
        dateCell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        ws.mergeCells("C2:D2");
        const respCell = ws.getCell("C2");
        respCell.value = `RESPONSÁVEL: ${nomeResp}`;
        respCell.font = { bold: true, size: 12 };
        respCell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        const headerRow = ws.addRow([
          "PROTOCOLO",
          "TIPO",
          "QUANT.",
          "OBSERVAÇÃO",
        ]);
        headerRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: "center" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        dadosFiltrados.forEach((d) => {
          const row = ws.addRow(Object.values(d));
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        });
      }
    }

    if (workbook.worksheets.length === 0) {
      showToast(
        "warning",
        "Sem Dados Válidos",
        "Nenhum item com quantidade > 0 foi encontrado."
      );
      return false;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_MOVDOC_${dataRef.replace(/\//g, "-")}.xlsx`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(link.href), 100);

    showToast("success", "Excel Gerado", "Planilha exportada com sucesso!");
    if (typeof onSuccess === "function") {
      onSuccess(itensParaExportar.length);
    }
    return true;
  } catch (error) {
    console.error("Erro ao gerar Excel:", error);
    showToast(
      "error",
      "Erro na Exportação",
      "Falha ao gerar a planilha Excel. Tente novamente."
    );
    return false;
  } finally {
    if (btnExcel) {
      btnExcel.disabled = false;
      btnExcel.innerHTML =
        originalHTML ||
        '<i class="fas fa-file-excel" aria-hidden="true"></i> Gerar Planilha Excel';
    }
    LoadingManager.hide();
  }
};

/**
 * Lê e importa uma planilha gerada anteriormente pelo Proton
 */
export const importarExcel = async ({
  file,
  baseDeDados,
  convenioPadrao,
  onImportSuccess,
}) => {
  if (!file) return;

  LoadingManager.show("Lendo e importando planilha Excel...");

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new window.ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const protocolosImportados = new Map();
    let dataDetectada = "";
    let responsavelDetectado = "";

    workbook.eachSheet((worksheet) => {
      const sheetName = worksheet.name.toLowerCase();
      let tipoPadrao = "Ambulatorio";
      if (sheetName.includes("cdi")) tipoPadrao = "CDI";
      else if (sheetName.includes("ue") || sheetName.includes("ficha")) tipoPadrao = "UE";
      else if (sheetName.includes("interna")) tipoPadrao = "Internacao";
      else if (sheetName.includes("ambula")) tipoPadrao = "Ambulatorio";

      const celA2 = String(worksheet.getCell("A2").value || "");
      const celC2 = String(worksheet.getCell("C2").value || "");

      if (celA2.includes("DATA:")) {
        const dataMatch = celA2.match(/\d{2}\/\d{2}\/\d{4}/);
        if (dataMatch && !dataDetectada) {
          const [d, m, y] = dataMatch[0].split("/");
          dataDetectada = `${y}-${m}-${d}`;
        }
      }
      if (celC2.includes("RESPONSÁVEL:") && !responsavelDetectado) {
        responsavelDetectado = celC2.replace("RESPONSÁVEL:", "").trim();
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber < 4) return;

        const rawProto = String(row.getCell(1).value || "").trim();
        if (!rawProto) return;

        const protoMatch = rawProto.match(/\d+/);
        if (!protoMatch) return;
        const numProtocolo = protoMatch[0].padStart(6, "0");

        const rawTipo = String(row.getCell(2).value || "").trim().toUpperCase();
        let tipo = tipoPadrao;
        if (rawTipo.startsWith("CDI")) tipo = "CDI";
        else if (rawTipo.startsWith("UE") || rawTipo.startsWith("FIC")) tipo = "UE";
        else if (rawTipo.startsWith("INT")) tipo = "Internacao";
        else if (rawTipo.startsWith("AMB")) tipo = "Ambulatorio";

        const quantidade = parseInt(row.getCell(3).value, 10) || 1;
        const obs = String(row.getCell(4).value || "").trim();

        if (!protocolosImportados.has(numProtocolo)) {
          protocolosImportados.set(numProtocolo, {
            protocolo: numProtocolo,
            convenio: convenioPadrao || "Unimed",
            status: "Baixado",
            dataRecebimento:
              dataDetectada || new Date().toISOString().split("T")[0],
            quantidades: { Ambulatorio: 0, CDI: 0, UE: 0, Internacao: 0 },
            observacoes: obs && obs !== "OK" ? obs : "",
            dataAdicao: new Date().toISOString(),
            dataConferencia: new Date().toISOString(),
          });
        }

        const item = protocolosImportados.get(numProtocolo);
        item.quantidades[tipo] = (item.quantidades[tipo] || 0) + quantidade;
        if (obs && obs !== "OK" && !item.observacoes.includes(obs)) {
          item.observacoes = item.observacoes
            ? `${item.observacoes}; ${obs}`
            : obs;
        }
      });
    });

    if (protocolosImportados.size === 0) {
      showToast(
        "warning",
        "Planilha Vazia",
        "Nenhum protocolo válido encontrado na planilha."
      );
      return;
    }

    let adicionados = 0;
    let atualizados = 0;

    protocolosImportados.forEach((novoItem, numProto) => {
      const itemExistente = baseDeDados.find((p) => p.protocolo === numProto);
      if (itemExistente) {
        itemExistente.status = "Baixado";
        itemExistente.quantidades = {
          Ambulatorio:
            (itemExistente.quantidades?.Ambulatorio || 0) +
            novoItem.quantidades.Ambulatorio,
          CDI:
            (itemExistente.quantidades?.CDI || 0) + novoItem.quantidades.CDI,
          UE: (itemExistente.quantidades?.UE || 0) + novoItem.quantidades.UE,
          Internacao:
            (itemExistente.quantidades?.Internacao || 0) +
            novoItem.quantidades.Internacao,
        };
        if (novoItem.observacoes) {
          itemExistente.observacoes = itemExistente.observacoes
            ? `${itemExistente.observacoes}; ${novoItem.observacoes}`
            : novoItem.observacoes;
        }
        atualizados++;
      } else {
        baseDeDados.push(novoItem);
        adicionados++;
      }
    });

    showToast(
      "success",
      "Importação Concluída",
      `${adicionados} adicionado(s) e ${atualizados} atualizado(s) com sucesso!`
    );

    if (typeof onImportSuccess === "function") {
      onImportSuccess({
        adicionados,
        atualizados,
        total: protocolosImportados.size,
        dataDetectada,
        responsavelDetectado,
      });
    }
  } catch (err) {
    console.error("Erro na importação reversa de Excel:", err);
    showToast(
      "error",
      "Erro ao Importar",
      "Falha ao processar arquivo .xlsx. Verifique o formato."
    );
  } finally {
    LoadingManager.hide();
  }
};

