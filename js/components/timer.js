/**
 * PROTON v1.4 - Cronômetro de Produtividade
 */

import { STORAGE_KEYS } from "../constants/storage.js";
import { showToast } from "./toast.js";
import { showConfirmModal } from "./modal.js";

let timerInterval = null;
let timerSeconds = parseInt(localStorage.getItem(STORAGE_KEYS.timerSeconds)) || 0;
let isRunning = false;

const getElements = () => ({
  timerDisplay: document.getElementById("timerDisplay"),
  timerToggle: document.getElementById("timerToggle"),
  timerIcon: document.getElementById("timerIcon"),
  timerReset: document.getElementById("timerReset"),
});

export const updateTimerDisplay = () => {
  const { timerDisplay } = getElements();
  if (!timerDisplay) return;

  const hours = Math.floor(timerSeconds / 3600);
  const minutes = Math.floor((timerSeconds % 3600) / 60);
  const seconds = timerSeconds % 60;

  const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  timerDisplay.textContent = timeString;
  timerDisplay.setAttribute("aria-label", `Tempo decorrido: ${timeString}`);
};

export const startTimer = () => {
  if (isRunning) return;

  const { timerIcon, timerToggle } = getElements();
  isRunning = true;
  if (timerIcon) timerIcon.className = "fas fa-pause";
  if (timerToggle) timerToggle.setAttribute("title", "Pausar cronômetro");

  showToast("info", "Timer Iniciado", "Cronômetro de produtividade ativado!");

  timerInterval = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
    localStorage.setItem(STORAGE_KEYS.timerSeconds, timerSeconds);
  }, 1000);
};

export const pauseTimer = () => {
  if (!isRunning) return;

  const { timerIcon, timerToggle } = getElements();
  isRunning = false;
  if (timerIcon) timerIcon.className = "fas fa-play";
  if (timerToggle) timerToggle.setAttribute("title", "Iniciar cronômetro");

  clearInterval(timerInterval);
  showToast("warning", "Timer Pausado", "Cronômetro pausado.");
};

export const resetTimer = async () => {
  if (isRunning) pauseTimer();

  const confirmed = await showConfirmModal(
    "Reiniciar Cronômetro",
    "Tem certeza que deseja zerar o cronômetro? Esta ação não pode ser desfeita."
  );

  if (confirmed) {
    timerSeconds = 0;
    localStorage.removeItem(STORAGE_KEYS.timerSeconds);
    updateTimerDisplay();
    showToast("info", "Cronômetro Reiniciado", "O tempo foi zerado.");
  }
};

export const isTimerRunning = () => isRunning;
export const getTimerSeconds = () => timerSeconds;

export const initTimer = () => {
  const { timerToggle, timerReset } = getElements();
  updateTimerDisplay();

  if (timerToggle) {
    timerToggle.addEventListener("click", () => {
      isRunning ? pauseTimer() : startTimer();
    });
  }

  if (timerReset) {
    timerReset.addEventListener("click", resetTimer);
  }

  if (localStorage.getItem(STORAGE_KEYS.timerRunning) === "true") {
    startTimer();
  }

  window.addEventListener("beforeunload", () => {
    localStorage.setItem(STORAGE_KEYS.timerRunning, isRunning);
  });
};

