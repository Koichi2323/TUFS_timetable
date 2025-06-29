const fs = require('fs');
const path = require('path');

// スクリプトがプロジェクトのルートディレクトリにあると仮定
const filePath = path.join(__dirname, 'src', 'data', 'allSyllabusData.ts');

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('ファイルの読み込みエラー:', err);
    return;
  }

  // 'export default ' と ' as const;' を取り除き、配列部分のみを抽出
  const startIndex = data.indexOf('[');
  const endIndex = data.lastIndexOf(']') + 1;
  if (startIndex === -1 || endIndex === 0) {
    console.error('有効な授業データ配列が見つかりません。');
    return;
  }
  const arrayString = data.substring(startIndex, endIndex);

  let courses = [];
  try {
    // Functionコンストラクタを使用して安全にJavaScript配列として評価
    courses = new Function(`return ${arrayString}`)();
  } catch (e) {
    console.error('授業データのパースエラー:', e);
    return;
  }

  const foundCourses = courses.filter(course => {
    const name = course.name ? course.name.toLowerCase().normalize('NFKC') : "";
    const title = course.title ? course.title.toLowerCase().normalize('NFKC') : "";
    const combinedText = name + " " + title;

    if (!combinedText.includes("中国語")) {
      return false;
    }

    // レベル1を示すキーワードのチェック
    const isLevel1 = 
      combinedText.includes("中国語i") || // "中国語Ⅰ", "中国語Ｉ", "中国語i" (ローマ数字の1)
      combinedText.includes("中国語1") || // "中国語1", "中国語１" (アラビア数字の1)
      combinedText.includes("中国語a1") || // "中国語A1"
      combinedText.includes("初級中国語") || // "初級" が前に付く場合
      combinedText.includes("中国語初級");  // "初級" が後ろに付く場合

    return isLevel1;
  });

  if (foundCourses.length > 0) {
    console.log(`該当する可能性のある「中国語レベル1」の授業が ${foundCourses.length}件 見つかりました:`);
    foundCourses.forEach(c => {
      console.log(`  ID: ${c.id}, 授業名: ${c.name}, 科目名: ${c.title}, 開講学期: ${c.semester}`);
    });
  } else {
    console.log('該当する条件の「中国語レベル1」の授業は見つかりませんでした。');
  }
});
