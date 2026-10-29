/**
 * Script de verificação de sintaxe de todos os módulos JavaScript
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith(".js")) {
      results.push(fullPath);
    }
  });
  return results;
}

console.log("Iniciando verificação de integridade dos módulos...\n");
const jsFiles = getFiles("js");
let hasErrors = false;

jsFiles.forEach((file) => {
  try {
    execSync(`node --check "${file}"`);
    console.log(`✓ [OK] ${file}`);
  } catch (err) {
    console.error(`✗ [ERRO] ${file}:`, err.message);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.error("\nFalha na verificação de módulos.");
  process.exit(1);
} else {
  console.log(`\nTodos os ${jsFiles.length} módulos foram verificados com sucesso!`);
}
