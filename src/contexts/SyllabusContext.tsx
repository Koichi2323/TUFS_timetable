import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Course } from '../types';
import { allSyllabusData as allCourses } from '../data/allSyllabusData';

interface SyllabusContextState {
  syllabusCourses: Course[];
  isLoading: boolean;
  error: Error | null;
  reloadSyllabus: () => void; // Function to manually reload data if needed
}

const SyllabusContext = createContext<SyllabusContextState | undefined>(undefined);

interface SyllabusProviderProps {
  children: ReactNode;
}

export const SyllabusProvider: React.FC<SyllabusProviderProps> = ({ children }) => {
  const [syllabusCourses, setSyllabusCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // console.log('SyllabusContext: Starting to load syllabus data...');
      const data = allCourses; // Use the pre-processed allCourses data
      // console.log(`SyllabusContext: Loaded ${data.length} courses.`);
      setSyllabusCourses(data);
    } catch (e) {
      console.error('SyllabusContext: Error loading syllabus data:', e);
      setError(e instanceof Error ? e : new Error('Failed to load syllabus data'));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const reloadSyllabus = () => {
    loadData(); // Public function to allow manual reload
  };

  return (
    <SyllabusContext.Provider value={{ syllabusCourses, isLoading, error, reloadSyllabus }}>
      {children}
    </SyllabusContext.Provider>
  );
};

export const useSyllabus = (): SyllabusContextState => {
  const context = useContext(SyllabusContext);
  if (context === undefined) {
    throw new Error('useSyllabus must be used within a SyllabusProvider');
  }
  return context;
};
