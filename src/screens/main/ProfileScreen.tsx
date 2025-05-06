import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Text, Card, Avatar, Button, List, Switch, useTheme, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ProfileScreenProps = {
  navigation: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const ProfileScreen = ({ navigation, toggleTheme, isDarkMode }: ProfileScreenProps) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
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
        setNotificationsEnabled(JSON.parse(notificationsValue));
      }
    } catch (e) {
      console.log('Failed to load settings');
    }
  };

  const toggleNotifications = async (value: boolean) => {
    try {
      setNotificationsEnabled(value);
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(value));
    } catch (e) {
      console.log('Failed to save notification setting');
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          onPress: async () => {
            try {
              await signOut(auth);
              // Navigation will be handled by the auth state listener in App.tsx
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('エラー', 'ログアウトに失敗しました');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>プロフィール</Text>
        <TouchableOpacity onPress={toggleTheme}>
          <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text 
              size={80} 
              label={auth.currentUser?.displayName?.split(' ').map(n => n[0]).join('') || 'U'} 
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {auth.currentUser?.displayName || 'ユーザー'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.text }]}>
                {auth.currentUser?.email}
              </Text>
              <Text style={[styles.userDepartment, { color: theme.colors.text }]}>
                {userData?.department || '学部/学科未設定'}
              </Text>
            </View>
          </Card.Content>
          <Card.Actions style={styles.cardActions}>
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('Settings')}
              icon="account-edit"
            >
              プロフィール編集
            </Button>
          </Card.Actions>
        </Card>
        
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>履修状況</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.primary }]}>12</Text>
                <Text style={styles.statLabel}>履修中の授業</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.primary }]}>24</Text>
                <Text style={styles.statLabel}>取得単位</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.primary }]}>3.8</Text>
                <Text style={styles.statLabel}>GPA</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>設定</Text>
            
            <List.Item
              title="通知"
              description="課題や授業のリマインダー"
              left={props => <List.Icon {...props} icon="bell" />}
              right={props => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  color={theme.colors.primary}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="テーマ"
              description={isDarkMode ? "ダークモード" : "ライトモード"}
              left={props => <List.Icon {...props} icon={isDarkMode ? "moon" : "white-balance-sunny"} />}
              right={props => (
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  color={theme.colors.primary}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="アプリについて"
              description="バージョン 1.0.0"
              left={props => <List.Icon {...props} icon="information" />}
              onPress={() => {/* Show app info */}}
            />
            
            <Divider />
            
            <List.Item
              title="ログアウト"
              description="アカウントからログアウトします"
              left={props => <List.Icon {...props} icon="logout" color="#F44336" />}
              onPress={handleSignOut}
            />
          </Card.Content>
        </Card>
        
        <View style={styles.appInfo}>
          <Image
            source={require('../../../src/assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: theme.colors.primary }]}>TUFS時間割</Text>
          <Text style={[styles.appVersion, { color: theme.colors.text }]}>Version 1.0.0</Text>
        </View>
      </ScrollView>
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
  },
  profileCard: {
    marginBottom: 16,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  userDepartment: {
    fontSize: 14,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingTop: 0,
  },
  statsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  settingsCard: {
    marginBottom: 24,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
  },
});

export default ProfileScreen;
