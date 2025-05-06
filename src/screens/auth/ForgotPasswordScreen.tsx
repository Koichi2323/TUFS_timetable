import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Snackbar, useTheme } from 'react-native-paper';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../firebase';
import { Ionicons } from '@expo/vector-icons';

type ForgotPasswordScreenProps = {
  navigation: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const ForgotPasswordScreen = ({ navigation, toggleTheme, isDarkMode }: ForgotPasswordScreenProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [visible, setVisible] = useState(false);

  const theme = useTheme();

  const handleResetPassword = async () => {
    if (!email) {
      setMessage('メールアドレスを入力してください');
      setIsError(true);
      setVisible(true);
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setMessage('パスワードリセットのメールを送信しました。メールをご確認ください');
      setIsError(false);
      setVisible(true);
    } catch (error) {
      setMessage('パスワードリセットに失敗しました。メールアドレスを確認してください');
      setIsError(true);
      setVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../src/assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: theme.colors.primary }]}>パスワードをリセット</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.description, { color: theme.colors.text }]}>
            登録したメールアドレスを入力してください。パスワードリセットのリンクを送信します。
          </Text>

          <TextInput
            label="メールアドレス"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
          />

          <Button
            mode="contained"
            onPress={handleResetPassword}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            リセットリンクを送信
          </Button>

          <View style={styles.loginContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.link, { color: theme.colors.primary }]}>ログイン画面に戻る</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Snackbar
          visible={visible}
          onDismiss={() => setVisible(false)}
          duration={3000}
          action={{
            label: '閉じる',
            onPress: () => setVisible(false),
          }}
          style={isError ? styles.errorSnackbar : styles.successSnackbar}
        >
          {message}
        </Snackbar>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  themeToggle: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  link: {
    fontWeight: 'bold',
  },
  errorSnackbar: {
    backgroundColor: '#B00020',
  },
  successSnackbar: {
    backgroundColor: '#4CAF50',
  },
});

export default ForgotPasswordScreen;
