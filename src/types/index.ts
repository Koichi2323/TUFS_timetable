// アプリで使用するデータ型の定義
export interface Course {
  id: string;           // 履修コード（例: 19101103）
  name: string;         // 科目名（例: 専攻言語（ポルトガル語I））
  professor: string;    // 担当教員（例: ピシテリ）
  title: string;        // 授業題目（例: Portuguese I）
  dayOfWeek: number;    // 曜日（0: 月, 1: 火, ..., 4: 金）
  period: number;       // 時限（1, 2, 3, ...）
  room: string;         // 教室（例: 746）
  class_name?: string;  // クラス (JSONの "クラス" に対応)
  semester?: string;    // 学期（例: 春学期）
  language?: string;    // 使用言語（例: 日本語）
  syllabusUrl?: string; // シラバスURL
  credits?: number;     // 単位数 (任意、手入力想定)
  color?: string;       // 表示色 (任意、ユーザー設定)
  memo?: string;        // メモ (任意、ユーザー入力)
}

// ユーザーが登録した授業
export interface UserCourse {
  id: string;           // ユーザー授業ID
  userId: string;       // ユーザーID
  courseId: string;     // 授業ID
  createdAt: Date;      // 登録日時
}
