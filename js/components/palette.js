/**
 * PROTON v1.4 - Command Palette (Ctrl + K)
 * Acesso instantâneo a todas as ações e ferramentas do sistema via teclado
 */

export const setupCommandPalette = () => {
  // 1. Cria a interface dinamicamente e injeta no Body
  const overlay = document.createElement("div");
  overlay.className = "command-palette-overlay";
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

  const input = document.getElementById("cpInput");
  const resultsContainer = document.getElementById("cpResults");
  let selectedIndex = 0;
  let currentFilteredCommands = [];

  // 2. Lista de Comandos Disponíveis
  const commands = [
    {
      id: "theme",
      icon: "fa-moon",
      name: "Alternar Tema (Claro/Escuro)",
      action: () => document.getElementById("checkbox")?.click(),
    },
    {
      id: "add",
      icon: "fa-plus",
      name: "Novo Protocolo (Focar campo)",
      action: () => {
        document.querySelector('[data-tab="tab-proton"]')?.click();
        setTimeout(() => document.getElementById("numProtocolo")?.focus(), 100);
      },
    },
    {
      id: "search",
      icon: "fa-search",
      name: "Buscar Protocolos",
      action: () => {
        document.querySelector('[data-tab="tab-proton"]')?.click();
        setTimeout(() => document.getElementById("searchInput")?.focus(), 100);
      },
    },
    {
      id: "lote",
      icon: "fa-layer-group",
      name: "Adicionar Protocolos em Lote",
      action: () => {
        document.querySelector('[data-tab="tab-proton"]')?.click();
        document.getElementById("btnAbrirModalLote")?.click();
      },
    },
    {
      id: "excel",
      icon: "fa-file-excel",
      name: "Exportar Planilha Excel",
      action: () => document.getElementById("gerarExcel")?.click(),
    },
    {
      id: "import-excel",
      icon: "fa-file-import",
      name: "Importar Planilha Excel (.xlsx)",
      action: () => document.getElementById("btnImportarExcel")?.click(),
    },
    {
      id: "novo-turno",
      icon: "fa-rotate",
      name: "Limpar Sessão / Novo Turno",
      action: () => document.getElementById("btnNovoTurno")?.click(),
    },
    {
      id: "print-guide",
      icon: "fa-print",
      name: "Imprimir Guia Física (Ctrl + P)",
      action: () => window.print(),
    },
    {
      id: "pdf",
      icon: "fa-file-pdf",
      name: "Gerar Relatório PDF (Contador)",
      action: () => {
        document.querySelector('[data-tab="tab-contador"]')?.click();
        setTimeout(() => document.getElementById("pdf-btn")?.click(), 100);
      },
    },
    {
      id: "tab-proton",
      icon: "fa-file-alt",
      name: "Ir para Aba: Controle de Protocolos",
      action: () => document.querySelector('[data-tab="tab-proton"]')?.click(),
    },
    {
      id: "tab-contador",
      icon: "fa-calculator",
      name: "Ir para Aba: Contador Manual",
      action: () => document.querySelector('[data-tab="tab-contador"]')?.click(),
    },
    {
      id: "shortcuts",
      icon: "fa-keyboard",
      name: "Mostrar Atalhos de Teclado",
      action: () => document.getElementById("btnShowShortcuts")?.click(),
    },
  ];

  // 3. Renderização e Filtro
  const renderResults = (query = "") => {
    resultsContainer.innerHTML = "";
    const q = query.toLowerCase().trim();

    // Smart Feature: Se digitar exatamente 6 dígitos numéricos, sugere buscar diretamente aquele protocolo
    if (/^\d{6}$/.test(q)) {
      currentFilteredCommands = [
        {
          id: "find-protocol",
          icon: "fa-crosshairs",
          name: `Localizar protocolo ${q} na tabela`,
          action: () => {
            document.querySelector('[data-tab="tab-proton"]')?.click();
            const searchInput = document.getElementById("searchInput");
            if (searchInput) {
              searchInput.value = q;
              searchInput.dispatchEvent(new Event("input"));
              setTimeout(() => searchInput.focus(), 100);
            }
          },
        },
      ];
    } else {
      currentFilteredCommands = commands.filter((cmd) =>
        cmd.name.toLowerCase().includes(q)
      );
    }

    if (currentFilteredCommands.length === 0) {
      resultsContainer.innerHTML = '<div class="cp-empty">Nenhum comando encontrado.</div>';
      return;
    }

    currentFilteredCommands.forEach((cmd, index) => {
      const item = document.createElement("div");
      item.className = `cp-item ${index === selectedIndex ? "selected" : ""}`;
      item.innerHTML = `<i class="fas ${cmd.icon} cp-item-icon"></i> <span>${cmd.name}</span>`;

      item.addEventListener("click", () => executeCommand(cmd));
      item.addEventListener("mousemove", () => {
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
    const items = resultsContainer.querySelectorAll(".cp-item");
    items.forEach((item, index) => {
      item.classList.toggle("selected", index === selectedIndex);
      if (index === selectedIndex) {
        item.scrollIntoView({ block: "nearest" });
      }
    });
  };

  const executeCommand = (cmd) => {
    closePalette();
    setTimeout(() => cmd.action(), 150);
  };

  const openPalette = () => {
    overlay.classList.add("visible");
    input.value = "";
    selectedIndex = 0;
    renderResults();
    setTimeout(() => input.focus(), 50);
  };

  const closePalette = () => {
    overlay.classList.remove("visible");
    input.blur();
  };

  input.addEventListener("input", (e) => {
    selectedIndex = 0;
    renderResults(e.target.value);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % currentFilteredCommands.length;
      updateSelection();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex =
        (selectedIndex - 1 + currentFilteredCommands.length) %
        currentFilteredCommands.length;
      updateSelection();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentFilteredCommands[selectedIndex]) {
        executeCommand(currentFilteredCommands[selectedIndex]);
      }
    }
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePalette();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("visible")) {
      closePalette();
    }
    if (e.ctrlKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      overlay.classList.contains("visible") ? closePalette() : openPalette();
    }
  });
};

