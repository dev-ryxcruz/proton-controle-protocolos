/**
 * PROTON v1.4 - Utilitários de Segurança e Sanitização
 */

export const SecurityUtils = {
  /**
   * Sanitiza strings para exibição segura
   */
  sanitizeHTML: (str) => {
    if (!str) return "";
    const temp = document.createElement("div");
    temp.textContent = str;
    return temp.innerHTML;
  },

  /**
   * Converte caracteres especiais em entidades HTML seguras
   */
  escapeHTML: (str) => {
    if (!str) return "";
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  },

  /**
   * Valida se uma string é puramente numérica
   */
  validateNumeric: (value) => {
    if (value === null || value === undefined) return false;
    return /^\d+$/.test(value.toString().trim());
  },
};

