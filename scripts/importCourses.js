// JSONファイルからFirestoreに授業データをインポートするスクリプト
// 環境変数の読み込み
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { importCoursesFromJSON } = require('../src/utils/importCourses');

// Firebaseの設定
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  try {
    // コマンドライン引数からJSONファイルのパスを取得
    const jsonFilePath = process.argv[2];
    
    if (!jsonFilePath) {
      console.error('JSONファイルのパスを指定してください。');
      console.error('使用方法: node importCourses.js <JSONファイルのパス>');
      process.exit(1);
    }
    
    // JSONファイルを読み込む
    const jsonData = JSON.parse(fs.readFileSync(path.resolve(jsonFilePath), 'utf8'));
    
    console.log(`${jsonData.length}件の授業データを読み込みました。`);
    console.log('Firestoreにインポートを開始します...');
    
    // データをFirestoreにインポート
    const result = await importCoursesFromJSON(jsonData);
    
    console.log('インポート結果:');
    console.log(`- 合計: ${result.total}件`);
    console.log(`- 成功: ${result.success}件`);
    console.log(`- 失敗: ${result.failed}件`);
    
    if (result.failed > 0) {
      console.log('失敗したデータのエラー:');
      result.errors.forEach((error, index) => {
        console.log(`[${index + 1}] ${error.item.科目題目 || 'Unknown'}: ${error.error}`);
      });
    }
    
    console.log('インポート処理が完了しました。');
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

main();
