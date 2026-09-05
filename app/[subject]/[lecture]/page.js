import { notFound } from "next/navigation";
import { SUBJECTS, getLectures, getLectureData } from "@/lib/data";
import LectureView from "@/components/LectureView";

export function generateStaticParams() {
  const params = [];
  for (const s of SUBJECTS) {
    const lectures = getLectures(s.id);
    for (const lec of lectures) {
      params.push({ subject: s.id, lecture: lec.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }) {
  const { subject, lecture } = await params;
  const s = SUBJECTS.find((x) => x.id === subject);
  const currentLecture = getLectureData(subject, lecture);
  if (!s || !currentLecture) return {};
  return { title: `${currentLecture.label} | ${s.name} | 河合塾 数学テキスト（後期）` };
}

export default async function LecturePage({ params }) {
  const { subject, lecture } = await params;

  const subjectData = SUBJECTS.find((s) => s.id === subject);
  if (!subjectData) notFound();

  const lectures = getLectures(subject);
  const currentLecture = getLectureData(subject, lecture);
  if (!currentLecture) notFound();

  // 前後の講義
  const currentIdx = lectures.findIndex((l) => l.slug === lecture);
  const prevLec = currentIdx > 0 ? lectures[currentIdx - 1] : null;
  const nextLec = currentIdx < lectures.length - 1 ? lectures[currentIdx + 1] : null;

  return (
    <LectureView
      subject={subject}
      lecture={lecture}
      subjectData={subjectData}
      currentLecture={currentLecture}
      prevLec={prevLec ? { slug: prevLec.slug, label: prevLec.label } : null}
      nextLec={nextLec ? { slug: nextLec.slug, label: nextLec.label } : null}
    />
  );
}
