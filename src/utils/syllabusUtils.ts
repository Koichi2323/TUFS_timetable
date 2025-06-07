import { Course } from '../types';

// Define the structure of the raw JSON course object from the syllabus files
interface RawSyllabusCourse {
  '履修コード添付リンク'?: string | null;
  '履修コード': string;
  '科目題目': string;
  '担当教員': string;
  '授業題目': string;
  'クラス'?: string | null;
  '曜日時限': string; // e.g., "月3"
  '使用言語'?: string | null;
  '教室': string;
  // Allow other properties that might exist in the JSON
  [key: string]: any;
}

const dayMapping: { [key: string]: number } = {
  '月': 0,
  '火': 1,
  '水': 2,
  '木': 3,
  '金': 4,
  '土': 5, // In case Saturday courses are ever included
};

/**
 * Parses a day/period string (e.g., "月3") into dayOfWeek and period numbers.
 * dayOfWeek is 0-indexed (Monday=0, Tuesday=1, ...).
 */
export function parseDayOfWeekAndPeriod(dayPeriodStr: string): { dayOfWeek: number; period: number } | null {
  if (!dayPeriodStr || dayPeriodStr.length < 2) {
    console.warn(`Invalid dayPeriodStr (too short or null): ${dayPeriodStr}`);
    return null;
  }
  const dayChar = dayPeriodStr.charAt(0);
  const periodStr = dayPeriodStr.substring(1);

  const dayOfWeek = dayMapping[dayChar];
  const period = parseInt(periodStr, 10);

  if (dayOfWeek === undefined || isNaN(period)) {
    console.warn(`Invalid dayPeriodStr (parse error): ${dayPeriodStr}, dayChar: ${dayChar}, periodStr: ${periodStr}`);
    return null;
  }
  return { dayOfWeek, period };
}

/**
 * Maps a raw syllabus course object from the JSON to the app's Course interface.
 */
export function mapRawSyllabusCourseToCourse(rawCourse: RawSyllabusCourse): Course | null {
  const dayOfWeekAndPeriod = parseDayOfWeekAndPeriod(rawCourse['曜日時限']);
  if (!dayOfWeekAndPeriod) {
    // parseDayOfWeekAndPeriod will log a warning
    return null; // Skip if day/period is invalid
  }

  return {
    id: rawCourse['履修コード'],
    name: rawCourse['科目題目'],
    professor: rawCourse['担当教員'],
    title: rawCourse['授業題目'],
    dayOfWeek: dayOfWeekAndPeriod.dayOfWeek,
    period: dayOfWeekAndPeriod.period,
    room: rawCourse['教室'],
    class_name: rawCourse['クラス'] || undefined,
    semester: '春学期', // As specified by the user for these files
    language: rawCourse['使用言語'] || undefined,
    syllabusUrl: rawCourse['履修コード添付リンク'] || undefined,
    credits: undefined, // User will input later if needed
    color: undefined,   // User will set later
  };
}

/**
 * Loads all syllabus data from the JSON files included in the assets.
 * Returns an array of Course objects.
 */
export function loadAllSyllabusData(): Course[] {
  const filePaths = [
    '../assets/syllabusData/2025春学期_世界教養_月曜日_全件.json',
    '../assets/syllabusData/2025春学期_世界教養_火曜日_全件.json',
    '../assets/syllabusData/2025春学期_世界教養_水曜日_全件.json',
    '../assets/syllabusData/2025春学期_世界教養_木曜日_全件.json',
    '../assets/syllabusData/2025春学期_世界教養_金曜日_全件.json',
  ];

  let allCourses: Course[] = [];
  filePaths.forEach((path, index) => {
    try {
      let fileData;
      if (path.includes('月曜日')) fileData = require('../assets/syllabusData/2025春学期_世界教養_月曜日_全件.json');
      else if (path.includes('火曜日')) fileData = require('../assets/syllabusData/2025春学期_世界教養_火曜日_全件.json');
      else if (path.includes('水曜日')) fileData = require('../assets/syllabusData/2025春学期_世界教養_水曜日_全件.json');
      else if (path.includes('木曜日')) fileData = require('../assets/syllabusData/2025春学期_世界教養_木曜日_全件.json');
      else if (path.includes('金曜日')) fileData = require('../assets/syllabusData/2025春学期_世界教養_金曜日_全件.json');
      
      console.log(`Data from ${path}:`, fileData ? `loaded ${Array.isArray(fileData) ? fileData.length : 'non-array'} items` : 'is null/undefined');

      if (Array.isArray(fileData)) {
        const coursesFromFile: Course[] = fileData
          .map(raw => mapRawSyllabusCourseToCourse(raw as RawSyllabusCourse))
          .filter(course => course !== null) as Course[];
        allCourses = allCourses.concat(coursesFromFile);
        console.log(`Successfully parsed ${coursesFromFile.length} courses from ${path}`);
      } else {
        console.warn(`Syllabus file data at ${path} (index ${index}) is not an array or is undefined.`);
      }
    } catch (e) {
      console.error(`Error requiring or processing file ${path}:`, e);
    }
  });
  console.log('Total courses loaded:', allCourses.length);
  return allCourses;
}
