/**
 * PROTON v1.4 - Trava de Campos Recorrentes (Pin / Lock)
 * Permite fixar Conferente, Convênio e Data para agilizar lançamentos contínuos
 */

import { STORAGE_KEYS } from "../../constants/storage.js";
import { showToast } from "../../components/toast.js";

export const setupPinField = (btnEl, inputEl, pinKey, state) => {
  if (!btnEl || !inputEl) return;

  const updatePinUI = (isPinned) => {
    btnEl.classList.toggle("is-pinned", isPinned);
    btnEl.setAttribute("aria-pressed", String(isPinned));
    const icon = btnEl.querySelector("i");
    const text = btnEl.querySelector(".pin-text");
    if (icon) icon.className = isPinned ? "fas fa-lock" : "fas fa-unlock";
    if (text) text.textContent = isPinned ? "Fixado" : "Travar";
    inputEl.classList.toggle("input-pinned", isPinned);
  };

  const isPinned = state.pins[pinKey] || false;
  updatePinUI(isPinned);

  if (isPinned) {
    const savedVal = localStorage.getItem(`${STORAGE_KEYS.pinnedValues}_${pinKey}`);
    if (savedVal && !inputEl.value) {
      inputEl.value = savedVal;
    }
  }

  btnEl.addEventListener("click", () => {
    const nextState = !state.pins[pinKey];
    if (nextState && !inputEl.value) {
      showToast("warning", "Campo Vazio", "Preencha o campo antes de fixar o valor.");
      inputEl.focus();
      return;
    }

    state.pins[pinKey] = nextState;
    localStorage.setItem(STORAGE_KEYS.fieldPins, JSON.stringify(state.pins));
    if (nextState) {
      localStorage.setItem(`${STORAGE_KEYS.pinnedValues}_${pinKey}`, inputEl.value);
    } else {
      localStorage.removeItem(`${STORAGE_KEYS.pinnedValues}_${pinKey}`);
    }
    updatePinUI(nextState);

    showToast(
      nextState ? "success" : "info",
      nextState ? "Campo Fixado" : "Campo Liberado",
      nextState
        ? "O valor permanecerá fixo entre os lançamentos."
        : "O campo agora é variável."
    );
  });

  inputEl.addEventListener("change", () => {
    if (state.pins[pinKey] && inputEl.value) {
      localStorage.setItem(`${STORAGE_KEYS.pinnedValues}_${pinKey}`, inputEl.value);
    }
  });
};

