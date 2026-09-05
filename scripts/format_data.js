const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

function transformMath(math, isInline) {
  let result = math
    .replace(/\\frac\b/g, "\\dfrac")
    .replace(/\\sum(?!\\limits)(?=_)/g, "\\sum\\limits")
    .replace(/\\lim(?!\\limits)(?=_)/g, "\\lim\\limits")
    .replace(/\\leq?(?![A-Za-z])/g, "\\leqq")
    .replace(/\\geq?(?![A-Za-z])/g, "\\geqq")
    .replace(/, +(?!\\)/g, ",\\ ")
    .replace(/(?<!\\,)dx(?=(?:\s|$|[,)}\]<>=]))/g, "\\,dx")
    .replace(/(?<!\\,)dt(?=(?:\s|$|[,)}\]<>=]))/g, "\\,dt")
    .replace(/(?<!\\,)du(?=(?:\s|$|[,)}\]<>=]))/g, "\\,du")
    .replace(/(?<!\\,)dv(?=(?:\s|$|[,)}\]<>=]))/g, "\\,dv")
    .replace(/(?<!\\,)dy(?=(?:\s|$|[,)}\]<>=]))/g, "\\,dy")
    .replace(/(?<!\\,)dz(?=(?:\s|$|[,)}\]<>=]))/g, "\\,dz")
    .replace(/(?<!\\,)dr(?=(?:\s|$|[,)}\]<>=]))/g, "\\,dr")
    .replace(/(?<!\\,)d\\theta(?=(?:\s|$|[,)}\]<>=]))/g, "\\,d\\theta")
    .replace(/(?<!\\,)d\\phi(?=(?:\s|$|[,)}\]<>=]))/g, "\\,d\\phi");

  if (isInline) {
    result = result.replace(/(?<!\\displaystyle)\\int/g, "\\displaystyle\\int");
  }

  return result;
}

function transformContent(content) {
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  let inBlockMath = false;

  return content
    .split(/\r?\n/)
    .map((line) => {
      if (line.trim() === "$$") {
        inBlockMath = !inBlockMath;
        return line;
      }

      if (inBlockMath) return transformMath(line, false);
      return line.replace(/\$([^$\n]+)\$/g, (_, math) => `$${transformMath(math, true)}$`);
    })
    .join(newline);
}

let changedFiles = 0;
for (const subject of fs.readdirSync(DATA_DIR)) {
  const subjectDir = path.join(DATA_DIR, subject);
  if (!fs.statSync(subjectDir).isDirectory()) continue;

  for (const lecture of fs.readdirSync(subjectDir)) {
    const lectureDir = path.join(subjectDir, lecture);
    if (!fs.statSync(lectureDir).isDirectory()) continue;

    for (const fileName of fs.readdirSync(lectureDir)) {
      if (!fileName.endsWith(".md")) continue;
      const file = path.join(lectureDir, fileName);
      const original = fs.readFileSync(file, "utf8");
      const formatted = transformContent(original);
      if (formatted === original) continue;
      fs.writeFileSync(file, formatted, "utf8");
      changedFiles += 1;
    }
  }
}

console.log(`${changedFiles}個の教材ファイルを整形しました`);
