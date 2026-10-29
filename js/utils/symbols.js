/**
 * PROTON v1.4 - Gerenciador de Símbolos Indicadores de Protocolo
 * Prevenção de XSS e renderização de indicadores de documentos
 */

import { SecurityUtils } from "./security.js";

export const SymbolManager = {
  indicatorMap: {
    Ambulatorio: { class: "amb", letter: "A", label: "Ambulatório" },
    CDI: { class: "cdi", letter: "C", label: "CDI" },
    UE: { class: "ue", letter: "U", label: "UE" },
    Internacao: { class: "int", letter: "I", label: "Internação" },
  },

  generateIndicators: (item) => {
    const { quantidades = {}, observacoes = "" } = item;

    let indicatorsHTML = Object.entries(SymbolManager.indicatorMap)
      .filter(([key]) => quantidades[key] > 0)
      .map(
        ([key, { class: c, letter, label }]) =>
          `<div class="indicator-symbol indicator-${c}" data-tooltip="${label}: ${quantidades[key]} docs" title="${label}: ${quantidades[key]} documentos">${letter}</div>`
      )
      .join("");

    if (observacoes && observacoes.trim()) {
      indicatorsHTML += `<div class="indicator-symbol indicator-obs" data-tooltip="Possui observações" title="Protocolo possui observações">📝</div>`;
    }
    return indicatorsHTML;
  },

  createProtocolCell: (item) => {
    const indicators = SymbolManager.generateIndicators(item);
    return `
      <div class="protocol-cell">
        <span class="protocol-number">${SecurityUtils.escapeHTML(item.protocolo)}</span>
        <div class="protocol-indicators">
          ${indicators}
        </div>
      </div>
    `;
  },

  /**
   * Criação segura de nós DOM para célula de protocolo (Zero XSS)
   */
  createProtocolCellElement: (item) => {
    const cell = document.createElement("div");
    cell.className = "protocol-cell";

    const numSpan = document.createElement("span");
    numSpan.className = "protocol-number";
    numSpan.textContent = item.protocolo;
    cell.appendChild(numSpan);

    const indicatorsDiv = document.createElement("div");
    indicatorsDiv.className = "protocol-indicators";

    const { quantidades = {}, observacoes = "" } = item;

    Object.entries(SymbolManager.indicatorMap)
      .filter(([key]) => quantidades[key] > 0)
      .forEach(([key, { class: c, letter, label }]) => {
        const div = document.createElement("div");
        div.className = `indicator-symbol indicator-${c}`;
        const count = quantidades[key];
        div.setAttribute("data-tooltip", `${label}: ${count} docs`);
        div.title = `${label}: ${count} documentos`;
        div.textContent = letter;
        indicatorsDiv.appendChild(div);
      });

    if (observacoes && observacoes.trim()) {
      const div = document.createElement("div");
      div.className = "indicator-symbol indicator-obs";
      div.setAttribute("data-tooltip", "Possui observações");
      div.title = "Protocolo possui observações: " + observacoes;
      div.textContent = "📝";
      indicatorsDiv.appendChild(div);
    }

    cell.appendChild(indicatorsDiv);
    return cell;
  },
};

