import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Course } from '../types';

// スケジュールコンテキストの型定義
interface ScheduleContextType {
  userCourses: Course[];
  addCourse: (course: Course) => { success: boolean; conflictCourse?: Course };
  removeCourse: (courseId: string) => void;
  isCourseAdded: (courseId: string) => boolean;
  getConflictCourse: (dayOfWeek: number, period: number) => Course | undefined;
  hasTimeConflict: (dayOfWeek: number, period: number) => boolean;
}

// デフォルト値
const defaultScheduleContext: ScheduleContextType = {
  userCourses: [],
  addCourse: () => ({ success: false }),
  removeCourse: () => {},
  isCourseAdded: () => false,
  getConflictCourse: () => undefined,
  hasTimeConflict: () => false,
};

// コンテキストの作成
const ScheduleContext = createContext<ScheduleContextType>(defaultScheduleContext);

// コンテキストプロバイダーの型定義
interface ScheduleProviderProps {
  children: ReactNode;
}

// コンテキストプロバイダーの実装
export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  const [userCourses, setUserCourses] = useState<Course[]>([]);

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
  const addCourse = (course: Course): { success: boolean; conflictCourse?: Course } => {
    // すでに追加されている場合は何もしない
    if (isCourseAdded(course.id)) {
      return { success: false };
    }
    
    // 時間帯の重複をチェック
    const conflictCourse = getConflictCourse(course.dayOfWeek, course.period);
    if (conflictCourse) {
      return { success: false, conflictCourse };
    }
    
    setUserCourses((prevCourses) => [...prevCourses, course]);
    return { success: true };
  };

  // 授業を削除
  const removeCourse = (courseId: string) => {
    setUserCourses((prevCourses) => 
      prevCourses.filter((course) => course.id !== courseId)
    );
  };

  // 授業が追加されているかチェック
  const isCourseAdded = (courseId: string): boolean => {
    return userCourses.some((course) => course.id === courseId);
  };

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
