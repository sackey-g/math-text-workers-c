"use client";

import { useState } from "react";
import Link from "next/link";
import { CONTENT_TYPES } from "@/lib/data";
import MathRenderer from "@/components/MathRenderer";
import ExerciseContent from "@/components/ExerciseContent";
import EditableAccordion from "@/components/EditableAccordion";
import styles from "../app/[subject]/[lecture]/page.module.css";
import sharedStyles from "../app/shared.module.css";

export default function LectureView({
  subject,
  lecture,
  subjectData,
  currentLecture,
  prevLec,
  nextLec,
}) {
  const availableTypes = currentLecture.availableTypes || [];
  const defaultType = availableTypes.includes("exercise")
    ? "exercise"
    : availableTypes[0] || "exercise";

  const [activeType, setActiveType] = useState(defaultType);

  const activeContent = currentLecture.contents?.[activeType] || null;

  return (
    <div className={sharedStyles.container}>
      <Link href={`/${subject}`} className={sharedStyles.backLink}>
        ← {subjectData.name} に戻る
      </Link>

      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <Link href={`/${subject}`}>{subjectData.name}</Link>
          <span>/</span>
          <span className={styles.breadcrumbActive}>{currentLecture.label}</span>
        </div>
        <h1 className={styles.pageTitle}>{currentLecture.label}</h1>
      </div>

      {availableTypes.length > 0 && (
        <div className={styles.tabs}>
          {availableTypes.map((typeId) => {
            const typeInfo = CONTENT_TYPES.find((ct) => ct.id === typeId);
            const isActive = activeType === typeId;
            return (
              <button
                key={typeId}
                type="button"
                onClick={() => setActiveType(typeId)}
                className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
              >
                {typeInfo?.icon} {typeInfo?.name}
              </button>
            );
          })}
        </div>
      )}

      {activeContent ? (
        <>
          <div className={styles.content}>
            {activeType === "exercise" ? (
              <ExerciseContent content={activeContent} />
            ) : (
              <MathRenderer content={activeContent} />
            )}
          </div>

          <div className={styles.accordionWrapper}>
            <EditableAccordion
              key={`${activeType}-answer`}
              subject={subject}
              lecture={lecture}
              type={activeType}
              contentType="answer"
              title="解答・解説"
              icon="💡"
            />
            <EditableAccordion
              key={`${activeType}-memo`}
              subject={subject}
              lecture={lecture}
              type={activeType}
              contentType="memo"
              title="メモ"
              icon="📝"
            />
          </div>
        </>
      ) : (
        <div className={sharedStyles.emptyState}>
          <div className={sharedStyles.emptyIcon}>📝</div>
          <p>このコンテンツはまだ作成されていません</p>
        </div>
      )}

      <div className={styles.nav}>
        {prevLec ? (
          <Link href={`/${subject}/${prevLec.slug}`} className={styles.navBtn}>
            ← {prevLec.label}
          </Link>
        ) : (
          <div />
        )}
        {nextLec ? (
          <Link href={`/${subject}/${nextLec.slug}`} className={styles.navBtn}>
            {nextLec.label} →
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
