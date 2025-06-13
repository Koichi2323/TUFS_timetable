import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Course } from '../types';
import { db, auth } from '../../firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ASYNC_STORAGE_COURSES_KEY = 'userCourses_offline_v2'; // Changed key to avoid conflicts with old data structure

export interface ScheduleContextType {
  userCourses: Course[];
  addCourse: (course: Course) => Promise<{ success: boolean; conflictCourse?: Course }>;
  removeCourse: (courseId: string) => Promise<void>;
  updateCourse: (courseId: string, updatedData: Partial<Course>) => Promise<void>;
  isCourseAdded: (courseId: string) => boolean;
  getConflictCourse: (dayOfWeek: number, period: number) => Course | undefined;
  hasTimeConflict: (dayOfWeek: number, period: number) => boolean;
  isLoading: boolean; // Added isLoading
}

const defaultScheduleContext: ScheduleContextType = {
  userCourses: [],
  addCourse: async () => ({ success: false }),
  removeCourse: async () => {},
  updateCourse: async () => {},
  isCourseAdded: () => false,
  getConflictCourse: () => undefined,
  hasTimeConflict: () => false,
  isLoading: true,
};

export const ScheduleContext = createContext<ScheduleContextType>(defaultScheduleContext);

interface ScheduleProviderProps {
  children: ReactNode;
}

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser); // Initialize with current user

  // Helper to load courses from AsyncStorage
  const loadCoursesFromAsyncStorage = async (): Promise<Course[]> => {
    try {
      const storedCourses = await AsyncStorage.getItem(ASYNC_STORAGE_COURSES_KEY);
      return storedCourses ? JSON.parse(storedCourses) as Course[] : [];
    } catch (error) {
      console.error('[ScheduleContext] Failed to load courses from AsyncStorage:', error);
      return [];
    }
  };

  // Helper to save courses to AsyncStorage
  const saveCoursesToAsyncStorage = async (courses: Course[]) => {
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_COURSES_KEY, JSON.stringify(courses));
    } catch (error) {
      console.error('[ScheduleContext] Failed to save courses to AsyncStorage:', error);
    }
  };
  
  // Helper to clear courses from AsyncStorage
  const clearAsyncStorageCourses = async () => {
    try {
      await AsyncStorage.removeItem(ASYNC_STORAGE_COURSES_KEY);
      console.log('[ScheduleContext] Cleared courses from AsyncStorage.');
    } catch (error) {
      console.error('[ScheduleContext] Failed to clear courses from AsyncStorage:', error);
    }
  };

  // Helper to load courses from Firestore
  const loadCoursesFromFirestore = async (userId: string): Promise<Course[]> => {
    try {
      const coursesColRef = collection(db, 'users', userId, 'courses');
      const querySnapshot = await getDocs(coursesColRef);
      const courses: Course[] = [];
      querySnapshot.forEach((doc) => {
        courses.push({ id: doc.id, ...doc.data() } as Course);
      });
      console.log('[ScheduleContext] Loaded courses from Firestore:', courses.length);
      return courses;
    } catch (error) {
      console.error('[ScheduleContext] Failed to load courses from Firestore:', error);
      return [];
    }
  };

  // Helper to merge local courses to Firestore
  const mergeAsyncStorageToFirestore = async (userId: string, localCourses: Course[], firestoreCourses: Course[]) => {
    if (localCourses.length === 0) return; // Nothing to merge

    const batch = writeBatch(db);
    let newCoursesSynced = 0;
    const firestoreCourseIds = new Set(firestoreCourses.map(c => c.id));

    localCourses.forEach((localCourse: Course) => {
      const { id, ...courseData } = localCourse;
      const courseDocRef = doc(db, 'users', userId, 'courses', id);
      batch.set(courseDocRef, courseData); // Set will create or overwrite
      if (!firestoreCourseIds.has(id)) {
        newCoursesSynced++;
      }
    });

    try {
      await batch.commit();
      console.log(`[ScheduleContext] Synced ${localCourses.length} local courses to Firestore. New courses added: ${newCoursesSynced}`);
    } catch (error) {
      console.error('[ScheduleContext] Failed to merge local courses to Firestore:', error);
    }
  };

  useEffect(() => {
    const initializeAndSync = async (user: User | null) => {
      setIsLoading(true);
      if (user) {
        console.log('[ScheduleContext] User signed in:', user.uid);
        const localCourses = await loadCoursesFromAsyncStorage();
        const firestoreCourses = await loadCoursesFromFirestore(user.uid);
        
        if (localCourses.length > 0) {
          await mergeAsyncStorageToFirestore(user.uid, localCourses, firestoreCourses);
          await clearAsyncStorageCourses();
          // Reload from Firestore to get the definitive state after merge
          const finalCourses = await loadCoursesFromFirestore(user.uid);
          setUserCourses(finalCourses);
        } else {
          setUserCourses(firestoreCourses);
        }
      } else {
        console.log('[ScheduleContext] User signed out / No user.');
        const localCourses = await loadCoursesFromAsyncStorage();
        setUserCourses(localCourses);
      }
      setIsLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      initializeAndSync(user);
    });

    // Initial load if user is already authenticated (e.g. app restart)
    if (auth.currentUser && !currentUser) { // Check if currentUser state needs update
        initializeAndSync(auth.currentUser);
    }

    return () => unsubscribe();
  }, []); // Empty dependency array: runs once on mount and cleans up on unmount

  const getConflictCourse = (dayOfWeek: number, period: number): Course | undefined => {
    return userCourses.find(
      (c: Course) => c.dayOfWeek === dayOfWeek && c.period === period
    );
  };
  
  const hasTimeConflict = (dayOfWeek: number, period: number): boolean => {
    return userCourses.some(
      (c: Course) => c.dayOfWeek === dayOfWeek && c.period === period
    );
  };

  const isCourseAdded = (courseId: string): boolean => {
    return userCourses.some((c: Course) => c.id === courseId);
  };

  const addCourse = async (course: Course): Promise<{ success: boolean; conflictCourse?: Course }> => {
    if (isCourseAdded(course.id)) return { success: false }; // Already added
    if (typeof course.dayOfWeek !== 'number' || typeof course.period !== 'number') return { success: false }; // Invalid data
    const conflict = getConflictCourse(course.dayOfWeek, course.period);
    if (conflict) return { success: false, conflictCourse: conflict }; // Conflict

    const newCourses = [...userCourses, course];
    setUserCourses(newCourses); // Optimistic update

    if (currentUser) {
      try {
        const { id, ...courseData } = course;
        console.log('[ScheduleContext] Attempting to add course to Firestore. UserID:', currentUser.uid, 'CourseID:', id, 'CourseData:', JSON.stringify(courseData, null, 2));
        await setDoc(doc(db, 'users', currentUser.uid, 'courses', id), courseData);
        return { success: true };
      } catch (error) {
        setUserCourses(userCourses); // Rollback
        console.error("Error adding document to Firestore: ", error);
        return { success: false };
      }
    } else {
      await saveCoursesToAsyncStorage(newCourses);
      return { success: true };
    }
  };

  const updateCourse = async (courseId: string, updatedData: Partial<Course>) => {
    const originalCourses = [...userCourses];
    const newCourses = userCourses.map((c: Course) => 
      c.id === courseId ? { ...c, ...updatedData } : c
    );
    setUserCourses(newCourses); // Optimistic update

    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'courses', courseId), updatedData, { merge: true });
      } catch (error) {
        setUserCourses(originalCourses); // Rollback
      }
    } else {
      await saveCoursesToAsyncStorage(newCourses);
    }
  };

  const removeCourse = async (courseId: string): Promise<void> => {
    const originalCourses = [...userCourses];
    const newCourses = userCourses.filter((c: Course) => c.id !== courseId);
    setUserCourses(newCourses); // Optimistic update

    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'courses', courseId));
      } catch (error) {
        setUserCourses(originalCourses); // Rollback
      }
    } else {
      await saveCoursesToAsyncStorage(newCourses);
    }
  };

  return (
    <ScheduleContext.Provider
      value={{
        userCourses,
        addCourse,
        removeCourse,
        updateCourse,
        isCourseAdded,
        getConflictCourse,
        hasTimeConflict,
        isLoading,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => useContext(ScheduleContext);
