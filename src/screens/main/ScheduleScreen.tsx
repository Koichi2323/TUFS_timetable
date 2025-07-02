import React, { useState, useEffect, useMemo } from 'react';
import { Linking, Alert } from 'react-native';
import { SafeAreaView, View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, useTheme, Card, ActivityIndicator, Button, FAB, Snackbar, Modal, Portal, Dialog, Paragraph, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSchedule } from '../../context/ScheduleContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Course } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ScheduleRouteParams = {
  Schedule: {
    onDemandCourse?: Course;
  };
};

type ScheduleScreenRouteProp = RouteProp<ScheduleRouteParams, 'Schedule'>;

type ScheduleScreenProps = {
  navigation: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const ScheduleScreen = ({ navigation }: { navigation: any }) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [courseIdToDelete, setCourseIdToDelete] = useState<string | null>(null);

  const [updateDialogVisible, setUpdateDialogVisible] = useState(false);

  const [daySelectionModalVisible, setDaySelectionModalVisible] = useState(false);
  const [onDemandCourseToAdd, setOnDemandCourseToAdd] = useState<Course | null>(null);

  // States for editing course details in modal
  const [editingCourseName, setEditingCourseName] = useState('');
  const [editingRoomName, setEditingRoomName] = useState('');
  const [editingMemo, setEditingMemo] = useState('');
  const [editingColor, setEditingColor] = useState<string | undefined>(undefined);
  
  const route = useRoute<ScheduleScreenRouteProp>();
  const screenWidth = Dimensions.get('window').width;
  const insets = useSafeAreaInsets();
  
  // スケジュールコンテキストを使用
  const { userCourses, addCourse, removeCourse, updateCourse, isCourseAdded, getConflictCourse, hasTimeConflict } = useSchedule();

  // Days of the week in Japanese
  const days = ['月', '火', '水', '木', '金'];
  
  // Predefined colors for courses (from ColorPicker.tsx)
  const predefinedCourseColors = ['#000000', '#008080', '#008000', '#483d8b', '#696969', '#a0522d', '#b22222', '#dc143c', '#4169e1', '#6a5acd', '#6495ed'];

  // 6限の授業が登録されているか確認
  const hasSixthPeriod = useMemo(() => 
    userCourses.some((c) => c.period === 6),
    [userCourses]
  );
  // 7限の授業が登録されているか確認
  const hasSeventhPeriod = useMemo(() => 
    userCourses.some((c) => c.period === 7),
    [userCourses]
  );

  // 6限の有無に応じて表示する時限数を動的に変更
  const periods = hasSixthPeriod ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
  const periodTimes: { [key: number]: string } = hasSixthPeriod 
    ? { 1: '08:30', 2: '10:10', 3: '12:40', 4: '14:20', 5: '16:00', 6: '17:30' } 
    : { 1: '08:30', 2: '10:10', 3: '12:40', 4: '14:20', 5: '16:00' };

  useEffect(() => {
    if (route.params?.onDemandCourse) {
      const course = route.params.onDemandCourse;
      if (isCourseAdded(course.id)) {
        setSnackbarMessage('この授業はすでに時間割に追加されています');
        setSnackbarVisible(true);
      } else {
        setOnDemandCourseToAdd(course);
        setDaySelectionModalVisible(true);
      }
      navigation.setParams({ onDemandCourse: undefined });
    }
  }, [route.params?.onDemandCourse]);

  useEffect(() => {
    // ユーザーの授業が読み込まれたらローディングを終了
    setLoading(false);
  }, [userCourses]);

  const UPDATE_NOTICE_KEY = '@updateNotice_v20250702'; // Unique key for this update

  useEffect(() => {
    const checkUpdateNotice = async () => {
      try {
        const hasSeenNotice = await AsyncStorage.getItem(UPDATE_NOTICE_KEY);
        if (!hasSeenNotice) {
          setUpdateDialogVisible(true);
        }
      } catch (e) {
        console.error("Failed to read update notice status from AsyncStorage", e);
      }
    };
    checkUpdateNotice();
  }, []);

  const handleDismissUpdateDialog = async () => {
    try {
      await AsyncStorage.setItem(UPDATE_NOTICE_KEY, 'true');
      setUpdateDialogVisible(false);
    } catch (e) {
      console.error("Failed to save update notice status to AsyncStorage", e);
      setUpdateDialogVisible(false); // Still close the dialog
    }
  };

  const handleDaySelection = async (dayIndex: number) => {
    if (!onDemandCourseToAdd) return;
    const dayOfWeek = dayIndex + 1;
    // オンデマンド授業は6限に固定
    const newCourse = { ...onDemandCourseToAdd, dayOfWeek, period: 6 };
    
    const result = await addCourse(newCourse);
    if (result.success) {
      setSnackbarMessage(`${newCourse.name}を${days[dayIndex]}曜6限に追加しました`);
    } else {
      setSnackbarMessage('授業の追加に失敗しました');
    }
    setSnackbarVisible(true);
    setDaySelectionModalVisible(false);
    setOnDemandCourseToAdd(null);
  };

  const getCoursesByDayAndPeriod = (day: number, period: number): Course[] => {
    const targetDayOfWeek = day + 1;
    return userCourses.filter(course => 
      course.dayOfWeek === targetDayOfWeek && course.period === period
    );
  };
  
  // 授業削除ダイアログ表示の準備
  const handleRemoveCourse = (courseId: string) => {
    console.log('[ScheduleScreen] handleRemoveCourse function CALLED with courseId:', courseId);
    setCourseIdToDelete(courseId);
    setDeleteDialogVisible(true);
  };

  // 実際に授業を削除する処理 (ダイアログの「削除」ボタンから呼び出される)
  const confirmRemoveCourse = async () => {
    if (!courseIdToDelete) return;
    console.log('[ScheduleScreen] confirmRemoveCourse called for courseId:', courseIdToDelete);
    try {
      await removeCourse(courseIdToDelete); // Context の removeCourse を呼び出す
      setSnackbarMessage('授業を時間割から削除しました');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('[ScheduleScreen] Failed to remove course via Dialog:', error);
      setSnackbarMessage('授業の削除に失敗しました。');
      setSnackbarVisible(true);
    }
    setModalVisible(false); // 詳細モーダルを閉じる
    setSelectedCourse(null);  // 選択中の授業をクリア
    setDeleteDialogVisible(false); // 削除確認ダイアログを閉じる
    setCourseIdToDelete(null);     // 削除対象IDをクリア
  };

  const handleCellPress = (course: Course) => {
    if (course) {
      setSelectedCourse(course);
      // Initialize editing states
      setEditingCourseName(course.name || '');
      setEditingRoomName(course.room || '');
      setEditingMemo(course.memo || '');
      setEditingColor(course.color);
      setModalVisible(true);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedCourse) return;

    const updatedCourseData: Partial<Course> = {
      // id: selectedCourse.id, // IDはキーとして使い、データとしては含めないことが多い
      name: editingCourseName,
      room: editingRoomName,
      memo: editingMemo,
      color: editingColor,
      // 元のデータを保持しつつ、変更点だけをマージする場合は以下のようにする
      // ...selectedCourse, // スプレッド構文で元のデータを展開
      // name: editingCourseName,
      // memo: editingMemo,
      // color: editingColor,
      // day: selectedCourse.day, // 曜日や時限は変更しない想定なら元のまま
      // period: selectedCourse.period,
      // title: selectedCourse.title, // 他の不変な情報も同様
      // instructor: selectedCourse.instructor,
      // syllabusUrl: selectedCourse.syllabusUrl,
    };

    try {
      await updateCourse(selectedCourse.id, updatedCourseData); // ScheduleContextの関数を呼び出し
      console.log('Successfully saved changes for course ID:', selectedCourse.id, 'Data:', updatedCourseData);
      // ここで実際に ScheduleContext の updateCourse を呼び出す
      // 例: await updateCourse(selectedCourse.id, updatedCourseData);
      // その後、モーダルを閉じる
      setModalVisible(false);
      setSnackbarMessage('授業情報が更新されました。'); // Snackbarでフィードバック
      setSnackbarVisible(true);
    } catch (error) {
      console.error("Failed to update course:", error);
      setSnackbarMessage('授業情報の更新に失敗しました。');
      setSnackbarVisible(true);
    }
  };

  const renderTimeTable = () => {
    const scrollViewHorizontalPadding = 16; // scrollViewContentのpadding: 8 (左) + 8 (右) = 16
    const availableWidthForColumns = screenWidth - insets.left - insets.right - scrollViewHorizontalPadding;
    const columnWidth = availableWidthForColumns / 5;
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
          {periods.map((period, periodIndex) => (
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
              <View key={periodIndex} style={styles.periodContainer}>
                <View style={styles.periodRow}>
                  {days.map((dayString, dayIndex) => {
                    const courses = getCoursesByDayAndPeriod(dayIndex, period);
                    return (
                      <View key={`cell-${dayIndex}-${period}`} style={[styles.courseCellTouchable, { width: columnWidth }]}>
                        {courses.length > 0 ? (
                          <View style={styles.stackedCourseContainer}>
                            {courses.map((course, index) => (
                              <TouchableOpacity
                                key={course.id}
                                style={[
                                  styles.courseCellCard,
                                  courses.length > 1 && styles.stackedCourseCard
                                ]}
                                onPress={() => handleCellPress(course)}
                                onLongPress={() => handleRemoveCourse(course.id)}
                                activeOpacity={0.7}
                              >
                                {course.room && (
                                  <View style={[styles.roomContainer, { backgroundColor: course.color || '#A0A0A0' }]}>
                                    <Text style={[styles.roomText, courses.length > 1 && styles.stackedRoomText]} numberOfLines={1}>{course.room}</Text>
                                  </View>
                                )}
                                <View style={styles.courseNameContainer}>
                                  <Text style={[styles.courseNameText, courses.length > 1 && styles.stackedCourseNameText]} numberOfLines={courses.length > 1 ? 2 : 3}>
                                    {course.name}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ) : (
                          <View style={styles.emptyCourseCellCard} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </React.Fragment>
          ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, styles.safeArea, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.scrollViewContent}>
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
      </View>
      <Portal>
        <Modal visible={daySelectionModalVisible} onDismiss={() => setDaySelectionModalVisible(false)} contentContainerStyle={styles.daySelectionModalContainer}>
          <Card style={styles.daySelectionCard}>
            <Card.Title 
              title="曜日を選択" 
              titleStyle={styles.daySelectionTitle}
            />
            <Card.Content style={styles.daySelectionContent}>
              {days.map((day, index) => (
                <Button 
                  key={day} 
                  mode="outlined"
                  onPress={() => handleDaySelection(index)}
                  style={[styles.daySelectionButton, { borderColor: theme.colors.primary }]}
                  labelStyle={[styles.daySelectionButtonText, { color: theme.colors.primary }]}
                >
                  {day}曜日
                </Button>
              ))}
            </Card.Content>
            <Card.Actions style={styles.daySelectionActions}>
                <Button onPress={() => setDaySelectionModalVisible(false)}>キャンセル</Button>
            </Card.Actions>
          </Card>
        </Modal>

        <Dialog 
          visible={deleteDialogVisible} 
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>授業を削除</Dialog.Title>
          <Dialog.Content>
            <Paragraph>この授業を時間割から削除しますか？</Paragraph>
            {/* オプションで削除対象の授業名などを表示しても良い */}
            {/* selectedCourse && courseIdToDelete === selectedCourse.id && <Paragraph>授業名: {selectedCourse.name}</Paragraph> */}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>キャンセル</Button>
            <Button onPress={confirmRemoveCourse} color={theme.colors.error}>削除</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>

      {/* Update Notice Dialog */}
    <Portal>
      <Dialog visible={updateDialogVisible} onDismiss={handleDismissUpdateDialog}>
        <Dialog.Title>🔔 機能アップデート 🔔</Dialog.Title>
        <Dialog.Content>
          <Paragraph>・オンデマンド授業が追加可能に！</Paragraph>
          <Paragraph>・授業の色をより見やすく改善！</Paragraph>
          <Paragraph style={{ marginBottom: 16 }}>・学部で授業検索ができるように！</Paragraph>
          <Paragraph style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>※反映されていない場合は、アプリのタブを一度消して再度開いてください。</Paragraph>
          <Paragraph>💡 機能のアイデアやお問い合わせは、</Paragraph>
          <Paragraph>「設定」＞「お問い合わせ」からどうぞ！</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismissUpdateDialog}>閉じる</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>

    {/* Course Detail Modal */}
      {selectedCourse && (
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContent} // Lintエラーを修正
        >
          <Card>
            <Card.Title 
              title={selectedCourse.name} 
              titleStyle={styles.modalTitle}
              right={(props) => <Ionicons {...props} name="close-circle" size={24} onPress={() => setModalVisible(false)} style={{marginRight: 10}} />}
            />
            <Card.Content>
              <TextInput
                label="授業名"
                value={editingCourseName}
                onChangeText={setEditingCourseName}
                mode="outlined"
                style={styles.textInput}
              />
              <TextInput
                label="教室名"
                value={editingRoomName}
                onChangeText={setEditingRoomName}
                mode="outlined"
                style={styles.textInput}
              />
              <TextInput
                label="メモ"
                value={editingMemo}
                onChangeText={setEditingMemo}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.textInput}
              />

              {/* Color Picker */}
              <View style={styles.colorPickerContainer}>
                <Text style={styles.colorPickerLabel}>授業の色:</Text>
                <View style={styles.colorsRow}>
                  {predefinedCourseColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        editingColor === color && styles.selectedColorOption,
                      ]}
                      onPress={() => setEditingColor(color)}
                    >
                      {editingColor === color && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Save Changes Button */}
              <Button
                mode="contained"
                onPress={handleSaveChanges}
                style={styles.saveButton}
              >
                変更を保存
              </Button>

              {selectedCourse && selectedCourse.syllabusUrl && ( // syllabusUrl が存在する場合のみ表示
                <Button 
                  mode="contained" 
                  onPress={() => {
                    if (selectedCourse && selectedCourse.syllabusUrl) {
                      Linking.openURL(selectedCourse.syllabusUrl);
                    }
                    setModalVisible(false); // モーダルは閉じる
                  }} 
                  style={styles.syllabusButton}
                  labelStyle={styles.buttonLabel}
                  icon="open-in-new" // 外部リンクを開くので "open-in-new" が適切
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
      
      <Dialog 
        visible={deleteDialogVisible} 
        onDismiss={() => setDeleteDialogVisible(false)}
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(255, 0, 0, 0.7)', // 半透明の赤
          zIndex: 9999, // 最前面
          justifyContent: 'center', // 内容を中央に
          alignItems: 'center'      // 内容を中央に
        }}
      >
        <Dialog.Content style={{ backgroundColor: 'white', padding: 20, borderRadius: 8 }}>
          <Paragraph>この授業を時間割から削除しますか？</Paragraph>
          <Button mode="contained" onPress={confirmRemoveCourse}>削除</Button>
          <Button mode="text" onPress={() => setDeleteDialogVisible(false)}>キャンセル</Button>
        </Dialog.Content>
      </Dialog>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background for the entire screen
  },
  scrollViewContent: {
    flex: 1, // Allow vertical expansion
    padding: 8, // Overall padding for the schedule content
    paddingBottom: 16, // Reduced padding for bottom spacing
  },
  tableCard: { // This style will likely be unused after Card component is removed from JSX
    // Keeping it empty or minimal as Card will be removed
  },
  tableContainer: {
    flex: 1,
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
    paddingVertical: 8, // Reduced padding for day headers
    // flex: 1, // width is set dynamically
  },
  dayText: {
    fontSize: 12,
    color: '#B0B0B0', // Slightly adjusted color for day headers
  },
  periodContainer: {
    flex: 1,
  },
  periodRow: {
    flex: 1,
    flexDirection: 'row',
    // borderBottomWidth removed, gaps will provide separation
  },
  timeCell: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 0, // コマ間の縦マージンをなくす
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
    paddingVertical: 2, // Reduced space above/below start times
  },
  startTimeSlot: {
    height: 18, // Reduced height for start time slot
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
    padding: 0, // Remove padding to minimize gap between cells
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
    marginHorizontal: 2, // 隣接する授業セル間の左右マージン
  },
  roomContainer: {
    paddingVertical: 2, // Slightly increased for readability
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  courseNameContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2, // Slightly increased for readability
    flex: 1, 
    justifyContent: 'flex-start', // Align course name to the top after room
    alignItems: 'center',
  },
  roomText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11, // フォントサイズを縮小
    textAlign: 'center',
  },
  courseNameText: {
    fontSize: 10, // フォントサイズを縮小
    color: '#333333',
    textAlign: 'center',
    lineHeight: 13, // Slightly increased for readability
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
  },
  textInput: {
    marginBottom: 10,
  },
  colorPickerContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  colorPickerLabel: {
    fontSize: 16,
    marginBottom: 8,
    // color: theme.colors.onSurface, // テーマに合わせて
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: '#000000', // テーマに合わせて変更可
  },
  saveButton: {
    marginTop: 15,
    marginBottom: 10,
  },
  stackedCourseContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  stackedCourseCard: {
    flex: 1,
    minHeight: 40,
    marginBottom: 2,
  },
  stackedRoomText: {
    fontSize: 9,
  },
  stackedCourseNameText: {
    fontSize: 9,
    lineHeight: 11,
  },
  daySelectionModalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  daySelectionCard: {
    width: '85%',
    maxWidth: 350,
    borderRadius: 12,
  },
  daySelectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  daySelectionContent: {
    paddingTop: 16,
  },
  daySelectionButton: {
    marginVertical: 6,
    borderRadius: 8,
    paddingVertical: 4,
    borderWidth: 1.5,
  },
  daySelectionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  daySelectionActions: {
    justifyContent: 'flex-end',
    paddingRight: 8,
  },
});

export default ScheduleScreen;
