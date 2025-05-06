import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Snackbar, useTheme } from 'react-native-paper';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { Ionicons } from '@expo/vector-icons';

type RegisterScreenProps = {
  navigation: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const RegisterScreen = ({ navigation, toggleTheme, isDarkMode }: RegisterScreenProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);

  const theme = useTheme();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword || !department) {
      setError('すべての項目を入力してください');
      setVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      setVisible(true);
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      setVisible(true);
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: name,
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        department,
        createdAt: new Date(),
      });

      // Navigation will be handled by the auth state listener in App.tsx
    } catch (error) {
      console.error(error);
      setError('登録に失敗しました。もう一度お試しください');
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
        
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../src/assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: theme.colors.primary }]}>アカウント登録</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="氏名"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />

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

          <TextInput
            label="学部/学科"
            value={department}
            onChangeText={setDepartment}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="school" />}
          />

          <TextInput
            label="パスワード"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry={secureTextEntry}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? 'eye' : 'eye-off'}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
            left={<TextInput.Icon icon="lock" />}
          />

          <TextInput
            label="パスワード（確認）"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry={secureConfirmTextEntry}
            right={
              <TextInput.Icon
                icon={secureConfirmTextEntry ? 'eye' : 'eye-off'}
                onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)}
              />
            }
            left={<TextInput.Icon icon="lock-check" />}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            登録
          </Button>

          <View style={styles.loginContainer}>
            <Text style={{ color: theme.colors.text }}>すでにアカウントをお持ちの場合は </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.link, { color: theme.colors.primary }]}>ログイン</Text>
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
        >
          {error}
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
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  link: {
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
