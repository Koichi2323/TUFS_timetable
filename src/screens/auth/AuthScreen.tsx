// src/screens/auth/AuthScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { auth } from '../../../firebase'; // Firebase設定をインポート
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const theme = useTheme();
  const navigation = useNavigation();

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください。');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // 新規登録成功後、前の画面に戻るか、特定の画面に遷移
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        // Fallback, e.g., navigate to a default screen if no back history
        // navigation.navigate('MainTabs', { screen: 'Schedule' }); // Adjust as per your nav structure
      }
    } catch (e: any) {
      console.error('Sign up error:', e);
      if (e.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に使用されています。');
      } else if (e.code === 'auth/weak-password') {
        setError('パスワードは6文字以上で入力してください。');
      } else if (e.code === 'auth/invalid-email') {
        setError('有効なメールアドレスを入力してください。');
      }
      else {
        setError('新規登録に失敗しました。通信環境を確認するか、時間をおいて再度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    console.log('[AuthScreen] handleSignIn called'); // Add this line
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください。');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // ログイン成功後、前の画面に戻るか、特定の画面に遷移
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        // Fallback
        // navigation.navigate('MainTabs', { screen: 'Schedule' }); // Adjust as per your nav structure
      }
    } catch (e: any) {
      console.error('Sign in error:', e);
      Alert.alert('ログインエラー', `コード: ${e.code}\nメッセージ: ${e.message}\n${JSON.stringify(e)}`); // 詳細なエラー情報を表示
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setError('メールアドレスまたはパスワードが間違っています。');
      } else if (e.code === 'auth/invalid-email') {
        setError('有効なメールアドレスを入力してください。');
      }
      else {
        setError('ログインに失敗しました。通信環境を確認するか、時間をおいて再度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.primary }]}>アカウント認証</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <TextInput
        label="メールアドレス"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        disabled={loading}
      />
      <TextInput
        label="パスワード"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!isPasswordVisible}
        style={styles.input}
        autoCapitalize="none"
        disabled={loading}
        right={
          <TextInput.Icon 
            icon={isPasswordVisible ? "eye-off" : "eye"}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          />
        }
      />

      {loading ? (
        <ActivityIndicator animating={true} color={theme.colors.primary} size="large" style={styles.loader} />
      ) : (
        <>
          <Button mode="contained" onPress={handleSignIn} style={styles.button} disabled={loading}>
            ログイン
          </Button>
          <Button mode="outlined" onPress={handleSignUp} style={styles.button} disabled={loading}>
            新規登録
          </Button>
        </>
      )}
      <Text style={[styles.promoText, { color: theme.colors.onSurfaceVariant }]}>
        ログインすると、登録した授業データがクラウドにバックアップされます。機種変更時やアプリを再インストールした場合でも、同じアカウントでログインすればデータを復元できます。
      </Text>
       <Button 
        onPress={() => navigation.canGoBack() ? navigation.goBack() : undefined} 
        style={styles.backButton}
        disabled={loading}
      >
        戻る
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  backButton: {
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  loader: {
    marginTop: 20,
  },
  promoText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    // color: theme.colors.onSurfaceVariant, // This will be applied inline in JSX to access theme
    paddingHorizontal: 10,
  }
});

export default AuthScreen;
