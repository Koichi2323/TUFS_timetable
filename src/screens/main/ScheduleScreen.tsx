import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Text, useTheme, Card, ActivityIndicator, Button, FAB, Snackbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Course } from '../../types';
import { timeSlots } from '../../data/tufsCourses';
import { useSchedule } from '../../context/ScheduleContext';

type ScheduleScreenProps = {
  navigation: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const ScheduleScreen = ({ navigation, toggleTheme, isDarkMode }: ScheduleScreenProps) => {
  const [loading, setLoading] = useState(false);
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
  // 時間帯の表示
  const periodTimes = {
    1: '08:30',
    2: '10:10',
    3: '12:40',
    4: '14:20',
    5: '16:00'
  };

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
            <View style={[styles.timeCell, { width: screenWidth * 0.15 }]}>
              <Text style={styles.timeText}>{periodTimes[period]}</Text>
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
                      backgroundColor: course ? course.color || '#ffffff' : '#ffffff',
                      borderWidth: 0.5,
                      borderColor: '#e0e0e0'
                    }
                  ]}
                  onPress={() => {
                    if (course) {
                      // 授業の詳細を表示または削除
                      Alert.alert(
                        course.name,
                        `教員: ${course.professor}\n教室: ${course.room}`,
                        [
                          {
                            text: '閉じる',
                            style: 'cancel',
                          },
                          {
                            text: '削除',
                            onPress: () => handleRemoveCourse(course.id),
                            style: 'destructive',
                          },
                          {
                            text: '詳細',
                            onPress: () => navigation.navigate('CourseDetail', { courseId: course.id }),
                          },
                        ]
                      );
                    } else {
                      // 空のセルをタップした場合、授業追加画面に遷移
                      navigation.navigate('Courses', { 
                        filterDay: dayIndex + 1, 
                        filterPeriod: period 
                      });
                    }
                  }}
                >
                  {course && (
                    <View style={styles.courseCellContent}>
                      {course.room && (
                        <Text style={styles.courseIdText}>
                          {course.room}
                        </Text>
                      )}
                      <Text style={styles.courseText} numberOfLines={2}>
                        {course.name}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
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
        icon="magnify"
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
    backgroundColor: '#f5f5f5',
  },
  scrollViewContent: {
    padding: 0,
    paddingBottom: 32,
  },
  tableCard: {
    borderRadius: 0,
    elevation: 0,
    margin: 0,
  },
  tableContainer: {
    padding: 0,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    flex: 1,
  },
  dayText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  periodRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  timeCell: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  courseCell: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  courseCellContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  courseIdText: {
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
    color: '#333',
  },
  courseText: {
    fontSize: 11,
    textAlign: 'center',
    color: '#333',
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
