import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch as RNSwitch, Linking } from 'react-native';
import { Text, Card, Button, useTheme, List, Divider, Dialog, Portal, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import Constants from 'expo-constants';

type SettingsScreenProps = {
  navigation: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const SettingsScreen = ({ navigation, toggleTheme, isDarkMode }: SettingsScreenProps) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('18:00');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  const theme = useTheme();
  
  useEffect(() => {
    fetchUserData();
    loadSettings();
  }, []);
  
  const fetchUserData = async () => {
    if (!auth.currentUser) return;
    
    try {
      setLoading(true);
      
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
        setNewEmail(auth.currentUser.email || '');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadSettings = async () => {
    try {
      const notificationsValue = await AsyncStorage.getItem('notificationsEnabled');
      if (notificationsValue !== null) {
        setNotificationsEnabled(notificationsValue === 'true');
      }
      
      const reminderTimeValue = await AsyncStorage.getItem('reminderTime');
      if (reminderTimeValue !== null) {
        setReminderTime(reminderTimeValue);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  const toggleNotifications = async (value: boolean) => {
    try {
      setNotificationsEnabled(value);
      await AsyncStorage.setItem('notificationsEnabled', value.toString());
      
      if (value) {
        // Request notification permissions
        // Note: In a real app, we would use expo-notifications
        // For this demo, we'll just simulate the permission request
        Alert.alert(
          '通知の許可が必要です',
          'アプリの設定から通知を有効にしてください',
          [
            { text: 'キャンセル', style: 'cancel' },
            { text: '設定を開く', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };
  
  const saveReminderTime = async (time: string) => {
    try {
      setReminderTime(time);
      await AsyncStorage.setItem('reminderTime', time);
    } catch (error) {
      console.error('Error saving reminder time:', error);
    }
  };
  
  const handleSignOut = async () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしてもよろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          onPress: async () => {
            try {
              await auth.signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('エラー', 'ログアウトに失敗しました');
            }
          },
        },
      ]
    );
  };
  
  const handleUpdatePassword = async () => {
    if (!auth.currentUser || !auth.currentUser.email) {
      Alert.alert('エラー', 'ユーザー情報が取得できません');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('エラー', '新しいパスワードと確認用パスワードが一致しません');
      return;
    }
    
    if (newPassword.length < 8) {
      Alert.alert('エラー', 'パスワードは8文字以上である必要があります');
      return;
    }
    
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      
      Alert.alert('成功', 'パスワードが更新されました');
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('エラー', 'パスワードの更新に失敗しました。現在のパスワードが正しいか確認してください');
    }
  };
  
  const handleUpdateEmail = async () => {
    if (!auth.currentUser || !auth.currentUser.email) {
      Alert.alert('エラー', 'ユーザー情報が取得できません');
      return;
    }
    
    if (!newEmail || !newEmail.includes('@')) {
      Alert.alert('エラー', '有効なメールアドレスを入力してください');
      return;
    }
    
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updateEmail(auth.currentUser, newEmail);
      
      // Update email in Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        email: newEmail,
      });
      
      Alert.alert('成功', 'メールアドレスが更新されました');
      setShowEmailDialog(false);
      setCurrentPassword('');
      fetchUserData();
    } catch (error) {
      console.error('Error updating email:', error);
      Alert.alert('エラー', 'メールアドレスの更新に失敗しました。現在のパスワードが正しいか確認してください');
    }
  };
  
  const getAppVersion = () => {
    return Constants.expoConfig?.version || '1.0.0';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>設定</Text>
        <TouchableOpacity onPress={toggleTheme}>
          <Ionicons
            name={isDarkMode ? 'sunny' : 'moon'}
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              アカウント設定
            </Text>
            
            <List.Item
              title="メールアドレス"
              description={auth.currentUser?.email || ''}
              left={(props) => <List.Icon {...props} icon="email" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowEmailDialog(true)}
            />
            
            <Divider />
            
            <List.Item
              title="パスワード変更"
              description="セキュリティのため定期的に変更してください"
              left={(props) => <List.Icon {...props} icon="lock" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowPasswordDialog(true)}
            />
            
            <Divider />
            
            <List.Item
              title="プロフィール編集"
              description="名前や学部情報を更新"
              left={(props) => <List.Icon {...props} icon="account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('EditProfile')}
            />
          </Card.Content>
        </Card>
        
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              通知設定
            </Text>
            
            <List.Item
              title="通知"
              description={notificationsEnabled ? '有効' : '無効'}
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <RNSwitch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="リマインダー時間"
              description={`毎日 ${reminderTime} に通知`}
              left={(props) => <List.Icon {...props} icon="clock" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Time picker would go here in a real app
                // For simplicity, we'll just toggle between a few options
                const times = ['8:00', '12:00', '18:00', '21:00'];
                const currentIndex = times.indexOf(reminderTime);
                const nextIndex = (currentIndex + 1) % times.length;
                saveReminderTime(times[nextIndex]);
              }}
              disabled={!notificationsEnabled}
            />
          </Card.Content>
        </Card>
        
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              アプリ情報
            </Text>
            
            <List.Item
              title="アプリバージョン"
              description={getAppVersion()}
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            
            <Divider />
            
            <List.Item
              title="利用規約"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Open terms of service
                Alert.alert('情報', '利用規約ページは準備中です');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="プライバシーポリシー"
              left={(props) => <List.Icon {...props} icon="shield" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Open privacy policy
                Alert.alert('情報', 'プライバシーポリシーページは準備中です');
              }}
            />
            
            <Divider />
            
            <List.Item
              title="お問い合わせ"
              left={(props) => <List.Icon {...props} icon="email-send" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Open contact form or email
                Linking.openURL('mailto:support@tufstimetable.app');
              }}
            />
          </Card.Content>
        </Card>
        
        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={[styles.signOutButton, { borderColor: '#f44336' }]}
          textColor="#f44336"
        >
          ログアウト
        </Button>
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.onBackground, opacity: 0.7 }]}>
            TUFS時間割 © 2025
          </Text>
        </View>
      </ScrollView>
      
      <Portal>
        <Dialog
          visible={showPasswordDialog}
          onDismiss={() => setShowPasswordDialog(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title>パスワード変更</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="現在のパスワード"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!passwordVisible}
              right={
                <TextInput.Icon
                  icon={passwordVisible ? 'eye-off' : 'eye'}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                />
              }
              style={styles.dialogInput}
            />
            <TextInput
              label="新しいパスワード"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!passwordVisible}
              style={styles.dialogInput}
            />
            <TextInput
              label="新しいパスワード（確認）"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!passwordVisible}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPasswordDialog(false)}>キャンセル</Button>
            <Button onPress={handleUpdatePassword}>更新</Button>
          </Dialog.Actions>
        </Dialog>
        
        <Dialog
          visible={showEmailDialog}
          onDismiss={() => setShowEmailDialog(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title>メールアドレス変更</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="新しいメールアドレス"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              style={styles.dialogInput}
            />
            <TextInput
              label="現在のパスワード"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!passwordVisible}
              right={
                <TextInput.Icon
                  icon={passwordVisible ? 'eye-off' : 'eye'}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                />
              }
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEmailDialog(false)}>キャンセル</Button>
            <Button onPress={handleUpdateEmail}>更新</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
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
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  signOutButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
  },
  dialogInput: {
    marginBottom: 16,
  },
});

export default SettingsScreen;
