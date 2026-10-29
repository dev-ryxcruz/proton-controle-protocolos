/**
 * PROTON v1.4 - Gerenciamento de Tema (Claro / Escuro)
 */

import { STORAGE_KEYS } from "../constants/storage.js";

export const initTheme = () => {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  const themeSwitch = document.getElementById("checkbox");

  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark-mode");
    if (themeSwitch) themeSwitch.checked = true;
  } else {
    document.documentElement.classList.remove("dark-mode");
    if (themeSwitch) themeSwitch.checked = false;
  }
};

export const setupThemeToggle = () => {
  const themeSwitch = document.getElementById("checkbox");
  if (!themeSwitch) return;

  themeSwitch.addEventListener("change", () => {
    if (themeSwitch.checked) {
      document.documentElement.classList.add("dark-mode");
      localStorage.setItem(STORAGE_KEYS.theme, "dark");
    } else {
      document.documentElement.classList.remove("dark-mode");
      localStorage.setItem(STORAGE_KEYS.theme, "light");
    }
  });
};

