export type Course = {
  id: string;
  name: string;
  title?: string; // Corresponds to '授業題目'
  professor?: string; // Optional as it might not be in all Course contexts
  room?: string;      // Optional
  credits?: number;   // Optional
  dayOfWeek?: number; // Should be 1 (Mon) to 5 (Fri), or undefined
  period?: number;    // Should be 1 to 8, or undefined
  color?: string;     // Optional, for UI
  // Fields from SyllabusContext or other sources
  code?: string; // 科目コード
  targetStudents?: string; // 対象学生
  faculty?: string; // 開講学部・学科
  semester?: string; // 開講時期 (例: "春学期", "秋学期", "通年")
  language?: string; // 使用言語
  description?: string; // 授業概要
  notes?: string; // 備考
  syllabusUrl?: string; // シラバスURL (オプショナル)
  courseCode?: string; // 履修コード (オプショナル)
  category?: string; // Added for course categorization based on source folder
  class_name?: string; // クラス名 (提供データに依存)
  department?: string; // 学部 (より詳細な分類用)
  time?: string; // Optional, might be combined dayOfWeek/period
  instructor?: string; // Optional, alias for professor
  // Fields specifically for AttendanceScreen, make them optional if not universally present
  attendanceRate?: number;
  totalClasses?: number;
  attendedClasses?: number;
  absentClasses?: number;
  lateClasses?: number;
  academicYear?: string; // 開講年度 (例: "2024年度")
  memo?: string; // ユーザーが追加するメモ
};

// You can add other shared types here, for example:
// export type UserProfile = {
//   uid: string;
//   email: string | null;
//   displayName: string | null;
//   photoURL: string | null;
//   faculty?: string;
// };
