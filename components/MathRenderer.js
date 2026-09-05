"use client";

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import styles from './MathRenderer.module.css';

export default function MathRenderer({ content }) {
  if (!content) return null;

  return (
    <div className={styles.markdownBody}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ node, ...props }) => <div className={styles.markdownParagraph} {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
