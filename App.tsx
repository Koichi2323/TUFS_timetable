import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { ScheduleProvider } from './src/context/ScheduleContext';

// デモ用に認証をバイパス
const isLoggedIn = true;

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <ScheduleProvider>
          <NavigationContainer>
            {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
          </NavigationContainer>
        </ScheduleProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
