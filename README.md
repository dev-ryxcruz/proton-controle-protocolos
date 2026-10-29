# 🚀 PROTON
### Controle de Protocolos & Contador de Digitalização

<p align="center">
  <img src="proton-logo.png" alt="Logo Proton" width="150">
</p>

<p align="center">
  **Mais produtividade, organização e controle em um só lugar.**
</p>

<p align="center">
  <a href="https://dev-ryxcruz.github.io/proton-controle-protocolos/">
    <img src="https://img.shields.io/badge/🌐_ACESSAR_PROTON-2563EB?style=for-the-badge" alt="Acessar Proton">
  </a>
</p>

<p align="center">
  ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
  ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
  ![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
  ![Status](https://img.shields.io/badge/Status-Online-22C55E?style=flat-square)
</p>

---

## 📌 Sobre o projeto

O **Proton** é uma ferramenta de produtividade desenvolvida para otimizar e centralizar os processos de conferência de protocolos e contagem de documentos digitalizados.

Com uma interface intuitiva e recursos de automação, o sistema permite acompanhar indicadores, gerenciar informações, gerar relatórios e manter o controle das atividades em um único ambiente.

> Desenvolvido com foco em produtividade, simplicidade e eficiência operacional.

---

## ✨ Funcionalidades

O Proton é dividido em três módulos principais, complementados por recursos adicionais que tornam a experiência mais completa.

### 📋 01. Controle de Protocolos

Gerenciamento completo do fluxo de recebimento, conferência e baixa de protocolos.

| Recurso | Descrição |
|---|---|
| ➕ Adição rápida | Cadastro individual ou em lote por meio de listas. |
| 🔄 Gestão de status | Alteração entre Pendente e Baixado. |
| 📊 Dashboard | Indicadores em tempo real e taxa de conclusão. |
| 🍩 Gráfico de documentos | Distribuição por Ambulatório, CDI, UE e Internação. |
| 🔎 Busca inteligente | Pesquisa por protocolo, convênio ou status. |
| 🎯 Filtros avançados | Filtragem por status, convênio e data de referência. |
| 💾 Persistência | Armazenamento local utilizando `localStorage`. |
| 📤 Exportação Excel | Geração de relatórios formatados em `.xlsx`. |
| 🔐 Backup e restauração | Exportação e recuperação dos dados em `.json`. |

### 🔢 02. Contador de Digitalização

Contagem rápida e prática de documentos durante o processo de digitalização.

| Recurso | Descrição |
|---|---|
| 🏥 Contadores individuais | Contagem independente de Ambulatório e Internação. |
| 📈 Totalizador | Soma automática dos documentos contabilizados. |
| 🍩 Gráfico dinâmico | Atualização instantânea da distribuição dos documentos. |
| 📄 Exportação PDF | Relatório visual com logo, contagens e gráfico. |
| 💾 Persistência | Salvamento automático no `localStorage`. |

### 📰 03. Novidades & Melhorias

Uma linha do tempo que documenta a evolução do sistema e mantém a equipe informada sobre as atualizações.

- **Histórico estruturado:** cada melhoria apresenta data, motivo e objetivo.
- **Busca em tempo real:** localização rápida de melhorias por palavras-chave.
- **Filtros por categoria:** Produtividade, Interface & UX, Automação e Arquitetura.
- **Command Palette:** acesso rápido pelo atalho `Ctrl + K`.
- **Interface adaptativa:** filtros e indicadores compatíveis com os temas claro e escuro.

---

## ⚡ Recursos adicionais

Além dos módulos principais, o Proton oferece funcionalidades que melhoram a experiência de utilização.

| Recurso | Funcionalidade |
|---|---|
| 🌙 Dark Mode | Alternância entre temas claro e escuro. |
| ⏱️ Timer | Cronômetro integrado para acompanhamento da produtividade. |
| ⌨️ Atalhos | Comandos rápidos para agilizar operações. |
| 🎨 Design responsivo | Interface adaptável para desktops e dispositivos móveis. |
| 🧩 Command Palette | Navegação e execução rápida de comandos com `Ctrl + K`. |
| 🟢 Matrix Mode | Easter egg ativado pelo Konami Code. |

---

## 🏗️ Arquitetura do projeto

O Proton utiliza uma arquitetura modular, organizada por responsabilidades e com separação entre apresentação, lógica de negócio e serviços.

Essa estrutura facilita a manutenção, a identificação de problemas e a implementação de novas funcionalidades.

<details>
<summary><strong>📂 Visualizar estrutura completa de diretórios</strong></summary>

```text
proton-controle-protocolos/
│
├── index.html
├── proton-logo.png
├── package.json
│
├── css/
│   ├── main.css
│   ├── variables.css
│   ├── base.css
│   ├── responsive.css
│   ├── print.css
│   │
│   ├── layout/
│   │   ├── header.css
│   │   ├── tabs.css
│   │   └── footer.css
│   │
│   └── components/
│       ├── buttons.css
│       ├── cards.css
│       ├── forms.css
│       ├── table.css
│       ├── modals.css
│       ├── toasts.css
│       ├── palette.css
│       ├── timer.css
│       ├── contador.css
│       ├── novidades.css
│       ├── ux.css
│       └── easteregg.css
│
└── js/
    ├── app.js
    │
    ├── constants/
    │   └── storage.js
    │
    ├── utils/
    │   ├── security.js
    │   ├── helpers.js
    │   └── symbols.js
    │
    ├── components/
    │   ├── loading.js
    │   ├── toast.js
    │   ├── modal.js
    │   ├── timer.js
    │   ├── theme.js
    │   ├── palette.js
    │   ├── shortcuts.js
    │   └── ux.js
    │
    ├── services/
    │   ├── excelService.js
    │   └── pdfService.js
    │
    └── modules/
        ├── protocolo/
        │   ├── index.js
        │   ├── validation.js
        │   ├── pins.js
        │   ├── chart.js
        │   ├── table.js
        │   ├── conference.js
        │   └── report.js
        │
        ├── contador/
        │   └── index.js
        │
        ├── novidades/
        │   └── index.js
        │
        └── easterEgg.js
```

</details>

### Organização arquitetural

- **CSS:** apresentação, identidade visual, componentes e responsividade.
- **JS / Components:** componentes reutilizáveis e funcionalidades globais.
- **JS / Utils:** funções auxiliares e mecanismos de segurança.
- **JS / Services:** serviços responsáveis pelas exportações.
- **JS / Modules:** módulos independentes de cada funcionalidade.

---

## 🛠️ Tecnologias utilizadas

### Core

| Tecnologia | Aplicação |
|---|---|
| HTML5 | Estrutura semântica e acessível. |
| CSS3 | Estilização modular, Flexbox, Grid e design responsivo. |
| JavaScript ES6+ | Lógica da aplicação e módulos nativos. |

### Bibliotecas e dependências

| Biblioteca | Finalidade |
|---|---|
| [Chart.js](https://www.chartjs.org/) | Criação e atualização de gráficos. |
| [ExcelJS](https://github.com/exceljs/exceljs) | Exportação e leitura de planilhas Excel. |
| [jsPDF](https://github.com/parallax/jsPDF) | Geração de relatórios em PDF. |
| [Font Awesome](https://fontawesome.com/) | Ícones da interface. |

---

## 💻 Executando localmente

Você pode executar o Proton diretamente no seu computador.

### Pré-requisitos

- Node.js instalado (para utilizar os scripts npm).
- Navegador moderno com suporte a JavaScript ES Modules.

### 1. Clone o repositório

```bash
git clone https://github.com/dev-ryxcruz/proton-controle-protocolos.git
```

### 2. Entre na pasta

```bash
cd proton-controle-protocolos
```

### 3. Inicie o servidor local

```bash
npm start
```

Ou, alternativamente:

```bash
npx serve .
```

Acesse no navegador:

```text
http://localhost:3000
```

### 4. Verifique a integridade dos módulos

Para verificar a sintaxe e a integridade dos arquivos JavaScript:

```bash
npm run verify
```

### Execução alternativa

Também é possível abrir diretamente o arquivo `index.html` com dois cliques.

O carregador inteligente do Proton identifica a execução local e realiza o carregamento conforme a configuração da aplicação.

---

## ⌨️ Atalhos de teclado

O Proton conta com atalhos para agilizar a navegação e a utilização das funcionalidades.

| Atalho | Ação |
|---|---|
| `Ctrl + K` | Abrir Command Palette. |
| `Ctrl + ?` | Consultar lista de atalhos. |

*Consulte a interface do sistema para conhecer os demais comandos disponíveis.*

---

## 🔒 Armazenamento e segurança

O Proton utiliza armazenamento local do navegador (`localStorage`) para manter os dados entre sessões.

Também conta com mecanismos de sanitização e escape de conteúdo para reduzir riscos de injeção de código, além de recursos de backup e restauração.

**Importante:** os dados permanecem armazenados no navegador utilizado. Limpar os dados do site ou utilizar outro navegador pode exigir a restauração de um backup.

---

## 👨‍💻 Desenvolvedor

<p align="center">
  <strong>Ryan Cristian Alves da Cruz</strong>
  <br>
  Desenvolvedor Junior
  <br><br>
  <a href="https://github.com/dev-ryxcruz">
    <img src="https://img.shields.io/badge/GitHub-dev--ryxcruz-181717?style=for-the-badge&logo=github" alt="GitHub">
  </a>
</p>

<p align="center">
  Desenvolvido com dedicação, tecnologia e foco na produtividade.
  <br>
  <strong>PROTON © 2026</strong>
</p>
