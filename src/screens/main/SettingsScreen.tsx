import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { Text, Card, Button, useTheme, List, Divider, Dialog, Portal, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../../firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SettingsScreenProps = {
  navigation: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const SettingsScreen = ({ navigation, toggleTheme, isDarkMode }: SettingsScreenProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log('[SettingsScreen] useEffect for onAuthStateChanged mounting/running.');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[SettingsScreen] onAuthStateChanged triggered. User:', user ? user.email : null);
      setCurrentUser(user);
    });
    return () => {
      console.log('[SettingsScreen] Unsubscribing from onAuthStateChanged.');
      unsubscribe(); // Cleanup subscription on unmount
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('[SettingsScreen] Focus effect: Screen came into focus. Current auth user:', auth.currentUser ? auth.currentUser.email : null);
      setCurrentUser(auth.currentUser);
      return () => {
        console.log('[SettingsScreen] Focus effect: Screen lost focus.');
      };
    }, [])
  );

  const handleSignOut = async () => {
  console.log('[SettingsScreen] handleSignOut called');

    const performSignOut = async () => {
      try {
        console.log('[SettingsScreen] Attempting to sign out from Firebase...');
        await auth.signOut();
        console.log('[SettingsScreen] Firebase signOut successful.');
        // currentUser state will be updated by onAuthStateChanged, causing re-render
      } catch (error) { // error is 'unknown' type
        console.error('Error signing out:', error);
        // Safely access error message
        const errorMessage = error instanceof Error ? error.message : 'ログアウト処理中に不明なエラーが発生しました。';
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
          window.alert('エラー: ログアウトに失敗しました。\n' + errorMessage);
        } else {
          Alert.alert('エラー', 'ログアウトに失敗しました: ' + errorMessage);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('ログアウトしてもよろしいですか？')) {
        performSignOut();
      }
    } else {
      Alert.alert(
        'ログアウト',
        'ログアウトしてもよろしいですか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: 'ログアウト',
            onPress: performSignOut,
            style: 'destructive', // For iOS, makes the button text red
          },
        ],
        { cancelable: true } // For Android, allows dismissing by tapping outside
      );
    }
  };

  const getAppVersion = () => {
    return Constants.expoConfig?.version || '1.0.0';
  };

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(`このリンクを開けません: ${url}`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {currentUser ? (
          <Card style={styles.card}>
            <Card.Content>
              <List.Item
                title="ログイン中のユーザー"
                description={currentUser.email || 'メールアドレス不明'}
                left={(props) => <List.Icon {...props} icon="account-circle" />}
              />
            </Card.Content>
          </Card>
        ) : (
          <>
            <Button
            mode="contained"
            onPress={() => navigation.navigate('AuthScreen')} // AuthScreenへのナビゲーション
            style={styles.authButton}
            icon="login"
          >
            ログイン / 新規登録
          </Button>
          <Text style={[styles.loginPromptText, { color: theme.colors.onSurfaceVariant }]}>
            ログインすると、登録した授業データがクラウドにバックアップされます。機種変更時やアプリを再インストールした場合でも、同じアカウントでログインすればデータを復元できます。
          </Text>
          </>
        )}

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>設定</Text>
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons
              name={isDarkMode ? 'sunny' : 'moon'}
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              アプリ情報
            </Text>

            <List.Item
              title="お問い合わせ"
              left={(props) => <List.Icon {...props} icon="email-send" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => openLink('https://forms.office.com/r/FyEGbvFt6i')}
            />

            <Divider />

            <List.Item
              title="プライバシーポリシー"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('プライバシーポリシー', '現在準備中です。')}
            />
          </Card.Content>
        </Card>

        {currentUser && (
          <Button
            mode="outlined"
            onPress={handleSignOut}
            style={styles.authButton}
            icon="logout"
          >
            ログアウト
          </Button>
        )}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.onBackground, opacity: 0.7 }]}>
            TUFS時間割 2025
          </Text>
        </View>

        <View style={styles.disclaimerContainer}>
          <Text style={[styles.disclaimerText, { color: theme.colors.onSurfaceVariant }]}>
            注意:
            保存したデータが消えたり、書き換わったり、閲覧できなくなる可能性があります。
            また公開されている情報を元に作成した授業情報は 古く、正しくない可能性があります。
            必ず公式サイトにて最新情報をご確認ください。
            このアプリの使用において発生した問題について、 一切製作者は責任を負いません。
            上記全てに了承の上インストールしてください。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    elevation: 2,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  authButton: {
    marginVertical: 16,
    marginHorizontal: 16,
  },
  loginPromptText: {
    fontSize: 12,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
  },
  disclaimerContainer: {
    marginTop: 16, 
    paddingHorizontal: 16, 
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 10, 
    textAlign: 'center',
    opacity: 0.6, 
  },
});

export default SettingsScreen;
