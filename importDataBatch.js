// JSONデータをFirestoreにバッチ処理でインポートするスクリプト
const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, writeBatch } = require('firebase/firestore');

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

// JSONデータをバッチ処理でFirestoreにインポートする関数
async function importCoursesInBatches(jsonData, batchSize = 20) {
  try {
    const results = {
      total: jsonData.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // データをバッチサイズごとに分割
    const batches = [];
    for (let i = 0; i < jsonData.length; i += batchSize) {
      batches.push(jsonData.slice(i, i + batchSize));
    }

    console.log(`${jsonData.length}件のデータを${batches.length}バッチに分割しました。`);

    // 各バッチを順番に処理
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`バッチ ${batchIndex + 1}/${batches.length} を処理中...`);
      
      const batchWriter = writeBatch(db);
      
      for (const item of batch) {
        try {
          // JSONデータをCourse型に変換
          const courseData = convertJSONToCourse(item);
          
          // バッチに追加
          const docRef = doc(db, 'courses', courseData.id);
          batchWriter.set(docRef, courseData);
          
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({ item, error: error.message });
          console.error(`エラー: ${item.科目題目 || 'Unknown'} - ${error.message}`);
        }
      }
      
      // バッチをコミット
      try {
        await batchWriter.commit();
        console.log(`バッチ ${batchIndex + 1} を正常にコミットしました。`);
      } catch (error) {
        console.error(`バッチ ${batchIndex + 1} のコミット中にエラーが発生しました:`, error);
        // このバッチのアイテムを失敗としてマーク
        results.success -= batch.length;
        results.failed += batch.length;
        results.errors.push({ batch: batchIndex + 1, error: error.message });
      }
      
      // 少し待機して、Firestoreのレート制限に引っかからないようにする
      await new Promise(resolve => setTimeout(resolve, 1000));
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

// ファイルパスを引数から取得
const filePath = process.argv[2];

if (!filePath) {
  console.error('JSONファイルのパスを指定してください。');
  console.error('使用方法: node importDataBatch.js <JSONファイルのパス>');
  process.exit(1);
}

// ファイルを読み込む
try {
  const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // データをインポート
  importCoursesInBatches(jsonData)
    .then(results => {
      console.log('インポート処理が完了しました。');
      process.exit(0);
    })
    .catch(error => {
      console.error('インポート処理中にエラーが発生しました:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('JSONファイルの読み込みに失敗しました:', error);
  process.exit(1);
}
