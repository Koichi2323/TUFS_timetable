const fs = require('fs');

// allSyllabusData.ts は export default ではないので、ファイルの内容を読み込んで手動でパースします
const filePath = './src/data/allSyllabusData.ts';

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  // export default を取り除き、JSONとしてパース可能な形式に変換
  const jsonString = data.substring(data.indexOf('['));
  let courses = [];
  try {
    // JavaScriptの配列として評価
    courses = eval(jsonString);
  } catch (e) {
    console.error('Error parsing the course data:', e);
    return;
  }

  const targetDay = 2; // 火曜日
  const targetPeriod = 3; // 3限

  const foundCourses = courses.filter(course => {
    const isTargetDayPeriod = course.dayOfWeek === targetDay && course.period === targetPeriod;
    const hasPortuguese = course.name.includes('ポルトガル') || course.name.includes('ﾎﾟﾙﾄｶﾞﾙ') || course.title.includes('ポルトガル') || course.title.includes('ﾎﾟﾙﾄｶﾞﾙ');
    return isTargetDayPeriod && hasPortuguese;
  });

  if (foundCourses.length > 0) {
    console.log('Found matching courses:');
    console.log(JSON.stringify(foundCourses, null, 2));
  } else {
    console.log('No matching course found for 火曜3限 with ポルトガル.');
  }
});
