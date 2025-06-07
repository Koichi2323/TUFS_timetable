import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Clipboard } from 'react-native';
import { Button, Text, TextInput, Card, ActivityIndicator, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { importJSONToLocalStorage } from '../../utils/importLocalData';
import { convertJSONToCourse } from '../../utils/importCourses';

type ImportLocalScreenProps = {
  navigation: any;
  route: any;
  toggleTheme?: () => void;
  isDarkMode?: boolean;
};

const ImportLocalScreen = ({ navigation, route }: ImportLocalScreenProps) => {
  const [jsonData, setJsonData] = useState('');
  const [loading, setLoading] = useState(false);
  // インポート結果の型定義
  type ImportResult = {
    total: number;
    added: number;
    duplicates: number;
    combined: number;
  } | {
    success: boolean;
    error: string;
  };

  const [result, setResult] = useState<ImportResult | null>(null);

  const theme = useTheme();

  const handleImport = async () => {
    try {
      setLoading(true);
      setResult(null);

      if (!jsonData.trim()) {
        Alert.alert('エラー', 'JSONデータを入力してください');
        setLoading(false);
        return;
      }

      // JSONデータをパース
      let parsedData;
      try {
        parsedData = JSON.parse(jsonData);
        if (!Array.isArray(parsedData)) {
          parsedData = [parsedData]; // 単一オブジェクトの場合は配列に変換
        }
      } catch (error) {
        Alert.alert('JSONパースエラー', '有効なJSONデータを入力してください');
        setLoading(false);
        return;
      }

      // データをインポート
      const importResult = await importJSONToLocalStorage(parsedData) as ImportResult;
      setResult(importResult);
      
      if ('added' in importResult) {
        Alert.alert(
          'インポート完了',
          `合計: ${importResult.total}件\n追加: ${importResult.added}件\n重複: ${importResult.duplicates}件\n総データ数: ${importResult.combined}件`
        );
      } else if ('error' in importResult) {
        Alert.alert('インポートエラー', importResult.error || '不明なエラーが発生しました');
      } else {
        Alert.alert('インポートエラー', '不明なエラーが発生しました');
      }
    } catch (error: any) {
      console.error('インポートエラー:', error);
      Alert.alert('エラー', `インポート中にエラーが発生しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setJsonData('');
    setResult(null);
  };

  const handlePaste = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      if (clipboardContent) {
        setJsonData(clipboardContent);
      }
    } catch (error) {
      console.error('クリップボードからの貼り付けエラー:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Title title="授業データインポート" subtitle="JSONデータをローカルストレージに保存" />
          <Card.Content>
            <Text style={styles.label}>JSONデータ</Text>
            <TextInput
              multiline
              mode="outlined"
              value={jsonData}
              onChangeText={setJsonData}
              style={styles.jsonInput}
              placeholder="ここにJSONデータを貼り付けてください"
            />

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleImport}
                disabled={loading || !jsonData.trim()}
                style={styles.button}
              >
                {loading ? 'インポート中...' : 'インポート実行'}
              </Button>
              <Button
                mode="outlined"
                onPress={handlePaste}
                disabled={loading}
                style={styles.button}
              >
                貼り付け
              </Button>
              <Button
                mode="outlined"
                onPress={handleClear}
                disabled={loading || !jsonData.trim()}
                style={styles.button}
              >
                クリア
              </Button>
            </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>インポート処理中...</Text>
              </View>
            )}

            {result && 'added' in result && (
              <View style={styles.resultContainer}>
                <Divider style={styles.divider} />
                <Text style={styles.resultTitle}>インポート結果</Text>
                <Text>合計: {result.total}件</Text>
                <Text>追加: {result.added}件</Text>
                <Text>重複: {result.duplicates}件</Text>
                <Text>総データ数: {result.combined}件</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  jsonInput: {
    minHeight: 200,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 8,
  },
  resultContainer: {
    marginTop: 20,
  },
  divider: {
    marginVertical: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default ImportLocalScreen;
