const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BASE_DIR = "c:/Users/sakuke/programs/math-text-latter";
const DATA_DIR = path.join(BASE_DIR, "data");

const SUBJECT_FILES = [
  { subject: "math1", fileName: "1講.md" },
  { subject: "math2", fileName: "2講.md" },
  { subject: "math3", fileName: "3講.md" },
  { subject: "science_math", fileName: "4講(科学大数学).md" },
];

function sha256(str) {
  return crypto.createHash("sha256").update(Buffer.from(str, "utf-8")).digest("hex");
}

console.log("=== 教材データ分割配置 & ハッシュ検証開始 ===\n");

let totalFilesWritten = 0;
let totalVerified = 0;

for (const item of SUBJECT_FILES) {
  const filePath = path.join(BASE_DIR, item.fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`エラー: 元ファイルが見つかりません: ${item.fileName}`);
    process.exit(1);
  }

  const rawFileContent = fs.readFileSync(filePath, "utf-8");
  const fileHash = sha256(rawFileContent);
  console.log(`\n----------------------------------------`);
  console.log(`対象: ${item.fileName} -> subject: ${item.subject}`);
  console.log(`元ファイル SHA-256: ${fileHash} (${rawFileContent.length} 文字, ${Buffer.byteLength(rawFileContent, "utf-8")} バイト)`);

  // 各講の開始位置（## X・1）を検出
  const lectureHeaderRegex = /(?:^|\r?\n)(##\s+(\d+)・1\b)/g;
  const lectures = [];
  let match;

  while ((match = lectureHeaderRegex.exec(rawFileContent)) !== null) {
    // ## の開始インデックス
    const headerStart = match.index + (match[0].startsWith("\n") ? 1 : match[0].startsWith("\r\n") ? 2 : 0);
    const lecNum = parseInt(match[2], 10);
    lectures.push({
      number: lecNum,
      start: headerStart,
    });
  }

  if (lectures.length === 0) {
    console.error(`エラー: ${item.fileName} から講義ヘッダー（## X・1）が見つかりませんでした`);
    process.exit(1);
  }

  // スライスと配置
  const slices = [];
  for (let i = 0; i < lectures.length; i++) {
    const current = lectures[i];
    const next = lectures[i + 1];
    const end = next ? next.start : rawFileContent.length;
    const sliceContent = rawFileContent.slice(current.start, end);
    slices.push({
      number: current.number,
      content: sliceContent,
      hash: sha256(sliceContent),
    });
  }

  // 各講の exercise.md を書き出し
  for (const s of slices) {
    const lecSlug = `lec${s.number < 10 ? "0" + s.number : s.number}`;
    const targetDir = path.join(DATA_DIR, item.subject, lecSlug);
    fs.mkdirSync(targetDir, { recursive: true });

    const targetFile = path.join(targetDir, "exercise.md");

    // Frontmatter を作成 (CRLF 改行で統一)
    const frontmatter = `---\r\ntitle: "第${s.number}講 演習問題（後期）"\r\nlecture: ${s.number}\r\ntype: exercise\r\nsubject: ${item.subject}\r\n---\r\n`;
    const fullContent = frontmatter + s.content;

    fs.writeFileSync(targetFile, fullContent, "utf-8");
    totalFilesWritten++;
  }

  // === 検証フェーズ ===
  // 書き出した各 exercise.md を再度読み込み、Frontmatter を除去して本文のハッシュを元スライスのハッシュと突合
  let concatenatedBody = "";
  for (const s of slices) {
    const lecSlug = `lec${s.number < 10 ? "0" + s.number : s.number}`;
    const targetFile = path.join(DATA_DIR, item.subject, lecSlug, "exercise.md");
    const readFull = fs.readFileSync(targetFile, "utf-8");

    // Frontmatter の末尾を探す
    const fmEndMatch = readFull.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
    if (!fmEndMatch) {
      console.error(`検証失敗: Frontmatter が不正です (${targetFile})`);
      process.exit(1);
    }

    const bodyContent = readFull.slice(fmEndMatch[0].length);
    const bodyHash = sha256(bodyContent);

    if (bodyHash !== s.hash) {
      console.error(`検証失敗: 第${s.number}講 の本文ハッシュが一致しません！`);
      console.error(`  期待値: ${s.hash}`);
      console.error(`  実際値: ${bodyHash}`);
      process.exit(1);
    }

    concatenatedBody += bodyContent;
    totalVerified++;
  }

  // 全講義連結テキストと元ファイル全体の一致検証
  const concatenatedHash = sha256(concatenatedBody);
  if (concatenatedHash !== fileHash) {
    console.error(`検証失敗: 全講義の連結結果が元ファイル全体と一致しません！`);
    console.error(`  元ファイル: ${fileHash}`);
    console.error(`  連結結果  : ${concatenatedHash}`);
    process.exit(1);
  }

  console.log(`✔ ${item.fileName}: 全${slices.length}講の exercise.md 配置 & SHA-256 ハッシュ完全一致検証に成功！`);
  console.log(`  - 各講の本文ハッシュ突合: 100% 一致`);
  console.log(`  - 全講義の再連結ハッシュ: ${concatenatedHash} (元ファイルと byte-for-byte 完全一致)`);
}

console.log(`\n========================================`);
console.log(`【検証完了】`);
console.log(`生成・更新ファイル数: ${totalFilesWritten} 件`);
console.log(`ハッシュ検証成功数  : ${totalVerified} 講 (一致率: 100.0%)`);
console.log(`========================================\n`);
