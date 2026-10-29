/**
 * PROTON v1.4 - Gerenciamento de Modais e Confirmação Customizada
 */

let lastFocusedElement = null;

export const openModal = (modal) => {
  if (!modal) return;
  lastFocusedElement = document.activeElement;
  modal.style.display = "block";
  modal.setAttribute("aria-hidden", "false");

  const focusable = modal.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable) focusable.focus();
};

export const closeModal = (modal) => {
  if (!modal) return;
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
};

/**
 * Modal assíncrono de confirmação (substitui o confirm() nativo bloqueante)
 */
export const showConfirmModal = (title, message) => {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const titleEl = document.getElementById("confirmModalTitle");
    const msgEl = document.getElementById("confirmModalMessage");
    const btnOk = document.getElementById("confirmModalOk");
    const btnCancel = document.getElementById("confirmModalCancel");

    if (!modal) {
      resolve(window.confirm(message));
      return;
    }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");
    if (btnOk) btnOk.focus();

    const cleanup = (result) => {
      modal.style.display = "none";
      modal.setAttribute("aria-hidden", "true");
      if (btnOk) btnOk.removeEventListener("click", onOk);
      if (btnCancel) btnCancel.removeEventListener("click", onCancel);
      modal.removeEventListener("click", onOverlay);
      resolve(result);
    };

    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const onOverlay = (e) => {
      if (e.target === modal) cleanup(false);
    };

    if (btnOk) btnOk.addEventListener("click", onOk);
    if (btnCancel) btnCancel.addEventListener("click", onCancel);
    modal.addEventListener("click", onOverlay);
  });
};

