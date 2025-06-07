import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button, Linking, ActivityIndicator, Alert } from 'react-native';
import { useSyllabus } from '../../contexts/SyllabusContext';
import { Course } from '../../types';
import { Card, Title, Paragraph, Caption, Snackbar } from 'react-native-paper';
import { useSchedule } from '../../context/ScheduleContext';

// Helper to convert dayOfWeek (number) to string
const dayOfWeekToString = (day: number): string => {
  const days = ['月', '火', '水', '木', '金', '土']; // Assuming 0:月, 1:火, ...
  return days[day] || '不明';
};

const SyllabusScreen: React.FC = () => {
  const { syllabusCourses, isLoading, error, reloadSyllabus } = useSyllabus();
  const { addCourse, isCourseAdded, userCourses } = useSchedule();

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleOpenSyllabus = async (url?: string) => {
    if (!url) {
      Alert.alert('エラー', 'シラバスURLが見つかりません。');
      return;
    }
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('エラー', `このURLを開けません: ${url}`);
    }
  };

  const handleAddCourseToSchedule = (course: Course) => {
    const result = addCourse(course);
    if (result.success) {
      setSnackbarMessage(`${course.name} を時間割に追加しました。`);
      setSnackbarVisible(true);
    } else if (result.conflictCourse) {
      Alert.alert(
        '追加失敗',
        `${course.name} は ${result.conflictCourse.name} と時間が重複しているため追加できません。`
      );
    } else {
      Alert.alert('追加失敗', `${course.name} は既に追加されているか、何らかの理由で追加できませんでした。`);
    }
  };

  const renderCourseItem = ({ item }: { item: Course }) => {
    const alreadyAdded = isCourseAdded(item.id);
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>{item.name}</Title>
          <Paragraph style={styles.paragraph}>担当: {item.professor}</Paragraph>
          <Paragraph style={styles.paragraph}>授業題目: {item.title}</Paragraph>
          <Caption style={styles.caption}>
            {dayOfWeekToString(item.dayOfWeek)}曜 {item.period}限 / {item.room}教室 {item.class_name ? `(${item.class_name}クラス)` : ''}
          </Caption>
          {item.language && <Caption style={styles.caption}>使用言語: {item.language}</Caption>}
          {item.semester && <Caption style={styles.caption}>学期: {item.semester}</Caption>}
        </Card.Content>
        <Card.Actions>
          <Button title="シラバスを見る" onPress={() => handleOpenSyllabus(item.syllabusUrl)} disabled={!item.syllabusUrl} />
          <Button 
            title={alreadyAdded ? "追加済み" : "時間割に追加"} 
            onPress={() => handleAddCourseToSchedule(item)} 
            disabled={alreadyAdded} 
          />
        </Card.Actions>
      </Card>
    );
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>データの読み込みに失敗しました。</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <Button title="再試行" onPress={reloadSyllabus} />
      </View>
    );
  }

  if (!syllabusCourses || syllabusCourses.length === 0) {
    return <View style={styles.centered}><Text>利用可能な授業データがありません。</Text></View>;
  }

  return (
    <View style={{flex: 1}}>
      <FlatList
        data={syllabusCourses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => item.id + (item.class_name || '')} 
        contentContainerStyle={styles.container}
        extraData={userCourses} 
      />
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    marginVertical: 8,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    marginBottom: 2,
  },
  caption: {
    fontSize: 12,
    color: 'gray',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default SyllabusScreen;
