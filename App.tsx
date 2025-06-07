import React, { useState, useCallback } from 'react';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme as PaperDefaultTheme, MD3DarkTheme as PaperDarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { ScheduleProvider } from './src/context/ScheduleContext';
import { SyllabusProvider } from './src/contexts/SyllabusContext';

// デモ用に認証をバイパス
const isLoggedIn = true;

// カスタムテーマを定義 (オプション)
const CustomDefaultTheme = {
  ...PaperDefaultTheme,
  ...NavigationDefaultTheme,
  colors: {
    ...PaperDefaultTheme.colors,
    ...NavigationDefaultTheme.colors,
    // primary: '#yourPrimaryColor', // 必要に応じて上書き
  },
};

const CustomDarkTheme = {
  ...PaperDarkTheme,
  ...NavigationDarkTheme,
  colors: {
    ...PaperDarkTheme.colors,
    ...NavigationDarkTheme.colors,
    // primary: '#yourDarkPrimaryColor', // 必要に応じて上書き
  },
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false); // ダークモードの状態

  const toggleTheme = useCallback(() => { // テーマを切り替える関数
    setIsDarkMode(prevMode => !prevMode);
  }, []);

  const theme = isDarkMode ? CustomDarkTheme : CustomDefaultTheme; // 現在のテーマ

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}> {/* PaperProviderにテーマを適用 */}
        <ScheduleProvider>
          <SyllabusProvider>
            <NavigationContainer theme={theme}> {/* NavigationContainerにテーマを適用 */}
              {isLoggedIn ? (
                <MainNavigator toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
              ) : (
                <AuthNavigator toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
              )}
            </NavigationContainer>
          </SyllabusProvider>
        </ScheduleProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
