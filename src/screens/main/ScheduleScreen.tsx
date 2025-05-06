import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Text, useTheme, Card, Title, Paragraph, ActivityIndicator, Button, FAB, Snackbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { Course } from '../../types';
import { tufsCourses, timeSlots } from '../../data/tufsCourses';
import { useSchedule } from '../../context/ScheduleContext';

type ScheduleScreenProps = {
  navigation: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const ScheduleScreen = ({ navigation, toggleTheme, isDarkMode }: ScheduleScreenProps) => {
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;
  
  // スケジュールコンテキストを使用
  const { userCourses, removeCourse } = useSchedule();

  // Days of the week in Japanese
  const days = ['月', '火', '水', '木', '金'];
  // Number of periods (時限)
  const periods = [1, 2, 3, 4, 5];

  useEffect(() => {
    // ユーザーの授業が読み込まれたらローディングを終了
    setLoading(false);
  }, [userCourses]);

  const getCourseByDayAndPeriod = (day: number, period: number): Course | undefined => {
    return userCourses.find(course => 
      course.dayOfWeek === day && course.period === period
    );
  };
  
  // 授業を削除する
  const handleRemoveCourse = (courseId: string) => {
    Alert.alert(
      '授業を削除',
      'この授業を時間割から削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          onPress: () => {
            removeCourse(courseId);
            setSnackbarMessage('授業を時間割から削除しました');
            setSnackbarVisible(true);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderTimeTable = () => {
    return (
      <View style={styles.tableContainer}>
        {/* Header row with days */}
        <View style={styles.headerRow}>
          {/* Empty cell for the time column */}
          <View style={[styles.timeCell, { width: screenWidth * 0.15 }]} />
          
          {/* Day headers */}
          {days.map((day, index) => (
            <View 
              key={`day-${index}`} 
              style={[
                styles.dayCell, 
                { 
                  width: screenWidth * 0.17,
                  backgroundColor: '#f5f5f5'
                }
              ]}
            >
              <Text style={styles.dayText}>{day}</Text>
            </View>
          ))}
        </View>
        
        {/* Period rows */}
        {periods.map((period) => (
          <View key={`period-${period}`} style={styles.periodRow}>
            {/* Time cell */}
            <View style={[styles.timeCell, { width: screenWidth * 0.15, backgroundColor: '#f5f5f5' }]}>
              <Text style={styles.periodNumber}>{period}</Text>
              <Text style={styles.timeText}>{timeSlots[period]}</Text>
            </View>
            
            {/* Course cells for each day */}
            {days.map((day, dayIndex) => {
              const course = getCourseByDayAndPeriod(dayIndex + 1, period);
              
              return (
                <TouchableOpacity 
                  key={`cell-${dayIndex}-${period}`}
                  style={[
                    styles.courseCell, 
                    { 
                      width: screenWidth * 0.17,
                      backgroundColor: course ? course.color : '#ffffff'
                    }
                  ]}
                  onPress={() => {
                    if (course) {
                      // 授業の詳細を表示または削除
                      handleRemoveCourse(course.id);
                    } else {
                      // 授業がない場合は履修検索画面に遷移
                      navigation.navigate('Courses');
                    }
                  }}
                  onLongPress={() => {
                    if (course) {
                      handleRemoveCourse(course.id);
                    }
                  }}
                >
                  {course ? (
                    <View style={styles.courseCellContent}>
                      <Text style={styles.courseText} numberOfLines={2}>
                        {course.name}
                      </Text>
                      <Text style={styles.professorText} numberOfLines={1}>
                        {course.professor}
                      </Text>
                      <Text style={styles.roomText} numberOfLines={1}>
                        {course.room}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>東京外国語大学</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="person-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderTitle}>時間割管理</Text>
        <Button 
          mode="contained" 
          icon="export" 
          onPress={() => {}} 
          style={styles.exportButton}
          labelStyle={styles.exportButtonLabel}
        >
          エクスポート
        </Button>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e75480" />
            <Text style={{ marginTop: 16 }}>
              時間割を読み込み中...
            </Text>
          </View>
        ) : (
          <>
            <Card style={styles.tableCard}>
              {renderTimeTable()}
            </Card>
            
            {userCourses.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  時間割に授業が登録されていません
                </Text>
                <Text style={styles.emptySubText}>
                  「履修科目検索」から授業を追加してください
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
      
      <FAB
        style={styles.fab}
        icon="plus"
        color="#fff"
        onPress={() => navigation.navigate('Courses')}
      />
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
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
    backgroundColor: '#e75480',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  subHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  exportButton: {
    backgroundColor: '#e75480',
  },
  exportButtonLabel: {
    fontSize: 14,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 32,
  },
  tableCard: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableContainer: {
    padding: 8,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayCell: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    margin: 1,
  },
  dayText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  periodRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  timeCell: {
    justifyContent: 'center',
    padding: 8,
    borderRadius: 4,
    margin: 1,
  },
  periodNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  courseCell: {
    height: 100,
    borderWidth: 0,
    borderRadius: 4,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
    elevation: 1,
  },
  courseCellContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  courseText: {
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  professorText: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 2,
  },
  roomText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#e75480',
  },
  snackbar: {
    backgroundColor: '#333',
  },
});

export default ScheduleScreen;
