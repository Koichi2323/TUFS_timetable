import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Course } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../../firebase';
import { collection, doc, setDoc, deleteDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';

// スケジュールコンテキストの型定義
export interface ScheduleContextType {
  userCourses: Course[];
  addCourse: (course: Course) => Promise<{ success: boolean; conflictCourse?: Course }>;
  removeCourse: (courseId: string) => Promise<void>;
  isCourseAdded: (courseId: string) => boolean;
  getConflictCourse: (dayOfWeek: number, period: number) => Course | undefined;
  hasTimeConflict: (dayOfWeek: number, period: number) => boolean;
}

// デフォルト値
const defaultScheduleContext: ScheduleContextType = {
  userCourses: [],
  addCourse: async () => ({ success: false }),
  removeCourse: async () => {},
  isCourseAdded: () => false,
  getConflictCourse: () => undefined,
  hasTimeConflict: () => false,
};

// コンテキストの作成
export const ScheduleContext = createContext<ScheduleContextType>(defaultScheduleContext);

// コンテキストプロバイダーの型定義
interface ScheduleProviderProps {
  children: ReactNode;
}

// コンテキストプロバイダーの実装
export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // AsyncStorageキー
  const STORAGE_KEY = '@userCourses';

  // アプリ起動時にAsyncStorageからデータを読み込む
  useEffect(() => {
    const loadUserCourses = async () => {
      try {
        const storedCourses = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedCourses !== null) {
          const parsedCourses = JSON.parse(storedCourses);
          setUserCourses(parsedCourses);
        } else {
          setUserCourses([]); // AsyncStorageにデータがない場合は空の配列をセット
        }
      } catch (error) {
        console.error('[ScheduleContext] Failed to load user courses from storage', error);
        setUserCourses([]); // エラー時も空の配列をセット
      } finally {
        setIsLoading(false);
      }
    };

    loadUserCourses();
  }, []);

  // userCoursesが変更されたらAsyncStorageに保存する
  useEffect(() => {
    const saveUserCourses = async () => {
      if (!isLoading) { // 初回ロード時は保存しない
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userCourses));
        } catch (error) {
          console.error('[ScheduleContext] Failed to save user courses to storage', error);
        }
      }
    };

    saveUserCourses();
  }, [userCourses, isLoading]);

  // 時間帯の重複をチェック
  const getConflictCourse = (dayOfWeek: number, period: number): Course | undefined => {
    return userCourses.find(
      (course) => course.dayOfWeek === dayOfWeek && course.period === period
    );
  };
  
  // 時間帯に重複があるかどうかをチェック
  const hasTimeConflict = (dayOfWeek: number, period: number): boolean => {
    return userCourses.some(
      (course) => course.dayOfWeek === dayOfWeek && course.period === period
    );
  };

  // 授業を追加
  const addCourse = async (course: Course): Promise<{ success: boolean; conflictCourse?: Course }> => {
    // すでに追加されている場合は何もしない
    if (isCourseAdded(course.id)) {
      return { success: false };
    }
    
    // 時間帯の重複をチェック
    // const conflictCourse = getConflictCourse(course.dayOfWeek, course.period);
    // if (conflictCourse) {
    //   return { success: false, conflictCourse };
    // }
    
    setUserCourses((prevCourses) => {
      const newCourses = [...prevCourses, course];
      return newCourses;
    });

    if (!auth.currentUser) {
      console.error("[ScheduleContext] User not authenticated. Cannot add course to Firestore.");
      // Rollback local change if needed, though isCourseAdded should prevent this path if already added
      setUserCourses((prevCourses) => prevCourses.filter(c => c.id !== course.id)); 
      return { success: false };
    }

    try {
      const userCourseRef = doc(collection(db, 'userCourses'));
      await setDoc(userCourseRef, {
        userId: auth.currentUser.uid,
        courseId: course.id,
      });
      console.log('[ScheduleContext] Course added to Firestore:', course.id);
      return { success: true };
    } catch (error) {
      console.error('[ScheduleContext] Failed to add course to Firestore', error);
      setUserCourses((prevCourses) => prevCourses.filter(c => c.id !== course.id));
      return { success: false };
    }
  };

  // 授業を削除
  const removeCourse = async (courseId: string): Promise<void> => {
    console.log('[ScheduleContext] Attempting to remove course:', courseId);
    const courseToRemove = userCourses.find(c => c.id === courseId);
    setUserCourses((prevCourses) => {
      const updatedCourses = prevCourses.filter((course) => course.id !== courseId);
      console.log('[ScheduleContext] Local userCourses updated:', updatedCourses);
      return updatedCourses;
    });

    if (!auth.currentUser) {
      console.error("[ScheduleContext] User not authenticated. Cannot remove course from Firestore.");
      // Rollback local change
      if (courseToRemove) setUserCourses((prevCourses) => [...prevCourses, courseToRemove]);
      return;
    }
    console.log('[ScheduleContext] Current user ID:', auth.currentUser.uid);

    try {
      const userCoursesRef = collection(db, 'userCourses');
      const q = query(userCoursesRef, where('userId', '==', auth.currentUser.uid), where('courseId', '==', courseId));
      console.log('[ScheduleContext] Firestore query created for courseId:', courseId, 'and userId:', auth.currentUser.uid);
      
      const querySnapshot = await getDocs(q);
      console.log('[ScheduleContext] Firestore query snapshot size:', querySnapshot.size);
      querySnapshot.forEach((doc) => {
        console.log('[ScheduleContext] Document to be deleted:', doc.id, doc.data());
      });

      if (querySnapshot.empty) {
        console.warn('[ScheduleContext] No matching document found in Firestore to delete for courseId:', courseId);
      }

      const batch = writeBatch(db);
      querySnapshot.forEach((document) => {
        batch.delete(document.ref);
      });
      await batch.commit();
      console.log('[ScheduleContext] Course removed from Firestore (batch committed):', courseId);
    } catch (error) {
      console.error('[ScheduleContext] Failed to remove course from Firestore', error);
      if (courseToRemove) {
        console.log('[ScheduleContext] Rolling back local state for course:', courseToRemove.id);
        setUserCourses((prevCourses) => [...prevCourses, courseToRemove]);
      }
    }
  };

  // 授業が追加されているかチェック
  const isCourseAdded = (courseId: string): boolean => {
    return userCourses.some((course) => course.id === courseId);
  };

  if (isLoading) {
    return null;
  }

  return (
    <ScheduleContext.Provider
      value={{
        userCourses,
        addCourse,
        removeCourse,
        isCourseAdded,
        getConflictCourse,
        hasTimeConflict,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

// カスタムフック
export const useSchedule = () => useContext(ScheduleContext);

export default ScheduleContext;
