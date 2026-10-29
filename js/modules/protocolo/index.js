/**
 * PROTON v1.4 - Módulo Central de Controle de Protocolos
 * Orquestra Estado, Validação, Tabela Reativa, Lançamentos e Sincronização
 */

import { STORAGE_KEYS } from "../../constants/storage.js";
import { SecurityUtils } from "../../utils/security.js";
import { formatarDataBR, debounce } from "../../utils/helpers.js";
import { showToast, showUndoToast } from "../../components/toast.js";
import { showConfirmModal, closeModal } from "../../components/modal.js";
import { setupPinField } from "./pins.js";
import { validarProtocolo } from "./validation.js";
import { atualizarGraficoTipo } from "./chart.js";
import {
  renderizarTabela,
  salvarEdicaoInline,
  setupSorting,
  sortData,
} from "./table.js";
import { createConferenceManager } from "./conference.js";
import { setupRelatorio } from "./report.js";
import { gerarExcel, importarExcel } from "../../services/excelService.js";

export const protocoloApp = () => {
  if (!document.getElementById("tab-proton")) return {};

  const elements = {
    dataRecebimento: document.getElementById("dataRecebimento"),
    numProtocolo: document.getElementById("numProtocolo"),
    protocoloFeedback: document.getElementById("protocoloFeedback"),
    btnAdicionar: document.getElementById("btnAdicionar"),
    btnLimpar: document.getElementById("btnLimpar"),
    btnNovoTurno: document.getElementById("btnNovoTurno"),
    tabelaCorpo: document.getElementById("tabelaCorpo"),
    mensagemVazia: document.getElementById("mensagemVazia"),
    conferente: document.getElementById("conferente"),
    btnPinConferente: document.getElementById("btnPinConferente"),
    btnPinConvenio: document.getElementById("btnPinConvenio"),
    btnPinData: document.getElementById("btnPinData"),
    btnFixarConferente: document.getElementById("btnFixarConferente"),
    btnTrocarConferente: document.getElementById("btnTrocarConferente"),
    convenio: document.getElementById("convenio"),
    btnFixarConvenio: document.getElementById("btnFixarConvenio"),
    btnTrocarConvenio: document.getElementById("btnTrocarConvenio"),
    btnGerarExcel: document.getElementById("gerarExcel"),
    btnImportarExcel: document.getElementById("btnImportarExcel"),
    fileImportExcel: document.getElementById("fileImportExcel"),
    printDataEmissao: document.getElementById("printDataEmissao"),
    printConferente: document.getElementById("printConferente"),
    printConvenioRef: document.getElementById("printConvenioRef"),
    printTotalProtocolos: document.getElementById("printTotalProtocolos"),
    statTotal: document.getElementById("stat-total"),
    statProcessados: document.getElementById("stat-processados"),
    statPendentes: document.getElementById("stat-pendentes"),
    statTaxa: document.getElementById("stat-taxa"),
    progressBar: document.getElementById("progressBar"),
    chartCanvas: document.getElementById("tipoDocumentoChart"),
    modalLote: document.getElementById("modalLote"),
    btnAbrirModalLote: document.getElementById("btnAbrirModalLote"),
    fecharModal: document.getElementById("fecharModal"),
    btnConfirmarLote: document.getElementById("btnConfirmarLote"),
    listaProtocolosLote: document.getElementById("listaProtocolosLote"),
    searchInput: document.getElementById("searchInput"),
    btnClearSearch: document.getElementById("btnClearSearch"),
    filterStatus: document.getElementById("filterStatus"),
    filterConvenio: document.getElementById("filterConvenio"),
    filterDate: document.getElementById("filterDate"),
    btnClearFilters: document.getElementById("btnClearFilters"),
    modalConferencia: document.getElementById("modalConferencia"),
    fecharModalConferencia: document.getElementById("fecharModalConferencia"),
    conferenciaForm: document.getElementById("conferenciaForm"),
    btnBackup: document.getElementById("btnBackup"),
    btnRestore: document.getElementById("btnRestore"),
    fileRestore: document.getElementById("fileRestore"),
    btnShowHistory: document.getElementById("btnShowHistory"),
    activityHistory: document.getElementById("activityHistory"),
    activityList: document.getElementById("activityList"),
    btnShowShortcuts: document.getElementById("btnShowShortcuts"),
    keyboardShortcuts: document.getElementById("keyboardShortcuts"),
  };

  // Flag de prevenção de perda de dados acidental (beforeunload)
  let hasUnsavedChanges = false;

  // Carrega protocolos da sessão atual ou localStorage
  let savedProtocols = [];
  try {
    const sessionData = sessionStorage.getItem(STORAGE_KEYS.session);
    if (sessionData) {
      savedProtocols = JSON.parse(sessionData) || [];
    } else {
      const localData = localStorage.getItem(STORAGE_KEYS.database);
      if (localData) {
        savedProtocols = JSON.parse(localData) || [];
      }
    }
  } catch (e) {
    console.warn("Erro ao carregar protocolos salvos:", e);
    savedProtocols = [];
  }

  let state = {
    baseDeDados: savedProtocols,
    dadosFiltrados: [],
    atividades: JSON.parse(localStorage.getItem(STORAGE_KEYS.activities)) || [],
    tipoDocumentoChart: null,
    sortColumn: null,
    sortDirection: "asc",
    selectedItems: [],
    editingProtocol: null,
    pins: JSON.parse(localStorage.getItem(STORAGE_KEYS.fieldPins)) || {
      conferente: false,
      convenio: false,
      data: false,
    },
  };

  state.dadosFiltrados = [...state.baseDeDados];

  // Sincronização e espelhamento em sessionStorage e localStorage
  const salvarDados = () => {
    try {
      sessionStorage.setItem(
        STORAGE_KEYS.session,
        JSON.stringify(state.baseDeDados)
      );
      localStorage.setItem(
        STORAGE_KEYS.database,
        JSON.stringify(state.baseDeDados)
      );
      localStorage.setItem(
        STORAGE_KEYS.activities,
        JSON.stringify(state.atividades)
      );
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      if (error.name === "QuotaExceededError") {
        showToast("error", "Limite Excedido", "Espaço de armazenamento local cheio.");
      } else {
        showToast("error", "Erro", "Falha ao salvar dados localmente.");
      }
    }
  };

  const addActivity = (type, action, details = "") => {
    const activity = {
      id: Date.now(),
      type: SecurityUtils.escapeHTML(type),
      action: SecurityUtils.escapeHTML(action),
      details: SecurityUtils.escapeHTML(details),
      timestamp: new Date().toLocaleString("pt-BR"),
    };

    state.atividades.unshift(activity);
    if (state.atividades.length > 100) {
      state.atividades = state.atividades.slice(0, 100);
    }
    salvarDados();
  };

  const renderActivities = () => {
    if (!elements.activityList) return;
    elements.activityList.innerHTML = "";

    if (state.atividades.length === 0) {
      elements.activityList.innerHTML =
        '<p style="color: #64748b; text-align: center;">Nenhuma atividade registrada ainda.</p>';
      return;
    }

    const icons = {
      add: "fas fa-plus text-success",
      edit: "fas fa-edit text-warning",
      delete: "fas fa-trash text-danger",
      conference: "fas fa-check text-success",
      export: "fas fa-file-excel text-info",
      backup: "fas fa-download text-info",
      restore: "fas fa-upload text-warning",
      clear: "fas fa-trash-alt text-danger",
    };

    state.atividades.slice(0, 20).forEach((activity) => {
      const activityEl = document.createElement("div");
      activityEl.style.cssText =
        "display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--cor-borda);";

      activityEl.innerHTML = `
        <i class="${icons[activity.type] || "fas fa-info"}" style="width: 20px;" aria-hidden="true"></i>
        <div style="flex-grow: 1;">
          <strong>${activity.action}</strong>
          ${activity.details ? `<br><small style="color: #64748b;">${activity.details}</small>` : ""}
        </div>
        <small style="color: #64748b; white-space: nowrap;">${activity.timestamp}</small>
      `;

      elements.activityList.appendChild(activityEl);
    });
  };

  const updatePendingBadge = (pendentes) => {
    const badge = document.getElementById("tabBadgePendentes");
    if (!badge) return;
    if (pendentes > 0) {
      badge.textContent = pendentes > 99 ? "99+" : String(pendentes);
      badge.style.display = "inline-flex";
    } else {
      badge.style.display = "none";
    }
  };

  const atualizarDashboard = () => {
    const total = state.dadosFiltrados.length;
    const processados = state.dadosFiltrados.filter(
      (item) => item.status === "Baixado"
    ).length;
    const pendentes = total - processados;
    const taxa = total > 0 ? Math.round((processados / total) * 100) : 0;

    if (elements.statTotal) elements.statTotal.textContent = total;
    if (elements.statProcessados) elements.statProcessados.textContent = processados;
    if (elements.statPendentes) elements.statPendentes.textContent = pendentes;
    if (elements.statTaxa) elements.statTaxa.textContent = `${taxa}%`;

    if (elements.progressBar) {
      elements.progressBar.style.width = `${taxa}%`;
      elements.progressBar.textContent = `${taxa}%`;
      elements.progressBar.setAttribute("aria-valuenow", taxa);
    }

    const pendentesTotal = state.baseDeDados.filter(
      (item) => item.status === "Pendente"
    ).length;
    updatePendingBadge(pendentesTotal);
  };

  const atualizarFiltroConvenio = () => {
    if (!elements.filterConvenio) return;
    const convenios = [
      ...new Set(state.baseDeDados.map((item) => item.convenio).filter(Boolean)),
    ];
    const currentValue = elements.filterConvenio.value;

    elements.filterConvenio.innerHTML =
      '<option value="">Todos os Convênios</option>';
    convenios.forEach((convenio) => {
      const option = document.createElement("option");
      option.value = convenio;
      option.textContent = convenio;
      elements.filterConvenio.appendChild(option);
    });

    elements.filterConvenio.value = currentValue;
  };

  const atualizarDadosImpressao = () => {
    if (elements.printDataEmissao) {
      elements.printDataEmissao.textContent = new Date().toLocaleDateString("pt-BR");
    }
    if (elements.printConferente) {
      elements.printConferente.textContent =
        elements.conferente?.value || "Não informado";
    }
    if (elements.printConvenioRef) {
      elements.printConvenioRef.textContent = elements.convenio?.value || "Geral";
    }
    if (elements.printTotalProtocolos) {
      elements.printTotalProtocolos.textContent = String(state.baseDeDados.length);
    }
  };

  const clearSelection = () => {
    state.selectedItems = [];
    document
      .querySelectorAll("tr.selected")
      .forEach((row) => row.classList.remove("selected"));
    document
      .querySelectorAll(".row-checkbox:checked")
      .forEach((cb) => (cb.checked = false));
    const selectAllCb = document.getElementById("selectAllCheckbox");
    if (selectAllCb) selectAllCb.checked = false;
    updateBulkActionsBar();
  };

  const updateBulkActionsBar = () => {
    const container = document.getElementById("bulk-actions-container");
    const countSpan = document.getElementById("bulk-selected-count");
    if (!container || !countSpan) return;
    const hasSelection = state.selectedItems.length > 0;
    container.style.display = hasSelection ? "flex" : "none";
    countSpan.textContent = `${state.selectedItems.length} selecionados`;
  };

  const toggleSelection = (protocoloId, isSelected) => {
    const index = state.selectedItems.indexOf(protocoloId);
    if (isSelected && index === -1) {
      state.selectedItems.push(protocoloId);
    } else if (!isSelected && index !== -1) {
      state.selectedItems.splice(index, 1);
    }
    document
      .querySelector(`tr[data-protocolo="${protocoloId}"]`)
      ?.classList.toggle("selected", isSelected);
    updateBulkActionsBar();
  };

  const aplicarFiltrosInterno = () => {
    const searchTerm = elements.searchInput
      ? elements.searchInput.value.toLowerCase().trim()
      : "";
    const statusFilter = elements.filterStatus ? elements.filterStatus.value : "";
    const convenioFilter = elements.filterConvenio
      ? elements.filterConvenio.value
      : "";
    const dateFilter = elements.filterDate ? elements.filterDate.value : "";

    if (elements.btnClearSearch) {
      elements.btnClearSearch.classList.toggle("visible", searchTerm.length > 0);
    }

    state.dadosFiltrados = state.baseDeDados.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.protocolo.toLowerCase().includes(searchTerm) ||
        item.convenio.toLowerCase().includes(searchTerm) ||
        item.status.toLowerCase().includes(searchTerm);

      const matchesStatus = !statusFilter || item.status === statusFilter;
      const matchesConvenio = !convenioFilter || item.convenio === convenioFilter;
      const matchesDate = !dateFilter || item.dataRecebimento === dateFilter;

      return matchesSearch && matchesStatus && matchesConvenio && matchesDate;
    });
  };

  const aplicarFiltros = () => {
    aplicarFiltrosInterno();
    if (state.sortColumn) sortData(state);
    renderizarTabela(elements, state);
    atualizarDashboard();
    updateBulkActionsBar();
  };

  const debouncedAplicarFiltros = debounce(aplicarFiltros, 300);

  // === GESTÃO CENTRALIZADA DE ESTADO (syncApp) ===
  const syncApp = (options = { save: true }) => {
    if (options.save) {
      salvarDados();
    }
    aplicarFiltrosInterno();
    if (state.sortColumn) {
      sortData(state);
    }
    renderizarTabela(elements, state);
    atualizarDashboard();
    atualizarGraficoTipo(state, elements.chartCanvas);
    atualizarFiltroConvenio();
    atualizarDadosImpressao();
    updateBulkActionsBar();
  };

  // Instancia gerenciador de conferência
  const conferenceManager = createConferenceManager({
    elements,
    state,
    syncApp,
    addActivity,
    clearSelection,
    onStateChange: () => {
      hasUnsavedChanges = true;
    },
  });

  // Conecta ações globais para cliques em modais e botões inline
  window.protonActions = {
    ...conferenceManager,
    removerProtocolo: (protocolo) => {
      const index = state.baseDeDados.findIndex((p) => p.protocolo === protocolo);
      if (index === -1) return;

      const itemRemovido = state.baseDeDados.splice(index, 1)[0];
      state.selectedItems = state.selectedItems.filter((p) => p !== protocolo);
      hasUnsavedChanges = state.baseDeDados.length > 0;
      syncApp();

      showUndoToast(
        `Protocolo ${protocolo} removido.`,
        () => {
          state.baseDeDados.splice(index, 0, itemRemovido);
          hasUnsavedChanges = true;
          syncApp();
          showToast("info", "Ação Desfeita", `Protocolo ${protocolo} restaurado.`);
        },
        5000
      );
    },
  };

  const adicionarProtocolo = () => {
    const protocolo = elements.numProtocolo.value.trim();
    const convenio = elements.convenio.value;
    const dataRecebimento = elements.dataRecebimento.value;

    if (!convenio) {
      showToast(
        "warning",
        "Campo Obrigatório",
        "Selecione um convênio antes de adicionar o protocolo."
      );
      elements.convenio.focus();
      return;
    }

    if (!dataRecebimento) {
      showToast(
        "warning",
        "Campo Obrigatório",
        "Defina a data de referência antes de adicionar o protocolo."
      );
      elements.dataRecebimento.focus();
      return;
    }

    const validacao = validarProtocolo(protocolo, state.baseDeDados);
    if (!validacao.valido) {
      showToast("error", "Protocolo Inválido", validacao.erro);
      elements.numProtocolo.focus();
      return;
    }

    const novoItem = {
      protocolo: protocolo,
      convenio: convenio,
      status: "Pendente",
      dataRecebimento: dataRecebimento,
      dataAdicao: new Date().toISOString(),
    };

    state.baseDeDados.push(novoItem);
    hasUnsavedChanges = true;

    // Limpa os campos variáveis
    elements.numProtocolo.value = "";
    if (elements.protocoloFeedback) {
      elements.protocoloFeedback.textContent = "";
      elements.protocoloFeedback.className = "input-feedback";
    }

    if (!state.pins.convenio) {
      elements.convenio.value = "";
    }

    syncApp();

    // Devolve o foco imediato para agilizar a rotina (Keyboard-First)
    elements.numProtocolo.focus();

    showToast(
      "success",
      "Protocolo Adicionado",
      `Protocolo ${protocolo} foi adicionado à fila.`
    );
    addActivity("add", `Protocolo ${protocolo} adicionado`, `Convênio: ${convenio}`);
  };

  const setupProtocolValidation = () => {
    if (!elements.numProtocolo || !elements.protocoloFeedback) return;

    const validateInput = debounce(() => {
      const value = elements.numProtocolo.value.trim();
      const feedback = elements.protocoloFeedback;

      if (value) {
        const validation = validarProtocolo(value, state.baseDeDados);
        feedback.className = "input-feedback";
        if (validation.valido) {
          feedback.className += " success";
          feedback.textContent = "✓ Protocolo válido";
        } else {
          feedback.className += " error";
          feedback.textContent = validation.erro;
        }
      } else {
        feedback.textContent = "";
        feedback.className = "input-feedback";
      }
    }, 300);

    elements.numProtocolo.addEventListener("input", validateInput);
  };

  const setupModoRapido = () => {
    const MODO_RAPIDO_KEY = "proton_modo_rapido";
    let modoAtivo = localStorage.getItem(MODO_RAPIDO_KEY) === "true";

    const applyState = () => {
      const btn = document.getElementById("btnModoRapido");
      const pill = document.getElementById("modoRapidoPill");
      const label = document.getElementById("modoRapidoLabel");
      const input = elements.numProtocolo;

      if (!btn) return;
      btn.setAttribute("aria-pressed", String(modoAtivo));
      btn.classList.toggle("modo-rapido-ativo", modoAtivo);
      if (label) label.textContent = modoAtivo ? "Modo Rápido: ON" : "Modo Rápido";
      if (pill) pill.style.display = modoAtivo ? "inline-flex" : "none";
      if (input) input.classList.toggle("input-modo-rapido", modoAtivo);
    };

    const toggle = () => {
      modoAtivo = !modoAtivo;
      localStorage.setItem(MODO_RAPIDO_KEY, String(modoAtivo));
      applyState();
      showToast(
        modoAtivo ? "success" : "info",
        modoAtivo ? "⚡ Modo Rápido Ativado" : "Modo Rápido Desativado",
        modoAtivo
          ? "Protocolo será adicionado automaticamente ao digitar 6 dígitos."
          : "Clique em Adicionar para incluir protocolos."
      );
    };

    elements.numProtocolo.addEventListener("input", () => {
      if (!modoAtivo) return;
      const val = elements.numProtocolo.value.trim();
      if (val.length === 6 && /^\d{6}$/.test(val)) {
        setTimeout(() => {
          if (elements.numProtocolo.value.trim().length === 6) {
            adicionarProtocolo();
          }
        }, 200);
      }
    });

    const btn = document.getElementById("btnModoRapido");
    if (btn) btn.addEventListener("click", toggle);
    applyState();
  };

  const limparSessaoNovoTurno = async () => {
    const confirmed = await showConfirmModal(
      "Iniciar Novo Turno?",
      "Esta ação limpará a lista de protocolos da sessão atual para um novo turno de trabalho. Certifique-se de que exportou os dados para Excel antes de continuar."
    );

    if (confirmed) {
      state.baseDeDados = [];
      state.dadosFiltrados = [];
      state.selectedItems = [];
      hasUnsavedChanges = false;

      sessionStorage.removeItem(STORAGE_KEYS.session);
      localStorage.removeItem(STORAGE_KEYS.database);

      syncApp();

      showToast(
        "success",
        "Novo Turno Iniciado",
        "A sessão foi limpa e está pronta para novos lançamentos."
      );
      addActivity("clear", "Novo turno iniciado - sessão de protocolos limpa");
      elements.numProtocolo.focus();
    }
  };

  const setupEventListeners = () => {
    setupPinField(elements.btnPinConferente, elements.conferente, "conferente", state);
    setupPinField(elements.btnPinConvenio, elements.convenio, "convenio", state);
    setupPinField(elements.btnPinData, elements.dataRecebimento, "data", state);

    if (elements.btnFixarConferente) {
      elements.btnFixarConferente.addEventListener("click", () =>
        elements.btnPinConferente?.click()
      );
    }
    if (elements.btnFixarConvenio) {
      elements.btnFixarConvenio.addEventListener("click", () =>
        elements.btnPinConvenio?.click()
      );
    }

    elements.btnAdicionar.addEventListener("click", adicionarProtocolo);
    elements.numProtocolo.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        adicionarProtocolo();
      }
    });

    // Delegação de eventos centralizada no <tbody> da tabela (Performance & Segurança XSS)
    elements.tabelaCorpo.addEventListener("click", (e) => {
      const button = e.target.closest("button[data-action]");
      if (!button) return;

      const action = button.dataset.action;
      const protocolo = button.dataset.protocolo;

      switch (action) {
        case "conference": {
          const index = state.baseDeDados.findIndex((p) => p.protocolo === protocolo);
          if (index !== -1) window.protonActions.conferirProtocolo(index);
          break;
        }
        case "edit-inline": {
          state.editingProtocol = protocolo;
          renderizarTabela(elements, state);
          break;
        }
        case "save-inline": {
          salvarEdicaoInline(protocolo, elements, state, (antigo, novo) => {
            hasUnsavedChanges = true;
            syncApp();
            addActivity("edit", `Protocolo editado inline: ${antigo} → ${novo}`);
          });
          break;
        }
        case "cancel-inline": {
          state.editingProtocol = null;
          renderizarTabela(elements, state);
          break;
        }
        case "edit-conferencia": {
          const index = state.baseDeDados.findIndex((p) => p.protocolo === protocolo);
          if (index !== -1) window.protonActions.editarProtocolo(index);
          break;
        }
        case "delete": {
          window.protonActions.removerProtocolo(protocolo);
          break;
        }
      }
    });

    elements.tabelaCorpo.addEventListener("change", (e) => {
      if (e.target.classList.contains("row-checkbox")) {
        const protocoloId = e.target.dataset.protocolo;
        toggleSelection(protocoloId, e.target.checked);
      }
    });

    elements.tabelaCorpo.addEventListener("keydown", (e) => {
      if (
        e.target.classList.contains("table-inline-input") ||
        e.target.classList.contains("table-inline-select")
      ) {
        const protocolo = e.target.dataset.protocolo;
        if (e.key === "Enter") {
          e.preventDefault();
          salvarEdicaoInline(protocolo, elements, state, (antigo, novo) => {
            hasUnsavedChanges = true;
            syncApp();
            addActivity("edit", `Protocolo editado inline: ${antigo} → ${novo}`);
          });
        } else if (e.key === "Escape") {
          e.preventDefault();
          state.editingProtocol = null;
          renderizarTabela(elements, state);
        }
      }
    });

    // Modal de Lote
    elements.btnAbrirModalLote.addEventListener("click", () => {
      elements.modalLote.style.display = "block";
      elements.modalLote.setAttribute("aria-hidden", "false");
      elements.listaProtocolosLote.focus();
    });

    elements.fecharModal.addEventListener("click", () => {
      closeModal(elements.modalLote);
    });

    elements.fecharModalConferencia.addEventListener("click", () => {
      closeModal(elements.modalConferencia);
    });

    const btnCancLote = document.getElementById("btnCancelarLote");
    if (btnCancLote) {
      btnCancLote.addEventListener("click", () => closeModal(elements.modalLote));
    }

    window.addEventListener("click", (e) => {
      if (e.target === elements.modalLote) closeModal(elements.modalLote);
      if (e.target === elements.modalConferencia) closeModal(elements.modalConferencia);
    });

    elements.btnConfirmarLote.addEventListener("click", () => {
      const convenio = elements.convenio.value;
      const dataRecebimento = elements.dataRecebimento.value;

      if (!convenio || !dataRecebimento) {
        showToast(
          "warning",
          "Campos Obrigatórios",
          "Defina o convênio e a data de referência antes de adicionar o lote."
        );
        return;
      }

      const protocolos = elements.listaProtocolosLote.value
        .trim()
        .split("\n")
        .map((p) => p.trim())
        .filter((p) => p);

      if (protocolos.length === 0) {
        showToast(
          "warning",
          "Lista Vazia",
          "Digite pelo menos um protocolo na lista."
        );
        return;
      }

      let adicionados = 0;
      let erros = 0;

      protocolos.forEach((p) => {
        const validacao = validarProtocolo(p, state.baseDeDados);
        if (validacao.valido) {
          state.baseDeDados.push({
            protocolo: p,
            convenio: convenio,
            status: "Pendente",
            dataRecebimento: dataRecebimento,
            dataAdicao: new Date().toISOString(),
          });
          adicionados++;
        } else {
          erros++;
        }
      });

      if (adicionados > 0) {
        elements.listaProtocolosLote.value = "";
        closeModal(elements.modalLote);

        hasUnsavedChanges = true;
        syncApp();

        let message = `${adicionados} protocolos adicionados com sucesso.`;
        if (erros > 0) {
          message += ` ${erros} protocolos foram ignorados por serem inválidos ou duplicados.`;
        }

        showToast("success", "Lote Processado", message);
        addActivity("add", `Lote de ${adicionados} protocolos adicionado`, `Convênio: ${convenio}`);
      } else {
        showToast(
          "error",
          "Nenhum Protocolo Válido",
          "Todos os protocolos da lista são inválidos ou já existem."
        );
      }
    });

    // Filtros com Debounce
    elements.searchInput.addEventListener("input", debouncedAplicarFiltros);
    elements.filterStatus.addEventListener("change", aplicarFiltros);
    elements.filterConvenio.addEventListener("change", aplicarFiltros);
    elements.filterDate.addEventListener("change", aplicarFiltros);

    elements.btnClearSearch.addEventListener("click", () => {
      elements.searchInput.value = "";
      aplicarFiltros();
      elements.searchInput.focus();
    });

    elements.btnClearFilters.addEventListener("click", () => {
      elements.searchInput.value = "";
      elements.filterStatus.value = "";
      elements.filterConvenio.value = "";
      elements.filterDate.value = "";
      aplicarFiltros();
      showToast("info", "Filtros Limpos", "Exibindo todos os registros.");
    });

    // Excel Export & Reverse Import
    elements.btnGerarExcel.addEventListener("click", async () => {
      const ok = await gerarExcel({
        baseDeDados: state.baseDeDados,
        dataRecebimento: elements.dataRecebimento.value,
        conferente: elements.conferente.value,
        btnExcel: elements.btnGerarExcel,
        onSuccess: (count) => {
          hasUnsavedChanges = false;
          addActivity("export", "Planilha Excel gerada", `${count} registros processados`);
        },
      });
    });

    if (elements.btnImportarExcel && elements.fileImportExcel) {
      elements.btnImportarExcel.addEventListener("click", () => {
        elements.fileImportExcel.click();
      });
      elements.fileImportExcel.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          importarExcel({
            file: e.target.files[0],
            baseDeDados: state.baseDeDados,
            convenioPadrao: elements.convenio.value || "Unimed",
            onImportSuccess: (res) => {
              hasUnsavedChanges = true;
              if (res.dataDetectada && elements.dataRecebimento) {
                elements.dataRecebimento.value = res.dataDetectada;
              }
              if (res.responsavelDetectado && elements.conferente) {
                elements.conferente.value = res.responsavelDetectado;
              }
              syncApp();
              addActivity("restore", "Importação reversa de Excel", `${res.total} protocolos processados`);
            },
          });
          e.target.value = "";
        }
      });
    }

    if (elements.btnNovoTurno) {
      elements.btnNovoTurno.addEventListener("click", limparSessaoNovoTurno);
    }

    // Backup & Restore JSON
    elements.btnBackup.addEventListener("click", () => {
      try {
        const dadosBackup = {
          versao: "pro_v1.4",
          timestamp: new Date().toISOString(),
          dados: state.baseDeDados,
          atividades: state.atividades,
          configuracoes: {
            conferente: localStorage.getItem(STORAGE_KEYS.fixedConferente),
            convenio: localStorage.getItem(STORAGE_KEYS.fixedConvenio),
            tema: localStorage.getItem("theme"),
          },
        };

        const blob = new Blob([JSON.stringify(dadosBackup, null, 2)], {
          type: "application/json",
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `backup-proton-${new Date().toISOString().split("T")[0]}.json`;
        link.click();

        setTimeout(() => URL.revokeObjectURL(link.href), 100);

        showToast("success", "Backup Criado", "Arquivo de backup foi baixado.");
        addActivity("backup", "Backup de dados criado", `${state.baseDeDados.length} registros`);
      } catch (error) {
        console.error("Erro ao criar backup:", error);
        showToast("error", "Erro no Backup", "Falha ao criar o arquivo de backup.");
      }
    });

    elements.btnRestore.addEventListener("click", () => {
      elements.fileRestore.click();
    });

    elements.fileRestore.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const backup = JSON.parse(ev.target.result);
          if (!backup.versao || !backup.dados) {
            showToast("error", "Arquivo Inválido", "Arquivo de backup corrompido ou inválido.");
            return;
          }

          const confirmed = await showConfirmModal(
            "Restaurar Backup?",
            "Todos os dados atuais serão substituídos pelos dados do backup. Deseja prosseguir?"
          );

          if (confirmed) {
            state.baseDeDados = backup.dados || [];
            state.atividades = backup.atividades || [];
            hasUnsavedChanges = true;
            syncApp();
            showToast("success", "Backup Restaurado", "Dados restaurados com sucesso!");
            addActivity("restore", "Backup restaurado", `${state.baseDeDados.length} registros`);
          }
        } catch (error) {
          console.error("Erro ao processar backup:", error);
          showToast("error", "Erro no Backup", "Falha ao processar arquivo de backup.");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });

    elements.btnShowHistory.addEventListener("click", () => {
      const isVisible = elements.activityHistory.style.display !== "none";
      elements.activityHistory.style.display = isVisible ? "none" : "block";
      elements.btnShowHistory.innerHTML = isVisible
        ? '<i class="fas fa-history" aria-hidden="true"></i> Mostrar Histórico'
        : '<i class="fas fa-eye-slash" aria-hidden="true"></i> Ocultar Histórico';

      if (!isVisible) renderActivities();
    });

    elements.btnLimpar.addEventListener("click", async () => {
      const confirmed = await showConfirmModal(
        "Limpar Todos os Dados?",
        "ATENÇÃO: Esta ação apagará permanentemente TODOS os protocolos e históricos do sistema. Esta ação não pode ser desfeita. Tem certeza que deseja prosseguir?"
      );
      if (confirmed) {
        state.baseDeDados = [];
        state.atividades = [];
        state.dadosFiltrados = [];
        state.selectedItems = [];
        hasUnsavedChanges = false;

        sessionStorage.removeItem(STORAGE_KEYS.session);
        localStorage.removeItem(STORAGE_KEYS.database);
        localStorage.removeItem(STORAGE_KEYS.activities);

        syncApp();
        showToast("success", "Dados Limpos", "Todos os dados foram removidos do sistema.");
        addActivity("clear", "Todos os dados foram limpos");
      }
    });

    const selectAllCb = document.getElementById("selectAllCheckbox");
    if (selectAllCb) {
      selectAllCb.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        state.dadosFiltrados.forEach((item) => {
          toggleSelection(item.protocolo, isChecked);
          const cb = document.querySelector(
            `.row-checkbox[data-protocolo="${item.protocolo}"]`
          );
          if (cb) cb.checked = isChecked;
        });
      });
    }

    const btnBulkConf = document.getElementById("btnBulkConference");
    if (btnBulkConf) {
      btnBulkConf.addEventListener("click", () => {
        window.protonActions.conferirSelecionados();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (document.querySelector('.modal[style*="display: block"]')) return;

      if (
        e.ctrlKey &&
        document.getElementById("tab-proton")?.classList.contains("active")
      ) {
        switch (e.key.toLowerCase()) {
          case "a":
            e.preventDefault();
            elements.numProtocolo?.focus();
            break;
          case "f":
            e.preventDefault();
            elements.searchInput?.focus();
            break;
          case "e":
            e.preventDefault();
            elements.btnGerarExcel?.click();
            break;
        }
      }
    });
  };

  const init = () => {
    if (!elements.dataRecebimento.value) {
      elements.dataRecebimento.valueAsDate = new Date();
    }

    setupProtocolValidation();
    setupSorting(state, () => renderizarTabela(elements, state));
    setupEventListeners();
    setupModoRapido();
    setupRelatorio(state);
    clearSelection();

    // Sincroniza o estado inicial
    syncApp({ save: false });

    // Prevenção de perda acidental com aviso nativo
    window.addEventListener("beforeunload", (e) => {
      if (hasUnsavedChanges && state.baseDeDados.length > 0) {
        e.preventDefault();
        e.returnValue =
          "Você possui protocolos adicionados que ainda não foram exportados para Excel. Deseja realmente sair?";
        return e.returnValue;
      }
    });

    window.addEventListener("beforeprint", atualizarDadosImpressao);
  };

  init();

  return {
    atualizarDashboard,
    aplicarFiltros,
    syncApp,
    state,
  };
};

