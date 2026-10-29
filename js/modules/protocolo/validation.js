/**
 * PROTON v1.4 - Validação de Regras de Negócio de Protocolos
 */

import { SecurityUtils } from "../../utils/security.js";

/**
 * Valida o formato e integridade do número de protocolo (6 dígitos numéricos)
 */
export const validarProtocolo = (
  protocolo,
  baseDeDados = [],
  options = { allowExisting: false, currentProtocolo: null }
) => {
  const protocoloLimpo = protocolo ? protocolo.toString().trim() : "";

  if (!protocoloLimpo) {
    return { valido: false, erro: "Protocolo não pode estar vazio." };
  }
  if (!SecurityUtils.validateNumeric(protocoloLimpo)) {
    return { valido: false, erro: "Protocolo deve conter apenas números." };
  }
  if (protocoloLimpo.length !== 6) {
    return {
      valido: false,
      erro: "Protocolo deve ter exatamente 6 dígitos.",
    };
  }

  // Verifica duplicidade no banco atual
  const jaExiste = baseDeDados.some((item) => {
    if (options.currentProtocolo && item.protocolo === options.currentProtocolo) {
      return false; // Permite o próprio protocolo durante edição
    }
    return item.protocolo === protocoloLimpo;
  });

  if (!options.allowExisting && jaExiste) {
    return {
      valido: false,
      erro: "Este protocolo já foi adicionado.",
    };
  }

  return { valido: true, protocolo: protocoloLimpo };
};

