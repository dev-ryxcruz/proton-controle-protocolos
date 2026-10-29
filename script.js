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

  // Gerenciador de Símbolos (Criação Segura de Nós DOM - Prevenção de XSS)
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
    // Criação segura de nós DOM para célula de protocolo com símbolos indicadores (Prevenção XSS)
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
      const indicatorMap = {
        Ambulatorio: { class: "amb", letter: "A", label: "Ambulatório" },
        CDI: { class: "cdi", letter: "C", label: "CDI" },
        UE: { class: "ue", letter: "U", label: "UE" },
        Internacao: { class: "int", letter: "I", label: "Internação" },
      };

      Object.entries(indicatorMap)
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

  // === MÓDULO: UX Enhancements (Ripple, Animações, Scroll-to-top, Confirm Modal) ===
  const setupUX = () => {
      // 1. Efeito Ripple em todos os botões
      document.addEventListener('click', (e) => {
          const btn = e.target.closest('button');
          if (!btn || btn.classList.contains('scroll-to-top') || btn.classList.contains('sort-btn')) return;

          const ripple = document.createElement('span');
          ripple.classList.add('ripple');
          const rect = btn.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          ripple.style.width  = ripple.style.height = `${size}px`;
          ripple.style.left   = `${e.clientX - rect.left  - size / 2}px`;
          ripple.style.top    = `${e.clientY - rect.top   - size / 2}px`;
          btn.appendChild(ripple);
          ripple.addEventListener('animationend', () => ripple.remove());
      });

      // 2. IntersectionObserver para animações de entrada
      const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry, i) => {
              if (entry.isIntersecting) {
                  setTimeout(() => {
                      entry.target.classList.add('animate-in');
                  }, i * 80);
                  observer.unobserve(entry.target);
              }
          });
      }, { threshold: 0.08 });

      document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));

      // 3. Botão Scroll to Top
      const scrollBtn = document.getElementById('scrollToTopBtn');
      if (scrollBtn) {
          window.addEventListener('scroll', () => {
              scrollBtn.classList.toggle('visible', window.scrollY > 300);
          }, { passive: true });

          scrollBtn.addEventListener('click', () => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
          });
      }
  };

  // === MÓDULO: Modal de Confirmação Customizado ===
  const showConfirmModal = (title, message) => {
      return new Promise((resolve) => {
          const modal   = document.getElementById('confirmModal');
          const titleEl = document.getElementById('confirmModalTitle');
          const msgEl   = document.getElementById('confirmModalMessage');
          const btnOk   = document.getElementById('confirmModalOk');
          const btnCancel = document.getElementById('confirmModalCancel');

          if (!modal) { resolve(window.confirm(message)); return; }

          titleEl.textContent = title;
          msgEl.textContent   = message;
          modal.style.display = 'block';
          modal.setAttribute('aria-hidden', 'false');
          btnOk.focus();

          const cleanup = (result) => {
              modal.style.display = 'none';
              modal.setAttribute('aria-hidden', 'true');
              btnOk.removeEventListener('click', onOk);
              btnCancel.removeEventListener('click', onCancel);
              modal.removeEventListener('click', onOverlay);
              resolve(result);
          };

          const onOk      = () => cleanup(true);
          const onCancel  = () => cleanup(false);
          const onOverlay = (e) => { if (e.target === modal) cleanup(false); };

          btnOk.addEventListener('click', onOk);
          btnCancel.addEventListener('click', onCancel);
          modal.addEventListener('click', onOverlay);
      });
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

        // Inicializa os aprimoramentos de UX
        setupUX();

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
            { id: 'import-excel', icon: 'fa-file-import', name: 'Importar Planilha Excel (.xlsx)', action: () => document.getElementById('btnImportarExcel')?.click() },
            { id: 'novo-turno', icon: 'fa-rotate', name: 'Limpar Sessão / Novo Turno', action: () => document.getElementById('btnNovoTurno')?.click() },
            { id: 'print-guide', icon: 'fa-print', name: 'Imprimir Guia Física (Ctrl + P)', action: () => window.print() },
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
      timerDisplay: document.getElementById("timerDisplay"),
      timerToggle: document.getElementById("timerToggle"),
      timerIcon: document.getElementById("timerIcon"),
      timerReset: document.getElementById("timerReset"),
      btnShowShortcuts: document.getElementById("btnShowShortcuts"),
      keyboardShortcuts: document.getElementById("keyboardShortcuts"),
    };

    const STORAGE_KEYS = {
      database: "documentosDB_pro_v1",
      session: "proton_session_protocols",
      activities: "atividades_pro_v1",
      timerSeconds: "timer_seconds",
      timerRunning: "timer_was_running",
      fieldPins: "proton_field_pins_v1",
      pinnedValues: "proton_pinned_values_v1",
      fixedConferente: "conferenteFixo_pro_v1",
      fixedConvenio: "convenioFixo_pro_v1",
    };

    // Flag de prevenção de perda de dados acidental (beforeunload)
    let hasUnsavedChanges = false;

    // Recupera protocolos com espelhamento em sessionStorage (F5 seguro) com fallback para localStorage
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
      editingProtocol: null, // Guarda o número do protocolo em edição inline
      pins: JSON.parse(localStorage.getItem(STORAGE_KEYS.fieldPins)) || {
        conferente: false,
        convenio: false,
        data: false,
      },
    };

    state.dadosFiltrados = [...state.baseDeDados];

    const formatarDataBR = (dataString) => {
      if (!dataString || !dataString.includes("-")) return "";
      const [ano, mes, dia] = dataString.split("-");
      return `${dia}/${mes}/${ano}`;
    };

    // Sincronização e espelhamento em sessionStorage e localStorage
    const salvarDados = () => {
      try {
        // Espelhamento na sessão (para recarregamentos acidentais F5)
        sessionStorage.setItem(
          STORAGE_KEYS.session,
          JSON.stringify(state.baseDeDados)
        );
        // Persistência local permanente
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

    // === MELHORIA: Toast de Desfazer (Undo) - 5 segundos de duração ===
    const showUndoToast = (message, onUndo, duration = 5000) => {
      const toastContainer = document.getElementById("toastContainer");
      const toast = document.createElement("div");
      toast.className = "toast toast-undo";

      const safeMessage = SecurityUtils.escapeHTML(message);

      toast.innerHTML = `
                <div class="toast-icon"><i class="fas fa-trash-restore" aria-hidden="true"></i></div>
                <div class="toast-content">
                    <div class="toast-title">Ação Realizada</div>
                    <div class="toast-message">${safeMessage}</div>
                </div>
                <button class="btn-undo-action" aria-label="Desfazer ação">Desfazer</button>
                <button class="toast-close" aria-label="Fechar notificação">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            `;

      const btnUndo  = toast.querySelector(".btn-undo-action");
      const btnClose = toast.querySelector(".toast-close");
      let isUndone = false;

      let autoRemoveTimer = setTimeout(() => {
        if (!isUndone && toast.parentNode) removeToast(toast);
      }, duration);

      btnUndo.addEventListener("click", () => {
        isUndone = true;
        clearTimeout(autoRemoveTimer);
        onUndo();
        removeToast(toast);
      });

      btnClose.addEventListener("click", () => {
        clearTimeout(autoRemoveTimer);
        removeToast(toast);
      });

      toastContainer.appendChild(toast);
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

    const resetTimer = async () => {
      if (state.isTimerRunning) pauseTimer();

      const confirmed = await showConfirmModal(
        'Reiniciar Cronômetro',
        'Tem certeza que deseja zerar o cronômetro? Esta ação não pode ser desfeita.'
      );

      if (confirmed) {
        state.timerSeconds = 0;
        localStorage.removeItem(STORAGE_KEYS.timerSeconds);
        updateTimerDisplay();
        showToast('info', 'Cronômetro Reiniciado', 'O tempo foi zerado.');
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

    // Atualiza o badge de pendentes na tab
    const updatePendingBadge = (pendentes) => {
      const badge = document.getElementById('tabBadgePendentes');
      if (!badge) return;
      if (pendentes > 0) {
        badge.textContent = pendentes > 99 ? '99+' : String(pendentes);
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    };

    const atualizarDashboard = () => {
      const total = state.dadosFiltrados.length;
      const processados = state.dadosFiltrados.filter(
        (item) => item.status === 'Baixado',
      ).length;
      const pendentes = total - processados;
      const taxa = total > 0 ? Math.round((processados / total) * 100) : 0;

      elements.statTotal.textContent = total;
      elements.statProcessados.textContent = processados;
      elements.statPendentes.textContent = pendentes;
      elements.statTaxa.textContent = `${taxa}%`;

      elements.progressBar.style.width = `${taxa}%`;
      elements.progressBar.textContent = `${taxa}%`;
      elements.progressBar.setAttribute('aria-valuenow', taxa);

      // Atualiza o badge na tab
      const pendentesTotal = state.baseDeDados.filter(item => item.status === 'Pendente').length;
      updatePendingBadge(pendentesTotal);
    };

    // Atualiza opções do dropdown de convênios dinamicamente
    const atualizarFiltroConvenio = () => {
      if (!elements.filterConvenio) return;
      const convenios = [
        ...new Set(state.baseDeDados.map((item) => item.convenio).filter(Boolean)),
      ];
      const currentValue = elements.filterConvenio.value;

      elements.filterConvenio.innerHTML =
        '<option value="">Todos os Convênios</option>';
      convenios.forEach((convenio) => {
        const option = document.createElement('option');
        option.value = convenio;
        option.textContent = convenio;
        elements.filterConvenio.appendChild(option);
      });

      elements.filterConvenio.value = currentValue;
    };

    // Atualiza metadados na área de guia física de impressão (@media print)
    const atualizarDadosImpressao = () => {
      if (elements.printDataEmissao) {
        elements.printDataEmissao.textContent = new Date().toLocaleDateString("pt-BR");
      }
      if (elements.printConferente) {
        elements.printConferente.textContent = elements.conferente?.value || "Não informado";
      }
      if (elements.printConvenioRef) {
        elements.printConvenioRef.textContent = elements.convenio?.value || "Geral";
      }
      if (elements.printTotalProtocolos) {
        elements.printTotalProtocolos.textContent = String(state.baseDeDados.length);
      }
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

    // Gestão de Gráficos: Atualização eficiente via chart.update() sem destruir instâncias do zero
    const atualizarGrafico = () => {
      if (!elements.chartCanvas) return;

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
          state.tipoDocumentoChart.options.plugins.legend.labels.color = themeColors.Texto;
        }
        state.tipoDocumentoChart.update();
      } else if (data.length > 0) {
        // Inicializa nova instância do gráfico caso não exista
        state.tipoDocumentoChart = new Chart(elements.chartCanvas, {
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

    // Renderização Segura da Tabela (Prevenção de XSS e Suporte a Edição Inline)
    const renderizarTabela = () => {
      if (!elements.tabelaCorpo) return;

      // Limpeza segura sem innerHTML
      elements.tabelaCorpo.textContent = "";

      if (elements.mensagemVazia) {
        elements.mensagemVazia.style.display =
          state.dadosFiltrados.length === 0 ? "block" : "none";
      }

      const convenioColor = {
        Unimed: "#3b82f6",
        Intercâmbio: "#ef4444",
        "Convênio Externo": "#f59e0b",
        Particular: "#10b981",
        Internação: "#8b5cf6",
      };

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
          const convList = ["Unimed", "Intercâmbio", "Convênio Externo", "Particular", "Internação"];
          if (item.convenio && !convList.includes(item.convenio)) convList.push(item.convenio);
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
          sIcon.className = item.status === "Baixado" ? "fas fa-check-circle" : "fas fa-clock";
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

        // --- MODO: LINHA NORMAL (NÃO-EDIÇÃO) ---
        // 1. Checkbox seguro
        const tdCheck = document.createElement("td");
        tdCheck.className = "checkbox-cell";
        tdCheck.setAttribute("data-label", "Selecionar");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "row-checkbox";
        checkbox.dataset.protocolo = item.protocolo;
        checkbox.checked = isSelected;
        checkbox.setAttribute("aria-label", `Selecionar protocolo ${item.protocolo}`);
        tdCheck.appendChild(checkbox);
        tr.appendChild(tdCheck);

        // 2. Protocolo com símbolos indicadores (via DOM nodes seguros)
        const tdProto = document.createElement("td");
        tdProto.setAttribute("data-label", "Protocolo");
        tdProto.appendChild(SymbolManager.createProtocolCellElement(item));
        tr.appendChild(tdProto);

        // 3. Convênio com badge
        const tdConv = document.createElement("td");
        tdConv.setAttribute("data-label", "Convênio");
        const convBadge = document.createElement("span");
        convBadge.className = "badge-convenio";
        convBadge.style.backgroundColor = convenioColor[item.convenio] || "#64748b";
        convBadge.textContent = item.convenio;
        tdConv.appendChild(convBadge);
        tr.appendChild(tdConv);

        // 4. Status
        const tdStatus = document.createElement("td");
        tdStatus.className = "status-display";
        tdStatus.setAttribute("data-label", "Status");
        const statusIcon = document.createElement("i");
        statusIcon.className = item.status === "Baixado" ? "fas fa-check-circle" : "fas fa-clock";
        tdStatus.appendChild(statusIcon);
        tdStatus.appendChild(document.createTextNode(" " + item.status));
        tr.appendChild(tdStatus);

        // 5. Data Referência
        const tdDate = document.createElement("td");
        tdDate.setAttribute("data-label", "Data Referência");
        tdDate.textContent = formatarDataBR(item.dataRecebimento);
        tr.appendChild(tdDate);

        // 6. Botões de Ação
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
          appendBtn("edit-conferencia", "fa-sliders-h", "btn-info", "Editar quantidades/obs");
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
            state.selectedItems.includes(item.protocolo),
          );
      }
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
          valueA = parseInt(valueA, 10);
          valueB = parseInt(valueB, 10);
        }

        if (valueA < valueB) return state.sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return state.sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    };

    // Filtragem síncrona interna
    const aplicarFiltrosInterno = () => {
      const searchTerm = elements.searchInput ? elements.searchInput.value.toLowerCase().trim() : "";
      const statusFilter = elements.filterStatus ? elements.filterStatus.value : "";
      const convenioFilter = elements.filterConvenio ? elements.filterConvenio.value : "";
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

    // Aplicação de filtros com atualização de interface
    const aplicarFiltros = () => {
      aplicarFiltrosInterno();
      if (state.sortColumn) sortData();
      renderizarTabela();
      atualizarDashboard();
      updateBulkActionsBar();
    };

    // Debounce de 300ms para manter a fluidez na digitação do campo de busca
    const debouncedAplicarFiltros = PerformanceUtils.debounce(aplicarFiltros, 300);

    // GESTÃO DE ESTADO CENTRALIZADA (syncApp)
    // Sincroniza em cadeia: sessionStorage/localStorage, tabela, contadores e gráfico Chart.js
    const syncApp = (options = { save: true }) => {
      if (options.save) {
        salvarDados();
      }
      aplicarFiltrosInterno();
      if (state.sortColumn) {
        sortData();
      }
      renderizarTabela();
      atualizarDashboard();
      atualizarGrafico();
      atualizarFiltroConvenio();
      atualizarDadosImpressao();
      updateBulkActionsBar();
    };

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

        hasUnsavedChanges = true;
        syncApp();

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

        hasUnsavedChanges = true;
        syncApp();
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

            hasUnsavedChanges = true;
            syncApp();

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

      // === MELHORIA: Remover Protocolo com Toast de Desfazer de 5s (sem confirm nativo bloqueante) ===
      removerProtocolo: (indexOrProto) => {
        let index = -1;
        if (typeof indexOrProto === "number") {
          index = indexOrProto;
        } else {
          index = state.baseDeDados.findIndex((p) => p.protocolo === indexOrProto);
        }
        const item = state.baseDeDados[index];
        if (!item) return;

        const itemRemovido = { ...item };
        const indexOriginal = index;

        // Exclui imediatamente sem confirm nativo
        state.baseDeDados.splice(index, 1);
        const selIdx = state.selectedItems.indexOf(item.protocolo);
        if (selIdx !== -1) state.selectedItems.splice(selIdx, 1);

        hasUnsavedChanges = state.baseDeDados.length > 0;
        syncApp();

        addActivity("delete", `Protocolo ${item.protocolo} removido`);

        // Toast de 5 segundos com opção "Desfazer"
        showUndoToast(`Protocolo ${item.protocolo} removido.`, () => {
          state.baseDeDados.splice(indexOriginal, 0, itemRemovido);
          hasUnsavedChanges = true;
          syncApp();
          showToast(
            "success",
            "Restaurado",
            `Protocolo ${item.protocolo} recuperado com sucesso.`,
          );
          addActivity("restore", `Protocolo ${item.protocolo} restaurado via desfazer`);
        }, 5000);
      },
    };

    // Edição inline direta na tabela com validação rápida e foco
    const salvarEdicaoInline = (protocoloOriginal) => {
      const row = elements.tabelaCorpo?.querySelector(`tr[data-protocolo="${protocoloOriginal}"]`);
      if (!row) return;

      const inputProto = row.querySelector(".edit-proto-input");
      const selectConv = row.querySelector(".edit-conv-select");
      const inputDate = row.querySelector(".edit-date-input");

      const novoProtocolo = inputProto ? inputProto.value.trim() : protocoloOriginal;
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
      if (novoProtocolo !== protocoloOriginal && state.baseDeDados.some((p) => p.protocolo === novoProtocolo)) {
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

        hasUnsavedChanges = true;
        state.editingProtocol = null;
        syncApp();

        showToast("success", "Protocolo Atualizado", `Protocolo ${novoProtocolo} atualizado com sucesso!`);
        addActivity("edit", `Protocolo editado inline: ${protocoloOriginal} → ${novoProtocolo}`);
      }
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

    // Sistema de Pin/Lock para fixar campos recorrentes (Conferente, Convênio e Data)
    const setupPinField = (btnEl, inputEl, pinKey) => {
      if (!btnEl || !inputEl) return;

      const updatePinUI = (isPinned) => {
        btnEl.classList.toggle("is-pinned", isPinned);
        btnEl.setAttribute("aria-pressed", String(isPinned));
        const icon = btnEl.querySelector("i");
        const text = btnEl.querySelector(".pin-text");
        if (icon) icon.className = isPinned ? "fas fa-lock" : "fas fa-unlock";
        if (text) text.textContent = isPinned ? "Fixado" : "Travar";
        inputEl.classList.toggle("input-pinned", isPinned);
      };

      const isPinned = state.pins[pinKey] || false;
      updatePinUI(isPinned);

      if (isPinned) {
        const savedVal = localStorage.getItem(`${STORAGE_KEYS.pinnedValues}_${pinKey}`);
        if (savedVal && !inputEl.value) {
          inputEl.value = savedVal;
        }
      }

      btnEl.addEventListener("click", () => {
        const nextState = !state.pins[pinKey];
        if (nextState && !inputEl.value) {
          showToast("warning", "Campo Vazio", "Preencha o campo antes de fixar o valor.");
          inputEl.focus();
          return;
        }

        state.pins[pinKey] = nextState;
        localStorage.setItem(STORAGE_KEYS.fieldPins, JSON.stringify(state.pins));
        if (nextState) {
          localStorage.setItem(`${STORAGE_KEYS.pinnedValues}_${pinKey}`, inputEl.value);
        } else {
          localStorage.removeItem(`${STORAGE_KEYS.pinnedValues}_${pinKey}`);
        }
        updatePinUI(nextState);

        showToast(
          nextState ? "success" : "info",
          nextState ? "Campo Fixado" : "Campo Liberado",
          nextState ? "O valor permanecerá fixo entre os lançamentos." : "O campo agora é variável."
        );
      });

      inputEl.addEventListener("change", () => {
        if (state.pins[pinKey] && inputEl.value) {
          localStorage.setItem(`${STORAGE_KEYS.pinnedValues}_${pinKey}`, inputEl.value);
        }
      });
    };

    // Submissão Rápida com Foco Automático e Limpeza Seletiva (Keyboard-First)
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
      hasUnsavedChanges = true;

      // Limpa os campos variáveis
      elements.numProtocolo.value = "";
      if (elements.protocoloFeedback) {
        elements.protocoloFeedback.textContent = "";
        elements.protocoloFeedback.className = "input-feedback";
      }

      // Se o convênio não estiver travado (pin), limpa o campo para forçar nova escolha
      if (!state.pins.convenio) {
        elements.convenio.value = "";
      }

      syncApp();

      // Devolve o foco imediatamente para o primeiro campo de digitação (Keyboard-First)
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

    // Exportação Excel com Feedback Visual (Disabled + Spinner) e Atualização de Estado
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
          "Não há protocolos processados (baixados) para exportar.",
        );
        return;
      }

      const btnExcel = elements.btnGerarExcel;
      const originalHTML = btnExcel ? btnExcel.innerHTML : "";
      if (btnExcel) {
        btnExcel.disabled = true;
        btnExcel.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Gerando Planilha...';
      }
      LoadingManager.show("Gerando planilha Excel formatada...");

      try {
        const dataRef =
          formatarDataBR(elements.dataRecebimento.value) ||
          new Date().toLocaleDateString("pt-BR");
        const nomeResp = elements.conferente.value || "Não informado";

        const workbook = new ExcelJS.Workbook();
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
            "Nenhum item com quantidade > 0 foi encontrado.",
          );
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

        // Marca que as alterações foram salvas/exportadas
        hasUnsavedChanges = false;

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
        if (btnExcel) {
          btnExcel.disabled = false;
          btnExcel.innerHTML = originalHTML || '<i class="fas fa-file-excel" aria-hidden="true"></i> Gerar Planilha Excel';
        }
        LoadingManager.hide();
      }
    };

    // Importação Reversa de .xlsx (Lê planilhas geradas pelo Proton e repopula tabela e gráficos)
    const importarExcel = async (file) => {
      if (!file) return;

      LoadingManager.show("Lendo e importando planilha Excel...");

      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
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
                convenio: elements.convenio?.value || "Unimed",
                status: "Baixado",
                dataRecebimento: dataDetectada || elements.dataRecebimento?.value || new Date().toISOString().split("T")[0],
                quantidades: { Ambulatorio: 0, CDI: 0, UE: 0, Internacao: 0 },
                observacoes: (obs && obs !== "OK") ? obs : "",
                dataAdicao: new Date().toISOString(),
                dataConferencia: new Date().toISOString(),
              });
            }

            const item = protocolosImportados.get(numProtocolo);
            item.quantidades[tipo] = (item.quantidades[tipo] || 0) + quantidade;
            if (obs && obs !== "OK" && !item.observacoes.includes(obs)) {
              item.observacoes = item.observacoes ? `${item.observacoes}; ${obs}` : obs;
            }
          });
        });

        if (protocolosImportados.size === 0) {
          showToast("warning", "Planilha Vazia", "Nenhum protocolo válido encontrado na planilha.");
          return;
        }

        if (dataDetectada && elements.dataRecebimento) {
          elements.dataRecebimento.value = dataDetectada;
        }
        if (responsavelDetectado && elements.conferente && !elements.conferente.value) {
          elements.conferente.value = responsavelDetectado;
        }

        let adicionados = 0;
        let atualizados = 0;

        protocolosImportados.forEach((novoItem, numProto) => {
          const itemExistente = state.baseDeDados.find((p) => p.protocolo === numProto);
          if (itemExistente) {
            itemExistente.status = "Baixado";
            itemExistente.quantidades = {
              Ambulatorio: (itemExistente.quantidades?.Ambulatorio || 0) + novoItem.quantidades.Ambulatorio,
              CDI: (itemExistente.quantidades?.CDI || 0) + novoItem.quantidades.CDI,
              UE: (itemExistente.quantidades?.UE || 0) + novoItem.quantidades.UE,
              Internacao: (itemExistente.quantidades?.Internacao || 0) + novoItem.quantidades.Internacao,
            };
            if (novoItem.observacoes) {
              itemExistente.observacoes = itemExistente.observacoes
                ? `${itemExistente.observacoes}; ${novoItem.observacoes}`
                : novoItem.observacoes;
            }
            atualizados++;
          } else {
            state.baseDeDados.push(novoItem);
            adicionados++;
          }
        });

        hasUnsavedChanges = true;
        syncApp();

        showToast(
          "success",
          "Importação Concluída",
          `${adicionados} adicionado(s) e ${atualizados} atualizado(s) com sucesso!`
        );
        addActivity("restore", "Importação reversa de Excel", `${protocolosImportados.size} protocolos processados`);
      } catch (err) {
        console.error("Erro na importação reversa de Excel:", err);
        showToast("error", "Erro ao Importar", "Falha ao processar arquivo .xlsx. Verifique o formato.");
      } finally {
        if (elements.fileImportExcel) elements.fileImportExcel.value = "";
        LoadingManager.hide();
      }
    };

    // Botão Limpar Sessão / Novo Turno
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

        showToast("success", "Novo Turno Iniciado", "A sessão foi limpa e está pronta para novos lançamentos.");
        addActivity("clear", "Novo turno iniciado - sessão de protocolos limpa");
        elements.numProtocolo.focus();
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

      // Inicialização dos botões Pin/Lock de campos recorrentes
      setupPinField(elements.btnPinConferente, elements.conferente, "conferente");
      setupPinField(elements.btnPinConvenio, elements.convenio, "convenio");
      setupPinField(elements.btnPinData, elements.dataRecebimento, "data");

      if (elements.btnFixarConferente) {
        elements.btnFixarConferente.addEventListener("click", () => elements.btnPinConferente?.click());
      }
      if (elements.btnFixarConvenio) {
        elements.btnFixarConvenio.addEventListener("click", () => elements.btnPinConvenio?.click());
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
            renderizarTabela();
            break;
          }
          case "save-inline": {
            salvarEdicaoInline(protocolo);
            break;
          }
          case "cancel-inline": {
            state.editingProtocol = null;
            renderizarTabela();
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
        if (e.target.classList.contains("table-inline-input") || e.target.classList.contains("table-inline-select")) {
          const protocolo = e.target.dataset.protocolo;
          if (e.key === "Enter") {
            e.preventDefault();
            salvarEdicaoInline(protocolo);
          } else if (e.key === "Escape") {
            e.preventDefault();
            state.editingProtocol = null;
            renderizarTabela();
          }
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

          hasUnsavedChanges = true;
          syncApp();

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

      // Filtro com Debounce de 300ms na digitação para manter a fluidez da UI
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

      elements.btnGerarExcel.addEventListener("click", gerarExcel);

      // Listeners de Importação Reversa de Excel (.xlsx) e Limpar Sessão / Novo Turno
      if (elements.btnImportarExcel && elements.fileImportExcel) {
        elements.btnImportarExcel.addEventListener("click", () => {
          elements.fileImportExcel.click();
        });
        elements.fileImportExcel.addEventListener("change", (e) => {
          if (e.target.files && e.target.files[0]) {
            importarExcel(e.target.files[0]);
          }
        });
      }

      if (elements.btnNovoTurno) {
        elements.btnNovoTurno.addEventListener("click", limparSessaoNovoTurno);
      }

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

          showToast(
            "success",
            "Dados Limpos",
            "Todos os dados foram removidos do sistema.",
          );
          addActivity("clear", "Todos os dados foram limpos");
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

    // === MÓDULO: Modo de Digitação Rápida ===
    const setupModoRapido = () => {
      const MODO_RAPIDO_KEY = 'proton_modo_rapido';
      let modoAtivo = localStorage.getItem(MODO_RAPIDO_KEY) === 'true';

      const applyState = () => {
        const btn   = document.getElementById('btnModoRapido');
        const pill  = document.getElementById('modoRapidoPill');
        const label = document.getElementById('modoRapidoLabel');
        const input = elements.numProtocolo;

        if (!btn) return;
        btn.setAttribute('aria-pressed', String(modoAtivo));
        btn.classList.toggle('modo-rapido-ativo', modoAtivo);
        if (label) label.textContent = modoAtivo ? 'Modo Rápido: ON' : 'Modo Rápido';
        if (pill)  pill.style.display = modoAtivo ? 'inline-flex' : 'none';
        if (input) input.classList.toggle('input-modo-rapido', modoAtivo);
      };

      const toggle = () => {
        modoAtivo = !modoAtivo;
        localStorage.setItem(MODO_RAPIDO_KEY, String(modoAtivo));
        applyState();
        showToast(
          modoAtivo ? 'success' : 'info',
          modoAtivo ? '⚡ Modo Rápido Ativado' : 'Modo Rápido Desativado',
          modoAtivo
            ? 'Protocolo será adicionado automaticamente ao digitar 6 dígitos.'
            : 'Clique em Adicionar para incluir protocolos.'
        );
      };

      // Listener no input para auto-adicionar
      elements.numProtocolo.addEventListener('input', () => {
        if (!modoAtivo) return;
        const val = elements.numProtocolo.value.trim();
        if (val.length === 6 && /^\d{6}$/.test(val)) {
          // Pequeno delay visual antes de adicionar
          setTimeout(() => {
            if (elements.numProtocolo.value.trim().length === 6) {
              adicionarProtocolo();
            }
          }, 200);
        }
      });

      const btn = document.getElementById('btnModoRapido');
      if (btn) btn.addEventListener('click', toggle);

      applyState();
    };

    // === MÓDULO: Relatório Diário com Timeline ===
    const setupRelatorio = () => {
      const modalRelatorio       = document.getElementById('modalRelatorio');
      const btnRelatorio         = document.getElementById('btnRelatorio');
      const fecharModalRelatorio = document.getElementById('fecharModalRelatorio');

      if (!modalRelatorio || !btnRelatorio) return;

      let relatorioChart = null;

      const buildChart = () => {
        const today = new Date().toLocaleDateString('pt-BR'); // DD/MM/YYYY

        // Filtra atividades de hoje
        const todayActs = state.atividades.filter(a => {
          return a.timestamp && a.timestamp.startsWith(today);
        });

        // Agrupa por hora
        const buckets = {};
        for (let h = 0; h < 24; h++) buckets[h] = { add: 0, conference: 0 };

        todayActs.forEach(a => {
          const parts = a.timestamp.split(', ');
          if (!parts[1]) return;
          const hour = parseInt(parts[1].split(':')[0]);
          if (isNaN(hour)) return;
          if (a.type === 'add')        buckets[hour].add++;
          if (a.type === 'conference') buckets[hour].conference++;
        });

        const activeHours = Object.keys(buckets).map(Number).filter(h => buckets[h].add + buckets[h].conference > 0);
        // Se não houver dados, mostra range 8–17
        const hours = activeHours.length > 0 ? activeHours : Array.from({length: 10}, (_, i) => i + 8);

        const labels    = hours.map(h => `${String(h).padStart(2,'0')}h`);
        const addData   = hours.map(h => buckets[h].add);
        const confData  = hours.map(h => buckets[h].conference);

        // Calcula stats
        const totalAdd  = todayActs.filter(a => a.type === 'add').length;
        const totalConf = todayActs.filter(a => a.type === 'conference').length;

        const peakHour  = activeHours.length > 0
          ? activeHours.reduce((p, h) => (buckets[h].add + buckets[h].conference) > (buckets[p].add + buckets[p].conference) ? h : p, activeHours[0])
          : null;

        const ritmo = activeHours.length > 0
          ? (todayActs.length / activeHours.length).toFixed(1)
          : '--';

        // Atualiza mini-cards
        document.getElementById('relatorioTotalAdicionados').textContent = totalAdd;
        document.getElementById('relatorioTotalBaixados').textContent    = totalConf;
        document.getElementById('relatorioHoraPico').textContent         = peakHour !== null ? `${String(peakHour).padStart(2,'0')}:00` : '--';
        document.getElementById('relatorioRitmo').textContent            = ritmo;
        document.getElementById('relatorioDataAtual').textContent        = `Dados de hoje — ${today}`;

        // Wrapper
        const wrapper = document.querySelector('.relatorio-chart-wrapper');
        const canvas  = document.getElementById('relatorioTimelineChart');

        // Sem dados
        if (todayActs.length === 0) {
          if (canvas) canvas.style.display = 'none';
          if (wrapper && !wrapper.querySelector('.relatorio-empty')) {
            const empty = document.createElement('div');
            empty.className = 'relatorio-empty';
            empty.innerHTML = '<i class="fas fa-moon"></i><span>Nenhuma atividade registrada hoje.</span><small>Comece adicionando protocolos!</small>';
            wrapper.appendChild(empty);
          }
          return;
        }

        // Remove empty state se existia
        const emptyEl = wrapper && wrapper.querySelector('.relatorio-empty');
        if (emptyEl) emptyEl.remove();
        if (canvas) canvas.style.display = '';

        // Destrói gráfico anterior
        if (relatorioChart) { try { relatorioChart.destroy(); } catch(e) {} }

        const themeColors = getChartColors();

        relatorioChart = new Chart(canvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Adicionados',
                data: addData,
                backgroundColor: 'rgba(102,126,234,0.7)',
                borderColor: '#764ba2',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
              },
              {
                label: 'Baixados',
                data: confData,
                backgroundColor: 'rgba(16,185,129,0.7)',
                borderColor: '#059669',
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
                labels: { color: themeColors.Texto, usePointStyle: true, padding: 16, font: { size: 12 } },
              },
              tooltip: {
                callbacks: {
                  title: items => `Horário: ${items[0].label}`,
                  label: item => ` ${item.dataset.label}: ${item.parsed.y}`,
                },
              },
            },
            scales: {
              x: {
                ticks: { color: themeColors.Texto },
                grid:  { color: 'rgba(128,128,128,0.12)' },
              },
              y: {
                beginAtZero: true,
                ticks: { color: themeColors.Texto, stepSize: 1, precision: 0 },
                grid:  { color: 'rgba(128,128,128,0.12)' },
              },
            },
          },
        });
      };

      // Abre modal
      btnRelatorio.addEventListener('click', () => {
        modalRelatorio.style.display = 'block';
        modalRelatorio.setAttribute('aria-hidden', 'false');
        buildChart();
      });

      // Fecha modal
      if (fecharModalRelatorio) {
        fecharModalRelatorio.addEventListener('click', () => {
          modalRelatorio.style.display = 'none';
          modalRelatorio.setAttribute('aria-hidden', 'true');
        });
      }

      window.addEventListener('click', e => {
        if (e.target === modalRelatorio) {
          modalRelatorio.style.display = 'none';
          modalRelatorio.setAttribute('aria-hidden', 'true');
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
      setupModoRapido();
      setupRelatorio();
      updateTimerDisplay();
      clearSelection();

      // Sincroniza o estado inicial (carrega tabela, contadores, gráfico, etc.)
      syncApp({ save: false });

      if (localStorage.getItem(STORAGE_KEYS.timerRunning) === 'true') {
        startTimer();
      }

      // Prevenção de perda acidental ao fechar/recarregar a aba com dados pendentes de exportação
      window.addEventListener('beforeunload', (e) => {
        localStorage.setItem(STORAGE_KEYS.timerRunning, state.isTimerRunning);
        if (hasUnsavedChanges && state.baseDeDados.length > 0) {
          e.preventDefault();
          e.returnValue = "Você possui protocolos adicionados que ainda não foram exportados para Excel. Deseja realmente sair?";
          return e.returnValue;
        }
      });

      // Atualiza metadados da guia de impressão física ao disparar Ctrl + P
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
        // Configura para A4 default (210 x 297 mm)
        const pdf = new jsPDF();
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        // --- 1. Header/Banner ---
        // Fundo do Header (Azul bem escuro para aspecto premium)
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

        // Linha divisória suave
        pdf.setDrawColor(226, 232, 240); // slate-200
        pdf.line(20, 85, pageWidth - 20, 85);

        // --- 3. Cards de Contagem ---
        const total = state.ambulatorioCount + state.internacaoCount;
        
        const cardY = 100;
        const cardWidth = (pageWidth - 50) / 3;
        const cardHeight = 40;
        
        const drawCard = (x, title, value, hexColor) => {
          // Extrai rgb do hex
          const r = parseInt(hexColor.slice(1, 3), 16);
          const g = parseInt(hexColor.slice(3, 5), 16);
          const b = parseInt(hexColor.slice(5, 7), 16);

          // Fundo suave e borda
          pdf.setFillColor(248, 250, 252); // slate-50
          pdf.setDrawColor(226, 232, 240); // slate-200
          pdf.roundedRect(x, cardY, cardWidth, cardHeight, 4, 4, "FD");
          
          // Tracinho colorido no topo do card
          pdf.setFillColor(r, g, b);
          pdf.roundedRect(x, cardY, cardWidth, 4, 4, 4, "F");
          // Conserta parte inferior do tracinho
          pdf.rect(x, cardY + 2, cardWidth, 2, "F");

          pdf.setTextColor(100, 116, 139); // slate-500
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.text(title, x + cardWidth / 2, cardY + 16, { align: "center" });
          
          pdf.setTextColor(15, 23, 42); // slate-900
          pdf.setFontSize(22);
          pdf.setFont("helvetica", "bold");
          pdf.text(String(value), x + cardWidth / 2, cardY + 32, { align: "center" });
        };

        const corAmb = getCssVariable("--cor-ambulatório") || "#10b981";
        const corInt = getCssVariable("--cor-internação") || "#667eea";
        const corTotal = "#334155"; // slate-700

        drawCard(20, "AMBULATÓRIO", state.ambulatorioCount, corAmb);
        drawCard(20 + cardWidth + 5, "INTERNAÇÃO", state.internacaoCount, corInt);
        drawCard(20 + (cardWidth * 2) + 10, "TOTAL PROCESSADO", total, corTotal);

        // --- 4. Gráfico ---
        if (total > 0) {
          pdf.setTextColor(15, 23, 42);
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.text("Distribuição Visual", 20, 165);
        
          const tempCanvas = document.createElement("canvas");
          // Resolução maior para melhor qualidade no PDF
          tempCanvas.width = 600;
          tempCanvas.height = 350;
          const tempCtx = tempCanvas.getContext("2d");
          
          const tempChart = new Chart(tempCtx, {
            type: "doughnut",
            data: {
              labels: [" Ambulatório", " Internação"],
              datasets: [{
                data: [state.ambulatorioCount, state.internacaoCount],
                backgroundColor: [corAmb, corInt],
                borderColor: "#ffffff",
                borderWidth: 4,
                hoverOffset: 0
              }]
            },
            options: {
              responsive: false,
              maintainAspectRatio: false,
              devicePixelRatio: 2, // Maior nitidez
              plugins: {
                legend: {
                  position: "right",
                  labels: {
                    color: "#334155",
                    padding: 30,
                    usePointStyle: true,
                    pointStyle: "circle",
                    font: { size: 24, family: "helvetica", weight: "bold" }
                  }
                },
                whiteBackground: { enabled: true } // Utiliza plugin existente no Proton
              },
              cutout: "65%"
            },
            plugins: [whiteBackgroundPlugin]
          });

          // Aguarda renderização
          await new Promise((resolve) => setTimeout(resolve, 600));

          const chartImage = tempCanvas.toDataURL("image/png", 1.0);
          
          const imgWidth = 150;
          const imgHeight = 87.5; // (350/600) * 150
          const imgX = (pageWidth - imgWidth) / 2;
          const imgY = 175;

          pdf.addImage(chartImage, "PNG", imgX, imgY, imgWidth, imgHeight);
          tempChart.destroy();
        } else {
          pdf.setTextColor(148, 163, 184);
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "italic");
          pdf.text("Nenhum documento contabilizado até o momento.", pageWidth / 2, 190, { align: "center" });
        }

        // --- 5. Footer ---
        pdf.setFillColor(241, 245, 249); // slate-100
        pdf.rect(0, pageHeight - 25, pageWidth, 25, "F");
        
        pdf.setTextColor(100, 116, 139); // slate-500
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.text("Relatório gerado automaticamente por PROTON v1.5", pageWidth / 2, pageHeight - 11, { align: "center" });

        // --- Salva Documento ---
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