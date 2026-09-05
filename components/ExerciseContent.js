"use client";

import { useState } from "react";
import MathRenderer from "./MathRenderer";
import styles from "./ExerciseContent.module.css";

/**
 * exercise.md の本文を ## ヘッダーで大問ごとに分割し、
 * 各大問の下に「問題文をコピー」ボタンを表示する。
 */
export default function ExerciseContent({ content }) {
  if (!content) return null;

  // ## で始まる行を区切りとして大問ブロックに分割
  const blocks = splitIntoProblems(content);

  if (blocks.length === 0) {
    return <MathRenderer content={content} />;
  }

  return (
    <div className={styles.exerciseWrapper}>
      {blocks.map((block, i) => (
        <ProblemBlock key={i} block={block} />
      ))}
    </div>
  );
}

function ProblemBlock({ block }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(block.raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = block.raw;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.problemBlock}>
      <div className={styles.problemContent}>
        <MathRenderer content={block.raw} />
      </div>
      <button
        className={`${styles.copyBtn} ${copied ? styles.copied : ""}`}
        onClick={handleCopy}
        title="問題文をコピー"
        aria-label="問題文をクリップボードにコピー"
      >
        {copied ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            コピー済み
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            問題文をコピー
          </>
        )}
      </button>
    </div>
  );
}

/**
 * ## ヘッダーを区切りとして本文をブロック配列に分割する。
 * 各ブロックは { raw: string } を持つ。
 */
function splitIntoProblems(content) {
  const lines = content.split("\n");
  const blocks = [];
  let currentLines = [];

  for (const line of lines) {
    if (line.startsWith("## ") && currentLines.length > 0) {
      const raw = currentLines.join("\n").trim();
      if (raw) blocks.push({ raw });
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  // 最後のブロックを追加
  if (currentLines.length > 0) {
    const raw = currentLines.join("\n").trim();
    if (raw) blocks.push({ raw });
  }

  return blocks;
}
