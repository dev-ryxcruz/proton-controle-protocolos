#  Proton - Controle de Protocolos e Contador de Digitalização

![Logo do Proton](proton-logo.png)

Bem-vindo ao Proton, uma ferramenta de produtividade desenvolvida para otimizar e rastrear o processo de conferência de protocolos e contagem de documentos digitalizados.

**🔗 Acesse a versão final aqui: [Proton Live](https://dev-ryxcruz.github.io/proton-controle-protocolos/)**

---

## 🚀 Funcionalidades Principais

Este projeto foi desenvolvido em duas partes principais, acessíveis através de um sistema de abas intuitivo:

### 1. Aba: Controle de Protocolos
A ferramenta principal para gerenciar o fluxo de recebimento e conferência de protocolos.

* **Adição Rápida:** Adicione protocolos individualmente ou em lote (colando uma lista).
* **Gestão de Status:** Marque protocolos como "Pendente" ou "Baixado" com um clique.
* **Dashboard Interativo:** Visualize estatísticas em tempo real, como total de itens, processados, pendentes e a taxa de conclusão em uma barra de progresso.
* **Gráfico de Documentos:** Um gráfico de rosca mostra a distribuição dos tipos de documentos processados (Ambulatório, CDI, UE, Internação).
* **Busca e Filtros:** Pesquise por número de protocolo, convênio ou status. Filtre a visualização por status, convênio ou data de referência.
* **Persistência de Dados:** Todos os dados são salvos localmente no seu navegador (`localStorage`), garantindo que seu trabalho não seja perdido ao recarregar a página.
* **Exportação e Backup:**
    * **Gerar Excel:** Exporte um relatório formatado em `.xlsx` com os protocolos conferidos.
    * **Backup/Restore:** Salve e restaure todos os dados da aplicação em um arquivo `.json`.

### 2. Aba: Contador de Digitalização
Uma ferramenta simples e ágil para contagem manual de documentos durante o processo de digitalização.

* **Contadores Individuais:** Botões dedicados para incrementar a contagem de "Ambulatório" e "Internação".
* **Visualização Total:** Um card exibe a soma total dos documentos contados.
* **Gráfico em Tempo Real:** Um gráfico de rosca é atualizado instantaneamente a cada clique, mostrando a proporção de cada tipo de documento.
* **Exportação para PDF:** Gere um relatório em PDF com design profissional, incluindo o logo, as contagens e o gráfico, com um único clique.
* **Persistência de Dados:** A contagem também é salva no `localStorage`, para que você possa continuar de onde parou.

### 3. Aba: Novidades & Registro de Melhorias
Canal transparente com a linha do tempo de todas as evoluções do sistema, permitindo que a equipe acompanhe a evolução do software.

* **Estrutura Padronizada:** Cada melhoria detalha com clareza a **Data**, o **Motivo** (problema/necessidade que gerou a mudança) e o **Objetivo** (impacto positivo e metas operacionais).
* **Filtros e Busca em Tempo Real:** Pesquisa rápida por palavras-chave e chips de filtragem por categoria (Produtividade, Interface & UX, Automação, Arquitetura) com alto contraste para tema claro e escuro.
* **Badge Dinâmico e Command Palette:** Acesso direto através de atalhos e comando integrado no menu `Ctrl + K`.

---

## ✨ Recursos Adicionais

* **Tema Escuro (Dark Mode):** Alterne entre os temas claro e escuro para melhor conforto visual.
* **Timer de Produtividade:** Um cronômetro integrado para monitorar o tempo gasto nas tarefas.
* **Atalhos de Teclado:** Aumente sua agilidade com atalhos para as principais funções de cada aba. (Pressione `Ctrl + ?` para ver a lista).
* **Design Responsivo:** A interface se adapta para uso em desktops e dispositivos móveis.

---

## 📁 Estrutura Modular do Projeto

Para garantir alta manutenibilidade, separação de responsabilidades e facilidade na evolução do código, o sistema foi refatorado e dividido em módulos coesos:

```text
proton-controle-protocolos/
├── index.html                   # Estrutura HTML da aplicação e carregador inteligente
├── proton-logo.png              # Logotipo oficial
├── package.json                 # Scripts de desenvolvimento e testes
│
├── css/                         # Camada de Apresentação e Estilos
│   ├── main.css                 # Master stylesheet (importa todos os módulos)
│   ├── variables.css            # Design tokens, variáveis CSS e tema escuro
│   ├── base.css                 # Reset, tipografia, glassmorphism e overlay
│   ├── responsive.css           # Media queries de responsividade e acessibilidade
│   ├── print.css                # Guia física de impressão (@media print) e assinaturas
│   ├── layout/                  # Componentes de layout
│   │   ├── header.css           # Topo, branding e alternador de tema
│   │   ├── tabs.css             # Navegação de abas e badges de pendentes
│   │   └── footer.css           # Rodapé da aplicação
│   └── components/              # Componentes de interface
│       ├── buttons.css          # Botões padrão, pins/trava e estados de loading
│       ├── cards.css            # Cards do setup, dashboard e legendas
│       ├── forms.css            # Inputs, selects estilizados e foco
│       ├── table.css            # Tabela de protocolos, badges e edição inline
│       ├── modals.css           # Modais de conferência, lote, relatório e confirmação
│       ├── toasts.css           # Notificações toast padrão e toast de desfazer (5s)
│       ├── palette.css          # Command Palette (Ctrl + K)
│       ├── timer.css            # Cronômetro de produtividade e atalhos
│       ├── contador.css         # Cards e layout do contador manual
│       ├── novidades.css        # Timeline, cards e filtros da aba de novidades
│       ├── ux.css               # Efeito ripple e botão scroll-to-top
│       └── easteregg.css        # Matrix Mode (Konami Code)
│
└── js/                          # Camada de Lógica e Arquitetura ES Modules
    ├── app.js                   # Ponto de entrada (orquestra inicialização e abas)
    ├── constants/
    │   └── storage.js           # Chaves de persistência local e sessão
    ├── utils/
    │   ├── security.js          # Sanitização e escape contra injeção XSS
    │   ├── helpers.js           # Formatadores de data, debounce e throttle
    │   └── symbols.js           # Renderização segura de símbolos indicadores
    ├── components/
    │   ├── loading.js           # Overlay de carregamento
    │   ├── toast.js             # Toasts informativos e toast de desfazer (5s)
    │   ├── modal.js             # Modal assíncrono de confirmação e controle de foco
    │   ├── timer.js             # Lógica e ciclo de vida do cronômetro
    │   ├── theme.js             # Alternador e persistência de tema claro/escuro
    │   ├── palette.js           # Command Palette rápida (Ctrl + K)
    │   ├── shortcuts.js         # Atalhos globais de teclado
    │   └── ux.js                # Ripple nos botões e scroll-to-top
    ├── services/
    │   ├── excelService.js      # Exportação formatada e importação reversa (ExcelJS)
    │   └── pdfService.js        # Geração de relatório visual em PDF (jsPDF + Chart.js)
    └── modules/
        ├── protocolo/           # Módulo principal de Controle de Protocolos
        │   ├── index.js         # Orquestrador do fluxo e gestão central (syncApp)
        │   ├── validation.js    # Regras de validação de protocolos
        │   ├── pins.js          # Fixação (pin/lock) de campos recorrentes
        │   ├── chart.js         # Gráfico reativo com Chart.update()
        │   ├── table.js         # Renderização da tabela e edição inline
        │   ├── conference.js    # Modais de conferência individual e sequencial
        │   └── report.js        # Relatório diário de produtividade e timeline
        ├── contador/            # Módulo de Contagem de Digitalização
        │   └── index.js         # Lógica do contador manual e atalhos
        ├── novidades/           # Módulo de Novidades e Registro de Melhorias
        │   └── index.js         # Linha do tempo, filtros, motivos, objetivos e modal
        └── easterEgg.js         # Konami Code (Matrix Mode)
```

---

## 🛠️ Tecnologias Utilizadas

* **HTML5 Semântico:** Estruturação acessível do conteúdo.
* **CSS3 Modular:** Variáveis de design (tokens), Flexbox, Grid, Glassmorphism e estilos de impressão.
* **JavaScript ES6+ (Native Modules):** Separação de responsabilidades sem acoplamento.
* **Bibliotecas Externas (via CDN):**
    * [Chart.js](https://www.chartjs.org/): Criação e atualização de gráficos reativos.
    * [ExcelJS](https://github.com/exceljs/exceljs): Geração e leitura de planilhas `.xlsx`.
    * [jsPDF](https://github.com/parallax/jsPDF): Geração de relatórios em PDF com design profissional.
    * [Font Awesome](https://fontawesome.com/): Ícones da interface.

---

## ⚙️ Como Executar Localmente

### Opção 1: Servidor Local (Recomendado para Desenvolvimento)
Com o Node.js instalado:
```bash
npm start
# ou
npx serve .
```
Acesse `http://localhost:3000` no seu navegador. Os módulos ES6 serão carregados nativamente.

Para verificar a sintaxe e integridade dos módulos a qualquer momento:
```bash
npm run verify
```

### Opção 2: Abrir Diretamente via Arquivo (`file://`)
Você também pode abrir diretamente o arquivo `index.html` com dois cliques. O carregador inteligente do Proton detectará a execução local e fará o carregamento transparente.

---

Desenvolvido por **Ryan Cristian** - Desenvolvedor Junior.
