import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Import screens
import ScheduleScreen from '../screens/main/ScheduleScreen';
import CoursesScreen from '../screens/main/CoursesScreen';
import CourseDetailScreen from '../screens/main/CourseDetailScreen';
import AddCourseScreen from '../screens/main/AddCourseScreen';
import EditCourseScreen from '../screens/main/EditCourseScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack navigators for each tab
const ScheduleStack = ({ toggleTheme, isDarkMode }: { toggleTheme: () => void; isDarkMode: boolean }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ScheduleScreen" options={{ title: '時間割', headerStyle: { backgroundColor: '#f06292' }, headerTintColor: '#fff' }}>
      {(props) => <ScheduleScreen {...props} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}
    </Stack.Screen>
    <Stack.Screen name="CourseDetail" options={{ title: '授業詳細', headerStyle: { backgroundColor: '#f06292' }, headerTintColor: '#fff' }}>
      {(props) => <CourseDetailScreen {...props} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}
    </Stack.Screen>
  </Stack.Navigator>
);

const CoursesStack = ({ toggleTheme, isDarkMode }: { toggleTheme: () => void; isDarkMode: boolean }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CoursesScreen" options={{ title: '履修検索', headerStyle: { backgroundColor: '#e75480' }, headerTintColor: '#fff' }}>
      {(props) => <CoursesScreen {...props} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}
    </Stack.Screen>
    <Stack.Screen name="AddCourse" options={{ title: '授業追加', headerStyle: { backgroundColor: '#f06292' }, headerTintColor: '#fff' }}>
      {(props) => <AddCourseScreen {...props} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}
    </Stack.Screen>
    <Stack.Screen name="EditCourse" options={{ title: '授業編集', headerStyle: { backgroundColor: '#f06292' }, headerTintColor: '#fff' }}>
      {(props) => <EditCourseScreen {...props} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}
    </Stack.Screen>
    <Stack.Screen name="CourseDetail" options={{ title: '授業詳細', headerStyle: { backgroundColor: '#f06292' }, headerTintColor: '#fff' }}>
      {(props) => <CourseDetailScreen {...props} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}
    </Stack.Screen>
  </Stack.Navigator>
);

const SettingsStack = ({ toggleTheme, isDarkMode }: { toggleTheme: () => void; isDarkMode: boolean }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SettingsScreen" options={{ title: '設定', headerStyle: { backgroundColor: '#f06292' }, headerTintColor: '#fff' }}>
      {(props) => <SettingsScreen {...props} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}
    </Stack.Screen>
    {/* Add other screens for Settings stack if needed, e.g., PastSchedulesScreen */}
  </Stack.Navigator>
);

type MainNavigatorProps = {
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const MainNavigator = ({ toggleTheme, isDarkMode }: MainNavigatorProps) => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Courses') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'cog' : 'cog-outline'; // Using 'cog' icon for settings
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#f06292',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Schedule" options={{ title: '時間割' }}>
        {() => <ScheduleStack toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}
      </Tab.Screen>
      <Tab.Screen name="Courses" options={{ title: '履修検索' }}>
        {() => <CoursesStack toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}
      </Tab.Screen>
      <Tab.Screen name="Settings" options={{ title: '設定' }}>
        {() => <SettingsStack toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default MainNavigator;
