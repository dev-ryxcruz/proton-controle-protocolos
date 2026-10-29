/**
 * PROTON v1.5 - Módulo de Novidades e Registro de Melhorias
 * Centraliza a linha do tempo oficial de evoluções do sistema, contendo:
 * Data, Motivo da melhoria e Objetivo da melhoria.
 */

import { SecurityUtils } from "../../utils/security.js";

// Lista oficial e imutável de melhorias do sistema
const NOVIDADES_DATA = [
  {
    id: "nov-1.5",
    versao: "v1.5",
    data: "29/10/2026",
    categoria: "Interface",
    titulo: "Central de Novidades & Registro de Melhorias",
    motivo:
      "O Proton evoluiu rapidamente com dezenas de novos recursos, mas a equipe e os conferentes não dispunham de um local centralizado para acompanhar o que mudou, compreender a justificativa técnica/operacional de cada recurso e saber como utilizá-lo da melhor forma no fluxo diário.",
    objetivo:
      "Garantir total transparência operacional através de uma aba dedicada que documenta todas as melhorias contendo obrigatoriamente Data, Motivo da necessidade e Objetivo esperado, além de busca por palavras-chave e filtros por categoria.",
    destaques: [
      "Aba dedicada 'Novidades' no menu principal com badge informativo",
      "Blocos estruturados com destaque visual para Data, Motivo e Objetivo",
      "Busca dinâmica em tempo real e filtros de categoria (Produtividade, Interface, Automação, Arquitetura)",
      "Design tokens otimizados para alta legibilidade no tema claro e escuro",
      "Integração com atalhos de teclado e Command Palette (Ctrl + K)",
    ],
  },
  {
    id: "nov-1.4",
    versao: "v1.4",
    data: "29/10/2026",
    categoria: "Arquitetura",
    titulo: "Refatoração Arquitetural Modular (ES6) e Design Tokens",
    motivo:
      "O código-fonte da aplicação estava concentrado em arquivos monolíticos de grande porte com alto acoplamento, o que tornava arriscada a inserção de novos recursos, dificultava a manutenção preventiva e impedia a realização de testes modulares limpos.",
    objetivo:
      "Modularizar a aplicação em mais de 20 submódulos coesos baseados no padrão ES6 nativo, desacoplar a camada visual através de CSS Design Tokens e implementar script automatizado de verificação sintática contínua.",
    destaques: [
      "Separação estrita de responsabilidades: components, modules, services, constants e utils",
      "Isolamento das regras de negócio do Controle de Protocolos e do Contador Manual",
      "Tokens de design centralizados em variables.css para suporte perfeito ao Dark Mode",
      "Script automatizado 'npm run verify' para checagem rápida de integridade sintática",
    ],
  },
  {
    id: "nov-1.3",
    versao: "v1.3",
    data: "28/10/2026",
    categoria: "Produtividade",
    titulo: "Fixação de Campos (Pins), Importação Excel e Guia de Impressão",
    motivo:
      "Os conferentes precisavam reinserir Nome e Convênio a cada novo turno ou recarregamento de página; não havia como retomar a conferência a partir de planilhas Excel previamente geradas; e processos físicos de prestação de contas exigiam um comprovante em papel assinado.",
    objetivo:
      "Eliminar ações manuais repetitivas através de travas (Pins) para dados frequentes, possibilitar reimportação de planilhas Excel com reconstituição do estado, agilizar a transição de lotes com 'Novo Turno' e criar layout de impressão física via Ctrl + P com campos de assinatura.",
    destaques: [
      "Botões de Fixação (Pin/Lock) para Conferente, Convênio e Data de Referência",
      "Importação inteligente de planilhas Excel (.xlsx) restaurando dados diretamente na tabela",
      "Botão 'Limpar Sessão / Novo Turno' para transição instantânea de lotes de trabalho",
      "Guia de impressão física estruturada com cabeçalho de metadados e linhas de assinatura",
    ],
  },
  {
    id: "nov-1.2",
    versao: "v1.2",
    data: "27/10/2026",
    categoria: "Automação",
    titulo: "Modo Rápido (Auto 6 Dígitos), Relatório Diário e Botão Topo",
    motivo:
      "Em turnos com centenas de guias, ter que pressionar Enter ou clicar no botão 'Adicionar' após digitar cada número de protocolo gerava cansaço e diminuía a velocidade. Além disso, a gestão precisava de visibilidade sobre o ritmo de produtividade por hora.",
    objetivo:
      "Aumentar expressivamente a velocidade de entrada incluindo o protocolo na fila automaticamente ao atingir 6 dígitos, disponibilizar relatório diário com ritmo por hora e hora de pico, e fornecer botão flutuante para retorno rápido ao topo.",
    destaques: [
      "Modo Rápido (Auto 6 dígitos) com alternador visual e atalho",
      "Modal de Relatório Diário com linha do tempo de produtividade e ritmo por hora",
      "Identificação analítica de hora de pico e estatísticas comparativas",
      "Botão flutuante dinâmico 'Voltar ao Topo' com rolagem suave",
    ],
  },
  {
    id: "nov-1.1",
    versao: "v1.1",
    data: "25/10/2026",
    categoria: "Interface",
    titulo: "Conferência em Massa, Indicadores por Setor e Toast com Desfazer",
    motivo:
      "Dar baixa individualmente em dezenas de protocolos com os mesmos parâmetros era moroso; guias de diferentes setores (Ambulatório, CDI, UE, Internação) não eram identificadas rapidamente na tabela; e exclusões acidentais não podiam ser recuperadas.",
    objetivo:
      "Implementar seleção múltipla para conferência simultânea de vários itens; aplicar símbolos visuais coloridos por setor com barra fixa de legenda; e proteger o usuário com sistema de toasts interativos com opção 'Desfazer' por 5 segundos.",
    destaques: [
      "Barra de ações em massa para conferir múltiplos protocolos selecionados",
      "Símbolos visuais por setor: AMB (Verde), CDI (Roxo), UE (Laranja), I (Azul) e Obs (Vermelho)",
      "Barra de legenda fixa para rápida consulta visual dos indicadores",
      "Notificações toast com botão 'Desfazer' ativo por 5 segundos em exclusões",
    ],
  },
  {
    id: "nov-1.0",
    versao: "v1.0",
    data: "20/10/2026",
    categoria: "Produtividade",
    titulo: "Lançamento Oficial: Controle de Protocolos, Contador e Dark Mode",
    motivo:
      "O controle de triagem de guias e a contagem de digitalizações hospitalares eram realizados manualmente em papel ou planilhas despadronizadas, sujeitas a perdas de documentos e sem indicadores visuais de produtividade.",
    objetivo:
      "Entregar uma ferramenta moderna, rápida, 100% offline-first no navegador, com persistência segura em localStorage, gestão de status Pendente/Baixado, contador manual com relatório em PDF e suporte ao modo escuro.",
    destaques: [
      "Aba de Controle de Protocolos com status em tempo real e barra de progresso",
      "Aba de Contador Manual com divisão por setor e exportação de PDF profissional",
      "Dashboard com gráficos reativos em tempo real via Chart.js",
      "Alternador de tema Claro / Escuro com preservação automática de preferências",
      "Exportação de planilhas Excel (.xlsx) e Backup/Restauração completos em JSON",
    ],
  },
];

export const novidadesApp = () => {
  // 1. Elementos do DOM
  const container = document.getElementById("novidadesContainer");
  const buscaInput = document.getElementById("buscaNovidades");
  const btnLimparBusca = document.getElementById("btnLimparBuscaNovidades");
  const chipsContainer = document.getElementById("novidadesCategoryChips");
  const statTotal = document.getElementById("statTotalMelhorias");

  let activeCategory = "todos";
  let searchQuery = "";

  // 2. Renderização dos Cards
  const render = () => {
    if (!container) return;

    if (statTotal) statTotal.textContent = NOVIDADES_DATA.length;

    const query = searchQuery.toLowerCase().trim();

    const filtered = NOVIDADES_DATA.filter((item) => {
      // Filtro de Categoria
      const matchCategory =
        activeCategory === "todos" ||
        item.categoria.toLowerCase() === activeCategory.toLowerCase();

      if (!matchCategory) return false;

      // Filtro de Busca por Texto
      if (!query) return true;

      const haystack = [
        item.versao,
        item.titulo,
        item.categoria,
        item.data,
        item.motivo,
        item.objetivo,
        ...(item.destaques || []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="novidades-empty-state">
          <i class="fas fa-search" aria-hidden="true"></i>
          <h3>Nenhuma melhoria encontrada</h3>
          <p>Tente buscar por outro termo ou selecione a categoria "Todas".</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered
      .map((item) => {
        const safeVersao = SecurityUtils.escapeHTML(item.versao || "v1.x");
        const safeData = SecurityUtils.escapeHTML(item.data || "--/--/----");
        const safeTitulo = SecurityUtils.escapeHTML(item.titulo || "Melhoria");
        const safeCategoria = SecurityUtils.escapeHTML(item.categoria || "Geral");
        const safeMotivo = SecurityUtils.escapeHTML(item.motivo || "");
        const safeObjetivo = SecurityUtils.escapeHTML(item.objetivo || "");

        const destaquesHtml =
          item.destaques && item.destaques.length > 0
            ? `
              <div class="melhoria-destaques">
                <h4><i class="fas fa-check-circle" aria-hidden="true"></i> Principais Itens Entregues:</h4>
                <ul class="melhoria-destaques-lista">
                  ${item.destaques
                    .map((d) => `<li>${SecurityUtils.escapeHTML(d)}</li>`)
                    .join("")}
                </ul>
              </div>
            `
            : "";

        return `
          <article class="melhoria-card" data-id="${item.id}">
            <div class="melhoria-card-header">
              <div class="melhoria-header-left">
                <div class="melhoria-meta-tags">
                  <span class="melhoria-badge-versao">${safeVersao}</span>
                  <span class="melhoria-badge-categoria">${safeCategoria}</span>
                </div>
                <h3 class="melhoria-titulo">${safeTitulo}</h3>
              </div>
              <div class="melhoria-header-right">
                <div class="melhoria-data-badge" title="Data da implementação">
                  <i class="fas fa-calendar-alt" aria-hidden="true"></i> ${safeData}
                </div>
              </div>
            </div>

            <!-- BLOCOS ESTRUTURAIS: MOTIVO E OBJETIVO -->
            <div class="melhoria-sections">
              <div class="melhoria-bloco melhoria-bloco-motivo">
                <div class="melhoria-bloco-header">
                  <i class="fas fa-lightbulb" aria-hidden="true"></i>
                  <span>Motivo da Melhoria</span>
                </div>
                <p class="melhoria-bloco-texto">${safeMotivo}</p>
              </div>

              <div class="melhoria-bloco melhoria-bloco-objetivo">
                <div class="melhoria-bloco-header">
                  <i class="fas fa-bullseye" aria-hidden="true"></i>
                  <span>Objetivo da Melhoria</span>
                </div>
                <p class="melhoria-bloco-texto">${safeObjetivo}</p>
              </div>
            </div>

            ${destaquesHtml}
          </article>
        `;
      })
      .join("");
  };

  // 3. Configuração dos Filtros e Busca
  const setupFilters = () => {
    if (buscaInput) {
      buscaInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        if (btnLimparBusca) {
          btnLimparBusca.style.display = searchQuery ? "block" : "none";
        }
        render();
      });
    }

    if (btnLimparBusca) {
      btnLimparBusca.addEventListener("click", () => {
        if (buscaInput) {
          buscaInput.value = "";
          searchQuery = "";
          btnLimparBusca.style.display = "none";
          buscaInput.focus();
        }
        render();
      });
    }

    if (chipsContainer) {
      chipsContainer.querySelectorAll(".category-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          chipsContainer
            .querySelectorAll(".category-chip")
            .forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
          activeCategory = chip.getAttribute("data-category") || "todos";
          render();
        });
      });
    }
  };

  // 4. Inicialização do Módulo
  setupFilters();
  render();

  return {
    render,
    getData: () => NOVIDADES_DATA,
  };
};
