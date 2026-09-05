const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const DATA_DIR = path.join(__dirname, "..", "data");
const CONTENT_TYPES = ["self_study", "example", "exercise"];
const errors = [];

function report(file, lineNumber, message) {
  const relativePath = path.relative(path.join(__dirname, ".."), file);
  errors.push(`${relativePath}:${lineNumber} ${message}`);
}

function validateMath(math, file, lineNumber, isInline) {
  // 指数の肩にある \frac は許容（文字バランスのため: e^{\frac{x}{2}} など）
  const mathForFrac = math.replace(/\^\{\\frac\{[^{}]*\}\{[^{}]*\}\}/g, "");
  if (/\\frac\b/.test(mathForFrac)) {
    report(file, lineNumber, "分数には \\dfrac を使用してください");
  }
  if (/\\(?:leq|le|geq|ge)(?![A-Za-z])/.test(math)) {
    report(file, lineNumber, "不等号には \\leqq または \\geqq を使用してください");
  }
  if (/, +(?!\\)/.test(math)) {
    report(file, lineNumber, "数式内のカンマの後は \\ で空けてください");
  }
  // \text{...} 内の日本語句読点は許容
  const mathForPunct = math.replace(/\\text\{[^{}]*\}/g, "");
  if (/[．，。]/.test(mathForPunct)) {
    report(file, lineNumber, "句読点は数式の外に配置してください");
  }
  if (isInline && /\\(?:sum|lim)(?![A-Za-z]|\\limits)/.test(math)) {
    report(file, lineNumber, "インラインの \\sum・\\lim には \\limits を付けてください");
  }
  if (isInline && /(?<!\\displaystyle)\\int/.test(math)) {
    report(file, lineNumber, "インラインの積分記号には \\displaystyle を付けてください");
  }
  // 微分商（\dfrac{dx}{dt} など）を除外して微小量を検査
  const mathForDiff = math.replace(/\\(?:d)?frac\{d\^?[0-9]?[a-z]\}\{d[a-z]\^?[0-9]?\}/g, "");
  if (/(?<!\\,)(?:dx|dt|du|dv|dy|dz|dr|d\\theta|d\\phi)(?=(?:\s|$|[,)}\]<>=]))/.test(mathForDiff)) {
    report(file, lineNumber, "積分の微小量の前には \\, を付けてください");
  }
}

function validateContent(content, file) {
  if (!content.trim()) return;

  const lines = content.split(/\r?\n/);
  const firstContentLine = lines.findIndex((line) => line.trim());
  if (firstContentLine >= 0 && !/^## \d+(?:・\d+)?$/.test(lines[firstContentLine].trim())) {
    report(file, firstContentLine + 1, "本文は ## 問題番号 で開始してください");
  }

  let inBlockMath = false;
  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (line.startsWith("## ") && !/^## \d+(?:・\d+)?$/.test(line.trim())) {
      report(file, lineNumber, "見出しは ## 1 または ## 1・1 の形式にしてください");
    }

    if (line.includes("$$")) {
      if (line.trim() !== "$$") {
        report(file, lineNumber, "$$ は独立した行に配置してください");
        return;
      }
      inBlockMath = !inBlockMath;
      return;
    }

    if (inBlockMath) {
      validateMath(line, file, lineNumber, false);
      return;
    }

    const inlineMathPattern = /\$([^$\n]+)\$/g;
    let match;
    while ((match = inlineMathPattern.exec(line)) !== null) {
      validateMath(match[1], file, lineNumber, true);
    }
  });

  if (inBlockMath) {
    report(file, lines.length, "ブロック数式の $$ が閉じられていません");
  }
}

for (const subjectEntry of fs.readdirSync(DATA_DIR, { withFileTypes: true })) {
  if (!subjectEntry.isDirectory()) continue;
  const subject = subjectEntry.name;
  const subjectDir = path.join(DATA_DIR, subject);

  for (const lectureEntry of fs.readdirSync(subjectDir, { withFileTypes: true })) {
    if (!lectureEntry.isDirectory() || !/^lec\d{2}$/.test(lectureEntry.name)) continue;
    const lectureDir = path.join(subjectDir, lectureEntry.name);
    const lectureNumber = Number(lectureEntry.name.slice(3));

    for (const type of CONTENT_TYPES) {
      const file = path.join(lectureDir, `${type}.md`);
      if (!fs.existsSync(file)) {
        report(file, 1, "3タブ表示に必要なMarkdownファイルがありません");
        continue;
      }

      const parsed = matter(fs.readFileSync(file, "utf8"));
      if (parsed.data.subject !== subject) report(file, 1, "frontmatter の subject がフォルダ名と一致しません");
      if (Number(parsed.data.lecture) !== lectureNumber) report(file, 1, "frontmatter の lecture が講番号と一致しません");
      if (parsed.data.type !== type) report(file, 1, "frontmatter の type がファイル名と一致しません");
      if (typeof parsed.data.title !== "string" || !parsed.data.title.trim()) report(file, 1, "frontmatter の title がありません");
      validateContent(parsed.content, file);
    }
  }
}

if (errors.length > 0) {
  console.error(`教材データの検証に失敗しました（${errors.length}件）`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("教材データの検証に成功しました");
