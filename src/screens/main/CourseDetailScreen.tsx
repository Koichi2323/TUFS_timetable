import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Divider, Button, useTheme, ActivityIndicator, List, FAB } from 'react-native-paper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { format } from 'date-fns';
import { ScheduleContext, ScheduleContextType } from '../../context/ScheduleContext';
import { ja } from 'date-fns/locale';

type CourseDetailScreenProps = {
  navigation: any;
  route: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const CourseDetailScreen = ({ navigation, route, toggleTheme, isDarkMode }: CourseDetailScreenProps) => {
  const { removeCourse } = useContext(ScheduleContext) as ScheduleContextType;
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
    if (!courseId) {
      Alert.alert('エラー', '授業IDが見つかりません。');
      return;
    }

    Alert.alert(
      '授業を削除',
      `「${course?.name || 'この授業'}」を時間割から削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            console.log(`[CourseDetailScreen] Delete confirmed for courseId: ${courseId}. Attempting to call context.removeCourse.`);
            if (!removeCourse) {
              console.error("[CourseDetailScreen] removeCourse from context is undefined!");
              Alert.alert('エラー', '削除機能の準備ができていません。');
              return;
            }
            try {
              await removeCourse(courseId);
              navigation.goBack();
            } catch (error) {
              console.error('[CourseDetailScreen] Error calling removeCourse from context:', error);
              Alert.alert('エラー', '授業の削除に失敗しました。');
            }
          }
        }
      ]
    );
  };

  const openSyllabus = () => {
    if (course?.syllabusUrl) {
      Linking.openURL(course.syllabusUrl)
        .catch(err => {
          console.error('Error opening syllabus URL:', err);
          Alert.alert('エラー', 'シラバスを開けませんでした');
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f06292" />
        <Text style={{ marginTop: 16 }}>授業情報を読み込み中...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#f06292" />
        <Text style={styles.errorText}>授業情報が見つかりませんでした</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.courseCard} elevation={2}>
          <Card.Content>
            <View style={styles.courseHeader}>
              <View style={styles.courseHeaderText}>
                <Text style={styles.courseLabel}>講義科目</Text>
                <Title style={styles.courseName}>{course.name}</Title>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.courseHeader}>
              <View style={styles.courseHeaderText}>
                <Text style={styles.courseLabel}>講義題目</Text>
                <Text style={styles.courseDetails}>{course.details || course.name}</Text>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>教室</Text>
              <Text style={styles.infoValue}>{course.room || '教室情報なし'}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>担当教員</Text>
              <Text style={styles.infoValue}>{course.professor || '教員情報なし'}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>曜日・時限</Text>
              <Text style={styles.infoValue}>
                {getDayName(course.dayOfWeek)}曜{course.period}限 ({getTimeSlot(course.period)})
              </Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <Button 
              mode="contained" 
              onPress={openSyllabus}
              style={styles.syllabusButton}
              icon={({size, color}) => (
                <MaterialIcons name="school" size={size} color={color} />
              )}
            >
              教務システムで確認
            </Button>
            
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDeleteCourse}
              >
                <Text style={styles.deleteButtonText}>この授業を削除</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={[styles.courseCard, styles.attendanceCard]} elevation={2}>
          <Card.Content>
            <Text style={styles.sectionTitle}>出席状況</Text>
            
            <View style={styles.attendanceContainer}>
              <View style={styles.attendanceChart}>
                <View 
                  style={[styles.attendanceBar, { 
                    width: `${calculateAttendanceRate()}%`,
                    backgroundColor: calculateAttendanceRate() > 80 ? '#4CAF50' : calculateAttendanceRate() > 60 ? '#FFC107' : '#F44336'
                  }]} 
                />
              </View>
              <Text style={styles.attendanceRate}>{calculateAttendanceRate()}%</Text>
            </View>
            
            <View style={styles.attendanceStats}>
              <View style={styles.attendanceStat}>
                <Text style={styles.statNumber}>{attendanceRecords.filter(r => r.status === 'present').length}</Text>
                <Text style={styles.statLabel}>出席</Text>
              </View>
              <View style={styles.attendanceStat}>
                <Text style={styles.statNumber}>{attendanceRecords.filter(r => r.status === 'late').length}</Text>
                <Text style={styles.statLabel}>遅刻</Text>
              </View>
              <View style={styles.attendanceStat}>
                <Text style={styles.statNumber}>{attendanceRecords.filter(r => r.status === 'absent').length}</Text>
                <Text style={styles.statLabel}>欠席</Text>
              </View>
            </View>
            
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('Attendance', { screen: 'CourseAttendance', params: { courseId } })}
              style={styles.sectionButton}
            >
              出席を記録する
            </Button>
          </Card.Content>
        </Card>
        
        <Card style={[styles.courseCard, styles.assignmentsCard]} elevation={2}>
          <Card.Content>
            <Text style={styles.sectionTitle}>課題</Text>
            
            {assignments.length > 0 ? (
              <List.Section>
                {assignments.slice(0, 3).map(assignment => (
                  <List.Item
                    key={assignment.id}
                    title={assignment.title}
                    description={`期限: ${format(assignment.dueDate.toDate(), 'yyyy/MM/dd', { locale: ja })}`}
                    left={props => <List.Icon {...props} icon="clipboard-text-outline" />}
                    onPress={() => navigation.navigate('Assignments', { 
                      screen: 'AssignmentDetail', 
                      params: { assignmentId: assignment.id } 
                    })}
                  />
                ))}
                {assignments.length > 3 && (
                  <Button 
                    mode="text" 
                    onPress={() => navigation.navigate('Assignments', { screen: 'AssignmentList', params: { courseId } })}
                  >
                    すべての課題を表示 ({assignments.length})
                  </Button>
                )}
              </List.Section>
            ) : (
              <Paragraph style={styles.emptyText}>課題はありません</Paragraph>
            )}
          </Card.Content>
        </Card>
        
        <Card style={[styles.courseCard, styles.notesCard]} elevation={2}>
          <Card.Content>
            <Text style={styles.sectionTitle}>メモ</Text>
            {course.notes ? (
              <Paragraph style={styles.notesText}>{course.notes}</Paragraph>
            ) : (
              <Paragraph style={styles.emptyText}>メモはありません</Paragraph>
            )}
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('EditCourse', { courseId })}
              style={styles.editButton}
              icon="pencil"
            >
              編集
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
      
      <FAB
        style={styles.fab}
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
    backgroundColor: '#f5f5f5',
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
    borderRadius: 8,
  },
  attendanceCard: {
    backgroundColor: '#f9f9f9',
  },
  assignmentsCard: {
    backgroundColor: '#f9f9f9',
  },
  notesCard: {
    backgroundColor: '#f9f9f9',
  },
  courseHeader: {
    marginBottom: 8,
  },
  courseHeaderText: {
    flex: 1,
  },
  courseLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  courseDetails: {
    fontSize: 16,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  syllabusButton: {
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#4285F4',
    paddingVertical: 8,
  },
  actionButtonsContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  deleteButton: {
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: '#F44336',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  divider: {
    backgroundColor: '#e0e0e0',
  },
  sectionButton: {
    marginTop: 12,
  },
  editButton: {
    marginTop: 16,
  },
  emptyText: {
    fontStyle: 'italic',
    opacity: 0.7,
    marginBottom: 8,
  },
  notesText: {
    lineHeight: 20,
    marginBottom: 8,
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
    color: '#4285F4',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4285F4',
  },
});

export default CourseDetailScreen;
