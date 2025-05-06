import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Divider, Button, useTheme, ActivityIndicator, List, FAB } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type CourseDetailScreenProps = {
  navigation: any;
  route: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const CourseDetailScreen = ({ navigation, route, toggleTheme, isDarkMode }: CourseDetailScreenProps) => {
  const { courseId } = route.params;
  const [course, setCourse] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCourseId, setUserCourseId] = useState<string | null>(null);
  
  const theme = useTheme();

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    if (!auth.currentUser) return;
    
    try {
      setLoading(true);
      
      // Get course details
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (courseDoc.exists()) {
        setCourse({ id: courseDoc.id, ...courseDoc.data() });
      }
      
      // Get user-course relationship
      const userCoursesRef = collection(db, 'userCourses');
      const userCoursesQuery = query(
        userCoursesRef,
        where('userId', '==', auth.currentUser.uid),
        where('courseId', '==', courseId)
      );
      
      const userCoursesSnapshot = await getDocs(userCoursesQuery);
      if (!userCoursesSnapshot.empty) {
        setUserCourseId(userCoursesSnapshot.docs[0].id);
      }
      
      // Get assignments for this course
      const assignmentsRef = collection(db, 'assignments');
      const assignmentsQuery = query(
        assignmentsRef,
        where('courseId', '==', courseId),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAssignments(assignmentsData);
      
      // Get attendance records for this course
      const attendanceRef = collection(db, 'attendance');
      const attendanceQuery = query(
        attendanceRef,
        where('courseId', '==', courseId),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceData = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAttendanceRecords(attendanceData);
    } catch (error) {
      console.error('Error fetching course data:', error);
      Alert.alert('エラー', '授業データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!userCourseId || !auth.currentUser) return;
    
    Alert.alert(
      '授業を削除',
      'この授業を時間割から削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the user-course relationship
              await deleteDoc(doc(db, 'userCourses', userCourseId));
              
              // Navigate back
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert('エラー', '授業の削除に失敗しました');
            }
          }
        }
      ]
    );
  };

  const openSyllabus = () => {
    if (course?.syllabus) {
      Linking.openURL(course.syllabus).catch(err => {
        Alert.alert('エラー', 'URLを開けませんでした');
      });
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['月', '火', '水', '木', '金', '土', '日'];
    return days[dayOfWeek - 1];
  };

  const getTimeSlot = (period: number) => {
    const timeSlots = {
      1: '8:30 - 10:10',
      2: '10:25 - 12:05',
      3: '13:00 - 14:40',
      4: '14:55 - 16:35',
      5: '16:50 - 18:30',
      6: '18:45 - 20:25',
      7: '20:40 - 22:20'
    };
    
    return timeSlots[period as keyof typeof timeSlots];
  };

  const calculateAttendanceRate = () => {
    if (attendanceRecords.length === 0) return 0;
    
    const attended = attendanceRecords.filter(record => record.status === 'present').length;
    return Math.round((attended / attendanceRecords.length) * 100);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.text }}>
          授業データを読み込み中...
        </Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.text }]}>
          授業が見つかりませんでした
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
        >
          戻る
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.primary }]}>授業詳細</Text>
        <TouchableOpacity onPress={toggleTheme}>
          <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.courseCard, { backgroundColor: course.color || theme.colors.surface }]}>
          <Card.Content>
            <Title style={styles.courseName}>{course.name}</Title>
            <View style={styles.courseInfo}>
              <Ionicons name="person-outline" size={16} color={theme.colors.text} />
              <Paragraph style={styles.courseInfoText}>{course.professor}</Paragraph>
            </View>
            <View style={styles.courseInfo}>
              <Ionicons name="location-outline" size={16} color={theme.colors.text} />
              <Paragraph style={styles.courseInfoText}>{course.room}</Paragraph>
            </View>
            <View style={styles.courseInfo}>
              <Ionicons name="time-outline" size={16} color={theme.colors.text} />
              <Paragraph style={styles.courseInfoText}>
                {getDayName(course.dayOfWeek)}曜 {course.period}限 ({getTimeSlot(course.period)})
              </Paragraph>
            </View>
            <View style={styles.courseInfo}>
              <Ionicons name="school-outline" size={16} color={theme.colors.text} />
              <Paragraph style={styles.courseInfoText}>{course.credits}単位</Paragraph>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.detailCard}>
          <Card.Content>
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>出席状況</Text>
              <View style={styles.attendanceContainer}>
                <View style={styles.attendanceChart}>
                  <View 
                    style={[
                      styles.attendanceBar, 
                      { 
                        width: `${calculateAttendanceRate()}%`,
                        backgroundColor: theme.colors.primary
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.attendanceRate, { color: theme.colors.text }]}>
                  {calculateAttendanceRate()}%
                </Text>
              </View>
              <View style={styles.attendanceStats}>
                <View style={styles.attendanceStat}>
                  <Text style={styles.statNumber}>
                    {attendanceRecords.filter(r => r.status === 'present').length}
                  </Text>
                  <Text style={styles.statLabel}>出席</Text>
                </View>
                <View style={styles.attendanceStat}>
                  <Text style={styles.statNumber}>
                    {attendanceRecords.filter(r => r.status === 'late').length}
                  </Text>
                  <Text style={styles.statLabel}>遅刻</Text>
                </View>
                <View style={styles.attendanceStat}>
                  <Text style={styles.statNumber}>
                    {attendanceRecords.filter(r => r.status === 'absent').length}
                  </Text>
                  <Text style={styles.statLabel}>欠席</Text>
                </View>
              </View>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Attendance', { courseId })}
                style={styles.sectionButton}
              >
                出席を管理
              </Button>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>課題</Text>
              {assignments.length > 0 ? (
                assignments.map(assignment => {
                  const dueDate = assignment.dueDate.toDate ? 
                    assignment.dueDate.toDate() : 
                    new Date(assignment.dueDate);
                  
                  return (
                    <List.Item
                      key={assignment.id}
                      title={assignment.title}
                      description={`提出期限: ${format(dueDate, 'yyyy年M月d日 HH:mm', { locale: ja })}`}
                      left={props => (
                        <List.Icon 
                          {...props} 
                          icon={assignment.completed ? "checkbox-marked-circle" : "clock-outline"} 
                          color={assignment.completed ? "#4CAF50" : "#FFC107"}
                        />
                      )}
                      onPress={() => navigation.navigate('Assignments', { assignmentId: assignment.id })}
                    />
                  );
                })
              ) : (
                <Paragraph style={styles.emptyText}>課題はありません</Paragraph>
              )}
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Assignments', { courseId })}
                style={styles.sectionButton}
              >
                課題を管理
              </Button>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>シラバス</Text>
              {course.syllabus ? (
                <Button
                  mode="outlined"
                  onPress={openSyllabus}
                  style={styles.sectionButton}
                  icon="open-in-new"
                >
                  シラバスを開く
                </Button>
              ) : (
                <Paragraph style={styles.emptyText}>シラバスURLは登録されていません</Paragraph>
              )}
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>メモ</Text>
              {course.notes ? (
                <Paragraph style={styles.notesText}>{course.notes}</Paragraph>
              ) : (
                <Paragraph style={styles.emptyText}>メモはありません</Paragraph>
              )}
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('EditCourse', { courseId })}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                icon="pencil"
              >
                編集
              </Button>
              <Button
                mode="outlined"
                onPress={handleDeleteCourse}
                style={[styles.actionButton, { borderColor: theme.colors.error }]}
                textColor={theme.colors.error}
                icon="delete"
              >
                削除
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('Assignments', { 
          screen: 'AddAssignment',
          params: { courseId, courseName: course.name }
        })}
        label="課題を追加"
        small
      />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  courseCard: {
    marginBottom: 16,
  },
  courseName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseInfoText: {
    marginLeft: 8,
    fontSize: 16,
  },
  detailCard: {
    marginBottom: 16,
  },
  detailSection: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  sectionButton: {
    marginTop: 8,
  },
  emptyText: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  notesText: {
    lineHeight: 20,
  },
  attendanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  attendanceChart: {
    flex: 1,
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  attendanceBar: {
    height: '100%',
  },
  attendanceRate: {
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  attendanceStat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default CourseDetailScreen;
