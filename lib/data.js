import { SUBJECTS_DATA } from "./subjectsData";

export const SUBJECTS = [
  { id: "math1", name: "数学①", color: "#6C63FF", icon: "📐" },
  { id: "math2", name: "数学②", color: "#FF6584", icon: "📊" },
  { id: "math3", name: "数学③", color: "#43E97B", icon: "📈" },
  { id: "science_math", name: "科学大数学", color: "#F9A826", icon: "🔬" },
];

export const CONTENT_TYPES = [
  { id: "self_study", name: "自習コーナー", icon: "📖", color: "#6C63FF" },
  { id: "example", name: "例題", icon: "📝", color: "#FF6584" },
  { id: "exercise", name: "演習問題", icon: "✏️", color: "#43E97B" },
];

export function getLectures(subjectId) {
  const subjectData = SUBJECTS_DATA[subjectId] || {};
  return Object.values(subjectData).sort((a, b) => a.number - b.number);
}

export function getLectureData(subjectId, lectureSlug) {
  const subjectData = SUBJECTS_DATA[subjectId] || {};
  return subjectData[lectureSlug] || null;
}

export function getContent(subjectId, lectureSlug, contentType = "exercise") {
  const lecture = getLectureData(subjectId, lectureSlug);
  if (!lecture || !lecture.contents || !lecture.contents[contentType]) return null;

  return {
    frontmatter: {},
    content: lecture.contents[contentType],
    subject: SUBJECTS.find((s) => s.id === subjectId),
    lecture: lectureSlug,
    type: CONTENT_TYPES.find((t) => t.id === contentType),
  };
}

export function getAllSubjectsOverview() {
  return SUBJECTS.map((subject) => {
    const lectures = getLectures(subject.id);
    return {
      ...subject,
      lectureCount: lectures.length,
      hasContent: lectures.some((l) => l.availableTypes.length > 0),
    };
  });
}
