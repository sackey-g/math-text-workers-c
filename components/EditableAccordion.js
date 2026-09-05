"use client";

import { useState, useEffect, useRef } from "react";
import MathRenderer from "./MathRenderer";
import styles from "./EditableAccordion.module.css";

export default function EditableAccordion({ subject, lecture, type, contentType, title, icon }) {
  const [text, setText] = useState("");
  const [savedText, setSavedText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/content?subject=${subject}&lecture=${lecture}&type=${type}&contentType=${contentType}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        const nextText = typeof data.text === "string" ? data.text : "";
        setText(nextText);
        setSavedText(nextText);
        setIsLoading(false);
        setIsOpen(false);
        setIsEditing(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error(err);
        setLoadError("読み込みに失敗しました");
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [subject, lecture, type, contentType]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [text, isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, lecture, type, contentType, text }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success !== true) {
        throw new Error(result.error || "Failed to save");
      }

      setSavedText(text);
      setIsEditing(false);
      if (text.trim()) setIsOpen(true);
    } catch (err) {
      console.error(err);
      setSaveError("保存に失敗しました。通信状態を確認して、もう一度お試しください。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setSaveError(null);
    setIsEditing(true);
    setIsOpen(true);
  };

  const handleCancel = () => {
    setText(savedText);
    setSaveError(null);
    setIsEditing(false);
    if (!savedText.trim()) setIsOpen(false);
  };

  if (isLoading) {
    return <div className={styles.loadingSkeleton}></div>;
  }

  if (loadError) {
    return <div className={styles.error}>{loadError}</div>;
  }

  const hasContent = text.trim().length > 0;

  if (!hasContent && !isEditing) {
    return (
      <button className={styles.addBtn} onClick={handleEdit}>
        <span className={styles.icon}>{icon}</span>
        {title}を追加
      </button>
    );
  }

  return (
    <div className={styles.accordion}>
      <button 
        className={styles.accordionHeader} 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className={styles.headerTitle}>
          <span className={styles.icon}>{icon}</span>
          <span className={styles.titleText}>{title}</span>
        </div>
        <div className={styles.headerRight}>
          <svg 
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className={styles.accordionContent}>
          {isEditing ? (
            <div className={styles.editMode}>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`${title}をMarkdownとTeXで記述...`}
                disabled={isSaving}
              />
              {saveError && <div className={styles.error}>{saveError}</div>}
              <div className={styles.actions}>
                <button type="button" className={`${styles.btnBase} ${styles.cancelBtn}`} onClick={handleCancel} disabled={isSaving}>キャンセル</button>
                <button type="button" className={`${styles.btnBase} ${styles.saveBtn}`} onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.viewMode}>
              <div className={styles.renderedContent}>
                <MathRenderer content={text} />
              </div>
              <button className={styles.editIconBtn} onClick={handleEdit} title="編集する">
                ✎ 編集
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
