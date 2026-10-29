import fs from "node:fs";
import path from "node:path";

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) results = results.concat(getFiles(fullPath));
    else if (file.endsWith(".js")) results.push(fullPath);
  });
  return results;
}

const jsFiles = getFiles("js");
const brokenImports = [];

jsFiles.forEach((file) => {
  const code = fs.readFileSync(file, "utf8");
  const regex = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    const importPath = match[1];
    const resolvedPath = path.resolve(path.dirname(file), importPath);
    if (!fs.existsSync(resolvedPath)) {
      brokenImports.push({ file, importPath, resolvedPath });
    }
  }
});

console.log("Broken imports count:", brokenImports.length);
if (brokenImports.length > 0) {
  console.log("Broken imports:", brokenImports);
}

