# 授業データインポートツール

このツールは、JSONファイルからFirestoreに授業データをインポートするためのものです。

## 準備

1. 必要なパッケージをインストールします：

```bash
npm install dotenv
```

2. `.env.example`ファイルを`.env`にコピーし、Firebaseの認証情報を設定します：

```bash
cp .env.example .env
# .envファイルを編集して、実際のFirebase認証情報を設定してください
```

## 使用方法

以下のコマンドを実行して、JSONファイルからFirestoreに授業データをインポートします：

```bash
node scripts/importCourses.js <JSONファイルのパス>
```

例：

```bash
node scripts/importCourses.js /Users/koichi/Downloads/シラバス情報/2025_世界教養_月曜日１限_全件.json
```

## 注意事項

- インポート前に、JSONデータの構造が正しいことを確認してください
- 大量のデータをインポートする場合は、Firestoreの料金プランに注意してください
- インポート処理は時間がかかる場合があります
