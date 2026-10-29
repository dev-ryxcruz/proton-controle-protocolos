/**
 * PROTON v1.4 - Sistema de Notificações Toast e Toast com Desfazer (5s)
 */

import { SecurityUtils } from "../utils/security.js";

const removeToast = (toast) => {
  toast.style.animation = "toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse";
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 300);
};

export const showToast = (type, title, message, duration = 4000) => {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) return;

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
      <i class="${icons[type] || icons.info}" aria-hidden="true"></i>
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

  const closeBtn = toast.querySelector(".toast-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      clearTimeout(autoRemove);
      removeToast(toast);
    });
  }
};

/**
 * Toast de Desfazer (Undo) - 5 segundos de duração sem bloqueio de interface
 */
export const showUndoToast = (message, onUndo, duration = 5000) => {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) return;

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

  const btnUndo = toast.querySelector(".btn-undo-action");
  const btnClose = toast.querySelector(".toast-close");
  let isUndone = false;

  const autoRemoveTimer = setTimeout(() => {
    if (!isUndone && toast.parentNode) removeToast(toast);
  }, duration);

  if (btnUndo) {
    btnUndo.addEventListener("click", () => {
      isUndone = true;
      clearTimeout(autoRemoveTimer);
      if (typeof onUndo === "function") {
        onUndo();
      }
      removeToast(toast);
    });
  }

  if (btnClose) {
    btnClose.addEventListener("click", () => {
      clearTimeout(autoRemoveTimer);
      removeToast(toast);
    });
  }

  toastContainer.appendChild(toast);
};

