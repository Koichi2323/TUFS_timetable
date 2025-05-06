import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

type AuthNavigatorProps = {
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const AuthNavigator = ({ toggleTheme, isDarkMode }: AuthNavigatorProps) => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" options={{ title: 'ログイン' }}>
        {(props) => <LoginScreen {...props} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}
      </Stack.Screen>
      <Stack.Screen name="Register" options={{ title: '新規登録' }}>
        {(props) => <RegisterScreen {...props} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}
      </Stack.Screen>
      <Stack.Screen name="ForgotPassword" options={{ title: 'パスワード再設定' }}>
        {(props) => <ForgotPasswordScreen {...props} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default AuthNavigator;
