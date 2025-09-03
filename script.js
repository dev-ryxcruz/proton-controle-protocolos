// PROTON v1.4 - Sistema de Controle de Protocolos
// Desenvolvido por Ryan Cristian

(function() {
    'use strict';

    // Utilitários de segurança
    const SecurityUtils = {
        // Sanitiza HTML para prevenir XSS
        sanitizeHTML: (str) => {
            const temp = document.createElement('div');
            temp.textContent = str;
            return temp.innerHTML;
        },

        // Escapa caracteres especiais
        escapeHTML: (str) => {
            const div = document.createElement('div');
            div.appendChild(document.createTextNode(str));
            return div.innerHTML;
        },

        // Valida entrada numérica
        validateNumeric: (value) => {
            return /^\d+$/.test(value.toString().trim());
        }
    };

    // Utilitários de performance
    const PerformanceUtils = {
        // Debounce para otimizar eventos frequentes
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

        // Throttle para limitar execução
        throttle: (func, limit) => {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            }
        }
    };

    // Gerenciador de loading
    const LoadingManager = {
        show: (message = 'Carregando...') => {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.querySelector('p').textContent = message;
                overlay.style.display = 'flex';
            }
        },

        hide: () => {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.style.display = 'none';
                    overlay.style.opacity = '1';
                }, 300);
            }
        }
    };

    // Inicialização da aplicação
    const initializeApp = () => {
        LoadingManager.show('Inicializando PROTON...');
        
        // Configurar tema inicial
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark-mode');
            document.getElementById('checkbox').checked = true;
        }

        // Inicializar módulos
        setupTabs();
        const protonInstance = protonApp();
        const contadorInstance = contadorApp();
        setupGlobalKeyboardShortcuts();
        setupThemeToggle();

        // Ocultar loading após inicialização
        setTimeout(() => {
            LoadingManager.hide();
        }, 1000);

        return { protonInstance, contadorInstance };
    };

    // Configuração das abas
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

    // Configuração do toggle de tema
    const setupThemeToggle = () => {
        const themeSwitch = document.getElementById('checkbox');
        
        themeSwitch.addEventListener('change', () => {
            if (themeSwitch.checked) {
                document.documentElement.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    };

    // Atalhos globais de teclado
    const setupGlobalKeyboardShortcuts = () => {
        document.addEventListener('keydown', (e) => {
            // Ignorar se modal estiver aberto
            if (document.querySelector('.modal[style*="display: block"]')) return;
            
            if (e.ctrlKey) {
                switch(e.key.toLowerCase()) {
                    case 'd':
                        e.preventDefault();
                        document.getElementById('checkbox').click();
                        break;
                    case '?':
                        e.preventDefault();
                        document.getElementById('btnShowShortcuts').click();
                        break;
                }
            }
        });
    };

    // Módulo PROTON
    const protonApp = () => {
        if (!document.getElementById('tab-proton')) return {};
        
        // Elementos DOM
        const elements = {
            dataRecebimento: document.getElementById('dataRecebimento'),
            numProtocolo: document.getElementById('numProtocolo'),
            protocoloFeedback: document.getElementById('protocoloFeedback'),
            btnAdicionar: document.getElementById('btnAdicionar'),
            btnLimpar: document.getElementById('btnLimpar'),
            tabelaCorpo: document.getElementById('tabelaCorpo'),
            mensagemVazia: document.getElementById('mensagemVazia'),
            conferente: document.getElementById('conferente'),
            btnFixarConferente: document.getElementById('btnFixarConferente'),
            btnTrocarConferente: document.getElementById('btnTrocarConferente'),
            convenio: document.getElementById('convenio'),
            btnFixarConvenio: document.getElementById('btnFixarConvenio'),
            btnTrocarConvenio: document.getElementById('btnTrocarConvenio'),
            btnGerarExcel: document.getElementById('gerarExcel'),
            statTotal: document.getElementById('stat-total'),
            statProcessados: document.getElementById('stat-processados'),
            statPendentes: document.getElementById('stat-pendentes'),
            statTaxa: document.getElementById('stat-taxa'),
            progressBar: document.getElementById('progressBar'),
            chartCanvas: document.getElementById('tipoDocumentoChart'),
            modalLote: document.getElementById('modalLote'),
            btnAbrirModalLote: document.getElementById('btnAbrirModalLote'),
            fecharModal: document.getElementById('fecharModal'),
            btnConfirmarLote: document.getElementById('btnConfirmarLote'),
            listaProtocolosLote: document.getElementById('listaProtocolosLote'),
            searchInput: document.getElementById('searchInput'),
            btnClearSearch: document.getElementById('btnClearSearch'),
            filterStatus: document.getElementById('filterStatus'),
            filterConvenio: document.getElementById('filterConvenio'),
            filterDate: document.getElementById('filterDate'),
            btnClearFilters: document.getElementById('btnClearFilters'),
            modalConferencia: document.getElementById('modalConferencia'),
            fecharModalConferencia: document.getElementById('fecharModalConferencia'),
            conferenciaForm: document.getElementById('conferenciaForm'),
            btnBackup: document.getElementById('btnBackup'),
            btnRestore: document.getElementById('btnRestore'),
            fileRestore: document.getElementById('fileRestore'),
            btnShowHistory: document.getElementById('btnShowHistory'),
            activityHistory: document.getElementById('activityHistory'),
            activityList: document.getElementById('activityList'),
            timerDisplay: document.getElementById('timerDisplay'),
            timerToggle: document.getElementById('timerToggle'),
            timerIcon: document.getElementById('timerIcon'),
            timerReset: document.getElementById('timerReset'),
            btnShowShortcuts: document.getElementById('btnShowShortcuts'),
            keyboardShortcuts: document.getElementById('keyboardShortcuts')
        };
        
        // Estado da aplicação
        let state = {
            baseDeDados: JSON.parse(localStorage.getItem('documentosDB_pro_v1')) || [],
            dadosFiltrados: [],
            atividades: JSON.parse(localStorage.getItem('atividades_pro_v1')) || [],
            tipoDocumentoChart: null,
            timerInterval: null,
            timerSeconds: parseInt(localStorage.getItem('timer_seconds')) || 0,
            isTimerRunning: false,
            sortColumn: null,
            sortDirection: 'asc'
        };

        // Inicializar dados filtrados
        state.dadosFiltrados = [...state.baseDeDados];

        // Utilitários
        const formatarDataBR = (dataString) => {
            if (!dataString || !dataString.includes('-')) return '';
            const [ano, mes, dia] = dataString.split('-');
            return `${dia}/${mes}/${ano}`;
        };

        const salvarDados = () => {
            try {
                localStorage.setItem('documentosDB_pro_v1', JSON.stringify(state.baseDeDados));
                localStorage.setItem('atividades_pro_v1', JSON.stringify(state.atividades));
            } catch (error) {
                console.error('Erro ao salvar dados:', error);
                showToast('error', 'Erro', 'Falha ao salvar dados localmente.');
            }
        };

        // Sistema de notificações melhorado
        const showToast = (type, title, message, duration = 4000) => {
            const toastContainer = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            
            const icons = { 
                success: 'fas fa-check-circle', 
                error: 'fas fa-exclamation-circle', 
                warning: 'fas fa-exclamation-triangle', 
                info: 'fas fa-info-circle' 
            };
            
            // Sanitizar conteúdo
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
            
            // Auto-remover
            const autoRemove = setTimeout(() => {
                if (toast.parentNode) {
                    removeToast(toast);
                }
            }, duration);
            
            // Botão de fechar
            toast.querySelector('.toast-close').addEventListener('click', () => {
                clearTimeout(autoRemove);
                removeToast(toast);
            });
        };

        const removeToast = (toast) => {
            toast.style.animation = 'toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        };
        
        // Sistema de atividades
        const addActivity = (type, action, details = '') => {
            const activity = {
                id: Date.now(),
                type: SecurityUtils.escapeHTML(type),
                action: SecurityUtils.escapeHTML(action),
                details: SecurityUtils.escapeHTML(details),
                timestamp: new Date().toLocaleString('pt-BR')
            };
            
            state.atividades.unshift(activity);
            
            // Limitar histórico
            if (state.atividades.length > 100) {
                state.atividades = state.atividades.slice(0, 100);
            }
            
            salvarDados();
        };

        const renderActivities = () => {
            if (!elements.activityList) return;
            
            elements.activityList.innerHTML = '';
            
            if (state.atividades.length === 0) {
                elements.activityList.innerHTML = '<p style="color: #64748b; text-align: center;">Nenhuma atividade registrada ainda.</p>';
                return;
            }
            
            const icons = {
                add: 'fas fa-plus text-success',
                edit: 'fas fa-edit text-warning',
                delete: 'fas fa-trash text-danger',
                conference: 'fas fa-check text-success',
                export: 'fas fa-file-excel text-info',
                backup: 'fas fa-download text-info',
                restore: 'fas fa-upload text-warning',
                clear: 'fas fa-trash-alt text-danger'
            };
            
            state.atividades.slice(0, 20).forEach(activity => {
                const activityEl = document.createElement('div');
                activityEl.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--cor-borda);';
                
                activityEl.innerHTML = `
                    <i class="${icons[activity.type] || 'fas fa-info'}" style="width: 20px;" aria-hidden="true"></i>
                    <div style="flex-grow: 1;">
                        <strong>${activity.action}</strong>
                        ${activity.details ? `<br><small style="color: #64748b;">${activity.details}</small>` : ''}
                    </div>
                    <small style="color: #64748b; white-space: nowrap;">${activity.timestamp}</small>
                `;
                
                elements.activityList.appendChild(activityEl);
            });
        };

        // Sistema de timer melhorado
        const updateTimerDisplay = () => {
            const hours = Math.floor(state.timerSeconds / 3600);
            const minutes = Math.floor((state.timerSeconds % 3600) / 60);
            const seconds = state.timerSeconds % 60;
            
            const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            elements.timerDisplay.textContent = timeString;
            elements.timerDisplay.setAttribute('aria-label', `Tempo decorrido: ${timeString}`);
        };

        const startTimer = () => {
            if (state.isTimerRunning) return;
            
            state.isTimerRunning = true;
            elements.timerIcon.className = 'fas fa-pause';
            elements.timerToggle.setAttribute('title', 'Pausar cronômetro');
            
            showToast('info', 'Timer Iniciado', 'Cronômetro de produtividade ativado!');
            
            state.timerInterval = setInterval(() => {
                state.timerSeconds++;
                updateTimerDisplay();
                localStorage.setItem('timer_seconds', state.timerSeconds);
            }, 1000);
        };

        const pauseTimer = () => {
            if (!state.isTimerRunning) return;
            
            state.isTimerRunning = false;
            elements.timerIcon.className = 'fas fa-play';
            elements.timerToggle.setAttribute('title', 'Iniciar cronômetro');
            
            clearInterval(state.timerInterval);
            showToast('warning', 'Timer Pausado', 'Cronômetro pausado.');
        };

        const resetTimer = () => {
            if (state.isTimerRunning) pauseTimer();
            
            if (confirm('Tem certeza que deseja reiniciar o cronômetro?')) {
                state.timerSeconds = 0;
                localStorage.removeItem('timer_seconds');
                updateTimerDisplay();
                showToast('info', 'Cronômetro Reiniciado', 'O tempo foi zerado.');
            }
        };

        // Validação de protocolo melhorada
        const validarProtocolo = (protocolo) => {
            const protocoloLimpo = protocolo.toString().trim();
            
            if (!protocoloLimpo) {
                return { valido: false, erro: 'Protocolo não pode estar vazio.' };
            }
            
            if (!SecurityUtils.validateNumeric(protocoloLimpo)) {
                return { valido: false, erro: 'Protocolo deve conter apenas números.' };
            }
            
            if (protocoloLimpo.length < 3) {
                return { valido: false, erro: 'Protocolo deve ter pelo menos 3 dígitos.' };
            }
            
            if (protocoloLimpo.length > 20) {
                return { valido: false, erro: 'Protocolo não pode ter mais de 20 dígitos.' };
            }
            
            if (state.baseDeDados.some(item => item.protocolo === protocoloLimpo)) {
                return { valido: false, erro: 'Protocolo já existe na fila.' };
            }
            
            return { valido: true };
        };

        // Feedback visual para validação
        const updateProtocoloFeedback = (validation) => {
            const feedback = elements.protocoloFeedback;
            if (!feedback) return;
            
            feedback.className = 'input-feedback';
            
            if (validation.valido) {
                feedback.className += ' success';
                feedback.textContent = '✓ Protocolo válido';
            } else {
                feedback.className += ' error';
                feedback.textContent = validation.erro;
            }
        };

        // Dashboard atualizado
        const atualizarDashboard = () => {
            const total = state.dadosFiltrados.length;
            const processados = state.dadosFiltrados.filter(item => item.status === 'Baixado').length;
            const pendentes = total - processados;
            const taxa = total > 0 ? Math.round((processados / total) * 100) : 0;
            
            // Atualizar estatísticas
            elements.statTotal.textContent = total;
            elements.statProcessados.textContent = processados;
            elements.statPendentes.textContent = pendentes;
            elements.statTaxa.textContent = `${taxa}%`;
            
            // Atualizar barra de progresso
            elements.progressBar.style.width = `${taxa}%`;
            elements.progressBar.textContent = `${taxa}%`;
            elements.progressBar.setAttribute('aria-valuenow', taxa);
            
            // Atualizar filtro de convênios
            const convenios = [...new Set(state.baseDeDados.map(item => item.convenio))];
            const currentValue = elements.filterConvenio.value;
            
            elements.filterConvenio.innerHTML = '<option value="">Todos os Convênios</option>';
            convenios.forEach(convenio => {
                const option = document.createElement('option');
                option.value = convenio;
                option.textContent = convenio;
                elements.filterConvenio.appendChild(option);
            });
            
            // Restaurar valor selecionado
            elements.filterConvenio.value = currentValue;
            
            // Atualizar gráfico
            atualizarGrafico();
        };

        const atualizarGrafico = () => {
            const contagemTipos = { Ambulatorio: 0, CDI: 0, UE: 0, Internacao: 0 };
            
            state.dadosFiltrados
                .filter(item => item.status === 'Baixado')
                .forEach(item => {
                    if (item.quantidades) {
                        for (const tipo in item.quantidades) {
                            if (item.quantidades[tipo] > 0) {
                                contagemTipos[tipo] += item.quantidades[tipo];
                            }
                        }
                    }
                });
            
            const labels = Object.keys(contagemTipos).filter(k => contagemTipos[k] > 0);
            const data = Object.values(contagemTipos).filter(v => v > 0);
            
            // Destruir gráfico anterior
            if (state.tipoDocumentoChart) {
                state.tipoDocumentoChart.destroy();
            }
            
            if (data.length > 0) {
                state.tipoDocumentoChart = new Chart(elements.chartCanvas, {
                    type: 'doughnut',
                    data: {
                        labels: labels.map(l => {
                            switch(l) {
                                case 'Ambulatorio': return 'Ambulatório';
                                case 'Internacao': return 'Internação';
                                default: return l;
                            }
                        }),
                        datasets: [{
                            data: data,
                            backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'],
                            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--cor-container'),
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    color: getComputedStyle(document.documentElement).getPropertyValue('--cor-texto'),
                                    padding: 20,
                                    usePointStyle: true
                                }
                            }
                        }
                    }
                });
            }
        };

        // Renderização da tabela com ordenação
        const renderizarTabela = () => {
            elements.tabelaCorpo.innerHTML = '';
            elements.mensagemVazia.style.display = state.dadosFiltrados.length === 0 ? 'block' : 'none';
            
            state.dadosFiltrados.forEach((item, index) => {
                const tr = document.createElement('tr');
                if (item.status === 'Baixado') {
                    tr.classList.add('status-baixado');
                }
                
                const convenioColor = {
                    'Unimed': '#3b82f6',
                    'Intercâmbio': '#ef4444',
                    'Convênio Externo': '#f59e0b',
                    'Particular': '#10b981',
                    'Internação': '#8b5cf6'
                };
                
                const protocoloSafe = SecurityUtils.escapeHTML(item.protocolo);
                const convenioSafe = SecurityUtils.escapeHTML(item.convenio);
                const statusSafe = SecurityUtils.escapeHTML(item.status);
                
                tr.innerHTML = `
                    <td>${protocoloSafe}</td>
                    <td>
                        <span style="background: ${convenioColor[item.convenio] || '#64748b'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                            ${convenioSafe}
                        </span>
                    </td>
                    <td class="status-display">
                        <i class="fas ${item.status === 'Baixado' ? 'fa-check-circle' : 'fa-clock'}" aria-hidden="true"></i> 
                        ${statusSafe}
                    </td>
                    <td>${formatarDataBR(item.dataRecebimento)}</td>
                    <td class="action-buttons"></td>
                `;
                
                const acaoCell = tr.querySelector('.action-buttons');
                const itemIndex = state.baseDeDados.indexOf(item);
                
                if (item.status === 'Baixado') {
                    acaoCell.innerHTML = `
                        <button class="btn-warning" onclick="window.protonActions.editarProtocolo(${itemIndex})" title="Editar protocolo" aria-label="Editar protocolo ${protocoloSafe}">
                            <i class="fas fa-edit" aria-hidden="true"></i>
                        </button>
                        <button class="btn-danger" onclick="window.protonActions.removerProtocolo(${itemIndex})" title="Remover protocolo" aria-label="Remover protocolo ${protocoloSafe}">
                            <i class="fas fa-trash" aria-hidden="true"></i>
                        </button>
                    `;
                } else {
                    acaoCell.innerHTML = `
                        <button class="btn-success" onclick="window.protonActions.conferirProtocolo(${itemIndex})" title="Conferir protocolo" aria-label="Conferir protocolo ${protocoloSafe}">
                            <i class="fas fa-check" aria-hidden="true"></i>
                        </button>
                        <button class="btn-warning" onclick="window.protonActions.editarProtocolo(${itemIndex})" title="Editar protocolo" aria-label="Editar protocolo ${protocoloSafe}">
                            <i class="fas fa-edit" aria-hidden="true"></i>
                        </button>
                        <button class="btn-danger" onclick="window.protonActions.removerProtocolo(${itemIndex})" title="Remover protocolo" aria-label="Remover protocolo ${protocoloSafe}">
                            <i class="fas fa-trash" aria-hidden="true"></i>
                        </button>
                    `;
                }
                
                elements.tabelaCorpo.appendChild(tr);
            });
        };

        // Sistema de ordenação
        const setupSorting = () => {
            const sortButtons = document.querySelectorAll('.sort-btn');
            
            sortButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const column = btn.getAttribute('data-column');
                    
                    // Alternar direção se mesma coluna
                    if (state.sortColumn === column) {
                        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        state.sortColumn = column;
                        state.sortDirection = 'asc';
                    }
                    
                    // Atualizar UI dos botões
                    sortButtons.forEach(b => {
                        b.classList.remove('active');
                        const icon = b.querySelector('.sort-icon');
                        icon.className = 'fas fa-sort sort-icon';
                    });
                    
                    btn.classList.add('active');
                    const icon = btn.querySelector('.sort-icon');
                    icon.className = `fas fa-sort-${state.sortDirection === 'asc' ? 'up' : 'down'} sort-icon`;
                    
                    // Ordenar dados
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
                
                // Tratamento especial para datas
                if (state.sortColumn === 'dataRecebimento') {
                    valueA = new Date(valueA);
                    valueB = new Date(valueB);
                }
                
                // Tratamento para números (protocolo)
                if (state.sortColumn === 'protocolo') {
                    valueA = parseInt(valueA);
                    valueB = parseInt(valueB);
                }
                
                if (valueA < valueB) {
                    return state.sortDirection === 'asc' ? -1 : 1;
                }
                if (valueA > valueB) {
                    return state.sortDirection === 'asc' ? 1 : -1;
                }
                return 0;
            });
        };
        
        // Sistema de filtros melhorado
        const aplicarFiltros = PerformanceUtils.debounce(() => {
            const searchTerm = elements.searchInput.value.toLowerCase().trim();
            const statusFilter = elements.filterStatus.value;
            const convenioFilter = elements.filterConvenio.value;
            const dateFilter = elements.filterDate.value;
            
            // Mostrar/ocultar botão de limpar busca
            elements.btnClearSearch.classList.toggle('visible', searchTerm.length > 0);
            
            state.dadosFiltrados = state.baseDeDados.filter(item => {
                const matchesSearch = !searchTerm || 
                    item.protocolo.toLowerCase().includes(searchTerm) ||
                    item.convenio.toLowerCase().includes(searchTerm) ||
                    item.status.toLowerCase().includes(searchTerm);
                
                const matchesStatus = !statusFilter || item.status === statusFilter;
                const matchesConvenio = !convenioFilter || item.convenio === convenioFilter;
                const matchesDate = !dateFilter || item.dataRecebimento === dateFilter;
                
                return matchesSearch && matchesStatus && matchesConvenio && matchesDate;
            });
            
            // Aplicar ordenação se ativa
            if (state.sortColumn) {
                sortData();
            }
            
            renderizarTabela();
            atualizarDashboard();
        }, 300);

        // Ações globais do PROTON
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
                            <i class="fas fa-save" aria-hidden="true"></i> Salvar
                        </button>
                        <button class="btn-secondary" onclick="document.getElementById('modalConferencia').style.display='none'">
                            Cancelar
                        </button>
                    </div>
                `;
                
                elements.modalConferencia.style.display = 'block';
                elements.modalConferencia.setAttribute('aria-hidden', 'false');
                
                // Focar no primeiro campo
                setTimeout(() => {
                    document.getElementById('qtd-ambulatorio').focus();
                }, 100);
            },

            salvarConferencia: (index) => {
                const quantidades = {
                    Ambulatorio: parseInt(document.getElementById('qtd-ambulatorio').value) || 0,
                    CDI: parseInt(document.getElementById('qtd-cdi').value) || 0,
                    UE: parseInt(document.getElementById('qtd-ue').value) || 0,
                    Internacao: parseInt(document.getElementById('qtd-internacao').value) || 0
                };
                
                const total = Object.values(quantidades).reduce((a, b) => a + b, 0);
                
                if (total === 0) {
                    showToast('warning', 'Quantidade Inválida', 'Pelo menos um tipo deve ter quantidade maior que zero.');
                    return;
                }
                
                const item = state.baseDeDados[index];
                item.status = 'Baixado';
                item.quantidades = quantidades;
                item.observacoes = SecurityUtils.escapeHTML(document.getElementById('observacoes').value);
                item.conferente = elements.conferente.value;
                item.dataConferencia = new Date().toISOString();
                
                salvarDados();
                aplicarFiltros();
                
                elements.modalConferencia.style.display = 'none';
                elements.modalConferencia.setAttribute('aria-hidden', 'true');
                
                showToast('success', 'Protocolo Conferido', `Protocolo ${item.protocolo} conferido com sucesso.`);
                addActivity('conference', `Protocolo ${item.protocolo} conferido`, `Total: ${total} documentos`);
            },

            editarProtocolo: (index) => {
                const item = state.baseDeDados[index];
                if (!item) return;
                
                const novoProtocolo = prompt('Editar número do protocolo:', item.protocolo);
                
                if (novoProtocolo && novoProtocolo !== item.protocolo) {
                    const validacao = validarProtocolo(novoProtocolo);
                    
                    if (!validacao.valido) {
                        showToast('error', 'Erro de Validação', validacao.erro);
                        return;
                    }
                    
                    const protocoloAntigo = item.protocolo;
                    item.protocolo = novoProtocolo.trim();
                    
                    salvarDados();
                    aplicarFiltros();
                    
                    showToast('success', 'Protocolo Editado', `Protocolo ${protocoloAntigo} alterado para ${novoProtocolo}`);
                    addActivity('edit', `Protocolo editado: ${protocoloAntigo} → ${novoProtocolo}`);
                }
            },

            removerProtocolo: (index) => {
                const item = state.baseDeDados[index];
                if (!item) return;
                
                if (confirm(`Tem certeza que deseja remover o protocolo ${item.protocolo}?\n\nEsta ação não pode ser desfeita.`)) {
                    const protocoloRemovido = item.protocolo;
                    state.baseDeDados.splice(index, 1);
                    
                    salvarDados();
                    aplicarFiltros();
                    
                    showToast('success', 'Protocolo Removido', `Protocolo ${protocoloRemovido} foi removido.`);
                    addActivity('delete', `Protocolo ${protocoloRemovido} removido`);
                }
            }
        };

        // Configuração de campos fixáveis
        const setupFixableField = (inputEl, fixBtn, changeBtn, storageKey) => {
            const fixValue = () => {
                const value = inputEl.value.trim();
                if (!value) {
                    showToast('warning', 'Campo Vazio', `Preencha o campo "${inputEl.labels[0].textContent}" para fixar.`);
                    inputEl.focus();
                    return;
                }
                
                inputEl.disabled = true;
                fixBtn.style.display = 'none';
                changeBtn.style.display = 'inline-block';
                localStorage.setItem(storageKey, value);
                
                showToast('success', 'Campo Fixado', `${inputEl.labels[0].textContent} foi fixado.`);
            };
            
            const changeValue = () => {
                inputEl.disabled = false;
                fixBtn.style.display = 'inline-block';
                changeBtn.style.display = 'none';
                localStorage.removeItem(storageKey);
                inputEl.focus();
                
                showToast('info', 'Campo Liberado', `${inputEl.labels[0].textContent} foi liberado para edição.`);
            };
            
            const loadFixedValue = () => {
                const savedValue = localStorage.getItem(storageKey);
                if (savedValue) {
                    inputEl.value = savedValue;
                    fixValue();
                }
            };
            
            fixBtn.addEventListener('click', fixValue);
            changeBtn.addEventListener('click', changeValue);
            loadFixedValue();
        };

        // Adicionar protocolo
        const adicionarProtocolo = () => {
            const protocolo = elements.numProtocolo.value.trim();
            const convenio = elements.convenio.value;
            const dataRecebimento = elements.dataRecebimento.value;
            
            // Validações
            if (!convenio) {
                showToast('warning', 'Campo Obrigatório', 'Selecione um convênio antes de adicionar o protocolo.');
                elements.convenio.focus();
                return;
            }
            
            if (!dataRecebimento) {
                showToast('warning', 'Campo Obrigatório', 'Defina a data de referência antes de adicionar o protocolo.');
                elements.dataRecebimento.focus();
                return;
            }
            
            const validacao = validarProtocolo(protocolo);
            if (!validacao.valido) {
                showToast('error', 'Protocolo Inválido', validacao.erro);
                elements.numProtocolo.focus();
                return;
            }
            
            // Criar novo item
            const novoItem = {
                protocolo: protocolo,
                convenio: convenio,
                status: 'Pendente',
                dataRecebimento: dataRecebimento,
                dataAdicao: new Date().toISOString()
            };
            
            state.baseDeDados.push(novoItem);
            elements.numProtocolo.value = '';
            
            // Limpar feedback
            if (elements.protocoloFeedback) {
                elements.protocoloFeedback.textContent = '';
                elements.protocoloFeedback.className = 'input-feedback';
            }
            
            salvarDados();
            aplicarFiltros();
            elements.numProtocolo.focus();
            
            showToast('success', 'Protocolo Adicionado', `Protocolo ${protocolo} foi adicionado à fila.`);
            addActivity('add', `Protocolo ${protocolo} adicionado`, `Convênio: ${convenio}`);
        };

        // Validação em tempo real do protocolo
        const setupProtocolValidation = () => {
            if (!elements.numProtocolo || !elements.protocoloFeedback) return;
            
            const validateInput = PerformanceUtils.debounce(() => {
                const value = elements.numProtocolo.value.trim();
                
                if (value) {
                    const validation = validarProtocolo(value);
                    updateProtocoloFeedback(validation);
                } else {
                    elements.protocoloFeedback.textContent = '';
                    elements.protocoloFeedback.className = 'input-feedback';
                }
            }, 300);
            
            elements.numProtocolo.addEventListener('input', validateInput);
        };

        // Geração de Excel melhorada
        const gerarExcel = async () => {
            if (state.baseDeDados.length === 0) {
                showToast('warning', 'Sem Dados', 'Não há protocolos para exportar.');
                return;
            }
            
            const itensParaExportar = state.baseDeDados.filter(item => item.status === 'Baixado');
            
            if (itensParaExportar.length === 0) {
                showToast('warning', 'Sem Dados Processados', 'Não há protocolos processados para exportar.');
                return;
            }
            
            LoadingManager.show('Gerando planilha Excel...');
            
            try {
                const dataRef = formatarDataBR(elements.dataRecebimento.value) || new Date().toLocaleDateString('pt-BR');
                const nomeResp = elements.conferente.value || 'Não informado';
                
                const workbook = new ExcelJS.Workbook();
                workbook.creator = 'PROTON v1.4';
                workbook.created = new Date();
                
                const tiposDoc = {
                    Ambulatorio: 'Ambulatório',
                    CDI: 'CDI',
                    UE: 'Ficha UE',
                    Internacao: 'Internação'
                };
                
                for (const tipo in tiposDoc) {
                    const nomeAba = tiposDoc[tipo];
                    const dadosFiltrados = itensParaExportar
                        .filter(item => item.quantidades && item.quantidades[tipo] > 0)
                        .map(item => ({
                            protocolo: item.protocolo,
                            tipo: tipo.substring(0, 3).toUpperCase(),
                            quantidade: item.quantidades[tipo],
                            observacao: item.observacoes || 'OK'
                        }));
                    
                    if (dadosFiltrados.length > 0) {
                        const ws = workbook.addWorksheet(nomeAba);
                        
                        // Configurar colunas
                        ws.columns = [
                            { width: 20 },
                            { width: 12 },
                            { width: 12 },
                            { width: 45 }
                        ];
                        
                        // Cabeçalho principal
                        ws.mergeCells('A1:D1');
                        const headerCell = ws.getCell('A1');
                        headerCell.value = 'CONTROLE DE RECEBIMENTO - PROTOCOLO MOVDOC';
                        headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
                        headerCell.font = { bold: true, size: 14 };
                        headerCell.border = {
                            top: {style:'thin'},
                            left: {style:'thin'},
                            bottom: {style:'thin'},
                            right: {style:'thin'}
                        };
                        
                        // Informações
                        ws.mergeCells('A2:B2');
                        const dateCell = ws.getCell('A2');
                        dateCell.value = `DATA: ${dataRef}`;
                        dateCell.font = { bold: true, size: 12 };
                        dateCell.border = {
                            top: {style:'thin'},
                            left: {style:'thin'},
                            bottom: {style:'thin'},
                            right: {style:'thin'}
                        };
                        
                        ws.mergeCells('C2:D2');
                        const respCell = ws.getCell('C2');
                        respCell.value = `RESPONSÁVEL: ${nomeResp}`;
                        respCell.font = { bold: true, size: 12 };
                        respCell.border = {
                            top: {style:'thin'},
                            left: {style:'thin'},
                            bottom: {style:'thin'},
                            right: {style:'thin'}
                        };
                        
                        // Cabeçalho da tabela
                        const headerRow = ws.addRow(['PROTOCOLO', 'TIPO', 'QUANT.', 'OBSERVAÇÃO']);
                        headerRow.eachCell(cell => {
                            cell.font = { bold: true };
                            cell.alignment = { horizontal: 'center' };
                            cell.border = {
                                top: {style:'thin'},
                                left: {style:'thin'},
                                bottom: {style:'thin'},
                                right: {style:'thin'}
                            };
                        });
                        
                        // Dados
                        dadosFiltrados.forEach(d => {
                            const row = ws.addRow(Object.values(d));
                            row.eachCell(cell => {
                                cell.border = {
                                    top: {style:'thin'},
                                    left: {style:'thin'},
                                    bottom: {style:'thin'},
                                    right: {style:'thin'}
                                };
                            });
                        });
                    }
                }
                
                if (workbook.worksheets.length === 0) {
                    showToast('warning', 'Sem Dados Válidos', 'Nenhum item com quantidade > 0 foi encontrado.');
                    LoadingManager.hide();
                    return;
                }
                
                // Gerar e baixar arquivo
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], { 
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                });
                
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `Relatorio_MOVDOC_${dataRef.replace(/\//g, '-')}.xlsx`;
                link.click();
                
                // Limpar URL
                setTimeout(() => URL.revokeObjectURL(link.href), 100);
                
                showToast('success', 'Excel Gerado', 'Planilha exportada com sucesso!');
                addActivity('export', 'Planilha Excel gerada', `${itensParaExportar.length} registros processados`);
                
            } catch (error) {
                console.error('Erro ao gerar Excel:', error);
                showToast('error', 'Erro na Exportação', 'Falha ao gerar a planilha Excel. Tente novamente.');
            } finally {
                LoadingManager.hide();
            }
        };

        // Event listeners
        const setupEventListeners = () => {
            // Timer
            elements.timerToggle.addEventListener('click', () => {
                state.isTimerRunning ? pauseTimer() : startTimer();
            });
            elements.timerReset.addEventListener('click', resetTimer);
            
            // Atalhos
            elements.btnShowShortcuts.addEventListener('click', () => {
                elements.keyboardShortcuts.classList.toggle('visible');
            });
            
            // Campos fixáveis
            setupFixableField(elements.conferente, elements.btnFixarConferente, elements.btnTrocarConferente, 'conferenteFixo_pro_v1');
            setupFixableField(elements.convenio, elements.btnFixarConvenio, elements.btnTrocarConvenio, 'convenioFixo_pro_v1');
            
            // Protocolo
            elements.btnAdicionar.addEventListener('click', adicionarProtocolo);
            elements.numProtocolo.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    adicionarProtocolo();
                }
            });
            
            // Modal lote
            elements.btnAbrirModalLote.addEventListener('click', () => {
                elements.modalLote.style.display = 'block';
                elements.modalLote.setAttribute('aria-hidden', 'false');
                elements.listaProtocolosLote.focus();
            });
            
            elements.fecharModal.addEventListener('click', () => {
                elements.modalLote.style.display = 'none';
                elements.modalLote.setAttribute('aria-hidden', 'true');
            });
            
            elements.fecharModalConferencia.addEventListener('click', () => {
                elements.modalConferencia.style.display = 'none';
                elements.modalConferencia.setAttribute('aria-hidden', 'true');
            });
            
            // Fechar modais clicando fora
            window.addEventListener('click', (e) => {
                if (e.target === elements.modalLote) {
                    elements.modalLote.style.display = 'none';
                    elements.modalLote.setAttribute('aria-hidden', 'true');
                }
                if (e.target === elements.modalConferencia) {
                    elements.modalConferencia.style.display = 'none';
                    elements.modalConferencia.setAttribute('aria-hidden', 'true');
                }
            });
            
            // Lote de protocolos
            elements.btnConfirmarLote.addEventListener('click', () => {
                const convenio = elements.convenio.value;
                const dataRecebimento = elements.dataRecebimento.value;
                
                if (!convenio || !dataRecebimento) {
                    showToast('warning', 'Campos Obrigatórios', 'Defina o convênio e a data de referência antes de adicionar o lote.');
                    return;
                }
                
                const protocolos = elements.listaProtocolosLote.value
                    .trim()
                    .split('\n')
                    .map(p => p.trim())
                    .filter(p => p);
                
                if (protocolos.length === 0) {
                    showToast('warning', 'Lista Vazia', 'Digite pelo menos um protocolo na lista.');
                    return;
                }
                
                let adicionados = 0;
                let erros = 0;
                
                protocolos.forEach(p => {
                    const validacao = validarProtocolo(p);
                    if (validacao.valido) {
                        state.baseDeDados.push({
                            protocolo: p,
                            convenio: convenio,
                            status: 'Pendente',
                            dataRecebimento: dataRecebimento,
                            dataAdicao: new Date().toISOString()
                        });
                        adicionados++;
                    } else {
                        erros++;
                    }
                });
                
                if (adicionados > 0) {
                    elements.listaProtocolosLote.value = '';
                    elements.modalLote.style.display = 'none';
                    elements.modalLote.setAttribute('aria-hidden', 'true');
                    
                    salvarDados();
                    aplicarFiltros();
                    
                    let message = `${adicionados} protocolos adicionados com sucesso.`;
                    if (erros > 0) {
                        message += ` ${erros} protocolos foram ignorados por serem inválidos.`;
                    }
                    
                    showToast('success', 'Lote Processado', message);
                    addActivity('add', `Lote de ${adicionados} protocolos adicionado`, `Convênio: ${convenio}`);
                } else {
                    showToast('error', 'Nenhum Protocolo Válido', 'Todos os protocolos da lista são inválidos ou já existem.');
                }
            });
            
            // Filtros e busca
            elements.searchInput.addEventListener('input', aplicarFiltros);
            elements.filterStatus.addEventListener('change', aplicarFiltros);
            elements.filterConvenio.addEventListener('change', aplicarFiltros);
            elements.filterDate.addEventListener('change', aplicarFiltros);
            
            // Botão limpar busca
            elements.btnClearSearch.addEventListener('click', () => {
                elements.searchInput.value = '';
                aplicarFiltros();
            });
            
            elements.btnClearFilters.addEventListener('click', () => {
                elements.searchInput.value = '';
                elements.filterStatus.value = '';
                elements.filterConvenio.value = '';
                elements.filterDate.value = '';
                aplicarFiltros();
                showToast('info', 'Filtros Limpos', 'Exibindo todos os registros.');
            });
            
            // Excel
            elements.btnGerarExcel.addEventListener('click', gerarExcel);
            
            // Backup e restore
            elements.btnBackup.addEventListener('click', () => {
                try {
                    const dadosBackup = {
                        versao: 'pro_v1.4',
                        timestamp: new Date().toISOString(),
                        dados: state.baseDeDados,
                        atividades: state.atividades,
                        configuracoes: {
                            conferente: localStorage.getItem('conferenteFixo_pro_v1'),
                            convenio: localStorage.getItem('convenioFixo_pro_v1'),
                            tema: localStorage.getItem('theme'),
                            timerSeconds: localStorage.getItem('timer_seconds')
                        }
                    };
                    
                    const blob = new Blob([JSON.stringify(dadosBackup, null, 2)], { 
                        type: 'application/json' 
                    });
                    
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `backup-proton-${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    
                    setTimeout(() => URL.revokeObjectURL(link.href), 100);
                    
                    showToast('success', 'Backup Criado', 'Arquivo de backup foi gerado e baixado.');
                    addActivity('backup', 'Backup de dados criado', `${state.baseDeDados.length} registros`);
                    
                } catch (error) {
                    console.error('Erro ao criar backup:', error);
                    showToast('error', 'Erro no Backup', 'Falha ao criar o arquivo de backup.');
                }
            });
            
            elements.btnRestore.addEventListener('click', () => {
                elements.fileRestore.click();
            });
            
            elements.fileRestore.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const backup = JSON.parse(ev.target.result);
                        
                        if (!backup.versao || !backup.dados) {
                            showToast('error', 'Arquivo Inválido', 'O arquivo de backup está corrompido ou é inválido.');
                            return;
                        }
                        
                        if (confirm('Restaurar backup?\n\nTodos os dados atuais serão substituídos pelos dados do backup.\n\nEsta ação não pode ser desfeita.')) {
                            state.baseDeDados = backup.dados || [];
                            state.atividades = backup.atividades || [];
                            
                            // Restaurar configurações
                            if (backup.configuracoes) {
                                if (backup.configuracoes.conferente) {
                                    localStorage.setItem('conferenteFixo_pro_v1', backup.configuracoes.conferente);
                                }
                                if (backup.configuracoes.convenio) {
                                    localStorage.setItem('convenioFixo_pro_v1', backup.configuracoes.convenio);
                                }
                                if (backup.configuracoes.tema) {
                                    localStorage.setItem('theme', backup.configuracoes.tema);
                                }
                                if (backup.configuracoes.timerSeconds) {
                                    localStorage.setItem('timer_seconds', backup.configuracoes.timerSeconds);
                                    state.timerSeconds = parseInt(backup.configuracoes.timerSeconds);
                                }
                            }
                            
                            salvarDados();
                            aplicarFiltros();
                            
                            showToast('success', 'Backup Restaurado', 'Dados foram restaurados com sucesso! A página será recarregada.');
                            addActivity('restore', 'Backup restaurado', `${state.baseDeDados.length} registros`);
                            
                            // Recarregar página após delay
                            setTimeout(() => {
                                location.reload();
                            }, 2000);
                        }
                    } catch (error) {
                        console.error('Erro ao processar backup:', error);
                        showToast('error', 'Erro no Backup', 'Falha ao processar o arquivo de backup.');
                    }
                };
                
                reader.readAsText(file);
                e.target.value = '';
            });
            
            // Histórico
            elements.btnShowHistory.addEventListener('click', () => {
                const isVisible = elements.activityHistory.style.display !== 'none';
                elements.activityHistory.style.display = isVisible ? 'none' : 'block';
                elements.btnShowHistory.innerHTML = isVisible ? 
                    '<i class="fas fa-history" aria-hidden="true"></i> Mostrar Histórico' : 
                    '<i class="fas fa-eye-slash" aria-hidden="true"></i> Ocultar Histórico';
                
                if (!isVisible) {
                    renderActivities();
                }
            });
            
            // Limpar dados
            elements.btnLimpar.addEventListener('click', () => {
                if (confirm('ATENÇÃO!\n\nEsta ação irá apagar TODOS os protocolos e dados do sistema.\n\nEsta ação NÃO PODE ser desfeita.\n\nDeseja realmente continuar?')) {
                    if (confirm('Última confirmação:\n\nTodos os dados serão perdidos permanentemente.\n\nTem certeza absoluta?')) {
                        state.baseDeDados = [];
                        state.atividades = [];
                        state.dadosFiltrados = [];
                        
                        salvarDados();
                        aplicarFiltros();
                        
                        showToast('success', 'Dados Limpos', 'Todos os dados foram removidos do sistema.');
                        addActivity('clear', 'Todos os dados foram limpos');
                    }
                }
            });
            
            // Atalhos de teclado específicos do PROTON
            document.addEventListener('keydown', (e) => {
                if (document.querySelector('.modal[style*="display: block"]')) return;
                
                if (e.ctrlKey && document.getElementById('tab-proton').classList.contains('active')) {
                    switch(e.key.toLowerCase()) {
                        case 'a':
                            e.preventDefault();
                            elements.numProtocolo.focus();
                            break;
                        case 'f':
                            e.preventDefault();
                            elements.searchInput.focus();
                            break;
                        case 'e':
                            e.preventDefault();
                            elements.btnGerarExcel.click();
                            break;
                    }
                }
            });
        };

        // Inicialização
        const init = () => {
            // Configurar data padrão
            if (!elements.dataRecebimento.value) {
                elements.dataRecebimento.valueAsDate = new Date();
            }
            
            // Configurar validação de protocolo
            setupProtocolValidation();
            
            // Configurar ordenação
            setupSorting();
            
            // Configurar event listeners
            setupEventListeners();
            
            // Atualizar timer
            updateTimerDisplay();
            
            // Aplicar filtros iniciais
            aplicarFiltros();
            
            // Restaurar timer se estava rodando
            if (localStorage.getItem('timer_was_running') === 'true') {
                startTimer();
            }
            
            // Salvar estado do timer ao sair
            window.addEventListener('beforeunload', () => {
                localStorage.setItem('timer_was_running', state.isTimerRunning);
            });
        };

        // Inicializar
        init();

        // Retornar API pública
        return {
            atualizarDashboard,
            aplicarFiltros,
            state
        };
    };

    // Módulo Contador
    const contadorApp = () => {
        if (!document.getElementById('tab-contador')) return {};

        const elements = {
            ambulatorioCount: document.getElementById('ambulatorio-count'),
            internacaoCount: document.getElementById('internacao-count'),
            totalCount: document.getElementById('total-count'),
            addAmbulatorioBtn: document.getElementById('add-ambulatorio-btn'),
            removeAmbulatorioBtn: document.getElementById('remove-ambulatorio-btn'),
            addInternacaoBtn: document.getElementById('add-internacao-btn'),
            removeInternacaoBtn: document.getElementById('remove-internacao-btn'),
            resetBtn: document.getElementById('reset-btn'),
            pdfBtn: document.getElementById('pdf-btn'),
            chartCanvas: document.getElementById('contadorChart')
        };

        const STORAGE_KEYS = {
            ambulatorio: 'contador_ambulatorio_v1',
            internacao: 'contador_internacao_v1'
        };

        let state = {
            ambulatorioCount: parseInt(localStorage.getItem(STORAGE_KEYS.ambulatorio)) || 0,
            internacaoCount: parseInt(localStorage.getItem(STORAGE_KEYS.internacao)) || 0,
            chart: null
        };

        // Utilitários
        const getCssVariable = (variable) => {
            return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
        };

        const saveState = () => {
            try {
                localStorage.setItem(STORAGE_KEYS.ambulatorio, state.ambulatorioCount);
                localStorage.setItem(STORAGE_KEYS.internacao, state.internacaoCount);
            } catch (error) {
                console.error('Erro ao salvar estado do contador:', error);
            }
        };

        const updateDisplay = () => {
            const total = state.ambulatorioCount + state.internacaoCount;
            
            elements.ambulatorioCount.textContent = state.ambulatorioCount;
            elements.internacaoCount.textContent = state.internacaoCount;
            elements.totalCount.textContent = total;
            
            // Atualizar aria-labels
            elements.ambulatorioCount.setAttribute('aria-label', `Contagem ambulatório: ${state.ambulatorioCount}`);
            elements.internacaoCount.setAttribute('aria-label', `Contagem internação: ${state.internacaoCount}`);
            elements.totalCount.setAttribute('aria-label', `Contagem total: ${total}`);
            
            updateChart();
            saveState();
        };

        // Plugin para fundo branco no PDF
        const whiteBackgroundPlugin = {
            id: 'whiteBackground',
            beforeDraw: (chart) => {
                if (chart.options.plugins.whiteBackground && chart.options.plugins.whiteBackground.enabled) {
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.globalCompositeOperation = 'destination-over';
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, chart.width, chart.height);
                    ctx.restore();
                }
            }
        };

const updateChart = (forPdf = false) => {
    if (state.chart) {
        state.chart.destroy();
    }
    
    const containerColor = getCssVariable('--cor-container');
    const ambulatorioColor = getCssVariable('--cor-ambulatório');
    const internacaoColor = getCssVariable('--cor-internação');
    
    // CORREÇÃO: Detectar se está no modo escuro e definir cor da legenda
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    const legendColor = forPdf ? '#000000' : (isDarkMode ? '#f1f5f9' : '#1e293b');
    
    const ctx = elements.chartCanvas.getContext('2d');
    
    // Configurar canvas para melhor qualidade no PDF
    if (forPdf) {
        const dpr = window.devicePixelRatio || 1;
        const rect = elements.chartCanvas.getBoundingClientRect();
        elements.chartCanvas.width = rect.width * dpr * 2;
        elements.chartCanvas.height = rect.height * dpr * 2;
        ctx.scale(dpr * 2, dpr * 2);
    }
    
    state.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ambulatório', 'Internação'],
            datasets: [{
                label: 'Quantidade',
                data: [state.ambulatorioCount, state.internacaoCount],
                backgroundColor: [ambulatorioColor, internacaoColor],
                borderColor: forPdf ? '#ffffff' : containerColor,
                borderWidth: forPdf ? 2 : 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Desativar animações para melhorar o desempenho
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: legendColor, // CORREÇÃO: Usar a cor correta da legenda
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                whiteBackground: {
                    enabled: forPdf
                }
            },
            elements: {
                arc: {
                    borderWidth: 3
                }
            }
        },
        plugins: forPdf ? [whiteBackgroundPlugin] : []
    });
};

// ADICIONAR TAMBÉM: Event listener para detectar mudança de tema
// Adicione este código após a inicialização do contador:

// Observar mudanças no tema para atualizar o gráfico
const themeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            // Reagendar a atualização do gráfico para o próximo frame
            setTimeout(() => {
                updateChart();
            }, 100);
        }
    });
});

// Iniciar observação das mudanças de classe no elemento html
themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
});
        const generatePDF = async () => {
            try {
                LoadingManager.show('Gerando relatório PDF...');
                
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF();
                
                // Configurações
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const margin = 20;
                
                // Título
                pdf.setFontSize(20);
                pdf.setFont(undefined, 'bold');
                pdf.text('RELATÓRIO DE DIGITALIZAÇÃO', pageWidth / 2, 30, { align: 'center' });
                
                // Data e hora
                pdf.setFontSize(12);
                pdf.setFont(undefined, 'normal');
                const now = new Date();
                const dateStr = now.toLocaleDateString('pt-BR');
                const timeStr = now.toLocaleTimeString('pt-BR');
                pdf.text(`Data: ${dateStr} - Hora: ${timeStr}`, margin, 50);
                
                // Dados
                const total = state.ambulatorioCount + state.internacaoCount;
                
                pdf.setFontSize(14);
                pdf.setFont(undefined, 'bold');
                pdf.text('RESUMO DA CONTAGEM:', margin, 70);
                
                pdf.setFont(undefined, 'normal');
                pdf.text(`Ambulatório: ${state.ambulatorioCount}`, margin + 10, 85);
                pdf.text(`Internação: ${state.internacaoCount}`, margin + 10, 100);
                
                pdf.setFont(undefined, 'bold');
                pdf.text(`TOTAL: ${total}`, margin + 10, 120);
                
                // Gráfico
                if (total > 0) {
                    // Criar canvas temporário maior para o PDF
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = 400;
                    tempCanvas.height = 400;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // ==================================================================
                    // INÍCIO DA CORREÇÃO: Usar as variáveis de cor do CSS no PDF
                    // ==================================================================
                    const ambulatorioColorPDF = getCssVariable('--cor-ambulatório');
                    const internacaoColorPDF = getCssVariable('--cor-internação');
                    // ==================================================================
                    // FIM DA CORREÇÃO
                    // ==================================================================
                    
                    // Criar gráfico temporário no canvas maior
                    const tempChart = new Chart(tempCtx, {
                        type: 'doughnut',
                        data: {
                            labels: ['Ambulatório', 'Internação'],
                            datasets: [{
                                label: 'Quantidade',
                                data: [state.ambulatorioCount, state.internacaoCount],
                                backgroundColor: [ambulatorioColorPDF, internacaoColorPDF], // Cores dinâmicas aplicadas
                                borderColor: '#ffffff',
                                borderWidth: 3
                            }]
                        },
                        options: {
                            responsive: false,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        color: '#000000',
                                        padding: 20,
                                        usePointStyle: true,
                                        font: {
                                            size: 16,
                                            weight: 'bold'
                                        }
                                    }
                                },
                                whiteBackground: {
                                    enabled: true
                                }
                            },
                            elements: {
                                arc: {
                                    borderWidth: 3
                                }
                            }
                        },
                        plugins: [whiteBackgroundPlugin]
                    });
                    
                    // Aguardar renderização
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    const chartImage = tempCanvas.toDataURL('image/png', 1.0);
                    const imgWidth = 120;
                    const imgHeight = 120;
                    const imgX = (pageWidth - imgWidth) / 2;
                    const imgY = 140;
                    
                    pdf.addImage(chartImage, 'PNG', imgX, imgY, imgWidth, imgHeight);
                    
                    // Limpar canvas temporário
                    tempChart.destroy();
                }
                
                // Rodapé
                pdf.setFontSize(10);
                pdf.setFont(undefined, 'italic');
                pdf.text('Gerado por PROTON v1.4 - Sistema de Controle de Protocolos', 
                    pageWidth / 2, pageHeight - 20, { align: 'center' });
                
                // Salvar PDF
                pdf.save(`relatorio-digitalizacao-${dateStr.replace(/\//g, '-')}.pdf`);
                
                showToast('success', 'PDF Gerado', 'Relatório foi gerado e baixado com sucesso!');
                
            } catch (error) {
                console.error('Erro ao gerar PDF:', error);
                showToast('error', 'Erro no PDF', 'Falha ao gerar o relatório PDF.');
            } finally {
                LoadingManager.hide();
            }
        };

        const resetCount = () => {
            if (confirm('Tem certeza que deseja zerar todas as contagens?\n\nEsta ação não pode ser desfeita.')) {
                state.ambulatorioCount = 0;
                state.internacaoCount = 0;
                updateDisplay();
                showToast('info', 'Contagem Zerada', 'Todas as contagens foram zeradas.');
            }
        };

        // Event listeners
        const setupEventListeners = () => {
            // Botões de ambulatório
            elements.addAmbulatorioBtn.addEventListener('click', () => {
                state.ambulatorioCount++;
                updateDisplay();
            });
            
            elements.removeAmbulatorioBtn.addEventListener('click', () => {
                if (state.ambulatorioCount > 0) {
                    state.ambulatorioCount--;
                    updateDisplay();
                }
            });
            
            // Botões de internação
            elements.addInternacaoBtn.addEventListener('click', () => {
                state.internacaoCount++;
                updateDisplay();
            });
            
            elements.removeInternacaoBtn.addEventListener('click', () => {
                if (state.internacaoCount > 0) {
                    state.internacaoCount--;
                    updateDisplay();
                }
            });
            
            // Botões de ação
            elements.resetBtn.addEventListener('click', resetCount);
            elements.pdfBtn.addEventListener('click', generatePDF);
            
            // Atalhos de teclado
            document.addEventListener('keydown', (e) => {
                if (document.querySelector('.modal[style*="display: block"]')) return;
                
                if (e.altKey && document.getElementById('tab-contador').classList.contains('active')) {
                    switch(e.key.toLowerCase()) {
                        case 'a':
                            e.preventDefault();
                            elements.addAmbulatorioBtn.click();
                            break;
                        case 'i':
                            e.preventDefault();
                            elements.addInternacaoBtn.click();
                            break;
                        case 'r':
                            e.preventDefault();
                            resetCount();
                            break;
                    }
                }
            });
        };

        // Inicialização
        const init = () => {
            updateDisplay();
            setupEventListeners();
        };

        init();

        return {
            updateDisplay,
            state
        };
    };

    // Inicializar aplicação quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }

})();
