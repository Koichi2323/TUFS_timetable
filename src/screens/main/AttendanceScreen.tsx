import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Text, Card, Button, useTheme, Chip, ActivityIndicator, Menu, Divider, ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type AttendanceScreenProps = {
  navigation: any;
  toggleTheme: () => void;
  isDarkMode: boolean;
};

type Course = {
  id: string;
  name: string;
  professor: string;
  room: string;
  credits: number;
  dayOfWeek: number;
  period: number;
  color: string;
  attendanceRate: number;
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  lateClasses: number;
};

const AttendanceScreen = ({ navigation, toggleTheme, isDarkMode }: AttendanceScreenProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortOption, setSortOption] = useState<'name' | 'attendanceRate'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const theme = useTheme();
  
  useEffect(() => {
    fetchCourses();
  }, []);
  
  useEffect(() => {
    sortCourses();
  }, [sortOption, sortDirection]);
  
  const fetchCourses = async () => {
    if (!auth.currentUser) return;
    
    try {
      setLoading(true);
      
      const coursesQuery = query(
        collection(db, 'courses'),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const querySnapshot = await getDocs(coursesQuery);
      const coursesData: Course[] = [];
      
      for (const courseDoc of querySnapshot.docs) {
        const courseData = courseDoc.data();
        
        // Fetch attendance data for this course
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('userId', '==', auth.currentUser.uid),
          where('courseId', '==', courseDoc.id)
        );
        
        const attendanceSnapshot = await getDocs(attendanceQuery);
        
        let totalClasses = courseData.totalClasses || 0;
        let attendedClasses = 0;
        let absentClasses = 0;
        let lateClasses = 0;
        
        attendanceSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'attended') attendedClasses++;
          else if (data.status === 'absent') absentClasses++;
          else if (data.status === 'late') lateClasses++;
        });
        
        const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
        
        coursesData.push({
          id: courseDoc.id,
          name: courseData.name,
          professor: courseData.professor,
          room: courseData.room,
          credits: courseData.credits,
          dayOfWeek: courseData.dayOfWeek,
          period: courseData.period,
          color: courseData.color,
          attendanceRate,
          totalClasses,
          attendedClasses,
          absentClasses,
          lateClasses,
        });
      }
      
      setCourses(coursesData);
      sortCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('エラー', '授業データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  const sortCourses = (coursesToSort = courses) => {
    const sorted = [...coursesToSort].sort((a, b) => {
      if (sortOption === 'name') {
        return sortDirection === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        return sortDirection === 'asc'
          ? a.attendanceRate - b.attendanceRate
          : b.attendanceRate - a.attendanceRate;
      }
    });
    
    setCourses(sorted);
  };
  
  const updateAttendance = async (courseId: string, status: 'attended' | 'absent' | 'late') => {
    if (!auth.currentUser) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const attendanceId = `${courseId}_${today.toISOString().split('T')[0]}`;
      
      await setDoc(doc(db, 'attendance', attendanceId), {
        userId: auth.currentUser.uid,
        courseId,
        date: today,
        status,
        createdAt: new Date(),
      });
      
      // Update course's total classes if needed
      const courseRef = doc(db, 'courses', courseId);
      const courseDoc = await getDoc(courseRef);
      
      if (courseDoc.exists()) {
        const courseData = courseDoc.data();
        const totalClasses = courseData.totalClasses || 0;
        
        await updateDoc(courseRef, {
          totalClasses: totalClasses + 1,
        });
      }
      
      // Refresh the data
      fetchCourses();
      
      Alert.alert('成功', '出席情報が更新されました');
    } catch (error) {
      console.error('Error updating attendance:', error);
      Alert.alert('エラー', '出席情報の更新に失敗しました');
    }
  };
  
  const getAttendanceStatusText = (attendanceRate: number) => {
    if (attendanceRate >= 90) return { text: '優良', color: '#4caf50' };
    if (attendanceRate >= 80) return { text: '良好', color: '#8bc34a' };
    if (attendanceRate >= 70) return { text: '注意', color: '#ffc107' };
    if (attendanceRate >= 60) return { text: '危険', color: '#ff9800' };
    return { text: '単位取得困難', color: '#f44336' };
  };
  
  const getDayOfWeekText = (dayOfWeek: number) => {
    const days = ['', '月', '火', '水', '木', '金', '土', '日'];
    return days[dayOfWeek] || '';
  };
  
  const renderCourseItem = ({ item }: { item: Course }) => {
    const attendanceStatus = getAttendanceStatusText(item.attendanceRate);
    
    return (
      <Card
        style={[
          styles.courseCard,
          {
            borderLeftWidth: 5,
            borderLeftColor: item.color || theme.colors.primary,
            backgroundColor: theme.colors.surface,
          },
        ]}
        onPress={() => navigation.navigate('CourseAttendance', { courseId: item.id })}
      >
        <Card.Content>
          <View style={styles.courseHeader}>
            <Text style={[styles.courseName, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Chip
              style={{ backgroundColor: attendanceStatus.color }}
              textStyle={{ color: 'white', fontSize: 12 }}
            >
              {attendanceStatus.text}
            </Chip>
          </View>
          
          <Text style={[styles.courseInfo, { color: theme.colors.onSurface, opacity: 0.7 }]}>
            {item.professor} | {item.room} | {getDayOfWeekText(item.dayOfWeek)}{item.period}限
          </Text>
          
          <View style={styles.attendanceContainer}>
            <Text style={[styles.attendanceLabel, { color: theme.colors.onSurface }]}>
              出席率: {item.attendanceRate.toFixed(1)}%
            </Text>
            <ProgressBar
              progress={item.attendanceRate / 100}
              color={attendanceStatus.color}
              style={styles.progressBar}
            />
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.onSurface }]}>
                {item.totalClasses}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurface, opacity: 0.7 }]}>
                総授業数
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#4caf50' }]}>
                {item.attendedClasses}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurface, opacity: 0.7 }]}>
                出席
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#ffc107' }]}>
                {item.lateClasses}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurface, opacity: 0.7 }]}>
                遅刻
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#f44336' }]}>
                {item.absentClasses}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurface, opacity: 0.7 }]}>
                欠席
              </Text>
            </View>
          </View>
        </Card.Content>
        
        <Card.Actions>
          <Button
            onPress={() => updateAttendance(item.id, 'attended')}
            style={[styles.attendanceButton, { backgroundColor: '#4caf50' }]}
            textColor="white"
          >
            出席
          </Button>
          <Button
            onPress={() => updateAttendance(item.id, 'late')}
            style={[styles.attendanceButton, { backgroundColor: '#ffc107' }]}
            textColor="white"
          >
            遅刻
          </Button>
          <Button
            onPress={() => updateAttendance(item.id, 'absent')}
            style={[styles.attendanceButton, { backgroundColor: '#f44336' }]}
            textColor="white"
          >
            欠席
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="school-outline"
        size={64}
        color={theme.colors.onBackground}
        style={{ opacity: 0.5 }}
      />
      <Text style={[styles.emptyText, { color: theme.colors.onBackground }]}>
        授業が登録されていません
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.onBackground, opacity: 0.7 }]}>
        「授業」タブから授業を追加してください
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>出席管理</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortMenuVisible(true)}
          >
            <Ionicons name="funnel" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={{ x: 0, y: 0 }}
            style={styles.menu}
          >
            <Menu.Item
              onPress={() => {
                setSortOption('name');
                setSortMenuVisible(false);
              }}
              title="授業名で並べ替え"
              leadingIcon="sort-alphabetical-ascending"
              trailingIcon={sortOption === 'name' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => {
                setSortOption('attendanceRate');
                setSortMenuVisible(false);
              }}
              title="出席率で並べ替え"
              leadingIcon="percent"
              trailingIcon={sortOption === 'attendanceRate' ? 'check' : undefined}
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                setSortMenuVisible(false);
              }}
              title={`並べ替え: ${sortDirection === 'asc' ? '昇順' : '降順'}`}
              leadingIcon={sortDirection === 'asc' ? 'sort-ascending' : 'sort-descending'}
            />
          </Menu>
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons
              name={isDarkMode ? 'sunny' : 'moon'}
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
            授業データを読み込み中...
          </Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          renderItem={renderCourseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
          refreshing={loading}
          onRefresh={fetchCourses}
        />
      )}
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    marginRight: 16,
  },
  menu: {
    width: 250,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  courseCard: {
    marginBottom: 16,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  courseInfo: {
    fontSize: 14,
    marginBottom: 12,
  },
  attendanceContainer: {
    marginBottom: 12,
  },
  attendanceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  attendanceButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default AttendanceScreen;
