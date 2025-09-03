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

---

## ✨ Recursos Adicionais

* **Tema Escuro (Dark Mode):** Alterne entre os temas claro e escuro para melhor conforto visual.
* **Timer de Produtividade:** Um cronômetro integrado para monitorar o tempo gasto nas tarefas.
* **Atalhos de Teclado:** Aumente sua agilidade com atalhos para as principais funções de cada aba. (Pressione `Ctrl + ?` para ver a lista).
* **Design Responsivo:** A interface se adapta para uso em desktops e dispositivos móveis.

---

## 🛠️ Tecnologias Utilizadas

* **HTML5:** Estruturação do conteúdo.
* **CSS3:** Estilização, layout (Flexbox/Grid) e tema escuro com variáveis CSS.
* **JavaScript (ES6+):** Lógica da aplicação, manipulação do DOM e interatividade.
* **Bibliotecas Externas:**
    * [Chart.js](https://www.chartjs.org/): Para a criação dos gráficos.
    * [ExcelJS](https://github.com/exceljs/exceljs): Para a geração de planilhas Excel.
    * [jsPDF](https://github.com/parallax/jsPDF): Para a geração de relatórios em PDF.
    * [Font Awesome](https://fontawesome.com/): Para os ícones da interface.

---

## ⚙️ Como Executar Localmente

1.  Clone este repositório ou baixe os arquivos.
2.  Certifique-se de que os arquivos `index.html`, `style.css`, `script.js` e `proton-logo.png` estão na mesma pasta.
3.  Abra o arquivo `index.html` em qualquer navegador moderno (Chrome, Firefox, Edge, etc.).

---

Desenvolvido por **Ryan Cristian** - Desenvolvedor Junior.
