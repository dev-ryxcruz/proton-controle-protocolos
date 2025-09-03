document.addEventListener('DOMContentLoaded', () => {
    // Referências a todos os elementos
    const elements = {
        dataRecebimento: document.getElementById('dataRecebimento'),
        numProtocolo: document.getElementById('numProtocolo'),
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
        themeSwitch: document.getElementById('checkbox'),
        searchInput: document.getElementById('searchInput'),
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
    
    let tipoDocumentoChart;
    let baseDeDados = JSON.parse(localStorage.getItem('documentosDB_pro_v1')) || [];
    let dadosFiltrados = [...baseDeDados];
    let atividades = JSON.parse(localStorage.getItem('atividades_pro_v1')) || [];
    let timerInterval;
    let timerSeconds = parseInt(localStorage.getItem('timer_seconds')) || 0;
    let isTimerRunning = false;

    /**
     * Formata uma string de data 'YYYY-MM-DD' para 'DD/MM/YYYY' sem conversão de fuso horário.
     * @param {string} dataString A data no formato 'YYYY-MM-DD'.
     * @returns {string} A data formatada como 'DD/MM/YYYY'.
     */
    const formatarDataBR = (dataString) => {
        if (!dataString || !dataString.includes('-')) {
            return ''; // Retorna vazio se a data for inválida
        }
        const [ano, mes, dia] = dataString.split('-');
        return `${dia}/${mes}/${ano}`;
    };

    const salvarDados = () => {
        localStorage.setItem('documentosDB_pro_v1', JSON.stringify(baseDeDados));
        localStorage.setItem('atividades_pro_v1', JSON.stringify(atividades));
    };

    // Sistema de Toast Notifications
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
        toast.innerHTML = `
            <div class="toast-icon"><i class="${icons[type]}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;
        toastContainer.appendChild(toast);
        
        const autoRemove = setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            toast.style.animation = 'toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse';
            setTimeout(() => toast.remove(), 300);
        });
    };

    // Sistema de Atividades
    const addActivity = (type, action, details = '') => {
        const activity = {
            id: Date.now(),
            type,
            action,
            details,
            timestamp: new Date().toLocaleString('pt-BR')
        };
        atividades.unshift(activity);
        if (atividades.length > 100) atividades.pop();
        salvarDados();
    };

    const renderActivities = () => {
        const activityList = elements.activityList;
        activityList.innerHTML = '';
        if (atividades.length === 0) {
            activityList.innerHTML = '<p style="color: #64748b; text-align: center;">Nenhuma atividade registrada ainda.</p>';
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
        atividades.slice(0, 20).forEach(activity => {
            const activityEl = document.createElement('div');
            activityEl.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--cor-borda);';
            activityEl.innerHTML = `
                <i class="${icons[activity.type] || 'fas fa-info'}" style="width: 20px;"></i>
                <div style="flex-grow: 1;">
                    <strong>${activity.action}</strong>
                    ${activity.details ? `<br><small style="color: #64748b;">${activity.details}</small>` : ''}
                </div>
                <small style="color: #64748b; white-space: nowrap;">${activity.timestamp}</small>
            `;
            activityList.appendChild(activityEl);
        });
    };

    // Timer de Produtividade
    const updateTimerDisplay = () => {
        const hours = Math.floor(timerSeconds / 3600);
        const minutes = Math.floor((timerSeconds % 3600) / 60);
        const seconds = timerSeconds % 60;
        elements.timerDisplay.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const startTimer = () => {
        if (!isTimerRunning) {
            isTimerRunning = true;
            elements.timerIcon.className = 'fas fa-pause';
            showToast('info', 'Timer Iniciado', 'Cronômetro de produtividade ativado!');
            timerInterval = setInterval(() => {
                timerSeconds++;
                updateTimerDisplay();
                localStorage.setItem('timer_seconds', timerSeconds);
            }, 1000);
        }
    };

    const pauseTimer = () => {
        if (isTimerRunning) {
            isTimerRunning = false;
            elements.timerIcon.className = 'fas fa-play';
            clearInterval(timerInterval);
            showToast('warning', 'Timer Pausado', 'Cronômetro pausado.');
        }
    };

    const resetTimer = () => {
        if (isTimerRunning) {
            pauseTimer();
        }
        
        if (confirm('Tem certeza que deseja reiniciar o cronômetro? O tempo será zerado.')) {
            timerSeconds = 0;
            localStorage.removeItem('timer_seconds');
            updateTimerDisplay();
            showToast('info', 'Cronômetro Reiniciado', 'O tempo foi zerado com sucesso.');
        }
    };

    elements.timerToggle.addEventListener('click', () => {
        if (isTimerRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    });
   elements.timerReset.addEventListener('click', resetTimer);

    // Atalhos de Teclado
    const toggleShortcuts = () => {
        elements.keyboardShortcuts.classList.toggle('visible');
    };

    elements.btnShowShortcuts.addEventListener('click', toggleShortcuts);

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            switch(e.key) {
                case 'a':
                case 'A':
                    e.preventDefault();
                    elements.numProtocolo.focus();
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    elements.searchInput.focus();
                    break;
                case 'e':
                case 'E':
                    e.preventDefault();
                    gerarExcel();
                    break;
                case 'd':
                case 'D':
                    e.preventDefault();
                    elements.themeSwitch.click();
                    break;
                case '?':
                    e.preventDefault();
                    toggleShortcuts();
                    break;
            }
        }
    });

    // Configuração de campos fixáveis
    const setupFixableField = (inputEl, fixBtn, changeBtn, storageKey) => {
        const fixValue = () => {
            if (!inputEl.value) {
                showToast('warning', 'Campo Vazio', `Por favor, preencha o campo "${inputEl.labels[0].textContent}" para fixar.`);
                return;
            }
            inputEl.disabled = true;
            fixBtn.style.display = 'none';
            changeBtn.style.display = 'inline-block';
            localStorage.setItem(storageKey, inputEl.value);
            showToast('success', 'Campo Fixado', `${inputEl.labels[0].textContent} fixado com sucesso!`);
        };
        const changeValue = () => {
            inputEl.disabled = false;
            fixBtn.style.display = 'inline-block';
            changeBtn.style.display = 'none';
            localStorage.removeItem(storageKey);
            inputEl.focus();
            showToast('info', 'Campo Liberado', `${inputEl.labels[0].textContent} liberado para edição.`);
        };
        const loadFixedValue = () => {
            const val = localStorage.getItem(storageKey);
            if (val) {
                inputEl.value = val;
                fixValue();
            }
        };

        fixBtn.addEventListener('click', fixValue);
        changeBtn.addEventListener('click', changeValue);
        loadFixedValue();
    };

    setupFixableField(elements.conferente, elements.btnFixarConferente, elements.btnTrocarConferente, 'conferenteFixo_pro_v1');
    setupFixableField(elements.convenio, elements.btnFixarConvenio, elements.btnTrocarConvenio, 'convenioFixo_pro_v1');

    // Validação de protocolo
    const validarProtocolo = (protocolo) => {
        if (!protocolo || protocolo.trim() === '') {
            return { valido: false, erro: 'Protocolo não pode estar vazio.' };
        }
        
        if (!/^\d+$/.test(protocolo.trim())) {
            return { valido: false, erro: 'Protocolo deve conter apenas números.' };
        }
        
        if (protocolo.trim().length < 3) {
            return { valido: false, erro: 'Protocolo deve ter pelo menos 3 dígitos.' };
        }
        
        if (baseDeDados.some(item => item.protocolo === protocolo.trim())) {
            return { valido: false, erro: 'Protocolo já existe na fila.' };
        }
        
        return { valido: true };
    };

    // Atualizar dashboard
    const atualizarDashboard = () => {
        const total = dadosFiltrados.length;
        const processados = dadosFiltrados.filter(item => item.status === 'Baixado').length;
        const pendentes = total - processados;
        const taxa = total > 0 ? Math.round((processados / total) * 100) : 0;

        elements.statTotal.textContent = total;
        elements.statProcessados.textContent = processados;
        elements.statPendentes.textContent = pendentes;
        elements.statTaxa.textContent = `${taxa}%`;

        elements.progressBar.style.width = `${taxa}%`;
        elements.progressBar.textContent = `${taxa}%`;

        const convenios = [...new Set(baseDeDados.map(item => item.convenio))];
        elements.filterConvenio.innerHTML = '<option value="">Todos os Convênios</option>';
        convenios.forEach(convenio => {
            const option = document.createElement('option');
            option.value = convenio;
            option.textContent = convenio;
            elements.filterConvenio.appendChild(option);
        });

        const contagemTipos = { Ambulatorio: 0, CDI: 0, UE: 0, Internacao: 0 };
        dadosFiltrados.filter(item => item.status === 'Baixado').forEach(item => {
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

        if (tipoDocumentoChart) tipoDocumentoChart.destroy();
        if (data.length > 0) {
            tipoDocumentoChart = new Chart(elements.chartCanvas, {
                type: 'doughnut',
                data: {
                    labels: labels.map(l => l === 'Ambulatorio' ? 'Ambulatório' : l === 'Internacao' ? 'Internação' : l),
                    datasets: [{
                        data: data,
                        backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'],
                        borderColor: document.documentElement.classList.contains('dark-mode') ? '#1e293b' : '#ffffff',
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
                                color: document.documentElement.classList.contains('dark-mode') ? '#f1f5f9' : '#1e293b',
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        }
    };

    // Aplicar filtros
    const aplicarFiltros = () => {
        const searchTerm = elements.searchInput.value.toLowerCase();
        const statusFilter = elements.filterStatus.value;
        const convenioFilter = elements.filterConvenio.value;
        const dateFilter = elements.filterDate.value;

        dadosFiltrados = baseDeDados.filter(item => {
            const matchSearch = !searchTerm || 
                item.protocolo.toLowerCase().includes(searchTerm) ||
                item.convenio.toLowerCase().includes(searchTerm) ||
                item.status.toLowerCase().includes(searchTerm);
            
            const matchStatus = !statusFilter || item.status === statusFilter;
            const matchConvenio = !convenioFilter || item.convenio === convenioFilter;
            const matchDate = !dateFilter || item.dataRecebimento === dateFilter;

            return matchSearch && matchStatus && matchConvenio && matchDate;
        });
        renderizarTabela();
        atualizarDashboard();
    };

    // Event listeners para filtros
    elements.searchInput.addEventListener('input', aplicarFiltros);
    elements.filterStatus.addEventListener('change', aplicarFiltros);
    elements.filterConvenio.addEventListener('change', aplicarFiltros);
    elements.filterDate.addEventListener('change', aplicarFiltros);
    
    elements.btnClearFilters.addEventListener('click', () => {
        elements.searchInput.value = '';
        elements.filterStatus.value = '';
        elements.filterConvenio.value = '';
        elements.filterDate.value = '';
        aplicarFiltros();
        showToast('info', 'Filtros Limpos', 'Todos os filtros foram removidos.');
    });

    // Renderizar tabela
    const renderizarTabela = () => {
        elements.tabelaCorpo.innerHTML = '';
        elements.mensagemVazia.style.display = dadosFiltrados.length === 0 ? 'block' : 'none';

        dadosFiltrados.forEach((item, index) => {
            const tr = document.createElement('tr');
            if (item.status === 'Baixado') tr.classList.add('status-baixado');

            const convenioColor = {
                'Unimed': '#3b82f6',
                'Intercâmbio': '#ef4444',
                'Convênio Externo': '#f59e0b',
                'Particular': '#10b981',
                'Internação': '#8b5cf6'
            };

            tr.innerHTML = `
                <td>${item.protocolo}</td>
                <td><span style="background: ${convenioColor[item.convenio] || '#64748b'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${item.convenio}</span></td>
                <td class="status-display">
                    <i class="fas ${item.status === 'Baixado' ? 'fa-check-circle' : 'fa-clock'}"></i>
                    ${item.status}
                </td>
                <td>${formatarDataBR(item.dataRecebimento)}</td>
                <td class="action-buttons" id="acao-cell-${index}"></td>
            `;
            elements.tabelaCorpo.appendChild(tr);

            const acaoCell = document.getElementById(`acao-cell-${index}`);
            
            if (item.status === 'Baixado') {
                acaoCell.innerHTML = `
                    <button class="btn-warning" onclick="editarProtocolo(${baseDeDados.indexOf(item)})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger" onclick="removerProtocolo(${baseDeDados.indexOf(item)})" title="Remover">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
            } else {
                acaoCell.innerHTML = `
                    <button class="btn-success" onclick="conferirProtocolo(${baseDeDados.indexOf(item)})" title="Conferir">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-warning" onclick="editarProtocolo(${baseDeDados.indexOf(item)})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger" onclick="removerProtocolo(${baseDeDados.indexOf(item)})" title="Remover">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
            }
        });
    };

    // Funções globais para os botões da tabela
    window.conferirProtocolo = (index) => {
        const item = baseDeDados[index];
        elements.conferenciaForm.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div class="form-group">
                    <label>Ambulatório</label>
                    <input type="number" id="qtd-ambulatorio" min="0" value="0">
                </div>
                <div class="form-group">
                    <label>CDI</label>
                    <input type="number" id="qtd-cdi" min="0" value="0">
                </div>
                <div class="form-group">
                    <label>UE</label>
                    <input type="number" id="qtd-ue" min="0" value="0">
                </div>
                <div class="form-group">
                    <label>Internação</label>
                    <input type="number" id="qtd-internacao" min="0" value="0">
                </div>
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea id="observacoes" rows="3" placeholder="Observações sobre a conferência..."></textarea>
            </div>
            <div class="actions">
                <button class="btn-success" onclick="salvarConferencia(${index})">
                    <i class="fas fa-save"></i> Salvar Conferência
                </button>
            </div>
        `;
        elements.modalConferencia.style.display = 'block';
        document.getElementById('qtd-ambulatorio').focus();
    };

    window.salvarConferencia = (index) => {
        const ambulatorio = parseInt(document.getElementById('qtd-ambulatorio').value) || 0;
        const cdi = parseInt(document.getElementById('qtd-cdi').value) || 0;
        const ue = parseInt(document.getElementById('qtd-ue').value) || 0;
        const internacao = parseInt(document.getElementById('qtd-internacao').value) || 0;
        const observacoes = document.getElementById('observacoes').value;

        const total = ambulatorio + cdi + ue + internacao;
        if (total === 0) {
            showToast('warning', 'Quantidade Inválida', 'Pelo menos um tipo de documento deve ter quantidade maior que zero.');
            return;
        }

        baseDeDados[index].status = 'Baixado';
        baseDeDados[index].quantidades = {
            Ambulatorio: ambulatorio,
            CDI: cdi,
            UE: ue,
            Internacao: internacao
        };
        baseDeDados[index].observacoes = observacoes;
        baseDeDados[index].conferente = elements.conferente.value;
        baseDeDados[index].dataConferencia = new Date().toISOString();

        salvarDados();
        aplicarFiltros();
        elements.modalConferencia.style.display = 'none';
        showToast('success', 'Protocolo Conferido', `Protocolo ${baseDeDados[index].protocolo} conferido com sucesso!`);
        addActivity('conference', `Protocolo ${baseDeDados[index].protocolo} conferido`, `Total: ${total} documentos`);
    };

    window.editarProtocolo = (index) => {
        const item = baseDeDados[index];
        const novoProtocolo = prompt('Editar número do protocolo:', item.protocolo);
        
        if (novoProtocolo && novoProtocolo !== item.protocolo) {
            const validacao = validarProtocolo(novoProtocolo);
            if (!validacao.valido) {
                showToast('error', 'Erro na Validação', validacao.erro);
                return;
            }
            
            const protocoloAntigo = item.protocolo;
            item.protocolo = novoProtocolo.trim();
            salvarDados();
            aplicarFiltros();
            
            showToast('success', 'Protocolo Editado', `Protocolo alterado de ${protocoloAntigo} para ${novoProtocolo}`);
            addActivity('edit', `Protocolo editado: ${protocoloAntigo} → ${novoProtocolo}`);
        }
    };

    window.removerProtocolo = (index) => {
        const item = baseDeDados[index];
        if (confirm(`Tem certeza que deseja remover o protocolo ${item.protocolo}?`)) {
            baseDeDados.splice(index, 1);
            salvarDados();
            aplicarFiltros();
            
            showToast('success', 'Protocolo Removido', `Protocolo ${item.protocolo} removido com sucesso!`);
            addActivity('delete', `Protocolo ${item.protocolo} removido`);
        }
    };

    // Adicionar protocolo
    const adicionarProtocolo = () => {
        const protocolo = elements.numProtocolo.value.trim();
        const convenio = elements.convenio.value;
        const dataRecebimento = elements.dataRecebimento.value;

        if (!convenio) {
            showToast('warning', 'Convênio Obrigatório', 'Por favor, selecione um convênio antes de adicionar protocolos.');
            elements.convenio.focus();
            return;
        }

        if (!dataRecebimento) {
            showToast('warning', 'Data Obrigatória', 'Por favor, defina a data de referência dos protocolos.');
            elements.dataRecebimento.focus();
            return;
        }

        const validacao = validarProtocolo(protocolo);
        if (!validacao.valido) {
            showToast('error', 'Erro na Validação', validacao.erro);
            elements.numProtocolo.focus();
            return;
        }

        const novoItem = {
            protocolo: protocolo,
            convenio: convenio,
            status: 'Pendente',
            dataRecebimento: dataRecebimento,
            dataAdicao: new Date().toISOString()
        };
        baseDeDados.push(novoItem);
        elements.numProtocolo.value = '';
        salvarDados();
        aplicarFiltros();
        elements.numProtocolo.focus();

        showToast('success', 'Protocolo Adicionado', `Protocolo ${protocolo} adicionado com sucesso!`);
        addActivity('add', `Protocolo ${protocolo} adicionado`, `Convênio: ${convenio}`);
    };

    elements.btnAdicionar.addEventListener('click', adicionarProtocolo);
    elements.numProtocolo.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') adicionarProtocolo();
    });

    // Modal de lote
    elements.btnAbrirModalLote.addEventListener('click', () => {
        elements.modalLote.style.display = 'block';
        elements.listaProtocolosLote.focus();
    });
    elements.fecharModal.addEventListener('click', () => {
        elements.modalLote.style.display = 'none';
    });
    elements.fecharModalConferencia.addEventListener('click', () => {
        elements.modalConferencia.style.display = 'none';
    });
    window.addEventListener('click', (e) => {
        if (e.target === elements.modalLote) {
            elements.modalLote.style.display = 'none';
        }
        if (e.target === elements.modalConferencia) {
            elements.modalConferencia.style.display = 'none';
        }
    });
    elements.btnConfirmarLote.addEventListener('click', () => {
        const convenio = elements.convenio.value;
        const dataRecebimento = elements.dataRecebimento.value;
        const listaProtocolos = elements.listaProtocolosLote.value.trim();

        if (!convenio) {
            showToast('warning', 'Convênio Obrigatório', 'Por favor, selecione um convênio antes de adicionar protocolos.');
            return;
        }

        if (!dataRecebimento) {
            showToast('warning', 'Data Obrigatória', 'Por favor, defina a data de referência dos protocolos.');
            return;
        }

        if (!listaProtocolos) {
            showToast('warning', 'Lista Vazia', 'Por favor, digite os protocolos na lista.');
            return;
        }

        const protocolos = listaProtocolos.split('\n').map(p => p.trim()).filter(p => p);
        const protocolosValidos = [];
        const protocolosInvalidos = [];

        protocolos.forEach(protocolo => {
            const validacao = validarProtocolo(protocolo);
            if (validacao.valido) {
                protocolosValidos.push(protocolo);
            } else {
                protocolosInvalidos.push(`${protocolo}: ${validacao.erro}`);
            }
        });

        if (protocolosInvalidos.length > 0) {
            showToast('error', 'Protocolos Inválidos', `${protocolosInvalidos.length} protocolos inválidos encontrados. Verifique a lista.`);
            return;
        }

        if (protocolosValidos.length === 0) {
            showToast('warning', 'Nenhum Protocolo Válido', 'Nenhum protocolo válido encontrado na lista.');
            return;
        }

        protocolosValidos.forEach(protocolo => {
            const novoItem = {
                protocolo: protocolo,
                convenio: convenio,
                status: 'Pendente',
                dataRecebimento: dataRecebimento,
                dataAdicao: new Date().toISOString()
            };
            baseDeDados.push(novoItem);
        });
        elements.listaProtocolosLote.value = '';
        elements.modalLote.style.display = 'none';
        salvarDados();
        aplicarFiltros();

        showToast('success', 'Lote Adicionado', `${protocolosValidos.length} protocolos adicionados com sucesso!`);
        addActivity('add', `Lote adicionado: ${protocolosValidos.length} protocolos`, `Convênio: ${convenio}`);
    });

    // Função para gerar Excel
    const gerarExcel = async () => {
        if (baseDeDados.length === 0) {
            showToast('warning', 'Sem Dados', 'Não há protocolos para exportar.');
            return;
        }
        
        showToast('info', 'Gerando Excel', 'Preparando planilha para download...');
        try {
            const itensParaExportar = baseDeDados.filter(item => item.status === 'Baixado');
            if (itensParaExportar.length === 0) {
                showToast('warning', 'Sem Dados Processados', 'Não há protocolos processados para exportar.');
                return;
            }
            
            const dataReferencia = formatarDataBR(elements.dataRecebimento.value) || new Date().toLocaleDateString('pt-BR');
            const nomeResponsavel = elements.conferente.value || 'Não informado';
            
            const workbook = new ExcelJS.Workbook();
            const tiposDeDocumento = { Ambulatorio: 'Ambulatório', CDI: 'CDI', UE: 'Ficha UE', Internacao: 'Internação' };
            
            for (const tipo in tiposDeDocumento) {
                const nomeAba = tiposDeDocumento[tipo];
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
                    ws.columns = [ { width: 20 }, { width: 12 }, { width: 12 }, { width: 45 } ];
                    
                    ws.mergeCells('A1:D1');
                    const tituloCell = ws.getCell('A1');
                    tituloCell.value = 'CONTROLE DE RECEBIMENTO - PROTOCOLO MOVDOC';
                    tituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
                    tituloCell.font = { bold: true, size: 14 };
                    tituloCell.border = { top: {style: 'thin'}, left: {style: 'thin'}, right: {style: 'thin'}, bottom: {style: 'thin'} };
                    
                    ws.mergeCells('A2:B2');
                    const dataCell = ws.getCell('A2');
                    dataCell.value = `DATA: ${dataReferencia}`;
                    dataCell.font = { bold: true, size: 12 };
                    dataCell.border = { top: {style: 'thin'}, left: {style: 'thin'}, right: {style: 'thin'}, bottom: {style: 'thin'} };
                    
                    ws.mergeCells('C2:D2');
                    const nomeCell = ws.getCell('C2');
                    nomeCell.value = `RESPONSÁVEL: ${nomeResponsavel}`;
                    nomeCell.font = { bold: true, size: 12 };
                    nomeCell.border = { top: {style: 'thin'}, left: {style: 'thin'}, right: {style: 'thin'}, bottom: {style: 'thin'} };
                    
                    const cabecalho = ['PROTOCOLO', 'TIPO', 'QUANT.', 'OBSERVAÇÃO'];
                    const headerRow = ws.addRow(cabecalho);
                    headerRow.eachCell((cell) => {
                        cell.font = { bold: true }; 
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                        cell.border = { top: {style: 'thin'}, left: {style: 'thin'}, right: {style: 'thin'}, bottom: {style: 'thin'} };
                    });
                    
                    dadosFiltrados.forEach(dado => {
                        const row = ws.addRow([dado.protocolo, dado.tipo, dado.quantidade, dado.observacao]);
                        row.eachCell((cell) => { 
                            cell.border = { top: {style: 'thin'}, left: {style: 'thin'}, right: {style: 'thin'}, bottom: {style: 'thin'} }; 
                        });
                    });
                }
            }
            
            if (workbook.worksheets.length === 0) { 
                showToast('warning', 'Sem Dados', 'Nenhum item com quantidade maior que zero foi encontrado para gerar o relatório.');
                return; 
            }
            
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Relatorio_MOVDOC_${dataReferencia.replace(/\//g, '-')}.xlsx`;
            link.click();
            
            showToast('success', 'Excel Gerado', 'Planilha exportada com sucesso no formato padrão!');
            addActivity('export', 'Planilha Excel gerada', `${itensParaExportar.length} registros exportados`);
        } catch (error) {
            console.error('Erro ao gerar Excel:', error);
            showToast('error', 'Erro na Exportação', 'Erro ao gerar planilha Excel.');
        }
    };

    // Função para backup
    const fazerBackup = () => {
        const dadosBackup = {
            versao: 'pro_v1',
            timestamp: new Date().toISOString(),
            dados: baseDeDados,
            atividades: atividades,
            configuracoes: {
                conferente: localStorage.getItem('conferenteFixo_pro_v1'),
                convenio: localStorage.getItem('convenioFixo_pro_v1'),
                tema: localStorage.getItem('theme'),
                timerSeconds: localStorage.getItem('timer_seconds')
            }
        };
        const blob = new Blob([JSON.stringify(dadosBackup, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup-controle-documentos-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        showToast('success', 'Backup Criado', 'Backup dos dados criado com sucesso!');
        addActivity('backup', 'Backup de dados criado', `${baseDeDados.length} registros salvos`);
    };

    // Função para restaurar backup
    const restaurarBackup = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dadosBackup = JSON.parse(e.target.result);
                if (!dadosBackup.versao || !dadosBackup.dados) {
                    showToast('error', 'Arquivo Inválido', 'Arquivo de backup inválido ou corrompido.');
                    return;
                }

                if (confirm('Tem certeza que deseja restaurar o backup? Todos os dados atuais serão substituídos.')) {
                    baseDeDados = dadosBackup.dados || [];
                    atividades = dadosBackup.atividades || [];
                    
                    if (dadosBackup.configuracoes) {
                        if (dadosBackup.configuracoes.conferente) {
                            localStorage.setItem('conferenteFixo_pro_v1', dadosBackup.configuracoes.conferente);
                        }
                        if (dadosBackup.configuracoes.convenio) {
                            localStorage.setItem('convenioFixo_pro_v1', dadosBackup.configuracoes.convenio);
                        }
                        if (dadosBackup.configuracoes.tema) {
                            localStorage.setItem('theme', dadosBackup.configuracoes.tema);
                        }
                        if (dadosBackup.configuracoes.timerSeconds) {
                            localStorage.setItem('timer_seconds', dadosBackup.configuracoes.timerSeconds);
                            timerSeconds = parseInt(dadosBackup.configuracoes.timerSeconds);
                            updateTimerDisplay();
                        }
                    }

                    salvarDados();
                    aplicarFiltros();
                    location.reload();

                    showToast('success', 'Backup Restaurado', 'Dados restaurados com sucesso!');
                    addActivity('restore', 'Backup restaurado', `${baseDeDados.length} registros carregados`);
                }
            } catch (error) {
                showToast('error', 'Erro no Backup', 'Erro ao processar arquivo de backup.');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    elements.btnGerarExcel.addEventListener('click', gerarExcel);
    elements.btnBackup.addEventListener('click', fazerBackup);
    elements.btnRestore.addEventListener('click', () => elements.fileRestore.click());
    elements.fileRestore.addEventListener('change', restaurarBackup);

    // Histórico de atividades
    elements.btnShowHistory.addEventListener('click', () => {
        const isVisible = elements.activityHistory.style.display !== 'none';
        elements.activityHistory.style.display = isVisible ? 'none' : 'block';
        elements.btnShowHistory.innerHTML = isVisible ? 
            '<i class="fas fa-history"></i> Mostrar Histórico de Atividades' : 
            '<i class="fas fa-eye-slash"></i> Ocultar Histórico de Atividades';
        
        if (!isVisible) {
            renderActivities();
        }
    });

    // Limpar dados
    elements.btnLimpar.addEventListener('click', () => {
        if (confirm('ATENÇÃO! Isso apagará TODOS os protocolos da fila. Deseja continuar?')) {
            if (confirm('SEGUNDO AVISO: A ação é irreversível. Confirmar exclusão?')) {
                baseDeDados = [];
                atividades = [];
                salvarDados();
                aplicarFiltros();
                showToast('success', 'Dados Limpos', 'Todos os dados foram removidos com sucesso!');
                addActivity('clear', 'Todos os dados foram limpos');
            }
        }
    });

    // Tema escuro
    elements.themeSwitch.addEventListener('change', () => {
        if (elements.themeSwitch.checked) {
            document.documentElement.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
        atualizarDashboard();
    });

    // Carregar tema
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark-mode');
        elements.themeSwitch.checked = true;
    }

    // Inicialização
    elements.dataRecebimento.valueAsDate = new Date();
    updateTimerDisplay();
    aplicarFiltros();

    if (localStorage.getItem('timer_was_running') === 'true') {
        startTimer();
    }

    window.addEventListener('beforeunload', () => {
        localStorage.setItem('timer_was_running', isTimerRunning);
    });
});
