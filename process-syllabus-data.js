const fs = require('fs');
const iconv = require('iconv-lite');
const path = require('path');
// importCourses.js の convertJSONToCourse 関数をインポート
// importCourses.js が ESM (ES Modules) で書かれている場合は、動的 import() を使うか、
// このスクリプト自体を ESM にする必要がある。
// ここでは commonJS 形式で書かれていると仮定する。
// もし importCourses.js が `export function` を使っているなら、
// このスクリプトの package.json で "type": "module" を指定するか、
// .mjs 拡張子でこのスクリプトを保存する必要がある。
// 一旦、require で試みます。
const { convertJSONToCourse } = require('./dist/src/utils/importCourses.js');

// --- 設定項目 ---
// JSONファイルが格納されている親ディレクトリのパス (USERの環境に合わせて変更が必要)
const syllabusDataBaseDir = '/Users/koichi/Downloads/シラバス情報/'; // 例: 2025_01春学期, 2025_02秋学期 の親
// 処理対象とする学期フォルダのパターン (正規表現)
const semesterDirPattern = /^\d{4}_\d{2}(春学期|秋学期)$/; // 例: "2025_01春学期"
// 出力するTSファイルパス
const outputFilePath = path.resolve(__dirname, 'src/data/allSyllabusData.ts');
// --- 設定項目ここまで ---

// Helper function to extract faculty and refined category
function extractFacultyAndCategory(deptDirName, jsonFileName) {
  let faculty = deptDirName; // Default to the directory name
  let refinedCategory = ''; // Default category

  // Faculty mapping (prefix removal and specific names)
  const deptDirNameLower = deptDirName.toLowerCase();
  if (deptDirNameLower.startsWith('01_') || deptDirNameLower.includes('世界教養')) faculty = '世界教養学部';
  else if (deptDirNameLower.startsWith('02_') || deptDirNameLower.includes('言語文化')) faculty = '言語文化学部';
  else if (deptDirNameLower.startsWith('03_') || deptDirNameLower.includes('国際社会')) faculty = '国際社会学部';
  else if (deptDirNameLower.startsWith('04_') || deptDirNameLower.includes('国際日本')) faculty = '国際日本学部';
  else if (deptDirNameLower.includes('大学院')) faculty = '大学院';
  // Add more mappings if needed

  // Category extraction from file name (example: "概論", "専門")
  const fileNameLower = jsonFileName.toLowerCase();
  if (fileNameLower.includes('導入')) refinedCategory = '導入';
  else if (fileNameLower.includes('概論')) refinedCategory = '概論';
  else if (fileNameLower.includes('専門')) refinedCategory = '専門';
  else if (fileNameLower.includes('専攻言語')) refinedCategory = '専攻言語';
  else if (fileNameLower.includes('教養外国語')) refinedCategory = '教養外国語';
  
  // If no specific category found in filename, use a general one or leave empty
  // For "世界教養学部", if no other category, it's often a general category.
  if ((faculty === '世界教養学部' || faculty === '国際日本学部') && !refinedCategory) refinedCategory = '全'; // Default for these faculties
  if (faculty === '大学院' && !refinedCategory) refinedCategory = '大学院'; // Default for graduate school

  // Fallback category to deptDirName if not refined from filename and not a default one
  return { faculty, category: refinedCategory || deptDirName.split('_').pop() || deptDirName }; 
}

async function processSyllabusFiles() {
  let allCourses = [];
  console.log(`Starting syllabus data processing from: ${syllabusDataBaseDir}`);

  try {
    const yearSemesterDirs = fs.readdirSync(syllabusDataBaseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && semesterDirPattern.test(dirent.name))
      .map(dirent => dirent.name);

    if (yearSemesterDirs.length === 0) {
      console.warn(`No semester directories found matching pattern in ${syllabusDataBaseDir}. Check semesterDirPattern.`);
      return;
    }
    console.log(`Found semester directories: ${yearSemesterDirs.join(', ')}`);

    for (const semesterDirName of yearSemesterDirs) {
      const currentAcademicYearString = semesterDirName.substring(0, 4);
      if (currentAcademicYearString !== "2025") { // Filter for 2025
        console.log(`Skipping processing for directory ${semesterDirName} as it's not for the year 2025.`);
        continue; 
      }
      const academicYearFor2025 = "2025年度"; // Use this for courses from 2025 directories

      const semesterPath = path.join(syllabusDataBaseDir, semesterDirName);
      const departmentDirs = fs.readdirSync(semesterPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const deptDirName of departmentDirs) {
        const deptPath = path.join(semesterPath, deptDirName);
        const jsonFiles = fs.readdirSync(deptPath)
          .filter(file => file.endsWith('.json'));

        for (const jsonFile of jsonFiles) {
          const filePath = path.join(deptPath, jsonFile);
          // Updated log message to include the year being processed
          console.log(`Processing file: ${filePath} (for year ${academicYearFor2025})`); 
          try {
            const fileContent = fs.readFileSync(filePath, 'utf8'); // Assume UTF-8 for _fixed.json files
            const jsonData = JSON.parse(fileContent);
            
            if (Array.isArray(jsonData)) {
              jsonData.forEach(item => {

                const semesterMatch = semesterDirName.match(/(春学期|秋学期)/);
                const semester = semesterMatch ? semesterMatch[0] : undefined;
                
                // Extract faculty and refined category
                const { faculty, category: refinedCategory } = extractFacultyAndCategory(deptDirName, jsonFile);

                // Pass the filtered academicYearFor2025, extracted faculty, refinedCategory, and semester
                const course = convertJSONToCourse(item, academicYearFor2025, faculty, refinedCategory, semester);
                if (course && course.id && course.id.trim() !== '') {
                  allCourses.push(course);
                } else {
                  console.warn(`Skipping item due to missing or empty id. Original item: ${JSON.stringify(item)}`);
                }
              });
            } else {
              console.warn(`Skipping file ${filePath} as its content is not a JSON array.`);
            }
          } catch (e) {
            console.error(`Error processing file ${filePath}:`, e);
          }
        }
      }
    }


    const outputContent = `// This file is auto-generated. Do not edit manually.\n// Generated at ${new Date().toISOString()}\n\nimport { Course } from '../types';\n\nexport const allSyllabusData: Course[] = ${JSON.stringify(allCourses, null, 2)};\n`;

    fs.writeFileSync(outputFilePath, outputContent, 'utf-8');
    console.log(`Successfully processed ${allCourses.length} courses (for year 2025).`); // Updated log
    console.log(`Output written to ${outputFilePath}`);

  } catch (error) {
    console.error('Error during syllabus data processing:', error);
  }
}

processSyllabusFiles();
