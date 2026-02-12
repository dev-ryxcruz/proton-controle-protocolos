// PROTON v1.4 - Sistema de Controle de Protocolos
// Desenvolvido por Ryan Cristian

(function () {
  "use strict";

  // Utilitários de segurança
  const SecurityUtils = {
    sanitizeHTML: (str) => {
      const temp = document.createElement("div");
      temp.textContent = str;
      return temp.innerHTML;
    },
    escapeHTML: (str) => {
      const div = document.createElement("div");
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    },
    validateNumeric: (value) => {
      return /^\d+$/.test(value.toString().trim());
    },
  };

  // Utilitários de performance
  const PerformanceUtils = {
    debounce: (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    throttle: (func, limit) => {
      let inThrottle;
      return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
        }
      };
    },
  };

  // Gerenciador de Símbolos
  const SymbolManager = {
    generateIndicators: (item) => {
      const { quantidades = {}, observacoes = "" } = item;
      const indicatorMap = {
        Ambulatorio: { class: "amb", letter: "A", label: "Ambulatório" },
        CDI: { class: "cdi", letter: "C", label: "CDI" },
        UE: { class: "ue", letter: "U", label: "UE" },
        Internacao: { class: "int", letter: "I", label: "Internação" },
      };

      let indicatorsHTML = Object.entries(indicatorMap)
        .filter(([key]) => quantidades[key] > 0)
        .map(
          ([key, { class: c, letter, label }]) =>
            `<div class="indicator-symbol indicator-${c}" data-tooltip="${label}: ${quantidades[key]} docs" title="${label}: ${quantidades[key]} documentos">${letter}</div>`,
        )
        .join("");

      if (observacoes.trim()) {
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
  };

  // Gerenciador de loading
  const LoadingManager = {
    show: (message = "Carregando...") => {
      const overlay = document.getElementById("loadingOverlay");
      if (overlay) {
        overlay.querySelector("p").textContent = message;
        overlay.style.display = "flex";
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

  const getCssVariable = (variable) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();
  };

  // Inicialização da aplicação
    const initializeApp = () => {
        LoadingManager.show('Inicializando PROTON...');
        
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark-mode');
            document.getElementById('checkbox').checked = true;
        }

        setupTabs();
        const protonInstance = protonApp();
        const contadorInstance = contadorApp();
        setupGlobalKeyboardShortcuts();
        setupThemeToggle();
        
        // Inicializa a Command Palette
        setupCommandPalette();

        setTimeout(() => {
            LoadingManager.hide();
        }, 1000);

        return { protonInstance, contadorInstance };
    };

    // === NOVO MÓDULO: Command Palette ===
    const setupCommandPalette = () => {
        // 1. Cria a interface dinamicamente e injeta no Body
        const overlay = document.createElement('div');
        overlay.className = 'command-palette-overlay';
        overlay.innerHTML = `
            <div class="command-palette">
                <div class="cp-input-wrapper">
                    <i class="fas fa-terminal" aria-hidden="true"></i>
                    <input type="text" id="cpInput" placeholder="Digite um comando (ex: tema, excel, buscar)..." autocomplete="off" spellcheck="false">
                </div>
                <div class="cp-results" id="cpResults"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        const input = document.getElementById('cpInput');
        const resultsContainer = document.getElementById('cpResults');
        let selectedIndex = 0;
        let currentFilteredCommands = [];

        // 2. Lista de Comandos Disponíveis
        const commands = [
            { id: 'theme', icon: 'fa-moon', name: 'Alternar Tema (Claro/Escuro)', action: () => document.getElementById('checkbox').click() },
            { id: 'add', icon: 'fa-plus', name: 'Novo Protocolo (Focar campo)', action: () => { document.querySelector('[data-tab="tab-proton"]').click(); setTimeout(() => document.getElementById('numProtocolo').focus(), 100); } },
            { id: 'search', icon: 'fa-search', name: 'Buscar Protocolos', action: () => { document.querySelector('[data-tab="tab-proton"]').click(); setTimeout(() => document.getElementById('searchInput').focus(), 100); } },
            { id: 'lote', icon: 'fa-layer-group', name: 'Adicionar Protocolos em Lote', action: () => { document.querySelector('[data-tab="tab-proton"]').click(); document.getElementById('btnAbrirModalLote').click(); } },
            { id: 'excel', icon: 'fa-file-excel', name: 'Exportar Planilha Excel', action: () => document.getElementById('gerarExcel').click() },
            { id: 'pdf', icon: 'fa-file-pdf', name: 'Gerar Relatório PDF (Contador)', action: () => { document.querySelector('[data-tab="tab-contador"]').click(); setTimeout(() => document.getElementById('pdf-btn').click(), 100); } },
            { id: 'tab-proton', icon: 'fa-file-alt', name: 'Ir para Aba: Controle de Protocolos', action: () => document.querySelector('[data-tab="tab-proton"]').click() },
            { id: 'tab-contador', icon: 'fa-calculator', name: 'Ir para Aba: Contador Manual', action: () => document.querySelector('[data-tab="tab-contador"]').click() },
            { id: 'shortcuts', icon: 'fa-keyboard', name: 'Mostrar Atalhos de Teclado', action: () => document.getElementById('btnShowShortcuts').click() }
        ];

        // 3. Lógica de Renderização e Filtro
        const renderResults = (query = '') => {
            resultsContainer.innerHTML = '';
            const q = query.toLowerCase().trim();
            
            // Smart Feature: Se digitar 6 números, sugere buscar aquele protocolo específico
            if (/^\d{6}$/.test(q)) {
                 currentFilteredCommands = [{
                     id: 'find-protocol',
                     icon: 'fa-crosshairs',
                     name: `Localizar protocolo ${q} na tabela`,
                     action: () => {
                         document.querySelector('[data-tab="tab-proton"]').click();
                         const searchInput = document.getElementById('searchInput');
                         searchInput.value = q;
                         searchInput.dispatchEvent(new Event('input')); // Dispara o filtro
                         setTimeout(() => searchInput.focus(), 100);
                     }
                 }];
            } else {
                currentFilteredCommands = commands.filter(cmd => cmd.name.toLowerCase().includes(q));
            }

            if (currentFilteredCommands.length === 0) {
                resultsContainer.innerHTML = '<div class="cp-empty">Nenhum comando encontrado.</div>';
                return;
            }

            currentFilteredCommands.forEach((cmd, index) => {
                const item = document.createElement('div');
                item.className = `cp-item ${index === selectedIndex ? 'selected' : ''}`;
                item.innerHTML = `<i class="fas ${cmd.icon} cp-item-icon"></i> <span>${cmd.name}</span>`;
                
                // Evento de clique
                item.addEventListener('click', () => executeCommand(cmd));
                
                // Evento de hover do mouse (para sincronizar com setas do teclado)
                item.addEventListener('mousemove', () => {
                    if (selectedIndex !== index) {
                        selectedIndex = index;
                        updateSelection();
                    }
                });

                resultsContainer.appendChild(item);
            });
            updateSelection();
        };

        const updateSelection = () => {
            const items = resultsContainer.querySelectorAll('.cp-item');
            items.forEach((item, index) => {
                item.classList.toggle('selected', index === selectedIndex);
                if (index === selectedIndex) {
                    item.scrollIntoView({ block: 'nearest' });
                }
            });
        };

        const executeCommand = (cmd) => {
            closePalette();
            setTimeout(() => cmd.action(), 150); // Pequeno atraso para a animação de fechar
        };

        const openPalette = () => {
            overlay.classList.add('visible');
            input.value = '';
            selectedIndex = 0;
            renderResults();
            setTimeout(() => input.focus(), 50);
        };

        const closePalette = () => {
            overlay.classList.remove('visible');
            input.blur();
        };

        // 4. Listeners de Eventos da Paleta
        input.addEventListener('input', (e) => {
            selectedIndex = 0;
            renderResults(e.target.value);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % currentFilteredCommands.length;
                updateSelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + currentFilteredCommands.length) % currentFilteredCommands.length;
                updateSelection();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentFilteredCommands[selectedIndex]) {
                    executeCommand(currentFilteredCommands[selectedIndex]);
                }
            }
        });

        // Fechar ao clicar fora
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closePalette();
        });

        // Abrir/Fechar com Teclado (Ctrl + K ou ESC)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('visible')) {
                closePalette();
            }
            if (e.ctrlKey && e.key.toLowerCase() === 'k') {
                e.preventDefault(); // Evita que o navegador foque na barra de URL
                overlay.classList.contains('visible') ? closePalette() : openPalette();
            }
        });
    };
  const setupTabs = () => {
        const tabLinks = document.querySelectorAll('.tab-link');
        const tabContents = document.querySelectorAll('.tab-content');
        const protonShortcuts = document.getElementById('proton-shortcuts');
        const contadorShortcuts = document.getElementById('contador-shortcuts');

        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                const tabId = link.getAttribute('data-tab');

                // Remover classes ativas
                tabLinks.forEach(item => {
                    item.classList.remove('active');
                    item.setAttribute('aria-selected', 'false');
                });
                tabContents.forEach(item => item.classList.remove('active'));

                // Adicionar classes ativas
                link.classList.add('active');
                link.setAttribute('aria-selected', 'true');
                document.getElementById(tabId).classList.add('active');
                
                // Alternar atalhos
                if (tabId === 'tab-proton') {
                    protonShortcuts.style.display = 'block';
                    contadorShortcuts.style.display = 'none';
                } else {
                    protonShortcuts.style.display = 'none';
                    contadorShortcuts.style.display = 'block';
                }
            });
        });
    };

  const setupThemeToggle = () => {
    const themeSwitch = document.getElementById("checkbox");

    themeSwitch.addEventListener("change", () => {
      if (themeSwitch.checked) {
        document.documentElement.classList.add("dark-mode");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark-mode");
        localStorage.setItem("theme", "light");
      }
    });
  };

  const setupGlobalKeyboardShortcuts = () => {
    document.addEventListener("keydown", (e) => {
      if (document.querySelector('.modal[style*="display: block"]')) return;

      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "d":
            e.preventDefault();
            document.getElementById("checkbox").click();
            break;
          case "?":
            e.preventDefault();
            document.getElementById("btnShowShortcuts").click();
            break;
        }
      }
    });
  };
  
  // Módulo PROTON
  const protonApp = () => {
    if (!document.getElementById("tab-proton")) return {};

    const elements = {
      dataRecebimento: document.getElementById("dataRecebimento"),
      numProtocolo: document.getElementById("numProtocolo"),
      protocoloFeedback: document.getElementById("protocoloFeedback"),
      btnAdicionar: document.getElementById("btnAdicionar"),
      btnLimpar: document.getElementById("btnLimpar"),
      tabelaCorpo: document.getElementById("tabelaCorpo"),
      mensagemVazia: document.getElementById("mensagemVazia"),
      conferente: document.getElementById("conferente"),
      btnFixarConferente: document.getElementById("btnFixarConferente"),
      btnTrocarConferente: document.getElementById("btnTrocarConferente"),
      convenio: document.getElementById("convenio"),
      btnFixarConvenio: document.getElementById("btnFixarConvenio"),
      btnTrocarConvenio: document.getElementById("btnTrocarConvenio"),
      btnGerarExcel: document.getElementById("gerarExcel"),
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
      timerDisplay: document.getElementById("timerDisplay"),
      timerToggle: document.getElementById("timerToggle"),
      timerIcon: document.getElementById("timerIcon"),
      timerReset: document.getElementById("timerReset"),
      btnShowShortcuts: document.getElementById("btnShowShortcuts"),
      keyboardShortcuts: document.getElementById("keyboardShortcuts"),
    };

    const STORAGE_KEYS = {
      database: "documentosDB_pro_v1",
      activities: "atividades_pro_v1",
      timerSeconds: "timer_seconds",
      timerRunning: "timer_was_running",
      fixedConferente: "conferenteFixo_pro_v1",
      fixedConvenio: "convenioFixo_pro_v1",
    };

    let state = {
      baseDeDados:
        JSON.parse(localStorage.getItem(STORAGE_KEYS.database)) || [],
      dadosFiltrados: [],
      atividades:
        JSON.parse(localStorage.getItem(STORAGE_KEYS.activities)) || [],
      tipoDocumentoChart: null,
      timerInterval: null,
      timerSeconds:
        parseInt(localStorage.getItem(STORAGE_KEYS.timerSeconds)) || 0,
      isTimerRunning: false,
      sortColumn: null,
      sortDirection: "asc",
      selectedItems: [],
    };

    state.dadosFiltrados = [...state.baseDeDados];

    const formatarDataBR = (dataString) => {
      if (!dataString || !dataString.includes("-")) return "";
      const [ano, mes, dia] = dataString.split("-");
      return `${dia}/${mes}/${ano}`;
    };

    const salvarDados = () => {
      try {
        localStorage.setItem(
          STORAGE_KEYS.database,
          JSON.stringify(state.baseDeDados),
        );
        localStorage.setItem(
          STORAGE_KEYS.activities,
          JSON.stringify(state.atividades),
        );
      } catch (error) {
        console.error("Erro ao salvar dados:", error);
        // QuotaExceededError = localStorage cheio
        if (error.name === 'QuotaExceededError') {
          showToast("error", "Limite Excedido", "Espaço de armazenamento local cheio.");
        } else {
          showToast("error", "Erro", "Falha ao salvar dados localmente.");
        }
      }
    };

    let lastFocusedElement = null;

    const closeModal = (modalElement) => {
      if (!modalElement) return;

      modalElement.style.display = "none";
      modalElement.setAttribute("aria-hidden", "true");

      if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
      }
    };

    const showToast = (type, title, message, duration = 4000) => {
      const toastContainer = document.getElementById("toastContainer");
      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;

      const icons = {
        success: "fas fa-check-circle",
        error: "fas fa-exclamation-circle",
        warning: "fas fa-exclamation-triangle",
        info: "fas fa-info-circle",
      };

      const safeTitle = SecurityUtils.escapeHTML(title);
      const safeMessage = SecurityUtils.escapeHTML(message);

      toast.innerHTML = `
                <div class="toast-icon">
                    <i class="${icons[type]}" aria-hidden="true"></i>
                </div>
                <div class="toast-content">
                    <div class="toast-title">${safeTitle}</div>
                    <div class="toast-message">${safeMessage}</div>
                </div>
                <button class="toast-close" aria-label="Fechar notificação">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            `;

      toastContainer.appendChild(toast);

      const autoRemove = setTimeout(() => {
        if (toast.parentNode) {
          removeToast(toast);
        }
      }, duration);

      toast.querySelector(".toast-close").addEventListener("click", () => {
        clearTimeout(autoRemove);
        removeToast(toast);
      });
    };

    const removeToast = (toast) => {
      toast.style.animation =
        "toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    };

    // === MELHORIA: Toast de Desfazer (Undo) ===
    const showUndoToast = (message, onUndo) => {
      const toastContainer = document.getElementById("toastContainer");
      const toast = document.createElement("div");
      toast.className = "toast toast-info";

      toast.innerHTML = `
                <div class="toast-icon"><i class="fas fa-trash-restore"></i></div>
                <div class="toast-content">
                    <div class="toast-title">Ação Realizada</div>
                    <div class="toast-message">${message}</div>
                </div>
                <button class="btn-undo" style="background: white; color: var(--cor-texto); border: 1px solid var(--cor-borda); padding: 4px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; margin-left: 10px;">
                    Desfazer
                </button>
            `;

      const btnUndo = toast.querySelector(".btn-undo");
      let isUndone = false;

      btnUndo.addEventListener("click", () => {
        isUndone = true;
        onUndo();
        toast.remove();
      });

      toastContainer.appendChild(toast);

      setTimeout(() => {
        if (!isUndone && toast.parentNode) {
          toast.style.animation = "toastSlideIn 0.3s reverse";
          setTimeout(() => toast.remove(), 300);
        }
      }, 5000);
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

    const updateTimerDisplay = () => {
      const hours = Math.floor(state.timerSeconds / 3600);
      const minutes = Math.floor((state.timerSeconds % 3600) / 60);
      const seconds = state.timerSeconds % 60;

      const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      elements.timerDisplay.textContent = timeString;
      elements.timerDisplay.setAttribute(
        "aria-label",
        `Tempo decorrido: ${timeString}`,
      );
    };

    const startTimer = () => {
      if (state.isTimerRunning) return;

      state.isTimerRunning = true;
      elements.timerIcon.className = "fas fa-pause";
      elements.timerToggle.setAttribute("title", "Pausar cronômetro");

      showToast(
        "info",
        "Timer Iniciado",
        "Cronômetro de produtividade ativado!",
      );

      state.timerInterval = setInterval(() => {
        state.timerSeconds++;
        updateTimerDisplay();
        localStorage.setItem(STORAGE_KEYS.timerSeconds, state.timerSeconds);
      }, 1000);
    };

    const pauseTimer = () => {
      if (!state.isTimerRunning) return;

      state.isTimerRunning = false;
      elements.timerIcon.className = "fas fa-play";
      elements.timerToggle.setAttribute("title", "Iniciar cronômetro");

      clearInterval(state.timerInterval);
      showToast("warning", "Timer Pausado", "Cronômetro pausado.");
    };

    const resetTimer = () => {
      if (state.isTimerRunning) pauseTimer();

      if (confirm("Tem certeza que deseja reiniciar o cronômetro?")) {
        state.timerSeconds = 0;
        localStorage.removeItem(STORAGE_KEYS.timerSeconds);
        updateTimerDisplay();
        showToast("info", "Cronômetro Reiniciado", "O tempo foi zerado.");
      }
    };

    const validarProtocolo = (protocolo) => {
      const protocoloLimpo = protocolo.toString().trim();

      if (!protocoloLimpo)
        return { valido: false, erro: "Protocolo não pode estar vazio." };
      if (!SecurityUtils.validateNumeric(protocoloLimpo))
        return { valido: false, erro: "Protocolo deve conter apenas números." };
      if (protocoloLimpo.length !== 6)
        return {
          valido: false,
          erro: "Protocolo deve ter exatamente 6 dígitos.",
        };
      if (state.baseDeDados.some((item) => item.protocolo === protocoloLimpo))
        return { valido: false, erro: "Este protocolo já existe na fila." };

      return { valido: true };
    };

    const updateProtocoloFeedback = (validation) => {
      const feedback = elements.protocoloFeedback;
      if (!feedback) return;

      feedback.className = "input-feedback";

      if (validation.valido) {
        feedback.className += " success";
        feedback.textContent = "✓ Protocolo válido";
      } else {
        feedback.className += " error";
        feedback.textContent = validation.erro;
      }
    };

    const atualizarDashboard = () => {
      const total = state.dadosFiltrados.length;
      const processados = state.dadosFiltrados.filter(
        (item) => item.status === "Baixado",
      ).length;
      const pendentes = total - processados;
      const taxa = total > 0 ? Math.round((processados / total) * 100) : 0;

      elements.statTotal.textContent = total;
      elements.statProcessados.textContent = processados;
      elements.statPendentes.textContent = pendentes;
      elements.statTaxa.textContent = `${taxa}%`;

      elements.progressBar.style.width = `${taxa}%`;
      elements.progressBar.textContent = `${taxa}%`;
      elements.progressBar.setAttribute("aria-valuenow", taxa);

      const convenios = [
        ...new Set(state.baseDeDados.map((item) => item.convenio)),
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
      atualizarGrafico();
    };

    // === MELHORIA: Cores dinâmicas para o Chart ===
    const getChartColors = () => {
      const style = getComputedStyle(document.documentElement);
      return {
        Ambulatorio: style.getPropertyValue("--cor-ambulatório").trim(),
        CDI: style.getPropertyValue("--cor-tipo-cdi").trim(),
        UE: style.getPropertyValue("--cor-tipo-ue").trim(),
        Internacao: style.getPropertyValue("--cor-internação").trim(),
        Texto: style.getPropertyValue("--cor-texto").trim(),
        Borda: style.getPropertyValue("--cor-container").trim(),
      };
    };

    const atualizarGrafico = () => {
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
        (k) => contagemTipos[k] > 0,
      );
      const data = Object.values(contagemTipos).filter((v) => v > 0);

      const themeColors = getChartColors();
      const colors = labels.map((label) => themeColors[label]);

      if (state.tipoDocumentoChart) {
        try {
          state.tipoDocumentoChart.destroy();
        } catch (e) {
          console.warn("Aviso ao destruir gráfico anterior:", e);
        }
      }

      if (data.length > 0) {
        state.tipoDocumentoChart = new Chart(elements.chartCanvas, {
          type: "doughnut",
          data: {
            labels: labels.map((l) => {
              switch (l) {
                case "Ambulatorio":
                  return "Ambulatório";
                case "Internacao":
                  return "Internação";
                default:
                  return l;
              }
            }),
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

    const renderizarTabela = () => {
      if (!elements.tabelaCorpo) return;

      elements.tabelaCorpo.innerHTML = "";

      if (elements.mensagemVazia) {
        elements.mensagemVazia.style.display =
          state.dadosFiltrados.length === 0 ? "block" : "none";
      }

      state.dadosFiltrados.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.dataset.protocolo = item.protocolo;
        const isSelected = state.selectedItems.includes(item.protocolo);
        if (isSelected) tr.classList.add("selected");
        if (item.status === "Baixado") tr.classList.add("status-baixado");

        const convenioColor = {
          Unimed: "#3b82f6",
          Intercâmbio: "#ef4444",
          "Convênio Externo": "#f59e0b",
          Particular: "#10b981",
          Internação: "#8b5cf6",
        };

        const convenioSafe = SecurityUtils.escapeHTML(item.convenio);
        const statusSafe = SecurityUtils.escapeHTML(item.status);
        const protocolCell = SymbolManager.createProtocolCell(item);

        // === MELHORIA: Atributo data-label para os cards de Mobile ===
        tr.innerHTML = `
                    <td class="checkbox-cell" data-label="Selecionar">
                        <input type="checkbox" class="row-checkbox" data-protocolo="${item.protocolo}" ${isSelected ? "checked" : ""} aria-label="Selecionar protocolo ${item.protocolo}">
                    </td>
                    <td data-label="Protocolo">${protocolCell}</td>
                    <td data-label="Convênio">
                        <span style="background: ${convenioColor[item.convenio] || "#64748b"}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                            ${convenioSafe}
                        </span>
                    </td>
                    <td class="status-display" data-label="Status">
                        <i class="fas ${item.status === "Baixado" ? "fa-check-circle" : "fa-clock"}" aria-hidden="true"></i> 
                        ${statusSafe}
                    </td>
                   <td data-label="Data Referência">${formatarDataBR(item.dataRecebimento)}</td>
<td data-label="Ações">
    <div class="action-buttons"></div>
</td>
                `;

        const acaoCell = tr.querySelector(".action-buttons");
        const itemIndex = state.baseDeDados.indexOf(item);

        const createButton = (action, icon, btnClass, title) =>
          `<button type="button" class="${btnClass}" data-action="${action}" data-index="${itemIndex}" title="${title}" aria-label="${title} protocolo ${item.protocolo}">
                        <i class="fas ${icon}" aria-hidden="true"></i>
                    </button>`;

        if (item.status === "Baixado") {
          acaoCell.innerHTML = `
                        ${createButton("edit", "fa-edit", "btn-warning", "Editar")}
                        ${createButton("delete", "fa-trash", "btn-danger", "Remover")}
                    `;
        } else {
          acaoCell.innerHTML = `
                        ${createButton("conference", "fa-check", "btn-success", "Conferir")}
                        ${createButton("edit", "fa-edit", "btn-warning", "Editar")}
                        ${createButton("delete", "fa-trash", "btn-danger", "Remover")}
                    `;
        }

        elements.tabelaCorpo.appendChild(tr);
      });

      const selectAllCheckbox = document.getElementById("selectAllCheckbox");
      selectAllCheckbox.checked =
        state.dadosFiltrados.length > 0 &&
        state.dadosFiltrados.every((item) =>
          state.selectedItems.includes(item.protocolo),
        );
    };

    const setupSorting = () => {
      const sortButtons = document.querySelectorAll(".sort-btn");

      sortButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const column = btn.getAttribute("data-column");

          if (state.sortColumn === column) {
            state.sortDirection =
              state.sortDirection === "asc" ? "desc" : "asc";
          } else {
            state.sortColumn = column;
            state.sortDirection = "asc";
          }

          sortButtons.forEach((b) => {
            b.classList.remove("active");
            const icon = b.querySelector(".sort-icon");
            icon.className = "fas fa-sort sort-icon";
          });

          btn.classList.add("active");
          const icon = btn.querySelector(".sort-icon");
          icon.className = `fas fa-sort-${state.sortDirection === "asc" ? "up" : "down"} sort-icon`;

          sortData();
          renderizarTabela();
        });
      });
    };

    const sortData = () => {
      if (!state.sortColumn) return;

      state.dadosFiltrados.sort((a, b) => {
        let valueA = a[state.sortColumn];
        let valueB = b[state.sortColumn];

        if (state.sortColumn === "dataRecebimento") {
          valueA = new Date(valueA);
          valueB = new Date(valueB);
        }

        if (state.sortColumn === "protocolo") {
          valueA = parseInt(valueA);
          valueB = parseInt(valueB);
        }

        if (valueA < valueB) return state.sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return state.sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    };

    const aplicarFiltros = PerformanceUtils.debounce(() => {
      const searchTerm = elements.searchInput.value.toLowerCase().trim();
      const statusFilter = elements.filterStatus.value;
      const convenioFilter = elements.filterConvenio.value;
      const dateFilter = elements.filterDate.value;

      elements.btnClearSearch.classList.toggle(
        "visible",
        searchTerm.length > 0,
      );

      state.dadosFiltrados = state.baseDeDados.filter((item) => {
        const matchesSearch =
          !searchTerm ||
          item.protocolo.toLowerCase().includes(searchTerm) ||
          item.convenio.toLowerCase().includes(searchTerm) ||
          item.status.toLowerCase().includes(searchTerm);

        const matchesStatus = !statusFilter || item.status === statusFilter;
        const matchesConvenio =
          !convenioFilter || item.convenio === convenioFilter;
        const matchesDate = !dateFilter || item.dataRecebimento === dateFilter;

        return matchesSearch && matchesStatus && matchesConvenio && matchesDate;
      });

      if (state.sortColumn) sortData();

      renderizarTabela();
      atualizarDashboard();
      updateBulkActionsBar();
    }, 300);

    window.protonActions = {
      conferirProtocolo: (index) => {
        const item = state.baseDeDados[index];
        if (!item) return;

        elements.conferenciaForm.innerHTML = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <div class="form-group">
                            <label for="qtd-ambulatorio">Ambulatório</label>
                            <input type="number" id="qtd-ambulatorio" min="0" value="0" aria-label="Quantidade ambulatório">
                        </div>
                        <div class="form-group">
                            <label for="qtd-cdi">CDI</label>
                            <input type="number" id="qtd-cdi" min="0" value="0" aria-label="Quantidade CDI">
                        </div>
                        <div class="form-group">
                            <label for="qtd-ue">UE</label>
                            <input type="number" id="qtd-ue" min="0" value="0" aria-label="Quantidade UE">
                        </div>
                        <div class="form-group">
                            <label for="qtd-internacao">Internação</label>
                            <input type="number" id="qtd-internacao" min="0" value="0" aria-label="Quantidade internação">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="observacoes">Observações</label>
                        <textarea id="observacoes" rows="3" placeholder="Observações..." aria-label="Observações"></textarea>
                    </div>
                    <div class="actions">
                        <button class="btn-success" onclick="window.protonActions.salvarConferencia(${index})">
                            <i class="fas fa-save" aria-hidden="true"></i> Salvar Conferência
                        </button>
                        <button type="button" class="btn-secondary" onclick="window.protonActions.closeActiveModal()">
                            Cancelar
                        </button>
                    </div>
                `;

        elements.modalConferencia.style.display = "block";
        elements.modalConferencia.setAttribute("aria-hidden", "false");

        setTimeout(
          () => document.getElementById("qtd-ambulatorio").focus(),
          100,
        );
      },

      salvarConferencia: (index) => {
        const quantidades = {
          Ambulatorio:
            parseInt(document.getElementById("qtd-ambulatorio")?.value) || 0,
          CDI: parseInt(document.getElementById("qtd-cdi")?.value) || 0,
          UE: parseInt(document.getElementById("qtd-ue")?.value) || 0,
          Internacao:
            parseInt(document.getElementById("qtd-internacao")?.value) || 0,
        };

        const total = Object.values(quantidades).reduce((a, b) => a + b, 0);

        if (total === 0) {
          showToast(
            "warning",
            "Quantidade Inválida",
            "Pelo menos um tipo deve ter quantidade maior que zero.",
          );
          return;
        }

        const item = state.baseDeDados[index];
        if (!item) return;

        const observacoes = document.getElementById("observacoes")?.value || "";

        item.status = "Baixado";
        item.quantidades = quantidades;
        item.observacoes = SecurityUtils.escapeHTML(observacoes);
        item.conferente = elements.conferente ? elements.conferente.value : "";
        item.dataConferencia = new Date().toISOString();

        salvarDados();
        aplicarFiltros();

        if (elements.modalConferencia) {
          elements.modalConferencia.style.display = "none";
          elements.modalConferencia.setAttribute("aria-hidden", "true");
        }

        showToast(
          "success",
          "Protocolo Conferido",
          `Protocolo ${item.protocolo} conferido com sucesso.`,
        );
        addActivity(
          "conference",
          `Protocolo ${item.protocolo} conferido`,
          `Total: ${total} documentos`,
        );
      },

      _bulkConferenceQueue: [],
      _bulkConferenceIndex: 0,
      closeActiveModal: () => {
        closeModal(elements.modalConferencia);
      },

      conferirSelecionados: () => {
        if (state.selectedItems.length === 0) {
          showToast(
            "warning",
            "Nenhum Item",
            "Selecione pelo menos um protocolo para conferir.",
          );
          return;
        }

        window.protonActions._bulkConferenceQueue = state.selectedItems.filter(
          (protocoloId) => {
            const item = state.baseDeDados.find(
              (i) => i.protocolo === protocoloId,
            );
            return item && item.status === "Pendente";
          },
        );
        window.protonActions._bulkConferenceIndex = 0;

        if (window.protonActions._bulkConferenceQueue.length === 0) {
          showToast(
            "info",
            "Nenhum Pendente",
            "Todos os itens selecionados já foram conferidos.",
          );
          clearSelection();
          return;
        }

        window.protonActions.processNextBulkItem();
      },

      processNextBulkItem: () => {
        if (
          window.protonActions._bulkConferenceIndex >=
          window.protonActions._bulkConferenceQueue.length
        ) {
          closeModal(elements.modalConferencia);
          salvarDados();
          clearSelection();
          aplicarFiltros();
          showToast(
            "success",
            "Conferência em Massa Concluída",
            `${this._bulkConferenceQueue.length} protocolos foram conferidos.`,
          );
          addActivity(
            "conference",
            `Conferência em massa de ${this._bulkConferenceQueue.length} protocolos.`,
          );
          return;
        }

        const protocoloId =
          window.protonActions._bulkConferenceQueue[
            window.protonActions._bulkConferenceIndex
          ];
        const item = state.baseDeDados.find((i) => i.protocolo === protocoloId);
        const itemIndex = state.baseDeDados.indexOf(item);

        const modal = elements.modalConferencia;
        const totalItems = window.protonActions._bulkConferenceQueue.length;
        const currentItemNum = window.protonActions._bulkConferenceIndex + 1;

        modal.querySelector(".modal-header h2").innerHTML =
          `<i class="fas fa-check-double"></i> Conferindo ${currentItemNum} de ${totalItems}: Protocolo ${item.protocolo}`;

        window.protonActions.conferirProtocolo(itemIndex);

        setTimeout(() => {
          const form = elements.conferenciaForm;
          const actionsDiv = form.querySelector(".actions");
          const isLastItem =
            window.protonActions._bulkConferenceIndex === totalItems - 1;

          actionsDiv.innerHTML = `
                        <button class="btn-success" onclick="window.protonActions.salvarConferenciaSequencial()"><i class="fas fa-save"></i> ${isLastItem ? "Salvar e Finalizar" : "Salvar e Próximo"}</button>
                        <button type="button" class="btn-warning" onclick="window.protonActions.pularItemSequencial()"><i class="fas fa-forward"></i> Pular</button>
                        <button type="button" class="btn-danger" onclick="window.protonActions.cancelarSequencia()">Cancelar</button>
                    `;
        }, 150);
      },

      salvarConferenciaSequencial: () => {
        const protocoloId =
          window.protonActions._bulkConferenceQueue[
            window.protonActions._bulkConferenceIndex
          ];
        const itemIndex = state.baseDeDados.findIndex(
          (i) => i.protocolo === protocoloId,
        );

        if (itemIndex === -1) {
          showToast(
            "error",
            "Erro",
            "Não foi possível encontrar o protocolo para salvar.",
          );
          return;
        }

        window.protonActions.salvarConferencia(itemIndex);
        window.protonActions._bulkConferenceIndex++;
        window.protonActions.processNextBulkItem();
      },

      pularItemSequencial: () => {
        window.protonActions._bulkConferenceIndex++;
        window.protonActions.processNextBulkItem();
      },

      cancelarSequencia: () => {
        window.protonActions._bulkConferenceQueue = [];
        window.protonActions._bulkConferenceIndex = 0;
        closeModal(elements.modalConferencia);
        showToast("info", "Cancelado", "A conferência em massa foi cancelada.");
      },

      salvarEdicaoConferencia: (index) => {
        const item = state.baseDeDados[index];
        if (!item) return;

        const quantidades = {
          Ambulatorio:
            parseInt(document.getElementById("qtd-ambulatorio")?.value) || 0,
          CDI: parseInt(document.getElementById("qtd-cdi")?.value) || 0,
          UE: parseInt(document.getElementById("qtd-ue")?.value) || 0,
          Internacao:
            parseInt(document.getElementById("qtd-internacao")?.value) || 0,
        };

        const total = Object.values(quantidades).reduce((a, b) => a + b, 0);

        if (total === 0) {
          showToast(
            "warning",
            "Quantidade Inválida",
            "Pelo menos um tipo deve ter quantidade maior que zero.",
          );
          return;
        }

        const observacoes = document.getElementById("observacoes")?.value || "";
        const novoProtocoloInput = document.getElementById(
          "edit-protocolo-conferencia",
        );

        if (novoProtocoloInput) {
          const novoProtocolo = novoProtocoloInput.value.trim();
          if (novoProtocolo && novoProtocolo !== item.protocolo) {
            const validacao = validarProtocolo(novoProtocolo);
            if (
              !validacao.valido &&
              validacao.erro !== "Protocolo já existe na fila."
            ) {
              showToast("error", "Erro de Validação", validacao.erro);
              return;
            }
            addActivity(
              "edit",
              `Protocolo editado: ${item.protocolo} → ${novoProtocolo}`,
            );
            item.protocolo = novoProtocolo;
          }
        }

        item.quantidades = quantidades;
        item.observacoes = SecurityUtils.escapeHTML(observacoes);
        item.conferente = elements.conferente
          ? elements.conferente.value
          : item.conferente;
        item.dataConferencia = new Date().toISOString();

        salvarDados();
        aplicarFiltros();
        closeModal(elements.modalConferencia);

        showToast(
          "success",
          "Conferência Editada",
          `Dados do protocolo ${item.protocolo} foram atualizados.`,
        );
        addActivity(
          "edit",
          `Conferência do protocolo ${item.protocolo} editada`,
          `Novo total: ${total} documentos`,
        );
      },

      editarProtocolo: (index) => {
        const item = state.baseDeDados[index];
        if (!item) return;

        if (item.status === "Baixado") {
          const modal = elements.modalConferencia;
          modal.querySelector(".modal-header h2").innerHTML =
            `<i class="fas fa-edit" aria-hidden="true"></i> Editar Conferência do Protocolo ${item.protocolo}`;

          elements.conferenciaForm.innerHTML = `
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label for="edit-protocolo-conferencia">Número do Protocolo</label>
                            <input type="text" id="edit-protocolo-conferencia" value="${SecurityUtils.escapeHTML(item.protocolo)}" required>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                            <div class="form-group">
                                <label for="qtd-ambulatorio">Ambulatório</label>
                                <input type="number" id="qtd-ambulatorio" min="0" value="${item.quantidades?.Ambulatorio || 0}" aria-label="Quantidade ambulatório">
                            </div>
                            <div class="form-group">
                                <label for="qtd-cdi">CDI</label>
                                <input type="number" id="qtd-cdi" min="0" value="${item.quantidades?.CDI || 0}" aria-label="Quantidade CDI">
                            </div>
                            <div class="form-group">
                                <label for="qtd-ue">UE</label>
                                <input type="number" id="qtd-ue" min="0" value="${item.quantidades?.UE || 0}" aria-label="Quantidade UE">
                            </div>
                            <div class="form-group">
                                <label for="qtd-internacao">Internação</label>
                                <input type="number" id="qtd-internacao" min="0" value="${item.quantidades?.Internacao || 0}" aria-label="Quantidade internação">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="observacoes">Observações</label>
                            <textarea id="observacoes" rows="3" placeholder="Observações..." aria-label="Observações">${item.observacoes || ""}</textarea>
                        </div>
                        <div class="actions">
                            <button class="btn-success" onclick="window.protonActions.salvarEdicaoConferencia(${index})"><i class="fas fa-save" aria-hidden="true"></i> Salvar Alterações</button>
                            <button type="button" class="btn-secondary" onclick="window.protonActions.closeActiveModal()">Cancelar</button>
                        </div>
                    `;
          modal.style.display = "block";
          modal.setAttribute("aria-hidden", "false");
          return;
        }

        const modal = elements.modalConferencia;
        modal.querySelector(".modal-header h2").innerHTML =
          `<i class="fas fa-edit" aria-hidden="true"></i> Editar Protocolo`;

        const form = modal.querySelector("#conferenciaForm");
        form.innerHTML = `
                    <div class="form-group">
                        <label for="edit-protocolo">Número do Protocolo</label>
                        <input type="text" id="edit-protocolo" value="${SecurityUtils.escapeHTML(item.protocolo)}" required>
                    </div>
                    <div class="actions">
                        <button type="button" id="btnSalvarEdicao" class="btn-success">
                            <i class="fas fa-save" aria-hidden="true"></i> Salvar Alterações
                        </button>
                        <button type="button" class="btn-secondary" onclick="window.protonActions.closeActiveModal()">
                            Cancelar
                        </button>
                    </div>
                `;

        modal.style.display = "block";
        modal.setAttribute("aria-hidden", "false");

        const input = document.getElementById("edit-protocolo");
        input.focus();
        input.select();

        document.getElementById("btnSalvarEdicao").onclick = () => {
          const novoProtocolo = input.value.trim();
          if (novoProtocolo && novoProtocolo !== item.protocolo) {
            const validacao = validarProtocolo(novoProtocolo);
            if (
              !validacao.valido &&
              validacao.erro !== "Protocolo já existe na fila."
            ) {
              showToast("error", "Erro de Validação", validacao.erro);
              return;
            }

            const protocoloAntigo = item.protocolo;
            item.protocolo = novoProtocolo;

            salvarDados();
            aplicarFiltros();

            showToast(
              "success",
              "Protocolo Editado",
              `Protocolo ${protocoloAntigo} alterado para ${novoProtocolo}`,
            );
            addActivity(
              "edit",
              `Protocolo editado: ${protocoloAntigo} → ${novoProtocolo}`,
            );
          }
          closeModal(modal);
        };
      },

      // === MELHORIA: Remover Protocolo agora suporta o UNDO (Desfazer) ===
      removerProtocolo: (index) => {
        const item = state.baseDeDados[index];
        if (!item) return;

        const itemRemovido = { ...item };
        const indexOriginal = index;

        state.baseDeDados.splice(index, 1);
        salvarDados();
        aplicarFiltros();

        showUndoToast(`Protocolo ${item.protocolo} removido.`, () => {
          state.baseDeDados.splice(indexOriginal, 0, itemRemovido);
          salvarDados();
          aplicarFiltros();
          showToast(
            "success",
            "Restaurado",
            `Protocolo ${item.protocolo} recuperado.`,
          );
        });
      },
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

    const clearSelection = () => {
      state.selectedItems = [];
      document
        .querySelectorAll("tr.selected")
        .forEach((row) => row.classList.remove("selected"));
      document
        .querySelectorAll(".row-checkbox:checked")
        .forEach((cb) => (cb.checked = false));
      document.getElementById("selectAllCheckbox").checked = false;
      updateBulkActionsBar();
    };

    const updateBulkActionsBar = () => {
      const container = document.getElementById("bulk-actions-container");
      const countSpan = document.getElementById("bulk-selected-count");
      const hasSelection = state.selectedItems.length > 0;
      container.style.display = hasSelection ? "flex" : "none";
      countSpan.textContent = `${state.selectedItems.length} selecionados`;
    };

    const setupFixableField = (inputEl, fixBtn, changeBtn, storageKey) => {
      const fixValue = () => {
        const value = inputEl.value.trim();
        if (!value) {
          showToast(
            "warning",
            "Campo Vazio",
            `Preencha o campo "${inputEl.labels[0].textContent}" para fixar.`,
          );
          inputEl.focus();
          return;
        }

        inputEl.disabled = true;
        fixBtn.style.display = "none";
        changeBtn.style.display = "inline-block";
        localStorage.setItem(storageKey, value);

        showToast(
          "success",
          "Campo Fixado",
          `${inputEl.labels[0].textContent} foi fixado.`,
        );
      };

      const changeValue = () => {
        inputEl.disabled = false;
        fixBtn.style.display = "inline-block";
        changeBtn.style.display = "none";
        localStorage.removeItem(storageKey);
        inputEl.focus();

        showToast(
          "info",
          "Campo Liberado",
          `${inputEl.labels[0].textContent} foi liberado para edição.`,
        );
      };

      const loadFixedValue = () => {
        const savedValue = localStorage.getItem(storageKey);
        if (savedValue) {
          inputEl.value = savedValue;
          fixValue();
        }
      };

      fixBtn.addEventListener("click", fixValue);
      changeBtn.addEventListener("click", changeValue);
      loadFixedValue();
    };

    const adicionarProtocolo = () => {
      const protocolo = elements.numProtocolo.value.trim();
      const convenio = elements.convenio.value;
      const dataRecebimento = elements.dataRecebimento.value;

      if (!convenio) {
        showToast(
          "warning",
          "Campo Obrigatório",
          "Selecione um convênio antes de adicionar o protocolo.",
        );
        elements.convenio.focus();
        return;
      }

      if (!dataRecebimento) {
        showToast(
          "warning",
          "Campo Obrigatório",
          "Defina a data de referência antes de adicionar o protocolo.",
        );
        elements.dataRecebimento.focus();
        return;
      }

      const validacao = validarProtocolo(protocolo);
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
      elements.numProtocolo.value = "";

      if (elements.protocoloFeedback) {
        elements.protocoloFeedback.textContent = "";
        elements.protocoloFeedback.className = "input-feedback";
      }

      salvarDados();
      aplicarFiltros();
      elements.numProtocolo.focus();

      showToast(
        "success",
        "Protocolo Adicionado",
        `Protocolo ${protocolo} foi adicionado à fila.`,
      );
      addActivity(
        "add",
        `Protocolo ${protocolo} adicionado`,
        `Convênio: ${convenio}`,
      );
    };

    const setupProtocolValidation = () => {
      if (!elements.numProtocolo || !elements.protocoloFeedback) return;

      const validateInput = PerformanceUtils.debounce(() => {
        const value = elements.numProtocolo.value.trim();

        if (value) {
          const validation = validarProtocolo(value);
          updateProtocoloFeedback(validation);
        } else {
          elements.protocoloFeedback.textContent = "";
          elements.protocoloFeedback.className = "input-feedback";
        }
      }, 300);

      elements.numProtocolo.addEventListener("input", validateInput);
    };

    const gerarExcel = async () => {
      if (state.baseDeDados.length === 0) {
        showToast("warning", "Sem Dados", "Não há protocolos para exportar.");
        return;
      }

      const itensParaExportar = state.baseDeDados.filter(
        (item) => item.status === "Baixado",
      );

      if (itensParaExportar.length === 0) {
        showToast(
          "warning",
          "Sem Dados Processados",
          "Não há protocolos processados para exportar.",
        );
        return;
      }

      LoadingManager.show("Gerando planilha Excel...");

      try {
        const dataRef =
          formatarDataBR(elements.dataRecebimento.value) ||
          new Date().toLocaleDateString("pt-BR");
        const nomeResp = elements.conferente.value || "Não informado";

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "PROTON v1.4";
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
            "Nenhum item com quantidade > 0 foi encontrado.",
          );
          LoadingManager.hide();
          return;
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
        addActivity(
          "export",
          "Planilha Excel gerada",
          `${itensParaExportar.length} registros processados`,
        );
      } catch (error) {
        console.error("Erro ao gerar Excel:", error);
        showToast(
          "error",
          "Erro na Exportação",
          "Falha ao gerar a planilha Excel. Tente novamente.",
        );
      } finally {
        LoadingManager.hide();
      }
    };

    const setupEventListeners = () => {
      elements.timerToggle.addEventListener("click", () => {
        state.isTimerRunning ? pauseTimer() : startTimer();
      });
      elements.timerReset.addEventListener("click", resetTimer);

      elements.btnShowShortcuts.addEventListener("click", () => {
        elements.keyboardShortcuts.classList.toggle("visible");
      });

      setupFixableField(
        elements.conferente,
        elements.btnFixarConferente,
        elements.btnTrocarConferente,
        STORAGE_KEYS.fixedConferente,
      );
      setupFixableField(
        elements.convenio,
        elements.btnFixarConvenio,
        elements.btnTrocarConvenio,
        STORAGE_KEYS.fixedConvenio,
      );

      elements.btnAdicionar.addEventListener("click", adicionarProtocolo);
      elements.numProtocolo.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          adicionarProtocolo();
        }
      });

      elements.tabelaCorpo.addEventListener("click", (e) => {
        const button = e.target.closest("button[data-action]");
        if (!button) return;

        const action = button.dataset.action;
        const index = parseInt(button.dataset.index, 10);

        switch (action) {
          case "conference":
            window.protonActions.conferirProtocolo(index);
            break;
          case "edit":
            window.protonActions.editarProtocolo(index);
            break;
          case "delete":
            window.protonActions.removerProtocolo(index);
            break;
        }
      });

      elements.tabelaCorpo.addEventListener("change", (e) => {
        if (e.target.classList.contains("row-checkbox")) {
          const protocoloId = e.target.dataset.protocolo;
          toggleSelection(protocoloId, e.target.checked);
        }
      });

      elements.btnAbrirModalLote.addEventListener("click", () => {
        elements.modalLote.style.display = "block";
        elements.modalLote.setAttribute("aria-hidden", "false");
        elements.listaProtocolosLote.focus();
      });

      elements.fecharModal.addEventListener("click", () => {
        elements.modalLote.style.display = "none";
        elements.modalLote.setAttribute("aria-hidden", "true");
      });

      elements.fecharModalConferencia.addEventListener("click", () => {
        elements.modalConferencia.style.display = "none";
        elements.modalConferencia.setAttribute("aria-hidden", "true");
      });

      document
        .getElementById("btnCancelarLote")
        .addEventListener("click", () => {
          closeModal(elements.modalLote);
        });

      window.addEventListener("click", (e) => {
        if (e.target === elements.modalLote) {
          elements.modalLote.style.display = "none";
          elements.modalLote.setAttribute("aria-hidden", "true");
        }
        if (e.target === elements.modalConferencia) {
          elements.modalConferencia.style.display = "none";
          elements.modalConferencia.setAttribute("aria-hidden", "true");
        }
      });

      elements.btnConfirmarLote.addEventListener("click", () => {
        const convenio = elements.convenio.value;
        const dataRecebimento = elements.dataRecebimento.value;

        if (!convenio || !dataRecebimento) {
          showToast(
            "warning",
            "Campos Obrigatórios",
            "Defina o convênio e a data de referência antes de adicionar o lote.",
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
            "Digite pelo menos um protocolo na lista.",
          );
          return;
        }

        let adicionados = 0;
        let erros = 0;

        protocolos.forEach((p) => {
          const validacao = validarProtocolo(p);
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

          salvarDados();
          aplicarFiltros();

          let message = `${adicionados} protocolos adicionados com sucesso.`;
          if (erros > 0) {
            message += ` ${erros} protocolos foram ignorados por serem inválidos.`;
          }

          showToast("success", "Lote Processado", message);
          addActivity(
            "add",
            `Lote de ${adicionados} protocolos adicionado`,
            `Convênio: ${convenio}`,
          );
        } else {
          showToast(
            "error",
            "Nenhum Protocolo Válido",
            "Todos os protocolos da lista são inválidos ou já existem.",
          );
        }
      });

      elements.searchInput.addEventListener("input", aplicarFiltros);
      elements.filterStatus.addEventListener("change", aplicarFiltros);
      elements.filterConvenio.addEventListener("change", aplicarFiltros);
      elements.filterDate.addEventListener("change", aplicarFiltros);

      elements.btnClearSearch.addEventListener("click", () => {
        elements.searchInput.value = "";
        aplicarFiltros();
      });

      elements.btnClearFilters.addEventListener("click", () => {
        elements.searchInput.value = "";
        elements.filterStatus.value = "";
        elements.filterConvenio.value = "";
        elements.filterDate.value = "";
        aplicarFiltros();
        showToast("info", "Filtros Limpos", "Exibindo todos os registros.");
      });

      elements.btnGerarExcel.addEventListener("click", gerarExcel);

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
              timerSeconds: localStorage.getItem(STORAGE_KEYS.timerSeconds),
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

          showToast(
            "success",
            "Backup Criado",
            "Arquivo de backup foi gerado e baixado.",
          );
          addActivity(
            "backup",
            "Backup de dados criado",
            `${state.baseDeDados.length} registros`,
          );
        } catch (error) {
          console.error("Erro ao criar backup:", error);
          showToast(
            "error",
            "Erro no Backup",
            "Falha ao criar o arquivo de backup.",
          );
        }
      });

      elements.btnRestore.addEventListener("click", () => {
        elements.fileRestore.click();
      });

      elements.fileRestore.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const backup = JSON.parse(ev.target.result);

            if (!backup.versao || !backup.dados) {
              showToast(
                "error",
                "Arquivo Inválido",
                "O arquivo de backup está corrompido ou é inválido.",
              );
              return;
            }

            if (
              confirm(
                "Restaurar backup?\n\nTodos os dados atuais serão substituídos pelos dados do backup.\n\nEsta ação não pode ser desfeita.",
              )
            ) {
              state.baseDeDados = backup.dados || [];
              state.atividades = backup.atividades || [];

              if (backup.configuracoes) {
                if (backup.configuracoes.conferente) {
                  localStorage.setItem(
                    STORAGE_KEYS.fixedConferente,
                    backup.configuracoes.conferente,
                  );
                }
                if (backup.configuracoes.convenio) {
                  localStorage.setItem(
                    STORAGE_KEYS.fixedConvenio,
                    backup.configuracoes.convenio,
                  );
                }
                if (backup.configuracoes.tema) {
                  localStorage.setItem("theme", backup.configuracoes.tema);
                }
                if (backup.configuracoes.timerSeconds) {
                  localStorage.setItem(
                    STORAGE_KEYS.timerSeconds,
                    backup.configuracoes.timerSeconds,
                  );
                  state.timerSeconds = parseInt(
                    backup.configuracoes.timerSeconds,
                  );
                }
              }

              salvarDados();
              aplicarFiltros();

              showToast(
                "success",
                "Backup Restaurado",
                "Dados foram restaurados com sucesso! A página será recarregada.",
              );
              addActivity(
                "restore",
                "Backup restaurado",
                `${state.baseDeDados.length} registros`,
              );

              setTimeout(() => {
                location.reload();
              }, 2000);
            }
          } catch (error) {
            console.error("Erro ao processar backup:", error);
            showToast(
              "error",
              "Erro no Backup",
              "Falha ao processar o arquivo de backup.",
            );
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

        if (!isVisible) {
          renderActivities();
        }
      });

      elements.btnLimpar.addEventListener("click", () => {
        if (
          confirm(
            "ATENÇÃO!\n\nEsta ação irá apagar TODOS os protocolos e dados do sistema.\n\nEsta ação NÃO PODE ser desfeita.\n\nDeseja realmente continuar?",
          )
        ) {
          if (
            confirm(
              "Última confirmação:\n\nTodos os dados serão perdidos permanentemente.\n\nTem certeza absoluta?",
            )
          ) {
            state.baseDeDados = [];
            state.atividades = [];
            state.dadosFiltrados = [];

            salvarDados();
            aplicarFiltros();

            showToast(
              "success",
              "Dados Limpos",
              "Todos os dados foram removidos do sistema.",
            );
            addActivity("clear", "Todos os dados foram limpos");
          }
        }
      });

      document
        .getElementById("selectAllCheckbox")
        .addEventListener("change", (e) => {
          const isChecked = e.target.checked;
          state.dadosFiltrados.forEach((item) => {
            toggleSelection(item.protocolo, isChecked);
            const cb = document.querySelector(
              `.row-checkbox[data-protocolo="${item.protocolo}"]`,
            );
            if (cb) cb.checked = isChecked;
          });
        });

      document
        .getElementById("btnBulkConference")
        .addEventListener("click", () => {
          window.protonActions.conferirSelecionados();
        });

      document.addEventListener("keydown", (e) => {
        if (document.querySelector('.modal[style*="display: block"]')) return;

        if (
          e.ctrlKey &&
          document.getElementById("tab-proton").classList.contains("active")
        ) {
          switch (e.key.toLowerCase()) {
            case "a":
              e.preventDefault();
              elements.numProtocolo.focus();
              break;
            case "f":
              e.preventDefault();
              elements.searchInput.focus();
              break;
            case "e":
              e.preventDefault();
              elements.btnGerarExcel.click();
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
      setupSorting();
      setupEventListeners();
      updateTimerDisplay();
      aplicarFiltros();
      clearSelection();

      if (localStorage.getItem(STORAGE_KEYS.timerRunning) === "true") {
        startTimer();
      }

      window.addEventListener("beforeunload", () => {
        localStorage.setItem(STORAGE_KEYS.timerRunning, state.isTimerRunning);
      });
    };

    init();

    return {
      atualizarDashboard,
      aplicarFiltros,
      state,
    };
  };

  // Módulo Contador
  const contadorApp = () => {
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

    const STORAGE_KEYS = {
      ambulatorio: "contador_ambulatorio_v1",
      internacao: "contador_internacao_v1",
    };

    let state = {
      ambulatorioCount:
        parseInt(localStorage.getItem(STORAGE_KEYS.ambulatorio)) || 0,
      internacaoCount:
        parseInt(localStorage.getItem(STORAGE_KEYS.internacao)) || 0,
      chart: null,
    };

    const saveState = () => {
      try {
        localStorage.setItem(STORAGE_KEYS.ambulatorio, state.ambulatorioCount);
        localStorage.setItem(STORAGE_KEYS.internacao, state.internacaoCount);
      } catch (error) {
        console.error("Erro ao salvar estado do contador:", error);
      }
    };

    const updateDisplay = () => {
      const total = state.ambulatorioCount + state.internacaoCount;

      elements.ambulatorioCount.textContent = state.ambulatorioCount;
      elements.internacaoCount.textContent = state.internacaoCount;
      elements.totalCount.textContent = total;

      elements.ambulatorioCount.setAttribute(
        "aria-label",
        `Contagem ambulatório: ${state.ambulatorioCount}`,
      );
      elements.internacaoCount.setAttribute(
        "aria-label",
        `Contagem internação: ${state.internacaoCount}`,
      );
      elements.totalCount.setAttribute(
        "aria-label",
        `Contagem total: ${total}`,
      );

      updateChart();
      saveState();
    };

    const whiteBackgroundPlugin = {
      id: "whiteBackground",
      beforeDraw: (chart) => {
        if (
          chart.options.plugins.whiteBackground &&
          chart.options.plugins.whiteBackground.enabled
        ) {
          const ctx = chart.ctx;
          ctx.save();
          ctx.globalCompositeOperation = "destination-over";
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        }
      },
    };

    const updateChart = (forPdf = false) => {
      if (state.chart) {
        try {
          state.chart.destroy();
        } catch (e) {
          console.warn("Aviso ao destruir gráfico anterior:", e);
        }
      }

      const containerColor = getCssVariable("--cor-container");
      const ambulatorioColor = getCssVariable("--cor-ambulatório");
      const internacaoColor = getCssVariable("--cor-internação");

      const isDarkMode =
        document.documentElement.classList.contains("dark-mode");
      const legendColor = forPdf
        ? "#000000"
        : isDarkMode
          ? "#f1f5f9"
          : "#1e293b";

      state.chart = new Chart(elements.chartCanvas, {
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

    const themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          setTimeout(() => {
            updateChart();
          }, 50);
        }
      });
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const generatePDF = async () => {
      try {
        LoadingManager.show("Gerando relatório PDF...");

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;

        pdf.setFontSize(20);
        pdf.setFont(undefined, "bold");
        pdf.text("RELATÓRIO DE DIGITALIZAÇÃO", pageWidth / 2, 30, {
          align: "center",
        });

        pdf.setFontSize(12);
        pdf.setFont(undefined, "normal");
        const now = new Date();
        const dateStr = now.toLocaleDateString("pt-BR");
        const timeStr = now.toLocaleTimeString("pt-BR");
        pdf.text(`Data: ${dateStr} - Hora: ${timeStr}`, margin, 50);

        const total = state.ambulatorioCount + state.internacaoCount;

        pdf.setFontSize(14);
        pdf.setFont(undefined, "bold");
        pdf.text("RESUMO DA CONTAGEM:", margin, 70);

        pdf.setFont(undefined, "normal");
        pdf.text(`Ambulatório: ${state.ambulatorioCount}`, margin + 10, 85);
        pdf.text(`Internação: ${state.internacaoCount}`, margin + 10, 100);

        pdf.setFont(undefined, "bold");
        pdf.text(`TOTAL: ${total}`, margin + 10, 120);

        if (total > 0) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = 400;
          tempCanvas.height = 400;
          const tempCtx = tempCanvas.getContext("2d");

          const ambulatorioColorPDF = getCssVariable("--cor-ambulatório");
          const internacaoColorPDF = getCssVariable("--cor-internação");
          const tempChart = new Chart(tempCtx, {
            type: "doughnut",
            data: {
              labels: ["Ambulatório", "Internação"],
              datasets: [
                {
                  label: "Quantidade",
                  data: [state.ambulatorioCount, state.internacaoCount],
                  backgroundColor: [ambulatorioColorPDF, internacaoColorPDF],
                  borderColor: "#ffffff",
                  borderWidth: 3,
                },
              ],
            },
            options: {
              responsive: false,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    color: "#000000",
                    padding: 20,
                    usePointStyle: true,
                    font: {
                      size: 16,
                      weight: "bold",
                    },
                  },
                },
                whiteBackground: {
                  enabled: true,
                },
              },
              elements: {
                arc: {
                  borderWidth: 3,
                },
              },
            },
            plugins: [whiteBackgroundPlugin],
          });

          await new Promise((resolve) => setTimeout(resolve, 500));

          const chartImage = tempCanvas.toDataURL("image/png", 1.0);
          const imgWidth = 100;
          const imgHeight = 100;
          const imgX = (pageWidth - imgWidth) / 2;
          const imgY = 140;

          pdf.addImage(chartImage, "PNG", imgX, imgY, imgWidth, imgHeight);

          tempChart.destroy();
        }

        pdf.setFontSize(10);
        pdf.setFont(undefined, "italic");
        pdf.text(
          "Gerado por PROTON v1.4 - Sistema de Controle de Protocolos",
          pageWidth / 2,
          pageHeight - 20,
          { align: "center" },
        );

        pdf.save(`relatorio-digitalizacao-${dateStr.replace(/\//g, "-")}.pdf`);

        showToast(
          "success",
          "PDF Gerado",
          "Relatório foi gerado e baixado com sucesso!",
        );
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        showToast("error", "Erro no PDF", "Falha ao gerar o relatório PDF.");
      } finally {
        LoadingManager.hide();
      }
    };

    const resetCount = () => {
      if (
        confirm(
          "Tem certeza que deseja zerar todas as contagens?\n\nEsta ação não pode ser desfeita.",
        )
      ) {
        state.ambulatorioCount = 0;
        state.internacaoCount = 0;
        updateDisplay();
        showToast(
          "info",
          "Contagem Zerada",
          "Todas as contagens foram zeradas.",
        );
      }
    };

    const setupEventListeners = () => {
      elements.addAmbulatorioBtn.addEventListener("click", () => {
        state.ambulatorioCount++;
        updateDisplay();
      });

      elements.removeAmbulatorioBtn.addEventListener("click", () => {
        if (state.ambulatorioCount > 0) {
          state.ambulatorioCount--;
          updateDisplay();
        }
      });

      elements.addInternacaoBtn.addEventListener("click", () => {
        state.internacaoCount++;
        updateDisplay();
      });

      elements.removeInternacaoBtn.addEventListener("click", () => {
        if (state.internacaoCount > 0) {
          state.internacaoCount--;
          updateDisplay();
        }
      });

      elements.resetBtn.addEventListener("click", resetCount);
      elements.pdfBtn.addEventListener("click", generatePDF);

      document.addEventListener("keydown", (e) => {
        if (document.querySelector('.modal[style*="display: block"]')) return;

        if (
          e.altKey &&
          document.getElementById("tab-contador").classList.contains("active")
        ) {
          switch (e.key.toLowerCase()) {
            case "a":
              e.preventDefault();
              elements.addAmbulatorioBtn.click();
              break;
            case "i":
              e.preventDefault();
              elements.addInternacaoBtn.click();
              break;
            case "r":
              e.preventDefault();
              resetCount();
              break;
          }
        }
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  } else {
    initializeApp();
  }
})();
// === EASTER EGG: KONAMI CODE (MATRIX MODE) ===
    const setupEasterEgg = () => {
        const konamiCode = [
            'ArrowUp', 'ArrowUp', 
            'ArrowDown', 'ArrowDown', 
            'ArrowLeft', 'ArrowRight', 
            'ArrowLeft', 'ArrowRight', 
            'b', 'a'
        ];
        
        let cursor = 0;

        document.addEventListener('keydown', (e) => {
            // Reinicia se a tecla não for a esperada na sequência
            cursor = (e.key === konamiCode[cursor]) ? cursor + 1 : 0;

            // Se completou a sequência
            if (cursor === konamiCode.length) {
                activateMatrixMode();
                cursor = 0; // Reseta para poder fazer de novo
            }
        });
    };

    const activateMatrixMode = () => {
        document.body.classList.toggle('matrix-mode');
        
        const isMatrix = document.body.classList.contains('matrix-mode');
        const msg = isMatrix ? 'Bem-vindo à Matrix, Neo.' : 'Desconectando da Matrix...';
        
        // Usa o seu sistema de Toast existente
        const toastContainer = document.getElementById('toastContainer');
        if (toastContainer) {
            // Cria um toast manual "hackeado"
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.style.borderLeft = '4px solid #0f0';
            toast.style.background = '#000';
            toast.style.color = '#0f0';
            toast.style.fontFamily = 'monospace';
            toast.innerHTML = `
                <div class="toast-icon"><i class="fas fa-user-secret"></i></div>
                <div class="toast-content">
                    <div class="toast-title" style="color: #0f0">SYSTEM_OVERRIDE</div>
                    <div class="toast-message" style="color: #0f0">${msg}</div>
                </div>
            `;
            toastContainer.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);
        }
    };

    // Chama a função para ficar escutando as teclas
    setupEasterEgg();