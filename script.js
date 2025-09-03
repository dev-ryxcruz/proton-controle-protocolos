(function() {
    // --- LÓGICA DAS ABAS ---
    const setupTabs = () => {
        const tabLinks = document.querySelectorAll('.tab-link');
        const tabContents = document.querySelectorAll('.tab-content');
        const protonShortcuts = document.getElementById('proton-shortcuts');
        const contadorShortcuts = document.getElementById('contador-shortcuts');

        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                const tabId = link.getAttribute('data-tab');

                tabLinks.forEach(item => item.classList.remove('active'));
                tabContents.forEach(item => item.classList.remove('active'));

                link.classList.add('active');
                document.getElementById(tabId).classList.add('active');
                
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

    // --- LÓGICA DO PROTON ---
    const protonApp = () => {
        if (!document.getElementById('tab-proton')) return;
        
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

        const formatarDataBR = (dataString) => {
            if (!dataString || !dataString.includes('-')) return '';
            const [ano, mes, dia] = dataString.split('-');
            return `${dia}/${mes}/${ano}`;
        };

        const salvarDados = () => {
            localStorage.setItem('documentosDB_pro_v1', JSON.stringify(baseDeDados));
            localStorage.setItem('atividades_pro_v1', JSON.stringify(atividades));
        };

        const showToast = (type, title, message, duration = 4000) => {
            const toastContainer = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            const icons = { success: 'fas fa-check-circle', error: 'fas fa-exclamation-circle', warning: 'fas fa-exclamation-triangle', info: 'fas fa-info-circle' };
            toast.innerHTML = `<div class="toast-icon"><i class="${icons[type]}"></i></div><div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div><button class="toast-close"><i class="fas fa-times"></i></button>`;
            toastContainer.appendChild(toast);
            const autoRemove = setTimeout(() => { if (toast.parentNode) { toast.style.animation = 'toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse'; setTimeout(() => toast.remove(), 300); } }, duration);
            toast.querySelector('.toast-close').addEventListener('click', () => { clearTimeout(autoRemove); toast.style.animation = 'toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse'; setTimeout(() => toast.remove(), 300); });
        };
        
        const addActivity = (type, action, details = '') => {
            const activity = { id: Date.now(), type, action, details, timestamp: new Date().toLocaleString('pt-BR') };
            atividades.unshift(activity);
            if (atividades.length > 100) atividades.pop();
            salvarDados();
        };

        const renderActivities = () => {
            if (!elements.activityList) return;
            elements.activityList.innerHTML = '';
            if (atividades.length === 0) {
                elements.activityList.innerHTML = '<p style="color: #64748b; text-align: center;">Nenhuma atividade registrada ainda.</p>';
                return;
            }
            const icons = { add: 'fas fa-plus text-success', edit: 'fas fa-edit text-warning', delete: 'fas fa-trash text-danger', conference: 'fas fa-check text-success', export: 'fas fa-file-excel text-info', backup: 'fas fa-download text-info', restore: 'fas fa-upload text-warning', clear: 'fas fa-trash-alt text-danger' };
            atividades.slice(0, 20).forEach(activity => {
                const activityEl = document.createElement('div');
                activityEl.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--cor-borda);';
                activityEl.innerHTML = `<i class="${icons[activity.type] || 'fas fa-info'}" style="width: 20px;"></i><div style="flex-grow: 1;"><strong>${activity.action}</strong>${activity.details ? `<br><small style="color: #64748b;">${activity.details}</small>` : ''}</div><small style="color: #64748b; white-space: nowrap;">${activity.timestamp}</small>`;
                elements.activityList.appendChild(activityEl);
            });
        };

        const updateTimerDisplay = () => {
            const hours = Math.floor(timerSeconds / 3600);
            const minutes = Math.floor((timerSeconds % 3600) / 60);
            const seconds = timerSeconds % 60;
            elements.timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        const startTimer = () => {
            if (isTimerRunning) return;
            isTimerRunning = true;
            elements.timerIcon.className = 'fas fa-pause';
            showToast('info', 'Timer Iniciado', 'Cronômetro de produtividade ativado!');
            timerInterval = setInterval(() => { timerSeconds++; updateTimerDisplay(); localStorage.setItem('timer_seconds', timerSeconds); }, 1000);
        };

        const pauseTimer = () => {
            if (!isTimerRunning) return;
            isTimerRunning = false;
            elements.timerIcon.className = 'fas fa-play';
            clearInterval(timerInterval);
            showToast('warning', 'Timer Pausado', 'Cronômetro pausado.');
        };

        const resetTimer = () => {
            if (isTimerRunning) pauseTimer();
            if (confirm('Tem certeza que deseja reiniciar o cronômetro?')) {
                timerSeconds = 0;
                localStorage.removeItem('timer_seconds');
                updateTimerDisplay();
                showToast('info', 'Cronômetro Reiniciado', 'O tempo foi zerado.');
            }
        };

        elements.timerToggle.addEventListener('click', () => isTimerRunning ? pauseTimer() : startTimer());
        elements.timerReset.addEventListener('click', resetTimer);

        elements.btnShowShortcuts.addEventListener('click', () => elements.keyboardShortcuts.classList.toggle('visible'));

        const setupFixableField = (inputEl, fixBtn, changeBtn, storageKey) => {
            const fixValue = () => {
                if (!inputEl.value) { showToast('warning', 'Campo Vazio', `Preencha o campo "${inputEl.labels[0].textContent}" para fixar.`); return; }
                inputEl.disabled = true;
                fixBtn.style.display = 'none';
                changeBtn.style.display = 'inline-block';
                localStorage.setItem(storageKey, inputEl.value);
                showToast('success', 'Campo Fixado', `${inputEl.labels[0].textContent} fixado.`);
            };
            const changeValue = () => {
                inputEl.disabled = false;
                fixBtn.style.display = 'inline-block';
                changeBtn.style.display = 'none';
                localStorage.removeItem(storageKey);
                inputEl.focus();
                showToast('info', 'Campo Liberado', `${inputEl.labels[0].textContent} liberado.`);
            };
            const loadFixedValue = () => { const val = localStorage.getItem(storageKey); if (val) { inputEl.value = val; fixValue(); } };
            fixBtn.addEventListener('click', fixValue);
            changeBtn.addEventListener('click', changeValue);
            loadFixedValue();
        };
        setupFixableField(elements.conferente, elements.btnFixarConferente, elements.btnTrocarConferente, 'conferenteFixo_pro_v1');
        setupFixableField(elements.convenio, elements.btnFixarConvenio, elements.btnTrocarConvenio, 'convenioFixo_pro_v1');

        const validarProtocolo = (protocolo) => {
            if (!protocolo || protocolo.trim() === '') return { valido: false, erro: 'Protocolo não pode estar vazio.' };
            if (!/^\d+$/.test(protocolo.trim())) return { valido: false, erro: 'Protocolo deve conter apenas números.' };
            if (protocolo.trim().length < 3) return { valido: false, erro: 'Protocolo deve ter pelo menos 3 dígitos.' };
            if (baseDeDados.some(item => item.protocolo === protocolo.trim())) return { valido: false, erro: 'Protocolo já existe na fila.' };
            return { valido: true };
        };

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
                option.value = convenio; option.textContent = convenio;
                elements.filterConvenio.appendChild(option);
            });
            const contagemTipos = { Ambulatorio: 0, CDI: 0, UE: 0, Internacao: 0 };
            dadosFiltrados.filter(item => item.status === 'Baixado').forEach(item => {
                if (item.quantidades) { for (const tipo in item.quantidades) { if (item.quantidades[tipo] > 0) { contagemTipos[tipo] += item.quantidades[tipo]; } } }
            });
            const labels = Object.keys(contagemTipos).filter(k => contagemTipos[k] > 0);
            const data = Object.values(contagemTipos).filter(v => v > 0);
            if (tipoDocumentoChart) tipoDocumentoChart.destroy();
            if (data.length > 0) {
                tipoDocumentoChart = new Chart(elements.chartCanvas, {
                    type: 'doughnut',
                    data: { labels: labels.map(l => l === 'Ambulatorio' ? 'Ambulatório' : l === 'Internacao' ? 'Internação' : l), datasets: [{ data: data, backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'], borderColor: getComputedStyle(document.documentElement).getPropertyValue('--cor-container'), borderWidth: 2 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--cor-texto'), padding: 20, usePointStyle: true } } } }
                });
            }
        };

        const renderizarTabela = () => {
            elements.tabelaCorpo.innerHTML = '';
            elements.mensagemVazia.style.display = dadosFiltrados.length === 0 ? 'block' : 'none';
            dadosFiltrados.forEach((item) => {
                const tr = document.createElement('tr');
                if (item.status === 'Baixado') tr.classList.add('status-baixado');
                const convenioColor = { 'Unimed': '#3b82f6', 'Intercâmbio': '#ef4444', 'Convênio Externo': '#f59e0b', 'Particular': '#10b981', 'Internação': '#8b5cf6' };
                tr.innerHTML = `<td>${item.protocolo}</td><td><span style="background: ${convenioColor[item.convenio] || '#64748b'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${item.convenio}</span></td><td class="status-display"><i class="fas ${item.status === 'Baixado' ? 'fa-check-circle' : 'fa-clock'}"></i> ${item.status}</td><td>${formatarDataBR(item.dataRecebimento)}</td><td class="action-buttons"></td>`;
                const acaoCell = tr.querySelector('.action-buttons');
                const itemIndex = baseDeDados.indexOf(item);
                if (item.status === 'Baixado') {
                    acaoCell.innerHTML = `<button class="btn-warning" onclick="protonApp.editarProtocolo(${itemIndex})" title="Editar"><i class="fas fa-edit"></i></button><button class="btn-danger" onclick="protonApp.removerProtocolo(${itemIndex})" title="Remover"><i class="fas fa-trash"></i></button>`;
                } else {
                    acaoCell.innerHTML = `<button class="btn-success" onclick="protonApp.conferirProtocolo(${itemIndex})" title="Conferir"><i class="fas fa-check"></i></button><button class="btn-warning" onclick="protonApp.editarProtocolo(${itemIndex})" title="Editar"><i class="fas fa-edit"></i></button><button class="btn-danger" onclick="protonApp.removerProtocolo(${itemIndex})" title="Remover"><i class="fas fa-trash"></i></button>`;
                }
                elements.tabelaCorpo.appendChild(tr);
            });
        };
        
        const aplicarFiltros = () => {
            const searchTerm = elements.searchInput.value.toLowerCase();
            const statusFilter = elements.filterStatus.value;
            const convenioFilter = elements.filterConvenio.value;
            const dateFilter = elements.filterDate.value;
            dadosFiltrados = baseDeDados.filter(item => 
                (!searchTerm || item.protocolo.toLowerCase().includes(searchTerm) || item.convenio.toLowerCase().includes(searchTerm) || item.status.toLowerCase().includes(searchTerm)) &&
                (!statusFilter || item.status === statusFilter) &&
                (!convenioFilter || item.convenio === convenioFilter) &&
                (!dateFilter || item.dataRecebimento === dateFilter)
            );
            renderizarTabela();
            atualizarDashboard();
        };

        window.protonApp = {
            conferirProtocolo: (index) => {
                elements.conferenciaForm.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;"><div class="form-group"><label>Ambulatório</label><input type="number" id="qtd-ambulatorio" min="0" value="0"></div><div class="form-group"><label>CDI</label><input type="number" id="qtd-cdi" min="0" value="0"></div><div class="form-group"><label>UE</label><input type="number" id="qtd-ue" min="0" value="0"></div><div class="form-group"><label>Internação</label><input type="number" id="qtd-internacao" min="0" value="0"></div></div><div class="form-group"><label>Observações</label><textarea id="observacoes" rows="3" placeholder="Observações..."></textarea></div><div class="actions"><button class="btn-success" onclick="protonApp.salvarConferencia(${index})"><i class="fas fa-save"></i> Salvar</button></div>`;
                elements.modalConferencia.style.display = 'block';
                document.getElementById('qtd-ambulatorio').focus();
            },
            salvarConferencia: (index) => {
                const quantidades = { Ambulatorio: parseInt(document.getElementById('qtd-ambulatorio').value) || 0, CDI: parseInt(document.getElementById('qtd-cdi').value) || 0, UE: parseInt(document.getElementById('qtd-ue').value) || 0, Internacao: parseInt(document.getElementById('qtd-internacao').value) || 0 };
                const total = Object.values(quantidades).reduce((a, b) => a + b, 0);
                if (total === 0) { showToast('warning', 'Quantidade Inválida', 'Pelo menos um tipo deve ter quantidade maior que zero.'); return; }
                baseDeDados[index].status = 'Baixado';
                baseDeDados[index].quantidades = quantidades;
                baseDeDados[index].observacoes = document.getElementById('observacoes').value;
                baseDeDados[index].conferente = elements.conferente.value;
                baseDeDados[index].dataConferencia = new Date().toISOString();
                salvarDados(); aplicarFiltros(); elements.modalConferencia.style.display = 'none';
                showToast('success', 'Protocolo Conferido', `Protocolo ${baseDeDados[index].protocolo} conferido.`);
                addActivity('conference', `Protocolo ${baseDeDados[index].protocolo} conferido`, `Total: ${total} docs`);
            },
            editarProtocolo: (index) => {
                const item = baseDeDados[index];
                const novoProtocolo = prompt('Editar número do protocolo:', item.protocolo);
                if (novoProtocolo && novoProtocolo !== item.protocolo) {
                    const validacao = validarProtocolo(novoProtocolo);
                    if (!validacao.valido) { showToast('error', 'Erro', validacao.erro); return; }
                    const protocoloAntigo = item.protocolo;
                    item.protocolo = novoProtocolo.trim();
                    salvarDados(); aplicarFiltros();
                    showToast('success', 'Editado', `Protocolo ${protocoloAntigo} alterado para ${novoProtocolo}`);
                    addActivity('edit', `Protocolo editado: ${protocoloAntigo} → ${novoProtocolo}`);
                }
            },
            removerProtocolo: (index) => {
                const item = baseDeDados[index];
                if (confirm(`Remover o protocolo ${item.protocolo}?`)) {
                    baseDeDados.splice(index, 1);
                    salvarDados(); aplicarFiltros();
                    showToast('success', 'Removido', `Protocolo ${item.protocolo} removido.`);
                    addActivity('delete', `Protocolo ${item.protocolo} removido`);
                }
            }
        };

        const adicionarProtocolo = () => {
            const protocolo = elements.numProtocolo.value.trim();
            const convenio = elements.convenio.value;
            const dataRecebimento = elements.dataRecebimento.value;
            if (!convenio) { showToast('warning', 'Obrigatório', 'Selecione um convênio.'); elements.convenio.focus(); return; }
            if (!dataRecebimento) { showToast('warning', 'Obrigatório', 'Defina a data de referência.'); elements.dataRecebimento.focus(); return; }
            const validacao = validarProtocolo(protocolo);
            if (!validacao.valido) { showToast('error', 'Erro', validacao.erro); elements.numProtocolo.focus(); return; }
            const novoItem = { protocolo, convenio, status: 'Pendente', dataRecebimento, dataAdicao: new Date().toISOString() };
            baseDeDados.push(novoItem);
            elements.numProtocolo.value = '';
            salvarDados(); aplicarFiltros(); elements.numProtocolo.focus();
            showToast('success', 'Adicionado', `Protocolo ${protocolo} adicionado.`);
            addActivity('add', `Protocolo ${protocolo} adicionado`, `Convênio: ${convenio}`);
        };
        elements.btnAdicionar.addEventListener('click', adicionarProtocolo);
        elements.numProtocolo.addEventListener('keypress', (e) => { if (e.key === 'Enter') adicionarProtocolo(); });
        
        elements.btnAbrirModalLote.addEventListener('click', () => { elements.modalLote.style.display = 'block'; elements.listaProtocolosLote.focus(); });
        elements.fecharModal.addEventListener('click', () => { elements.modalLote.style.display = 'none'; });
        elements.fecharModalConferencia.addEventListener('click', () => { elements.modalConferencia.style.display = 'none'; });
        window.addEventListener('click', (e) => { if (e.target === elements.modalLote || e.target === elements.modalConferencia) { e.target.style.display = 'none'; } });

        elements.btnConfirmarLote.addEventListener('click', () => {
            const convenio = elements.convenio.value;
            const dataRecebimento = elements.dataRecebimento.value;
            if (!convenio || !dataRecebimento) { showToast('warning', 'Obrigatório', 'Defina Convênio e Data de referência.'); return; }
            const protocolos = elements.listaProtocolosLote.value.trim().split('\n').map(p => p.trim()).filter(p => p);
            let adicionados = 0;
            protocolos.forEach(p => {
                if (validarProtocolo(p).valido) {
                    baseDeDados.push({ protocolo: p, convenio, status: 'Pendente', dataRecebimento, dataAdicao: new Date().toISOString() });
                    adicionados++;
                }
            });
            if (adicionados > 0) {
                elements.listaProtocolosLote.value = '';
                elements.modalLote.style.display = 'none';
                salvarDados();
                aplicarFiltros();
                showToast('success', 'Lote Adicionado', `${adicionados} protocolos adicionados.`);
                addActivity('add', `Lote de ${adicionados} protocolos adicionado`, `Convênio: ${convenio}`);
            } else {
                showToast('error', 'Erro', 'Nenhum protocolo válido para adicionar.');
            }
        });
        
        elements.btnGerarExcel.addEventListener('click', async () => {
            if (baseDeDados.length === 0) { showToast('warning', 'Sem Dados', 'Não há protocolos para exportar.'); return; }
            showToast('info', 'Gerando Excel', 'Preparando planilha...');
            try {
                const itensParaExportar = baseDeDados.filter(item => item.status === 'Baixado');
                if (itensParaExportar.length === 0) { showToast('warning', 'Sem Dados', 'Não há protocolos processados para exportar.'); return; }
                const dataRef = formatarDataBR(elements.dataRecebimento.value) || new Date().toLocaleDateString('pt-BR');
                const nomeResp = elements.conferente.value || 'Não informado';
                const workbook = new ExcelJS.Workbook();
                const tiposDoc = { Ambulatorio: 'Ambulatório', CDI: 'CDI', UE: 'Ficha UE', Internacao: 'Internação' };
                for (const tipo in tiposDoc) {
                    const nomeAba = tiposDoc[tipo];
                    const dadosFiltrados = itensParaExportar.filter(item => item.quantidades && item.quantidades[tipo] > 0).map(item => ({ protocolo: item.protocolo, tipo: tipo.substring(0, 3).toUpperCase(), quantidade: item.quantidades[tipo], observacao: item.observacoes || 'OK' }));
                    if (dadosFiltrados.length > 0) {
                        const ws = workbook.addWorksheet(nomeAba);
                        ws.columns = [ { width: 20 }, { width: 12 }, { width: 12 }, { width: 45 } ];
                        ws.mergeCells('A1:D1'); ws.getCell('A1').value = 'CONTROLE DE RECEBIMENTO - PROTOCOLO MOVDOC';
                        ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }; ws.getCell('A1').font = { bold: true, size: 14 }; ws.getCell('A1').border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                        ws.mergeCells('A2:B2'); ws.getCell('A2').value = `DATA: ${dataRef}`; ws.getCell('A2').font = { bold: true, size: 12 }; ws.getCell('A2').border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                        ws.mergeCells('C2:D2'); ws.getCell('C2').value = `RESPONSÁVEL: ${nomeResp}`; ws.getCell('C2').font = { bold: true, size: 12 }; ws.getCell('C2').border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                        const headerRow = ws.addRow(['PROTOCOLO', 'TIPO', 'QUANT.', 'OBSERVAÇÃO']);
                        headerRow.eachCell(cell => { cell.font = { bold: true }; cell.alignment = { horizontal: 'center' }; cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }; });
                        dadosFiltrados.forEach(d => { const row = ws.addRow(Object.values(d)); row.eachCell(cell => { cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }; }); });
                    }
                }
                if (workbook.worksheets.length === 0) { showToast('warning', 'Sem Dados', 'Nenhum item com quantidade > 0 foi encontrado.'); return; }
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
                link.download = `Relatorio_MOVDOC_${dataRef.replace(/\//g, '-')}.xlsx`; link.click();
                showToast('success', 'Excel Gerado', 'Planilha exportada com sucesso!');
                addActivity('export', 'Planilha Excel gerada', `${itensParaExportar.length} registros`);
            } catch (error) { console.error('Erro ao gerar Excel:', error); showToast('error', 'Erro', 'Erro ao gerar planilha Excel.'); }
        });

        elements.btnBackup.addEventListener('click', () => {
            const dadosBackup = { versao: 'pro_v1', timestamp: new Date().toISOString(), dados: baseDeDados, atividades, configuracoes: { conferente: localStorage.getItem('conferenteFixo_pro_v1'), convenio: localStorage.getItem('convenioFixo_pro_v1'), tema: localStorage.getItem('theme'), timerSeconds: localStorage.getItem('timer_seconds') } };
            const blob = new Blob([JSON.stringify(dadosBackup, null, 2)], { type: 'application/json' });
            const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
            link.download = `backup-proton-${new Date().toISOString().split('T')[0]}.json`; link.click();
            showToast('success', 'Backup Criado', 'Arquivo de backup gerado.');
            addActivity('backup', 'Backup de dados criado', `${baseDeDados.length} registros`);
        });

        elements.btnRestore.addEventListener('click', () => elements.fileRestore.click());
        elements.fileRestore.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const backup = JSON.parse(ev.target.result);
                    if (!backup.versao || !backup.dados) { showToast('error', 'Arquivo Inválido', 'Arquivo de backup corrompido.'); return; }
                    if (confirm('Restaurar backup? Os dados atuais serão substituídos.')) {
                        baseDeDados = backup.dados || []; atividades = backup.atividades || [];
                        if (backup.configuracoes) {
                            if (backup.configuracoes.conferente) localStorage.setItem('conferenteFixo_pro_v1', backup.configuracoes.conferente);
                            if (backup.configuracoes.convenio) localStorage.setItem('convenioFixo_pro_v1', backup.configuracoes.convenio);
                            if (backup.configuracoes.tema) localStorage.setItem('theme', backup.configuracoes.tema);
                            if (backup.configuracoes.timerSeconds) { localStorage.setItem('timer_seconds', backup.configuracoes.timerSeconds); timerSeconds = parseInt(backup.configuracoes.timerSeconds); }
                        }
                        salvarDados(); aplicarFiltros(); location.reload();
                        showToast('success', 'Restaurado', 'Dados restaurados com sucesso!');
                        addActivity('restore', 'Backup restaurado', `${baseDeDados.length} registros`);
                    }
                } catch (error) { showToast('error', 'Erro no Backup', 'Erro ao processar o arquivo.'); }
            };
            reader.readAsText(file); e.target.value = '';
        });

        elements.btnShowHistory.addEventListener('click', () => {
            const isVisible = elements.activityHistory.style.display !== 'none';
            elements.activityHistory.style.display = isVisible ? 'none' : 'block';
            elements.btnShowHistory.innerHTML = isVisible ? '<i class="fas fa-history"></i> Mostrar Histórico' : '<i class="fas fa-eye-slash"></i> Ocultar Histórico';
            if (!isVisible) renderActivities();
        });

        elements.btnLimpar.addEventListener('click', () => {
            if (confirm('ATENÇÃO! Isso apagará TODOS os protocolos. Deseja continuar?')) {
                baseDeDados = []; atividades = []; salvarDados(); aplicarFiltros();
                showToast('success', 'Dados Limpos', 'Todos os dados foram removidos.');
                addActivity('clear', 'Todos os dados foram limpos');
            }
        });
        
        elements.themeSwitch.addEventListener('change', () => {
            const isDark = elements.themeSwitch.checked;
            document.documentElement.classList.toggle('dark-mode', isDark);
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            setTimeout(atualizarDashboard, 100);
        });
        
        if (localStorage.getItem('theme') === 'dark') {
            elements.themeSwitch.checked = true;
            document.documentElement.classList.add('dark-mode');
        }

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
            showToast('info', 'Filtros Limpos', 'Exibindo todos os registros.');
        });

        document.addEventListener('keydown', (e) => {
            if (document.querySelector('.modal[style*="display: block"]')) return;
            if (e.ctrlKey && document.getElementById('tab-proton').classList.contains('active')) {
                switch(e.key.toLowerCase()) {
                    case 'a': e.preventDefault(); elements.numProtocolo.focus(); break;
                    case 'f': e.preventDefault(); elements.searchInput.focus(); break;
                    case 'e': e.preventDefault(); elements.btnGerarExcel.click(); break;
                }
            }
        });
        
        elements.dataRecebimento.valueAsDate = new Date();
        updateTimerDisplay();
        aplicarFiltros();
        if (localStorage.getItem('timer_was_running') === 'true') startTimer();
        window.addEventListener('beforeunload', () => { localStorage.setItem('timer_was_running', isTimerRunning); });
    };

    // --- LÓGICA DO CONTADOR ---
    const contadorApp = () => {
        if (!document.getElementById('tab-contador')) return;

        const ambulatorioCountEl = document.getElementById('ambulatorio-count');
        const internacaoCountEl = document.getElementById('internacao-count');
        const totalCountEl = document.getElementById('total-count');
        const addAmbulatorioBtn = document.getElementById('add-ambulatorio-btn');
        const addInternacaoBtn = document.getElementById('add-internacao-btn');
        const resetBtn = document.getElementById('reset-btn');
        const pdfBtn = document.getElementById('pdf-btn');
        const ctx = document.getElementById('contadorChart').getContext('2d');

        const AMBULATORIO_KEY = 'contador_ambulatorio_v1';
        const INTERNACAO_KEY = 'contador_internacao_v1';
        let ambulatorioCount = 0, internacaoCount = 0, myChart;

        function getCssVariable(variable) { return getComputedStyle(document.documentElement).getPropertyValue(variable).trim(); }

        function criarGrafico() {
            if (myChart) myChart.destroy();
            myChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Ambulatório', 'Internação'],
                    datasets: [{
                        label: 'Quantidade', data: [ambulatorioCount, internacaoCount],
                        backgroundColor: [getCssVariable('--cor-ambulatório'), getCssVariable('--cor-internação')],
                        borderColor: [getCssVariable('--cor-container'), getCssVariable('--cor-container')], borderWidth: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: getCssVariable('--cor-texto') } } } }
            });
        }
        
        function loadCounts() {
            try {
                ambulatorioCount = parseInt(localStorage.getItem(AMBULATORIO_KEY)) || 0;
                internacaoCount = parseInt(localStorage.getItem(INTERNACAO_KEY)) || 0;
            } catch (e) { console.error("Falha ao carregar dados do localStorage:", e); ambulatorioCount = 0; internacaoCount = 0; }
        }

        function saveCounts() {
            try {
                localStorage.setItem(AMBULATORIO_KEY, ambulatorioCount);
                localStorage.setItem(INTERNACAO_KEY, internacaoCount);
            } catch (e) { console.error("Falha ao salvar dados no localStorage:", e); }
        }

        function atualizarTudo() {
            const total = ambulatorioCount + internacaoCount;
            ambulatorioCountEl.textContent = ambulatorioCount;
            internacaoCountEl.textContent = internacaoCount;
            totalCountEl.textContent = total;
            myChart.data.datasets[0].data = [ambulatorioCount, internacaoCount];
            myChart.update();
            saveCounts();
        }

        addAmbulatorioBtn.addEventListener('click', () => { ambulatorioCount++; atualizarTudo(); });
        addInternacaoBtn.addEventListener('click', () => { internacaoCount++; atualizarTudo(); });
        resetBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja zerar a contagem?')) { ambulatorioCount = 0; internacaoCount = 0; atualizarTudo(); }
        });
        
        pdfBtn.addEventListener('click', () => {
            const logoElement = document.getElementById('logo-para-pdf');
            const criarPDF = () => {
                const { jsPDF } = window.jspdf; const doc = new jsPDF();
                const dataAtual = new Date().toLocaleDateString('pt-BR');
                const total = ambulatorioCount + internacaoCount;
                doc.setFillColor(41, 51, 82); doc.rect(0, 0, 210, 25, 'F');
                if (logoElement.complete) doc.addImage(logoElement, 'PNG', 15, 5, 15, 15);
                doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255); doc.text('Relatório de Digitalização', 105, 16, { align: 'center' });
                doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100); doc.text(`Gerado em: ${dataAtual}`, 20, 35);
                doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(41, 51, 82); doc.text('Resumo da Contagem', 20, 50);
                doc.setDrawColor(220, 220, 220); doc.line(20, 52, 190, 52);
                doc.setFontSize(12); doc.setTextColor(50, 50, 50); doc.setFont('helvetica', 'bold');
                doc.text('Tipo de Documento', 25, 65); doc.text('Quantidade', 80, 65);
                doc.setFont('helvetica', 'normal');
                doc.setFillColor(getCssVariable('--cor-ambulatório')); doc.circle(28, 74.5, 2, 'F'); doc.text('Ambulatório:', 35, 75); doc.text(ambulatorioCount.toString(), 80, 75);
                doc.setFillColor(getCssVariable('--cor-internação')); doc.circle(28, 84.5, 2, 'F'); doc.text('Internação:', 35, 85); doc.text(internacaoCount.toString(), 80, 85);
                doc.line(25, 92, 95, 92);
                doc.setFontSize(14); doc.setFont('helvetica', 'bold');
                doc.setFillColor(getCssVariable('--cor-total')); doc.circle(28, 101.5, 2, 'F'); doc.text('TOTAL:', 35, 102); doc.text(total.toString(), 80, 102);
                if (total > 0) { const chartImage = myChart.toBase64Image('image/png', 1.0); doc.addImage(chartImage, 'PNG', 105, 55, 90, 90); }
                else { doc.text('Nenhum dado para exibir no gráfico.', 105, 90); }
                const pageHeight = doc.internal.pageSize.getHeight(); doc.setDrawColor(220, 220, 220); doc.line(10, pageHeight - 15, 200, pageHeight - 15);
                doc.setFontSize(8); doc.setTextColor(150, 150, 150);
                doc.text('Proton v1.2 | Gerado pelo Contador de Digitalização', 20, pageHeight - 10);
                doc.text(`Página 1`, 190, pageHeight - 10);
                doc.save(`relatorio-digitalizacao-${dataAtual.replace(/\//g, '-')}.pdf`);
            };
            if (logoElement.complete) criarPDF(); else logoElement.onload = criarPDF;
        });
        
        document.getElementById('checkbox').addEventListener('change', () => {
            setTimeout(() => { criarGrafico(); atualizarTudo(); }, 100);
        });

        loadCounts();
        criarGrafico();
        atualizarTudo();
    };

    // --- INICIALIZAÇÃO GERAL ---
    document.addEventListener('DOMContentLoaded', () => {
        setupTabs();
        protonApp();
        contadorApp();
        
        // Atalhos Globais
        document.addEventListener('keydown', (event) => {
            const isModalOpen = document.querySelector('.modal[style*="display: block"]');
            if (isModalOpen) return;

            if (event.ctrlKey) {
                switch(event.key.toLowerCase()) {
                    case 'd': event.preventDefault(); document.getElementById('checkbox').click(); break;
                    case '?': event.preventDefault(); document.getElementById('keyboardShortcuts').classList.toggle('visible'); break;
                }
            } else if (event.altKey) {
                 if (document.getElementById('tab-contador').classList.contains('active')) {
                    event.preventDefault();
                    switch(event.key.toLowerCase()) {
                        case 'a': document.getElementById('add-ambulatorio-btn').click(); break;
                        case 'i': document.getElementById('add-internacao-btn').click(); break;
                        case 'r': document.getElementById('reset-btn').click(); break;
                    }
                }
            }
        });
    });

})();
