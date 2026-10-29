import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync("index.html", "utf8");

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
const missingElements = [];

jsFiles.forEach((file) => {
  const code = fs.readFileSync(file, "utf8");
  const regex = /getElementById\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    const id = match[1];
    if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
      missingElements.push({ file, id });
    }
  }
});

console.log("Missing IDs in index.html:", missingElements);

