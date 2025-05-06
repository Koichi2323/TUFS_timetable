import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText, Menu } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import ColorPicker from '../../components/ColorPicker';

type EditCourseScreenProps = {
  navigation: any;
  route: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const EditCourseScreen = ({ navigation, route, toggleTheme, isDarkMode }: EditCourseScreenProps) => {
  const { courseId } = route.params;
  const [name, setName] = useState('');
  const [professor, setProfessor] = useState('');
  const [room, setRoom] = useState('');
  const [credits, setCredits] = useState('');
  const [syllabus, setSyllabus] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#6200ee');
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);
  const [period, setPeriod] = useState<number | null>(null);
  const [dayMenuVisible, setDayMenuVisible] = useState(false);
  const [periodMenuVisible, setPeriodMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const theme = useTheme();
  
  // Days of the week
  const days = [
    { label: '月曜日', value: 1 },
    { label: '火曜日', value: 2 },
    { label: '水曜日', value: 3 },
    { label: '木曜日', value: 4 },
    { label: '金曜日', value: 5 },
    { label: '土曜日', value: 6 },
    { label: '日曜日', value: 7 },
  ];
  
  // Periods
  const periods = [
    { label: '1限 (8:30-10:10)', value: 1 },
    { label: '2限 (10:25-12:05)', value: 2 },
    { label: '3限 (13:00-14:40)', value: 3 },
    { label: '4限 (14:55-16:35)', value: 4 },
    { label: '5限 (16:50-18:30)', value: 5 },
    { label: '6限 (18:45-20:25)', value: 6 },
    { label: '7限 (20:40-22:20)', value: 7 },
  ];

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    if (!courseId) {
      navigation.goBack();
      return;
    }
    
    try {
      setLoading(true);
      
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (courseDoc.exists()) {
        const courseData = courseDoc.data();
        setName(courseData.name || '');
        setProfessor(courseData.professor || '');
        setRoom(courseData.room || '');
        setCredits(courseData.credits ? courseData.credits.toString() : '');
        setSyllabus(courseData.syllabus || '');
        setNotes(courseData.notes || '');
        setColor(courseData.color || '#6200ee');
        setDayOfWeek(courseData.dayOfWeek || null);
        setPeriod(courseData.period || null);
      } else {
        Alert.alert('エラー', '授業データが見つかりませんでした');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      Alert.alert('エラー', '授業データの取得に失敗しました');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('エラー', '授業名を入力してください');
      return false;
    }
    
    if (!professor.trim()) {
      Alert.alert('エラー', '教授名を入力してください');
      return false;
    }
    
    if (!room.trim()) {
      Alert.alert('エラー', '教室を入力してください');
      return false;
    }
    
    if (!credits.trim() || isNaN(Number(credits))) {
      Alert.alert('エラー', '単位数を正しく入力してください');
      return false;
    }
    
    if (dayOfWeek === null) {
      Alert.alert('エラー', '曜日を選択してください');
      return false;
    }
    
    if (period === null) {
      Alert.alert('エラー', '時限を選択してください');
      return false;
    }
    
    return true;
  };

  const handleUpdateCourse = async () => {
    if (!validateForm() || !auth.currentUser) return;
    
    try {
      setSaving(true);
      
      // Update course in the courses collection
      await updateDoc(doc(db, 'courses', courseId), {
        name,
        professor,
        room,
        credits: Number(credits),
        syllabus,
        notes,
        color,
        dayOfWeek,
        period,
        updatedAt: new Date(),
      });
      
      Alert.alert(
        '成功',
        '授業が更新されました',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating course:', error);
      Alert.alert('エラー', '授業の更新に失敗しました。もう一度お試しください');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.primary }]}>授業を編集</Text>
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.text }}>読み込み中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.primary }]}>授業を編集</Text>
        <TouchableOpacity onPress={toggleTheme}>
          <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.formContainer}>
        <TextInput
          label="授業名 *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />
        
        <TextInput
          label="教授名 *"
          value={professor}
          onChangeText={setProfessor}
          mode="outlined"
          style={styles.input}
        />
        
        <TextInput
          label="教室 *"
          value={room}
          onChangeText={setRoom}
          mode="outlined"
          style={styles.input}
        />
        
        <View style={styles.row}>
          <View style={styles.dayContainer}>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                { borderColor: theme.colors.primary }
              ]}
              onPress={() => setDayMenuVisible(true)}
            >
              <Text style={{ color: theme.colors.text }}>
                {dayOfWeek !== null ? days.find(d => d.value === dayOfWeek)?.label : '曜日を選択 *'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
            </TouchableOpacity>
            
            <Menu
              visible={dayMenuVisible}
              onDismiss={() => setDayMenuVisible(false)}
              anchor={{ x: 0, y: 0 }}
              style={styles.menu}
            >
              {days.map((day) => (
                <Menu.Item
                  key={day.value}
                  onPress={() => {
                    setDayOfWeek(day.value);
                    setDayMenuVisible(false);
                  }}
                  title={day.label}
                />
              ))}
            </Menu>
          </View>
          
          <View style={styles.periodContainer}>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                { borderColor: theme.colors.primary }
              ]}
              onPress={() => setPeriodMenuVisible(true)}
            >
              <Text style={{ color: theme.colors.text }}>
                {period !== null ? periods.find(p => p.value === period)?.label : '時限を選択 *'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
            </TouchableOpacity>
            
            <Menu
              visible={periodMenuVisible}
              onDismiss={() => setPeriodMenuVisible(false)}
              anchor={{ x: 0, y: 0 }}
              style={styles.menu}
            >
              {periods.map((p) => (
                <Menu.Item
                  key={p.value}
                  onPress={() => {
                    setPeriod(p.value);
                    setPeriodMenuVisible(false);
                  }}
                  title={p.label}
                />
              ))}
            </Menu>
          </View>
        </View>
        
        <TextInput
          label="単位数 *"
          value={credits}
          onChangeText={setCredits}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
        />
        
        <TextInput
          label="シラバスURL"
          value={syllabus}
          onChangeText={setSyllabus}
          mode="outlined"
          style={styles.input}
          keyboardType="url"
        />
        
        <TextInput
          label="メモ"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={4}
        />
        
        <Text style={[styles.colorLabel, { color: theme.colors.text }]}>授業カラー</Text>
        <ColorPicker selectedColor={color} onSelectColor={setColor} />
        
        <Button
          mode="contained"
          onPress={handleUpdateCourse}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          loading={saving}
          disabled={saving}
        >
          更新する
        </Button>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dayContainer: {
    flex: 1,
    marginRight: 8,
  },
  periodContainer: {
    flex: 1,
    marginLeft: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    height: 56,
  },
  menu: {
    width: 200,
  },
  colorLabel: {
    marginBottom: 8,
    fontSize: 16,
  },
  button: {
    marginTop: 24,
    marginBottom: 32,
    paddingVertical: 8,
  },
});

export default EditCourseScreen;
