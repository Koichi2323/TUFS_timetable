mport React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, TextInput, Card, ActivityIndicator, Divider } from 'react-native-paper';
// import { importCoursesFromJSON } from '../../utils/importCourses';
import { SafeAreaView } from 'react-native-safe-area-context';

type ImportScreenProps = {
  navigation?: any;
  route?: any;
};

const ImportScreen = ({ navigation, route }: ImportScreenProps) => {
  const [jsonData, setJsonData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    total: number;
    errors?: Array<{ item: any; error: string }>;
  } | null>(null);

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
      // const importResult = await importCoursesFromJSON(parsedData); // Temporarily disabled
      // setResult(importResult); // Temporarily disabled
      
      Alert.alert(
        '機能利用不可',
        'このJSONインポート機能は現在一時的に利用できません。'
        // `合計: ${importResult.total}件\n成功: ${importResult.success}件\n失敗: ${importResult.failed}件`
      );
    } catch (error) {
      console.error('インポートエラー:', error);
      if (error instanceof Error) {
        Alert.alert('エラー', `インポート中にエラーが発生しました: ${error.message}`);
      } else {
        Alert.alert('エラー', 'インポート中に不明なエラーが発生しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setJsonData('');
    setResult(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Title title="授業データインポート" />
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
                onPress={handleClear}
                disabled={loading || !jsonData.trim()}
                style={styles.button}
              >
                クリア
              </Button>
            </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>インポート処理中...</Text>
              </View>
            )}

            {result && (
              <View style={styles.resultContainer}>
                <Divider style={styles.divider} />
                <Text style={styles.resultTitle}>インポート結果</Text>
                <Text>合計: {result.total}件</Text>
                <Text>成功: {result.success}件</Text>
                <Text>失敗: {result.failed}件</Text>

                {result.failed > 0 && result.errors && (
                  <View style={styles.errorsContainer}>
                    <Text style={styles.errorTitle}>エラー詳細:</Text>
                    <ScrollView style={styles.errorScroll}>
                      {result.errors.map((error, index) => (
                        <Text key={index} style={styles.errorText}>
                          {index + 1}. {error.item.科目題目 || '不明'}: {error.error}
                        </Text>
                      ))}
                    </ScrollView>
                  </View>
                )}
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
  errorsContainer: {
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorScroll: {
    maxHeight: 200,
  },
  errorText: {
    color: 'red',
    marginBottom: 4,
  },
});

export default ImportScreen;
