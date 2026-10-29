/**
 * PROTON v1.4 - Easter Egg: Konami Code (Matrix Mode)
 * Sequência: Cima, Cima, Baixo, Baixo, Esquerda, Direita, Esquerda, Direita, B, A
 */

export const setupEasterEgg = () => {
  const konamiCode = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];

  let cursor = 0;

  document.addEventListener("keydown", (e) => {
    // Reinicia se a tecla não for a esperada na sequência
    cursor = e.key === konamiCode[cursor] ? cursor + 1 : 0;

    // Se completou a sequência
    if (cursor === konamiCode.length) {
      activateMatrixMode();
      cursor = 0;
    }
  });
};

const activateMatrixMode = () => {
  document.body.classList.toggle("matrix-mode");

  const isMatrix = document.body.classList.contains("matrix-mode");
  const msg = isMatrix
    ? "Bem-vindo à Matrix, Neo."
    : "Desconectando da Matrix...";

  const toastContainer = document.getElementById("toastContainer");
  if (toastContainer) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.style.borderLeft = "4px solid #0f0";
    toast.style.background = "#000";
    toast.style.color = "#0f0";
    toast.style.fontFamily = "monospace";
    toast.innerHTML = `
      <div class="toast-icon"><i class="fas fa-user-secret" aria-hidden="true"></i></div>
      <div class="toast-content">
        <div class="toast-title" style="color: #0f0">SYSTEM_OVERRIDE</div>
        <div class="toast-message" style="color: #0f0">${msg}</div>
      </div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }
};

