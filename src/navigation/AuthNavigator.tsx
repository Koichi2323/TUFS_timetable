import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthScreen from '../screens/auth/AuthScreen'; // 作成したAuthScreenをインポート

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="AuthScreen" // 初期ルートをAuthScreenに
      screenOptions={{
        headerShown: false, // ヘッダーは非表示のまま
      }}
    >
      <Stack.Screen name="AuthScreen" component={AuthScreen} />
      {/* 必要であれば、将来的にパスワードリセット画面などをここに追加できます */}
      {/* <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} /> */}
    </Stack.Navigator>
  );
};

export default AuthNavigator;
