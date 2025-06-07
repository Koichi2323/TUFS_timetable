// JSONデータをFirestoreに直接インポートするスクリプト
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// Firebaseの設定
const firebaseConfig = {
  apiKey: "AIzaSyA1VmrYBGfOCUGTJLXKrBBHRJmVBVXKgFc",
  authDomain: "tufs-timetable.firebaseapp.com",
  projectId: "tufs-timetable",
  storageBucket: "tufs-timetable.appspot.com",
  messagingSenderId: "1045679732356",
  appId: "1:1045679732356:web:4c7a1e1d4b5b1b1e1d4b5b"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// JSONデータをCourse型に変換する関数
function convertJSONToCourse(jsonItem) {
  // 曜日の変換（「月1」→ dayOfWeek: 1, period: 1）
  let dayOfWeek = 1; // デフォルト値
  let period = 1;    // デフォルト値

  // 曜日時限の解析
  if (jsonItem.曜日時限) {
    const dayPeriodMatch = jsonItem.曜日時限.match(/([月火水木金土日])(\d+)/);
    if (dayPeriodMatch) {
      const dayMap = { '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日': 0 };
      dayOfWeek = dayMap[dayPeriodMatch[1]] || 1;
      period = parseInt(dayPeriodMatch[2]) || 1;
    }
  } else if (jsonItem.クラス) {
    // クラスフィールドから曜日と時限を抽出（例: "月1,火2,水1,木2,金1"）
    const dayPeriodMatch = jsonItem.クラス.match(/([月火水木金土日])(\d+)/);
    if (dayPeriodMatch) {
      const dayMap = { '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6, '日': 0 };
      dayOfWeek = dayMap[dayPeriodMatch[1]] || 1;
      period = parseInt(dayPeriodMatch[2]) || 1;
    }
  }

  // 色の生成（一貫性を持たせるために履修コードをハッシュ化して色を決定）
  const colors = [
    '#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff', '#ccffff',
    '#ffdddd', '#ddffdd', '#ddddff', '#ffffdd', '#ffddff', '#ddffff'
  ];
  const colorIndex = parseInt(jsonItem.履修コード.slice(-2), 10) % colors.length;
  const color = colors[colorIndex];

  // Course型に変換
  return {
    id: jsonItem.履修コード,
    name: jsonItem.科目題目,
    professor: jsonItem.担当教員,
    title: jsonItem.授業題目,
    dayOfWeek,
    period,
    room: jsonItem.教室,
    semester: '春学期', // デフォルト値、必要に応じて変更
    language: jsonItem.使用言語,
    color,
    syllabusUrl: jsonItem.履修コード添付リンク,
    year: new Date().getFullYear() // 現在の年を使用
  };
}

// 授業データの追加関数
async function addCourse(courseData) {
  try {
    // IDがすでに存在するかチェック
    if (courseData.id) {
      const docRef = doc(db, 'courses', courseData.id);
      await setDoc(docRef, courseData);
      return { success: true, id: courseData.id };
    } else {
      console.error('Error: Course ID is required');
      return { success: false, error: 'Course ID is required' };
    }
  } catch (error) {
    console.error('Error adding course:', error);
    return { success: false, error };
  }
}

// JSONデータをFirestoreにインポートする関数
async function importCoursesFromJSON(jsonData) {
  try {
    const results = {
      total: jsonData.length,
      success: 0,
      failed: 0,
      errors: []
    };

    for (const item of jsonData) {
      try {
        // JSONデータをCourse型に変換
        const courseData = convertJSONToCourse(item);
        
        // Firestoreに追加
        const result = await addCourse(courseData);
        
        if (result.success) {
          results.success++;
          console.log(`インポート成功: ${courseData.name}`);
        } else {
          results.failed++;
          results.errors.push({ item, error: result.error });
          console.error(`インポート失敗: ${item.科目題目 || 'Unknown'} - ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ item, error: error.message });
        console.error(`エラー: ${item.科目題目 || 'Unknown'} - ${error.message}`);
      }
    }

    console.log('インポート結果:');
    console.log(`- 合計: ${results.total}件`);
    console.log(`- 成功: ${results.success}件`);
    console.log(`- 失敗: ${results.failed}件`);

    return results;
  } catch (error) {
    console.error('Error importing courses:', error);
    return {
      total: jsonData ? jsonData.length : 0,
      success: 0,
      failed: jsonData ? jsonData.length : 0,
      errors: [{ error: error.message }]
    };
  }
}

// コマンドライン引数からJSONデータを取得
const jsonString = process.argv[2];

if (!jsonString) {
  console.error('JSONデータを引数として指定してください。');
  process.exit(1);
}

try {
  // JSONデータをパース
  const jsonData = JSON.parse(jsonString);
  
  // 配列でない場合は配列に変換
  const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
  
  // データをインポート
  importCoursesFromJSON(dataArray)
    .then(results => {
      console.log('インポート処理が完了しました。');
      process.exit(0);
    })
    .catch(error => {
      console.error('インポート処理中にエラーが発生しました:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('JSONデータのパースに失敗しました:', error);
  process.exit(1);
}
