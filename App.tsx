import React, { useState, useCallback, useEffect } from 'react';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme as PaperDefaultTheme, MD3DarkTheme as PaperDarkTheme, ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Platform } from 'react-native';
import { Helmet, HelmetProvider } from 'react-helmet-async'; // Import Helmet
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Correct import
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { ScheduleProvider } from './src/context/ScheduleContext';
import { SyllabusProvider } from './src/contexts/SyllabusContext';
import { auth } from './firebase'; // Make sure this path is correct

// カスタムテーマを定義 (オプション)
const CustomDefaultTheme = {
  ...PaperDefaultTheme,
  ...NavigationDefaultTheme,
  colors: {
    ...PaperDefaultTheme.colors,
    ...NavigationDefaultTheme.colors,
    backdrop: 'transparent', // ダイアログの背景オーバーレイを透明に
    // primary: '#yourPrimaryColor', // 必要に応じて上書き
  },
};

const CustomDarkTheme = {
  ...PaperDarkTheme,
  ...NavigationDarkTheme,
  colors: {
    ...PaperDarkTheme.colors,
    ...NavigationDarkTheme.colors,
    backdrop: 'transparent', // ダイアログの背景オーバーレイを透明に
    // primary: '#yourDarkPrimaryColor', // 必要に応じて上書き
  },
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false); // ダークモードの状態

  const toggleTheme = useCallback(() => { // テーマを切り替える関数
    setIsDarkMode(prevMode => !prevMode);
  }, []);

  const theme = isDarkMode ? CustomDarkTheme : CustomDefaultTheme; // 現在のテーマ

  /* Temporarily disable auth logic
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User is signed in:', user.uid);
        setCurrentUser(user);
        setIsAuthLoading(false);
      } else {
        console.log('User is not signed in, attempting anonymous sign-in...');
        signInAnonymously(auth)
          .then((userCredential) => {
            console.log('Signed in anonymously:', userCredential.user.uid);
            // onAuthStateChanged will set currentUser and isAuthLoading
          })
          .catch((error) => {
            console.error('Error signing in anonymously:', error);
            setIsAuthLoading(false); 
          });
      }
    });
    return () => unsubscribe();
  }, []);
  
  if (isAuthLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
      </View>
    );
  }
  */

  return (
    <HelmetProvider> {/* Wrap the entire app with HelmetProvider */}
      <Helmet> {/* Add scripts using Helmet */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-2SH8GS5MQE"></script>
        <script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2SH8GS5MQE');
          `}
        </script>
      </Helmet>

      <SafeAreaProvider>
        <PaperProvider 
          theme={theme} 
          settings={{
            icon: (props) => <MaterialCommunityIcons {...props} />,
          }}
        >
          <ScheduleProvider>
            <SyllabusProvider>
              <NavigationContainer theme={theme}> {/* NavigationContainerにテーマを適用 */}
                {/* Always render MainNavigator for now */}
                <MainNavigator toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
              </NavigationContainer>
            </SyllabusProvider>
          </ScheduleProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </HelmetProvider>
  );
}
