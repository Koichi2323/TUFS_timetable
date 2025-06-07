import { Course } from './index';

// Firestoreからのレスポンス型
export interface FirestoreResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 検索結果の型
export interface SearchResult {
  courses: Course[];
  totalResults: number;
}

// Firestoreのドキュメント参照型
export interface DocumentReference {
  id: string;
  path: string;
}

// ユーザー型
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  courses?: string[]; // コースIDの配列
}
