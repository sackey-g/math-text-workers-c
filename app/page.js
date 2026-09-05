import Link from "next/link";
import { getAllSubjectsOverview } from "@/lib/data";
import styles from "./page.module.css";



export default function Home() {
  const subjects = getAllSubjectsOverview();

  return (
    <div className={styles.hero}>
      <p className={styles.logo}>Kawaijuku Digital</p>
      <h1 className={styles.title}>数学テキスト（後期）</h1>
      <p className={styles.subtitle}>
        河合塾の後期数学テキストをスマートフォンやタブレットで快適に閲覧
      </p>
      <div className={styles.grid}>
        {subjects.map((subject) => (
          <Link key={subject.id} href={`/${subject.id}`}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <span>{subject.icon}</span>
              </div>
              <div className={styles.cardTitle}>{subject.name}</div>
              <div className={styles.cardMeta}>
                {subject.lectureCount > 0 ? (
                  <span className={styles.badge}>
                    {subject.lectureCount}講 収録済み
                  </span>
                ) : (
                  <span className={`${styles.badge} ${styles.emptyBadge}`}>
                    準備中
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
