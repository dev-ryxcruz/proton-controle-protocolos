/**
 * PROTON v1.4 - Gerenciamento de Conferência de Protocolos
 * Modais individuais, edição pós-conferência e fila sequencial em massa
 */

import { SecurityUtils } from "../../utils/security.js";
import { showToast } from "../../components/toast.js";
import { closeModal } from "../../components/modal.js";
import { validarProtocolo } from "./validation.js";

export const createConferenceManager = ({
  elements,
  state,
  syncApp,
  addActivity,
  clearSelection,
  onStateChange,
}) => {
  let bulkQueue = [];
  let bulkIndex = 0;

  const conferirProtocolo = (index) => {
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

    setTimeout(() => {
      document.getElementById("qtd-ambulatorio")?.focus();
    }, 100);
  };

  const salvarConferencia = (index) => {
    const quantidades = {
      Ambulatorio: parseInt(document.getElementById("qtd-ambulatorio")?.value) || 0,
      CDI: parseInt(document.getElementById("qtd-cdi")?.value) || 0,
      UE: parseInt(document.getElementById("qtd-ue")?.value) || 0,
      Internacao: parseInt(document.getElementById("qtd-internacao")?.value) || 0,
    };

    const total = Object.values(quantidades).reduce((a, b) => a + b, 0);

    if (total === 0) {
      showToast(
        "warning",
        "Quantidade Inválida",
        "Pelo menos um tipo deve ter quantidade maior que zero."
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

    if (typeof onStateChange === "function") onStateChange();
    syncApp();

    if (elements.modalConferencia) {
      elements.modalConferencia.style.display = "none";
      elements.modalConferencia.setAttribute("aria-hidden", "true");
    }

    showToast(
      "success",
      "Protocolo Conferido",
      `Protocolo ${item.protocolo} conferido com sucesso.`
    );
    addActivity(
      "conference",
      `Protocolo ${item.protocolo} conferido`,
      `Total: ${total} documentos`
    );
  };

  const conferirSelecionados = () => {
    if (state.selectedItems.length === 0) {
      showToast(
        "warning",
        "Nenhum Item",
        "Selecione pelo menos um protocolo para conferir."
      );
      return;
    }

    bulkQueue = state.selectedItems.filter((protocoloId) => {
      const item = state.baseDeDados.find((i) => i.protocolo === protocoloId);
      return item && item.status === "Pendente";
    });
    bulkIndex = 0;

    if (bulkQueue.length === 0) {
      showToast(
        "info",
        "Nenhum Pendente",
        "Todos os itens selecionados já foram conferidos."
      );
      clearSelection();
      return;
    }

    processNextBulkItem();
  };

  const processNextBulkItem = () => {
    if (bulkIndex >= bulkQueue.length) {
      closeModal(elements.modalConferencia);
      syncApp();
      clearSelection();
      showToast(
        "success",
        "Conferência em Massa Concluída",
        `${bulkQueue.length} protocolos foram conferidos.`
      );
      addActivity(
        "conference",
        `Conferência em massa de ${bulkQueue.length} protocolos.`
      );
      return;
    }

    const protocoloId = bulkQueue[bulkIndex];
    const item = state.baseDeDados.find((i) => i.protocolo === protocoloId);
    const itemIndex = state.baseDeDados.indexOf(item);

    const modal = elements.modalConferencia;
    const totalItems = bulkQueue.length;
    const currentItemNum = bulkIndex + 1;

    const titleEl = modal.querySelector(".modal-header h2");
    if (titleEl) {
      titleEl.innerHTML = `<i class="fas fa-check-double"></i> Conferindo ${currentItemNum} de ${totalItems}: Protocolo ${item.protocolo}`;
    }

    conferirProtocolo(itemIndex);

    setTimeout(() => {
      const form = elements.conferenciaForm;
      const actionsDiv = form.querySelector(".actions");
      const isLastItem = bulkIndex === totalItems - 1;

      if (actionsDiv) {
        actionsDiv.innerHTML = `
          <button class="btn-success" onclick="window.protonActions.salvarConferenciaSequencial()"><i class="fas fa-save"></i> ${isLastItem ? "Salvar e Finalizar" : "Salvar e Próximo"}</button>
          <button type="button" class="btn-warning" onclick="window.protonActions.pularItemSequencial()"><i class="fas fa-forward"></i> Pular</button>
          <button type="button" class="btn-danger" onclick="window.protonActions.cancelarSequencia()">Cancelar</button>
        `;
      }
    }, 150);
  };

  const salvarConferenciaSequencial = () => {
    const protocoloId = bulkQueue[bulkIndex];
    const itemIndex = state.baseDeDados.findIndex(
      (i) => i.protocolo === protocoloId
    );

    if (itemIndex === -1) {
      showToast(
        "error",
        "Erro",
        "Não foi possível encontrar o protocolo para salvar."
      );
      return;
    }

    salvarConferencia(itemIndex);
    bulkIndex++;
    processNextBulkItem();
  };

  const pularItemSequencial = () => {
    bulkIndex++;
    processNextBulkItem();
  };

  const cancelarSequencia = () => {
    bulkQueue = [];
    bulkIndex = 0;
    closeModal(elements.modalConferencia);
    showToast("info", "Cancelado", "A conferência em massa foi cancelada.");
  };

  const salvarEdicaoConferencia = (index) => {
    const item = state.baseDeDados[index];
    if (!item) return;

    const quantidades = {
      Ambulatorio: parseInt(document.getElementById("qtd-ambulatorio")?.value) || 0,
      CDI: parseInt(document.getElementById("qtd-cdi")?.value) || 0,
      UE: parseInt(document.getElementById("qtd-ue")?.value) || 0,
      Internacao: parseInt(document.getElementById("qtd-internacao")?.value) || 0,
    };

    const total = Object.values(quantidades).reduce((a, b) => a + b, 0);

    if (total === 0) {
      showToast(
        "warning",
        "Quantidade Inválida",
        "Pelo menos um tipo deve ter quantidade maior que zero."
      );
      return;
    }

    const observacoes = document.getElementById("observacoes")?.value || "";
    const novoProtocoloInput = document.getElementById(
      "edit-protocolo-conferencia"
    );

    if (novoProtocoloInput) {
      const novoProtocolo = novoProtocoloInput.value.trim();
      if (novoProtocolo && novoProtocolo !== item.protocolo) {
        const validacao = validarProtocolo(novoProtocolo, state.baseDeDados, {
          allowExisting: false,
          currentProtocolo: item.protocolo,
        });
        if (!validacao.valido) {
          showToast("error", "Erro de Validação", validacao.erro);
          return;
        }
        addActivity(
          "edit",
          `Protocolo editado: ${item.protocolo} → ${novoProtocolo}`
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

    if (typeof onStateChange === "function") onStateChange();
    syncApp();
    closeModal(elements.modalConferencia);

    showToast(
      "success",
      "Conferência Editada",
      `Dados do protocolo ${item.protocolo} foram atualizados.`
    );
    addActivity(
      "edit",
      `Conferência do protocolo ${item.protocolo} editada`,
      `Novo total: ${total} documentos`
    );
  };

  const editarProtocolo = (index) => {
    const item = state.baseDeDados[index];
    if (!item) return;

    if (item.status === "Baixado") {
      const modal = elements.modalConferencia;
      const titleEl = modal.querySelector(".modal-header h2");
      if (titleEl) {
        titleEl.innerHTML = `<i class="fas fa-edit" aria-hidden="true"></i> Editar Conferência do Protocolo ${item.protocolo}`;
      }

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
    const titleEl = modal.querySelector(".modal-header h2");
    if (titleEl) {
      titleEl.innerHTML = `<i class="fas fa-edit" aria-hidden="true"></i> Editar Protocolo`;
    }

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
    input?.focus();
    input?.select();

    const btnSalvar = document.getElementById("btnSalvarEdicao");
    if (btnSalvar) {
      btnSalvar.onclick = () => {
        const novoProtocolo = input.value.trim();
        if (novoProtocolo && novoProtocolo !== item.protocolo) {
          const validacao = validarProtocolo(novoProtocolo, state.baseDeDados, {
            allowExisting: false,
            currentProtocolo: item.protocolo,
          });
          if (!validacao.valido) {
            showToast("error", "Erro de Validação", validacao.erro);
            return;
          }

          const protocoloAntigo = item.protocolo;
          item.protocolo = novoProtocolo;

          if (typeof onStateChange === "function") onStateChange();
          syncApp();
          closeModal(elements.modalConferencia);

          showToast(
            "success",
            "Protocolo Editado",
            `Protocolo ${protocoloAntigo} alterado para ${novoProtocolo}`
          );
          addActivity(
            "edit",
            `Protocolo editado: ${protocoloAntigo} → ${novoProtocolo}`
          );
        }
      };
    }
  };

  return {
    conferirProtocolo,
    salvarConferencia,
    conferirSelecionados,
    processNextBulkItem,
    salvarConferenciaSequencial,
    pularItemSequencial,
    cancelarSequencia,
    salvarEdicaoConferencia,
    editarProtocolo,
    closeActiveModal: () => closeModal(elements.modalConferencia),
  };
};

