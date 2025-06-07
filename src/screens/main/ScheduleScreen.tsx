import React, { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Text, useTheme, Card, ActivityIndicator, Button, FAB, Snackbar, Modal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Course } from '../../types';
import { useSchedule } from '../../context/ScheduleContext';

type ScheduleScreenProps = {
  navigation: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const ScheduleScreen = ({ navigation, toggleTheme, isDarkMode }: ScheduleScreenProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
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
  const periodTimes: { [key: number]: string } = {
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
    //引数 day (0-indexed) を 1-indexed に変換して比較
    const targetDayOfWeek = day + 1; 
    const foundCourse = userCourses.find(course => 
      course.dayOfWeek === targetDayOfWeek && course.period === period
    );
    return foundCourse;
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

  const handleCellPress = (course: Course | undefined) => {
    if (course) {
      setSelectedCourse(course);
      setModalVisible(true);
    }
  };

  const renderTimeTable = () => {
    const columnWidth = screenWidth * 0.20;
    return (
      <View style={styles.tableContainer}>
        {/* Header row with days */}
        <View style={styles.headerRow}>
          {days.map((day, index) => (
            <View 
              key={`day-header-${index}`} 
              style={[styles.dayCell, { width: columnWidth }]}
            >
              <Text style={styles.dayText}>{day}</Text>
            </View>
          ))}
        </View>
        
        {/* Period rows with start times */}
        {periods.map((period) => (
          <React.Fragment key={`period-fragment-${period}`}>
            {/* Start Time Row */}
            <View style={styles.startTimeRow}>
              {days.map((_, dayIndex) => (
                <View key={`time-slot-${period}-${dayIndex}`} style={[styles.startTimeSlot, { width: columnWidth }]}>
                  {dayIndex === 2 && ( // Wednesday is at index 2
                    <Text style={styles.startTimeText}>{periodTimes[period]}</Text>
                  )}
                </View>
              ))}
            </View>

            {/* Course Cells Row */}
            <View key={`period-cells-${period}`} style={styles.periodRow}>
              {days.map((dayString, dayIndex) => {
                const course = getCourseByDayAndPeriod(dayIndex, period);
                return (
                  <TouchableOpacity 
                    key={`cell-${dayIndex}-${period}`}
                    style={[styles.courseCellTouchable, { width: columnWidth }]}
                    onPress={() => {
                      if (course) handleCellPress(course);
                    }}
                    activeOpacity={course ? 0.7 : 1}
                  >
                    {course ? (
                      <View style={styles.courseCellCard}>
                        {course.room && (
                          <View style={[styles.roomContainer, { backgroundColor: course.color || '#A0A0A0' }]}>
                            <Text style={styles.roomText} numberOfLines={1}>{course.room}</Text>
                          </View>
                        )}
                        <View style={styles.courseNameContainer}>
                          <Text style={styles.courseNameText} numberOfLines={3}>
                            {course.name}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.emptyCourseCellCard} /> // Empty cell placeholder
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </React.Fragment>
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
            <ActivityIndicator size="large" color="#f06292" />
            <Text style={{ marginTop: 16 }}>
              時間割を読み込み中...
            </Text>
          </View>
        ) : (
          <>
            {renderTimeTable()} 
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

      {/* Course Detail Modal */}
      {selectedCourse && (
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Card>
            <Card.Title 
              title={selectedCourse.name} 
              subtitle={selectedCourse.dayOfWeek && selectedCourse.period ? `${days[selectedCourse.dayOfWeek -1]}${selectedCourse.period}限` : ''}
              titleStyle={styles.modalTitle}
              subtitleStyle={styles.modalSubtitle}
              right={(props) => <Ionicons {...props} name="close-circle" size={24} onPress={() => setModalVisible(false)} style={{marginRight: 10}} />}
            />
            <Card.Content>
              {selectedCourse.title && <Text style={styles.modalText}>講義題目: {selectedCourse.title}</Text>}
              {selectedCourse.room && <Text style={styles.modalText}>教室: {selectedCourse.room}</Text>}
              {selectedCourse.instructor && <Text style={styles.modalText}>担当教員: {selectedCourse.instructor}</Text>}
              
              {selectedCourse.syllabusUrl && (
                <Button 
                  mode="contained" 
                  onPress={() => Linking.openURL(selectedCourse.syllabusUrl!)} 
                  style={styles.syllabusButton}
                  labelStyle={styles.buttonLabel}
                  icon="open-in-new"
                >
                  シラバスを見る
                </Button>
              )}
              
              <Button 
                mode="text" 
                onPress={() => {
                  handleRemoveCourse(selectedCourse.id);
                  setModalVisible(false);
                }}
                textColor={theme.colors.error}
                style={styles.deleteButton}
                labelStyle={styles.buttonLabel}
              >
                この授業を削除
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background for the entire screen
  },
  scrollViewContent: {
    flexGrow: 1, // Allow vertical expansion
    padding: 8, // Overall padding for the schedule content
    paddingBottom: 80, // Increased padding for FAB and bottom spacing
  },
  tableCard: { // This style will likely be unused after Card component is removed from JSX
    // Keeping it empty or minimal as Card will be removed
  },
  tableContainer: {
    // padding: 0, // Padding is now handled by scrollViewContent
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA', // Lighter border
    // backgroundColor removed, day headers on scrollView background
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    // flex: 1, // width is set dynamically
  },
  dayText: {
    fontSize: 12,
    color: '#B0B0B0', // Slightly adjusted color for day headers
  },
  periodRow: {
    flexDirection: 'row',
    // borderBottomWidth removed, gaps will provide separation
  },
  timeCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8, // Keep vertical padding for row height consistency
    paddingHorizontal: 4, // Reduce horizontal padding
    // borderRightWidth: 1, // Removed vertical border
    // borderRightColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  timeText: { // This style is now unused as time column is removed
    // fontSize: 11,
    // color: '#C0C0C0',
  },
  startTimeRow: {
    flexDirection: 'row',
    paddingVertical: 6, // Space above/below start times
  },
  startTimeSlot: {
    height: 24, // Adjusted height for start time slot
    justifyContent: 'center',
    alignItems: 'center',
  },
  startTimeText: {
    fontSize: 10,
    color: '#C0C0C0', // Subtle color for start times
  },
  emptyCourseCellCard: { // Style for empty cells to maintain layout
    flex: 1,
    backgroundColor: 'transparent', // Ensure gaps are transparent
    borderRadius: 8,
  },
  courseCellTouchable: {
    height: 100, // Standard height for the touchable area
    padding: 4, // This padding creates the visual gap around courseCellCard
    // width is set dynamically in renderTimeTable
  },
  courseCellCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 2, // Subtle shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, // Softer shadow
    shadowRadius: 1.5,
    overflow: 'hidden',
  },
  roomContainer: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  courseNameContainer: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    flex: 1, 
    justifyContent: 'flex-start', // Align course name to the top after room
    alignItems: 'center',
  },
  roomText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  courseNameText: {
    fontSize: 10,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 14, // Adjust line height for better readability in small cells
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
    backgroundColor: '#f06292',
  },
  snackbar: {
    backgroundColor: '#333',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20, // Add some margin around the modal
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
  },
  syllabusButton: {
    marginTop: 16,
    backgroundColor: '#1976D2', // Blue color for syllabus button
  },
  deleteButton: {
    marginTop: 8,
  },
  buttonLabel: {
    fontSize: 14, // Ensure button text is readable
  }
});

export default ScheduleScreen;
