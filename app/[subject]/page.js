import Link from "next/link";
import { notFound } from "next/navigation";
import { SUBJECTS, CONTENT_TYPES, getLectures } from "@/lib/data";
import styles from "./page.module.css";
import sharedStyles from "../shared.module.css";



export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ subject: s.id }));
}

export async function generateMetadata({ params }) {
  const { subject } = await params;
  const s = SUBJECTS.find((x) => x.id === subject);
  if (!s) return {};
  return { title: `${s.name} | 河合塾 数学テキスト（後期）` };
}

export default async function SubjectPage({ params }) {
  const { subject } = await params;
  const subjectData = SUBJECTS.find((s) => s.id === subject);
  if (!subjectData) notFound();

  const lectures = getLectures(subject);
  const color = subjectData.color || "#6C63FF";

  return (
    <div className={sharedStyles.container}>
      <Link href="/" className={sharedStyles.backLink}>← ホームに戻る</Link>
      <div className={styles.header}>
        <p className={styles.subjectLabel} style={{ color }}>{subjectData.name}</p>
        <h1 className={styles.pageTitle}>講義一覧</h1>
        <p className={styles.pageDesc}>学習したい講義を選んでください</p>
      </div>
      {lectures.length === 0 ? (
        <div className={sharedStyles.emptyState}>
          <div className={sharedStyles.emptyIcon}>📚</div>
          <p>まだコンテンツが登録されていません</p>
        </div>
      ) : (
        <div className={styles.lectureList}>
          {lectures.map((lec) => (
            <Link key={lec.slug} href={`/${subject}/${lec.slug}`}>
              <div className={styles.lectureCard}>
                <div className={styles.lectureNum} style={{ color }}>{lec.number}</div>
                <div className={styles.lectureInfo}>
                  <div className={styles.lectureName}>{lec.label}</div>
                  <div className={styles.typeBadges}>
                    {lec.availableTypes.map((t) => {
                      const typeInfo = CONTENT_TYPES.find((ct) => ct.id === t);
                      return (
                        <span key={t} className={styles.typeBadge}>
                          {typeInfo?.icon} {typeInfo?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <span className={styles.arrow}>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
