/**
 * PROTON v1.4 - Funções Auxiliares e Utilitários de Performance
 */

/**
 * Converte data ISO YYYY-MM-DD para DD/MM/YYYY
 */
export const formatarDataBR = (dataString) => {
  if (!dataString || typeof dataString !== "string" || !dataString.includes("-")) {
    return "";
  }
  const [ano, mes, dia] = dataString.split("-");
  return `${dia}/${mes}/${ano}`;
};

/**
 * Limita a taxa de execução de uma função para manter fluidez da interface
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Garante que a função só executa no máximo uma vez por intervalo de tempo
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Obtém o valor computado de uma variável CSS do :root
 */
export const getCssVariable = (variable) => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
};

