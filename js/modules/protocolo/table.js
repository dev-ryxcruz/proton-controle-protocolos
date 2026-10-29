/**
 * PROTON v1.4 - Renderização Segura da Tabela e Edição Inline
 * Totalmente imune a injeção XSS através de nós DOM nativos e delegação de eventos
 */

import { formatarDataBR } from "../../utils/helpers.js";
import { SymbolManager } from "../../utils/symbols.js";
import { SecurityUtils } from "../../utils/security.js";
import { showToast } from "../../components/toast.js";

const convenioColor = {
  Unimed: "#3b82f6",
  Intercâmbio: "#ef4444",
  "Convênio Externo": "#f59e0b",
  Particular: "#10b981",
  Internação: "#8b5cf6",
};

export const renderizarTabela = (elements, state) => {
  if (!elements.tabelaCorpo) return;

  // Limpeza segura sem innerHTML
  elements.tabelaCorpo.textContent = "";

  if (elements.mensagemVazia) {
    elements.mensagemVazia.style.display =
      state.dadosFiltrados.length === 0 ? "block" : "none";
  }

  state.dadosFiltrados.forEach((item) => {
    const tr = document.createElement("tr");
    tr.dataset.protocolo = item.protocolo;
    const isSelected = state.selectedItems.includes(item.protocolo);
    if (isSelected) tr.classList.add("selected");
    if (item.status === "Baixado") tr.classList.add("status-baixado");

    // --- MODO: EDIÇÃO INLINE DO PROTOCOLO ---
    if (state.editingProtocol === item.protocolo) {
      tr.classList.add("row-editing");

      // 1. Checkbox / Indicador de edição ativa
      const tdCheck = document.createElement("td");
      tdCheck.className = "checkbox-cell";
      tdCheck.setAttribute("data-label", "Modo");
      const editIcon = document.createElement("i");
      editIcon.className = "fas fa-edit text-warning";
      editIcon.title = "Em edição inline";
      tdCheck.appendChild(editIcon);
      tr.appendChild(tdCheck);

      // 2. Campo de digitação rápida do número do protocolo
      const tdProto = document.createElement("td");
      tdProto.setAttribute("data-label", "Protocolo");
      const inputProto = document.createElement("input");
      inputProto.type = "text";
      inputProto.className = "table-inline-input edit-proto-input";
      inputProto.value = item.protocolo;
      inputProto.maxLength = 6;
      inputProto.inputMode = "numeric";
      inputProto.dataset.protocolo = item.protocolo;
      inputProto.setAttribute("aria-label", "Editar número do protocolo");
      tdProto.appendChild(inputProto);
      tr.appendChild(tdProto);

      // 3. Dropdown do Convênio
      const tdConv = document.createElement("td");
      tdConv.setAttribute("data-label", "Convênio");
      const selectConv = document.createElement("select");
      selectConv.className = "table-inline-select edit-conv-select";
      selectConv.dataset.protocolo = item.protocolo;
      const convList = [
        "Unimed",
        "Intercâmbio",
        "Convênio Externo",
        "Particular",
        "Internação",
      ];
      if (item.convenio && !convList.includes(item.convenio)) {
        convList.push(item.convenio);
      }
      convList.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        if (c === item.convenio) opt.selected = true;
        selectConv.appendChild(opt);
      });
      tdConv.appendChild(selectConv);
      tr.appendChild(tdConv);

      // 4. Status
      const tdStatus = document.createElement("td");
      tdStatus.className = "status-display";
      tdStatus.setAttribute("data-label", "Status");
      const sIcon = document.createElement("i");
      sIcon.className =
        item.status === "Baixado" ? "fas fa-check-circle" : "fas fa-clock";
      tdStatus.appendChild(sIcon);
      tdStatus.appendChild(document.createTextNode(" " + item.status));
      tr.appendChild(tdStatus);

      // 5. Data Referência
      const tdDate = document.createElement("td");
      tdDate.setAttribute("data-label", "Data Referência");
      const inputDate = document.createElement("input");
      inputDate.type = "date";
      inputDate.className = "table-inline-input edit-date-input";
      inputDate.value = item.dataRecebimento || "";
      inputDate.dataset.protocolo = item.protocolo;
      tdDate.appendChild(inputDate);
      tr.appendChild(tdDate);

      // 6. Ações inline (Salvar / Cancelar)
      const tdActions = document.createElement("td");
      tdActions.setAttribute("data-label", "Ações");
      const actionDiv = document.createElement("div");
      actionDiv.className = "action-buttons";

      const btnSave = document.createElement("button");
      btnSave.type = "button";
      btnSave.className = "btn-save-inline";
      btnSave.dataset.action = "save-inline";
      btnSave.dataset.protocolo = item.protocolo;
      btnSave.title = "Salvar alterações (Enter)";
      btnSave.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
      actionDiv.appendChild(btnSave);

      const btnCancel = document.createElement("button");
      btnCancel.type = "button";
      btnCancel.className = "btn-cancel-inline";
      btnCancel.dataset.action = "cancel-inline";
      btnCancel.dataset.protocolo = item.protocolo;
      btnCancel.title = "Cancelar edição (Esc)";
      btnCancel.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
      actionDiv.appendChild(btnCancel);

      if (item.status === "Baixado") {
        const btnConf = document.createElement("button");
        btnConf.type = "button";
        btnConf.className = "btn-info";
        btnConf.dataset.action = "edit-conferencia";
        btnConf.dataset.protocolo = item.protocolo;
        btnConf.title = "Ajustar quantidades e observações";
        btnConf.innerHTML = '<i class="fas fa-sliders-h" aria-hidden="true"></i>';
        actionDiv.appendChild(btnConf);
      }

      tdActions.appendChild(actionDiv);
      tr.appendChild(tdActions);
      elements.tabelaCorpo.appendChild(tr);

      setTimeout(() => {
        inputProto.focus();
        inputProto.select();
      }, 30);
      return;
    }

    // --- MODO: LINHA NORMAL ---
    const tdCheck = document.createElement("td");
    tdCheck.className = "checkbox-cell";
    tdCheck.setAttribute("data-label", "Selecionar");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "row-checkbox";
    checkbox.dataset.protocolo = item.protocolo;
    checkbox.checked = isSelected;
    checkbox.setAttribute(
      "aria-label",
      `Selecionar protocolo ${item.protocolo}`
    );
    tdCheck.appendChild(checkbox);
    tr.appendChild(tdCheck);

    const tdProto = document.createElement("td");
    tdProto.setAttribute("data-label", "Protocolo");
    tdProto.appendChild(SymbolManager.createProtocolCellElement(item));
    tr.appendChild(tdProto);

    const tdConv = document.createElement("td");
    tdConv.setAttribute("data-label", "Convênio");
    const convBadge = document.createElement("span");
    convBadge.className = "badge-convenio";
    convBadge.style.backgroundColor =
      convenioColor[item.convenio] || "#64748b";
    convBadge.textContent = item.convenio;
    tdConv.appendChild(convBadge);
    tr.appendChild(tdConv);

    const tdStatus = document.createElement("td");
    tdStatus.className = "status-display";
    tdStatus.setAttribute("data-label", "Status");
    const statusIcon = document.createElement("i");
    statusIcon.className =
      item.status === "Baixado" ? "fas fa-check-circle" : "fas fa-clock";
    tdStatus.appendChild(statusIcon);
    tdStatus.appendChild(document.createTextNode(" " + item.status));
    tr.appendChild(tdStatus);

    const tdDate = document.createElement("td");
    tdDate.setAttribute("data-label", "Data Referência");
    tdDate.textContent = formatarDataBR(item.dataRecebimento);
    tr.appendChild(tdDate);

    const tdActions = document.createElement("td");
    tdActions.setAttribute("data-label", "Ações");
    const actionDiv = document.createElement("div");
    actionDiv.className = "action-buttons";

    const appendBtn = (action, icon, btnClass, title) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = btnClass;
      btn.dataset.action = action;
      btn.dataset.protocolo = item.protocolo;
      btn.title = title;
      btn.setAttribute("aria-label", `${title} protocolo ${item.protocolo}`);
      const i = document.createElement("i");
      i.className = `fas ${icon}`;
      btn.appendChild(i);
      actionDiv.appendChild(btn);
    };

    if (item.status !== "Baixado") {
      appendBtn("conference", "fa-check", "btn-success", "Conferir");
    }
    appendBtn("edit-inline", "fa-edit", "btn-warning", "Editar dados");
    if (item.status === "Baixado") {
      appendBtn(
        "edit-conferencia",
        "fa-sliders-h",
        "btn-info",
        "Editar quantidades/obs"
      );
    }
    appendBtn("delete", "fa-trash", "btn-danger", "Remover");

    tdActions.appendChild(actionDiv);
    tr.appendChild(tdActions);
    elements.tabelaCorpo.appendChild(tr);
  });

  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  if (selectAllCheckbox) {
    selectAllCheckbox.checked =
      state.dadosFiltrados.length > 0 &&
      state.dadosFiltrados.every((item) =>
        state.selectedItems.includes(item.protocolo)
      );
  }
};

export const salvarEdicaoInline = (
  protocoloOriginal,
  elements,
  state,
  onSaveSuccess
) => {
  const row = elements.tabelaCorpo?.querySelector(
    `tr[data-protocolo="${protocoloOriginal}"]`
  );
  if (!row) return;

  const inputProto = row.querySelector(".edit-proto-input");
  const selectConv = row.querySelector(".edit-conv-select");
  const inputDate = row.querySelector(".edit-date-input");

  const novoProtocolo = inputProto
    ? inputProto.value.trim()
    : protocoloOriginal;
  const novoConvenio = selectConv ? selectConv.value : "";
  const novaData = inputDate ? inputDate.value : "";

  if (!novoProtocolo) {
    showToast("error", "Validação", "Número do protocolo não pode estar vazio.");
    inputProto?.focus();
    return;
  }
  if (!SecurityUtils.validateNumeric(novoProtocolo)) {
    showToast("error", "Validação", "O protocolo deve conter apenas números.");
    inputProto?.focus();
    return;
  }
  if (novoProtocolo.length !== 6) {
    showToast("error", "Validação", "O protocolo deve ter exatamente 6 dígitos.");
    inputProto?.focus();
    return;
  }
  if (
    novoProtocolo !== protocoloOriginal &&
    state.baseDeDados.some((p) => p.protocolo === novoProtocolo)
  ) {
    showToast("error", "Validação", "Já existe outro protocolo com este número.");
    inputProto?.focus();
    return;
  }

  const item = state.baseDeDados.find((p) => p.protocolo === protocoloOriginal);
  if (item) {
    item.protocolo = novoProtocolo;
    if (novoConvenio) item.convenio = novoConvenio;
    if (novaData) item.dataRecebimento = novaData;

    const selIdx = state.selectedItems.indexOf(protocoloOriginal);
    if (selIdx !== -1) {
      state.selectedItems[selIdx] = novoProtocolo;
    }

    state.editingProtocol = null;

    showToast(
      "success",
      "Protocolo Atualizado",
      `Protocolo ${novoProtocolo} atualizado com sucesso!`
    );

    if (typeof onSaveSuccess === "function") {
      onSaveSuccess(protocoloOriginal, novoProtocolo);
    }
  }
};

export const setupSorting = (state, onSorted) => {
  const sortButtons = document.querySelectorAll(".sort-btn");

  sortButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const column = btn.getAttribute("data-column");

      if (state.sortColumn === column) {
        state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
      } else {
        state.sortColumn = column;
        state.sortDirection = "asc";
      }

      sortButtons.forEach((b) => {
        b.classList.remove("active");
        const icon = b.querySelector(".sort-icon");
        if (icon) icon.className = "fas fa-sort sort-icon";
      });

      btn.classList.add("active");
      const icon = btn.querySelector(".sort-icon");
      if (icon) {
        icon.className = `fas fa-sort-${state.sortDirection === "asc" ? "up" : "down"} sort-icon`;
      }

      sortData(state);
      if (typeof onSorted === "function") onSorted();
    });
  });
};

export const sortData = (state) => {
  if (!state.sortColumn) return;

  state.dadosFiltrados.sort((a, b) => {
    let valueA = a[state.sortColumn];
    let valueB = b[state.sortColumn];

    if (state.sortColumn === "dataRecebimento") {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    }

    if (state.sortColumn === "protocolo") {
      valueA = parseInt(valueA, 10);
      valueB = parseInt(valueB, 10);
    }

    if (valueA < valueB) return state.sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return state.sortDirection === "asc" ? 1 : -1;
    return 0;
  });
};

